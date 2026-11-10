import importlib.util
import sys
from importlib import metadata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
_spec = importlib.util.spec_from_file_location("safe_pip", ROOT / "scripts" / "safe_pip.py")
safe_pip = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(safe_pip)


def test_constraints_pin_installed_protected_versions():
    # numpy is always present in the backend environment; it must be pinned to the exact version.
    path = safe_pip.write_constraints(sys.executable)
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    finally:
        path.unlink()
    assert f"numpy=={metadata.version('numpy')}" in lines
    # Nothing outside the protected list is pinned.
    pinned = {line.split("==")[0] for line in lines if "==" in line}
    assert pinned <= set(safe_pip.PROTECTED_DISTS)


def test_requirement_name_parsing():
    assert safe_pip._requirement_name("opencv-python>=4.6.0") == "opencv-python"
    assert safe_pip._requirement_name("torch>=1.8.0; sys_platform != 'darwin'") == "torch"
    assert safe_pip._requirement_name("matplotlib") == "matplotlib"
