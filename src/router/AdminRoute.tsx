/**
 * 管理員權限路由守衛組件
 * 用於保護需要管理員權限才能訪問的頁面
 */

import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Spin, Result } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/stores/auth'
import { checkPermission, isAdmin } from '@/utils/routeGuard'
import type { AdminRole, Permission, PermissionCheck, AdminUser } from '@/types'

interface AdminRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  permissions?: Permission[]
  roles?: AdminRole[]
  requireAll?: boolean
  redirectTo?: string
}

export const AdminRoute: React.FC<AdminRouteProps> = ({
  children,
  fallback,
  permissions = [],
  roles = [],
  requireAll = false,
  redirectTo = '/auth/admin-login'
}) => {
  const location = useLocation()
  const { isAuthenticated, isLoading, user } = useAuthStore()

  // 載入中顯示 loading
  if (isLoading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spin size="large" tip="驗證管理權限中..." />
      </div>
    )
  }

  // 未認證用戶重導向到管理員登入頁面
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Result
          status="403"
          title="帳戶已停用"
          subTitle="您的帳戶已被停用，請聯繫系統管理員。"
          extra={
            <button
              onClick={() => useAuthStore.getState().logout()}
              className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              返回登入
            </button>
          }
        />
      </div>
    )
  }

  // 檢查是否為管理員身份
  const adminUser = user as AdminUser
  if (!isAdmin(adminUser)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Result
          status="403"
          icon={<LockOutlined />}
          title="訪問被拒絕"
          subTitle="您沒有訪問此頁面的權限。"
          extra={
            <button
              onClick={() => window.history.back()}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              返回上一頁
            </button>
          }
        />
      </div>
    )
  }

  // 檢查具體權限
  if (permissions.length > 0 || roles.length > 0) {
    const permissionCheck: PermissionCheck = {
      permissions,
      roles,
      requireAll
    }

    if (!checkPermission(adminUser, permissionCheck)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Result
            status="403"
            icon={<LockOutlined />}
            title="權限不足"
            subTitle={`您缺少以下權限：${permissions.join(', ')}`}
            extra={
              <div className="space-y-2">
                <div className="text-sm text-gray-500">
                  您的角色：{adminUser.roles.join(', ')}
                </div>
                <button
                  onClick={() => window.history.back()}
                  className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  返回上一頁
                </button>
              </div>
            }
          />
        </div>
      )
    }
  }

  // 權限檢查通過，顯示受保護的內容
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