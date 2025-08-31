# MickeyShop Beauty - Cloudflare Workers API

MickeyShop Beauty 後端 API，使用 Cloudflare Workers + D1 + Drizzle ORM 構建。

## 🚀 快速開始

### 1. 安装依賴
```bash
npm install
```

### 2. 配置環境
```bash
# 复制環境變數模板
cp .env.example .env

# 編輯 wrangler.toml，設置你的 database_id
```

### 3. 創建資料庫 Schema
```bash
# 生成遷移文件
npm run db:generate

# 創建本地 D1 資料庫 (開發環境)
wrangler d1 create mickeyshop-beauty-dev

# 執行遷移 (本地)
wrangler d1 migrations apply mickeyshop-beauty-dev --local

# 執行遷移 (遠程開發環境)
wrangler d1 migrations apply mickeyshop-beauty-dev
```

### 4. 啟動開發服務器
```bash
npm run dev
```

## 📁 項目結構

```
workers/
├── src/
│   ├── core/                   # 核心功能
│   │   └── database/           # 資料庫配置和 Schema
│   │       └── schema/         # Drizzle Schema 定義
│   ├── controllers/            # 控制器層
│   ├── services/               # 服務層 (未來實現)
│   ├── middlewares/            # 中間件
│   ├── routes/                 # 路由定義
│   ├── utils/                  # 工具函數
│   ├── types/                  # TypeScript 類型定義
│   ├── shared/                 # 共用組件
│   │   └── services/           # 基礎服務類
│   └── scripts/                # 腳本文件
├── migrations/                 # 資料庫遷移文件
├── tests/                      # 測試文件 (未來實現)
├── drizzle.config.ts          # Drizzle 配置
├── wrangler.toml              # Cloudflare Workers 配置
└── package.json
```

## 🛠 開發指令

```bash
# 開發
npm run dev                    # 啟動開發服務器
npm run typecheck             # TypeScript 類型檢查
npm run lint                  # ESLint 檢查
npm run test                  # 運行測試

# 資料庫
npm run db:generate           # 生成遷移文件
npm run db:push              # 推送 Schema 變更
npm run db:migrate           # 執行遷移腳本
npm run db:seed              # 創建種子資料

# 部署
npm run build                # 構建項目
npm run deploy               # 部署到 Cloudflare Workers
```

## 🌐 API 端點

### 系統 API (`/api/system/v1`)
- `GET /health` - 健康檢查
- `GET /info` - 系統信息
- `GET /version` - 版本信息

### 前台 API (`/api/v1`)
- 商品、訂單、用戶相關 API (未來實現)

### 後台 API (`/api/admin/v1`)  
- 管理後台相關 API (未來實現)

## 📋 已實現功能

### ✅ Phase 1: 後端基礎架構 (已完成)

1. **Cloudflare Workers 初始化**
   - ✅ 完整的項目結構
   - ✅ Hono.js 路由框架配置
   - ✅ TypeScript 嚴格模式配置
   - ✅ 環境變數管理

2. **資料庫架構建立**
   - ✅ D1 資料庫配置 (wrangler.toml)
   - ✅ 完整的資料庫 Schema (Drizzle ORM)
   - ✅ 資料庫遷移管理系統
   - ✅ 統一的資料庫設計標準

3. **中間件與工具層**
   - ✅ 統一錯誤處理中間件
   - ✅ CORS 和安全中間件
   - ✅ 請求驗證中間件 (基於 Zod)
   - ✅ 認證授權中間件
   - ✅ 日誌系統和性能監控
   - ✅ 請求 ID 追蹤
   - ✅ 速率限制

4. **基礎服務層**
   - ✅ BaseService 和 BaseController 抽象類
   - ✅ 統一的 API 響應格式
   - ✅ 分頁和搜尋功能支援
   - ✅ 服務響應處理

5. **工具函數和類型定義**
   - ✅ 通用工具函數 (ID生成、日期處理、驗證等)
   - ✅ 完整的 TypeScript 類型定義
   - ✅ 通用介面和類型

## 📊 資料庫 Schema

已建立完整的資料庫表結構，符合 `backend/23-資料庫設計標準化.md` 規範：

### 權限管理系統
- `permissions` - 權限表
- `roles` - 角色表  
- `role_permissions` - 角色權限關聯
- `user_roles` - 用戶角色關聯
- `user_permissions` - 用戶直接權限
- `permission_change_logs` - 權限變更日誌

### 管理員管理系統
- `admin_users` - 管理員用戶
- `admin_sessions` - 管理員會話
- `admin_activity_logs` - 管理員操作日誌
- `admin_security_events` - 管理員安全事件

### 客戶管理系統
- `customers` - 客戶表
- `customer_addresses` - 客戶地址
- `customer_sessions` - 客戶會話
- `customer_activity_logs` - 客戶活動日誌
- `customer_wishlists` - 客戶願望清單

### 商品管理系統
- `product_categories` - 商品分類
- `product_brands` - 商品品牌
- `products` - 商品主表
- `product_variations` - 商品變化版本
- `product_inventory_history` - 庫存歷史

### 系統管理
- `system_settings` - 系統設定
- `system_tasks` - 系統任務/作業
- `system_notifications` - 系統通知
- `system_logs` - 系統日誌
- `system_cache` - 系統快取
- `system_stats` - 系統統計

## 🔒 安全特性

- JWT Token 認證 (使用 Cloudflare Workers 兼容庫)
- 基於角色和權限的訪問控制 (RBAC)
- 請求速率限制
- CORS 安全配置
- 請求參數驗證 (Zod Schema)
- SQL 注入防護 (Drizzle ORM)
- 安全標頭設置

## 🚧 下一步計劃

### Phase 2: 核心業務模組 (計劃中)
1. 管理員管理系統完整實現
2. 商品管理系統 (CRUD + 庫存管理)
3. 客戶管理系統
4. 基礎訂單管理功能

### Phase 3: 進階功能 (計劃中)
1. 支付系統整合 (綠界科技)
2. 物流系統整合
3. 通知系統
4. 分析和報表功能

## 📖 開發規範

項目嚴格遵循以下設計規範：
- `backend/23-資料庫設計標準化.md` - 資料庫設計標準
- `backend/24-API介面規範統一.md` - API 介面規範  
- `backend/25-權限管理體系統一.md` - 權限管理體系
- `.claude/CLAUDE.md` - 開發流程規範

## 🤝 貢獻指南

1. 遵循現有的代碼風格和架構
2. 確保 TypeScript 嚴格模式通過
3. 新增功能需包含適當的錯誤處理
4. 遵循統一的 API 響應格式
5. 更新相關文檔

## 📄 授權

MIT License