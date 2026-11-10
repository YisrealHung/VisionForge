@echo off
if not defined VF_PORT set "VF_PORT=8000"
title VisionForge - Backend Server (Port %VF_PORT%)

cd /d "%~dp0..\"
set "PYTHONPATH=%cd%"

echo ==========================================================
echo   VisionForge - Backend Server
echo   Running on: http://127.0.0.1:%VF_PORT%
echo   API Docs:   http://127.0.0.1:%VF_PORT%/docs
echo ==========================================================
echo.

if exist "%~dp0..\env_config.bat" (
    call "%~dp0..\env_config.bat"
) else (
    if exist "D:\condaenv\cuda\python.exe" (
        set "PY_CMD=D:\condaenv\cuda\python.exe"
        set "CONDA_ENV_DIR=D:\condaenv\cuda"
        set "PATH=D:\condaenv\cuda;D:\condaenv\cuda\Scripts;D:\condaenv\cuda\Library\bin;%PATH%"
    ) else (
        set "PY_CMD=python"
    )
)

echo [*] Using Python: %PY_CMD%
"%PY_CMD%" -m uvicorn backend.app.main:app --host 127.0.0.1 --port %VF_PORT% --reload --reload-dir backend/app

if errorlevel 1 (
    echo.
    echo [ERROR] Backend server stopped unexpectedly!
    pause
)
