# MickeyShop Beauty 美妝電商平台

一個基於 Cloudflare 全棧技術的現代化美妝電商平台。

## ⚡ 快速開始

### 🎆 一鍵設定 (新手推薦)
```cmd
# 在專案根目錄執行
scripts\start.cmd
```

### ⚙️ 分步設定
```cmd
# 1. 基本設定
scripts\setup.cmd

# 2. Cloudflare 部署
scripts\deploy.ps1
```

### 📁 詳細文檔
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - 完整設定指南
- **[scripts/README.md](./scripts/README.md)** - 腳本使用說明
- **[scripts/TROUBLESHOOTING.md](./scripts/TROUBLESHOOTING.md)** - 故障排除

## 🚀 技術架構

### 前端 (Frontend)
- **框架**: React 18 + TypeScript
- **構建工具**: Vite
- **UI 庫**: Ant Design 5
- **狀態管理**: Zustand + TanStack Query
- **動畫**: GSAP
- **國際化**: react-i18next
- **部署**: Cloudflare Pages

### 後端 (Backend)
- **運行環境**: Cloudflare Workers
- **資料庫**: Cloudflare D1 (SQLite)
- **快取**: Cloudflare KV
- **檔案存儲**: Cloudflare R2
- **語言**: TypeScript
- **ORM**: Drizzle ORM

## 📁 專案結構

```
MickeyShop-Beauty/
├── frontend/              # 前端應用程式
│   ├── src/
│   │   ├── components/    # 可重用組件
│   │   ├── pages/         # 頁面組件
│   │   ├── stores/        # 狀態管理
│   │   ├── services/      # API 服務
│   │   ├── utils/         # 工具函數
│   │   └── styles/        # 樣式文件
│   └── ...
├── backend/               # 後端 API 服務
│   ├── src/
│   │   ├── controllers/   # 控制器
│   │   ├── services/      # 業務邏輯
│   │   ├── models/        # 資料模型
│   │   ├── middleware/    # 中間件
│   │   └── utils/         # 工具函數
│   └── ...
├── shared/                # 共用類型和工具
└── docs/                  # 文檔
```

## 🛠 開發環境設置

### 前置需求
- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### 安裝依賴

```bash
# 克隆專案
git clone <repository-url>
cd MickeyShop-Beauty

# 安裝所有依賴
npm run setup
```

### 環境變數設置

#### 前端環境變數
複製 `frontend/.env.example` 到 `frontend/.env.local`:

```bash
cp frontend/.env.example frontend/.env.local
```

#### 後端環境變數  
複製 `backend/.env.example` 到 `backend/.dev.vars`:

```bash
cp backend/.env.example backend/.dev.vars
```

### 開發伺服器

```bash
# 同時啟動前後端開發伺服器
npm run dev

# 單獨啟動
npm run dev:frontend  # 前端 (http://localhost:5173)
npm run dev:backend   # 後端 (http://localhost:8787)
```

## 📦 構建和部署

### 構建專案

```bash
# 構建所有專案
npm run build

# 單獨構建
npm run build:frontend
npm run build:backend
```

### 部署

```bash
# 部署到 Cloudflare
npm run deploy

# 單獨部署
npm run deploy:frontend  # 部署到 Cloudflare Pages
npm run deploy:backend   # 部署到 Cloudflare Workers
```

## 🧪 測試

```bash
# 運行所有測試
npm test

# 單獨測試
npm run test:frontend
npm run test:backend

# 類型檢查
npm run type-check
```

## 📋 代碼品質

### Linting

```bash
# 運行 ESLint
npm run lint

# 自動修復
npm run lint -- --fix
```

### 格式化

```bash
# 使用 Prettier 格式化代碼
npm run format
```

## 🌟 主要功能

### 前台功能
- 📱 響應式設計，支援多設備
- 🛍️ 商品瀏覽和搜索
- 🛒 購物車功能
- 👤 會員註冊和登入
- 📦 訂單管理
- 💳 多種付款方式
- 🎁 促銷活動和優惠券
- 🌐 多語言支援 (中文/英文)

### 後台功能
- 📊 銷售數據儀表板
- 🛍️ 商品管理
- 📦 訂單處理
- 👥 會員管理
- 🎯 行銷活動管理
- 📈 數據分析
- ⚙️ 系統設定
- 👨‍💼 管理員權限控制

## 🔐 安全性

- JWT 認證機制
- RBAC 角色權限系統
- API 速率限制
- 輸入驗證和清理
- CORS 安全設置
- XSS 和 CSRF 防護

## 📈 效能優化

- 程式碼分割和懶加載
- 圖片優化和 CDN 加速
- API 響應快取
- 資料庫查詢優化
- Bundle 大小分析
- Core Web Vitals 監控

## 🌍 國際化

支援語言:
- 繁體中文 (zh-TW) - 預設
- 簡體中文 (zh-CN)
- 英文 (en-US)

## 🚀 部署環境

### 開發環境
- **前端**: http://localhost:5173
- **後端**: http://localhost:8787

### 測試環境
- **前端**: https://staging.mickeyshop.com
- **後端**: https://api-staging.mickeyshop.com

### 生產環境
- **前端**: https://www.mickeyshop.com  
- **後端**: https://api.mickeyshop.com

## 📚 文檔

- [API 文檔](docs/api/README.md)
- [前端開發指南](docs/frontend/README.md)
- [後端開發指南](docs/backend/README.md)
- [部署指南](docs/deployment/README.md)
- [貢獻指南](docs/CONTRIBUTING.md)

## 🤝 貢獻

1. Fork 此專案
2. 創建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 創建 Pull Request

## 📄 授權

本專案為私有專案，未經授權不得使用。

## 👥 開發團隊

- **專案負責人**: MickeyShop Beauty Team
- **技術架構**: Senior Developer
- **前端開發**: Frontend Team
- **後端開發**: Backend Team
- **UI/UX 設計**: Design Team

## 📞 聯絡方式

- **Email**: dev@mickeyshop.com
- **技術支援**: tech-support@mickeyshop.com