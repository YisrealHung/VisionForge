#!/usr/bin/env bash
# ==============================================================================
# VisionForge AI Studio - Stop Services (Linux / Jetson)
# ==============================================================================

echo "=========================================================="
echo "  Stopping VisionForge Services (Linux / Jetson)..."
echo "=========================================================="

KILLED=0

# Terminate processes on the backend port (VF_PORT, default 8000)
BACKEND_PORT="${VF_PORT:-8000}"
PIDS_BACKEND=$(lsof -ti:${BACKEND_PORT} 2>/dev/null || fuser ${BACKEND_PORT}/tcp 2>/dev/null || true)
if [ -n "${PIDS_BACKEND}" ]; then
    echo "[*] 正在停止 Port ${BACKEND_PORT} 進程: ${PIDS_BACKEND}..."
    kill -9 ${PIDS_BACKEND} 2>/dev/null || true
    KILLED=1
fi

# Terminate processes on port 5173
PIDS_5173=$(lsof -ti:5173 2>/dev/null || fuser 5173/tcp 2>/dev/null || true)
if [ -n "${PIDS_5173}" ]; then
    echo "[*] 正在停止 Port 5173 進程: ${PIDS_5173}..."
    kill -9 ${PIDS_5173} 2>/dev/null || true
    KILLED=1
fi

# Also kill uvicorn backend if still running
pkill -f "uvicorn backend.app.main:app" 2>/dev/null && KILLED=1 || true

echo ""
if [ "${KILLED}" -eq 1 ]; then
    echo "[OK] VisionForge 服務已成功停止。"
else
    echo "[*] 目前沒有正在運行的 VisionForge 服務。"
fi
echo "=========================================================="
