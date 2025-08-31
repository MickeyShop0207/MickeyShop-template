// 認證相關 Hooks
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { 
  authService, 
  type LoginRequest, 
  type RegisterRequest,
  type ChangePasswordRequest,
  type ResetPasswordRequest
} from '../api/services'
import type { User, AdminUser } from '../api/types'

// 查詢鍵
export const authQueryKeys = {
  profile: ['auth', 'profile'] as const,
  permissions: ['auth', 'permissions'] as const
}

/**
 * 使用認證狀態
 */
export const useAuth = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // 獲取當前用戶資料
  const { data: user, isLoading } = useQuery({
    queryKey: authQueryKeys.profile,
    queryFn: authService.getProfile,
    enabled: authService.isAuthenticated(),
    staleTime: 5 * 60 * 1000, // 5分鐘
    retry: (failureCount, error: any) => {
      // Token 過期不重試
      if (error?.statusCode === 401) {
        return false
      }
      return failureCount < 2
    }
  })

  // 登錄
  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: (response) => {
      queryClient.setQueryData(authQueryKeys.profile, response.user)
      message.success('登錄成功')
      navigate('/')
    },
    onError: (error: any) => {
      message.error(error.message || '登錄失敗')
    }
  })

  // 註冊
  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onSuccess: (response) => {
      queryClient.setQueryData(authQueryKeys.profile, response.user)
      message.success('註冊成功，歡迎加入 MickeyShop Beauty！')
      navigate('/')
    },
    onError: (error: any) => {
      message.error(error.message || '註冊失敗')
    }
  })

  // 登出
  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['auth'] })
      queryClient.clear()
      message.success('登出成功')
      navigate('/login')
    },
    onError: () => {
      // 即使請求失敗也清除本地數據
      queryClient.removeQueries({ queryKey: ['auth'] })
      queryClient.clear()
      navigate('/login')
    }
  })

  // 修改密碼
  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordRequest) => authService.changePassword(data),
    onSuccess: () => {
      message.success('密碼修改成功')
    },
    onError: (error: any) => {
      message.error(error.message || '密碼修改失敗')
    }
  })

  // 更新個人資料
  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<User>) => authService.updateProfile(data),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(authQueryKeys.profile, updatedUser)
      message.success('個人資料更新成功')
    },
    onError: (error: any) => {
      message.error(error.message || '個人資料更新失敗')
    }
  })

  return {
    // 狀態
    user,
    isLoading,
    isAuthenticated: authService.isAuthenticated(),
    isAdmin: authService.isAdmin(),

    // 操作
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    changePassword: changePasswordMutation.mutate,
    updateProfile: updateProfileMutation.mutate,

    // 加載狀態
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
    isLogoutLoading: logoutMutation.isPending,
    isChangePasswordLoading: changePasswordMutation.isPending,
    isUpdateProfileLoading: updateProfileMutation.isPending
  }
}

/**
 * 使用登錄表單
 */
export const useLogin = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: (response) => {
      queryClient.setQueryData(authQueryKeys.profile, response.user)
      message.success('登錄成功')
      
      // 根據用戶類型導航
      if (authService.isAdmin()) {
        navigate('/admin')
      } else {
        navigate('/')
      }
    },
    onError: (error: any) => {
      message.error(error.message || '登錄失敗')
    }
  })
}

/**
 * 使用註冊表單
 */
export const useRegister = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onSuccess: (response) => {
      queryClient.setQueryData(authQueryKeys.profile, response.user)
      message.success('註冊成功，歡迎加入 MickeyShop Beauty！')
      navigate('/')
    },
    onError: (error: any) => {
      message.error(error.message || '註冊失敗')
    }
  })
}

/**
 * 使用忘記密碼
 */
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (email: string) => authService.forgotPassword(email),
    onSuccess: () => {
      message.success('密碼重設連結已發送到您的郵箱')
    },
    onError: (error: any) => {
      message.error(error.message || '發送失敗，請稍後重試')
    }
  })
}

/**
 * 使用重設密碼
 */
export const useResetPassword = () => {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: ResetPasswordRequest) => authService.resetPassword(data),
    onSuccess: () => {
      message.success('密碼重設成功，請使用新密碼登錄')
      navigate('/login')
    },
    onError: (error: any) => {
      message.error(error.message || '密碼重設失敗')
    }
  })
}

/**
 * 使用郵箱驗證
 */
export const useEmailVerification = () => {
  const queryClient = useQueryClient()

  const sendVerification = useMutation({
    mutationFn: () => authService.sendEmailVerification(),
    onSuccess: () => {
      message.success('驗證郵件已發送，請查看您的郵箱')
    },
    onError: (error: any) => {
      message.error(error.message || '發送失敗，請稍後重試')
    }
  })

  const verifyEmail = useMutation({
    mutationFn: (token: string) => authService.verifyEmail(token),
    onSuccess: () => {
      message.success('郵箱驗證成功')
      // 刷新用戶資料
      queryClient.invalidateQueries({ queryKey: authQueryKeys.profile })
    },
    onError: (error: any) => {
      message.error(error.message || '驗證失敗，請檢查驗證連結')
    }
  })

  return {
    sendVerification: sendVerification.mutate,
    verifyEmail: verifyEmail.mutate,
    isSendingVerification: sendVerification.isPending,
    isVerifyingEmail: verifyEmail.isPending
  }
}

/**
 * 使用管理員認證 (管理後台專用)
 */
export const useAdminAuth = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // 獲取管理員資料
  const { data: adminUser, isLoading } = useQuery({
    queryKey: authQueryKeys.profile,
    queryFn: authService.getAdminProfile,
    enabled: authService.isAuthenticated() && authService.isAdmin(),
    staleTime: 5 * 60 * 1000
  })

  // 獲取權限
  const { data: permissions } = useQuery({
    queryKey: authQueryKeys.permissions,
    queryFn: authService.getPermissions,
    enabled: authService.isAuthenticated() && authService.isAdmin(),
    staleTime: 10 * 60 * 1000 // 10分鐘
  })

  // 管理員登錄
  const adminLoginMutation = useMutation({
    mutationFn: authService.adminLogin,
    onSuccess: (response) => {
      queryClient.setQueryData(authQueryKeys.profile, response.user)
      message.success('登錄成功')
      navigate('/admin')
    },
    onError: (error: any) => {
      message.error(error.message || '登錄失敗')
    }
  })

  // 管理員登出
  const adminLogoutMutation = useMutation({
    mutationFn: authService.adminLogout,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['auth'] })
      queryClient.clear()
      message.success('登出成功')
      navigate('/admin/login')
    },
    onError: () => {
      queryClient.removeQueries({ queryKey: ['auth'] })
      queryClient.clear()
      navigate('/admin/login')
    }
  })

  // 檢查權限
  const hasPermission = (permission: string | string[]) => {
    if (!permissions?.permissions) return false
    
    const userPermissions = permissions.permissions
    
    if (typeof permission === 'string') {
      return userPermissions.includes(permission)
    }
    
    return permission.every(p => userPermissions.includes(p))
  }

  // 檢查角色
  const hasRole = (role: string | string[]) => {
    if (!permissions?.roles) return false
    
    const userRoles = permissions.roles
    
    if (typeof role === 'string') {
      return userRoles.includes(role)
    }
    
    return role.some(r => userRoles.includes(r))
  }

  return {
    // 狀態
    adminUser: adminUser as AdminUser,
    permissions: permissions?.permissions || [],
    roles: permissions?.roles || [],
    isLoading,
    isAuthenticated: authService.isAuthenticated() && authService.isAdmin(),

    // 操作
    adminLogin: adminLoginMutation.mutate,
    adminLogout: adminLogoutMutation.mutate,
    hasPermission,
    hasRole,

    // 加載狀態
    isAdminLoginLoading: adminLoginMutation.isPending,
    isAdminLogoutLoading: adminLogoutMutation.isPending
  }
}