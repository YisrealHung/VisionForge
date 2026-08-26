@echo off
title VisionForge AI Studio - Environment Setup

cd /d "%~dp0"

echo ==========================================================
echo   VisionForge AI Studio - Setup Wizard
echo   Auto-configure Conda Environment and Dependencies
echo ==========================================================
echo.

set "PY_CMD="

if exist "D:\condaenv\cuda\python.exe" (
    set "PY_CMD=D:\condaenv\cuda\python.exe"
)

if not defined PY_CMD if exist "C:\ProgramData\miniconda3\python.exe" (
    set "PY_CMD=C:\ProgramData\miniconda3\python.exe"
)

if not defined PY_CMD if exist "%USERPROFILE%\miniconda3\python.exe" (
    set "PY_CMD=%USERPROFILE%\miniconda3\python.exe"
)

if not defined PY_CMD (
    python --version >nul 2>&1
    if not errorlevel 1 set "PY_CMD=python"
)

if not defined PY_CMD (
    echo [ERROR] Python / Conda not found in standard paths or PATH!
    echo Please install Miniconda or Python 3.10+ first.
    pause
    exit /b 1
)

echo [*] Starting Setup Wizard with %PY_CMD% ...
"%PY_CMD%" "%~dp0scripts\setup_env.py"

pause
