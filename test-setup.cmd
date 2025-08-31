@echo off
chcp 65001 >nul 2>&1
cls

echo.
echo ================================================
echo          測試 PowerShell 腳本語法
echo ================================================
echo.

echo 正在檢查 setup.ps1 語法...
powershell -NoProfile -Command "try { $null = [scriptblock]::Create((Get-Content '.\setup.ps1' -Raw)); Write-Host '[成功] setup.ps1 語法檢查通過' -ForegroundColor Green } catch { Write-Host '[錯誤] setup.ps1 語法錯誤:' -ForegroundColor Red; Write-Host $_.Exception.Message -ForegroundColor Yellow }"

echo.
echo 正在檢查基本功能...
powershell -NoProfile -ExecutionPolicy Bypass -Command "& '.\setup.ps1' -Help"

echo.
pause
