/**
 * 會員認證服務
 * 負責會員註冊、登入、密碼管理等認證相關功能
 */

import { eq, and } from 'drizzle-orm'
import { BaseService, ServiceContext, ServiceResponse } from '@/shared/services/baseService'
import { JWTService, TokenPair } from '@/services/auth/jwtService'
import { 
  customers, 
  customerSessions, 
  customerActivityLogs,
  Customer,
  NewCustomer, 
  NewCustomerSession,
  NewCustomerActivityLog 
} from '@/core/database/schema'

// 會員註冊請求
export interface MemberRegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  birthDate?: string
  gender?: 'male' | 'female' | 'other'
  marketingOptIn?: boolean
  referralCode?: string
}

// 會員登入請求
export interface MemberLoginRequest {
  email: string
  password: string
  deviceInfo?: {
    deviceId?: string
    deviceName?: string
    userAgent?: string
  }
}

// 認證響應
export interface AuthResponse {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    displayName: string | null
    avatar: string | null
    tier: string
    status: string
    memberTier: string
    memberStatus: string
    loyaltyPoints: number
    totalSpent: number
    emailVerified: boolean
    phoneVerified: boolean
    preferences: any
  }
  tokens: TokenPair
  session: {
    sessionId: string
    expiresAt: string
  }
}

// 密碼重設請求
export interface PasswordResetRequest {
  email: string
}

export interface PasswordResetConfirmRequest {
  token: string
  newPassword: string
}

/**
 * 會員認證服務類
 */
export class MemberAuthService extends BaseService {
  private jwtService: JWTService
  private cache: KVNamespace

  constructor(context: ServiceContext & { jwtService: JWTService; cache: KVNamespace }) {
    super(context)
    this.jwtService = context.jwtService
    this.cache = context.cache
  }

  /**
   * 會員註冊
   */
  async register(request: MemberRegisterRequest, ipAddress?: string): Promise<ServiceResponse<AuthResponse>> {
    try {
      // 驗證必填欄位
      const validation = this.validateRequired(request, ['email', 'password', 'firstName', 'lastName'])
      if (validation) return validation

      // 檢查 email 格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(request.email)) {
        return this.error('無效的電子郵件格式')
      }

      // 檢查密碼強度
      const { checkPasswordStrength } = await import('@/utils/security')
      const passwordStrength = checkPasswordStrength(request.password, {
        email: request.email,
        firstName: request.firstName,
        lastName: request.lastName
      })

      if (!passwordStrength.isStrong) {
        return this.error('密碼強度不足', passwordStrength.issues.map(issue => ({
          field: 'password',
          message: issue,
          code: 'WEAK_PASSWORD'
        })))
      }

      // 檢查 email 是否已存在
      const existingCustomer = await this.db
        .select()
        .from(customers)
        .where(eq(customers.email, request.email.toLowerCase()))
        .limit(1)

      if (existingCustomer.length > 0) {
        return this.error('此電子郵件已被註冊')
      }

      // 處理推薦碼
      let referredBy: string | null = null
      if (request.referralCode) {
        const referrer = await this.db
          .select({ customerId: customers.customerId })
          .from(customers)
          .where(eq(customers.referralCode, request.referralCode))
          .limit(1)

        if (referrer.length > 0) {
          referredBy = referrer[0].customerId
        }
      }

      // 密碼加密
      const passwordHash = await this.hashPassword(request.password)

      // 創建新會員
      const customerId = this.generateId('cust')
      const displayName = `${request.firstName} ${request.lastName}`

      const newCustomer: NewCustomer = {
        customerId,
        email: request.email.toLowerCase(),
        passwordHash,
        firstName: request.firstName,
        lastName: request.lastName,
        displayName,
        phone: request.phone,
        birthDate: request.birthDate,
        gender: request.gender,
        marketingOptIn: request.marketingOptIn || false,
        referredBy,
        status: 'active',
        tier: 'bronze',
        registrationSource: 'website',
        referralCode: this.generateReferralCode()
      }

      await this.db.insert(customers).values(newCustomer)

      // 創建會話和 Token
      const authResult = await this.createUserSession(customerId, {
        deviceId: request.deviceInfo?.deviceId,
        deviceName: request.deviceInfo?.deviceName,
        userAgent: request.deviceInfo?.userAgent,
        ipAddress
      })

      if (!authResult.success || !authResult.data) {
        return this.error('會話創建失敗')
      }

      // 記錄活動日誌
      await this.logActivity(customerId, authResult.data.session.sessionId, 'REGISTER', {
        registrationSource: 'website',
        referralCode: request.referralCode,
        ipAddress
      })

      // 發送驗證郵件 (這裡應該整合郵件服務)
      // await this.sendVerificationEmail(request.email)

      this.logAction('MEMBER_REGISTERED', `customer:${customerId}`, null, {
        email: request.email,
        registrationSource: 'website'
      })

      return this.success(authResult.data, '註冊成功')

    } catch (error: any) {
      return this.handleDbError(error)
    }
  }

  /**
   * 會員登入
   */
  async login(request: MemberLoginRequest, ipAddress?: string): Promise<ServiceResponse<AuthResponse>> {
    try {
      // 驗證必填欄位
      const validation = this.validateRequired(request, ['email', 'password'])
      if (validation) return validation

      // 查找用戶
      const customer = await this.db
        .select()
        .from(customers)
        .where(and(
          eq(customers.email, request.email.toLowerCase()),
          eq(customers.status, 'active')
        ))
        .limit(1)

      if (customer.length === 0) {
        // 記錄失敗嘗試
        await this.logFailedLogin(request.email, 'USER_NOT_FOUND', ipAddress)
        return this.error('電子郵件或密碼錯誤')
      }

      const user = customer[0]

      // 檢查密碼
      const isPasswordValid = await this.verifyPassword(request.password, user.passwordHash)
      if (!isPasswordValid) {
        // 記錄失敗嘗試
        await this.logFailedLogin(request.email, 'INVALID_PASSWORD', ipAddress)
        return this.error('電子郵件或密碼錯誤')
      }

      // 檢查用戶狀態
      if (user.status === 'suspended') {
        return this.error('帳號已被暫停，請聯繫客服')
      }

      // 創建會話和 Token
      const authResult = await this.createUserSession(user.customerId, {
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
        .update(customers)
        .set({
          lastLoginAt: new Date().toISOString(),
          lastLoginIp: ipAddress,
          loginCount: user.loginCount + 1,
          updatedAt: new Date().toISOString()
        })
        .where(eq(customers.customerId, user.customerId))

      // 記錄活動日誌
      await this.logActivity(user.customerId, authResult.data.session.sessionId, 'LOGIN', {
        ipAddress,
        deviceInfo: request.deviceInfo
      })

      this.logAction('MEMBER_LOGIN', `customer:${user.customerId}`, null, {
        email: request.email,
        ipAddress
      })

      return this.success(authResult.data, '登入成功')

    } catch (error: any) {
      return this.handleDbError(error)
    }
  }

  /**
   * 登出
   */
  async logout(userId: string, sessionId: string): Promise<ServiceResponse> {
    try {
      // 撤銷會話中的所有 Token
      await this.revokeSession(sessionId)

      // 記錄活動日誌
      await this.logActivity(userId, sessionId, 'LOGOUT')

      this.logAction('MEMBER_LOGOUT', `customer:${userId}`, null, { sessionId })

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
        this.logAction('TOKEN_REFRESHED', null, null, { hasNewTokens: true })
      }

      return result

    } catch (error: any) {
      this.logger.error('Token refresh failed', {
        error: error.message,
        requestId: this.context?.requestId
      })
      return this.error('Token 刷新失敗')
    }
  }

  /**
   * 忘記密碼
   */
  async forgotPassword(request: PasswordResetRequest): Promise<ServiceResponse> {
    try {
      const customer = await this.db
        .select()
        .from(customers)
        .where(and(
          eq(customers.email, request.email.toLowerCase()),
          eq(customers.status, 'active')
        ))
        .limit(1)

      // 無論用戶是否存在，都返回成功（安全考量）
      if (customer.length === 0) {
        return this.success(null, '如果該電子郵件已註冊，您將收到密碼重設指示')
      }

      const user = customer[0]

      // 生成重設 Token
      const resetToken = this.generateId('reset')
      const resetTokenKey = `password_reset:${resetToken}`
      
      // 在 KV 中存儲重設 Token (1小時有效)
      await this.cache.put(resetTokenKey, user.customerId, {
        expirationTtl: 60 * 60 // 1 hour
      })

      // 發送重設郵件 (這裡應該整合郵件服務)
      // await this.sendPasswordResetEmail(user.email, resetToken)

      // 記錄活動日誌
      await this.logActivity(user.customerId, null, 'PASSWORD_RESET_REQUESTED')

      this.logAction('PASSWORD_RESET_REQUESTED', `customer:${user.customerId}`)

      return this.success(null, '如果該電子郵件已註冊，您將收到密碼重設指示')

    } catch (error: any) {
      return this.handleDbError(error)
    }
  }

  /**
   * 確認密碼重設
   */
  async resetPassword(request: PasswordResetConfirmRequest): Promise<ServiceResponse> {
    try {
      // 驗證重設 Token
      const resetTokenKey = `password_reset:${request.token}`
      const userId = await this.cache.get(resetTokenKey)

      if (!userId) {
        return this.error('無效或已過期的重設令牌')
      }

      // 驗證新密碼
      if (request.newPassword.length < 8) {
        return this.error('密碼長度至少需要 8 個字符')
      }

      // 更新密碼
      const passwordHash = await this.hashPassword(request.newPassword)
      
      await this.db
        .update(customers)
        .set({
          passwordHash,
          passwordChangedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .where(eq(customers.customerId, userId))

      // 刪除重設 Token
      await this.cache.delete(resetTokenKey)

      // 撤銷該用戶所有 Token
      await this.jwtService.revokeAllUserTokens(userId)

      // 記錄活動日誌
      await this.logActivity(userId, null, 'PASSWORD_RESET_COMPLETED')

      this.logAction('PASSWORD_RESET_COMPLETED', `customer:${userId}`)

      return this.success(null, '密碼重設成功，請使用新密碼登入')

    } catch (error: any) {
      return this.handleDbError(error)
    }
  }

  /**
   * 獲取用戶資料
   */
  async getProfile(userId: string): Promise<ServiceResponse<Customer>> {
    try {
      const customer = await this.db
        .select()
        .from(customers)
        .where(eq(customers.customerId, userId))
        .limit(1)

      if (customer.length === 0) {
        return this.error('用戶不存在')
      }

      // 移除敏感信息
      const { passwordHash, ...safeCustomer } = customer[0]

      return this.success(safeCustomer as Customer)

    } catch (error: any) {
      return this.handleDbError(error)
    }
  }

  /**
   * 創建用戶會話
   */
  private async createUserSession(
    userId: string, 
    deviceInfo: {
      deviceId?: string
      deviceName?: string
      userAgent?: string
      ipAddress?: string
    } = {}
  ): Promise<ServiceResponse<AuthResponse>> {
    try {
      // 獲取完整用戶信息
      const customer = await this.db
        .select()
        .from(customers)
        .where(eq(customers.customerId, userId))
        .limit(1)

      if (customer.length === 0) {
        return this.error('用戶不存在')
      }

      const user = customer[0]

      // 創建會話記錄
      const sessionId = this.generateId('sess')
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days

      const sessionData: NewCustomerSession = {
        sessionId,
        customerId: userId,
        tokenHash: '', // 將在生成 token 後更新
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName,
        userAgent: deviceInfo.userAgent,
        ipAddress: deviceInfo.ipAddress,
        expiresAt,
        isActive: true
      }

      await this.db.insert(customerSessions).values(sessionData)

      // 生成 JWT Token
      const tokenResult = await this.jwtService.generateTokenPair({
        sub: userId,
        email: user.email,
        type: 'member',
        sessionId,
        memberTier: user.tier,
        memberStatus: user.status
      })

      if (!tokenResult.success || !tokenResult.data) {
        return this.error('Token 生成失敗')
      }

      // 更新會話的 token hash
      const tokenHash = await this.generateTokenHash(tokenResult.data.accessToken)
      await this.db
        .update(customerSessions)
        .set({ tokenHash })
        .where(eq(customerSessions.sessionId, sessionId))

      // 記錄用戶會話到 JWT 服務
      await this.jwtService.recordUserSession(userId, sessionId)

      // 構建響應
      const authResponse: AuthResponse = {
        user: {
          id: user.customerId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          displayName: user.displayName,
          avatar: user.avatar,
          tier: user.tier,
          status: user.status,
          memberTier: user.tier,
          memberStatus: user.status,
          loyaltyPoints: user.loyaltyPoints,
          totalSpent: user.totalSpent,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
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
   * 撤銷會話
   */
  private async revokeSession(sessionId: string): Promise<void> {
    try {
      // 停用會話
      await this.db
        .update(customerSessions)
        .set({
          isActive: false,
          revokedAt: new Date().toISOString()
        })
        .where(eq(customerSessions.sessionId, sessionId))

      // 從 JWT 服務撤銷相關 Token
      // 這裡需要根據 sessionId 找到對應的 refresh token 並撤銷
      
    } catch (error: any) {
      this.logger.error('Session revocation failed', {
        error: error.message,
        sessionId
      })
    }
  }

  /**
   * 記錄用戶活動
   */
  private async logActivity(
    userId: string,
    sessionId: string | null,
    action: string,
    metadata?: any
  ): Promise<void> {
    try {
      const activityLog: NewCustomerActivityLog = {
        logId: this.generateId('cal'),
        customerId: userId,
        sessionId,
        action,
        category: 'auth',
        description: `User performed ${action}`,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ipAddress: metadata?.ipAddress
      }

      await this.db.insert(customerActivityLogs).values(activityLog)
    } catch (error: any) {
      this.logger.error('Failed to log customer activity', {
        error: error.message,
        userId,
        action
      })
    }
  }

  /**
   * 記錄登入失敗
   */
  private async logFailedLogin(email: string, reason: string, ipAddress?: string): Promise<void> {
    try {
      // 這裡可以記錄到安全日誌表或使用外部監控服務
      this.logger.warn('Failed login attempt', {
        email,
        reason,
        ipAddress,
        timestamp: new Date().toISOString()
      })
      
      // 可以實現登入失敗次數限制邏輯
      const failureKey = `login_failures:${email}`
      const failures = await this.cache.get(failureKey) || '0'
      const failureCount = parseInt(failures) + 1
      
      if (failureCount >= 5) {
        // 臨時鎖定帳戶或 IP
        const lockKey = `account_locked:${email}`
        await this.cache.put(lockKey, 'true', { expirationTtl: 15 * 60 }) // 15分鐘
      }
      
      await this.cache.put(failureKey, failureCount.toString(), { expirationTtl: 60 * 60 }) // 1小時
      
    } catch (error: any) {
      this.logger.error('Failed to log login failure', {
        error: error.message,
        email
      })
    }
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
   * 生成推薦碼
   */
  private generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
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