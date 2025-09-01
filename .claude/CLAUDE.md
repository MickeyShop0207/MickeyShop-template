# Claude 開發規範 - MickeyShop Beauty

## 核心原則
**架構優先，完整理解後再行動**

在進行任何修改前，必須先完整閱讀和理解整個專案架構，確保不破壞現有設計。
你必須要完全尊手這一份文案的開發規範
---

## 2. 專案結構規範

### 2.1 根目錄結構
```
MickeyShop-Beauty/
├── src/                    # 前端源碼
│   ├── components/         # 組件目錄
│   ├── pages/             # 頁面組件
│   ├── stores/            # Zustand 狀態管理
│   ├── hooks/             # 自定義 Hooks
│   ├── utils/             # 工具函數
│   ├── types/             # TypeScript 類型定義
│   ├── styles/            # 樣式文件
│   ├── assets/            # 靜態資源
│   └── config/            # 配置文件
├── workers/               # Cloudflare Workers 後端
│   ├── src/              # Worker 源碼
│   │   ├── controllers/  # 控制器
│   │   ├── services/     # 服務層
│   │   ├── models/       # 數據模型
│   │   ├── middlewares/  # 中間件
│   │   ├── utils/        # 工具函數
│   │   └── types/        # 類型定義
│   ├── migrations/       # 數據庫遷移文件
│   └── schemas/          # 數據庫架構文件
├── docs/                 # 專案文檔
├── backend/              # 後端設計文檔
├── frontend/             # 前端設計文檔
└── README.md
```

### 2.2 檔案命名規範

#### Frontend 檔案命名
- **組件文件**: PascalCase，例如 `ProductCard.tsx`
- **頁面文件**: PascalCase，例如 `ProductDetailPage.tsx`
- **Hook 文件**: camelCase，以 `use` 開頭，例如 `useProductData.ts`
- **Store 文件**: camelCase，以 Store 結尾，例如 `productStore.ts`
- **工具函數**: camelCase，例如 `formatPrice.ts`
- **類型文件**: camelCase，以 `.types.ts` 結尾，例如 `product.types.ts`

#### Backend 檔案命名
- **控制器**: camelCase，以 Controller 結尾，例如 `productController.ts`
- **服務**: camelCase，以 Service 結尾，例如 `productService.ts`
- **模型**: camelCase，以 Model 結尾，例如 `productModel.ts`
- **中間件**: camelCase，例如 `authMiddleware.ts`
- **路由**: camelCase，以 Routes 結尾，例如 `productRoutes.ts`

#### 目錄命名
- 全部使用 **kebab-case**
- 例如：`user-management`, `product-catalog`, `shopping-cart`

### 2.3 模組組織原則

#### Frontend 模組結構
```
src/components/
├── ui/                    # 基礎 UI 組件
├── business/              # 業務組件
├── layout/                # 佈局組件
└── forms/                 # 表單組件

src/pages/
├── auth/                  # 認證相關頁面
├── products/              # 商品相關頁面
├── orders/                # 訂單相關頁面
├── member/                # 會員相關頁面
└── admin/                 # 管理後台頁面
```

#### Backend 模組結構
```
workers/src/
├── modules/               # 業務模組
│   ├── auth/             # 認證模組
│   ├── products/         # 商品模組
│   ├── orders/           # 訂單模組
│   ├── members/          # 會員模組
│   └── admin/            # 管理模組
├── shared/               # 共用模組
│   ├── middlewares/      # 共用中間件
│   ├── services/         # 共用服務
│   └── utils/            # 共用工具
└── core/                 # 核心模組
    ├── database/         # 資料庫相關
    ├── cache/            # 快取相關
    └── monitoring/       # 監控相關
```

---

## 3. 開發流程規範

### 3.1 架構理解流程
**在進行任何修改前，必須執行以下步驟：**

1. **完整閱讀相關文檔**
   - 閱讀要修改模組的完整文檔
   - 閱讀相關模組的依賴文檔
   - 閱讀系統架構總覽文檔

2. **理解現有代碼結構**
   - 檢查現有實現
   - 理解數據流向
   - 確認依賴關係

3. **影響分析**
   - 分析修改對其他模組的影響
   - 確認API契約不會被破壞
   - 檢查是否需要同步修改相關模組

4. **架構一致性檢查**
   - 確保修改符合整體架構設計
   - 遵循統一的設計模式
   - 保持代碼風格一致

### 3.2 開發執行流程

#### 步驟 1: 分析與規劃
```bash
1. 讀取完整專案文檔
2. 分析要實現的功能需求  
3. 確認與現有架構的整合點
4. 規劃實現步驟
```

#### 步驟 2: 實現與測試
```bash
1. 按照文檔規格實現功能
2. 確保所有接口符合API規範
3. 驗證與其他模組的整合
4. 執行功能測試
```

#### 步驟 3: 整合與驗證
```bash
1. 檢查整體系統功能
2. 驗證前後端API對接
3. 確認權限控制正常運作
4. 測試完整業務流程
```

### 3.3 Git 提交規範

#### 提交訊息格式
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

#### Type 類型
- `feat`: 新功能
- `fix`: 錯誤修復
- `docs`: 文檔修改
- `style`: 代碼格式修改
- `refactor`: 重構
- `test`: 測試相關
- `chore`: 建置工具、輔助工具等

#### Scope 範圍
- `frontend`: 前端相關
- `backend`: 後端相關
- `api`: API 相關
- `auth`: 認證相關
- `product`: 商品相關
- `order`: 訂單相關
- `member`: 會員相關

#### 示例
```bash
feat(product): implement product search functionality
fix(auth): resolve token expiration handling
docs(api): update API documentation for order endpoints
```

### 3.4 部署流程

#### 開發環境
```bash
1. npm run dev          # 啟動前端開發服務器
2. npm run worker:dev   # 啟動 Workers 開發環境
3. npm run db:migrate   # 執行資料庫遷移
```

#### 生產環境
```bash
1. npm run build        # 建置前端
2. npm run worker:build # 建置 Workers
3. npm run deploy       # 部署到 Cloudflare
```

---

## 4. 技術限制或偏好

### 4.1 技術棧限制

#### 前端技術棧 (嚴格遵循)
```json
{
  "framework": "React 18.x",
  "bundler": "Vite 5.x", 
  "ui-library": "Ant Design 5.x",
  "animation": "GSAP 3.x",
  "state-management": "Zustand 4.x",
  "data-fetching": "React Query 5.x",
  "routing": "React Router 6.x",
  "styling": "Tailwind CSS + Ant Design",
  "language": "TypeScript 5.x"
}
```

#### 後端技術棧 (嚴格遵循)
```json
{
  "runtime": "Cloudflare Workers",
  "framework": "Hono.js",
  "database": "Cloudflare D1 (SQLite)",
  "cache": "Cloudflare KV",
  "storage": "Cloudflare R2",
  "orm": "Drizzle ORM",
  "language": "TypeScript 5.x"
}
```

### 4.2 架構模式限制

#### Frontend 架構模式
- **狀態管理**: 統一使用 Zustand，按功能模組分離 Store
- **組件設計**: 遵循容器組件/展示組件模式
- **路由設計**: 按業務功能模組組織路由結構
- **API 調用**: 統一使用 React Query 進行數據管理

#### Backend 架構模式  
- **分層架構**: Controller -> Service -> Model 三層架構
- **依賴注入**: 使用依賴注入模式管理服務依賴
- **錯誤處理**: 統一錯誤處理中間件
- **認證授權**: JWT + RBAC 權限控制

### 4.3 代碼品質要求

#### TypeScript 配置
```json
{
  "strict": true,
  "noImplicitAny": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true,
  "noUncheckedIndexedAccess": true
}
```

#### 命名規範
- **變數/函數**: camelCase
- **常數**: UPPER_SNAKE_CASE  
- **類別/介面**: PascalCase
- **檔案/目錄**: kebab-case
- **資料庫欄位**: snake_case

#### API 設計原則
- **RESTful 設計**: 遵循 REST 原則設計 API
- **統一響應格式**: 按照 `24-API介面規範統一.md` 執行
- **錯誤處理**: 使用標準 HTTP 狀態碼和錯誤代碼
- **版本控制**: API 路徑包含版本號 `/api/v1/`

### 4.4 性能要求

#### 前端性能
- **首次載入時間**: < 3 秒
- **頁面切換**: < 500ms
- **動畫流暢度**: 60 FPS
- **Bundle 大小**: 初始包 < 500KB

#### 後端性能  
- **API 響應時間**: < 200ms
- **資料庫查詢**: < 100ms
- **並發處理**: > 1000 req/s
- **錯誤率**: < 0.1%

### 4.5 安全要求

#### 前端安全
- **XSS 防護**: 所有使用者輸入必須驗證和過濾
- **CSRF 防護**: 使用 CSRF Token 防護
- **敏感數據**: 不在前端儲存敏感資訊

#### 後端安全
- **輸入驗證**: 所有輸入必須驗證
- **SQL 注入防護**: 使用參數化查詢
- **權限控制**: 每個端點都要檢查權限
- **密碼加密**: 使用 bcrypt 加密密碼

---

## 重要提醒

### ⚠️ 架構保護原則

1. **禁止破壞現有架構**
   - 不得修改核心架構設計
   - 不得破壞模組間的依賴關係
   - 不得違反統一的設計模式

2. **完整性檢查要求**
   - 修改前必須完整閱讀相關文檔
   - 修改後必須驗證整個系統功能
   - 確保前後端API契約不被破壞

3. **一致性維護**
   - 保持命名規範一致
   - 保持代碼風格一致  
   - 保持錯誤處理一致
   - 保持權限控制一致

4. **文檔同步更新**
   - 代碼修改後及時更新對應文檔
   - 新增功能要補充相應文檔
   - 確保文檔與實現保持同步

### 📋 開發檢查清單

每次開發完成後，必須檢查以下項目：

- [ ] 完整閱讀相關文檔
- [ ] 代碼符合架構設計
- [ ] 遵循命名規範
- [ ] API 符合統一規範
- [ ] 權限控制正確實現
- [ ] 錯誤處理完整
- [ ] 前後端整合正常
- [ ] 整體功能測試通過
- [ ] 文檔更新完成

遵循以上規範，確保 MickeyShop Beauty 系統的架構完整性和代碼品質。