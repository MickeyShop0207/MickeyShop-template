# API 介面規範統一 (Unified API Interface Standards)

## 1. 概述

本文檔建立 MickeyShop Beauty 系統統一的 API 介面規範，解決目前系統中 API 路由前綴混亂、回應格式不一致、錯誤處理不統一等問題，確保前台與後台 API 的一致性和可維護性。

## 2. 發現的問題分析

### 2.1 路由前綴混亂問題

**發現的不一致：**
```javascript
// 系統架構設計中
GET /api/products
GET /api/orders

// 實際模組實現中  
GET /admin/products
GET /admin/inventory
GET /api/admin/orders

// 贈品模組中
GET /admin/api/gifts
```

**問題影響：**
- 前端無法預測 API 路徑
- 不同模組使用不同的路由規則
- 增加開發和維護複雜度

### 2.2 回應格式不統一問題

**問題：**
- 部分 API 使用統一回應格式
- 部分直接返回資料物件
- 錯誤處理格式不一致

## 3. 統一 API 設計規範

### 3.1 路由規範

#### 3.1.1 路由前綴標準
```
前台 API:     /api/v1/{resource}
後台 API:     /api/admin/v1/{resource}
系統 API:     /api/system/v1/{resource}
第三方 API:   /api/external/v1/{provider}
內部 API:     /api/internal/v1/{service}
```

#### 3.1.2 RESTful 路由設計
```
GET    /api/v1/products              # 獲取商品列表
GET    /api/v1/products/{id}         # 獲取單個商品
POST   /api/v1/products              # 建立商品
PUT    /api/v1/products/{id}         # 完整更新商品
PATCH  /api/v1/products/{id}         # 部分更新商品
DELETE /api/v1/products/{id}         # 刪除商品

# 巢狀資源
GET    /api/v1/products/{id}/skus            # 獲取商品的 SKU 列表
POST   /api/v1/products/{id}/skus            # 為商品建立 SKU
GET    /api/v1/products/{id}/skus/{sku_id}   # 獲取特定 SKU
PUT    /api/v1/products/{id}/skus/{sku_id}   # 更新 SKU
DELETE /api/v1/products/{id}/skus/{sku_id}   # 刪除 SKU

# 動作型路由（非標準 CRUD 操作）
POST   /api/v1/orders/{id}/cancel            # 取消訂單
POST   /api/v1/orders/{id}/confirm           # 確認訂單
POST   /api/v1/orders/{id}/refund            # 退款
PUT    /api/v1/products/{id}/activate        # 啟用商品
PUT    /api/v1/products/{id}/deactivate      # 停用商品
```

### 3.2 統一回應格式

#### 3.2.1 成功回應格式
```typescript
interface APIResponse<T> {
  success: true;
  data: T;
  meta?: {
    pagination?: PaginationMeta;
    total?: number;
    filters?: Record<string, any>;
    sort?: string;
  };
  timestamp: string;
  requestId: string;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 範例：獲取商品列表
{
  "success": true,
  "data": [
    {
      "productId": "prod_001",
      "productName": "精華液",
      "basePrice": 1200,
      "status": "active"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalPages": 5,
      "total": 95,
      "hasNext": true,
      "hasPrev": false
    },
    "total": 95,
    "filters": {
      "status": "active",
      "category": "skincare"
    }
  },
  "timestamp": "2024-03-01T10:30:00Z",
  "requestId": "req_abc123"
}

// 範例：獲取單個資源
{
  "success": true,
  "data": {
    "productId": "prod_001",
    "productName": "精華液",
    "basePrice": 1200,
    "status": "active"
  },
  "timestamp": "2024-03-01T10:30:00Z",
  "requestId": "req_abc124"
}

// 範例：建立/更新操作
{
  "success": true,
  "data": {
    "productId": "prod_001",
    "productName": "精華液",
    "basePrice": 1200,
    "status": "active"
  },
  "meta": {
    "operation": "created", // "created", "updated", "deleted"
    "changes": ["productName", "basePrice"]
  },
  "timestamp": "2024-03-01T10:30:00Z",
  "requestId": "req_abc125"
}
```

#### 3.2.2 錯誤回應格式
```typescript
interface APIErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    field?: string; // 驗證錯誤專用
    validation?: ValidationError[]; // 多欄位驗證錯誤
  };
  timestamp: string;
  requestId: string;
  path: string;
  method: string;
}

interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

// 範例：驗證錯誤
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "請求資料驗證失敗",
    "validation": [
      {
        "field": "productName",
        "message": "商品名稱不能為空",
        "code": "REQUIRED",
        "value": null
      },
      {
        "field": "basePrice",
        "message": "價格必須大於 0",
        "code": "MIN_VALUE",
        "value": -10
      }
    ]
  },
  "timestamp": "2024-03-01T10:30:00Z",
  "requestId": "req_abc126",
  "path": "/api/v1/products",
  "method": "POST"
}

// 範例：業務邏輯錯誤
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_INVENTORY",
    "message": "庫存不足，無法完成訂單",
    "details": {
      "skuId": "sku_001",
      "requestedQuantity": 10,
      "availableQuantity": 5
    }
  },
  "timestamp": "2024-03-01T10:30:00Z",
  "requestId": "req_abc127",
  "path": "/api/v1/orders",
  "method": "POST"
}

// 範例：系統錯誤
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "伺服器內部錯誤",
    "details": {
      "errorId": "err_xyz789"
    }
  },
  "timestamp": "2024-03-01T10:30:00Z",
  "requestId": "req_abc128",
  "path": "/api/v1/products",
  "method": "GET"
}
```

### 3.3 HTTP 狀態碼規範

```typescript
// 成功回應
200 OK          // 成功獲取資源或更新資源
201 Created     // 成功建立資源
204 No Content  // 成功刪除資源或無內容回應

// 客戶端錯誤
400 Bad Request          // 請求格式錯誤或參數無效
401 Unauthorized         // 未認證
403 Forbidden           // 已認證但無權限
404 Not Found           // 資源不存在  
409 Conflict            // 資源衝突（如重複建立）
422 Unprocessable Entity // 驗證失敗
429 Too Many Requests   // 請求頻率過高

// 伺服器錯誤
500 Internal Server Error // 伺服器內部錯誤
502 Bad Gateway          // 上游服務錯誤
503 Service Unavailable  // 服務暫時不可用
504 Gateway Timeout      // 上游服務超時
```

### 3.4 請求參數規範

#### 3.4.1 查詢參數標準
```typescript
// 分頁參數
?page=1&pageSize=20

// 排序參數
?sort=createdAt:desc,productName:asc

// 過濾參數
?status=active&category=skincare&priceMin=100&priceMax=1000

// 搜尋參數
?search=精華液&searchFields=productName,description

// 包含關聯資源
?include=category,skus,images

// 欄位選擇
?fields=productId,productName,basePrice

// 日期範圍
?dateFrom=2024-01-01&dateTo=2024-12-31

// 完整範例
GET /api/v1/products?page=1&pageSize=20&sort=createdAt:desc&status=active&category=skincare&include=category,skus&fields=productId,productName,basePrice,category
```

#### 3.4.2 路徑參數規範
```typescript
// 使用資源 ID
GET /api/v1/products/{productId}
GET /api/v1/orders/{orderId}
GET /api/v1/customers/{customerId}

// 複合 ID 使用冒號分隔
GET /api/v1/products/{productId}/skus/{skuId}
GET /api/v1/orders/{orderId}/items/{itemId}
```

## 4. 模組化路由設計

### 4.1 前台 API 路由 (/api/v1)

```typescript
// 商品相關
GET    /api/v1/products                    // 商品列表
GET    /api/v1/products/{id}               // 商品詳情
GET    /api/v1/products/{id}/variants      // 商品變體
GET    /api/v1/products/{id}/reviews       // 商品評論
GET    /api/v1/categories                  // 分類列表
GET    /api/v1/categories/{id}             // 分類詳情

// 購物車相關
GET    /api/v1/cart                        // 獲取購物車
POST   /api/v1/cart/items                  // 加入商品
PUT    /api/v1/cart/items/{id}             // 更新商品數量
DELETE /api/v1/cart/items/{id}             // 移除商品
DELETE /api/v1/cart                        // 清空購物車

// 訂單相關
POST   /api/v1/orders                      // 建立訂單
GET    /api/v1/orders/{id}                 // 訂單詳情
POST   /api/v1/orders/{id}/cancel          // 取消訂單
GET    /api/v1/orders/{id}/tracking        // 物流追蹤

// 客戶相關
POST   /api/v1/customers/register          // 註冊
POST   /api/v1/customers/login             // 登入
POST   /api/v1/customers/logout            // 登出
GET    /api/v1/customers/profile           // 個人資料
PUT    /api/v1/customers/profile           // 更新資料
GET    /api/v1/customers/orders            // 訂單歷史
GET    /api/v1/customers/addresses         // 地址列表
POST   /api/v1/customers/addresses         // 新增地址

// 促銷相關
GET    /api/v1/promotions                  // 促銷活動
POST   /api/v1/promotions/validate         // 驗證優惠券
GET    /api/v1/gift-with-purchase          // 滿額贈

// 其他
GET    /api/v1/shipping/rates              // 運費計算
GET    /api/v1/payments/methods            // 付款方式
POST   /api/v1/contact                     // 聯絡表單
GET    /api/v1/stores/nearby               // 附近門市
```

### 4.2 後台 API 路由 (/api/admin/v1)

```typescript
// 管理員相關
POST   /api/admin/v1/auth/login            // 管理員登入
POST   /api/admin/v1/auth/logout           // 登出
GET    /api/admin/v1/auth/profile          // 個人資料
GET    /api/admin/v1/users                 // 管理員列表
POST   /api/admin/v1/users                 // 建立管理員
GET    /api/admin/v1/roles                 // 角色列表
GET    /api/admin/v1/permissions           // 權限列表

// 商品管理
GET    /api/admin/v1/products              // 商品列表
POST   /api/admin/v1/products              // 建立商品
GET    /api/admin/v1/products/{id}         // 商品詳情
PUT    /api/admin/v1/products/{id}         // 更新商品
DELETE /api/admin/v1/products/{id}         // 刪除商品
POST   /api/admin/v1/products/{id}/skus    // 建立 SKU
POST   /api/admin/v1/products/bulk-import  // 批量匯入
POST   /api/admin/v1/products/bulk-export  // 批量匯出

// 訂單管理
GET    /api/admin/v1/orders                // 訂單列表
GET    /api/admin/v1/orders/{id}           // 訂單詳情
PUT    /api/admin/v1/orders/{id}/status    // 更新訂單狀態
POST   /api/admin/v1/orders/{id}/refund    // 處理退款
POST   /api/admin/v1/orders/{id}/ship      // 安排出貨

// 庫存管理
GET    /api/admin/v1/inventory             // 庫存列表
POST   /api/admin/v1/inventory/adjust      // 庫存調整
GET    /api/admin/v1/inventory/movements   // 庫存異動紀錄
POST   /api/admin/v1/inventory/stocktake   // 盤點作業

// 客戶管理
GET    /api/admin/v1/customers             // 客戶列表
GET    /api/admin/v1/customers/{id}        // 客戶詳情
PUT    /api/admin/v1/customers/{id}        // 更新客戶資料
GET    /api/admin/v1/customers/{id}/orders // 客戶訂單

// 促銷管理
GET    /api/admin/v1/promotions            // 促銷列表
POST   /api/admin/v1/promotions            // 建立促銷
GET    /api/admin/v1/coupons               // 優惠券管理
POST   /api/admin/v1/gift-rules            // 贈品規則

// 報表分析
GET    /api/admin/v1/reports/sales         // 銷售報表
GET    /api/admin/v1/reports/inventory     // 庫存報表
GET    /api/admin/v1/reports/customers     // 客戶分析
GET    /api/admin/v1/analytics/dashboard   // 儀表板數據

// 系統設定
GET    /api/admin/v1/settings              // 設定列表
PUT    /api/admin/v1/settings/{key}        // 更新設定
GET    /api/admin/v1/system/status         // 系統狀態
POST   /api/admin/v1/system/backup         // 系統備份
```

### 4.3 系統 API 路由 (/api/system/v1)

```typescript
// 健康檢查
GET    /api/system/v1/health               // 系統健康狀態
GET    /api/system/v1/version              // 系統版本資訊

// 監控相關
GET    /api/system/v1/metrics              // 系統指標
GET    /api/system/v1/logs                 // 系統日誌

// 通知系統
POST   /api/system/v1/notifications/send   // 發送通知
GET    /api/system/v1/notifications/templates // 通知模板

// 檔案上傳
POST   /api/system/v1/files/upload         // 檔案上傳
GET    /api/system/v1/files/{id}           // 檔案下載
DELETE /api/system/v1/files/{id}           // 刪除檔案
```

### 4.4 第三方整合 API 路由 (/api/external/v1)

```typescript
// 綠界金流
POST   /api/external/v1/ecpay/payment-callback    // 付款回調
POST   /api/external/v1/ecpay/logistics-callback  // 物流回調

// LINE Pay
POST   /api/external/v1/linepay/callback          // LINE Pay 回調

// 其他第三方
POST   /api/external/v1/facebook/webhook          // Facebook Webhook
POST   /api/external/v1/google/analytics         // Google Analytics
```

## 5. 中間件設計

### 5.1 通用中間件

```typescript
// 請求 ID 產生器
class RequestIdMiddleware {
  async handle(request: Request, next: Function) {
    request.requestId = generateRequestId();
    request.startTime = Date.now();
    
    const response = await next();
    
    response.headers.set('X-Request-ID', request.requestId);
    response.headers.set('X-Response-Time', `${Date.now() - request.startTime}ms`);
    
    return response;
  }
}

// CORS 處理
class CorsMiddleware {
  async handle(request: Request, next: Function) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400'
        }
      });
    }
    
    const response = await next();
    
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  }
}

// 速率限制
class RateLimitMiddleware {
  private limits = new Map();
  
  async handle(request: Request, next: Function) {
    const clientId = this.getClientId(request);
    const limit = this.getLimit(request.url);
    
    if (await this.isRateLimited(clientId, limit)) {
      return this.createErrorResponse(
        'RATE_LIMIT_EXCEEDED',
        'Too many requests',
        429
      );
    }
    
    return next();
  }
}

// 日誌記錄
class LoggingMiddleware {
  async handle(request: Request, next: Function) {
    const startTime = Date.now();
    
    console.log(`[${request.requestId}] ${request.method} ${request.url}`);
    
    try {
      const response = await next();
      const duration = Date.now() - startTime;
      
      console.log(
        `[${request.requestId}] ${response.status} ${duration}ms`
      );
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.error(
        `[${request.requestId}] ERROR ${duration}ms: ${error.message}`
      );
      
      throw error;
    }
  }
}
```

### 5.2 認證中間件

```typescript
// JWT 認證
class AuthMiddleware {
  async handle(request: Request, next: Function) {
    const token = this.extractToken(request);
    
    if (!token) {
      return this.createErrorResponse(
        'UNAUTHORIZED',
        'Missing authentication token',
        401
      );
    }
    
    try {
      const payload = await this.verifyToken(token);
      request.user = payload;
      return next();
    } catch (error) {
      return this.createErrorResponse(
        'UNAUTHORIZED',
        'Invalid authentication token',
        401
      );
    }
  }
  
  private extractToken(request: Request): string | null {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }
}

// 權限檢查
class PermissionMiddleware {
  constructor(private requiredPermission: string) {}
  
  async handle(request: Request, next: Function) {
    if (!request.user) {
      return this.createErrorResponse(
        'UNAUTHORIZED',
        'Authentication required',
        401
      );
    }
    
    const hasPermission = await this.checkPermission(
      request.user.id,
      this.requiredPermission
    );
    
    if (!hasPermission) {
      return this.createErrorResponse(
        'FORBIDDEN',
        'Insufficient permissions',
        403
      );
    }
    
    return next();
  }
}
```

### 5.3 驗證中間件

```typescript
// 請求驗證
class ValidationMiddleware {
  constructor(private schema: any) {}
  
  async handle(request: Request, next: Function) {
    try {
      const body = await request.json();
      const validated = this.schema.parse(body);
      request.validatedData = validated;
      return next();
    } catch (error) {
      return this.createValidationErrorResponse(error);
    }
  }
  
  private createValidationErrorResponse(error: any): Response {
    const validationErrors = error.errors.map((err: any) => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
      value: err.input
    }));
    
    return Response.json({
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Request validation failed',
        validation: validationErrors
      },
      timestamp: new Date().toISOString(),
      requestId: request.requestId,
      path: request.url,
      method: request.method
    }, { status: 422 });
  }
}
```

## 6. 回應包裝器

### 6.1 成功回應包裝

```typescript
class ResponseWrapper {
  static success<T>(
    data: T, 
    meta?: any,
    status: number = 200
  ): Response {
    const response = {
      success: true,
      data,
      meta,
      timestamp: new Date().toISOString(),
      requestId: this.getCurrentRequestId()
    };
    
    return Response.json(response, { status });
  }
  
  static created<T>(data: T, meta?: any): Response {
    return this.success(data, { ...meta, operation: 'created' }, 201);
  }
  
  static updated<T>(data: T, changes?: string[]): Response {
    return this.success(data, { operation: 'updated', changes }, 200);
  }
  
  static deleted(): Response {
    return new Response(null, { status: 204 });
  }
  
  static paginated<T>(
    data: T[], 
    pagination: PaginationMeta,
    filters?: any,
    sort?: string
  ): Response {
    return this.success(data, {
      pagination,
      total: pagination.total,
      filters,
      sort
    });
  }
}
```

### 6.2 錯誤回應包裝

```typescript
class ErrorResponseWrapper {
  static badRequest(
    code: string,
    message: string,
    details?: any
  ): Response {
    return this.createErrorResponse(code, message, 400, details);
  }
  
  static unauthorized(message: string = 'Unauthorized'): Response {
    return this.createErrorResponse('UNAUTHORIZED', message, 401);
  }
  
  static forbidden(message: string = 'Forbidden'): Response {
    return this.createErrorResponse('FORBIDDEN', message, 403);
  }
  
  static notFound(resource: string = 'Resource'): Response {
    return this.createErrorResponse(
      'NOT_FOUND',
      `${resource} not found`,
      404
    );
  }
  
  static conflict(
    code: string,
    message: string,
    details?: any
  ): Response {
    return this.createErrorResponse(code, message, 409, details);
  }
  
  static validationError(errors: ValidationError[]): Response {
    return Response.json({
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Validation failed',
        validation: errors
      },
      timestamp: new Date().toISOString(),
      requestId: this.getCurrentRequestId(),
      path: this.getCurrentPath(),
      method: this.getCurrentMethod()
    }, { status: 422 });
  }
  
  static internalError(
    message: string = 'Internal server error',
    errorId?: string
  ): Response {
    return this.createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      message,
      500,
      { errorId }
    );
  }
  
  private static createErrorResponse(
    code: string,
    message: string,
    status: number,
    details?: any
  ): Response {
    return Response.json({
      success: false,
      error: {
        code,
        message,
        details
      },
      timestamp: new Date().toISOString(),
      requestId: this.getCurrentRequestId(),
      path: this.getCurrentPath(),
      method: this.getCurrentMethod()
    }, { status });
  }
}
```

## 7. 路由器設計

### 7.1 模組化路由器

```typescript
// 基礎路由器
class BaseRouter {
  private routes = new Map();
  private middlewares: Middleware[] = [];
  
  use(middleware: Middleware) {
    this.middlewares.push(middleware);
    return this;
  }
  
  get(path: string, handler: Handler, ...middlewares: Middleware[]) {
    return this.register('GET', path, handler, middlewares);
  }
  
  post(path: string, handler: Handler, ...middlewares: Middleware[]) {
    return this.register('POST', path, handler, middlewares);
  }
  
  put(path: string, handler: Handler, ...middlewares: Middleware[]) {
    return this.register('PUT', path, handler, middlewares);
  }
  
  delete(path: string, handler: Handler, ...middlewares: Middleware[]) {
    return this.register('DELETE', path, handler, middlewares);
  }
  
  private register(
    method: string,
    path: string,
    handler: Handler,
    middlewares: Middleware[]
  ) {
    const key = `${method}:${path}`;
    this.routes.set(key, {
      handler,
      middlewares: [...this.middlewares, ...middlewares]
    });
    return this;
  }
  
  async handle(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const key = `${request.method}:${url.pathname}`;
    
    const route = this.routes.get(key);
    if (!route) {
      return ErrorResponseWrapper.notFound('Route');
    }
    
    // 執行中間件鏈
    let index = 0;
    const next = async (): Promise<Response> => {
      if (index < route.middlewares.length) {
        const middleware = route.middlewares[index++];
        return await middleware.handle(request, next);
      } else {
        return await route.handler(request);
      }
    };
    
    try {
      return await next();
    } catch (error) {
      return this.handleError(error, request);
    }
  }
  
  private handleError(error: Error, request: Request): Response {
    console.error(`[${request.requestId}] Error:`, error);
    
    if (error instanceof ValidationError) {
      return ErrorResponseWrapper.validationError(error.errors);
    }
    
    if (error instanceof BusinessError) {
      return ErrorResponseWrapper.badRequest(
        error.code,
        error.message,
        error.details
      );
    }
    
    return ErrorResponseWrapper.internalError(
      'An unexpected error occurred',
      generateErrorId()
    );
  }
}

// 前台路由器
class PublicRouter extends BaseRouter {
  constructor() {
    super();
    this.setupMiddlewares();
    this.setupRoutes();
  }
  
  private setupMiddlewares() {
    this
      .use(new RequestIdMiddleware())
      .use(new CorsMiddleware())
      .use(new RateLimitMiddleware())
      .use(new LoggingMiddleware());
  }
  
  private setupRoutes() {
    // 商品相關
    this
      .get('/api/v1/products', ProductController.list)
      .get('/api/v1/products/:id', ProductController.show)
      .get('/api/v1/categories', CategoryController.list);
    
    // 購物車相關
    this
      .get('/api/v1/cart', CartController.show)
      .post('/api/v1/cart/items', 
        new ValidationMiddleware(AddCartItemSchema),
        CartController.addItem
      );
    
    // 訂單相關
    this
      .post('/api/v1/orders',
        new ValidationMiddleware(CreateOrderSchema),
        OrderController.create
      )
      .get('/api/v1/orders/:id', OrderController.show);
  }
}

// 後台路由器
class AdminRouter extends BaseRouter {
  constructor() {
    super();
    this.setupMiddlewares();
    this.setupRoutes();
  }
  
  private setupMiddlewares() {
    this
      .use(new RequestIdMiddleware())
      .use(new CorsMiddleware())
      .use(new LoggingMiddleware())
      .use(new AuthMiddleware());
  }
  
  private setupRoutes() {
    // 認證相關
    this
      .post('/api/admin/v1/auth/login', AuthController.login)
      .post('/api/admin/v1/auth/logout', AuthController.logout);
    
    // 商品管理
    this
      .get('/api/admin/v1/products', 
        new PermissionMiddleware('product.read'),
        AdminProductController.list
      )
      .post('/api/admin/v1/products',
        new PermissionMiddleware('product.create'),
        new ValidationMiddleware(CreateProductSchema),
        AdminProductController.create
      );
  }
}
```

## 8. 錯誤代碼標準化

### 8.1 錯誤代碼分類

```typescript
// 系統級錯誤 (1000-1999)
enum SystemErrorCode {
  INTERNAL_SERVER_ERROR = 'SYS_1000',
  DATABASE_ERROR = 'SYS_1001',
  CACHE_ERROR = 'SYS_1002',
  EXTERNAL_SERVICE_ERROR = 'SYS_1003',
  CONFIGURATION_ERROR = 'SYS_1004'
}

// 認證授權錯誤 (2000-2999)
enum AuthErrorCode {
  UNAUTHORIZED = 'AUTH_2000',
  FORBIDDEN = 'AUTH_2001',
  TOKEN_EXPIRED = 'AUTH_2002',
  TOKEN_INVALID = 'AUTH_2003',
  LOGIN_FAILED = 'AUTH_2004',
  ACCOUNT_LOCKED = 'AUTH_2005',
  ACCOUNT_INACTIVE = 'AUTH_2006'
}

// 驗證錯誤 (3000-3999)
enum ValidationErrorCode {
  VALIDATION_FAILED = 'VAL_3000',
  REQUIRED_FIELD = 'VAL_3001',
  INVALID_FORMAT = 'VAL_3002',
  INVALID_LENGTH = 'VAL_3003',
  INVALID_RANGE = 'VAL_3004',
  DUPLICATE_VALUE = 'VAL_3005'
}

// 業務邏輯錯誤 (4000-4999)
enum BusinessErrorCode {
  RESOURCE_NOT_FOUND = 'BIZ_4000',
  RESOURCE_CONFLICT = 'BIZ_4001',
  INSUFFICIENT_INVENTORY = 'BIZ_4002',
  ORDER_CANNOT_BE_CANCELLED = 'BIZ_4003',
  PAYMENT_FAILED = 'BIZ_4004',
  SHIPPING_NOT_AVAILABLE = 'BIZ_4005',
  PROMOTION_NOT_APPLICABLE = 'BIZ_4006'
}

// 外部服務錯誤 (5000-5999)
enum ExternalErrorCode {
  PAYMENT_GATEWAY_ERROR = 'EXT_5000',
  LOGISTICS_API_ERROR = 'EXT_5001',
  EMAIL_SERVICE_ERROR = 'EXT_5002',
  SMS_SERVICE_ERROR = 'EXT_5003',
  STORAGE_SERVICE_ERROR = 'EXT_5004'
}
```

### 8.2 錯誤訊息國際化

```typescript
const ErrorMessages = {
  'zh-TW': {
    [SystemErrorCode.INTERNAL_SERVER_ERROR]: '系統內部錯誤，請稍後再試',
    [AuthErrorCode.UNAUTHORIZED]: '請先登入',
    [AuthErrorCode.FORBIDDEN]: '您沒有執行此操作的權限',
    [ValidationErrorCode.REQUIRED_FIELD]: '此欄位為必填',
    [BusinessErrorCode.INSUFFICIENT_INVENTORY]: '庫存不足'
  },
  'en-US': {
    [SystemErrorCode.INTERNAL_SERVER_ERROR]: 'Internal server error, please try again later',
    [AuthErrorCode.UNAUTHORIZED]: 'Please login first',
    [AuthErrorCode.FORBIDDEN]: 'You do not have permission to perform this action',
    [ValidationErrorCode.REQUIRED_FIELD]: 'This field is required',
    [BusinessErrorCode.INSUFFICIENT_INVENTORY]: 'Insufficient inventory'
  }
};

class ErrorMessageService {
  static getMessage(
    code: string,
    locale: string = 'zh-TW',
    params?: Record<string, any>
  ): string {
    const messages = ErrorMessages[locale] || ErrorMessages['zh-TW'];
    let message = messages[code] || code;
    
    // 參數替換
    if (params) {
      Object.keys(params).forEach(key => {
        message = message.replace(`{${key}}`, params[key]);
      });
    }
    
    return message;
  }
}
```

## 9. API 文檔生成

### 9.1 OpenAPI 規範

```yaml
openapi: 3.0.0
info:
  title: MickeyShop Beauty API
  description: MickeyShop Beauty 電商平台 API 文檔
  version: 1.0.0
  contact:
    name: API Support
    email: api-support@mickeyshop.com

servers:
  - url: https://api.mickeyshop.com/v1
    description: 正式環境
  - url: https://api-staging.mickeyshop.com/v1
    description: 測試環境

paths:
  /products:
    get:
      summary: 獲取商品列表
      tags: [Products]
      parameters:
        - name: page
          in: query
          description: 頁碼
          schema:
            type: integer
            default: 1
        - name: pageSize
          in: query
          description: 每頁數量
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: 成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProductListResponse'

components:
  schemas:
    APIResponse:
      type: object
      properties:
        success:
          type: boolean
        data:
          type: object
        meta:
          type: object
        timestamp:
          type: string
          format: date-time
        requestId:
          type: string
    
    ErrorResponse:
      type: object
      properties:
        success:
          type: boolean
          enum: [false]
        error:
          $ref: '#/components/schemas/Error'
        timestamp:
          type: string
          format: date-time
        requestId:
          type: string
        path:
          type: string
        method:
          type: string
```

這個 API 規範統一文檔解決了路由前綴混亂、回應格式不一致、錯誤處理不統一等問題，為整個系統建立了標準化的 API 介面規範。

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "\u4fee\u6b63\u8cc7\u6599\u5eab\u8a2d\u8a08\u4e0d\u4e00\u81f4\u6027\u554f\u984c", "status": "completed", "activeForm": "\u4fee\u6b63\u8cc7\u6599\u5eab\u8a2d\u8a08\u4e0d\u4e00\u81f4\u6027\u554f\u984c"}, {"content": "\u7d71\u4e00 API \u4ecb\u9762\u898f\u7bc4", "status": "completed", "activeForm": "\u7d71\u4e00 API \u4ecb\u9762\u898f\u7bc4"}, {"content": "\u7d71\u4e00\u6b0a\u9650\u7ba1\u7406\u9ad4\u7cfb", "status": "in_progress", "activeForm": "\u7d71\u4e00\u6b0a\u9650\u7ba1\u7406\u9ad4\u7cfb"}, {"content": "\u88dc\u5145\u7f3a\u5931\u7684\u6838\u5fc3\u6a21\u7d44", "status": "pending", "activeForm": "\u88dc\u5145\u7f3a\u5931\u7684\u6838\u5fc3\u6a21\u7d44"}, {"content": "\u5b8c\u5584\u524d\u53f0\u8207\u5f8c\u53f0API\u6574\u5408\u898f\u683c", "status": "pending", "activeForm": "\u5b8c\u5584\u524d\u53f0\u8207\u5f8c\u53f0API\u6574\u5408\u898f\u683c"}, {"content": "\u9a57\u8b49\u67b6\u69cb\u8a2d\u8a08\u5b8c\u6574\u6027", "status": "pending", "activeForm": "\u9a57\u8b49\u67b6\u69cb\u8a2d\u8a08\u5b8c\u6574\u6027"}]