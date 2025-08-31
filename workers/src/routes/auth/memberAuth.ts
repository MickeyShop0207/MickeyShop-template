/**
 * 會員認證 API 路由
 * 路徑前綴: /api/v1/auth
 */

import { Hono } from 'hono'
import type { Env } from '../../index'
import { MemberAuthService, MemberRegisterRequest, MemberLoginRequest, PasswordResetRequest, PasswordResetConfirmRequest } from '@/services/auth/memberAuthService'
import { JWTService } from '@/services/auth/jwtService'
import { authenticateToken, fullAuth } from '@/middlewares/auth'
import { createServiceContext } from '@/shared/services/baseService'
import { rateLimitMiddleware } from '@/middlewares/rateLimit'

export const memberAuthRoutes = new Hono<{ Bindings: Env }>()

/**
 * POST /auth/register - 會員註冊
 */
memberAuthRoutes.post('/register', rateLimitMiddleware({ requests: 5, windowMs: 15 * 60 * 1000 }), async (c) => {
  try {
    const request = await c.req.json() as MemberRegisterRequest
    const ipAddress = c.req.header('CF-Connecting-IP') || 'unknown'

    // 創建服務實例
    const serviceContext = createServiceContext(c.get('db'), {
      requestId: c.get('requestId')
    })

    const jwtService = new JWTService({
      ...serviceContext,
      jwtSecret: c.env.JWT_SECRET,
      cache: c.env.SESSION_KV
    })

    const authService = new MemberAuthService({
      ...serviceContext,
      jwtService,
      cache: c.env.CACHE_KV
    })

    const result = await authService.register(request, ipAddress)

    if (!result.success) {
      return c.json({
        success: false,
        error: {
          code: 'REGISTRATION_FAILED',
          message: result.message || '註冊失敗',
          errors: result.errors,
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId')
        }
      }, 400)
    }

    return c.json({
      success: true,
      message: result.message,
      data: result.data,
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId')
    }, 201)

  } catch (error: any) {
    console.error('Registration error:', error)
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
 * POST /auth/login - 會員登入
 */
memberAuthRoutes.post('/login', rateLimitMiddleware({ requests: 10, windowMs: 15 * 60 * 1000 }), async (c) => {
  try {
    const request = await c.req.json() as MemberLoginRequest
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

    const authService = new MemberAuthService({
      ...serviceContext,
      jwtService,
      cache: c.env.CACHE_KV
    })

    const result = await authService.login(request, ipAddress)

    if (!result.success) {
      return c.json({
        success: false,
        error: {
          code: 'LOGIN_FAILED',
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
    console.error('Login error:', error)
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
 * POST /auth/logout - 會員登出
 */
memberAuthRoutes.post('/logout', authenticateToken(), async (c) => {
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

    const authService = new MemberAuthService({
      ...serviceContext,
      jwtService,
      cache: c.env.CACHE_KV
    })

    const result = await authService.logout(user.id, user.sessionId)

    if (!result.success) {
      return c.json({
        success: false,
        error: {
          code: 'LOGOUT_FAILED',
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
    console.error('Logout error:', error)
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
memberAuthRoutes.post('/refresh', rateLimitMiddleware({ requests: 20, windowMs: 15 * 60 * 1000 }), async (c) => {
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

    const authService = new MemberAuthService({
      ...serviceContext,
      jwtService,
      cache: c.env.CACHE_KV
    })

    const result = await authService.refreshToken(refreshToken)

    if (!result.success) {
      return c.json({
        success: false,
        error: {
          code: 'TOKEN_REFRESH_FAILED',
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
    console.error('Token refresh error:', error)
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
 * POST /auth/forgot-password - 忘記密碼
 */
memberAuthRoutes.post('/forgot-password', rateLimitMiddleware({ requests: 3, windowMs: 15 * 60 * 1000 }), async (c) => {
  try {
    const request = await c.req.json() as PasswordResetRequest

    // 創建服務實例
    const serviceContext = createServiceContext(c.get('db'), {
      requestId: c.get('requestId')
    })

    const jwtService = new JWTService({
      ...serviceContext,
      jwtSecret: c.env.JWT_SECRET,
      cache: c.env.SESSION_KV
    })

    const authService = new MemberAuthService({
      ...serviceContext,
      jwtService,
      cache: c.env.CACHE_KV
    })

    const result = await authService.forgotPassword(request)

    // 無論成功或失敗都返回相同訊息（安全考量）
    return c.json({
      success: true,
      message: result.message || '如果該電子郵件已註冊，您將收到密碼重設指示',
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId')
    })

  } catch (error: any) {
    console.error('Forgot password error:', error)
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
 * POST /auth/reset-password - 重設密碼
 */
memberAuthRoutes.post('/reset-password', rateLimitMiddleware({ requests: 5, windowMs: 15 * 60 * 1000 }), async (c) => {
  try {
    const request = await c.req.json() as PasswordResetConfirmRequest

    // 創建服務實例
    const serviceContext = createServiceContext(c.get('db'), {
      requestId: c.get('requestId')
    })

    const jwtService = new JWTService({
      ...serviceContext,
      jwtSecret: c.env.JWT_SECRET,
      cache: c.env.SESSION_KV
    })

    const authService = new MemberAuthService({
      ...serviceContext,
      jwtService,
      cache: c.env.CACHE_KV
    })

    const result = await authService.resetPassword(request)

    if (!result.success) {
      return c.json({
        success: false,
        error: {
          code: 'PASSWORD_RESET_FAILED',
          message: result.message || '密碼重設失敗',
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
    console.error('Password reset error:', error)
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
 * GET /auth/profile - 獲取用戶資料
 */
memberAuthRoutes.get('/profile', fullAuth(), async (c) => {
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

    const authService = new MemberAuthService({
      ...serviceContext,
      jwtService,
      cache: c.env.CACHE_KV
    })

    const result = await authService.getProfile(user.id)

    if (!result.success) {
      return c.json({
        success: false,
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: result.message || '用戶資料不存在',
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId')
        }
      }, 404)
    }

    return c.json({
      success: true,
      message: '用戶資料獲取成功',
      data: result.data,
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId')
    })

  } catch (error: any) {
    console.error('Get profile error:', error)
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
 * GET /auth/me - 獲取當前用戶基本信息（無需數據庫查詢）
 */
memberAuthRoutes.get('/me', authenticateToken(), async (c) => {
  try {
    const user = c.get('user')

    return c.json({
      success: true,
      message: '用戶信息獲取成功',
      data: {
        id: user.id,
        email: user.email,
        type: user.type,
        memberTier: user.memberTier,
        memberStatus: user.memberStatus,
        tokenExpiry: user.tokenPayload.exp
      },
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId')
    })

  } catch (error: any) {
    console.error('Get me error:', error)
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
 * POST /auth/verify-token - 驗證 Token 有效性
 */
memberAuthRoutes.post('/verify-token', async (c) => {
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

    return c.json({
      success: true,
      message: validation.valid ? 'Token 有效' : 'Token 無效',
      data: {
        valid: validation.valid,
        expired: validation.expired,
        payload: validation.valid ? validation.payload : null,
        error: validation.error
      },
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId')
    })

  } catch (error: any) {
    console.error('Token verification error:', error)
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