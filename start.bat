@echo off
title VisionForge AI Studio - Launcher

cd /d "%~dp0"

echo ==========================================================
echo   VisionForge AI Studio - Launcher
echo   Local No-Code AI Vision Training and Inference Platform
echo ==========================================================
echo.

if exist "%~dp0env_config.bat" (
    call "%~dp0env_config.bat"
) else (
    if exist "D:\condaenv\cuda\python.exe" (
        set "PY_CMD=D:\condaenv\cuda\python.exe"
        set "CONDA_ENV_DIR=D:\condaenv\cuda"
        set "PATH=D:\condaenv\cuda;D:\condaenv\cuda\Scripts;D:\condaenv\cuda\Library\bin;%PATH%"
    ) else (
        set "PY_CMD=python"
    )
)

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
echo [*] Installing frontend packages...
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
start "VisionForge - Backend (Port 8000)" cmd /k "%~dp0scripts\run_backend.bat"

:: 2. Launch Vite Frontend (Port 5173)
echo [2/2] Launching Frontend Server on http://localhost:5173 ...
start "VisionForge - Frontend (Port 5173)" cmd /k "%~dp0scripts\run_frontend.bat"

:: Open browser immediately while services initialize
echo.
echo [*] Opening browser on http://localhost:5173 ...
ping 127.0.0.1 -n 2 >nul
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
echo [ERROR] Python not found! Please run setup_env.bat first.
pause
exit /b 1

:no_node
echo [ERROR] Node.js / npm not found! Please install Node.js from https://nodejs.org
pause
exit /b 1
