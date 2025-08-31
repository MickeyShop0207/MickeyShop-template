@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion
cls

echo.
echo ================================================
echo          MickeyShop-Beauty 自動化設定
echo            專業美妝電商平台
echo ================================================
echo.

echo 正在啟動 PowerShell 設定腳本...
echo.

REM 檢查 PowerShell 是否可用
where powershell >nul 2>nul
if %errorlevel% neq 0 (
    echo 錯誤: 未找到 PowerShell
    echo 請確保 Windows PowerShell 已安裝
    pause
    exit /b 1
)

REM 檢查執行政策
powershell -Command "if ((Get-ExecutionPolicy) -eq 'Restricted') { Write-Host '警告: PowerShell 執行政策受限' -ForegroundColor Yellow; Write-Host '如果腳本無法執行，請以管理員身分執行:' -ForegroundColor Yellow; Write-Host 'Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser' -ForegroundColor Cyan }"

echo.
echo 使用說明:
echo   此腳本將自動安裝依賴、設定環境、創建 GitHub 儲存庫
echo   需要準備: Cloudflare 帳戶、GitHub 帳戶、支付系統資料
echo   建議使用參數快速設定，例如:
echo     powershell .\setup.ps1 -StoreName "我的美妝店" -CompanyEmail "contact@mystore.com"
echo.

set /p choice="是否繼續執行設定? (Y/N): "
if /i "%choice%" neq "Y" (
    echo 設定已取消
    pause
    exit /b 0
)

echo.
echo 啟動 PowerShell 設定腳本...
echo.

REM 執行完整版 PowerShell 腳本
powershell -ExecutionPolicy Bypass -File ".\setup.ps1" %*

echo.
if %errorlevel% equ 0 (
    echo 設定完成！
) else (
    echo 設定過程中發生錯誤
    echo 請檢查上方錯誤訊息並重新執行
)

pause