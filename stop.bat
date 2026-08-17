@echo off
title VisionForge AI Studio - Stop Services

echo ==========================================================
echo   Stopping VisionForge Services...
echo ==========================================================

:: Terminate Backend (port 8000)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    echo [*] Killing Backend process PID: %%a ...
    taskkill /F /PID %%a >nul 2>&1
)

:: Terminate Frontend (port 5173)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    echo [*] Killing Frontend process PID: %%a ...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo [OK] All VisionForge services have been stopped.
echo.
pause
