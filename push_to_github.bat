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
    echo []  GitHub main 
) else (
    echo [!]  GitHub 
)
echo.
pause
