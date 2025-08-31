/**
 * 認證狀態管理 - Zustand Store
 */

import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import type { User, AuthTokens, LoginCredentials, RegisterData } from '@/types'
import { config } from '@/config'

export interface AuthState {
  // 狀態
  user: User | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  updateUser: (user: Partial<User>) => void
  clearError: () => void
  
  // Initialization
  initAuth: () => Promise<void>
  checkAuthStatus: () => Promise<boolean>
  
  // Token management
  setTokens: (tokens: AuthTokens) => void
  clearTokens: () => void
  isTokenExpired: () => boolean
}

// Auth API (這裡是模擬，實際應該調用真實 API)
const authAPI = {
  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    // 模擬 API 延遲
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 模擬登錄驗證
    if (credentials.email === 'admin@mickeyshop.com' && credentials.password === 'password') {
      return {
        user: {
          id: '1',
          email: credentials.email,
          firstName: 'Mickey',
          lastName: 'Admin',
          role: 'admin',
          membershipLevel: 'diamond',
          isActive: true,
          emailVerified: true,
          phoneVerified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: 3600,
          tokenType: 'Bearer',
        },
      }
    }
    
    throw new Error('帳號或密碼錯誤')
  },
  
  async register(data: RegisterData): Promise<{ user: User; tokens: AuthTokens }> {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return {
      user: {
        id: '2',
        email: data.email,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        role: 'user',
        membershipLevel: 'bronze',
        isActive: true,
        emailVerified: false,
        phoneVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      tokens: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      },
    }
  },
  
  async verifyToken(token: string): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (token === 'mock-access-token') {
      return {
        id: '1',
        email: 'admin@mickeyshop.com',
        firstName: 'Mickey',
        lastName: 'Admin',
        role: 'admin',
        membershipLevel: 'diamond',
        isActive: true,
        emailVerified: true,
        phoneVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
    
    throw new Error('Token 無效')
  },
  
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return {
      accessToken: 'new-mock-access-token',
      refreshToken: 'new-mock-refresh-token',
      expiresIn: 3600,
      tokenType: 'Bearer',
    }
  },
}

export const useAuthStore = create<AuthState>()(
  devtools(
    subscribeWithSelector(
      persist(
        (set, get) => ({
          // 初始狀態
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,

          // 登錄
          login: async (credentials) => {
            set({ isLoading: true, error: null })
            
            try {
              const { user, tokens } = await authAPI.login(credentials)
              
              set({
                user,
                tokens,
                isAuthenticated: true,
                isLoading: false,
              })
              
              // 儲存 token 到 localStorage
              localStorage.setItem(config.security.tokenStorageKey, tokens.accessToken)
              
              console.log('✅ 登錄成功:', user.email)
            } catch (error) {
              const message = error instanceof Error ? error.message : '登錄失敗'
              set({
                error: message,
                isLoading: false,
                isAuthenticated: false,
                user: null,
                tokens: null,
              })
              
              console.error('❌ 登錄失敗:', message)
              throw error
            }
          },

          // 註冊
          register: async (data) => {
            set({ isLoading: true, error: null })
            
            try {
              const { user, tokens } = await authAPI.register(data)
              
              set({
                user,
                tokens,
                isAuthenticated: true,
                isLoading: false,
              })
              
              // 儲存 token 到 localStorage
              localStorage.setItem(config.security.tokenStorageKey, tokens.accessToken)
              
              console.log('✅ 註冊成功:', user.email)
            } catch (error) {
              const message = error instanceof Error ? error.message : '註冊失敗'
              set({
                error: message,
                isLoading: false,
                isAuthenticated: false,
                user: null,
                tokens: null,
              })
              
              console.error('❌ 註冊失敗:', message)
              throw error
            }
          },

          // 登出
          logout: () => {
            set({
              user: null,
              tokens: null,
              isAuthenticated: false,
              error: null,
            })
            
            // 清除 localStorage
            localStorage.removeItem(config.security.tokenStorageKey)
            
            console.log('👋 已登出')
          },

          // 刷新 Token
          refreshToken: async () => {
            const { tokens } = get()
            if (!tokens?.refreshToken) return
            
            try {
              const newTokens = await authAPI.refreshToken(tokens.refreshToken)
              
              set({ tokens: newTokens })
              
              // 更新 localStorage
              localStorage.setItem(config.security.tokenStorageKey, newTokens.accessToken)
              
              console.log('🔄 Token 已刷新')
            } catch (error) {
              console.error('❌ Token 刷新失敗:', error)
              get().logout()
            }
          },

          // 更新用戶信息
          updateUser: (userData) => {
            const { user } = get()
            if (!user) return
            
            const updatedUser = { ...user, ...userData }
            set({ user: updatedUser })
            
            console.log('👤 用戶信息已更新')
          },

          // 清除錯誤
          clearError: () => {
            set({ error: null })
          },

          // 初始化認證狀態
          initAuth: async () => {
            const token = localStorage.getItem(config.security.tokenStorageKey)
            if (!token) return
            
            set({ isLoading: true })
            
            try {
              const user = await authAPI.verifyToken(token)
              
              set({
                user,
                tokens: {
                  accessToken: token,
                  refreshToken: '',
                  expiresIn: 3600,
                  tokenType: 'Bearer',
                },
                isAuthenticated: true,
                isLoading: false,
              })
              
              console.log('✅ 認證狀態已恢復:', user.email)
            } catch (error) {
              console.error('❌ Token 驗證失敗:', error)
              localStorage.removeItem(config.security.tokenStorageKey)
              set({ isLoading: false })
            }
          },

          // 檢查認證狀態
          checkAuthStatus: async () => {
            const { tokens } = get()
            if (!tokens?.accessToken) return false
            
            try {
              await authAPI.verifyToken(tokens.accessToken)
              return true
            } catch (error) {
              get().logout()
              return false
            }
          },

          // Token 管理
          setTokens: (tokens) => {
            set({ tokens })
            localStorage.setItem(config.security.tokenStorageKey, tokens.accessToken)
          },

          clearTokens: () => {
            set({ tokens: null })
            localStorage.removeItem(config.security.tokenStorageKey)
          },

          isTokenExpired: () => {
            const { tokens } = get()
            if (!tokens) return true
            
            // 簡化的過期檢查 (實際應該檢查 JWT payload)
            const tokenAge = Date.now() - (tokens.expiresIn * 1000)
            return tokenAge > 0
          },
        }),
        {
          name: 'auth-store',
          partialize: (state) => ({
            user: state.user,
            tokens: state.tokens,
            isAuthenticated: state.isAuthenticated,
          }),
        }
      )
    ),
    { name: 'auth-store' }
  )
)