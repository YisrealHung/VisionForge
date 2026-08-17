@echo off
chcp 65001 >nul
title VisionForge - Environment Setup
color 0A

echo ==============================================================================
echo.
echo           ⚙️ VisionForge 環境相依套件安裝與設定
echo.
echo ==============================================================================

set "ROOT_DIR=%~dp0..\"
cd /d "%ROOT_DIR%"

echo [1/2] 正在安裝 Python 後端相依套件...
python -m pip install --upgrade pip
python -m pip install -r backend\requirements.txt
python -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121 2>nul || python -m pip install torch torchvision
python -m pip install onnx onnxruntime pillow numpy opencv-python

echo.
echo [2/2] 正在安裝 Node.js 前端相依套件...
cd /d "%ROOT_DIR%frontend"
call npm install

echo.
echo ==============================================================================
echo [✓] 環境建置完成！您現在可以雙擊 start.bat 啟動 VisionForge！
echo ==============================================================================
pause
