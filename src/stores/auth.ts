/**
 * 認證狀態管理 - Zustand Store
 * 支持 JWT Token 管理和 RBAC 權限控制
 */

import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import type { 
  User, 
  AdminUser, 
  AuthTokens, 
  LoginCredentials, 
  RegisterData,
  JWTPayload,
  Permission,
  AdminRole,
  PermissionCheck
} from '@/types'
import { authService } from '@/api/services/authService'
import { 
  parseJWTPayload, 
  isTokenExpired, 
  checkPermission, 
  getPermissionsByRoles,
  isAdmin,
  isSuperAdmin
} from '@/utils/routeGuard'
import { config } from '@/config'

export interface AuthState {
  // 基礎狀態
  user: User | AdminUser | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // JWT 和權限狀態
  jwtPayload: JWTPayload | null
  permissions: Permission[]
  roles: AdminRole[]
  
  // 基礎認證 Actions
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  updateUser: (user: Partial<User>) => void
  clearError: () => void
  
  // 管理員認證 Actions
  adminLogin: (credentials: LoginCredentials) => Promise<void>
  adminLogout: () => void
  
  // 初始化
  initAuth: () => Promise<void>
  checkAuthStatus: () => Promise<boolean>
  
  // Token 管理
  setTokens: (tokens: AuthTokens) => void
  clearTokens: () => void
  isTokenExpired: () => boolean
  parseTokenPayload: () => JWTPayload | null
  
  // 權限檢查
  hasPermission: (permissions: Permission[], requireAll?: boolean) => boolean
  hasRole: (roles: AdminRole[]) => boolean
  checkPermission: (check: PermissionCheck) => boolean
  isAdmin: () => boolean
  isSuperAdmin: () => boolean
  getAccessibleMenus: () => string[]
  
  // 會話管理
  refreshTokenAutomatic: () => Promise<void>
  startTokenRefreshTimer: () => void
  stopTokenRefreshTimer: () => void
}

// Token 自動刷新計時器
let tokenRefreshTimer: NodeJS.Timeout | null = null

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
          jwtPayload: null,
          permissions: [],
          roles: [],

          // 會員登錄
          login: async (credentials) => {
            set({ isLoading: true, error: null })
            
            try {
              const response = await authService.login({
                email: credentials.email,
                password: credentials.password,
                deviceInfo: {
                  userAgent: navigator.userAgent,
                  platform: navigator.platform
                }
              })
              
              const payload = parseJWTPayload(response.tokens.accessToken)
              const permissions = payload?.permissions || []
              const roles = payload?.roles || []
              
              set({
                user: response.user,
                tokens: response.tokens,
                jwtPayload: payload,
                permissions,
                roles,
                isAuthenticated: true,
                isLoading: false,
                error: null
              })
              
              // 啟動 Token 自動刷新
              get().startTokenRefreshTimer()
              
              console.log('✅ 會員登錄成功:', response.user.email)
            } catch (error) {
              const message = error instanceof Error ? error.message : '登錄失敗'
              set({
                error: message,
                isLoading: false,
                isAuthenticated: false,
                user: null,
                tokens: null,
                jwtPayload: null,
                permissions: [],
                roles: []
              })
              
              console.error('❌ 會員登錄失敗:', message)
              throw error
            }
          },

          // 會員註冊
          register: async (data) => {
            set({ isLoading: true, error: null })
            
            try {
              const response = await authService.register({
                email: data.email,
                password: data.password,
                firstName: data.firstName || '',
                lastName: data.lastName || ''
              })
              
              const payload = parseJWTPayload(response.tokens.accessToken)
              
              set({
                user: response.user,
                tokens: response.tokens,
                jwtPayload: payload,
                permissions: [],
                roles: [],
                isAuthenticated: true,
                isLoading: false,
                error: null
              })
              
              console.log('✅ 會員註冊成功:', response.user.email)
            } catch (error) {
              const message = error instanceof Error ? error.message : '註冊失敗'
              set({
                error: message,
                isLoading: false,
                isAuthenticated: false,
                user: null,
                tokens: null,
                jwtPayload: null,
                permissions: [],
                roles: []
              })
              
              console.error('❌ 會員註冊失敗:', message)
              throw error
            }
          },

          // 管理員登錄
          adminLogin: async (credentials) => {
            set({ isLoading: true, error: null })
            
            try {
              const response = await authService.adminLogin({
                username: credentials.email,
                password: credentials.password,
                deviceInfo: {
                  userAgent: navigator.userAgent,
                  platform: navigator.platform
                }
              })
              
              const payload = parseJWTPayload(response.tokens.accessToken)
              const adminUser = response.user as AdminUser
              const permissions = adminUser.permissions || getPermissionsByRoles(adminUser.roles)
              
              set({
                user: adminUser,
                tokens: response.tokens,
                jwtPayload: payload,
                permissions,
                roles: adminUser.roles,
                isAuthenticated: true,
                isLoading: false,
                error: null
              })
              
              // 啟動 Token 自動刷新
              get().startTokenRefreshTimer()
              
              console.log('✅ 管理員登錄成功:', adminUser.email)
            } catch (error) {
              const message = error instanceof Error ? error.message : '管理員登錄失敗'
              set({
                error: message,
                isLoading: false,
                isAuthenticated: false,
                user: null,
                tokens: null,
                jwtPayload: null,
                permissions: [],
                roles: []
              })
              
              console.error('❌ 管理員登錄失敗:', message)
              throw error
            }
          },

          // 登出
          logout: () => {
            const { tokens } = get()
            
            // 停止 Token 刷新計時器
            get().stopTokenRefreshTimer()
            
            // 清除狀態
            set({
              user: null,
              tokens: null,
              jwtPayload: null,
              permissions: [],
              roles: [],
              isAuthenticated: false,
              error: null,
            })
            
            // 調用後端登出 API（非阻塞）
            if (tokens) {
              authService.logout().catch(console.error)
            }
            
            console.log('👋 已登出')
          },

          // 管理員登出
          adminLogout: () => {
            const { tokens } = get()
            
            // 停止 Token 刷新計時器
            get().stopTokenRefreshTimer()
            
            // 清除狀態
            set({
              user: null,
              tokens: null,
              jwtPayload: null,
              permissions: [],
              roles: [],
              isAuthenticated: false,
              error: null,
            })
            
            // 調用後端管理員登出 API（非阻塞）
            if (tokens) {
              authService.adminLogout().catch(console.error)
            }
            
            console.log('👋 管理員已登出')
          },

          // 刷新 Token
          refreshToken: async () => {
            const { tokens } = get()
            if (!tokens?.refreshToken) return
            
            try {
              const response = await authService.refreshToken(tokens.refreshToken)
              const payload = parseJWTPayload(response.tokens.accessToken)
              
              set({ 
                tokens: response.tokens,
                jwtPayload: payload 
              })
              
              console.log('🔄 Token 已刷新')
            } catch (error) {
              console.error('❌ Token 刷新失敗:', error)
              get().logout()
            }
          },

          // 自動刷新 Token
          refreshTokenAutomatic: async () => {
            const { tokens, isAuthenticated } = get()
            if (!isAuthenticated || !tokens?.accessToken) return
            
            // 檢查 Token 是否即將過期（提前 5 分鐘刷新）
            const payload = parseJWTPayload(tokens.accessToken)
            if (!payload) return
            
            const timeUntilExpiry = payload.exp * 1000 - Date.now()
            const fiveMinutes = 5 * 60 * 1000
            
            if (timeUntilExpiry < fiveMinutes) {
              await get().refreshToken()
            }
          },

          // 啟動 Token 自動刷新計時器
          startTokenRefreshTimer: () => {
            if (tokenRefreshTimer) clearInterval(tokenRefreshTimer)
            
            // 每分鐘檢查一次 Token 是否需要刷新
            tokenRefreshTimer = setInterval(() => {
              get().refreshTokenAutomatic()
            }, 60 * 1000)
          },

          // 停止 Token 自動刷新計時器
          stopTokenRefreshTimer: () => {
            if (tokenRefreshTimer) {
              clearInterval(tokenRefreshTimer)
              tokenRefreshTimer = null
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
            const token = authService.getAccessToken()
            if (!token) {
              set({ isLoading: false })
              return
            }
            
            set({ isLoading: true })
            
            try {
              // 檢查 Token 是否過期
              if (isTokenExpired(token)) {
                authService.clearAuth()
                set({ isLoading: false })
                return
              }
              
              // 獲取用戶資料
              const isAdminUser = authService.isAdmin()
              const user = isAdminUser 
                ? await authService.getAdminProfile()
                : await authService.getProfile()
              
              const payload = parseJWTPayload(token)
              const tokens = {
                accessToken: token,
                refreshToken: authService.getRefreshToken() || '',
                expiresIn: payload?.exp || 0,
                tokenType: 'Bearer' as const
              }
              
              let permissions: Permission[] = []
              let roles: AdminRole[] = []
              
              if (isAdminUser) {
                const adminUser = user as AdminUser
                permissions = adminUser.permissions || getPermissionsByRoles(adminUser.roles)
                roles = adminUser.roles
              }
              
              set({
                user,
                tokens,
                jwtPayload: payload,
                permissions,
                roles,
                isAuthenticated: true,
                isLoading: false,
                error: null
              })
              
              // 啟動 Token 自動刷新
              get().startTokenRefreshTimer()
              
              console.log('✅ 認證狀態已恢復:', user.email)
            } catch (error) {
              console.error('❌ 認證狀態恢復失敗:', error)
              authService.clearAuth()
              set({ 
                isLoading: false,
                error: error instanceof Error ? error.message : '認證失敗'
              })
            }
          },

          // 檢查認證狀態
          checkAuthStatus: async () => {
            const token = authService.getAccessToken()
            if (!token || isTokenExpired(token)) {
              get().logout()
              return false
            }
            
            return true
          },

          // Token 管理
          setTokens: (tokens) => {
            const payload = parseJWTPayload(tokens.accessToken)
            set({ tokens, jwtPayload: payload })
            
            localStorage.setItem('accessToken', tokens.accessToken)
            localStorage.setItem('refreshToken', tokens.refreshToken)
          },

          clearTokens: () => {
            set({ 
              tokens: null,
              jwtPayload: null,
              permissions: [],
              roles: []
            })
            authService.clearAuth()
          },

          isTokenExpired: () => {
            const { tokens } = get()
            if (!tokens?.accessToken) return true
            
            return isTokenExpired(tokens.accessToken)
          },

          parseTokenPayload: () => {
            const { tokens } = get()
            if (!tokens?.accessToken) return null
            
            return parseJWTPayload(tokens.accessToken)
          },

          // 權限檢查
          hasPermission: (permissions, requireAll = false) => {
            const { permissions: userPermissions } = get()
            
            if (permissions.length === 0) return true
            
            const hasPermissions = permissions.map(permission => 
              userPermissions.includes(permission)
            )
            
            return requireAll 
              ? hasPermissions.every(Boolean)
              : hasPermissions.some(Boolean)
          },

          hasRole: (roles) => {
            const { roles: userRoles } = get()
            return roles.some(role => userRoles.includes(role))
          },

          checkPermission: (check) => {
            const { user } = get()
            return checkPermission(user as AdminUser, check)
          },

          isAdmin: () => {
            const { user } = get()
            return isAdmin(user as AdminUser)
          },

          isSuperAdmin: () => {
            const { user } = get()
            return isSuperAdmin(user as AdminUser)
          },

          getAccessibleMenus: () => {
            const { user } = get()
            if (!user || !isAdmin(user as AdminUser)) return []
            
            const adminUser = user as AdminUser
            const permissions = adminUser.permissions || getPermissionsByRoles(adminUser.roles)
            const menus: string[] = []
            
            // 商品管理
            if (permissions.some(p => p.startsWith('product:') || p.startsWith('category:') || p.startsWith('brand:'))) {
              menus.push('products')
            }
            
            // 庫存管理
            if (permissions.some(p => p.startsWith('inventory:'))) {
              menus.push('inventory')
            }
            
            // 訂單管理
            if (permissions.some(p => p.startsWith('order:'))) {
              menus.push('orders')
            }
            
            // 會員管理
            if (permissions.some(p => p.startsWith('member:'))) {
              menus.push('members')
            }
            
            // 內容管理
            if (permissions.some(p => p.startsWith('content:') || p.startsWith('banner:'))) {
              menus.push('content')
            }
            
            // 促銷活動
            if (permissions.some(p => p.startsWith('promotion:') || p.startsWith('coupon:'))) {
              menus.push('promotions')
            }
            
            // 報表分析
            if (permissions.some(p => p.startsWith('analytics:') || p.startsWith('report:'))) {
              menus.push('analytics')
            }
            
            // 系統管理
            if (permissions.some(p => p.startsWith('system:') || p.startsWith('user:') || p.startsWith('role:'))) {
              menus.push('system')
            }
            
            return menus
          },
        }),
        {
          name: 'mickey-beauty-auth',
          partialize: (state) => ({
            // 只持久化基本信息，不持久化敏感 token
            user: state.user,
            isAuthenticated: state.isAuthenticated,
          }),
        }
      )
    ),
    { name: 'auth-store' }
  )
)