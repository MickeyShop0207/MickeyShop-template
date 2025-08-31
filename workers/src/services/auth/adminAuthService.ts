/**
 * 管理員認證服務
 * 負責管理員登入、權限驗證、會話管理等功能
 */

import { eq, and } from 'drizzle-orm'
import { BaseService, ServiceContext, ServiceResponse } from '@/shared/services/baseService'
import { JWTService, TokenPair } from '@/services/auth/jwtService'
import { PermissionService } from '@/services/auth/permissionService'
import { 
  adminUsers,
  adminSessions,
  adminActivityLogs,
  adminSecurityEvents,
  AdminUser,
  NewAdminSession,
  NewAdminActivityLog,
  NewAdminSecurityEvent
} from '@/core/database/schema'

// 管理員登入請求
export interface AdminLoginRequest {
  username: string
  password: string
  deviceInfo?: {
    deviceId?: string
    deviceName?: string
    userAgent?: string
  }
  twoFactorCode?: string
}

// 管理員認證響應
export interface AdminAuthResponse {
  user: {
    id: string
    username: string
    email: string
    displayName: string
    avatar: string | null
    department: string | null
    position: string | null
    status: string
    roles: string[]
    permissions: string[]
    lastLoginAt: string | null
    emailVerified: boolean
    twoFactorEnabled: boolean
    preferences: any
  }
  tokens: TokenPair
  session: {
    sessionId: string
    expiresAt: string
  }
  requiresTwoFactor?: boolean
}

// 密碼修改請求
export interface AdminChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

// 安全事件類型
export type SecurityEventType = 
  | 'FAILED_LOGIN' 
  | 'SUSPICIOUS_ACTIVITY' 
  | 'PASSWORD_CHANGE' 
  | 'PERMISSION_ESCALATION'
  | 'MULTIPLE_SESSIONS'
  | 'UNUSUAL_ACCESS_PATTERN'

/**
 * 管理員認證服務類
 */
export class AdminAuthService extends BaseService {
  private jwtService: JWTService
  private permissionService: PermissionService
  private cache: KVNamespace

  constructor(context: ServiceContext & { 
    jwtService: JWTService
    permissionService: PermissionService
    cache: KVNamespace 
  }) {
    super(context)
    this.jwtService = context.jwtService
    this.permissionService = context.permissionService
    this.cache = context.cache
  }

  /**
   * 管理員登入
   */
  async login(request: AdminLoginRequest, ipAddress?: string): Promise<ServiceResponse<AdminAuthResponse>> {
    try {
      // 驗證必填欄位
      const validation = this.validateRequired(request, ['username', 'password'])
      if (validation) return validation

      // 檢查是否被暫時鎖定
      const lockCheck = await this.checkAccountLock(request.username)
      if (!lockCheck.success) {
        return lockCheck
      }

      // 查找管理員用戶
      const adminUser = await this.db
        .select()
        .from(adminUsers)
        .where(and(
          eq(adminUsers.username, request.username),
          eq(adminUsers.status, 'active')
        ))
        .limit(1)

      if (adminUser.length === 0) {
        await this.recordSecurityEvent(null, 'FAILED_LOGIN', 'high', 
          `Login attempt with non-existent username: ${request.username}`, ipAddress)
        await this.recordFailedLogin(request.username, 'USER_NOT_FOUND', ipAddress)
        return this.error('用戶名或密碼錯誤')
      }

      const user = adminUser[0]

      // 驗證密碼
      const isPasswordValid = await this.verifyPassword(request.password, user.passwordHash)
      if (!isPasswordValid) {
        await this.recordSecurityEvent(user.userId, 'FAILED_LOGIN', 'medium',
          'Invalid password attempt', ipAddress)
        await this.recordFailedLogin(request.username, 'INVALID_PASSWORD', ipAddress)
        return this.error('用戶名或密碼錯誤')
      }

      // 檢查用戶狀態
      if (user.status === 'suspended') {
        await this.recordSecurityEvent(user.userId, 'FAILED_LOGIN', 'high',
          'Login attempt by suspended user', ipAddress)
        return this.error('帳號已被暫停，請聯繫系統管理員')
      }

      // 檢查雙因子認證
      if (user.twoFactorEnabled && !request.twoFactorCode) {
        // 生成臨時認證 Token
        const tempToken = this.generateId('temp')
        const tempTokenKey = `temp_auth:${tempToken}`
        await this.cache.put(tempTokenKey, user.userId, { expirationTtl: 300 }) // 5分鐘

        return this.success({
          requiresTwoFactor: true,
          tempToken
        } as any, '請輸入雙因子認證碼')
      }

      if (user.twoFactorEnabled && request.twoFactorCode) {
        const isValidCode = await this.verifyTwoFactorCode(user.twoFactorSecret, request.twoFactorCode)
        if (!isValidCode) {
          await this.recordSecurityEvent(user.userId, 'FAILED_LOGIN', 'high',
            'Invalid two-factor authentication code', ipAddress)
          return this.error('無效的雙因子認證碼')
        }
      }

      // 獲取用戶權限
      const userPermissions = await this.permissionService.loadUserPermissions(user.userId)
      if (!userPermissions.success || !userPermissions.data) {
        return this.error('無法載入用戶權限')
      }

      // 檢查多重會話
      await this.checkMultipleSessions(user.userId, ipAddress)

      // 創建會話和 Token
      const authResult = await this.createAdminSession(user, userPermissions.data, {
        deviceId: request.deviceInfo?.deviceId,
        deviceName: request.deviceInfo?.deviceName,
        userAgent: request.deviceInfo?.userAgent,
        ipAddress
      })

      if (!authResult.success || !authResult.data) {
        return this.error('會話創建失敗')
      }

      // 更新用戶登入信息
      await this.db
        .update(adminUsers)
        .set({
          lastLoginAt: new Date().toISOString(),
          lastLoginIp: ipAddress,
          loginCount: user.loginCount + 1,
          updatedAt: new Date().toISOString()
        })
        .where(eq(adminUsers.userId, user.userId))

      // 記錄活動日誌
      await this.logAdminActivity(user.userId, authResult.data.session.sessionId, 'LOGIN', 'auth', {
        ipAddress,
        deviceInfo: request.deviceInfo,
        success: true
      })

      // 清除失敗登入記錄
      await this.clearFailedLogins(request.username)

      this.logAction('ADMIN_LOGIN', `admin:${user.userId}`, null, {
        username: request.username,
        ipAddress,
        department: user.department
      })

      return this.success(authResult.data, '登入成功')

    } catch (error: any) {
      return this.handleDbError(error)
    }
  }

  /**
   * 管理員登出
   */
  async logout(userId: string, sessionId: string): Promise<ServiceResponse> {
    try {
      // 撤銷會話
      await this.revokeAdminSession(sessionId)

      // 記錄活動日誌
      await this.logAdminActivity(userId, sessionId, 'LOGOUT', 'auth')

      this.logAction('ADMIN_LOGOUT', `admin:${userId}`, null, { sessionId })

      return this.success(null, '登出成功')

    } catch (error: any) {
      return this.handleDbError(error)
    }
  }

  /**
   * Token 刷新
   */
  async refreshToken(refreshToken: string): Promise<ServiceResponse<TokenPair>> {
    try {
      const result = await this.jwtService.refreshToken(refreshToken)
      
      if (result.success && result.data) {
        this.logAction('ADMIN_TOKEN_REFRESHED', null, null, { hasNewTokens: true })
      }

      return result

    } catch (error: any) {
      this.logger.error('Admin token refresh failed', {
        error: error.message,
        requestId: this.context?.requestId
      })
      return this.error('Token 刷新失敗')
    }
  }

  /**
   * 獲取管理員資料
   */
  async getProfile(userId: string): Promise<ServiceResponse<Partial<AdminUser>>> {
    try {
      const adminUser = await this.db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.userId, userId))
        .limit(1)

      if (adminUser.length === 0) {
        return this.error('管理員不存在')
      }

      // 移除敏感信息
      const { passwordHash, twoFactorSecret, ...safeUser } = adminUser[0]

      return this.success(safeUser)

    } catch (error: any) {
      return this.handleDbError(error)
    }
  }

  /**
   * 修改管理員密碼
   */
  async changePassword(userId: string, request: AdminChangePasswordRequest): Promise<ServiceResponse> {
    try {
      // 驗證必填欄位
      const validation = this.validateRequired(request, ['currentPassword', 'newPassword'])
      if (validation) return validation

      // 獲取當前用戶
      const adminUser = await this.db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.userId, userId))
        .limit(1)

      if (adminUser.length === 0) {
        return this.error('管理員不存在')
      }

      const user = adminUser[0]

      // 驗證當前密碼
      const isCurrentPasswordValid = await this.verifyPassword(request.currentPassword, user.passwordHash)
      if (!isCurrentPasswordValid) {
        await this.recordSecurityEvent(userId, 'PASSWORD_CHANGE', 'medium',
          'Failed password change attempt - invalid current password')
        return this.error('當前密碼錯誤')
      }

      // 檢查新密碼強度
      const { checkPasswordStrength } = await import('@/utils/security')
      const passwordStrength = checkPasswordStrength(request.newPassword, {
        email: user.email,
        username: user.username
      })

      if (!passwordStrength.isStrong) {
        return this.error('新密碼強度不足', passwordStrength.issues.map(issue => ({
          field: 'newPassword',
          message: issue,
          code: 'WEAK_PASSWORD'
        })))
      }

      // 檢查新密碼是否與當前密碼相同
      const isSamePassword = await this.verifyPassword(request.newPassword, user.passwordHash)
      if (isSamePassword) {
        return this.error('新密碼不能與當前密碼相同')
      }

      // 更新密碼
      const newPasswordHash = await this.hashPassword(request.newPassword)
      
      await this.db
        .update(adminUsers)
        .set({
          passwordHash: newPasswordHash,
          passwordChangedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .where(eq(adminUsers.userId, userId))

      // 撤銷該用戶所有 Token (強制重新登入)
      await this.jwtService.revokeAllUserTokens(userId)

      // 記錄安全事件
      await this.recordSecurityEvent(userId, 'PASSWORD_CHANGE', 'low', 
        'Password successfully changed by user')

      // 記錄活動日誌
      await this.logAdminActivity(userId, null, 'PASSWORD_CHANGE', 'security')

      this.logAction('ADMIN_PASSWORD_CHANGED', `admin:${userId}`)

      return this.success(null, '密碼修改成功，請重新登入')

    } catch (error: any) {
      return this.handleDbError(error)
    }
  }

  /**
   * 創建管理員會話
   */
  private async createAdminSession(
    user: AdminUser,
    permissions: any,
    deviceInfo: {
      deviceId?: string
      deviceName?: string
      userAgent?: string
      ipAddress?: string
    } = {}
  ): Promise<ServiceResponse<AdminAuthResponse>> {
    try {
      // 創建會話記錄
      const sessionId = this.generateId('adm_sess')
      const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() // 8 hours

      const sessionData: NewAdminSession = {
        sessionId,
        userId: user.userId,
        tokenHash: '', // 將在生成 token 後更新
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName,
        userAgent: deviceInfo.userAgent,
        ipAddress: deviceInfo.ipAddress,
        expiresAt,
        isActive: true
      }

      await this.db.insert(adminSessions).values(sessionData)

      // 生成 JWT Token
      const tokenResult = await this.jwtService.generateTokenPair({
        sub: user.userId,
        email: user.email,
        type: 'admin',
        sessionId,
        roleIds: permissions.roles.map((r: any) => r.roleId),
        permissions: permissions.effectivePermissions,
        department: user.department
      })

      if (!tokenResult.success || !tokenResult.data) {
        return this.error('Token 生成失敗')
      }

      // 更新會話的 token hash
      const tokenHash = await this.generateTokenHash(tokenResult.data.accessToken)
      await this.db
        .update(adminSessions)
        .set({ tokenHash })
        .where(eq(adminSessions.sessionId, sessionId))

      // 記錄用戶會話到 JWT 服務
      await this.jwtService.recordUserSession(user.userId, sessionId)

      // 構建響應
      const authResponse: AdminAuthResponse = {
        user: {
          id: user.userId,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          avatar: user.avatar,
          department: user.department,
          position: user.position,
          status: user.status,
          roles: permissions.roles.map((r: any) => r.roleId),
          permissions: permissions.effectivePermissions,
          lastLoginAt: user.lastLoginAt,
          emailVerified: !!user.emailVerifiedAt,
          twoFactorEnabled: user.twoFactorEnabled,
          preferences: user.preferences
        },
        tokens: tokenResult.data,
        session: {
          sessionId,
          expiresAt
        }
      }

      return this.success(authResponse)

    } catch (error: any) {
      return this.handleDbError(error)
    }
  }

  /**
   * 撤銷管理員會話
   */
  private async revokeAdminSession(sessionId: string): Promise<void> {
    try {
      // 停用會話
      await this.db
        .update(adminSessions)
        .set({
          isActive: false,
          revokedAt: new Date().toISOString(),
          revokedReason: 'User logout'
        })
        .where(eq(adminSessions.sessionId, sessionId))

    } catch (error: any) {
      this.logger.error('Admin session revocation failed', {
        error: error.message,
        sessionId
      })
    }
  }

  /**
   * 記錄管理員活動
   */
  private async logAdminActivity(
    userId: string,
    sessionId: string | null,
    action: string,
    module: string,
    metadata?: any
  ): Promise<void> {
    try {
      const activityLog: NewAdminActivityLog = {
        logId: this.generateId('aal'),
        userId,
        sessionId,
        action,
        module,
        description: `Admin performed ${action}`,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.deviceInfo?.userAgent,
        success: metadata?.success !== false
      }

      await this.db.insert(adminActivityLogs).values(activityLog)
    } catch (error: any) {
      this.logger.error('Failed to log admin activity', {
        error: error.message,
        userId,
        action
      })
    }
  }

  /**
   * 記錄安全事件
   */
  private async recordSecurityEvent(
    userId: string | null,
    eventType: SecurityEventType,
    severity: 'low' | 'medium' | 'high' | 'critical',
    description: string,
    ipAddress?: string,
    metadata?: any
  ): Promise<void> {
    try {
      const securityEvent: NewAdminSecurityEvent = {
        eventId: this.generateId('ase'),
        userId,
        eventType,
        severity,
        description,
        ipAddress,
        metadata: metadata ? JSON.stringify(metadata) : null,
        resolved: false
      }

      await this.db.insert(adminSecurityEvents).values(securityEvent)

      // 對於高嚴重性事件，可以觸發警報
      if (severity === 'high' || severity === 'critical') {
        this.logger.error('High severity security event', {
          eventType,
          userId,
          description,
          ipAddress
        })
      }

    } catch (error: any) {
      this.logger.error('Failed to record security event', {
        error: error.message,
        eventType,
        userId
      })
    }
  }

  /**
   * 檢查帳戶鎖定狀態
   */
  private async checkAccountLock(username: string): Promise<ServiceResponse> {
    try {
      const lockKey = `admin_locked:${username}`
      const isLocked = await this.cache.get(lockKey)
      
      if (isLocked) {
        return this.error('帳戶已被暫時鎖定，請稍後再試')
      }

      return this.success(null)
    } catch {
      return this.success(null) // 如果檢查失敗，允許繼續
    }
  }

  /**
   * 記錄失敗登入
   */
  private async recordFailedLogin(username: string, reason: string, ipAddress?: string): Promise<void> {
    try {
      const failureKey = `admin_login_failures:${username}`
      const failures = await this.cache.get(failureKey) || '0'
      const failureCount = parseInt(failures) + 1
      
      if (failureCount >= 3) {
        // 鎖定帳戶 30 分鐘
        const lockKey = `admin_locked:${username}`
        await this.cache.put(lockKey, 'true', { expirationTtl: 30 * 60 }) // 30分鐘
        
        this.logger.error('Admin account locked due to repeated failures', {
          username,
          failureCount,
          ipAddress
        })
      }
      
      await this.cache.put(failureKey, failureCount.toString(), { expirationTtl: 60 * 60 }) // 1小時
      
    } catch (error: any) {
      this.logger.error('Failed to record admin login failure', {
        error: error.message,
        username
      })
    }
  }

  /**
   * 清除失敗登入記錄
   */
  private async clearFailedLogins(username: string): Promise<void> {
    try {
      const failureKey = `admin_login_failures:${username}`
      await this.cache.delete(failureKey)
    } catch (error: any) {
      this.logger.error('Failed to clear login failures', {
        error: error.message,
        username
      })
    }
  }

  /**
   * 檢查多重會話
   */
  private async checkMultipleSessions(userId: string, ipAddress?: string): Promise<void> {
    try {
      const activeSessions = await this.db
        .select()
        .from(adminSessions)
        .where(and(
          eq(adminSessions.userId, userId),
          eq(adminSessions.isActive, true)
        ))

      if (activeSessions.length >= 3) {
        await this.recordSecurityEvent(userId, 'MULTIPLE_SESSIONS', 'medium',
          `User has ${activeSessions.length} active sessions`, ipAddress)
      }

    } catch (error: any) {
      this.logger.error('Failed to check multiple sessions', {
        error: error.message,
        userId
      })
    }
  }

  /**
   * 驗證雙因子認證碼 (TOTP)
   */
  private async verifyTwoFactorCode(secret: string | null, code: string): Promise<boolean> {
    if (!secret) return false
    
    // 這裡應該實現 TOTP 驗證邏輯
    // 由於 Cloudflare Workers 環境限制，這裡簡化實現
    // 實際應用中應該使用專門的 TOTP 庫
    
    return code.length === 6 && /^\d{6}$/.test(code)
  }

  /**
   * 密碼加密
   */
  private async hashPassword(password: string): Promise<string> {
    const { hashPassword } = await import('@/utils/security')
    return hashPassword(password)
  }

  /**
   * 密碼驗證
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    const { verifyPassword } = await import('@/utils/security')
    return verifyPassword(password, hash)
  }

  /**
   * 生成 Token 哈希
   */
  private async generateTokenHash(token: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(token)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }
}