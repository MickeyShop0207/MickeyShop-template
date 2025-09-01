/**
 * 用戶認證路由守衛組件
 * 用於保護需要登入才能訪問的頁面
 */

import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuthStore } from '@/stores/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
  requireEmailVerified?: boolean
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
  redirectTo = '/auth/login',
  requireEmailVerified = false
}) => {
  const location = useLocation()
  const { isAuthenticated, isLoading, user } = useAuthStore()

  // 載入中顯示 loading
  if (isLoading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip="驗證身份中..." />
      </div>
    )
  }

  // 未認證用戶重導向到登入頁面，並記住目標頁面
  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location }}
        replace
      />
    )
  }

  // 檢查用戶是否為活躍狀態
  if (!user.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            帳戶已停用
          </h2>
          <p className="text-gray-600 mb-4">
            您的帳戶已被停用，請聯繫客服人員協助處理。
          </p>
          <button
            onClick={() => useAuthStore.getState().logout()}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            返回登入
          </button>
        </div>
      </div>
    )
  }

  // 需要郵箱驗證但未驗證
  if (requireEmailVerified && !user.emailVerified) {
    return (
      <Navigate
        to="/auth/verify-email"
        state={{ from: location }}
        replace
      />
    )
  }

  // 認證成功，顯示受保護的內容
  return <>{children}</>
}

export default ProtectedRoute