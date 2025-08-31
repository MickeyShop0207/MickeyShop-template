# 前後台API整合規格

## 整合架構概述

### 前台客戶端 (Customer Frontend)
- **目標用戶**：一般消費者、會員
- **主要功能**：產品瀏覽、購物車、訂單、會員功能
- **API 前綴**：`/api/v1/`
- **認證方式**：JWT Token (會員登入後)
- **權限控制**：基於會員狀態和等級

### 後台管理端 (Admin Backend)  
- **目標用戶**：管理員、客服、商家
- **主要功能**：產品管理、訂單管理、會員管理、系統設置
- **API 前綴**：`/api/admin/v1/`
- **認證方式**：JWT Token (管理員登入)
- **權限控制**：RBAC角色權限系統

## API路由整合規格

### 前台API路由結構
```
/api/v1/
├── auth/                    # 會員認證
│   ├── login               # 會員登入
│   ├── register            # 會員註冊
│   ├── logout              # 登出
│   ├── refresh             # Token刷新
│   └── social/             # 社交登入
├── products/               # 產品相關
│   ├── /                   # 產品列表
│   ├── /:id                # 產品詳情
│   ├── /categories         # 分類列表
│   └── /search             # 產品搜索
├── cart/                   # 購物車
│   ├── /                   # 購物車內容
│   ├── /add                # 添加商品
│   ├── /update             # 更新數量
│   └── /remove             # 移除商品
├── orders/                 # 訂單管理
│   ├── /                   # 訂單列表
│   ├── /create             # 創建訂單
│   ├── /:id                # 訂單詳情
│   └── /:id/cancel         # 取消訂單
├── member/                 # 會員功能
│   ├── /profile            # 會員資料
│   ├── /points             # 積分記錄
│   ├── /addresses          # 地址管理
│   └── /favorites          # 收藏商品
└── notifications/          # 通知消息
    ├── /                   # 通知列表
    └── /:id/read           # 標記已讀
```

### 後台API路由結構
```
/api/admin/v1/
├── auth/                   # 管理員認證
│   ├── login              # 管理員登入
│   ├── logout             # 登出
│   └── refresh            # Token刷新
├── dashboard/             # 儀表板數據
│   ├── stats              # 統計數據
│   └── charts             # 圖表數據
├── products/              # 產品管理
│   ├── /                  # 產品列表
│   ├── /create            # 創建產品
│   ├── /:id               # 產品詳情
│   ├── /:id/update        # 更新產品
│   ├── /:id/delete        # 刪除產品
│   └── /categories        # 分類管理
├── orders/                # 訂單管理
│   ├── /                  # 訂單列表
│   ├── /:id               # 訂單詳情
│   ├── /:id/update-status # 更新訂單狀態
│   └── /:id/refund        # 退款處理
├── members/               # 會員管理
│   ├── /                  # 會員列表
│   ├── /:id               # 會員詳情
│   ├── /:id/update        # 更新會員信息
│   └── /:id/points        # 積分管理
├── admins/                # 管理員管理
│   ├── /                  # 管理員列表
│   ├── /create            # 創建管理員
│   ├── /:id               # 管理員詳情
│   └── /:id/permissions   # 權限管理
├── system/                # 系統管理
│   ├── settings           # 系統設置
│   ├── logs               # 系統日誌
│   └── monitoring         # 系統監控
└── reports/               # 報表統計
    ├── sales              # 銷售報表
    ├── members            # 會員報表
    └── products           # 產品報表
```

## 統一響應格式

### 成功響應格式
```typescript
interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    pagination?: PaginationMeta;
    timestamp: string;
    requestId: string;
    version: string;
  };
  message?: string;
}

interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
```

### 錯誤響應格式
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    field?: string;
    timestamp: string;
    requestId: string;
  };
}
```

### 錯誤代碼規範
```typescript
enum APIErrorCode {
  // 認證相關 (AUTH_)
  AUTH_INVALID_TOKEN = 'AUTH_INVALID_TOKEN',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_INSUFFICIENT_PERMISSIONS',
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  
  // 驗證相關 (VALIDATION_)
  VALIDATION_REQUIRED_FIELD = 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT',
  VALIDATION_OUT_OF_RANGE = 'VALIDATION_OUT_OF_RANGE',
  
  // 資源相關 (RESOURCE_)
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_IN_USE = 'RESOURCE_IN_USE',
  
  // 業務邏輯 (BUSINESS_)
  BUSINESS_INSUFFICIENT_STOCK = 'BUSINESS_INSUFFICIENT_STOCK',
  BUSINESS_INVALID_OPERATION = 'BUSINESS_INVALID_OPERATION',
  BUSINESS_CONSTRAINT_VIOLATION = 'BUSINESS_CONSTRAINT_VIOLATION',
  
  // 系統相關 (SYSTEM_)
  SYSTEM_INTERNAL_ERROR = 'SYSTEM_INTERNAL_ERROR',
  SYSTEM_SERVICE_UNAVAILABLE = 'SYSTEM_SERVICE_UNAVAILABLE',
  SYSTEM_RATE_LIMIT_EXCEEDED = 'SYSTEM_RATE_LIMIT_EXCEEDED'
}
```

## 認證與授權整合

### JWT Token 結構
```typescript
interface JWTPayload {
  // 通用字段
  sub: string;           // 用戶ID
  iat: number;          // 簽發時間
  exp: number;          // 過期時間
  type: 'member' | 'admin';  // 用戶類型
  
  // 會員專用字段
  memberTier?: MemberTier;
  memberStatus?: MemberStatus;
  
  // 管理員專用字段
  role?: string;
  permissions?: string[];
  department?: string;
}
```

### 認證中間件整合
```typescript
export const authMiddleware = (options: AuthOptions = {}): Middleware => {
  return async (c, next) => {
    const { requireAuth = true, userType, permissions } = options;
    
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader && requireAuth) {
      return c.json({
        success: false,
        error: {
          code: APIErrorCode.AUTH_INVALID_TOKEN,
          message: '缺少認證令牌',
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId')
        }
      }, 401);
    }
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = await verifyJWT(token);
        
        // 檢查用戶類型
        if (userType && payload.type !== userType) {
          return c.json({
            success: false,
            error: {
              code: APIErrorCode.AUTH_INSUFFICIENT_PERMISSIONS,
              message: '用戶類型不匹配',
              timestamp: new Date().toISOString(),
              requestId: c.get('requestId')
            }
          }, 403);
        }
        
        // 檢查權限
        if (permissions && payload.type === 'admin') {
          const hasPermission = permissions.some(p => 
            payload.permissions?.includes(p)
          );
          
          if (!hasPermission) {
            return c.json({
              success: false,
              error: {
                code: APIErrorCode.AUTH_INSUFFICIENT_PERMISSIONS,
                message: '權限不足',
                timestamp: new Date().toISOString(),
                requestId: c.get('requestId')
              }
            }, 403);
          }
        }
        
        c.set('user', payload);
      } catch (error) {
        return c.json({
          success: false,
          error: {
            code: APIErrorCode.AUTH_TOKEN_EXPIRED,
            message: '認證令牌無效或已過期',
            timestamp: new Date().toISOString(),
            requestId: c.get('requestId')
          }
        }, 401);
      }
    }
    
    await next();
  };
};
```

## 請求驗證整合

### 通用驗證中間件
```typescript
export const validateRequest = <T>(schema: ValidationSchema<T>): Middleware => {
  return async (c, next) => {
    try {
      const body = await c.req.json();
      const query = c.req.query();
      const params = c.req.param();
      
      // 合併所有輸入數據
      const data = { ...params, ...query, ...body };
      
      // 執行驗證
      const result = await validateData(data, schema);
      
      if (!result.isValid) {
        return c.json({
          success: false,
          error: {
            code: APIErrorCode.VALIDATION_REQUIRED_FIELD,
            message: '數據驗證失敗',
            details: result.errors,
            timestamp: new Date().toISOString(),
            requestId: c.get('requestId')
          }
        }, 400);
      }
      
      c.set('validatedData', result.data);
      await next();
      
    } catch (error) {
      return c.json({
        success: false,
        error: {
          code: APIErrorCode.VALIDATION_INVALID_FORMAT,
          message: '請求數據格式錯誤',
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId')
        }
      }, 400);
    }
  };
};
```

### 常用驗證規則
```typescript
const CommonValidationRules = {
  // ID驗證
  id: { required: true, type: 'string', pattern: /^[A-Za-z0-9_-]+$/ },
  
  // 分頁參數
  page: { type: 'number', min: 1, default: 1 },
  limit: { type: 'number', min: 1, max: 100, default: 20 },
  
  // 會員相關
  email: { required: true, type: 'email' },
  password: { required: true, type: 'string', minLength: 8 },
  phone: { type: 'string', pattern: /^[\d-+().\s]+$/ },
  
  // 產品相關
  productName: { required: true, type: 'string', maxLength: 200 },
  price: { required: true, type: 'number', min: 0 },
  stock: { required: true, type: 'integer', min: 0 },
  
  // 訂單相關
  quantity: { required: true, type: 'integer', min: 1 },
  amount: { required: true, type: 'number', min: 0 }
};
```

## 快取策略整合

### 響應快取配置
```typescript
interface CacheConfig {
  key: string;
  ttl: number;
  tags?: string[];
  vary?: string[];
}

const CacheConfigs = {
  // 前台快取配置
  frontend: {
    products: { key: 'products', ttl: 300, tags: ['product'] },
    categories: { key: 'categories', ttl: 600, tags: ['category'] },
    memberProfile: { key: 'member:{userId}', ttl: 300, vary: ['Authorization'] }
  },
  
  // 後台快取配置  
  admin: {
    dashboard: { key: 'dashboard:{adminId}', ttl: 60, vary: ['Authorization'] },
    systemStats: { key: 'system-stats', ttl: 30 },
    reports: { key: 'reports:{type}:{date}', ttl: 3600 }
  }
};
```

### 快取中間件
```typescript
export const cacheMiddleware = (config: CacheConfig): Middleware => {
  return async (c, next) => {
    const cacheKey = interpolateKey(config.key, c);
    
    // 檢查快取
    const cached = await cache.get(cacheKey);
    if (cached) {
      return c.json(JSON.parse(cached));
    }
    
    await next();
    
    // 快取響應
    const response = await c.res.clone().json();
    if (response.success) {
      await cache.set(cacheKey, JSON.stringify(response), config.ttl);
      
      // 設置快取標籤
      if (config.tags) {
        await cache.tag(cacheKey, config.tags);
      }
    }
  };
};
```

## 限流與安全整合

### API 限流配置
```typescript
const RateLimitConfigs = {
  // 前台限流
  frontend: {
    login: { requests: 5, window: 300 },      // 5次/5分鐘
    register: { requests: 3, window: 300 },   // 3次/5分鐘  
    general: { requests: 1000, window: 3600 }, // 1000次/小時
    search: { requests: 100, window: 300 }     // 100次/5分鐘
  },
  
  // 後台限流
  admin: {
    login: { requests: 10, window: 300 },     // 10次/5分鐘
    general: { requests: 5000, window: 3600 }, // 5000次/小時
    reports: { requests: 20, window: 300 }     // 20次/5分鐘
  }
};
```

### 安全中間件整合
```typescript
export const securityMiddleware = (): Middleware => {
  return async (c, next) => {
    // 設置安全標頭
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('X-XSS-Protection', '1; mode=block');
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // CORS 設置
    const origin = c.req.header('Origin');
    if (isAllowedOrigin(origin)) {
      c.header('Access-Control-Allow-Origin', origin);
      c.header('Access-Control-Allow-Credentials', 'true');
    }
    
    // 檢查內容類型
    const contentType = c.req.header('Content-Type');
    if (c.req.method === 'POST' && contentType && !contentType.includes('application/json')) {
      return c.json({
        success: false,
        error: {
          code: APIErrorCode.VALIDATION_INVALID_FORMAT,
          message: '不支持的內容類型',
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId')
        }
      }, 400);
    }
    
    await next();
  };
};
```

## 錯誤處理整合

### 全局錯誤處理器
```typescript
export const globalErrorHandler = (): Middleware => {
  return async (c, next) => {
    try {
      await next();
    } catch (error) {
      console.error('API Error:', error);
      
      let errorResponse: ErrorResponse;
      
      if (error instanceof ValidationError) {
        errorResponse = {
          success: false,
          error: {
            code: APIErrorCode.VALIDATION_REQUIRED_FIELD,
            message: error.message,
            details: error.details,
            field: error.field,
            timestamp: new Date().toISOString(),
            requestId: c.get('requestId')
          }
        };
        return c.json(errorResponse, 400);
        
      } else if (error instanceof AuthError) {
        errorResponse = {
          success: false,
          error: {
            code: APIErrorCode.AUTH_INSUFFICIENT_PERMISSIONS,
            message: error.message,
            timestamp: new Date().toISOString(),
            requestId: c.get('requestId')
          }
        };
        return c.json(errorResponse, 401);
        
      } else if (error instanceof BusinessError) {
        errorResponse = {
          success: false,
          error: {
            code: error.code as APIErrorCode,
            message: error.message,
            details: error.details,
            timestamp: new Date().toISOString(),
            requestId: c.get('requestId')
          }
        };
        return c.json(errorResponse, 400);
        
      } else {
        // 系統錯誤
        errorResponse = {
          success: false,
          error: {
            code: APIErrorCode.SYSTEM_INTERNAL_ERROR,
            message: '系統內部錯誤',
            timestamp: new Date().toISOString(),
            requestId: c.get('requestId')
          }
        };
        return c.json(errorResponse, 500);
      }
    }
  };
};
```

## API 文檔生成

### OpenAPI 規範生成
```typescript
interface APIDocConfig {
  title: string;
  version: string;
  description: string;
  baseURL: string;
  authScheme: 'bearer' | 'basic';
}

const FrontendAPIDoc: APIDocConfig = {
  title: 'MickeyShop Beauty - 前台 API',
  version: '1.0.0',
  description: '美妝電商前台客戶端 API',
  baseURL: '/api/v1',
  authScheme: 'bearer'
};

const AdminAPIDoc: APIDocConfig = {
  title: 'MickeyShop Beauty - 後台管理 API', 
  version: '1.0.0',
  description: '美妝電商後台管理 API',
  baseURL: '/api/admin/v1',
  authScheme: 'bearer'
};
```

### 自動文檔生成中間件
```typescript
export const apiDocMiddleware = (config: APIDocConfig): Middleware => {
  return async (c, next) => {
    if (c.req.path.endsWith('/docs')) {
      const openApiSpec = generateOpenAPISpec(config);
      return c.json(openApiSpec);
    }
    
    if (c.req.path.endsWith('/docs/ui')) {
      const swaggerUI = generateSwaggerUI(config.baseURL + '/docs');
      return c.html(swaggerUI);
    }
    
    await next();
  };
};
```

## 監控與日誌整合

### API 監控中間件
```typescript
export const apiMonitoringMiddleware = (): Middleware => {
  return async (c, next) => {
    const startTime = Date.now();
    const requestId = generateId();
    
    c.set('requestId', requestId);
    c.set('startTime', startTime);
    
    try {
      await next();
      
      const executionTime = Date.now() - startTime;
      const userType = c.get('user')?.type || 'anonymous';
      
      // 記錄成功請求
      await recordMetric({
        metricName: `api_request_${userType}`,
        metricType: 'business',
        metricValue: 1,
        tags: {
          method: c.req.method,
          path: c.req.path,
          status: c.res.status,
          userType
        }
      });
      
      // 記錄響應時間
      await recordMetric({
        metricName: `api_response_time_${userType}`,
        metricType: 'performance', 
        metricValue: executionTime,
        unit: 'ms',
        tags: {
          path: c.req.path,
          method: c.req.method,
          userType
        }
      });
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // 記錄錯誤請求
      await recordMetric({
        metricName: 'api_error_rate',
        metricType: 'error',
        metricValue: 1,
        tags: {
          path: c.req.path,
          method: c.req.method,
          error: error.name
        }
      });
      
      throw error;
    }
  };
};
```

## 版本控制策略

### API 版本管理
```typescript
interface APIVersion {
  version: string;
  deprecated?: boolean;
  deprecationDate?: Date;
  supportEndDate?: Date;
  migrationGuide?: string;
}

const SupportedVersions: APIVersion[] = [
  {
    version: 'v1',
    deprecated: false
  },
  {
    version: 'v0',
    deprecated: true,
    deprecationDate: new Date('2024-01-01'),
    supportEndDate: new Date('2024-06-01'),
    migrationGuide: '/docs/migration/v0-to-v1'
  }
];
```

### 版本檢查中間件
```typescript
export const versionCheckMiddleware = (): Middleware => {
  return async (c, next) => {
    const pathSegments = c.req.path.split('/');
    const versionIndex = pathSegments.findIndex(segment => 
      segment.match(/^v\d+$/)
    );
    
    if (versionIndex === -1) {
      return c.json({
        success: false,
        error: {
          code: APIErrorCode.VALIDATION_INVALID_FORMAT,
          message: '缺少 API 版本',
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId')
        }
      }, 400);
    }
    
    const version = pathSegments[versionIndex];
    const versionInfo = SupportedVersions.find(v => v.version === version);
    
    if (!versionInfo) {
      return c.json({
        success: false,
        error: {
          code: APIErrorCode.VALIDATION_INVALID_FORMAT,
          message: `不支持的 API 版本: ${version}`,
          timestamp: new Date().toISOString(),
          requestId: c.get('requestId')
        }
      }, 400);
    }
    
    if (versionInfo.deprecated) {
      c.header('X-API-Deprecated', 'true');
      c.header('X-API-Deprecation-Date', versionInfo.deprecationDate?.toISOString() || '');
      c.header('X-API-Support-End-Date', versionInfo.supportEndDate?.toISOString() || '');
      
      if (versionInfo.migrationGuide) {
        c.header('X-API-Migration-Guide', versionInfo.migrationGuide);
      }
    }
    
    c.set('apiVersion', version);
    await next();
  };
};
```

## 完整的路由設置範例

### 前台路由設置
```typescript
import { Hono } from 'hono';

const frontendAPI = new Hono();

// 全局中間件
frontendAPI.use('*', requestIdMiddleware());
frontendAPI.use('*', corsMiddleware());
frontendAPI.use('*', securityMiddleware());
frontendAPI.use('*', rateLimitMiddleware(RateLimitConfigs.frontend.general));
frontendAPI.use('*', apiMonitoringMiddleware());
frontendAPI.use('*', versionCheckMiddleware());

// 認證路由 (無需登入)
frontendAPI.post('/v1/auth/login', 
  rateLimitMiddleware(RateLimitConfigs.frontend.login),
  validateRequest(LoginSchema),
  memberAuthController.login
);

frontendAPI.post('/v1/auth/register',
  rateLimitMiddleware(RateLimitConfigs.frontend.register), 
  validateRequest(RegisterSchema),
  memberAuthController.register
);

// 產品路由 (無需登入)
frontendAPI.get('/v1/products',
  cacheMiddleware(CacheConfigs.frontend.products),
  validateRequest(ProductListSchema),
  productController.list
);

frontendAPI.get('/v1/products/:id',
  cacheMiddleware({ key: 'product:{id}', ttl: 300 }),
  validateRequest(ProductDetailSchema),
  productController.detail
);

// 會員功能 (需要登入)
frontendAPI.use('/v1/member/*', authMiddleware({ userType: 'member' }));
frontendAPI.get('/v1/member/profile', memberController.getProfile);
frontendAPI.put('/v1/member/profile', 
  validateRequest(UpdateProfileSchema),
  memberController.updateProfile
);

// 訂單功能 (需要登入)
frontendAPI.use('/v1/orders/*', authMiddleware({ userType: 'member' }));
frontendAPI.get('/v1/orders', orderController.list);
frontendAPI.post('/v1/orders',
  validateRequest(CreateOrderSchema), 
  orderController.create
);

// 錯誤處理
frontendAPI.use('*', globalErrorHandler());

export { frontendAPI };
```

### 後台路由設置  
```typescript
const adminAPI = new Hono();

// 全局中間件
adminAPI.use('*', requestIdMiddleware());
adminAPI.use('*', corsMiddleware());
adminAPI.use('*', securityMiddleware());
adminAPI.use('*', rateLimitMiddleware(RateLimitConfigs.admin.general));
adminAPI.use('*', apiMonitoringMiddleware());
adminAPI.use('*', versionCheckMiddleware());

// 管理員認證 (無需登入)
adminAPI.post('/v1/auth/login',
  rateLimitMiddleware(RateLimitConfigs.admin.login),
  validateRequest(AdminLoginSchema),
  adminAuthController.login
);

// 儀表板 (需要管理員權限)
adminAPI.use('/v1/dashboard/*', authMiddleware({ 
  userType: 'admin',
  permissions: ['dashboard.view']
}));
adminAPI.get('/v1/dashboard/stats', 
  cacheMiddleware(CacheConfigs.admin.dashboard),
  dashboardController.getStats
);

// 產品管理 (需要相應權限)
adminAPI.use('/v1/products/*', authMiddleware({ userType: 'admin' }));
adminAPI.get('/v1/products',
  requirePermission('product.read'),
  productAdminController.list
);
adminAPI.post('/v1/products',
  requirePermission('product.create'),
  validateRequest(CreateProductSchema),
  productAdminController.create
);

// 訂單管理
adminAPI.use('/v1/orders/*', authMiddleware({ userType: 'admin' }));
adminAPI.get('/v1/orders',
  requirePermission('order.read'), 
  orderAdminController.list
);

// 會員管理
adminAPI.use('/v1/members/*', authMiddleware({ userType: 'admin' }));
adminAPI.get('/v1/members',
  requirePermission('member.read'),
  memberAdminController.list
);

// 系統管理 (需要系統管理員權限)
adminAPI.use('/v1/system/*', authMiddleware({ 
  userType: 'admin',
  permissions: ['system.admin']
}));
adminAPI.get('/v1/system/logs', systemController.getLogs);
adminAPI.get('/v1/system/monitoring', systemController.getMonitoring);

// 錯誤處理
adminAPI.use('*', globalErrorHandler());

export { adminAPI };
```

這份整合規格提供了前後台API的完整整合標準，包括路由結構、認證授權、錯誤處理、快取策略、安全控制等各個方面，確保兩端API的一致性和可維護性。