#!/usr/bin/env bash
# ==============================================================================
# VisionForge AI Studio - Linux / ARM64 Launcher
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
chmod +x "${SCRIPT_DIR}/scripts/start_jetson.sh" 2>/dev/null || true
exec "${SCRIPT_DIR}/scripts/start_jetson.sh" "$@"
