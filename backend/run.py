import sys
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

import uvicorn

if __name__ == "__main__":
    import os

    host = os.environ.get("VF_HOST", "127.0.0.1")
    port = int(os.environ.get("VF_PORT", "8000"))
    # Auto-reload is a development feature: it restarts the server (and kills any running
    # training thread) whenever a .py file changes. Enable with VF_RELOAD=1.
    reload = os.environ.get("VF_RELOAD", "0") == "1"
    print(f"[VisionForge] Starting Backend Server on http://{host}:{port} (reload={reload}) ...")
    uvicorn.run(
        "backend.app.main:app",
        host=host,
        port=port,
        reload=reload,
        reload_dirs=[str(Path(__file__).resolve().parent / "app")] if reload else None,
    )
