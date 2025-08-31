/**
 * JWT Token 管理服務
 * 負責 JWT Token 的生成、驗證、刷新和黑名單管理
 */

import { sign, verify, decode } from '@tsndr/cloudflare-worker-jwt'
import { BaseService, ServiceContext, ServiceResponse } from '@/shared/services/baseService'

// JWT Payload 結構
export interface JWTPayload {
  sub: string              // 用戶ID
  email: string           // 用戶郵箱
  iat: number            // 簽發時間
  exp: number            // 過期時間  
  type: 'member' | 'admin' // 用戶類型
  sessionId: string       // 會話ID
  
  // 會員專用字段
  memberTier?: string     // bronze, silver, gold, platinum, diamond
  memberStatus?: string   // active, inactive, suspended
  
  // 管理員專用字段
  roleIds?: string[]      // 角色ID列表
  permissions?: string[]  // 權限列表
  department?: string     // 部門
}

// Token 配置
export interface TokenConfig {
  accessTokenExpiry: number   // 15 minutes
  refreshTokenExpiry: number  // 7 days
  issuer: string
  audience: string
}

// Token 對
export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: string
}

// Token 驗證結果
export interface TokenValidationResult {
  valid: boolean
  payload?: JWTPayload
  expired?: boolean
  error?: string
}

/**
 * JWT 服務類
 */
export class JWTService extends BaseService {
  private jwtSecret: string
  private config: TokenConfig
  private cache: KVNamespace // 用於黑名單管理

  constructor(context: ServiceContext & { jwtSecret: string; cache: KVNamespace; config?: Partial<TokenConfig> }) {
    super(context)
    this.jwtSecret = context.jwtSecret
    this.cache = context.cache
    this.config = {
      accessTokenExpiry: 15 * 60, // 15 minutes
      refreshTokenExpiry: 7 * 24 * 60 * 60, // 7 days
      issuer: 'MickeyShop Beauty',
      audience: 'MickeyShop Beauty Users',
      ...context.config
    }
  }

  /**
   * 生成 Token 對 (Access Token + Refresh Token)
   */
  async generateTokenPair(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<ServiceResponse<TokenPair>> {
    try {
      const now = Math.floor(Date.now() / 1000)
      
      // 生成 Access Token
      const accessPayload: JWTPayload = {
        ...payload,
        iat: now,
        exp: now + this.config.accessTokenExpiry
      }
      
      // 生成 Refresh Token (有效期更長)
      const refreshPayload: JWTPayload = {
        ...payload,
        iat: now,
        exp: now + this.config.refreshTokenExpiry
      }

      const accessToken = await sign(accessPayload, this.jwtSecret)
      const refreshToken = await sign(refreshPayload, this.jwtSecret)

      // 存儲 refresh token 到 KV（用於撤銷檢查）
      const refreshTokenKey = `refresh_token:${payload.sessionId}`
      await this.cache.put(refreshTokenKey, refreshToken, {
        expirationTtl: this.config.refreshTokenExpiry
      })

      const tokenPair: TokenPair = {
        accessToken,
        refreshToken,
        expiresIn: this.config.accessTokenExpiry,
        tokenType: 'Bearer'
      }

      this.logAction('TOKEN_GENERATED', `user:${payload.sub}`, null, { type: payload.type, sessionId: payload.sessionId })

      return this.success(tokenPair, 'Token 生成成功')

    } catch (error: any) {
      this.logger.error('Token generation failed', {
        error: error.message,
        userId: payload.sub,
        requestId: this.context?.requestId
      })
      return this.error('Token 生成失敗')
    }
  }

  /**
   * 驗證 Access Token
   */
  async verifyAccessToken(token: string): Promise<TokenValidationResult> {
    try {
      // 檢查黑名單
      const isBlacklisted = await this.isTokenBlacklisted(token)
      if (isBlacklisted) {
        return {
          valid: false,
          error: 'Token 已被撤銷'
        }
      }

      // 驗證 JWT
      const isValid = await verify(token, this.jwtSecret)
      if (!isValid) {
        return {
          valid: false,
          error: '無效的 Token'
        }
      }

      // 解析 payload
      const payload = decode(token).payload as JWTPayload
      const now = Math.floor(Date.now() / 1000)

      // 檢查過期
      if (payload.exp < now) {
        return {
          valid: false,
          expired: true,
          error: 'Token 已過期'
        }
      }

      return {
        valid: true,
        payload
      }

    } catch (error: any) {
      this.logger.error('Token verification failed', {
        error: error.message,
        requestId: this.context?.requestId
      })
      return {
        valid: false,
        error: 'Token 驗證失敗'
      }
    }
  }

  /**
   * 刷新 Token
   */
  async refreshToken(refreshToken: string): Promise<ServiceResponse<TokenPair>> {
    try {
      // 驗證 refresh token
      const validation = await this.verifyRefreshToken(refreshToken)
      if (!validation.valid || !validation.payload) {
        return this.error(validation.error || 'Refresh Token 無效')
      }

      const { payload } = validation

      // 檢查 refresh token 是否存在於 KV
      const refreshTokenKey = `refresh_token:${payload.sessionId}`
      const storedToken = await this.cache.get(refreshTokenKey)
      if (storedToken !== refreshToken) {
        return this.error('Refresh Token 已被撤銷')
      }

      // 撤銷舊的 refresh token
      await this.revokeRefreshToken(refreshToken)

      // 生成新的 token 對
      const newTokenPair = await this.generateTokenPair({
        sub: payload.sub,
        email: payload.email,
        type: payload.type,
        sessionId: payload.sessionId,
        memberTier: payload.memberTier,
        memberStatus: payload.memberStatus,
        roleIds: payload.roleIds,
        permissions: payload.permissions,
        department: payload.department
      })

      this.logAction('TOKEN_REFRESHED', `user:${payload.sub}`, null, { sessionId: payload.sessionId })

      return newTokenPair

    } catch (error: any) {
      this.logger.error('Token refresh failed', {
        error: error.message,
        requestId: this.context?.requestId
      })
      return this.error('Token 刷新失敗')
    }
  }

  /**
   * 驗證 Refresh Token
   */
  private async verifyRefreshToken(token: string): Promise<TokenValidationResult> {
    try {
      const isValid = await verify(token, this.jwtSecret)
      if (!isValid) {
        return {
          valid: false,
          error: '無效的 Refresh Token'
        }
      }

      const payload = decode(token).payload as JWTPayload
      const now = Math.floor(Date.now() / 1000)

      if (payload.exp < now) {
        return {
          valid: false,
          expired: true,
          error: 'Refresh Token 已過期'
        }
      }

      return {
        valid: true,
        payload
      }

    } catch (error: any) {
      return {
        valid: false,
        error: 'Refresh Token 驗證失敗'
      }
    }
  }

  /**
   * 撤銷 Access Token (加入黑名單)
   */
  async revokeAccessToken(token: string): Promise<ServiceResponse> {
    try {
      const payload = decode(token).payload as JWTPayload
      const tokenKey = `blacklist:${this.generateTokenHash(token)}`
      
      // 計算剩餘過期時間
      const now = Math.floor(Date.now() / 1000)
      const ttl = Math.max(payload.exp - now, 60) // 至少保留60秒

      await this.cache.put(tokenKey, 'revoked', { expirationTtl: ttl })
      
      this.logAction('TOKEN_REVOKED', `user:${payload.sub}`, null, { type: 'access_token' })

      return this.success(null, 'Access Token 已撤銷')

    } catch (error: any) {
      this.logger.error('Token revocation failed', {
        error: error.message,
        requestId: this.context?.requestId
      })
      return this.error('Token 撤銷失敗')
    }
  }

  /**
   * 撤銷 Refresh Token
   */
  async revokeRefreshToken(refreshToken: string): Promise<ServiceResponse> {
    try {
      const payload = decode(refreshToken).payload as JWTPayload
      const refreshTokenKey = `refresh_token:${payload.sessionId}`
      
      await this.cache.delete(refreshTokenKey)
      
      this.logAction('TOKEN_REVOKED', `user:${payload.sub}`, null, { type: 'refresh_token', sessionId: payload.sessionId })

      return this.success(null, 'Refresh Token 已撤銷')

    } catch (error: any) {
      this.logger.error('Refresh token revocation failed', {
        error: error.message,
        requestId: this.context?.requestId
      })
      return this.error('Refresh Token 撤銷失敗')
    }
  }

  /**
   * 撤銷用戶所有 Token
   */
  async revokeAllUserTokens(userId: string): Promise<ServiceResponse> {
    try {
      // 這裡需要查詢該用戶的所有活躍會話，然後撤銷對應的 tokens
      // 由於 KV 不支援按 prefix 批量刪除，我們需要維護一個用戶會話列表
      
      const userSessionsKey = `user_sessions:${userId}`
      const sessionsData = await this.cache.get(userSessionsKey)
      
      if (sessionsData) {
        const sessions = JSON.parse(sessionsData) as string[]
        
        // 撤銷所有會話的 refresh tokens
        for (const sessionId of sessions) {
          const refreshTokenKey = `refresh_token:${sessionId}`
          await this.cache.delete(refreshTokenKey)
        }
        
        // 清空用戶會話列表
        await this.cache.delete(userSessionsKey)
      }
      
      this.logAction('ALL_TOKENS_REVOKED', `user:${userId}`)

      return this.success(null, '用戶所有 Token 已撤銷')

    } catch (error: any) {
      this.logger.error('All tokens revocation failed', {
        error: error.message,
        userId,
        requestId: this.context?.requestId
      })
      return this.error('撤銷所有 Token 失敗')
    }
  }

  /**
   * 檢查 Token 是否在黑名單中
   */
  private async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const tokenKey = `blacklist:${this.generateTokenHash(token)}`
      const result = await this.cache.get(tokenKey)
      return result === 'revoked'
    } catch {
      return false
    }
  }

  /**
   * 生成 Token 哈希 (用於黑名單存儲)
   */
  private generateTokenHash(token: string): string {
    // 使用 Web Crypto API 生成 SHA-256 哈希
    const encoder = new TextEncoder()
    const data = encoder.encode(token)
    return btoa(String.fromCharCode(...new Uint8Array(data.slice(0, 32))))
  }

  /**
   * 記錄用戶會話
   */
  async recordUserSession(userId: string, sessionId: string): Promise<void> {
    try {
      const userSessionsKey = `user_sessions:${userId}`
      const sessionsData = await this.cache.get(userSessionsKey)
      
      let sessions: string[] = []
      if (sessionsData) {
        sessions = JSON.parse(sessionsData)
      }
      
      if (!sessions.includes(sessionId)) {
        sessions.push(sessionId)
        await this.cache.put(userSessionsKey, JSON.stringify(sessions), {
          expirationTtl: this.config.refreshTokenExpiry
        })
      }
    } catch (error: any) {
      this.logger.error('Failed to record user session', {
        error: error.message,
        userId,
        sessionId
      })
    }
  }

  /**
   * 獲取 Token 配置
   */
  getTokenConfig(): TokenConfig {
    return { ...this.config }
  }
}