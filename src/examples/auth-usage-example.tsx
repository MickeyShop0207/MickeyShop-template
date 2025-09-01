/**
 * 認證權限系統使用範例
 * 展示如何使用 JWT 認證和 RBAC 權限控制
 */

import React from 'react'
import { Button, Card, Divider, Space, Tag } from 'antd'
import { ProtectedRoute, AdminRoute } from '@/router'
import { withPermission, PermissionGuard as Permission, CanAccess, HasRole, AdminOnly, SuperAdminOnly } from '@/components/admin/withPermission'
import { useAuthStore } from '@/stores/auth'
import { usePermission } from '@/hooks/usePermission'
import type { AdminUser } from '@/types'

// 範例：使用 withPermission HOC 包裝組件
const ProductManagement = withPermission(() => (
  <Card title="商品管理">
    <p>只有擁有 product:read 權限的用戶才能看到這個組件</p>
  </Card>
), {
  permissions: ['product:read']
})

// 範例：超級管理員專用組件
const SystemSettings = withPermission(() => (
  <Card title="系統設定" type="inner">
    <p>只有超級管理員才能訪問系統設定</p>
    <Button danger>危險操作</Button>
  </Card>
), {
  roles: ['super_admin']
})

// 主範例組件
const AuthUsageExample: React.FC = () => {
  const { user, isAuthenticated, login, adminLogin, logout } = useAuthStore()
  const { can, hasAnyRole, isAdmin, isSuperAdmin } = usePermission()

  const adminUser = user as AdminUser

  const handleMemberLogin = async () => {
    try {
      await login({
        email: 'member@example.com',
        password: 'password123'
      })
    } catch (error) {
      console.error('會員登錄失敗:', error)
    }
  }

  const handleAdminLogin = async () => {
    try {
      await adminLogin({
        email: 'admin@example.com',
        password: 'password123'
      })
    } catch (error) {
      console.error('管理員登錄失敗:', error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card title="認證權限系統使用範例">
        
        {/* 1. 基本認證狀態 */}
        <Card title="1. 基本認證狀態" type="inner">
          <Space direction="vertical" className="w-full">
            <div>
              <strong>認證狀態:</strong> 
              <Tag color={isAuthenticated ? 'green' : 'red'}>
                {isAuthenticated ? '已登錄' : '未登錄'}
              </Tag>
            </div>
            
            {user && (
              <div>
                <strong>用戶信息:</strong>
                <ul className="ml-4 mt-2">
                  <li>ID: {user.id}</li>
                  <li>Email: {user.email}</li>
                  <li>姓名: {user.firstName} {user.lastName}</li>
                  {adminUser?.roles && (
                    <li>角色: {adminUser.roles.join(', ')}</li>
                  )}
                  {adminUser?.permissions && (
                    <li>權限: {adminUser.permissions.slice(0, 5).join(', ')}...</li>
                  )}
                </ul>
              </div>
            )}

            <Space>
              <Button onClick={handleMemberLogin}>
                會員登錄 (模擬)
              </Button>
              <Button onClick={handleAdminLogin} type="primary">
                管理員登錄 (模擬)
              </Button>
              <Button onClick={logout} danger>
                登出
              </Button>
            </Space>
          </Space>
        </Card>

        {/* 2. 路由守衛使用 */}
        <Card title="2. 路由守衛使用" type="inner">
          <pre className="bg-gray-50 p-4 rounded text-sm">
{`// 一般會員頁面保護
<ProtectedRoute>
  <MemberProfilePage />
</ProtectedRoute>

// 管理員頁面保護
<AdminRoute>
  <AdminDashboard />
</AdminRoute>

// 特定權限要求
<AdminRoute permissions={['product:write']}>
  <ProductEditPage />
</AdminRoute>

// 特定角色要求  
<AdminRoute roles={['super_admin']}>
  <SystemSettingsPage />
</AdminRoute>`}
          </pre>
        </Card>

        {/* 3. 權限檢查 Hook */}
        <Card title="3. 權限檢查 Hook" type="inner">
          <Space direction="vertical" className="w-full">
            <div>
              <strong>權限檢查結果:</strong>
              <ul className="ml-4 mt-2">
                <li>
                  can(['product:read']): 
                  <Tag color={can(['product:read'] as any) ? 'green' : 'red'}>
                    {can(['product:read'] as any) ? '有權限' : '無權限'}
                  </Tag>
                </li>
                <li>
                  hasAnyRole(['admin']): 
                  <Tag color={hasAnyRole(['admin']) ? 'green' : 'red'}>
                    {hasAnyRole(['admin']) ? '有角色' : '無角色'}
                  </Tag>
                </li>
                <li>
                  isAdmin(): 
                  <Tag color={isAdmin() ? 'green' : 'red'}>
                    {isAdmin() ? '是管理員' : '不是管理員'}
                  </Tag>
                </li>
                <li>
                  isSuperAdmin(): 
                  <Tag color={isSuperAdmin() ? 'green' : 'red'}>
                    {isSuperAdmin() ? '是超級管理員' : '不是超級管理員'}
                  </Tag>
                </li>
              </ul>
            </div>

            <pre className="bg-gray-50 p-4 rounded text-sm">
{`const { can, hasAnyRole, isAdmin } = usePermission()

// 檢查單個權限
const canEdit = can(['product:write'])

// 檢查多個權限 (OR 邏輯)
const canManage = can(['product:read', 'product:write'])

// 檢查多個權限 (AND 邏輯) 
const canFullAccess = can(['product:read', 'product:write'], true)

// 檢查角色
const isAdminUser = hasAnyRole(['admin', 'super_admin'])`}
            </pre>
          </Space>
        </Card>

        {/* 4. 組件級權限控制 */}
        <Card title="4. 組件級權限控制" type="inner">
          {/* 權限組件範例 */}
          <Permission permissions={['product:read']}>
            <Card title="商品查看"  className="mb-4">
              <p>✅ 您有查看商品的權限</p>
            </Card>
          </Permission>

          <CanAccess 
            permission={['product:write'] as any}
            fallback={<p>❌ 您沒有編輯商品的權限</p>}
          >
            <Card title="商品編輯"  className="mb-4">
              <p>✅ 您有編輯商品的權限</p>
            </Card>
          </CanAccess>

          <HasRole 
            role={['admin', 'super_admin']}
            fallback={<p>❌ 您不是管理員</p>}
          >
            <Card title="管理員功能"  className="mb-4">
              <p>✅ 您是管理員，可以使用管理功能</p>
            </Card>
          </HasRole>

          <AdminOnly fallback={<p>❌ 需要管理員權限</p>}>
            <Card title="管理員專區"  className="mb-4">
              <p>✅ 歡迎管理員</p>
            </Card>
          </AdminOnly>

          <SuperAdminOnly fallback={<p>❌ 需要超級管理員權限</p>}>
            <Card title="超級管理員專區"  className="mb-4">
              <p>✅ 歡迎超級管理員</p>
            </Card>
          </SuperAdminOnly>

          <Divider />
          
          <pre className="bg-gray-50 p-4 rounded text-sm">
{`// 基礎權限檢查
<CanAccess permission="product:read">
  <ProductList />
</CanAccess>

// 角色檢查
<HasRole role={['admin', 'super_admin']}>
  <AdminPanel />  
</HasRole>

// 管理員檢查
<AdminOnly>
  <AdminFeatures />
</AdminOnly>

// 超級管理員檢查
<SuperAdminOnly>
  <SystemSettings />
</SuperAdminOnly>`}
          </pre>
        </Card>

        {/* 5. HOC 高階組件 */}
        <Card title="5. HOC 高階組件" type="inner">
          <ProductManagement />
          <div className="mt-4">
            <SystemSettings />
          </div>
          
          <Divider />
          
          <pre className="bg-gray-50 p-4 rounded text-sm">
{`// 使用 withPermission HOC
const ProductManagement = withPermission(ProductComponent, {
  permissions: ['product:read', 'product:write'],
  requireAll: false,  // OR 邏輯，有任一權限即可
  onUnauthorized: () => {
    message.error('權限不足')
  }
})

// 角色控制
const AdminPanel = withPermission(AdminComponent, {
  roles: ['admin', 'super_admin']
})`}
          </pre>
        </Card>

        {/* 6. 實際使用建議 */}
        <Card title="6. 實際使用建議" type="inner">
          <ul className="space-y-2">
            <li>• <strong>路由級保護</strong>: 使用 ProtectedRoute 和 AdminRoute 保護整個頁面</li>
            <li>• <strong>組件級控制</strong>: 使用 Permission 組件和相關 Hook 控制組件顯示</li>
            <li>• <strong>功能級檢查</strong>: 在執行敏感操作前檢查權限</li>
            <li>• <strong>用戶體驗</strong>: 提供清晰的權限不足提示和引導</li>
            <li>• <strong>錯誤處理</strong>: 實現優雅的錯誤處理和降級方案</li>
            <li>• <strong>性能優化</strong>: 合理使用權限檢查，避免過度檢查影響性能</li>
          </ul>
        </Card>
      </Card>
    </div>
  )
}

export default AuthUsageExample