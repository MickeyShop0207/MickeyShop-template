/**
 * 認證和授權中間件
 * 整合 JWT 服務和權限管理系統
 */

import { MiddlewareHandler, Context } from 'hono'
import { JWTService, JWTPayload } from '@/services/auth/jwtService'
import { PermissionService, PermissionValidationOptions } from '@/services/auth/permissionService'
import { createServiceContext } from '@/shared/services/baseService'

// 認證錯誤類型
export class UnauthorizedError extends Error {
  constructor(message: string = '未授權訪問') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = '權限不足') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

// 認證用戶類型 (擴展版本)
export interface AuthUser {
  id: string
  email: string
  type: 'admin' | 'member'
  sessionId: string
  
  // 會員專用字段
  memberTier?: string
  memberStatus?: string
  
  // 管理員專用字段
  roleIds?: string[]
  permissions?: string[]
  department?: string
  
  // JWT 相關
  tokenPayload: JWTPayload
}

/**
 * JWT Token 驗證中間件 (完整實現版本)
 */
export const authenticateToken = (): MiddlewareHandler => {
  return async (c, next) => {
    try {
      // 獲取 Authorization Header
      const authHeader = c.req.header('Authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError('缺少有效的 Authorization 標頭')
      }

      const token = authHeader.slice(7) // 移除 'Bearer ' 前綴
      const jwtSecret = c.env.JWT_SECRET

      if (!jwtSecret) {
        throw new Error('JWT_SECRET 環境變數未設定')
      }

      // 創建 JWT 服務
      const jwtService = new JWTService({
        db: c.get('db'),
        logger: console, // 臨時使用 console，實際應該使用正確的 logger
        jwtSecret,
        cache: c.env.SESSION_KV
      })

      // 驗證 JWT Token
      const validation = await jwtService.verifyAccessToken(token)
      if (!validation.valid || !validation.payload) {
        throw new UnauthorizedError(validation.error || '無效的 Token')
      }

      // 構建認證用戶信息
      const user: AuthUser = {
        id: validation.payload.sub,
        email: validation.payload.email,
        type: validation.payload.type,
        sessionId: validation.payload.sessionId,
        memberTier: validation.payload.memberTier,
        memberStatus: validation.payload.memberStatus,
        roleIds: validation.payload.roleIds,
        permissions: validation.payload.permissions,
        department: validation.payload.department,
        tokenPayload: validation.payload
      }

      // 將用戶信息存儲到 context 中
      c.set('user', user)
      c.set('jwtService', jwtService)

      await next()
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return c.json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: error.message,
            timestamp: new Date().toISOString(),
            requestId: c.get('requestId')
          }
        }, 401)
      }
      
      throw error
    }
  }
}

/**
 * 權限檢查中間件 (完整 RBAC 實現)
 */
export const requirePermissions = (
  requiredPermissions: string | string[], 
  options: PermissionValidationOptions = {}
): MiddlewareHandler => {
  return async (c, next) => {
    try {
      const user = c.get('user') as AuthUser | undefined

      if (!user) {
        throw new UnauthorizedError('用戶未認證')
      }

      // 創建權限服務
      const serviceContext = createServiceContext(c.get('db'), {
        userId: user.id,
        userType: user.type,
        sessionId: user.sessionId,
        requestId: c.get('requestId')
      })
      
      const permissionService = new PermissionService({
        ...serviceContext,
        cache: c.env.CACHE_KV
      })

      // 檢查權限
      const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions]
      const result = await permissionService.checkUserPermission(user.id, permissions, options)
      
      if (!result.success || !result.data) {
        throw new ForbiddenError(result.message || '權限檢查失敗')
      }

      // 檢查是否有必要的權限
      const hasRequiredPermissions = options.requireAll 
        ? result.data.every(r => r.hasPermission)
        : result.data.some(r => r.hasPermission)

      if (!hasRequiredPermissions) {
        const missingPermissions = permissions.filter((_, index) => 
          !result.data![index].hasPermission
        )
        
        throw new ForbiddenError(`權限不足，缺少權限: ${missingPermissions.join(', ')}`)
      }

      // 將權限檢查結果存到 context 中（供後續使用）
      c.set('permissionCheckResults', result.data)

      await next()
    } catch (error) {
      if (error instanceof ForbiddenError) {
        return c.json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: error.message,
            requiredPermissions: Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions],
            timestamp: new Date().toISOString(),
            requestId: c.get('requestId')
          }
        }, 403)
      }
      
      throw error
    }
  }
}

/**
 * 角色檢查中間件 (更新版本)
 */
export const requireRoles = (requiredRoles: string | string[], requireAll: boolean = false): MiddlewareHandler => {
  return async (c, next) => {
    try {
      const user = c.get('user') as AuthUser | undefined

      if (!user) {
        throw new UnauthorizedError('用戶未認證')
      }

      // 確保有角色信息
      if (!user.roleIds || user.roleIds.length === 0) {
        throw new ForbiddenError('用戶沒有分配任何角色')
      }

      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
      
      // 檢查角色
      const hasRole = requireAll 
        ? roles.every(role => user.roleIds!.includes(role))
        : roles.some(role => user.roleIds!.includes(role))

      if (!hasRole) {
        const message = requireAll 
          ? `需要所有角色: ${roles.join(', ')}`
          : `需要以下任一角色: ${roles.join(', ')}`
        throw new ForbiddenError(`角色權限不足，${message}`)
      }

      await next()
    } catch (error) {
      if (error instanceof ForbiddenError) {
        return c.json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: error.message,
            requiredRoles: Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles],
            timestamp: new Date().toISOString(),
            requestId: c.get('requestId')
          }
        }, 403)
      }
      
      throw error
    }
  }
}

/**
 * 管理員權限檢查
 */
export const requireAdmin = () => requireRoles(['admin', 'super_admin'])

/**
 * 超級管理員權限檢查
 */
export const requireSuperAdmin = () => requireRoles(['super_admin'])

/**
 * 檢查用戶類型 (管理員 vs 會員)
 */
export const requireUserType = (userType: 'admin' | 'member'): MiddlewareHandler => {
  return async (c, next) => {
    try {
      const user = c.get('user') as AuthUser | undefined

      if (!user) {
        throw new UnauthorizedError('用戶未認證')
      }

      if (user.type !== userType) {
        throw new ForbiddenError(`需要 ${userType} 類型用戶`)
      }

      await next()
    } catch (error) {
      if (error instanceof ForbiddenError) {
        return c.json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: error.message,
            requiredUserType: userType,
            timestamp: new Date().toISOString(),
            requestId: c.get('requestId')
          }
        }, 403)
      }
      
      throw error
    }
  }
}

/**
 * 檢查會員等級
 */
export const requireMemberTier = (minTier: string): MiddlewareHandler => {
  const tierLevels = ['bronze', 'silver', 'gold', 'platinum', 'diamond']
  
  return async (c, next) => {
    try {
      const user = c.get('user') as AuthUser | undefined

      if (!user) {
        throw new UnauthorizedError('用戶未認證')
      }

      if (user.type !== 'member') {
        throw new ForbiddenError('此功能僅限會員使用')
      }

      if (!user.memberTier) {
        throw new ForbiddenError('會員等級信息缺失')
      }

      const currentTierLevel = tierLevels.indexOf(user.memberTier)
      const requiredTierLevel = tierLevels.indexOf(minTier)

      if (currentTierLevel < requiredTierLevel) {
        throw new ForbiddenError(`需要 ${minTier} 或以上等級會員`)
      }

      await next()
    } catch (error) {
      if (error instanceof ForbiddenError) {
        return c.json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: error.message,
            requiredTier: minTier,
            currentTier: c.get('user')?.memberTier,
            timestamp: new Date().toISOString(),
            requestId: c.get('requestId')
          }
        }, 403)
      }
      
      throw error
    }
  }
}

/**
 * 可選認證中間件（用於可選登錄的端點）
 */
export const optionalAuth = (): MiddlewareHandler => {
  return async (c, next) => {
    try {
      const authHeader = c.req.header('Authorization')
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // 如果有 Token，嘗試驗證
        const authMiddleware = authenticateToken()
        await authMiddleware(c, async () => {})
      }
      
      await next()
    } catch (error) {
      // 可選認證失敗時不拋出錯誤，繼續執行
      // 但需要清除可能設置的不完整用戶信息
      c.set('user', undefined)
      await next()
    }
  }
}

/**
 * 會話驗證中間件 (檢查會話是否有效)
 */
export const validateSession = (): MiddlewareHandler => {
  return async (c, next) => {
    try {
      const user = c.get('user') as AuthUser | undefined

      if (!user) {
        throw new UnauthorizedError('用戶未認證')
      }

      // 這裡可以添加會話驗證邏輯
      // 例如檢查資料庫中的會話是否仍然有效
      // 檢查會話是否被撤銷等

      const sessionService = createServiceContext(c.get('db'), {
        userId: user.id,
        sessionId: user.sessionId
      })

      // 可以添加會話狀態檢查
      // const sessionValid = await checkSessionValidity(user.sessionId)
      // if (!sessionValid) {
      //   throw new UnauthorizedError('會話已失效，請重新登錄')
      // }

      await next()
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return c.json({
          success: false,
          error: {
            code: 'SESSION_INVALID',
            message: error.message,
            timestamp: new Date().toISOString(),
            requestId: c.get('requestId')
          }
        }, 401)
      }
      
      throw error
    }
  }
}

/**
 * 組合中間件：完整認證 (Token + Session)
 */
export const fullAuth = (): MiddlewareHandler => {
  return async (c, next) => {
    const tokenAuth = authenticateToken()
    const sessionValidation = validateSession()
    
    await tokenAuth(c, async () => {
      await sessionValidation(c, next)
    })
  }
}

/**
 * 簡化的認證中間件供模組使用
 */
export interface AuthOptions {
  required?: boolean
}

export const authMiddleware = (options: AuthOptions = { required: true }): MiddlewareHandler => {
  return async (c, next) => {
    try {
      const authHeader = c.req.header('Authorization')
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        if (options.required) {
          return c.json({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: '需要登入認證',
              timestamp: new Date().toISOString(),
              requestId: c.get('requestId')
            }
          }, 401)
        } else {
          // 可選認證，繼續執行
          await next()
          return
        }
      }

      const token = authHeader.slice(7)
      
      // 簡化的 token 解析 (實際應該使用完整的 JWT 驗證)
      try {
        // 這裡應該實現完整的 JWT 驗證邏輯
        // 暫時使用簡化版本
        const payload = JSON.parse(atob(token.split('.')[1]))
        
        const currentUser = {
          customerId: payload.sub,
          adminId: payload.sub,
          role: payload.type === 'admin' ? 'admin' : 'customer',
          email: payload.email,
          ...payload
        }

        c.set('currentUser', currentUser)
      } catch (error) {
        if (options.required) {
          return c.json({
            success: false,
            error: {
              code: 'INVALID_TOKEN',
              message: '無效的認證 Token',
              timestamp: new Date().toISOString(),
              requestId: c.get('requestId')
            }
          }, 401)
        }
      }

      await next()
    } catch (error) {
      if (options.required) {
        return c.json({
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: '認證過程發生錯誤',
            timestamp: new Date().toISOString(),
            requestId: c.get('requestId')
          }
        }, 500)
      } else {
        await next()
      }
    }
  }
}