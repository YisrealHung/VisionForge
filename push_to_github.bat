@echo off
chcp 65001 >nul
title VisionForge - Git Push to GitHub
cd /d "%~dp0"

echo ==========================================================
echo   Pushing VisionForge to GitHub (origin/main)...
echo ==========================================================
echo.

git push origin main

echo.
if %errorlevel% equ 0 (
    echo [OK]  GitHub (origin/main)
) else (
    echo [ERROR]  GitHub  GitHub 
)
echo.
pause
