/**
 * 權限控制高階組件 (HOC)
 * 用於包裝需要特定權限才能訪問的組件
 */

import React from 'react'
import { Result, Button } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import { usePermission } from '@/hooks/usePermission'
import type { Permission, AdminRole, PermissionCheck } from '@/types'

interface WithPermissionOptions {
  permissions?: Permission[]
  roles?: AdminRole[]
  requireAll?: boolean
  fallback?: React.ComponentType
  onUnauthorized?: () => void
}

/**
 * 權限控制 HOC
 */
export const withPermission = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithPermissionOptions = {}
) => {
  const {
    permissions = [],
    roles = [],
    requireAll = false,
    fallback: FallbackComponent,
    onUnauthorized
  } = options

  const PermissionWrapper: React.FC<P> = (props) => {
    const { canWithCheck, user } = usePermission()

    // 構建權限檢查條件
    const permissionCheck: PermissionCheck = {
      permissions,
      roles,
      requireAll
    }

    // 檢查權限
    const hasPermission = canWithCheck(permissionCheck)

    // 無權限處理
    if (!hasPermission) {
      // 調用自定義處理函數
      if (onUnauthorized) {
        onUnauthorized()
      }

      // 使用自定義 fallback 組件
      if (FallbackComponent) {
        return <FallbackComponent />
      }

      // 默認權限不足頁面
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Result
            status="403"
            icon={<LockOutlined />}
            title="權限不足"
            subTitle={
              <div className="space-y-2">
                {permissions.length > 0 && (
                  <p>所需權限：{permissions.join(', ')}</p>
                )}
                {roles.length > 0 && (
                  <p>所需角色：{roles.join(', ')}</p>
                )}
                {user && (
                  <p className="text-sm text-gray-500">
                    您的角色：{(user as any).roles?.join(', ') || '無'}
                  </p>
                )}
              </div>
            }
            extra={
              <div className="space-x-2">
                <Button onClick={() => window.history.back()}>
                  返回上一頁
                </Button>
                <Button type="primary" onClick={() => window.location.href = '/admin'}>
                  返回控制台
                </Button>
              </div>
            }
          />
        </div>
      )
    }

    // 有權限，渲染原組件
    return <WrappedComponent {...props} />
  }

  // 設置顯示名稱
  PermissionWrapper.displayName = `withPermission(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`

  return PermissionWrapper
}

/**
 * 權限檢查組件 - 用於 JSX 中的條件渲染
 */
interface PermissionProps extends WithPermissionOptions {
  children: React.ReactNode
}

export const PermissionGuard: React.FC<PermissionProps> = ({
  children,
  permissions = [],
  roles = [],
  requireAll = false,
  fallback: FallbackComponent,
  onUnauthorized
}) => {
  const { canWithCheck } = usePermission()

  // 構建權限檢查條件
  const permissionCheck: PermissionCheck = {
    permissions,
    roles,
    requireAll
  }

  // 檢查權限
  const hasPermission = canWithCheck(permissionCheck)

  // 無權限處理
  if (!hasPermission) {
    // 調用自定義處理函數
    if (onUnauthorized) {
      onUnauthorized()
    }

    // 使用自定義 fallback 組件
    if (FallbackComponent) {
      return <FallbackComponent />
    }

    // 默認不渲染任何內容
    return null
  }

  // 有權限，渲染子組件
  return <>{children}</>
}

/**
 * 便捷的權限檢查組件
 */
export const CanAccess: React.FC<{
  permission: Permission | Permission[]
  requireAll?: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
}> = ({ permission, requireAll = false, children, fallback = null }) => {
  const { can } = usePermission()
  
  const permissions = Array.isArray(permission) ? permission : [permission]
  const hasPermission = can(permissions, requireAll)
  
  return hasPermission ? <>{children}</> : <>{fallback}</>
}

/**
 * 角色檢查組件
 */
export const HasRole: React.FC<{
  role: AdminRole | AdminRole[]
  children: React.ReactNode
  fallback?: React.ReactNode
}> = ({ role, children, fallback = null }) => {
  const { hasAnyRole } = usePermission()
  
  const roles = Array.isArray(role) ? role : [role]
  const hasRole = hasAnyRole(roles)
  
  return hasRole ? <>{children}</> : <>{fallback}</>
}

/**
 * 管理員檢查組件
 */
export const AdminOnly: React.FC<{
  children: React.ReactNode
  fallback?: React.ReactNode
}> = ({ children, fallback = null }) => {
  const { isAdmin } = usePermission()
  
  return isAdmin() ? <>{children}</> : <>{fallback}</>
}

/**
 * 超級管理員檢查組件
 */
export const SuperAdminOnly: React.FC<{
  children: React.ReactNode
  fallback?: React.ReactNode
}> = ({ children, fallback = null }) => {
  const { isSuperAdmin } = usePermission()
  
  return isSuperAdmin() ? <>{children}</> : <>{fallback}</>
}

export default withPermission