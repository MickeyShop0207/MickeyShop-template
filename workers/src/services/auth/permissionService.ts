/**
 * RBAC 權限管理服務
 * 負責角色基礎權限控制系統的權限查詢、驗證和管理
 */

import { eq, and, sql, inArray } from 'drizzle-orm'
import { BaseService, ServiceContext, ServiceResponse } from '@/shared/services/baseService'
import {
  permissions,
  roles, 
  rolePermissions,
  userRoles,
  userPermissions,
  permissionChangeLogs,
  Permission,
  Role,
  UserRole,
  UserPermission,
  NewPermissionChangeLog
} from '@/core/database/schema'

// 用戶權限快照
export interface UserPermissionSnapshot {
  userId: string
  userType: 'admin' | 'member'
  roles: Role[]
  permissions: string[]
  directPermissions: UserPermission[]
  effectivePermissions: string[]
  lastUpdated: string
}

// 權限檢查結果
export interface PermissionCheckResult {
  hasPermission: boolean
  source: 'role' | 'direct' | 'denied'
  grantedBy?: string
  grantedAt?: string
  roleId?: string
}

// 權限驗證選項
export interface PermissionValidationOptions {
  requireAll?: boolean        // 是否需要所有權限 (默認 false)
  allowExpired?: boolean      // 是否允許過期權限 (默認 false)
  useCache?: boolean         // 是否使用快取 (默認 true)
  cacheTimeout?: number      // 快取超時時間 (默認 300秒)
}

/**
 * 權限管理服務類
 */
export class PermissionService extends BaseService {
  private cache: KVNamespace

  constructor(context: ServiceContext & { cache: KVNamespace }) {
    super(context)
    this.cache = context.cache
  }

  /**
   * 檢查用戶是否擁有指定權限
   */
  async checkUserPermission(
    userId: string, 
    permissionName: string | string[], 
    options: PermissionValidationOptions = {}
  ): Promise<ServiceResponse<PermissionCheckResult[]>> {
    try {
      const permissions = Array.isArray(permissionName) ? permissionName : [permissionName]
      const {
        requireAll = false,
        allowExpired = false,
        useCache = true,
        cacheTimeout = 300
      } = options

      // 嘗試從快取獲取用戶權限
      let userPermissions: UserPermissionSnapshot | null = null
      if (useCache) {
        userPermissions = await this.getCachedUserPermissions(userId)
      }

      // 如果快取沒有，從資料庫查詢
      if (!userPermissions) {
        const result = await this.loadUserPermissions(userId)
        if (!result.success || !result.data) {
          return this.error('無法載入用戶權限')
        }
        userPermissions = result.data

        // 快取權限數據
        if (useCache) {
          await this.cacheUserPermissions(userId, userPermissions, cacheTimeout)
        }
      }

      // 檢查每個權限
      const results: PermissionCheckResult[] = []
      for (const permission of permissions) {
        const checkResult = await this.checkSinglePermission(
          userPermissions,
          permission,
          allowExpired
        )
        results.push(checkResult)
      }

      // 根據 requireAll 選項判斷最終結果
      const hasAllPermissions = results.every(r => r.hasPermission)
      const hasAnyPermission = results.some(r => r.hasPermission)

      if (requireAll && !hasAllPermissions) {
        return this.error('用戶缺少必要權限', results.map(r => ({
          field: 'permission',
          message: `缺少權限: ${permissions[results.indexOf(r)]}`,
          code: 'MISSING_PERMISSION'
        })))
      }

      if (!requireAll && !hasAnyPermission) {
        return this.error('用戶沒有任何所需權限')
      }

      this.logAction('PERMISSION_CHECKED', `user:${userId}`, null, {
        permissions,
        results: results.map(r => r.hasPermission),
        requireAll
      })

      return this.success(results)

    } catch (error: any) {
      this.logger.error('Permission check failed', {
        error: error.message,
        userId,
        permissions: permissionName,
        requestId: this.context?.requestId
      })
      return this.error('權限檢查失敗')
    }
  }

  /**
   * 檢查單一權限
   */
  private async checkSinglePermission(
    userPermissions: UserPermissionSnapshot,
    permissionName: string,
    allowExpired: boolean
  ): Promise<PermissionCheckResult> {
    const now = new Date().toISOString()

    // 1. 檢查直接拒絕的權限
    const deniedPermission = userPermissions.directPermissions.find(p => 
      p.permissionId === permissionName && 
      p.isDenied && 
      p.isActive &&
      (allowExpired || !p.expiresAt || p.expiresAt > now)
    )

    if (deniedPermission) {
      return {
        hasPermission: false,
        source: 'denied',
        grantedBy: deniedPermission.grantedBy || undefined,
        grantedAt: deniedPermission.grantedAt || undefined
      }
    }

    // 2. 檢查直接授予的權限
    const directPermission = userPermissions.directPermissions.find(p => 
      p.permissionId === permissionName && 
      !p.isDenied && 
      p.isActive &&
      (allowExpired || !p.expiresAt || p.expiresAt > now)
    )

    if (directPermission) {
      return {
        hasPermission: true,
        source: 'direct',
        grantedBy: directPermission.grantedBy || undefined,
        grantedAt: directPermission.grantedAt || undefined
      }
    }

    // 3. 檢查角色權限
    if (userPermissions.effectivePermissions.includes(permissionName)) {
      return {
        hasPermission: true,
        source: 'role'
      }
    }

    return {
      hasPermission: false,
      source: 'role'
    }
  }

  /**
   * 載入用戶完整權限信息
   */
  async loadUserPermissions(userId: string): Promise<ServiceResponse<UserPermissionSnapshot>> {
    try {
      // 1. 查詢用戶角色
      const userRoleData = await this.db
        .select({
          role: roles,
          userRole: userRoles
        })
        .from(userRoles)
        .innerJoin(roles, eq(roles.roleId, userRoles.roleId))
        .where(and(
          eq(userRoles.userId, userId),
          eq(userRoles.isActive, true),
          eq(roles.isActive, true)
        ))

      const userRoleList = userRoleData.map(r => r.role)
      const now = new Date().toISOString()

      // 過濾未過期的角色
      const activeRoles = userRoleData.filter(r => 
        !r.userRole.expiresAt || r.userRole.expiresAt > now
      ).map(r => r.role)

      // 2. 查詢角色權限
      let rolePermissionNames: string[] = []
      if (activeRoles.length > 0) {
        const roleIds = activeRoles.map(r => r.roleId)
        const rolePermissionData = await this.db
          .select({
            permission: permissions
          })
          .from(rolePermissions)
          .innerJoin(permissions, eq(permissions.permissionId, rolePermissions.permissionId))
          .where(inArray(rolePermissions.roleId, roleIds))

        rolePermissionNames = rolePermissionData.map(rp => rp.permission.permissionName)
      }

      // 3. 查詢用戶直接權限
      const directPermissionData = await this.db
        .select()
        .from(userPermissions)
        .where(and(
          eq(userPermissions.userId, userId),
          eq(userPermissions.isActive, true)
        ))

      // 4. 計算有效權限
      const effectivePermissions = new Set(rolePermissionNames)
      
      // 添加直接授予的權限（非拒絕的）
      directPermissionData
        .filter(p => !p.isDenied && (!p.expiresAt || p.expiresAt > now))
        .forEach(p => effectivePermissions.add(p.permissionId))

      // 移除直接拒絕的權限
      directPermissionData
        .filter(p => p.isDenied && (!p.expiresAt || p.expiresAt > now))
        .forEach(p => effectivePermissions.delete(p.permissionId))

      const snapshot: UserPermissionSnapshot = {
        userId,
        userType: 'admin', // 這裡需要根據實際用戶類型判斷
        roles: activeRoles,
        permissions: rolePermissionNames,
        directPermissions: directPermissionData,
        effectivePermissions: Array.from(effectivePermissions),
        lastUpdated: now
      }

      return this.success(snapshot)

    } catch (error: any) {
      return this.handleDbError(error)
    }
  }

  /**
   * 為用戶授予角色
   */
  async grantUserRole(
    userId: string,
    roleId: string,
    grantedBy: string,
    expiresAt?: string,
    metadata?: Record<string, any>
  ): Promise<ServiceResponse> {
    try {
      // 檢查角色是否存在
      const role = await this.db
        .select()
        .from(roles)
        .where(eq(roles.roleId, roleId))
        .limit(1)

      if (role.length === 0) {
        return this.error('指定的角色不存在')
      }

      // 檢查用戶是否已有該角色
      const existingRole = await this.db
        .select()
        .from(userRoles)
        .where(and(
          eq(userRoles.userId, userId),
          eq(userRoles.roleId, roleId),
          eq(userRoles.isActive, true)
        ))
        .limit(1)

      if (existingRole.length > 0) {
        return this.error('用戶已擁有該角色')
      }

      // 插入角色授予記錄
      const userRoleId = this.generateId('ur')
      await this.db.insert(userRoles).values({
        userRoleId,
        userId,
        roleId,
        grantedBy,
        grantedAt: new Date().toISOString(),
        expiresAt,
        isActive: true,
        metadata: metadata ? JSON.stringify(metadata) : null
      })

      // 記錄權限變更日誌
      await this.logPermissionChange({
        logId: this.generateId('pcl'),
        userId,
        action: 'ROLE_GRANTED',
        roleId,
        newValue: { roleId, grantedBy, expiresAt, metadata },
        changedBy: grantedBy,
        changedAt: new Date().toISOString(),
        ipAddress: this.context?.requestId, // 可以從 context 獲取
        reason: '角色授予'
      })

      // 清除用戶權限快取
      await this.clearUserPermissionCache(userId)

      this.logAction('USER_ROLE_GRANTED', `user:${userId}`, null, { roleId, grantedBy })

      return this.success(null, '角色授予成功')

    } catch (error: any) {
      return this.handleDbError(error)
    }
  }

  /**
   * 撤銷用戶角色
   */
  async revokeUserRole(userId: string, roleId: string, revokedBy: string): Promise<ServiceResponse> {
    try {
      // 查找活躍的用戶角色
      const existingRole = await this.db
        .select()
        .from(userRoles)
        .where(and(
          eq(userRoles.userId, userId),
          eq(userRoles.roleId, roleId),
          eq(userRoles.isActive, true)
        ))
        .limit(1)

      if (existingRole.length === 0) {
        return this.error('用戶沒有該角色或角色已被撤銷')
      }

      // 更新角色為不活躍
      await this.db
        .update(userRoles)
        .set({
          isActive: false,
          revokedBy,
          revokedAt: new Date().toISOString()
        })
        .where(and(
          eq(userRoles.userId, userId),
          eq(userRoles.roleId, roleId)
        ))

      // 記錄權限變更日誌
      await this.logPermissionChange({
        logId: this.generateId('pcl'),
        userId,
        action: 'ROLE_REVOKED',
        roleId,
        oldValue: existingRole[0],
        changedBy: revokedBy,
        changedAt: new Date().toISOString(),
        reason: '角色撤銷'
      })

      // 清除用戶權限快取
      await this.clearUserPermissionCache(userId)

      this.logAction('USER_ROLE_REVOKED', `user:${userId}`, existingRole[0], { roleId, revokedBy })

      return this.success(null, '角色撤銷成功')

    } catch (error: any) {
      return this.handleDbError(error)
    }
  }

  /**
   * 為用戶直接授予權限
   */
  async grantUserPermission(
    userId: string,
    permissionId: string,
    grantedBy: string,
    expiresAt?: string,
    source: string = 'direct'
  ): Promise<ServiceResponse> {
    try {
      // 檢查權限是否存在
      const permission = await this.db
        .select()
        .from(permissions)
        .where(eq(permissions.permissionId, permissionId))
        .limit(1)

      if (permission.length === 0) {
        return this.error('指定的權限不存在')
      }

      // 檢查是否已有該權限
      const existing = await this.db
        .select()
        .from(userPermissions)
        .where(and(
          eq(userPermissions.userId, userId),
          eq(userPermissions.permissionId, permissionId),
          eq(userPermissions.isActive, true),
          eq(userPermissions.isDenied, false)
        ))
        .limit(1)

      if (existing.length > 0) {
        return this.error('用戶已擁有該權限')
      }

      // 插入權限記錄
      const userPermissionId = this.generateId('up')
      await this.db.insert(userPermissions).values({
        userPermissionId,
        userId,
        permissionId,
        grantedBy,
        grantedAt: new Date().toISOString(),
        expiresAt,
        isActive: true,
        isDenied: false,
        source
      })

      // 記錄權限變更日誌
      await this.logPermissionChange({
        logId: this.generateId('pcl'),
        userId,
        action: 'PERMISSION_GRANTED',
        permissionId,
        newValue: { permissionId, grantedBy, expiresAt, source },
        changedBy: grantedBy,
        changedAt: new Date().toISOString(),
        reason: '直接權限授予'
      })

      // 清除用戶權限快取
      await this.clearUserPermissionCache(userId)

      this.logAction('USER_PERMISSION_GRANTED', `user:${userId}`, null, { permissionId, grantedBy })

      return this.success(null, '權限授予成功')

    } catch (error: any) {
      return this.handleDbError(error)
    }
  }

  /**
   * 從快取獲取用戶權限
   */
  private async getCachedUserPermissions(userId: string): Promise<UserPermissionSnapshot | null> {
    try {
      const cacheKey = `user_permissions:${userId}`
      const cached = await this.cache.get(cacheKey)
      return cached ? JSON.parse(cached) : null
    } catch {
      return null
    }
  }

  /**
   * 快取用戶權限
   */
  private async cacheUserPermissions(
    userId: string, 
    permissions: UserPermissionSnapshot, 
    ttl: number = 300
  ): Promise<void> {
    try {
      const cacheKey = `user_permissions:${userId}`
      await this.cache.put(cacheKey, JSON.stringify(permissions), {
        expirationTtl: ttl
      })
    } catch (error: any) {
      this.logger.error('Failed to cache user permissions', {
        error: error.message,
        userId
      })
    }
  }

  /**
   * 清除用戶權限快取
   */
  async clearUserPermissionCache(userId: string): Promise<void> {
    try {
      const cacheKey = `user_permissions:${userId}`
      await this.cache.delete(cacheKey)
    } catch (error: any) {
      this.logger.error('Failed to clear user permission cache', {
        error: error.message,
        userId
      })
    }
  }

  /**
   * 記錄權限變更日誌
   */
  private async logPermissionChange(log: NewPermissionChangeLog): Promise<void> {
    try {
      await this.db.insert(permissionChangeLogs).values(log)
    } catch (error: any) {
      this.logger.error('Failed to log permission change', {
        error: error.message,
        log
      })
    }
  }

  /**
   * 獲取用戶的所有有效權限列表
   */
  async getUserEffectivePermissions(userId: string): Promise<ServiceResponse<string[]>> {
    try {
      const result = await this.loadUserPermissions(userId)
      if (!result.success || !result.data) {
        return this.error('無法載入用戶權限')
      }

      return this.success(result.data.effectivePermissions)

    } catch (error: any) {
      this.logger.error('Failed to get user effective permissions', {
        error: error.message,
        userId,
        requestId: this.context?.requestId
      })
      return this.error('獲取用戶有效權限失敗')
    }
  }

  /**
   * 批量檢查用戶權限
   */
  async batchCheckUserPermissions(
    userId: string,
    permissionNames: string[],
    options: PermissionValidationOptions = {}
  ): Promise<ServiceResponse<Record<string, boolean>>> {
    try {
      const result = await this.checkUserPermission(userId, permissionNames, options)
      if (!result.success || !result.data) {
        return this.error('權限檢查失敗')
      }

      const permissionMap: Record<string, boolean> = {}
      permissionNames.forEach((permission, index) => {
        permissionMap[permission] = result.data![index].hasPermission
      })

      return this.success(permissionMap)

    } catch (error: any) {
      return this.error('批量權限檢查失敗')
    }
  }
}