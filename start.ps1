# VisionForge AI Studio - PowerShell Launcher
$Host.UI.RawUI.WindowTitle = "VisionForge AI Studio"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  VisionForge AI Studio - Launcher" -ForegroundColor Yellow
Write-Host "  Local No-Code AI Vision Training & Inference Platform" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $rootDir

# Check Python
Write-Host "[*] 正在檢查 Python 環境..." -ForegroundColor DarkCyan
try {
    $pyVer = python --version 2>&1
    Write-Host " [+] Python: $pyVer" -ForegroundColor Green
} catch {
    Write-Host " [!] 錯誤: 找不到 Python！請確認已安裝 Python 3.10+。" -ForegroundColor Red
    Read-Host "按 Enter 鍵離開..."
    exit 1
}

# Check Node.js
Write-Host "[*] 正在檢查 Node.js / npm 環境..." -ForegroundColor DarkCyan
try {
    $nodeVer = node -v 2>&1
    Write-Host " [+] Node.js: $nodeVer" -ForegroundColor Green
} catch {
    Write-Host " [!] 錯誤: 找不到 Node.js！請確認已安裝 Node.js。" -ForegroundColor Red
    Read-Host "按 Enter 鍵離開..."
    exit 1
}

# Install frontend dependencies if needed
if (-not (Test-Path "$rootDir\frontend\node_modules")) {
    Write-Host "[*] 正在安裝前端套件 (npm install)..." -ForegroundColor Yellow
    Set-Location "$rootDir\frontend"
    npm install
    Set-Location $rootDir
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "[*] 正在啟動服務..." -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Start Backend in separate window
Write-Host " [1/2] 啟動後端 FastAPI (Port 8000)..." -ForegroundColor Green
Start-Process -FilePath "cmd.exe" -ArgumentList "/k cd /d `"$rootDir`" && python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

# Wait 2 seconds for Python backend to initialize
Start-Sleep -Seconds 2

# 2. Start Frontend in separate window
Write-Host " [2/2] 啟動前端 Vite (Port 5173)..." -ForegroundColor Green
Start-Process -FilePath "cmd.exe" -ArgumentList "/k cd /d `"$rootDir\frontend`" && npm run dev"

# Open Browser
Write-Host "[*] 3 秒後自動開啟瀏覽器..." -ForegroundColor Gray
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  🎉 VisionForge 已成功啟動！" -ForegroundColor Green
Write-Host "  - 前端介面: http://localhost:5173" -ForegroundColor Cyan
Write-Host "  - 後端 API:  http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "  - API 文件:  http://127.0.0.1:8000/docs" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""
Read-Host "按 Enter 鍵關閉此引導視窗（背景伺服器將持續運行）..."
