# VisionForge — Windows 部署與 GPU 加速指南

本文件提供 **VisionForge (本地 No-Code AI 影像模型訓練與推論平台)** 在 **Windows 10 / 11 (64-bit)** 環境下的完整部署教學。無論您的電腦具備 **NVIDIA 獨立顯示卡 (GPU 加速)** 或僅使用 **純 CPU 模式**，皆能依照本篇步驟順利完成安裝與運行。

---

## 📋 目錄
1. [硬體與系統環境需求](#1-硬體與系統環境需求)
2. [若設備具備 NVIDIA GPU：GPU 驅動與 CUDA 加速環境安裝](#2-若設備具備-nvidia-gpu-gpu-驅動與-cuda-加速環境安裝)
3. [基礎軟體環境安裝 (Python & Node.js)](#3-基礎軟體環境安裝-python--nodejs)
4. [專案下載與 Python 虛擬環境配置](#4-專案下載與-python-虛擬環境配置)
5. [安裝 Python 後端依賴套件](#5-安裝-python-後端依賴套件)
6. [安裝前端依賴套件](#6-安裝前端依賴套件)
7. [啟動 VisionForge 平台](#7-啟動-visionforge-平台)
8. [驗證 GPU 運算狀態](#8-驗證-gpu-運算狀態)
9. [常見問題與疑難排解 (Troubleshooting)](#9-常見問題與疑難排解-troubleshooting)

---

## 1. 硬體與系統環境需求

| 項目 | 最低需求 (純 CPU 模式) | 建議需求 (GPU 加速訓練) |
| :--- | :--- | :--- |
| **作業系統** | Windows 10 64-bit (21H2+) / Windows 11 | Windows 10 / 11 64-bit (最新版本) |
| **處理器 (CPU)** | Intel Core i5 / AMD Ryzen 5 (4 核心以上) | Intel Core i7 / AMD Ryzen 7 以上 |
| **系統記憶體 (RAM)** | 8 GB RAM | 16 GB ~ 32 GB RAM 以上 |
| **顯示卡 (GPU)** | 無需獨立顯示卡 (CPU 推論) | **NVIDIA RTX 20/30/40 系列 (建議 VRAM ≥ 6GB)** |
| **硬碟空間** | 10 GB 以上可用空間 | 30 GB 以上可用空間 (建議 SSD) |
| **網路相機 (選配)** | USB 視訊鏡頭 (UVC 相容) | USB 視訊鏡頭 / 工業相機 |

---

## 2. 若設備具備 NVIDIA GPU：GPU 驅動與 CUDA 加速環境安裝

如果您的電腦配備了 NVIDIA 獨立顯示卡，請依照下列順序安裝以獲得極致的模型訓練與推論加速：

### 步驟 2.1：安裝最新 NVIDIA 顯示卡驅動程式
1. 前往 [NVIDIA 驅動程式下載官網](https://www.nvidia.com/Download/index.aspx)。
2. 選擇您的顯示卡型號（例如：*GeForce RTX 4060 / 3070*），作業系統選擇 **Windows 10/11 64-bit**。
3. 下載並安裝 **Game Ready** 或 **Studio** 驅動程式。
4. 安裝完成後，開啟命令提示字元 (cmd) 或 PowerShell，輸入以下指令驗證：
   ```cmd
   nvidia-smi
   ```
   > 💡 確認輸出視窗右上角顯示支援的 **CUDA Version: 12.x**。

---

### 步驟 2.2：安裝 CUDA Toolkit (推薦 CUDA 12.1 或 11.8)
1. 前往 [NVIDIA CUDA Toolkit Archive](https://developer.nvidia.com/cuda-toolkit-archive)。
2. **推薦選擇版本**：**CUDA Toolkit 12.1** (相容性最廣，PyTorch 官方首選)。
3. 下載 Windows Installer (exe local) 並執行安裝，選擇「精簡 (建議)」安裝即可。
4. 安裝完成後驗證：
   ```cmd
   nvcc -V
   ```

---

### 步驟 2.3：安裝 cuDNN (深度神經網路加速庫 - 選配但強烈建議)
1. 前往 [NVIDIA cuDNN 下載頁面](https://developer.nvidia.com/cudnn) (需免費登入 NVIDIA 開發者帳號)。
2. 下載與 CUDA 12.x 相容的 cuDNN 壓縮包 (例如 cuDNN v8.9.x for CUDA 12.x)。
3. 解壓縮後，將裡面的 `bin`、`include`、`lib` 資料夾內的檔案複製至 CUDA 安裝目錄：
   - 預設路徑通常為：`C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.1\`。

---

## 3. 基礎軟體環境安裝 (Python & Node.js)

### 步驟 3.1：安裝 Python 3.10 或 3.11
1. 前往 [Python 官方下載頁面](https://www.python.org/downloads/) 下載 **Python 3.10.x** 或 **3.11.x** (建議 3.10.11 或 3.11.8)。
2. ⚠️ **關鍵步驟**：安裝啟動畫面中，**務必勾選「Add python.exe to PATH」**，然後點擊「Install Now」。
3. 開啟終端機確認版本：
   ```cmd
   python --version
   pip --version
   ```

### 步驟 3.2：安裝 Node.js (前端運行環境)
1. 前往 [Node.js 官方網站](https://nodejs.org/) 下載 **LTS 長期支援版本** (建議 Node.js 18.x 或 20.x)。
2. 依照安裝精靈全部點選下一步完成安裝。
3. 開啟終端機確認版本：
   ```cmd
   node -v
   npm -v
   ```

---

## 4. 專案下載與 Python 虛擬環境配置

### 步驟 4.1：取得專案代碼
若使用 Git：
```cmd
git clone https://github.com/your-username/VisionForge.git
cd VisionForge
```
*(若直接下載 ZIP 壓縮包，請解壓縮至無中文與空格的路徑，例如 `C:\Projects\VisionForge`)*

### 步驟 4.2：建立與啟用虛擬環境 (強烈建議)
```cmd
:: 建立虛擬環境
python -m venv venv

:: 啟用虛擬環境 (命令提示字元 cmd)
venv\Scripts\activate.bat

:: 若使用 PowerShell，請執行：
:: .\venv\Scripts\Activate.ps1
```

---

## 5. 安裝 Python 後端依賴套件

### 步驟 5.1：升級 pip 工具
```cmd
python -m pip install --upgrade pip
```

### 步驟 5.2：安裝基礎後端 API 套件
```cmd
python scripts/safe_pip.py -r backend/requirements.txt
```
> `safe_pip.py` 會鎖定環境中已安裝的 torch / torchvision / numpy / OpenCV / onnxruntime 版本，重複執行也不會把 CUDA 版 PyTorch 換掉。

---

### 步驟 5.3：安裝深度學習框架與 AI 訓練引擎

#### 🅰️ 【具備 NVIDIA GPU (CUDA 12.1 加速)】—— 強烈推薦
執行以下指令安裝支援 CUDA 12.1 的 PyTorch：
```cmd
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

#### 🅱️ 【具備 NVIDIA GPU (舊款顯示卡 / CUDA 11.8 加速)】
若您的顯卡驅動僅支援 CUDA 11.8：
```cmd
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

#### 🅲 【無獨立顯卡 (純 CPU 模式)】
```cmd
pip install torch torchvision torchaudio
```

---

### 步驟 5.4：安裝影像處理、模型導出與演算法依賴套件
```cmd
pip install ultralytics opencv-python pillow numpy scipy pyyaml onnx onnxruntime
```
> 💡 *若具備 GPU，建議將 `onnxruntime` 改裝為 `onnxruntime-gpu`：*
> ```cmd
> pip uninstall -y onnxruntime
> pip install onnxruntime-gpu
> ```

---

## 6. 安裝前端依賴套件

開啟終端機進入 `frontend` 目錄：
```cmd
cd frontend
npm install
cd ..
```

---

## 7. 啟動 VisionForge 平台

### 方式一：使用一鍵啟動腳本 (最簡單)
在專案根目錄下，直接雙擊：
- **`start.bat`** (Windows 批次檔) 或
- 右鍵點擊 **`start.ps1`** 選擇「用 PowerShell 執行」。

腳本將會自動：
1. 啟動後端 FastAPI 服務 (Port 8000)
2. 啟動前端 Vite 開發伺服器 (Port 5173 / 5174)
3. 自動開啟預設瀏覽器進入 VisionForge 介面！

---

### 方式二：手動終端機分開啟動

**【視窗 1：啟動後端 API】**
```cmd
cd VisionForge
venv\Scripts\activate.bat
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

**【視窗 2：啟動前端介面】**
```cmd
cd VisionForge\frontend
npm run dev
```

開啟瀏覽器前往：`http://localhost:5173`

---

## 8. 驗證 GPU 運算狀態

進入 VisionForge 系統後：
1. 查看右上角或「系統設定」頁面：
   - 若顯示 **🟢 支援 CUDA 加速** 與顯卡型號（例如：`NVIDIA GeForce RTX 4060`），代表 GPU 已成功啟用！
2. 您也可以在 Python 中手動驗證：
   ```cmd
   python -c "import torch; print('CUDA 是否可用:', torch.cuda.is_available()); print('GPU 型號:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'N/A')"
   ```

---

## 9. 常見問題與疑難排解 (Troubleshooting)

### Q1: 執行 `start.ps1` 時出現「在此系統上已停用指令碼執行」？
- **原因**：Windows PowerShell 預設執行原則安全性限制。
- **解決方法**：以系統管理員身分開啟 PowerShell，執行以下指令：
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```

### Q2: 訓練時出現 `CUDA out of memory` (記憶體不足)？
- **解決方法**：
  1. 在模型配置頁面將 **批次大小 (Batch Size)** 調降（例如從 16 調至 8 或 4）。
  2. 將 **影像輸入尺寸 (Image Size)** 調小（例如從 640 調至 416 或 320）。
  3. 關閉其他佔用 VRAM 的應用程式（如 3D 遊戲或大型建模軟體）。

### Q3: 影像標註工具無法開啟 Web 相機？
- **解決方法**：
  1. 確認 Windows「設定」>「隱私權與安全性」>「相機」中，「允許應用程式存取相機」已開啟。
  2. 確認沒有其他視訊軟體（LINE、Teams、OBS）獨佔相機裝置。

### Q4: 通訊埠 (Port 8000 / 5173) 被佔用？
- **解決方法**：執行專案根目錄下的 `stop.bat` 釋放所有相關背景進程，或重啟終端機。
