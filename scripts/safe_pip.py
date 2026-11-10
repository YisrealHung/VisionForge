"""
Environment-safe pip installs for VisionForge.

Jetson (and CUDA desktop) environments carry hand-installed builds of torch / torchvision /
numpy / OpenCV / onnxruntime that pip must never upgrade or replace: e.g. a newer scipy
can drag numpy 1.x -> 2.x and break NVIDIA's torch wheel, and `pip install onnxruntime`
next to `onnxruntime-gpu` shadows the GPU build.

Every install goes through a pip *constraints* file that pins whatever versions of the
protected distributions are already installed in the target interpreter. pip then either
picks versions compatible with them or fails with a resolution error - it never silently
changes them.

Usage (manual, e.g. on Jetson):
    python3 scripts/safe_pip.py -r backend/requirements.txt
    python3 scripts/safe_pip.py ultralytics          # uses the Jetson-aware path below
"""
import json
import os
import platform
import subprocess
import sys
import tempfile
from pathlib import Path

# Distributions whose installed version must never be changed by a VisionForge install.
PROTECTED_DISTS = [
    "torch", "torchvision", "torchaudio",
    "numpy",
    "opencv-python", "opencv-contrib-python", "opencv-python-headless", "opencv-contrib-python-headless",
    "onnxruntime", "onnxruntime-gpu",
    "tensorrt",
]

_QUERY = r"""
import json, sys
from importlib import metadata
out = {}
for name in json.loads(sys.argv[1]):
    try:
        out[name] = metadata.version(name)
    except metadata.PackageNotFoundError:
        pass
print(json.dumps(out))
"""


def is_jetson() -> bool:
    if Path("/etc/nv_tegra_release").exists():
        return True
    return platform.machine() == "aarch64" and "tegra" in platform.release().lower()


def installed_versions(python_exe: str, dists) -> dict:
    res = subprocess.run([python_exe, "-c", _QUERY, json.dumps(list(dists))],
                         capture_output=True, text=True)
    if res.returncode != 0:
        return {}
    try:
        return json.loads(res.stdout.strip() or "{}")
    except json.JSONDecodeError:
        return {}


def module_importable(python_exe: str, module: str) -> bool:
    return subprocess.run([python_exe, "-c", f"import {module}"],
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0


def write_constraints(python_exe: str) -> Path:
    pins = installed_versions(python_exe, PROTECTED_DISTS)
    fd, path = tempfile.mkstemp(prefix="visionforge-constraints-", suffix=".txt")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        f.write("# Auto-generated: keep the existing protected builds untouched.\n")
        for name, ver in sorted(pins.items()):
            # Local version labels (e.g. 2.3.0a0+ebed944.nv24.03) must be matched exactly.
            f.write(f"{name}=={ver}\n")
    if pins:
        print("[safe-pip] 鎖定既有版本: " + ", ".join(f"{k}=={v}" for k, v in sorted(pins.items())))
    return Path(path)


def pip_install(python_exe: str, args, extra_pip_args=()) -> bool:
    """Run `pip install <args>` constrained to the currently installed protected versions."""
    constraints = write_constraints(python_exe)
    try:
        cmd = [python_exe, "-m", "pip", "install", "-c", str(constraints), *extra_pip_args, *args]
        print(">> 執行: " + " ".join(cmd))
        return subprocess.run(cmd).returncode == 0
    finally:
        try:
            constraints.unlink()
        except OSError:
            pass


def _requirement_name(req: str) -> str:
    name = req.split(";")[0]
    for sep in "<>=!~[ (":
        name = name.split(sep)[0]
    return name.strip().lower()


def install_ultralytics(python_exe: str) -> bool:
    """
    On Jetson, a system/JetPack OpenCV (often with no pip metadata) must not be shadowed by the
    opencv-python wheel that ultralytics declares. Install ultralytics without deps, then install
    its remaining runtime requirements except OpenCV/torch/numpy, still under constraints.
    """
    if not (is_jetson() and module_importable(python_exe, "cv2")):
        return pip_install(python_exe, ["ultralytics"])

    if not pip_install(python_exe, ["ultralytics"], extra_pip_args=["--no-deps"]):
        return False
    query = (
        "import json; from importlib import metadata; "
        "print(json.dumps([r for r in (metadata.requires('ultralytics') or []) if 'extra ==' not in r]))"
    )
    res = subprocess.run([python_exe, "-c", query], capture_output=True, text=True)
    try:
        reqs = json.loads(res.stdout.strip() or "[]")
    except json.JSONDecodeError:
        reqs = []
    skip = ("opencv", "torch", "torchvision", "numpy")
    remaining = [r.split(";")[0].strip() for r in reqs if not _requirement_name(r).startswith(skip)]
    if not remaining:
        return True
    return pip_install(python_exe, remaining)


def main(argv) -> int:
    if sys.platform == "win32":
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    if not argv:
        print(__doc__)
        return 2
    if argv == ["ultralytics"]:
        return 0 if install_ultralytics(sys.executable) else 1
    return 0 if pip_install(sys.executable, argv) else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
