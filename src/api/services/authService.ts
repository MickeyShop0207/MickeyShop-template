// 認證 API 服務
import { apiClient } from '../index'
import type { 
  User, 
  AdminUser, 
  AuthResponse, 
  DeviceInfo 
} from '../types'

// 登錄請求參數
export interface LoginRequest {
  email: string
  password: string
  deviceInfo?: DeviceInfo
}

// 註冊請求參數
export interface RegisterRequest {
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

// 重設密碼請求參數
export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

// 修改密碼請求參數
export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

// 管理員登錄請求參數
export interface AdminLoginRequest {
  username: string
  password: string
  deviceInfo?: DeviceInfo
  twoFactorCode?: string
}

// 權限驗證請求參數
export interface VerifyPermissionRequest {
  permissions: string[]
  requireAll?: boolean
}

export class AuthService {
  private readonly baseUrl = '/api/v1/auth'
  private readonly adminBaseUrl = '/api/admin/v1/auth'

  // ===================
  // 會員認證 API
  // ===================

  /**
   * 會員註冊
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(`${this.baseUrl}/register`, data)
  }

  /**
   * 會員登錄
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(`${this.baseUrl}/login`, data)
    
    // 保存 token 和用戶信息到 localStorage
    if (response.tokens) {
      localStorage.setItem('accessToken', response.tokens.accessToken)
      localStorage.setItem('refreshToken', response.tokens.refreshToken)
      localStorage.setItem('user', JSON.stringify(response.user))
    }
    
    return response
  }

  /**
   * 刷新 Token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(`${this.baseUrl}/refresh`, {
      refreshToken
    })
  }

  /**
   * 獲取用戶資料
   */
  async getProfile(): Promise<User> {
    return apiClient.get<User>(`${this.baseUrl}/profile`)
  }

  /**
   * 更新用戶資料
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    return apiClient.put<User>(`${this.baseUrl}/profile`, data)
  }

  /**
   * 忘記密碼
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.baseUrl}/forgot-password`, {
      email
    })
  }

  /**
   * 重設密碼
   */
  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.baseUrl}/reset-password`, data)
  }

  /**
   * 修改密碼
   */
  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    return apiClient.put<{ message: string }>(`${this.baseUrl}/change-password`, data)
  }

  /**
   * 發送郵箱驗證碼
   */
  async sendEmailVerification(): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.baseUrl}/send-verification`)
  }

  /**
   * 驗證郵箱
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.baseUrl}/verify-email`, {
      token
    })
  }

  /**
   * 登出
   */
  async logout(): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>(`${this.baseUrl}/logout`)
      
      // 清除本地存儲
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      
      return response
    } catch (error) {
      // 即使請求失敗，也要清除本地存儲
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      throw error
    }
  }

  // ===================
  // 管理員認證 API
  // ===================

  /**
   * 管理員登錄
   */
  async adminLogin(data: AdminLoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(`${this.adminBaseUrl}/login`, data)
    
    // 保存 token 和用戶信息到 localStorage
    if (response.tokens) {
      localStorage.setItem('accessToken', response.tokens.accessToken)
      localStorage.setItem('refreshToken', response.tokens.refreshToken)
      localStorage.setItem('user', JSON.stringify(response.user))
      localStorage.setItem('isAdmin', 'true')
    }
    
    return response
  }

  /**
   * 獲取管理員資料
   */
  async getAdminProfile(): Promise<AdminUser> {
    return apiClient.get<AdminUser>(`${this.adminBaseUrl}/profile`)
  }

  /**
   * 獲取管理員權限
   */
  async getPermissions(): Promise<{
    permissions: string[]
    roles: string[]
    department: string
  }> {
    return apiClient.get<{
      permissions: string[]
      roles: string[]
      department: string
    }>(`${this.adminBaseUrl}/permissions`)
  }

  /**
   * 驗證權限
   */
  async verifyPermission(data: VerifyPermissionRequest): Promise<{
    hasPermission: boolean
    missingPermissions: string[]
  }> {
    return apiClient.post<{
      hasPermission: boolean
      missingPermissions: string[]
    }>(`${this.adminBaseUrl}/verify-permission`, data)
  }

  /**
   * 管理員修改密碼
   */
  async adminChangePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    return apiClient.put<{ message: string }>(`${this.adminBaseUrl}/change-password`, data)
  }

  /**
   * 管理員登出
   */
  async adminLogout(): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>(`${this.adminBaseUrl}/logout`)
      
      // 清除本地存儲
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      localStorage.removeItem('isAdmin')
      
      return response
    } catch (error) {
      // 即使請求失敗，也要清除本地存儲
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      localStorage.removeItem('isAdmin')
      throw error
    }
  }

  // ===================
  // 工具方法
  // ===================

  /**
   * 檢查是否已登錄
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken')
  }

  /**
   * 檢查是否為管理員
   */
  isAdmin(): boolean {
    return localStorage.getItem('isAdmin') === 'true'
  }

  /**
   * 獲取當前用戶
   */
  getCurrentUser(): User | AdminUser | null {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  }

  /**
   * 獲取訪問 Token
   */
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken')
  }

  /**
   * 獲取刷新 Token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken')
  }

  /**
   * 清除所有認證信息
   */
  clearAuth(): void {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    localStorage.removeItem('isAdmin')
  }
}

// 導出服務實例
export const authService = new AuthService()