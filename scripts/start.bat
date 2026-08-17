@echo off
setlocal EnableDelayedExpansion
title VisionForge AI Studio - Launcher

cd /d "%~dp0..\"

echo ==========================================================
echo   VisionForge AI Studio - Launcher
echo   Local No-Code AI Vision Training and Inference Platform
echo ==========================================================
echo.

:: Auto-detect Python executable with uvicorn
set "PY_CMD="
if exist "%USERPROFILE%\miniconda3\python.exe" (
    "%USERPROFILE%\miniconda3\python.exe" -c "import uvicorn" >nul 2>&1
    if not errorlevel 1 set "PY_CMD=%USERPROFILE%\miniconda3\python.exe"
)
if not defined PY_CMD (
    python -c "import uvicorn" >nul 2>&1
    if not errorlevel 1 set "PY_CMD=python"
)
if not defined PY_CMD set "PY_CMD=python"

echo [*] Checking Python environment...
"%PY_CMD%" --version
if errorlevel 1 goto :no_python
echo  [+] Python OK (%PY_CMD%)

echo.
echo [*] Checking Node.js environment...
call node -v
if errorlevel 1 goto :no_node

echo.
echo [*] Checking frontend dependencies...
if exist "frontend\node_modules" goto :deps_ok
echo [*] Installing frontend packages (npm install)...
cd frontend
call npm install
cd ..

:deps_ok
echo.
echo ==========================================================
echo [*] Starting VisionForge services...
echo ==========================================================

:: 1. Launch FastAPI Backend (Port 8000)
echo [1/2] Launching Backend Server on http://127.0.0.1:8000 ...
start "VisionForge - Backend (Port 8000)" cmd /k "%~dp0run_backend.bat"

:: Wait 3 seconds for Python backend to load modules and bind port 8000
ping 127.0.0.1 -n 4 >nul

:: 2. Launch Vite Frontend (Port 5173)
echo [2/2] Launching Frontend Server on http://localhost:5173 ...
start "VisionForge - Frontend (Port 5173)" cmd /k "%~dp0run_frontend.bat"

:: Wait 2 seconds then open browser
echo.
echo [*] Opening browser in 3 seconds...
ping 127.0.0.1 -n 4 >nul
start http://localhost:5173

echo.
echo ==========================================================
echo   VisionForge is now RUNNING!
echo   - Frontend: http://localhost:5173
echo   - Backend:  http://127.0.0.1:8000
echo   - API Docs: http://127.0.0.1:8000/docs
echo.
echo   To STOP all services, run: stop.bat
echo ==========================================================
echo.
echo Press any key to close this launcher window (servers remain running)...
pause >nul
exit /b 0

:no_python
echo [ERROR] Python not found in PATH!
echo Please install Python 3.10+ and add it to PATH.
pause
exit /b 1

:no_node
echo [ERROR] Node.js / npm not found in PATH!
echo Please install Node.js from https://nodejs.org
pause
exit /b 1
