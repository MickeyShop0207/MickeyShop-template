// 受保護路由組件
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks'
import { Spin } from 'antd'

export interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
  requireEmailVerified?: boolean
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = '/login',
  requireEmailVerified = false
}) => {
  const { isAuthenticated, user, isLoading } = useAuth()
  const location = useLocation()

  // 載入中
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" tip="驗證登錄狀態..." />
      </div>
    )
  }

  // 未登錄，重定向到登錄頁面
  if (!isAuthenticated) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location }} 
        replace 
      />
    )
  }

  // 需要郵箱驗證但未驗證
  if (requireEmailVerified && user && !user.emailVerified) {
    return (
      <Navigate 
        to="/verify-email" 
        state={{ from: location }} 
        replace 
      />
    )
  }

  // 已登錄且滿足條件，渲染子組件
  return <>{children}</>
}

export default ProtectedRoute