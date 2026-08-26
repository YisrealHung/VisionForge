#!/usr/bin/env bash
# ==============================================================================
# VisionForge AI Studio - Linux / NVIDIA Jetson Orin Environment Setup
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

echo "=========================================================="
echo "  VisionForge AI Studio - Environment Setup Wizard"
echo "  Supporting Linux (x86_64) and NVIDIA Jetson Orin (ARM64)"
echo "=========================================================="
echo ""

# Find Python / Conda
PY_CMD=""
if command -v python3 &>/dev/null; then
    PY_CMD="python3"
elif command -v python &>/dev/null; then
    PY_CMD="python"
fi

if [ -z "${PY_CMD}" ]; then
    echo "[ERROR] 找不到 Python！請先安裝 Python 3.8+ 或 Conda/Miniforge。"
    exit 1
fi

echo "[*] 正在啟動環境建置嚮導 (${PY_CMD})..."
"${PY_CMD}" "${SCRIPT_DIR}/scripts/setup_env.py"
