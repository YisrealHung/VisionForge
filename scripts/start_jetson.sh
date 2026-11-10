#!/usr/bin/env bash
# ==============================================================================
# VisionForge AI Studio - Linux / NVIDIA Jetson Orin Launcher
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo -e "\033[1;36m==========================================================\033[0m"
echo -e "\033[1;33m  VisionForge AI Studio - Jetson Orin Launcher\033[0m"
echo -e "\033[1;30m  Local No-Code AI Vision Platform (ARM64 / Linux)\033[0m"
echo -e "\033[1;36m==========================================================\033[0m"
echo ""

cd "${ROOT_DIR}"

# 1. Check Python / Conda Environment
PY_CMD="python3"
if [ -f "${ROOT_DIR}/env_config.sh" ]; then
    source "${ROOT_DIR}/env_config.sh"
fi

echo -e "\033[0;36m[*] 正在檢查 Python 環境 (${PY_CMD})...\033[0m"
if command -v "${PY_CMD}" &>/dev/null; then
    PY_VER=$("${PY_CMD}" --version)
    echo -e "\033[0;32m [+] Python: ${PY_VER}\033[0m"
else
    echo -e "\033[0;31m [!] 錯誤: 找不到 ${PY_CMD}！請確認已安裝 Python 3.8+ 或執行 ./setup_env.sh。\033[0m"
    exit 1
fi

# 2. Check PyTorch & CUDA for Jetson
echo -e "\033[0;36m[*] 正在檢查 PyTorch 與 GPU 加速狀態...\033[0m"
python3 -c "
import torch
cuda_avail = torch.cuda.is_available()
device_name = torch.cuda.get_device_name(0) if cuda_avail else 'N/A'
print(f' [+] PyTorch: {torch.__version__}')
print(f' [+] CUDA 加速支援: {\"🟢 已啟用\" if cuda_avail else \"🟡 未啟用 (CPU 模式)\"}')
if cuda_avail:
    print(f' [+] 運算裝置: {device_name}')
" || true

# 3. Check if frontend build exists
if [ ! -d "${ROOT_DIR}/frontend/dist" ]; then
    echo ""
    echo -e "\033[0;33m[*] 尚未發現前端編譯檔案，正在進行生產構建 (npm run build)...\033[0m"
    cd "${ROOT_DIR}/frontend"
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    npm run build
    cd "${ROOT_DIR}"
fi

# Port can be overridden with VF_PORT (empty means default).
export VF_PORT="${VF_PORT:-8000}"

echo ""
echo -e "\033[1;32m==========================================================\033[0m"
echo -e "\033[1;32m  🎉 正在啟動 VisionForge 服務...\033[0m"
echo -e "\033[1;36m  - 服務監聽位址: http://0.0.0.0:${VF_PORT}\033[0m"
echo -e "\033[1;36m  - 本機瀏覽器:   http://localhost:${VF_PORT}\033[0m"
echo -e "\033[1;36m  - API 文件:     http://localhost:${VF_PORT}/docs\033[0m"
echo -e "\033[1;32m==========================================================\033[0m"
echo ""

# Start FastAPI backend server binding 0.0.0.0 for LAN access
exec "${PY_CMD}" -m uvicorn backend.app.main:app --host 0.0.0.0 --port "${VF_PORT}"
