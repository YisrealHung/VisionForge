# VisionForge — Linux (ARM64 / NVIDIA Jetson Orin) 部署與 GPU 加速指南

本文件提供 **VisionForge (本地 No-Code AI 影像模型訓練與推論平台)** 在 **Linux ARM64 架構**（以 **NVIDIA Jetson Orin 系列：Orin Nano / Orin NX / AGX Orin** 為主）環境下的完整部署教學。

---

## 📋 目錄
1. [Jetson Orin 平台特性與系統需求](#1-jetson-orin-平台特性與系統需求)
2. [系統準備與電源模式調優](#2-系統準備與電源模式調優)
3. [基礎系統套件與 Node.js (ARM64) 安裝](#3-基礎系統套件與-nodejs-arm64-安裝)
4. [【核心關鍵】安裝 Jetson 專用 GPU 加速環境 (CUDA / PyTorch / Torchvision / TensorRT)](#4-核心關鍵安裝-jetson-專用-gpu-加速環境-cuda--pytorch--torchvision--tensorrt)
5. [專案代碼下載與後端依賴安裝](#5-專案代碼下載與後端依賴安裝)
6. [前端專案編譯 (生產構建最佳化)](#6-前端專案編譯-生產構建最佳化)
7. [相機設定 (CSI 相機與 USB 鏡頭)](#7-相機設定-csi-相機與-usb-鏡頭)
8. [啟動 VisionForge (含一鍵啟動腳本)](#8-啟動-visionforge-含一鍵啟動腳本)
9. [設定 Linux 開機自動啟動 (systemd)](#9-設定-linux-開機自動啟動-systemd)
10. [常見問題與疑難排解 (Troubleshooting)](#10-常見問題與疑難排解-troubleshooting)

---

## 1. Jetson Orin 平台特性與系統需求

### 平台特性
- **CPU 架構**：ARM64 (aarch64) 多核心 Cortex-A78AE。
- **GPU 架構**：NVIDIA Ampere 架構 (含 Tensor Core 加速)。
- **統一記憶體架構 (UMA)**：CPU 與 GPU 共享同一組 LPDDR5 記憶體。

### 支援之硬體設備
- **NVIDIA Jetson Orin Nano** (4GB / 8GB)
- **NVIDIA Jetson Orin NX** (8GB / 16GB)
- **NVIDIA Jetson AGX Orin** (32GB / 64GB)

### 推薦軟體版本
- **NVIDIA JetPack**：
  - **JetPack 6.x** (Ubuntu 22.04 LTS, Linux Kernel 5.15, CUDA 12.2, Python 3.10) —— **⭐ 強烈推薦**
  - **JetPack 5.1.x** (Ubuntu 20.04 LTS, Linux Kernel 5.10, CUDA 11.4, Python 3.8)
- **儲存空間**：強烈建議安裝 **NVMe M.2 SSD (128GB 以上)** 並設置為開機磁碟，避免 eMMC 或 MicroSD 卡讀寫速度成為訓練瓶頸。

---

## 2. 系統準備與電源模式調優

### 步驟 2.1：設定 Jetson 為最大效能模式
在 Jetson 終端機執行以下指令，解鎖完整硬體算力與風扇散熱：
```bash
# 查詢可用電源模式
sudo nvpmodel -p --verbose

# 切換為最大算力模式 (MAXN)
sudo nvpmodel -m 0

# 將 CPU/GPU 時脈鎖定在最高頻率
sudo jetson_clocks
```

### 步驟 2.2：設定虛擬記憶體交換空間 (Swap) —— 🚨 防止訓練時 OOM 必做
由於邊緣端訓練模型時記憶體消耗較大，建議建立 8GB ~ 16GB 的 Swap 檔：
```bash
# 建立 8GB 交換檔 (若有 16GB SSD 空間可改 count=16)
sudo fallocate -l 8G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 設定開機自動載入
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 步驟 2.3：安裝 jetson-stats (jtop 效能監控工具)
```bash
sudo apt-get update
sudo apt-get install -y python3-pip
sudo pip3 install jetson-stats

# 啟動 jtop 監控畫面 (隨時可按 q 退出)
jtop
```

---

## 3. 基礎系統套件與 Node.js (ARM64) 安裝

### 步驟 3.1：安裝 Linux 編譯工具與多媒體依賴庫
```bash
sudo apt-get update
sudo apt-get install -y \
    build-essential \
    cmake \
    git \
    curl \
    pkg-config \
    libopenblas-dev \
    libopenmpi-dev \
    libomp-dev \
    libjpeg-dev \
    zlib1g-dev \
    libv4l-dev \
    v4l-utils \
    libcanberra-gtk-module \
    libcanberra-gtk3-module \
    python3-dev \
    python3-pip \
    python3-venv
```

### 步驟 3.2：安裝 Node.js 20 LTS (ARM64 架構)
使用 NodeSource 官方腳本安裝適合 aarch64 的 Node.js：
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 驗證版本
node -v
npm -v
```

---

## 4. 【核心關鍵】安裝 Jetson 專用 GPU 加速環境 (CUDA / PyTorch / Torchvision / TensorRT)

> ⚠️ **極其重要觀念**：
> **絕對不能直接使用 `pip install torch`**！PyPI 官方的 PyTorch wheel 未包含 Jetson aarch64 的 CUDA 加速。
> **必須安裝 NVIDIA 官方專門為 Jetson 編譯的 PyTorch Wheel**。

### 步驟 4.1：確認 JetPack 版本
```bash
cat /etc/nv_tegra_release
# 或使用 jtop 查看軟體資訊頁 (按鍵盤 7)
```

---

### 步驟 4.2：安裝 PyTorch for Jetson (請依您的 JetPack 版本擇一)

#### 🅰️ 若使用 JetPack 6.x (Ubuntu 22.04 / Python 3.10 / CUDA 12.2) —— 推薦
```bash
# 1. 下載 NVIDIA 官方 PyTorch v2.3.0 Wheel for JetPack 6
wget https://nvidia.box.com/shared/static/5k2c2v2s62j6u41s3m0t8v7y4z0j0t1x.whl -O torch-2.3.0a0+ebed944.nv24.03-cp310-cp310-linux_aarch64.whl

# 2. 安裝先決套件
sudo apt-get install -y libopenblas-base libopenmpi-dev
pip3 install Cython numpy

# 3. 安裝 PyTorch
pip3 install torch-2.3.0a0+ebed944.nv24.03-cp310-cp310-linux_aarch64.whl
```

#### 🅱️ 若使用 JetPack 5.1.x (Ubuntu 20.04 / Python 3.8 / CUDA 11.4)
```bash
# 1. 下載 NVIDIA 官方 PyTorch v2.1.0 Wheel for JetPack 5.1
wget https://developer.download.nvidia.com/compute/redist/jp/v512/pytorch/torch-2.1.0a0+41361538.nv23.06-cp38-cp38-linux_aarch64.whl -O torch-2.1.0-cp38-linux_aarch64.whl

# 2. 安裝 PyTorch
pip3 install torch-2.1.0-cp38-linux_aarch64.whl
```

---

### 步驟 4.3：從原始碼編譯並安裝 Torchvision
Torchvision 必須與 PyTorch 版本精確對應：

```bash
# 安裝前置依賴
sudo apt-get install -y libjpeg-dev zlib1g-dev libavcodec-dev libavformat-dev libswscale-dev

# 下載相應版本原始碼 (若 PyTorch 2.3 則用 v0.18.0；若 PyTorch 2.1 則用 v0.16.0)
git clone --branch v0.18.0 https://github.com/pytorch/vision torchvision
cd torchvision
export BUILD_VERSION=0.18.0

# 編譯並安裝 (在 Orin 上約需 3~5 分鐘)
python3 setup.py install --user
cd ..
```

---

### 步驟 4.4：驗證 Jetson GPU 加速與 TensorRT
在終端機中執行以下檢查：
```bash
python3 -c "
import torch
print('PyTorch 版本:', torch.__version__)
print('CUDA 是否可用:', torch.cuda.is_available())
print('裝置數量:', torch.cuda.device_count())
if torch.cuda.is_available():
    print('目前 GPU 型號:', torch.cuda.get_device_name(0))
"
```
> ✅ **預期輸出**：`CUDA 是否可用: True`，且型號顯示 `Orin`。

---

## 5. 專案代碼下載與後端依賴安裝

### 步驟 5.1：Clone 專案庫
```bash
git clone https://github.com/your-username/VisionForge.git
cd VisionForge
```

### 步驟 5.2：安裝後端 API 與邊緣演算法套件
```bash
# 升級 pip
python3 -m pip install --upgrade pip

# 安裝 FastAPI 後端基礎套件（透過 safe_pip：自動鎖定已安裝的 torch / torchvision / numpy / OpenCV / onnxruntime 版本）
python3 scripts/safe_pip.py -r backend/requirements.txt

# 安裝 Ultralytics YOLO（Jetson 上不會額外拉入 opencv-python 覆蓋 JetPack 內建 OpenCV）
python3 scripts/safe_pip.py ultralytics
```

> ⚠️ **請勿直接執行 `pip3 install -r backend/requirements.txt`**：pip 可能為了滿足新版 scipy / onnx 而把 numpy 升級到 2.x，
> 導致 NVIDIA 提供的 PyTorch wheel 無法載入。`safe_pip.py` 會以 constraints 檔鎖住既有版本；若新套件與之衝突，
> 安裝會直接失敗並保留原環境，而不是默默升級。`./setup_env.sh` 也使用同一套機制，可以安心重複執行。

### 步驟 5.3：安裝支援 GStreamer 的 OpenCV (針對相機影像串流)
JetPack 通常已預載支援硬體解碼的 OpenCV，若需額外安裝請執行：
```bash
sudo apt-get install -y python3-opencv
```

---

## 6. 前端專案編譯 (生產構建最佳化)

在邊緣端裝置（如 Jetson Orin），**強烈建議將前端預先編譯為靜態 HTML/JS/CSS**，直接由後端 FastAPI 託管，這樣可以節省 300MB+ 的 Node.js 執行階段記憶體：

```bash
cd frontend
npm install
npm run build
cd ..
```
編譯完成後，靜態檔案將輸出至 `frontend/dist/` 目錄。

---

## 7. 相機設定 (CSI 相機與 USB 鏡頭)

### 步驟 7.1：設定使用者裝置存取權限
將當前使用者加入 `video` 與 `dialout` 群組：
```bash
sudo usermod -aG video,dialout $USER
```

### 步驟 7.2：檢查相機節點
```bash
# 列出系統所有相機節點
v4l2-ctl --list-devices
```
- **USB 視訊鏡頭**：通常為 `/dev/video0`。
- **MIPI CSI 相機** (如 IMX219 / IMX477)：可透過 GStreamer pipeline 或 v4l2 節點讀取。

---

## 8. 啟動 VisionForge (含一鍵啟動腳本)

### 方式一：使用 Jetson 一鍵啟動腳本 (推薦)
我們在專案中提供了專為 Linux / Jetson 設計的啟動腳本：

1. 賦予執行權限：
   ```bash
   chmod +x scripts/start_jetson.sh
   ```
2. 啟動服務：
   ```bash
   ./scripts/start_jetson.sh
   ```

---

### 方式二：手動啟動服務
在專案根目錄下執行：
```bash
python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```
> 💡 `--host 0.0.0.0` 允許您從區域網路內的其他電腦（例如 Windows 筆電或平板）直接存取 Jetson 的 Web 介面：
> - **本機瀏覽器**：`http://localhost:8000` 或 `http://localhost:5173`
> - **遠端電腦瀏覽器**：`http://<Jetson-IP-位址>:8000`

---

## 9. 設定 Linux 開機自動啟動 (systemd)

若欲將 VisionForge 作為工業現場邊緣設備（開機即自動上線提供推論服務）：

### 步驟 9.1：建立 systemd 服務單元
```bash
sudo nano /etc/systemd/system/visionforge.service
```

貼入以下設定內容（請將 `/home/jetson/VisionForge` 替換為您的實際路徑）：
```ini
[Unit]
Description=VisionForge AI Vision Platform Service
After=network.target

[Service]
Type=simple
User=jetson
WorkingDirectory=/home/jetson/VisionForge
ExecStart=/usr/bin/python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
```

### 步驟 9.2：啟用並啟動服務
```bash
sudo systemctl daemon-reload
sudo systemctl enable visionforge.service
sudo systemctl start visionforge.service

# 檢查運行狀態
sudo systemctl status visionforge.service
```

---

## 10. 常見問題與疑難排解 (Troubleshooting)

### Q1: 訓練 YOLO 或自訂模型時出現 `Killed` 或系統卡死？
- **原因**：Unified Memory 統一記憶體被佔滿導致 Linux OOM Killer 觸發。
- **解決方法**：
  1. 依照 [步驟 2.2](#步驟-22設定虛擬記憶體交換空間-swap---防止訓練時-oom-必做) 確保已開啟 **8GB ~ 16GB Swap**。
  2. 在 VisionForge 介面將 **Batch Size** 調小（建議 Jetson 設為 `4` 或 `8`）。
  3. 選擇輕量級模型架構（如 `SSDLite MobileNetV3`、`YOLO11n` 或 `MobileNetV4`）。

### Q2: `import torch` 出現 `OSError: libcurand.so.10: cannot open shared object file`？
- **原因**：CUDA 環境變數未加入至系統 PATH。
- **解決方法**：將 CUDA 路徑加入 `~/.bashrc`：
  ```bash
  echo 'export PATH=/usr/local/cuda/bin:$PATH' >> ~/.bashrc
  echo 'export LD_LIBRARY_PATH=/usr/local/cuda/lib64:$LD_LIBRARY_PATH' >> ~/.bashrc
  source ~/.bashrc
  ```

### Q3: CSI 相機畫面全黑或無法讀取？
- **解決方法**：測試 Jetson GStreamer 是否正常運作：
  ```bash
  gst-launch-1.0 nvarguscamerasrc ! nvvidconv ! video/x-raw(memory:NVMM) ! nvoverlaysink
  ```
  若仍無法讀取，可執行 `sudo systemctl restart nvargus-daemon` 重啟相機守護進程。

### Q4: 如何在 Jetson 上達到最高的推論幀率 (FPS)？
- **建議**：
  1. 使用 VisionForge 的「模型管理與匯出」功能，一鍵將 PyTorch 模型匯出為 **ONNX 模型**。
  2. 搭配 Jetson 內建的 **TensorRT** 進行 FP16 / INT8 量化推論，速度可提升 3~5 倍！
