@echo off
chcp 65001 >nul
title VisionForge - Git Push to GitHub
cd /d "%~dp0"
echo ==========================================================
echo   Pushing VisionForge to GitHub (origin/main)...
echo ==========================================================
echo.
git push origin clean_main:main
echo.
if %errorlevel% equ 0 (
    echo [✓] 推送成功！已將最新版本更新至 GitHub main 分支！
) else (
    echo [!] 推送失敗，請確認 GitHub 存取權限或登入憑證。
)
echo.
pause
