/**
 * 管理員認證 API 路由
 * 路徑前綴: /api/admin/v1/auth
 */

import { Hono } from 'hono'
import type { Env } from '../../index'
import { AdminAuthService, AdminLoginRequest, AdminChangePasswordRequest } from '@/services/auth/adminAuthService'
import { JWTService } from '@/services/auth/jwtService'
import { PermissionService } from '@/services/auth/permissionService'
import { authenticateToken, fullAuth, requireAdmin, requireUserType } from '@/middlewares/auth'
import { createServiceContext } from '@/shared/services/baseService'
import { rateLimitMiddleware } from '@/middlewares/rateLimit'

export const adminAuthRoutes = new Hono<{ Bindings: Env }>()

/**
 * POST /auth/login - 管理員登入
 */
adminAuthRoutes.post('/login', rateLimitMiddleware({ requests: 5, windowMs: 15 * 60 * 1000 }), async (c) => {
  try {
    const request = await c.req.json() as AdminLoginRequest
    const ipAddress = c.req.header('CF-Connecting-IP') || 'unknown'
    const userAgent = c.req.header('User-Agent')

    // 自動添加設備信息
    if (!request.deviceInfo) {
      request.deviceInfo = {}
    }
    request.deviceInfo.userAgent = userAgent

    // 創建服務實例
    const serviceContext = createServiceContext(c.get('db'), {
      requestId: c.get('requestId')
    })

    const jwtService = new JWTService({
      ...serviceContext,
      jwtSecret: c.env.JWT_SECRET,
      cache: c.env.SESSION_KV
    })

    const permissionService = new PermissionService({
      ...serviceContext,
      cache: c.env.CACHE_KV
    })

    const authService = new AdminAuthService({
      ...serviceContext,
      jwtService,
      permissionService,
      cache: c.env.CACHE_KV
    })

    const result = await authService.login(request, ipAddress)

    if (!result.success) {
      return c.json({
        success: false,
        error: {
          code: 'ADMIN_LOGIN_FAILED',
          message: result.message || '登入失敗',
          errors: result.errors,
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId')
        }
      }, 401)
    }

    return c.json({
      success: true,
      message: result.message,
      data: result.data,
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId')
    })

  } catch (error: any) {
    console.error('Admin login error:', error)
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '服務器內部錯誤',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId')
      }
    }, 500)
  }
})

/**
 * POST /auth/logout - 管理員登出
 */
adminAuthRoutes.post('/logout', authenticateToken(), requireUserType('admin'), async (c) => {
  try {
    const user = c.get('user')
    
    // 創建服務實例
    const serviceContext = createServiceContext(c.get('db'), {
      requestId: c.get('requestId'),
      userId: user.id,
      userType: user.type
    })

    const jwtService = new JWTService({
      ...serviceContext,
      jwtSecret: c.env.JWT_SECRET,
      cache: c.env.SESSION_KV
    })

    const permissionService = new PermissionService({
      ...serviceContext,
      cache: c.env.CACHE_KV
    })

    const authService = new AdminAuthService({
      ...serviceContext,
      jwtService,
      permissionService,
      cache: c.env.CACHE_KV
    })

    const result = await authService.logout(user.id, user.sessionId)

    if (!result.success) {
      return c.json({
        success: false,
        error: {
          code: 'ADMIN_LOGOUT_FAILED',
          message: result.message || '登出失敗',
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId')
        }
      }, 400)
    }

    return c.json({
      success: true,
      message: result.message,
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId')
    })

  } catch (error: any) {
    console.error('Admin logout error:', error)
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '服務器內部錯誤',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId')
      }
    }, 500)
  }
})

/**
 * POST /auth/refresh - 刷新 Token
 */
adminAuthRoutes.post('/refresh', rateLimitMiddleware({ requests: 20, windowMs: 15 * 60 * 1000 }), async (c) => {
  try {
    const { refreshToken } = await c.req.json()

    if (!refreshToken) {
      return c.json({
        success: false,
        error: {
          code: 'MISSING_REFRESH_TOKEN',
          message: '缺少刷新令牌',
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId')
        }
      }, 400)
    }

    // 創建服務實例
    const serviceContext = createServiceContext(c.get('db'), {
      requestId: c.get('requestId')
    })

    const jwtService = new JWTService({
      ...serviceContext,
      jwtSecret: c.env.JWT_SECRET,
      cache: c.env.SESSION_KV
    })

    const permissionService = new PermissionService({
      ...serviceContext,
      cache: c.env.CACHE_KV
    })

    const authService = new AdminAuthService({
      ...serviceContext,
      jwtService,
      permissionService,
      cache: c.env.CACHE_KV
    })

    const result = await authService.refreshToken(refreshToken)

    if (!result.success) {
      return c.json({
        success: false,
        error: {
          code: 'ADMIN_TOKEN_REFRESH_FAILED',
          message: result.message || 'Token 刷新失敗',
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId')
        }
      }, 401)
    }

    return c.json({
      success: true,
      message: result.message,
      data: result.data,
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId')
    })

  } catch (error: any) {
    console.error('Admin token refresh error:', error)
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '服務器內部錯誤',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId')
      }
    }, 500)
  }
})

/**
 * GET /auth/profile - 獲取管理員資料
 */
adminAuthRoutes.get('/profile', fullAuth(), requireUserType('admin'), async (c) => {
  try {
    const user = c.get('user')

    // 創建服務實例
    const serviceContext = createServiceContext(c.get('db'), {
      requestId: c.get('requestId'),
      userId: user.id,
      userType: user.type
    })

    const jwtService = new JWTService({
      ...serviceContext,
      jwtSecret: c.env.JWT_SECRET,
      cache: c.env.SESSION_KV
    })

    const permissionService = new PermissionService({
      ...serviceContext,
      cache: c.env.CACHE_KV
    })

    const authService = new AdminAuthService({
      ...serviceContext,
      jwtService,
      permissionService,
      cache: c.env.CACHE_KV
    })

    const result = await authService.getProfile(user.id)

    if (!result.success) {
      return c.json({
        success: false,
        error: {
          code: 'ADMIN_PROFILE_NOT_FOUND',
          message: result.message || '管理員資料不存在',
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId')
        }
      }, 404)
    }

    return c.json({
      success: true,
      message: '管理員資料獲取成功',
      data: result.data,
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId')
    })

  } catch (error: any) {
    console.error('Get admin profile error:', error)
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '服務器內部錯誤',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId')
      }
    }, 500)
  }
})

/**
 * PUT /auth/change-password - 修改管理員密碼
 */
adminAuthRoutes.put('/change-password', fullAuth(), requireUserType('admin'), async (c) => {
  try {
    const user = c.get('user')
    const request = await c.req.json() as AdminChangePasswordRequest

    // 創建服務實例
    const serviceContext = createServiceContext(c.get('db'), {
      requestId: c.get('requestId'),
      userId: user.id,
      userType: user.type
    })

    const jwtService = new JWTService({
      ...serviceContext,
      jwtSecret: c.env.JWT_SECRET,
      cache: c.env.SESSION_KV
    })

    const permissionService = new PermissionService({
      ...serviceContext,
      cache: c.env.CACHE_KV
    })

    const authService = new AdminAuthService({
      ...serviceContext,
      jwtService,
      permissionService,
      cache: c.env.CACHE_KV
    })

    const result = await authService.changePassword(user.id, request)

    if (!result.success) {
      return c.json({
        success: false,
        error: {
          code: 'PASSWORD_CHANGE_FAILED',
          message: result.message || '密碼修改失敗',
          errors: result.errors,
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId')
        }
      }, 400)
    }

    return c.json({
      success: true,
      message: result.message,
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId')
    })

  } catch (error: any) {
    console.error('Admin password change error:', error)
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '服務器內部錯誤',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId')
      }
    }, 500)
  }
})

/**
 * GET /auth/me - 獲取當前管理員基本信息
 */
adminAuthRoutes.get('/me', authenticateToken(), requireUserType('admin'), async (c) => {
  try {
    const user = c.get('user')

    return c.json({
      success: true,
      message: '管理員信息獲取成功',
      data: {
        id: user.id,
        email: user.email,
        type: user.type,
        roles: user.roleIds,
        permissions: user.permissions,
        department: user.department,
        tokenExpiry: user.tokenPayload.exp
      },
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId')
    })

  } catch (error: any) {
    console.error('Get admin me error:', error)
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '服務器內部錯誤',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId')
      }
    }, 500)
  }
})

/**
 * GET /auth/permissions - 獲取當前管理員的所有權限
 */
adminAuthRoutes.get('/permissions', fullAuth(), requireUserType('admin'), async (c) => {
  try {
    const user = c.get('user')

    // 創建權限服務
    const serviceContext = createServiceContext(c.get('db'), {
      requestId: c.get('requestId'),
      userId: user.id,
      userType: user.type
    })

    const permissionService = new PermissionService({
      ...serviceContext,
      cache: c.env.CACHE_KV
    })

    const result = await permissionService.getUserEffectivePermissions(user.id)

    if (!result.success) {
      return c.json({
        success: false,
        error: {
          code: 'PERMISSIONS_FETCH_FAILED',
          message: result.message || '獲取權限失敗',
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId')
        }
      }, 400)
    }

    return c.json({
      success: true,
      message: '權限獲取成功',
      data: {
        permissions: result.data,
        roles: user.roleIds,
        department: user.department
      },
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId')
    })

  } catch (error: any) {
    console.error('Get admin permissions error:', error)
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '服務器內部錯誤',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId')
      }
    }, 500)
  }
})

/**
 * POST /auth/verify-permission - 驗證管理員權限
 */
adminAuthRoutes.post('/verify-permission', fullAuth(), requireUserType('admin'), async (c) => {
  try {
    const user = c.get('user')
    const { permissions, requireAll = false } = await c.req.json()

    if (!permissions || !Array.isArray(permissions)) {
      return c.json({
        success: false,
        error: {
          code: 'INVALID_PERMISSIONS',
          message: '權限參數無效',
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId')
        }
      }, 400)
    }

    // 創建權限服務
    const serviceContext = createServiceContext(c.get('db'), {
      requestId: c.get('requestId'),
      userId: user.id,
      userType: user.type
    })

    const permissionService = new PermissionService({
      ...serviceContext,
      cache: c.env.CACHE_KV
    })

    const result = await permissionService.batchCheckUserPermissions(user.id, permissions, { requireAll })

    if (!result.success) {
      return c.json({
        success: false,
        error: {
          code: 'PERMISSION_CHECK_FAILED',
          message: result.message || '權限檢查失敗',
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId')
        }
      }, 400)
    }

    return c.json({
      success: true,
      message: '權限驗證完成',
      data: {
        permissions: result.data,
        hasAllRequiredPermissions: requireAll 
          ? Object.values(result.data).every(Boolean)
          : Object.values(result.data).some(Boolean)
      },
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId')
    })

  } catch (error: any) {
    console.error('Verify admin permission error:', error)
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '服務器內部錯誤',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId')
      }
    }, 500)
  }
})

/**
 * POST /auth/verify-token - 驗證管理員 Token 有效性
 */
adminAuthRoutes.post('/verify-token', async (c) => {
  try {
    const { token } = await c.req.json()

    if (!token) {
      return c.json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: '缺少驗證令牌',
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId')
        }
      }, 400)
    }

    // 創建服務實例
    const serviceContext = createServiceContext(c.get('db'), {
      requestId: c.get('requestId')
    })

    const jwtService = new JWTService({
      ...serviceContext,
      jwtSecret: c.env.JWT_SECRET,
      cache: c.env.SESSION_KV
    })

    const validation = await jwtService.verifyAccessToken(token)

    // 檢查是否為管理員 token
    const isAdminToken = validation.valid && validation.payload?.type === 'admin'

    return c.json({
      success: true,
      message: validation.valid ? 'Token 有效' : 'Token 無效',
      data: {
        valid: validation.valid && isAdminToken,
        expired: validation.expired,
        isAdmin: isAdminToken,
        payload: validation.valid && isAdminToken ? validation.payload : null,
        error: validation.error || (!isAdminToken ? '非管理員令牌' : undefined)
      },
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId')
    })

  } catch (error: any) {
    console.error('Admin token verification error:', error)
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '服務器內部錯誤',
        timestamp: new Date().toISOString(),
        requestId: c.get('requestId')
      }
    }, 500)
  }
})