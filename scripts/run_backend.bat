@echo off
title VisionForge - Backend Server (Port 8000)

cd /d "%~dp0..\"
set "PYTHONPATH=%cd%"

echo ==========================================================
echo   VisionForge - Backend Server
echo   Running on: http://127.0.0.1:8000
echo   API Docs:   http://127.0.0.1:8000/docs
echo ==========================================================
echo.

:: Auto-detect Python executable that has uvicorn
set "PY_CMD="
if exist "%USERPROFILE%\miniconda3\python.exe" (
    "%USERPROFILE%\miniconda3\python.exe" -c "import uvicorn" >nul 2>&1
    if not errorlevel 1 set "PY_CMD=%USERPROFILE%\miniconda3\python.exe"
)
if not defined PY_CMD (
    python -c "import uvicorn" >nul 2>&1
    if not errorlevel 1 set "PY_CMD=python"
)
if not defined PY_CMD (
    if exist "C:\Users\PC\AppData\Local\Programs\Python\Python312\python.exe" (
        set "PY_CMD=C:\Users\PC\AppData\Local\Programs\Python\Python312\python.exe"
    ) else (
        set "PY_CMD=python"
    )
)

echo [*] Using Python: %PY_CMD%
"%PY_CMD%" -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload

if errorlevel 1 (
    echo.
    echo [ERROR] Backend server stopped unexpectedly!
    pause
)
