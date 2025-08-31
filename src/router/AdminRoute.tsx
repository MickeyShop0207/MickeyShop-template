// 管理員路由組件
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../hooks'
import { Result, Spin } from 'antd'

export interface AdminRouteProps {
  children: React.ReactNode
  requiredPermissions?: string[]
  requiredRoles?: string[]
  redirectTo?: string
}

export const AdminRoute: React.FC<AdminRouteProps> = ({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  redirectTo = '/admin/login'
}) => {
  const { 
    isAuthenticated, 
    adminUser, 
    isLoading, 
    hasPermission, 
    hasRole 
  } = useAdminAuth()
  const location = useLocation()

  // 載入中
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" tip="驗證管理員身份..." />
      </div>
    )
  }

  // 未登錄或非管理員，重定向到管理員登錄頁面
  if (!isAuthenticated || !adminUser) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location }} 
        replace 
      />
    )
  }

  // 檢查所需權限
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = hasPermission(requiredPermissions)
    if (!hasRequiredPermissions) {
      return (
        <Result
          status="403"
          title="權限不足"
          subTitle="您沒有訪問此頁面的權限，請聯繫系統管理員。"
          extra={
            <p>
              所需權限: {requiredPermissions.join(', ')}
            </p>
          }
        />
      )
    }
  }

  // 檢查所需角色
  if (requiredRoles.length > 0) {
    const hasRequiredRole = hasRole(requiredRoles)
    if (!hasRequiredRole) {
      return (
        <Result
          status="403"
          title="角色權限不足"
          subTitle="您的角色沒有訪問此頁面的權限。"
          extra={
            <p>
              所需角色: {requiredRoles.join(', ')}
            </p>
          }
        />
      )
    }
  }

  // 已登錄且為管理員，渲染子組件
  return <>{children}</>
}

// HOC 版本的管理員路由保護
export const withAdminAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: Omit<AdminRouteProps, 'children'>
) => {
  const AdminProtectedComponent: React.FC<P> = (props) => {
    return (
      <AdminRoute {...options}>
        <WrappedComponent {...props} />
      </AdminRoute>
    )
  }

  AdminProtectedComponent.displayName = `withAdminAuth(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`

  return AdminProtectedComponent
}

export default AdminRoute