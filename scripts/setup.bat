@echo off
chcp 65001 >nul
title VisionForge - Environment Setup
color 0A

echo ==============================================================================
echo.
echo            VisionForge 
echo.
echo ==============================================================================

set "ROOT_DIR=%~dp0..\"
cd /d "%ROOT_DIR%"

:: Set Python to D:\condaenv\cuda if present
set "PY_CMD=python"
if exist "D:\condaenv\cuda\python.exe" (
    set "PY_CMD=D:\condaenv\cuda\python.exe"
    set "PATH=D:\condaenv\cuda;D:\condaenv\cuda\Scripts;D:\condaenv\cuda\Library\bin;D:\condaenv\cuda\Library\usr\bin;D:\condaenv\cuda\Library\mingw-w64\bin;%PATH%"
)

echo [1/2]  Python  (%PY_CMD%)...
"%PY_CMD%" -m pip install --upgrade pip
"%PY_CMD%" -m pip install -r backend\requirements.txt
"%PY_CMD%" -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121 2>nul || "%PY_CMD%" -m pip install torch torchvision
"%PY_CMD%" -m pip install onnx onnxruntime pillow numpy opencv-python

echo.
echo [2/2]  Node.js ...
cd /d "%ROOT_DIR%frontend"
call npm install

echo.
echo ==============================================================================
echo []  start.bat  VisionForge
echo ==============================================================================
pause
