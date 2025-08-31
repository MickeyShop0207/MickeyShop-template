# ============================================
# MickeyShop-Beauty 自動化設定腳本
# PowerShell 版本 - 無特殊字符版本
# ============================================

# 設定編碼以避免亂碼
$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8

param(
    [string]$StoreName = "",
    [string]$StoreDescription = "",
    [string]$CompanyName = "",
    [string]$CompanyEmail = "",
    [string]$CompanyPhone = "",
    [string]$FacebookUrl = "",
    [string]$InstagramUrl = "",
    [string]$GitHubUsername = "",
    [string]$GitHubRepoName = "",
    [string]$GitHubToken = "",
    [switch]$SkipSecrets,
    [switch]$SkipGitHub,
    [switch]$Help
)

# 顯示幫助資訊
if ($Help) {
    Write-Host @"
MickeyShop-Beauty 自動化設定腳本

用法:
    .\setup.ps1 [選項]

選項:
    -StoreName          店鋪名稱 (例: "美妝天堂")
    -StoreDescription   店鋪描述
    -CompanyName        公司名稱
    -CompanyEmail       聯絡信箱
    -CompanyPhone       聯絡電話
    -FacebookUrl        Facebook 粉絲頁網址
    -InstagramUrl       Instagram 帳號網址
    -GitHubUsername     GitHub 用戶名
    -GitHubRepoName     GitHub 儲存庫名稱
    -GitHubToken        GitHub Personal Access Token
    -SkipSecrets        跳過 Cloudflare Secrets 設定
    -SkipGitHub         跳過 GitHub 儲存庫創建
    -Help               顯示此幫助資訊

範例:
    .\setup.ps1 -StoreName "美妝天堂" -CompanyName "美妝天堂有限公司" -CompanyEmail "contact@beauty-paradise.com"
    .\setup.ps1 -GitHubUsername "yourusername" -GitHubRepoName "beauty-paradise" -GitHubToken "ghp_xxxxxxxxxxxx"

"@
    exit 0
}

# 顏色函數
function Write-ColorOutput {
    param([string]$Text, [string]$Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

function Write-Success { param([string]$Text) Write-ColorOutput "[成功] $Text" "Green" }
function Write-Warning { param([string]$Text) Write-ColorOutput "[警告] $Text" "Yellow" }
function Write-Error { param([string]$Text) Write-ColorOutput "[錯誤] $Text" "Red" }
function Write-Info { param([string]$Text) Write-ColorOutput "[資訊] $Text" "Cyan" }
function Write-Step { param([string]$Text) Write-ColorOutput "`n[步驟] $Text" "Magenta" }

# 檢查是否在正確的目錄
function Test-ProjectDirectory {
    if (-not (Test-Path "package.json") -or -not (Test-Path "workers/package.json")) {
        Write-Error "請在 MickeyShop-Beauty 專案根目錄下執行此腳本"
        Write-Info "確保目錄下有 package.json 和 workers/package.json 檔案"
        exit 1
    }
}

# 檢查必要軟體
function Test-Prerequisites {
    Write-Step "檢查必要軟體..."
    
    # 檢查 Node.js
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Error "未找到 Node.js，請先安裝 Node.js 18+ 版本"
        Write-Info "下載網址: https://nodejs.org/"
        exit 1
    }
    
    $nodeVersion = (node --version) -replace "v", ""
    $majorVersion = [int]($nodeVersion.Split(".")[0])
    if ($majorVersion -lt 18) {
        Write-Error "Node.js 版本過舊 ($nodeVersion)，需要 18+ 版本"
        exit 1
    }
    Write-Success "Node.js $nodeVersion 已安裝"
    
    # 檢查 npm
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Error "未找到 npm"
        exit 1
    }
    Write-Success "npm 已安裝"
    
    # 檢查 Git
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Warning "未找到 Git，將跳過 Git 設定"
        $global:SkipGit = $true
    } else {
        Write-Success "Git 已安裝"
        $global:SkipGit = $false
    }
}

# 安裝依賴套件
function Install-Dependencies {
    Write-Step "安裝依賴套件..."
    
    # 安裝前端依賴
    Write-Info "安裝前端依賴..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "前端依賴安裝失敗"
        exit 1
    }
    Write-Success "前端依賴安裝完成"
    
    # 安裝後端依賴
    Write-Info "安裝後端依賴..."
    Set-Location workers
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "後端依賴安裝失敗"
        exit 1
    }
    Write-Success "後端依賴安裝完成"
    Set-Location ..
}

# 設定 Git 儲存庫
function Initialize-Git {
    if ($global:SkipGit) {
        Write-Warning "跳過 Git 初始化"
        return
    }
    
    Write-Step "初始化 Git 儲存庫..."
    
    # 檢查是否已經是 Git 儲存庫
    if (Test-Path ".git") {
        Write-Warning "已經是 Git 儲存庫，跳過初始化"
        return
    }
    
    # 初始化 Git
    git init
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Git 初始化失敗"
        return
    }
    Write-Success "Git 儲存庫初始化完成"
    
    # 創建 .gitignore
    $gitignoreContent = @"
# Dependencies
node_modules/
*/node_modules/

# Environment files
.env
.env.local
.env.production
workers/.env

# Build outputs
dist/
build/

# Cache directories
.cache/
.parcel-cache/

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Temporary folders
tmp/
temp/
"@
    
    $gitignoreContent | Out-File -FilePath ".gitignore" -Encoding UTF8
    Write-Success ".gitignore 檔案已創建"
    
    # 添加檔案並提交
    git add .
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Git add 失敗"
        return
    }
    
    $commitMessage = @"
Initial commit: MickeyShop-Beauty ecommerce platform

- Complete full-stack architecture with Cloudflare Workers
- Frontend: React 18 + TypeScript + Vite + Ant Design  
- Backend: Hono.js + Drizzle ORM + D1 Database
- Payment: ECPay + LINE Pay integration
- Authentication: JWT + RBAC system
- Ready for production deployment

Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
"@
    
    git commit -m $commitMessage
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Git commit 失敗"
        return
    }
    Write-Success "首次 Git 提交完成"
}

# 登入 Cloudflare
function Connect-Cloudflare {
    Write-Step "連接到 Cloudflare..."
    
    Set-Location workers
    
    # 檢查是否已經登入
    $authStatus = npx wrangler whoami 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "已經登入 Cloudflare: $authStatus"
    } else {
        Write-Info "開始登入 Cloudflare..."
        Write-Warning "瀏覽器將開啟，請完成授權登入"
        npx wrangler login
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Cloudflare 登入失敗"
            exit 1
        }
        Write-Success "Cloudflare 登入成功"
    }
    
    Set-Location ..
}

# 設定 Cloudflare Secrets
function Set-CloudflareSecrets {
    if ($SkipSecrets) {
        Write-Warning "跳過 Cloudflare Secrets 設定"
        return
    }
    
    Write-Step "設定 Cloudflare Secrets..."
    
    Set-Location workers
    
    Write-Info "開始設定必要的 Secrets..."
    Write-Warning "請準備好以下資料："
    Write-Host "  - JWT 密鑰 (至少32位強密碼)"
    Write-Host "  - 管理員預設密碼"
    Write-Host "  - 綠界 ECPay 資料 (Merchant ID, Hash Key, Hash IV)"
    Write-Host "  - LINE Pay 資料 (Channel ID, Channel Secret)"
    Write-Host "  - SMTP 設定 (如需電子郵件功能)"
    Write-Host ""
    
    $continue = Read-Host "是否繼續設定 Secrets? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Warning "跳過 Secrets 設定，請稍後手動設定"
        Set-Location ..
        return
    }
    
    # 必要 Secrets
    Write-Info "設定核心系統 Secrets..."
    
    Write-Host "`n[密鑰] 設定 JWT_SECRET (至少32位強密碼):"
    npx wrangler secret put JWT_SECRET
    
    Write-Host "`n[密鑰] 設定管理員預設密碼 (首次部署後可在後台更改):"
    npx wrangler secret put ADMIN_DEFAULT_PASSWORD
    
    # 支付系統 Secrets
    $setupPayment = Read-Host "`n是否設定支付系統 Secrets? (y/N)"
    if ($setupPayment -eq "y" -or $setupPayment -eq "Y") {
        Write-Info "設定綠界 ECPay..."
        Write-Host "`n[密鑰] 設定綠界特店編號:"
        npx wrangler secret put ECPAY_MERCHANT_ID
        
        Write-Host "`n[密鑰] 設定綠界 Hash Key:"
        npx wrangler secret put ECPAY_HASH_KEY
        
        Write-Host "`n[密鑰] 設定綠界 Hash IV:"
        npx wrangler secret put ECPAY_HASH_IV
        
        Write-Info "設定 LINE Pay..."
        Write-Host "`n[密鑰] 設定 LINE Pay Channel ID:"
        npx wrangler secret put LINEPAY_CHANNEL_ID
        
        Write-Host "`n[密鑰] 設定 LINE Pay Channel Secret:"
        npx wrangler secret put LINEPAY_CHANNEL_SECRET
    }
    
    # 電子郵件 Secrets
    $setupEmail = Read-Host "`n是否設定電子郵件服務 Secrets? (y/N)"
    if ($setupEmail -eq "y" -or $setupEmail -eq "Y") {
        Write-Info "設定 SMTP..."
        Write-Host "`n[密鑰] 設定 SMTP Host (例: smtp.gmail.com):"
        npx wrangler secret put SMTP_HOST
        
        Write-Host "`n[密鑰] 設定 SMTP Port (例: 587):"
        npx wrangler secret put SMTP_PORT
        
        Write-Host "`n[密鑰] 設定 SMTP User:"
        npx wrangler secret put SMTP_USER
        
        Write-Host "`n[密鑰] 設定 SMTP Password:"
        npx wrangler secret put SMTP_PASSWORD
    }
    
    # 第三方服務 Secrets
    $setupThirdParty = Read-Host "`n是否設定第三方服務 Secrets? (y/N)"
    if ($setupThirdParty -eq "y" -or $setupThirdParty -eq "Y") {
        Write-Host "`n[密鑰] 設定 Google Analytics ID (例: G-XXXXXXXXXX):"
        npx wrangler secret put GOOGLE_ANALYTICS_ID
        
        Write-Host "`n[密鑰] 設定 Facebook Pixel ID:"
        npx wrangler secret put FACEBOOK_PIXEL_ID
    }
    
    Write-Success "Cloudflare Secrets 設定完成"
    
    # 列出已設定的 secrets
    Write-Info "已設定的 Secrets:"
    npx wrangler secret list
    
    Set-Location ..
}

# 創建前端環境變數檔案
function New-FrontendEnv {
    Write-Step "創建前端環境變數檔案..."
    
    if (Test-Path ".env") {
        $overwrite = Read-Host ".env 檔案已存在，是否覆蓋? (y/N)"
        if ($overwrite -ne "y" -and $overwrite -ne "Y") {
            Write-Warning "保留現有 .env 檔案"
            return
        }
    }
    
    # 從用戶輸入或參數獲取店鋪資訊
    if (-not $StoreName) { $StoreName = Read-Host "請輸入店鋪名稱 (預設: MickeyShop Beauty)" }
    if (-not $StoreName) { $StoreName = "MickeyShop Beauty" }
    
    if (-not $StoreDescription) { $StoreDescription = Read-Host "請輸入店鋪描述 (預設: 專業美妝電商平台)" }
    if (-not $StoreDescription) { $StoreDescription = "專業美妝電商平台" }
    
    if (-not $CompanyName) { $CompanyName = Read-Host "請輸入公司名稱" }
    if (-not $CompanyEmail) { $CompanyEmail = Read-Host "請輸入聯絡信箱" }
    if (-not $CompanyPhone) { $CompanyPhone = Read-Host "請輸入聯絡電話 (例: +886-2-1234-5678)" }
    if (-not $FacebookUrl) { $FacebookUrl = Read-Host "請輸入 Facebook 粉絲頁網址 (可空白)" }
    if (-not $InstagramUrl) { $InstagramUrl = Read-Host "請輸入 Instagram 帳號網址 (可空白)" }
    
    $envContent = @"
# ===================================
# MickeyShop-Beauty 前端環境變數配置
# ===================================
# 由 setup.ps1 自動生成於 $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# === 必要配置 ===
# API 基礎 URL - 部署後需要更新為實際的 Workers URL
VITE_API_BASE_URL=https://your-worker-name.your-account.workers.dev

# === 品牌資訊 ===
VITE_APP_NAME=$StoreName
VITE_APP_DESCRIPTION=$StoreDescription
VITE_APP_VERSION=1.0.0

# === SEO 設定 ===
VITE_DEFAULT_TITLE=$StoreName - 專業美妝電商
VITE_DEFAULT_DESCRIPTION=$StoreDescription
VITE_DEFAULT_KEYWORDS=美妝,化妝品,保養品,彩妝,護膚

# === 聯絡資訊 ===
VITE_COMPANY_NAME=$CompanyName
VITE_COMPANY_PHONE=$CompanyPhone
VITE_COMPANY_EMAIL=$CompanyEmail
VITE_COMPANY_ADDRESS=請更新為您的地址

# === 社群媒體連結 ===
VITE_FACEBOOK_URL=$FacebookUrl
VITE_INSTAGRAM_URL=$InstagramUrl
VITE_YOUTUBE_URL=
VITE_LINE_URL=

# === 支付系統公開資訊 ===
# 綠界科技 ECPay（需要與後端 Secrets 一致）
VITE_ECPAY_MERCHANT_ID=2000132
VITE_ECPAY_SANDBOX=true

# LINE Pay（需要與後端 Secrets 一致）
VITE_LINEPAY_CHANNEL_ID=1234567890
VITE_LINEPAY_SANDBOX=true

# === 業務設定 ===
VITE_DEFAULT_CURRENCY=TWD
VITE_CURRENCY_SYMBOL=NT$
VITE_FREE_SHIPPING_THRESHOLD=1000

# === 第三方服務公開 ID ===
# Google Analytics 4
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
# Facebook Pixel
VITE_FACEBOOK_PIXEL_ID=1234567890123456

# === UI 設定 ===
VITE_DEFAULT_THEME=light
VITE_DEFAULT_LANGUAGE=zh-TW

# === PWA 設定 ===
VITE_PWA_NAME=$StoreName
VITE_PWA_SHORT_NAME=$($StoreName -replace '\s.*', '')
VITE_PWA_DESCRIPTION=$StoreDescription
VITE_PWA_THEME_COLOR=#f43f5e
"@
    
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Success ".env 檔案已創建"
}

# 創建和上傳到 GitHub
function New-GitHubRepository {
    if ($SkipGitHub) {
        Write-Warning "跳過 GitHub 儲存庫創建"
        return
    }
    
    if ($global:SkipGit) {
        Write-Warning "Git 未安裝，跳過 GitHub 設定"
        return
    }
    
    Write-Step "創建 GitHub 儲存庫..."
    
    # 檢查 GitHub CLI 是否安裝
    $hasGitHubCli = Get-Command gh -ErrorAction SilentlyContinue
    
    if ($hasGitHubCli) {
        # 使用 GitHub CLI
        Write-Info "檢測到 GitHub CLI，使用 gh 指令創建儲存庫..."
        
        if (-not $GitHubRepoName) {
            $GitHubRepoName = Read-Host "請輸入 GitHub 儲存庫名稱 (預設: mickeyshop-beauty)"
        }
        if (-not $GitHubRepoName) { $GitHubRepoName = "mickeyshop-beauty" }
        
        # 檢查是否已登入 GitHub CLI
        $authStatus = gh auth status 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Info "請先登入 GitHub CLI..."
            gh auth login
        }
        
        # 創建儲存庫
        $repoDescription = "MickeyShop-Beauty: 專業美妝電商平台 - React + Cloudflare Workers 全端架構"
        gh repo create $GitHubRepoName --description $repoDescription --private --confirm
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "GitHub 儲存庫創建成功"
            
            # 設定遠端 origin
            $repoUrl = "https://github.com/$(gh api user --jq .login)/$GitHubRepoName.git"
            git remote add origin $repoUrl
            git branch -M main
            
            # 推送到 GitHub
            Write-Info "推送程式碼到 GitHub..."
            git push -u origin main
            
            if ($LASTEXITCODE -eq 0) {
                Write-Success "程式碼已成功上傳到 GitHub"
                Write-Info "儲存庫網址: https://github.com/$(gh api user --jq .login)/$GitHubRepoName"
            } else {
                Write-Error "推送到 GitHub 失敗"
            }
        } else {
            Write-Error "GitHub 儲存庫創建失敗"
        }
    } else {
        # 手動使用 Git + API
        Write-Info "使用 GitHub API 創建儲存庫..."
        
        if (-not $GitHubUsername) {
            $GitHubUsername = Read-Host "請輸入您的 GitHub 用戶名"
        }
        if (-not $GitHubRepoName) {
            $GitHubRepoName = Read-Host "請輸入 GitHub 儲存庫名稱 (預設: mickeyshop-beauty)"
        }
        if (-not $GitHubRepoName) { $GitHubRepoName = "mickeyshop-beauty" }
        
        if (-not $GitHubToken) {
            Write-Warning "需要 GitHub Personal Access Token 來創建儲存庫"
            Write-Info "請前往 https://github.com/settings/tokens 創建 Token"
            Write-Info "需要 'repo' 權限"
            $GitHubToken = Read-Host "請輸入 GitHub Token" -AsSecureString
            $GitHubToken = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($GitHubToken))
        }
        
        try {
            # 創建儲存庫
            $headers = @{
                "Authorization" = "token $GitHubToken"
                "Accept" = "application/vnd.github.v3+json"
            }
            
            $body = @{
                "name" = $GitHubRepoName
                "description" = "MickeyShop-Beauty: 專業美妝電商平台 - React + Cloudflare Workers 全端架構"
                "private" = $true
                "auto_init" = $false
            } | ConvertTo-Json
            
            $response = Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Method Post -Headers $headers -Body $body -ContentType "application/json"
            
            Write-Success "GitHub 儲存庫創建成功"
            
            # 設定遠端 origin
            $repoUrl = $response.clone_url
            git remote add origin $repoUrl
            git branch -M main
            
            # 推送到 GitHub
            Write-Info "推送程式碼到 GitHub..."
            git push -u origin main
            
            if ($LASTEXITCODE -eq 0) {
                Write-Success "程式碼已成功上傳到 GitHub"
                Write-Info "儲存庫網址: $($response.html_url)"
            } else {
                Write-Error "推送到 GitHub 失敗"
                Write-Info "請檢查 Token 權限或手動推送："
                Write-Info "git remote add origin $repoUrl"
                Write-Info "git branch -M main"
                Write-Info "git push -u origin main"
            }
        }
        catch {
            Write-Error "創建 GitHub 儲存庫失敗: $_"
            Write-Info "您可以稍後手動創建儲存庫並推送："
            Write-Info "1. 前往 https://github.com/new 創建儲存庫"
            Write-Info "2. 執行指令："
            Write-Info "   git remote add origin https://github.com/$GitHubUsername/$GitHubRepoName.git"
            Write-Info "   git branch -M main"
            Write-Info "   git push -u origin main"
        }
    }
}

# 部署到 Cloudflare
function Deploy-ToCloudflare {
    Write-Step "開始部署到 Cloudflare..."
    
    $deploy = Read-Host "是否立即部署到 Cloudflare? (y/N)"
    if ($deploy -ne "y" -and $deploy -ne "Y") {
        Write-Warning "跳過部署，您可以稍後手動部署"
        Write-Info "手動部署指令："
        Write-Info "  cd workers && npx wrangler deploy"
        Write-Info "  cd .. && npm run build && npx wrangler pages deploy dist"
        return
    }
    
    Set-Location workers
    
    # 建立 D1 資料庫
    Write-Info "建立 D1 資料庫..."
    $dbName = Read-Host "請輸入資料庫名稱 (預設: mickeyshop-beauty-db)"
    if (-not $dbName) { $dbName = "mickeyshop-beauty-db" }
    
    npx wrangler d1 create $dbName
    Write-Warning "請將輸出的 database_id 更新到 wrangler.toml 檔案中"
    
    # 建立 KV 命名空間
    Write-Info "建立 KV 命名空間..."
    npx wrangler kv:namespace create "CACHE_KV"
    npx wrangler kv:namespace create "SESSION_KV"
    Write-Warning "請將輸出的 KV ID 更新到 wrangler.toml 檔案中"
    
    # 建立 R2 儲存桶
    Write-Info "建立 R2 儲存桶..."
    $bucketName = Read-Host "請輸入儲存桶名稱 (預設: mickeyshop-beauty-storage)"
    if (-not $bucketName) { $bucketName = "mickeyshop-beauty-storage" }
    
    npx wrangler r2 bucket create $bucketName
    Write-Warning "請將儲存桶名稱更新到 wrangler.toml 檔案中"
    
    Write-Warning "請手動更新 wrangler.toml 中的 database_id 和 KV ID 後再繼續"
    $continue = Read-Host "wrangler.toml 更新完成後，按 Enter 繼續..."
    
    # 執行資料庫遷移
    Write-Info "執行資料庫遷移..."
    npx wrangler d1 migrations apply $dbName --remote
    
    # 部署 Workers
    Write-Info "部署後端 API..."
    npx wrangler deploy
    if ($LASTEXITCODE -eq 0) {
        Write-Success "後端部署成功"
        $apiUrl = Read-Host "請輸入部署後的 API URL (從上面的輸出複製)"
        
        # 更新前端 .env
        Set-Location ..
        if (Test-Path ".env") {
            (Get-Content ".env") -replace "VITE_API_BASE_URL=.*", "VITE_API_BASE_URL=$apiUrl" | Set-Content ".env"
            Write-Success "前端 API URL 已更新"
        }
        
        # 部署前端
        Write-Info "建置前端..."
        npm run build
        if ($LASTEXITCODE -eq 0) {
            Write-Info "部署前端..."
            $frontendName = Read-Host "請輸入前端專案名稱 (預設: mickeyshop-beauty-frontend)"
            if (-not $frontendName) { $frontendName = "mickeyshop-beauty-frontend" }
            
            npx wrangler pages deploy dist --project-name $frontendName
            Write-Success "前端部署成功"
        }
    } else {
        Write-Error "後端部署失敗"
        Set-Location ..
    }
}

# 顯示完成資訊
function Show-CompletionInfo {
    Write-Step "設定完成！"
    
    Write-Success "MickeyShop-Beauty 已成功設定"
    Write-Info "接下來的步驟："
    
    if (-not $SkipSecrets) {
        Write-Host "  1. 檢查所有 Cloudflare Secrets 是否正確設定"
        Write-Host "     指令: cd workers && npx wrangler secret list"
    }
    
    Write-Host "  2. 更新 wrangler.toml 中的 database_id、KV ID 等"
    Write-Host "  3. 確認 .env 檔案中的品牌資訊正確"
    Write-Host "  4. 執行部署指令："
    Write-Host "     cd workers && npx wrangler deploy"
    Write-Host "     cd .. && npm run build && npx wrangler pages deploy dist"
    
    if (-not $global:SkipGit -and -not $SkipGitHub) {
        Write-Host "  5. 確認 GitHub 儲存庫推送成功"
        Write-Host "     如未成功，請手動執行："
        Write-Host "     git remote add origin https://github.com/yourusername/your-store.git"
        Write-Host "     git branch -M main"
        Write-Host "     git push -u origin main"
    }
    
    Write-Host "`n[文檔] 詳細資訊請參考 SETUP_GUIDE.md"
    Write-Host "[支援] 如有問題，請檢查文檔或聯絡技術支援"
}

# 主執行流程
function Main {
    Write-ColorOutput @"

================================================
          MickeyShop-Beauty 自動化設定
            專業美妝電商平台
================================================

"@ "Magenta"
    
    try {
        Test-ProjectDirectory
        Test-Prerequisites
        Install-Dependencies
        Initialize-Git
        Connect-Cloudflare
        Set-CloudflareSecrets
        New-FrontendEnv
        New-GitHubRepository
        Deploy-ToCloudflare
        Show-CompletionInfo
        
        Write-Success "`n[完成] MickeyShop-Beauty 設定完成！"
    }
    catch {
        Write-Error "設定過程中發生錯誤: $_"
        Write-Info "請檢查錯誤訊息並重新執行腳本"
        exit 1
    }
}

# 執行主程式
Main
