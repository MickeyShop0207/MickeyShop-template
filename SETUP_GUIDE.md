# MickeyShop-Beauty 完整設定指南

## 📋 概覽

本指南將幫助您完成 MickeyShop-Beauty 美妝電商平台的完整部署設定。本專案使用 **Cloudflare Secrets** 存儲所有敏感資料，確保最高安全性。

---

## 🔧 系統需求

### 開發環境
- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0
- **Git**: 最新版本

### Cloudflare 服務需求 (必須)
- **Cloudflare 帳戶**: 免費或付費方案
- **Cloudflare Workers**: 後端 API 服務
- **Cloudflare D1**: SQLite 資料庫
- **Cloudflare KV**: 快取存儲
- **Cloudflare R2**: 檔案存儲
- **Cloudflare Secrets**: 敏感資料存儲
- **Domain**: 自定義域名（可選）

---

## 🚀 快速部署流程

### 方法一: 使用自動化腳本 (🎆 推薦)

```powershell
# 在專案根目錄下執行
.\setup.ps1

# 或使用參數快速設定
.\setup.ps1 -StoreName "美妝天堂" -CompanyName "美妝天堂有限公司" -CompanyEmail "contact@beauty-paradise.com" -GitHubUsername "yourusername"

# 或使用 CMD 版本
.\setup.cmd
```

**自動化腳本功能:**
- ✅ 自動安裝所有依賴套件
- ✅ 初始化 Git 儲存庫並提交
- ✅ 連接 Cloudflare 並設定 Secrets
- ✅ 創建 GitHub 儲存庫並上傳程式碼
- ✅ 配置前端環境變數
- ✅ 可選部署到 Cloudflare

---

### 方法二: 手動設定

#### 步驟 1: 獲取專案原始碼
```bash
# 解壓專案檔案到您的電腦
# 進入專案目錄
cd MickeyShop-Beauty
```

#### 步驟 2: 安裝依賴套件
```bash
# 安裝前端依賴
npm install

# 安裝後端依賴
cd workers
npm install
```

### 步驟 3: 建立 Cloudflare 帳戶
1. 前往 [https://cloudflare.com](https://cloudflare.com)
2. 建立免費帳戶並驗證電子郵件
3. 登入後進入 Dashboard

### 步驟 4: 登入 Cloudflare CLI
```bash
# 在 workers 目錄下執行
cd workers
npx wrangler login
# 會開啟瀏覽器進行授權登入
```

---

## 🔑 完整配置設定

### Part A: Cloudflare Secrets 設定 (敏感資料)

⚠️ **重要**: 所有敏感資料都使用 Cloudflare Secrets 存儲，絕不放在程式碼中

#### A1. 必要 Secrets
```bash
# 在 workers 目錄下執行所有命令
cd workers

# JWT 密鑰（至少32位強密碼）
npx wrangler secret put JWT_SECRET
# 輸入範例: SuperSecretJWTKeyForYourStore2024!@#$%^&*()

# 管理員預設密碼（首次部署後可在後台更改）
npx wrangler secret put ADMIN_DEFAULT_PASSWORD
# 輸入範例: AdminPassword123!@#
```

#### A2. 支付系統 Secrets

##### 綠界科技 ECPay 設定
1. 前往 [綠界科技官網](https://www.ecpay.com.tw) 申請商家帳戶
2. 取得以下資料後設定：
```bash
npx wrangler secret put ECPAY_MERCHANT_ID
# 輸入您的綠界特店編號，例如: 2000132

npx wrangler secret put ECPAY_HASH_KEY
# 輸入您的綠界 HashKey，例如: 5294y06JbISpM5x9

npx wrangler secret put ECPAY_HASH_IV
# 輸入您的綠界 HashIV，例如: v77hoKGq4kWxNNIS
```

##### LINE Pay 設定
1. 前往 [LINE Pay 商家中心](https://pay.line.me/tw/developers) 申請
2. 取得以下資料後設定：
```bash
npx wrangler secret put LINEPAY_CHANNEL_ID
# 輸入您的 LINE Pay Channel ID，例如: 1234567890

npx wrangler secret put LINEPAY_CHANNEL_SECRET
# 輸入您的 LINE Pay Channel Secret
```

#### A3. 電子郵件服務 Secrets (可選)
如需電子郵件功能（註冊確認、密碼重設等）：

##### Gmail SMTP 設定 (推薦)
1. 在您的 Gmail 開啟兩步驟驗證
2. 產生應用程式密碼
3. 設定 Secrets：
```bash
npx wrangler secret put SMTP_HOST
# 輸入: smtp.gmail.com

npx wrangler secret put SMTP_PORT
# 輸入: 587

npx wrangler secret put SMTP_USER
# 輸入您的 Gmail 地址，例如: yourstore@gmail.com

npx wrangler secret put SMTP_PASSWORD
# 輸入您的 Gmail 應用程式密碼（16位）
```

#### A4. 第三方服務 Secrets (可選)
```bash
# Google Analytics 4
npx wrangler secret put GOOGLE_ANALYTICS_ID
# 輸入您的 GA4 ID，例如: G-XXXXXXXXXX

# Facebook Pixel
npx wrangler secret put FACEBOOK_PIXEL_ID
# 輸入您的 Facebook Pixel ID，例如: 1234567890123456

# Google Maps API
npx wrangler secret put GOOGLE_MAPS_API_KEY
# 輸入您的 Google Maps API 金鑰

# Sentry 錯誤監控（可選）
npx wrangler secret put SENTRY_DSN
# 輸入您的 Sentry DSN
```

#### A5. 檢查 Secrets 設定
```bash
# 列出所有已設定的 secrets
npx wrangler secret list
```

### Part B: 專案配置檔案設定

#### B1. 更新後端配置 (workers/wrangler.toml)
```toml
# 更改為您的專案名稱
name = "your-store-api"

# 更新生產環境 CORS 設定
[env.production.vars]
ENVIRONMENT = "production"
DEBUG = "false"
CORS_ORIGIN = "https://yourstore.com,https://www.yourstore.com"

# 資料庫、KV、R2 設定會在部署時自動生成
```

#### B2. 設定前端環境變數
```bash
# 返回專案根目錄
cd ..

# 複製環境變數模板
cp .env.example .env
```

編輯 `.env` 檔案：
```env
# === 必要配置 ===
# API URL（部署後會取得實際網址）
VITE_API_BASE_URL=https://your-store-api.your-account.workers.dev

# === 品牌資訊 (請更新為您的品牌) ===
VITE_APP_NAME=您的品牌名稱
VITE_APP_DESCRIPTION=您的品牌描述
VITE_DEFAULT_TITLE=您的品牌名稱 - 專業美妝電商

# === 聯絡資訊 (請更新為您的資訊) ===
VITE_COMPANY_NAME=您的公司名稱
VITE_COMPANY_PHONE=+886-2-1234-5678
VITE_COMPANY_EMAIL=contact@yourstore.com

# === 社群媒體連結 (請更新為您的連結) ===
VITE_FACEBOOK_URL=https://facebook.com/yourstore
VITE_INSTAGRAM_URL=https://instagram.com/yourstore

# === 支付系統公開資訊 ===
# 綠界 ECPay (與 Secrets 中的 MERCHANT_ID 相同)
VITE_ECPAY_MERCHANT_ID=2000132
VITE_ECPAY_SANDBOX=true

# LINE Pay (與 Secrets 中的 CHANNEL_ID 相同)
VITE_LINEPAY_CHANNEL_ID=1234567890
VITE_LINEPAY_SANDBOX=true

# === 第三方服務公開 ID ===
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
VITE_FACEBOOK_PIXEL_ID=1234567890123456

# === 業務設定 ===
VITE_DEFAULT_CURRENCY=TWD
VITE_FREE_SHIPPING_THRESHOLD=1000
```

---

## 🚀 部署到 Cloudflare

### 步驟 1: 部署後端 API
```bash
cd workers

# 建立資料庫
npx wrangler d1 create your-store-db
# 複製輸出的 database_id 到 wrangler.toml

# 建立 KV 快取
npx wrangler kv namespace create "CACHE_KV"
npx wrangler kv namespace create "SESSION_KV"
# 複製輸出的 id 到 wrangler.toml

# 建立 R2 儲存
npx wrangler r2 bucket create your-store-storage

# 執行資料庫遷移
npx wrangler d1 migrations apply your-store-db --remote

# 部署 Workers
npx wrangler deploy
```

### 步驟 2: 初始化 Git 儲存庫
```bash
cd ..

# 初始化 Git 儲存庫
git init

# 添加 .gitignore 檔案
echo "node_modules/
.env
.env.local
dist/
.DS_Store
workers/.env" > .gitignore

# 添加所有檔案
git add .

# 創建首次提交
git commit -m "Initial commit: MickeyShop-Beauty ecommerce platform

- Complete full-stack architecture with Cloudflare Workers
- Frontend: React 18 + TypeScript + Vite + Ant Design
- Backend: Hono.js + Drizzle ORM + D1 Database
- Payment: ECPay + LINE Pay integration
- Authentication: JWT + RBAC system
- Ready for production deployment"

# 連接到遠端儲存庫（可選）
# git remote add origin https://github.com/yourusername/your-store.git
# git branch -M main
# git push -u origin main
```

### 步驟 3: 部署前端
```bash
# 更新前端 .env 中的 API URL
# VITE_API_BASE_URL=https://your-actual-worker-url.workers.dev

# 建置前端
npm run build

# 部署到 Cloudflare Pages
npx wrangler pages deploy dist --project-name your-store-frontend
```

---

## 🎨 品牌客製化

### 1. Logo 和圖片
將您的品牌 Logo 放置在：
```
src/assets/images/
├── logo/
│   ├── logo.svg
│   ├── logo.png
│   └── favicon.ico
└── hero/
    └── hero-banner.jpg
```

### 2. 色彩主題
編輯 `tailwind.config.js`：
```javascript
colors: {
  primary: {
    500: '#您的主品牌色',  // 例如: #f43f5e
  }
}
```

### 3. 首頁內容
編輯以下檔案自定義首頁：
- `src/pages/Home/HeroSection.tsx` - 主要橫幅
- `src/pages/Home/FeaturesSection.tsx` - 特色區塊

---

## ✅ 完成檢查清單

### 必要設定
- [ ] Cloudflare 帳戶建立完成
- [ ] 所有必要 Secrets 已設定 (JWT_SECRET, ADMIN_DEFAULT_PASSWORD)
- [ ] 支付系統 Secrets 已設定
- [ ] wrangler.toml 已更新專案名稱
- [ ] 前端 .env 已設定正確的 API URL
- [ ] 品牌資訊已更新

### 部署檢查
- [ ] 後端成功部署到 Cloudflare Workers
- [ ] 資料庫遷移完成
- [ ] 前端成功部署到 Cloudflare Pages
- [ ] 網站可以正常訪問
- [ ] 管理員登入功能正常 (admin/您設定的密碼)

### 功能測試
- [ ] 首頁載入正常
- [ ] 用戶註冊功能正常
- [ ] 商品瀏覽功能正常
- [ ] 購物車功能正常
- [ ] 支付測試通過 (測試環境)

---

## 📞 技術支援

### 常見問題

**Q: 忘記設定的管理員密碼？**
A: 使用 `npx wrangler secret put ADMIN_DEFAULT_PASSWORD` 重新設定

**Q: API 無法連接？**
A: 檢查 `.env` 中的 `VITE_API_BASE_URL` 是否正確

**Q: 支付功能無法使用？**
A: 確認支付系統 Secrets 已正確設定，且 Merchant ID 一致

**Q: 如何檢查 Secrets 是否設定成功？**
A: 使用 `npx wrangler secret list` 查看

### 日誌檢查
```bash
# 查看 Workers 即時日誌
npx wrangler tail

# 查看特定環境日誌
npx wrangler tail --env production
```

---

**🎉 恭喜！完成以上設定後，您的 MickeyShop-Beauty 電商平台就可以正式上線了！**

記得定期更新 JWT_SECRET 和其他敏感資料以確保安全性。