@echo off
if not defined VF_PORT set "VF_PORT=8000"
title VisionForge AI Studio - Stop Services

echo ==========================================================
echo   Stopping VisionForge Services...
echo ==========================================================
echo.

set KILLED=0

:: 1. Terminate Backend on Port %VF_PORT%
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%VF_PORT%" ^| findstr "LISTENING"') do (
    echo [*] Stopping Backend on Port %VF_PORT%, PID: %%a
    taskkill /F /T /PID %%a >nul 2>&1
    set KILLED=1
)

:: 2. Terminate Frontend on Port 5173
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    echo [*] Stopping Frontend on Port 5173, PID: %%a
    taskkill /F /T /PID %%a >nul 2>&1
    set KILLED=1
)

:: 3. Close leftover VisionForge terminal windows
taskkill /FI "WINDOWTITLE eq VisionForge - Backend*" /F /T >nul 2>&1
taskkill /FI "WINDOWTITLE eq VisionForge - Frontend*" /F /T >nul 2>&1

echo.
if "%KILLED%"=="1" (
    echo [OK] All VisionForge services stopped successfully.
) else (
    echo [*] No running VisionForge services found.
)
echo ==========================================================
echo.
pause
