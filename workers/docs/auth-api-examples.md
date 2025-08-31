# MickeyShop Beauty 認證 API 使用範例

## Phase 2: 認證授權系統 API 文檔

本文檔展示完整實現的認證授權系統的使用範例。

## 會員認證 API (Frontend)

### 基礎 URL: `/api/v1/auth`

#### 1. 會員註冊

```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+886-912-345-678",
  "birthDate": "1990-01-01",
  "gender": "male",
  "marketingOptIn": true,
  "referralCode": "FRIEND123"
}
```

**成功響應 (201):**
```json
{
  "success": true,
  "message": "註冊成功",
  "data": {
    "user": {
      "id": "cust_1234567890",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "tier": "bronze",
      "memberTier": "bronze",
      "loyaltyPoints": 0,
      "emailVerified": false
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 900,
      "tokenType": "Bearer"
    },
    "session": {
      "sessionId": "sess_1234567890",
      "expiresAt": "2024-01-08T10:00:00.000Z"
    }
  }
}
```

#### 2. 會員登入

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "SecurePassword123!",
  "deviceInfo": {
    "deviceId": "device_12345",
    "deviceName": "Chrome on MacBook"
  }
}
```

**成功響應:**
```json
{
  "success": true,
  "message": "登入成功",
  "data": {
    "user": {
      "id": "cust_1234567890",
      "email": "john.doe@example.com",
      "tier": "silver",
      "totalSpent": 1200.50,
      "loyaltyPoints": 120
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 900,
      "tokenType": "Bearer"
    }
  }
}
```

#### 3. 刷新 Token

```bash
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 4. 獲取用戶資料

```bash
GET /api/v1/auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 5. 忘記密碼

```bash
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "john.doe@example.com"
}
```

#### 6. 重設密碼

```bash
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_12345",
  "newPassword": "NewSecurePassword456!"
}
```

#### 7. 登出

```bash
POST /api/v1/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 管理員認證 API (Backend)

### 基礎 URL: `/api/admin/v1/auth`

#### 1. 管理員登入

```bash
POST /api/admin/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "AdminPassword123!",
  "deviceInfo": {
    "deviceId": "admin_device_123",
    "deviceName": "Admin Chrome"
  },
  "twoFactorCode": "123456"
}
```

**成功響應:**
```json
{
  "success": true,
  "message": "登入成功",
  "data": {
    "user": {
      "id": "admin_1234567890",
      "username": "admin",
      "email": "admin@mickeyshop.com",
      "displayName": "系統管理員",
      "department": "IT",
      "position": "系統管理員",
      "roles": ["super_admin"],
      "permissions": ["user.create", "user.read", "user.update", "user.delete"],
      "twoFactorEnabled": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 28800,
      "tokenType": "Bearer"
    }
  }
}
```

#### 2. 獲取管理員權限

```bash
GET /api/admin/v1/auth/permissions
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**響應:**
```json
{
  "success": true,
  "message": "權限獲取成功",
  "data": {
    "permissions": [
      "user.create", "user.read", "user.update", "user.delete",
      "product.create", "product.read", "product.update", "product.delete",
      "order.read", "order.update", "order.cancel",
      "report.view", "system.config"
    ],
    "roles": ["super_admin"],
    "department": "IT"
  }
}
```

#### 3. 驗證權限

```bash
POST /api/admin/v1/auth/verify-permission
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "permissions": ["user.delete", "product.update"],
  "requireAll": true
}
```

#### 4. 修改密碼

```bash
PUT /api/admin/v1/auth/change-password
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewAdminPassword456!"
}
```

## 中間件使用範例

### 1. 基本認證

```typescript
import { authenticateToken } from '@/middlewares/auth'

// 需要登入的路由
app.get('/api/v1/protected', authenticateToken(), async (c) => {
  const user = c.get('user')
  return c.json({ message: `Hello, ${user.email}!` })
})
```

### 2. 權限檢查

```typescript
import { authenticateToken, requirePermissions } from '@/middlewares/auth'

// 需要特定權限的路由
app.post('/api/admin/v1/users', 
  authenticateToken(),
  requirePermissions(['user.create']),
  async (c) => {
    // 創建用戶邏輯
  }
)
```

### 3. 角色檢查

```typescript
import { authenticateToken, requireAdmin } from '@/middlewares/auth'

// 僅管理員可訪問
app.get('/api/admin/v1/reports',
  authenticateToken(),
  requireAdmin(),
  async (c) => {
    // 報表邏輯
  }
)
```

### 4. 會員等級檢查

```typescript
import { authenticateToken, requireMemberTier } from '@/middlewares/auth'

// 需要金卡以上會員
app.get('/api/v1/premium-content',
  authenticateToken(),
  requireMemberTier('gold'),
  async (c) => {
    // 高級內容邏輯
  }
)
```

## 錯誤響應範例

### 認證失敗 (401)
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "無效的 Token",
    "timestamp": "2024-01-01T10:00:00.000Z",
    "requestId": "req_1234567890"
  }
}
```

### 權限不足 (403)
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "權限不足，缺少權限: user.delete",
    "requiredPermissions": ["user.delete"],
    "timestamp": "2024-01-01T10:00:00.000Z",
    "requestId": "req_1234567890"
  }
}
```

### 密碼強度不足 (400)
```json
{
  "success": false,
  "error": {
    "code": "REGISTRATION_FAILED",
    "message": "密碼強度不足",
    "errors": [
      {
        "field": "password",
        "message": "缺少大寫字母",
        "code": "WEAK_PASSWORD"
      },
      {
        "field": "password", 
        "message": "缺少特殊字符",
        "code": "WEAK_PASSWORD"
      }
    ],
    "timestamp": "2024-01-01T10:00:00.000Z",
    "requestId": "req_1234567890"
  }
}
```

## 安全特性

### 1. JWT Token 管理
- Access Token: 15分鐘有效期
- Refresh Token: 7天有效期
- Token 黑名單機制
- 自動刷新機制

### 2. 密碼安全
- 強密碼策略檢查
- 安全的密碼哈希 (SHA-256 + Salt + 10000 輪)
- 防止使用常見弱密碼
- 防止使用個人信息作為密碼

### 3. 速率限制
- 註冊: 5次/15分鐘
- 登入: 10次/15分鐘
- 密碼重設: 3次/15分鐘
- Token 刷新: 20次/15分鐘

### 4. 安全審計
- 登入失敗記錄
- 權限變更日誌
- 安全事件監控
- 會話管理

### 5. 多重會話管理
- 設備指紋追蹤
- 異常登入檢測
- 會話撤銷機制
- 並發會話限制

## 開發注意事項

1. **環境變數配置**:
   - `JWT_SECRET`: JWT 簽名密鑰
   - `SESSION_KV`: 會話存儲
   - `CACHE_KV`: 權限快取

2. **數據庫遷移**:
   確保執行所有認證相關的數據庫遷移

3. **CORS 設定**:
   配置適當的 CORS 策略以支援前端應用

4. **錯誤處理**:
   統一的錯誤響應格式，便於前端處理

5. **日誌記錄**:
   重要操作都有相應的日誌記錄