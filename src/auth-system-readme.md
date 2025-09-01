# MickeyShop Beauty 認證權限系統

本文檔描述了 MickeyShop Beauty 系統的完整 JWT 認證機制和 RBAC 權限控制實現。

## 🏗️ 系統架構

### 核心組件
- **JWT Token 管理**: 基於 JSON Web Token 的認證機制
- **RBAC 權限控制**: 基於角色的權限管理系統
- **路由守衛**: 自動權限檢查和路由保護
- **狀態管理**: Zustand 集中式認證狀態管理
- **自動刷新**: Token 自動刷新和會話管理

### 文件結構
```
src/
├── stores/auth.ts                 # 認證狀態管理
├── utils/routeGuard.ts           # 權限檢查工具函數
├── router/
│   ├── ProtectedRoute.tsx        # 會員路由守衛
│   └── AdminRoute.tsx            # 管理員路由守衛
├── pages/Auth/                   # 認證頁面
│   ├── Login/                    # 會員登錄
│   ├── AdminLogin.tsx            # 管理員登錄
│   ├── Register/                 # 會員註冊
│   ├── ForgotPassword.tsx        # 忘記密碼
│   ├── ResetPassword.tsx         # 重設密碼
│   └── VerifyEmail.tsx           # 郵箱驗證
├── components/admin/             # 管理員組件
│   ├── AdminLayout.tsx           # 管理員佈局
│   ├── AdminSidebar.tsx          # 側邊欄導航
│   └── withPermission.tsx        # 權限控制組件
├── hooks/
│   ├── useAuthInit.ts            # 認證初始化
│   └── usePermission.ts          # 權限檢查
└── api/services/authService.ts   # 認證 API 服務
```

## 🔐 JWT Token 結構

```json
{
  "sub": "user_id",              // 用戶 ID
  "email": "user@example.com",   // 用戶 email
  "roles": ["admin"],            // 角色列表
  "permissions": [               // 權限列表
    "product:read",
    "product:write",
    "order:read"
  ],
  "brand": "mickey-beauty",      // 品牌標識
  "session": "session_id",       // 會話 ID
  "iat": 1640995200,             // 簽發時間
  "exp": 1641081600,             // 過期時間
  "iss": "mickey-beauty-api",    // 簽發者
  "aud": "mickey-beauty-client"  // 受眾
}
```

## 👥 角色權限定義

### 管理員角色
- `super_admin`: 超級管理員 - 全系統權限
- `admin`: 管理員 - 業務管理權限
- `customer_service`: 客服人員 - 客戶服務權限
- `warehouse_staff`: 倉庫人員 - 庫存物流權限
- `content_editor`: 內容編輯 - 內容管理權限

### 權限列表
```typescript
// 商品管理權限
'product:read' | 'product:write' | 'product:delete'
'category:read' | 'category:write' | 'category:delete'
'brand:read' | 'brand:write' | 'brand:delete'
'inventory:read' | 'inventory:write' | 'inventory:adjust'

// 訂單管理權限
'order:read' | 'order:write' | 'order:delete'
'order:process' | 'order:ship' | 'order:cancel'
'order:refund' | 'order:return'

// 會員管理權限
'member:read' | 'member:write' | 'member:delete'
'member:suspend' | 'member:activate'

// 系統管理權限
'system:read' | 'system:write'
'user:read' | 'user:write' | 'user:delete'
'role:read' | 'role:write' | 'role:assign'
```

## 🚀 使用方法

### 1. 認證狀態管理

```typescript
import { useAuthStore } from '@/stores/auth'

const MyComponent = () => {
  const { 
    user, 
    isAuthenticated, 
    login, 
    adminLogin,
    logout,
    hasPermission,
    isAdmin 
  } = useAuthStore()

  // 會員登錄
  const handleLogin = async () => {
    await login({ email: 'user@example.com', password: 'password' })
  }

  // 管理員登錄
  const handleAdminLogin = async () => {
    await adminLogin({ email: 'admin@example.com', password: 'password' })
  }

  return (
    <div>
      {isAuthenticated ? (
        <p>歡迎, {user?.email}</p>
      ) : (
        <button onClick={handleLogin}>登錄</button>
      )}
    </div>
  )
}
```

### 2. 路由保護

```typescript
import { ProtectedRoute, AdminRoute } from '@/router'

// 會員頁面保護
<ProtectedRoute>
  <MemberProfilePage />
</ProtectedRoute>

// 管理員頁面保護
<AdminRoute>
  <AdminDashboard />
</AdminRoute>

// 特定權限要求
<AdminRoute permissions={['product:write']} requireAll={true}>
  <ProductEditPage />
</AdminRoute>

// 特定角色要求
<AdminRoute roles={['super_admin']}>
  <SystemSettingsPage />
</AdminRoute>
```

### 3. 權限檢查 Hook

```typescript
import { usePermission } from '@/hooks/usePermission'

const ProductPage = () => {
  const { can, hasAnyRole, isAdmin, guard } = usePermission()

  // 檢查權限
  const canEdit = can(['product:write'])
  const isAdminUser = isAdmin()

  // 權限守衛
  const handleDelete = () => {
    try {
      guard(['product:delete'])
      // 執行刪除操作
    } catch (error) {
      console.error(error.message) // "權限不足，需要權限：product:delete"
    }
  }

  return (
    <div>
      {canEdit && <button onClick={handleEdit}>編輯</button>}
      {isAdminUser && <button onClick={handleDelete}>刪除</button>}
    </div>
  )
}
```

### 4. 組件級權限控制

```typescript
import { 
  Permission, 
  CanAccess, 
  HasRole, 
  AdminOnly, 
  SuperAdminOnly 
} from '@/components/admin/withPermission'

const Dashboard = () => {
  return (
    <div>
      {/* 權限組件 */}
      <Permission permissions={['product:read']}>
        <ProductList />
      </Permission>

      {/* 便捷權限檢查 */}
      <CanAccess 
        permission="product:write"
        fallback={<p>您沒有編輯權限</p>}
      >
        <ProductEditForm />
      </CanAccess>

      {/* 角色檢查 */}
      <HasRole role="admin">
        <AdminPanel />
      </HasRole>

      {/* 管理員專用 */}
      <AdminOnly>
        <AdminFeatures />
      </AdminOnly>

      {/* 超級管理員專用 */}
      <SuperAdminOnly>
        <SystemSettings />
      </SuperAdminOnly>
    </div>
  )
}
```

### 5. 高階組件 (HOC)

```typescript
import { withPermission } from '@/components/admin/withPermission'

// 權限控制
const ProductManagement = withPermission(ProductComponent, {
  permissions: ['product:read', 'product:write'],
  requireAll: false, // OR 邏輯
  onUnauthorized: () => {
    message.error('權限不足')
  }
})

// 角色控制
const AdminPanel = withPermission(AdminComponent, {
  roles: ['admin', 'super_admin']
})
```

## 🔧 配置和初始化

### 應用初始化

```typescript
// App.tsx
import { useAuthInit } from '@/hooks/useAuthInit'

function App() {
  // 初始化認證狀態
  useAuthInit()

  return (
    <Router>
      <Routes>
        {/* 路由配置 */}
      </Routes>
    </Router>
  )
}
```

### Token 自動刷新

系統會自動檢測 Token 過期時間，並在過期前 5 分鐘自動刷新：

```typescript
// 在 useAuthStore 中自動處理
const refreshTokenAutomatic = async () => {
  // 檢查 Token 是否即將過期
  const timeUntilExpiry = payload.exp * 1000 - Date.now()
  const fiveMinutes = 5 * 60 * 1000
  
  if (timeUntilExpiry < fiveMinutes) {
    await refreshToken()
  }
}

// 每分鐘檢查一次
setInterval(refreshTokenAutomatic, 60 * 1000)
```

## 🛡️ 安全特性

1. **JWT Token 安全**:
   - Token 存儲在 HttpOnly Cookie 中（生產環境）
   - 自動 Token 刷新機制
   - Token 過期檢查

2. **權限驗證**:
   - 前端和後端雙重權限檢查
   - 基於角色的權限分配
   - 最小權限原則

3. **會話管理**:
   - 自動登出過期會話
   - 多設備登錄檢測
   - 可疑活動監控

## 📝 API 接口

### 認證相關 API

```typescript
// 會員認證
POST /api/v1/auth/login          // 會員登錄
POST /api/v1/auth/register       // 會員註冊
POST /api/v1/auth/logout         // 會員登出
POST /api/v1/auth/refresh        // 刷新 Token
GET  /api/v1/auth/profile        // 獲取會員資料

// 管理員認證
POST /api/admin/v1/auth/login         // 管理員登錄
POST /api/admin/v1/auth/logout        // 管理員登出
GET  /api/admin/v1/auth/profile       // 獲取管理員資料
GET  /api/admin/v1/auth/permissions   // 獲取權限列表

// 密碼管理
POST /api/v1/auth/forgot-password     // 忘記密碼
POST /api/v1/auth/reset-password      // 重設密碼
POST /api/v1/auth/verify-email        // 驗證郵箱
```

## 🔍 故障排除

### 常見問題

1. **Token 過期錯誤**:
   - 檢查系統時間是否正確
   - 確認 Token 刷新機制正常運行

2. **權限檢查失敗**:
   - 驗證用戶角色和權限配置
   - 檢查權限映射表是否正確

3. **路由守衛不工作**:
   - 確認 ProtectedRoute/AdminRoute 正確包裹組件
   - 檢查認證狀態初始化

### 調試方法

```typescript
// 開啟調試模式
const { user, permissions, roles } = useAuthStore()
console.log('Current User:', user)
console.log('Permissions:', permissions)
console.log('Roles:', roles)

// 權限檢查調試
const { can, isAdmin } = usePermission()
console.log('Can edit products:', can(['product:write']))
console.log('Is admin:', isAdmin())
```

## 📊 最佳實踐

1. **權限設計**:
   - 遵循最小權限原則
   - 定期審核和更新權限
   - 使用層次化角色設計

2. **性能優化**:
   - 合理緩存權限信息
   - 避免過度權限檢查
   - 使用懶加載提升體驗

3. **用戶體驗**:
   - 提供清晰的權限提示
   - 優雅的錯誤處理
   - 無感知的自動登錄

4. **安全考慮**:
   - 定期更新依賴
   - 監控安全漏洞
   - 實施安全審計

## 📞 支援

如有問題，請聯繫開發團隊或查看：
- 系統文檔：`/docs`
- API 文檔：`/api/docs`
- 權限配置：`/backend/permissions.md`

---

*最後更新：2024-01-01*
*版本：v1.0.0*