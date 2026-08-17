@echo off
title VisionForge - Frontend Server (Port 5173)

cd /d "%~dp0..\frontend"

echo ==========================================================
echo   VisionForge - Frontend Server
echo   Running on: http://localhost:5173
echo ==========================================================
echo.

call npm run dev

if errorlevel 1 (
    echo.
    echo [ERROR] Frontend server stopped unexpectedly!
    pause
)
