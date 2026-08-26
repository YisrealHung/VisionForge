import os
import sys
import subprocess
import shutil
from pathlib import Path

# Enable UTF-8 console output if supported
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

ROOT_DIR = Path(__file__).resolve().parent.parent

def run_cmd(cmd, cwd=None, check=True):
    print(f"\n>> 執行: {cmd}")
    res = subprocess.run(cmd, shell=True, cwd=cwd or ROOT_DIR)
    if check and res.returncode != 0:
        print(f"[!] 指令執行失敗 (代碼: {res.returncode}): {cmd}")
    return res.returncode == 0

def check_python_module(python_exe, module_name):
    res = subprocess.run(f'"{python_exe}" -c "import {module_name}"', shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return res.returncode == 0

def find_conda():
    conda_path = shutil.which("conda")
    if conda_path:
        return conda_path
    
    common_paths = [
        Path("C:/ProgramData/miniconda3/Scripts/conda.exe"),
        Path("C:/ProgramData/miniconda3/condabin/conda.bat"),
        Path(os.path.expanduser("~/miniconda3/Scripts/conda.exe")),
        Path(os.path.expanduser("~/miniconda3/condabin/conda.bat")),
        Path("C:/ProgramData/anaconda3/Scripts/conda.exe"),
        Path(os.path.expanduser("~/anaconda3/Scripts/conda.exe")),
        Path("D:/miniconda3/Scripts/conda.exe"),
        Path("D:/anaconda3/Scripts/conda.exe"),
    ]
    for p in common_paths:
        if p.exists():
            return str(p)
    return None

def get_conda_envs(conda_exe):
    envs = []
    try:
        out = subprocess.check_output(f'"{conda_exe}" info --envs', shell=True, text=True, errors="ignore")
        for line in out.splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            parts = line.split()
            env_path = parts[-1]
            if os.path.isdir(env_path):
                envs.append(env_path)
    except Exception as e:
        print(f"[*] 讀取 Conda 環境列表時發生異常: {e}")
    
    cuda_default = "D:\\condaenv\\cuda"
    if os.path.isdir(cuda_default) and cuda_default not in envs:
        envs.append(cuda_default)
    return envs

def write_crlf(file_path: Path, content: str):
    crlf_content = content.replace("\r\n", "\n").replace("\n", "\r\n")
    with open(file_path, "wb") as f:
        f.write(crlf_content.encode("ascii", errors="ignore"))
    print(f" [+] 已生成/更新腳本 (CRLF): {file_path.name}")

def main():
    print("=" * 65)
    print("      VisionForge AI Studio - Conda 環境自動化建置工具")
    print("=" * 65)

    # 1. Check Conda & locate target environment
    conda_exe = find_conda()
    target_env_dir = None
    target_python = None

    if os.path.exists("D:\\condaenv\\cuda\\python.exe"):
        print("\n[+] 偵測到既有專用環境: D:\\condaenv\\cuda")
        target_env_dir = "D:\\condaenv\\cuda"
        target_python = "D:\\condaenv\\cuda\\python.exe"
    elif conda_exe:
        print(f"\n[+] 找到 Conda 安裝: {conda_exe}")
        envs = get_conda_envs(conda_exe)
        print(f"[*] 掃描到的 Conda 環境列表:")
        for idx, env in enumerate(envs, 1):
            print(f"   [{idx}] {env}")
        
        vf_env = None
        for env in envs:
            if "visionforge" in env.lower():
                vf_env = env
                break
        
        if vf_env:
            print(f"\n[+] 發現 VisionForge 專屬環境: {vf_env}")
            target_env_dir = vf_env
            target_python = os.path.join(vf_env, "python.exe")
        else:
            print("\n[*] 正在為您建立全新的 Conda 環境 (名稱: visionforge, Python 3.11)...")
            success = run_cmd(f'"{conda_exe}" create -y -n visionforge python=3.11')
            if success:
                envs_after = get_conda_envs(conda_exe)
                for env in envs_after:
                    if "visionforge" in env.lower():
                        target_env_dir = env
                        target_python = os.path.join(env, "python.exe")
                        break

    if not target_python or not os.path.exists(target_python):
        print("\n[!] 未能取得 Conda 環境，將回退使用系統預設 Python。")
        target_python = sys.executable
        target_env_dir = os.path.dirname(sys.executable)

    print(f"\n[OK] 目標 Python 直譯器: {target_python}")
    print(f"[OK] 目標環境目錄:       {target_env_dir}")

    # 2. Check and install backend dependencies
    print("\n" + "=" * 65)
    print(" [1/3] 檢查並安裝後端核心相依套件...")
    print("=" * 65)
    
    if not (check_python_module(target_python, "fastapi") and check_python_module(target_python, "pydantic_settings")):
        print("[*] 正在安裝後端必要套件 (FastAPI, Pydantic, Uvicorn 等)...")
        req_file = ROOT_DIR / "backend" / "requirements.txt"
        run_cmd(f'"{target_python}" -m pip install -r "{req_file}"')
    else:
        print("[OK] 後端核心套件 (FastAPI, Pydantic-Settings 等) 已安裝完成。")

    # 3. Check GPU / PyTorch
    print("\n" + "=" * 65)
    print(" [2/3] 檢查 GPU 與深度學習環境 (PyTorch / CUDA / ONNX)...")
    print("=" * 65)
    
    if not check_python_module(target_python, "torch"):
        has_gpu = False
        try:
            smi_out = subprocess.check_output("nvidia-smi", shell=True, text=True, errors="ignore")
            if "NVIDIA-SMI" in smi_out:
                has_gpu = True
        except Exception:
            pass

        if has_gpu:
            print("[+] 偵測到 NVIDIA GPU！正在安裝 CUDA 12.1 PyTorch 加速支援...")
            run_cmd(f'"{target_python}" -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121')
        else:
            print("[*] 未偵測到 GPU，安裝標準 CPU 版 PyTorch...")
            run_cmd(f'"{target_python}" -m pip install torch torchvision')
    else:
        print("[OK] PyTorch 深度學習框架已就緒。")

    # Check ONNX / CV2 / PIL
    missing_tools = []
    for pkg, mod in [("onnx", "onnx"), ("onnxruntime", "onnxruntime"), ("pillow", "PIL"), ("opencv-python", "cv2"), ("pyyaml", "yaml")]:
        if not check_python_module(target_python, mod):
            missing_tools.append(pkg)
    
    if missing_tools:
        print(f"[*] 正在安裝其餘視覺與推論套件: {missing_tools}...")
        run_cmd(f'"{target_python}" -m pip install {" ".join(missing_tools)}')
    else:
        print("[OK] ONNX, OpenCV, Pillow, PyYAML 視覺推論套件皆已就緒。")

    # 4. Frontend node_modules check
    print("\n" + "=" * 65)
    print(" [3/3] 檢查前端依賴套件 (Node.js / npm)...")
    print("=" * 65)
    frontend_dir = ROOT_DIR / "frontend"
    if not (frontend_dir / "node_modules").exists():
        node_check = shutil.which("node")
        if node_check:
            print("[*] 正在安裝前端 npm 套件...")
            run_cmd("npm install", cwd=frontend_dir)
        else:
            print("[!] 未偵測到 Node.js，請先至 https://nodejs.org 安裝 Node.js。")
    else:
        print("[OK] 前端 node_modules 模組已就緒。")

    # 5. Generate env_config.bat, start.bat, stop.bat
    print("\n" + "=" * 65)
    print(" [*] 正在生成綁定環境的啟動與停止腳本 (start.bat & stop.bat)...")
    print("=" * 65)

    # env_config.bat (Windows)
    env_config_content = f"""@echo off
set "PY_CMD={target_python}"
set "CONDA_ENV_DIR={target_env_dir}"
set "PATH=%CONDA_ENV_DIR%;%CONDA_ENV_DIR%\\Scripts;%CONDA_ENV_DIR%\\Library\\bin;%CONDA_ENV_DIR%\\Library\\usr\\bin;%CONDA_ENV_DIR%\\Library\\mingw-w64\\bin;%PATH%"
"""
    write_crlf(ROOT_DIR / "env_config.bat", env_config_content)
    write_crlf(ROOT_DIR / "scripts" / "env_config.bat", env_config_content)

    # env_config.sh (Linux / Jetson)
    env_config_sh = f"""#!/usr/bin/env bash
export PY_CMD="{target_python}"
export CONDA_ENV_DIR="{target_env_dir}"
export PATH="${{CONDA_ENV_DIR}}/bin:${{PATH}}"
"""
    with open(ROOT_DIR / "env_config.sh", "w", newline="\n") as f:
        f.write(env_config_sh)

    if sys.platform != "win32":
        for sh_file in [ROOT_DIR / "start.sh", ROOT_DIR / "stop.sh", ROOT_DIR / "setup_env.sh", ROOT_DIR / "scripts" / "start_jetson.sh"]:
            if sh_file.exists():
                try:
                    os.chmod(sh_file, 0o755)
                except Exception:
                    pass

    # start.bat
    start_bat_content = """@echo off
title VisionForge AI Studio - Launcher

cd /d "%~dp0"

echo ==========================================================
echo   VisionForge AI Studio - Launcher
echo   Local No-Code AI Vision Training and Inference Platform
echo ==========================================================
echo.

if exist "%~dp0env_config.bat" (
    call "%~dp0env_config.bat"
) else (
    if exist "D:\\condaenv\\cuda\\python.exe" (
        set "PY_CMD=D:\\condaenv\\cuda\\python.exe"
        set "CONDA_ENV_DIR=D:\\condaenv\\cuda"
        set "PATH=D:\\condaenv\\cuda;D:\\condaenv\\cuda\\Scripts;D:\\condaenv\\cuda\\Library\\bin;%PATH%"
    ) else (
        set "PY_CMD=python"
    )
)

echo [*] Checking Python environment...
"%PY_CMD%" --version
if errorlevel 1 goto :no_python
echo  [+] Python OK (%PY_CMD%)

echo.
echo [*] Checking Node.js environment...
call node -v
if errorlevel 1 goto :no_node

echo.
echo [*] Checking frontend dependencies...
if exist "frontend\\node_modules" goto :deps_ok
echo [*] Installing frontend packages...
cd frontend
call npm install
cd ..

:deps_ok
echo.
echo ==========================================================
echo [*] Starting VisionForge services...
echo ==========================================================

:: 1. Launch FastAPI Backend (Port 8000)
echo [1/2] Launching Backend Server on http://127.0.0.1:8000 ...
start "VisionForge - Backend (Port 8000)" cmd /k "%~dp0scripts\\run_backend.bat"

:: 2. Launch Vite Frontend (Port 5173)
echo [2/2] Launching Frontend Server on http://localhost:5173 ...
start "VisionForge - Frontend (Port 5173)" cmd /k "%~dp0scripts\\run_frontend.bat"

:: Open browser immediately while services initialize
echo.
echo [*] Opening browser on http://localhost:5173 ...
ping 127.0.0.1 -n 2 >nul
start http://localhost:5173

echo.
echo ==========================================================
echo   VisionForge is now RUNNING!
echo   - Frontend: http://localhost:5173
echo   - Backend:  http://127.0.0.1:8000
echo   - API Docs: http://127.0.0.1:8000/docs
echo.
echo   To STOP all services, run: stop.bat
echo ==========================================================
echo.
echo Press any key to close this launcher window (servers remain running)...
pause >nul
exit /b 0

:no_python
echo [ERROR] Python not found! Please run setup_env.bat first.
pause
exit /b 1

:no_node
echo [ERROR] Node.js / npm not found! Please install Node.js from https://nodejs.org
pause
exit /b 1
"""
    write_crlf(ROOT_DIR / "start.bat", start_bat_content)
    write_crlf(ROOT_DIR / "scripts" / "start.bat", start_bat_content)

    # stop.bat
    stop_bat_content = """@echo off
title VisionForge AI Studio - Stop Services

echo ==========================================================
echo   Stopping VisionForge Services...
echo ==========================================================
echo.

set KILLED=0

:: 1. Terminate Backend on Port 8000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    echo [*] Stopping Backend on Port 8000, PID: %%a
    taskkill /F /T /PID %%a >nul 2>&1
    set KILLED=1
)

:: 2. Terminate Frontend on Port 5173
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    echo [*] Stopping Frontend on Port 5173, PID: %%a
    taskkill /F /T /PID %%a >nul 2>&1
    set KILLED=1
)

:: 3. Close leftover VisionForge terminal windows
taskkill /FI "WINDOWTITLE eq VisionForge - Backend*" /F /T >nul 2>&1
taskkill /FI "WINDOWTITLE eq VisionForge - Frontend*" /F /T >nul 2>&1

echo.
if "%KILLED%"=="1" (
    echo [OK] All VisionForge services stopped successfully.
) else (
    echo [*] No running VisionForge services found.
)
echo ==========================================================
echo.
pause
"""
    write_crlf(ROOT_DIR / "stop.bat", stop_bat_content)

    # scripts/run_backend.bat
    run_backend_content = """@echo off
title VisionForge - Backend Server (Port 8000)

cd /d "%~dp0..\\"
set "PYTHONPATH=%cd%"

echo ==========================================================
echo   VisionForge - Backend Server
echo   Running on: http://127.0.0.1:8000
echo   API Docs:   http://127.0.0.1:8000/docs
echo ==========================================================
echo.

if exist "%~dp0..\\env_config.bat" (
    call "%~dp0..\\env_config.bat"
) else (
    if exist "D:\\condaenv\\cuda\\python.exe" (
        set "PY_CMD=D:\\condaenv\\cuda\\python.exe"
        set "CONDA_ENV_DIR=D:\\condaenv\\cuda"
        set "PATH=D:\\condaenv\\cuda;D:\\condaenv\\cuda\\Scripts;D:\\condaenv\\cuda\\Library\\bin;%PATH%"
    ) else (
        set "PY_CMD=python"
    )
)

echo [*] Using Python: %PY_CMD%
"%PY_CMD%" -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload --reload-dir backend/app

if errorlevel 1 (
    echo.
    echo [ERROR] Backend server stopped unexpectedly!
    pause
)
"""
    write_crlf(ROOT_DIR / "scripts" / "run_backend.bat", run_backend_content)

    print("\n" + "=" * 65)
    print(" [OK] VisionForge 一鍵環境安裝與配置完成！")
    print("      您現在可以隨時雙擊 start.bat 啟動，或雙擊 stop.bat 停止！")
    print("=" * 65)

if __name__ == "__main__":
    main()
