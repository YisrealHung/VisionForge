<div align="center">

# ⚡ VisionForge (視覺鍛造者)

### 本地 No-Code AI 影像模型訓練與獨立推論工作站
**「讓每個人都能鍛造屬於自己的專屬 AI 視覺模型」**

[![Python Version](https://img.shields.io/badge/Python-3.9%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109%2B-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0%2B-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![ONNX](https://img.shields.io/badge/ONNX-Runtime-005CED?style=for-the-badge&logo=onnx&logoColor=white)](https://onnx.ai/)
[![License](https://img.shields.io/badge/License-AGPL_3.0-blue?style=for-the-badge)](LICENSE)

[功能亮點](#-核心功能亮點) • [架構與模型](#-支援任務與模型體系) • [快速開始](#-快速開始) • [推論與部署](#-獨立推論工作站與-api-伺服器) • [開源授權](#-開源授權-license)

</div>

---

## 📖 專案簡介 (Introduction)

**VisionForge** 是一個專為設計師、工程師、研究人員及邊緣計算開發者打造的**本地化 No-Code AI 電腦視覺模型訓練與即時推論平台**。

透過直覺現代的圖形化介面，使用者無需編寫任何 Python 訓練腳本或超參數調整程式碼，即可在本地電腦上輕鬆完成**資料集管理、影像即時標註、GPU 加速訓練、Grad-CAM 特徵可解釋性分析、ONNX 模型匯出**，並直接在**獨立推論工作站**中進行即時影像識別與物聯網 (IoT) API 串接。

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│   🖼️ 批次圖片 ┐                                                                         │
│               ├─→ 🏷️ 互動標註 → 🧠 GPU 訓練 → 🔍 Grad-CAM 分析 → 📦 一鍵匯出 ONNX      │
│   📷 攝影機擷取┘                                                                         │
│                                                                                        │
│          ⚡ 全程本地運行 · 零程式碼門檻 · 隱私保密 · 支援獨立推論 API 工作站               │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ 核心功能亮點 (Key Features)

### 1. 📁 資料集與擷取管理 (Dataset & Smart Capture)
- **多來源匯入**：支援本地資料夾拖曳批次上傳（JPG、PNG、WEBP 等）。
- **Webcam 鏡頭即時採集**：直接在瀏覽器呼叫攝影機進行連拍或單張擷取，迅速建立現場樣本。
- **資料增強引擎 (Data Augmentation)**：一鍵啟用旋轉、縮放、色彩抖動（Color Jitter）、水平/垂直翻轉等資料擴增。
- **智慧資料集品質診斷**：自動偵測重複影像、過暗/過曝/模糊圖片，並提供類別平衡健康度報告。

### 2. 🏷️ 專業標註工作站 (Interactive Annotation Suite)
- **多任務標註支援**：支援影像分類標籤、物件偵測 Bounding Box 繪製、關注區域 (ROI) 裁剪與數值評分。
- **智慧色彩標籤系統**：自訂類別色票，標註邊框與推論預測標籤即時同步色彩。
- **自動化標籤記憶**：支援切換上下頁時自動保存與自動完成標註，大幅提升標記效率。

### 3. 🧠 現代模型訓練與即時監控 (Training & Live Monitoring)
- **豐富預設調優範本**：提供「⚡ 快速驗證 (Fast)」、「⚖️ 平衡推薦 (Balanced)」、「🎯 深度鍛造 (Deep)」三種超參數情境。
- **靈活超參數自由配置**：支援 Optimizer (AdamW, SGD, Adam, RMSprop)、Learning Rate、Batch Size，訓練 Epochs 支援 **1 ~ 500** 彈性調整。
- **WebSocket 實時曲線串流**：訓練過程即時繪製 Train/Val Loss 損失曲線與 Accuracy / mAP@0.5 評估指標。
- **早停機制 (Early Stopping)**：防止模型過擬合，自動保存驗證集表現最佳（`best.pt`）與最新（`last.pt`）權重。

### 4. 🔍 模型可解釋性分析 (Explainable AI - Grad-CAM)
- 內建 **Grad-CAM 熱力圖引擎**，視覺化呈現神經網路決策時的特徵焦點區域，協助工程師快速診斷模型盲點。

### 5. 📦 跨平台模型匯出 (ONNX Model Export)
- 一鍵將 PyTorch Checkpoint 模型匯出為跨平台 **ONNX** 格式。
- 支援 FP32 / FP16 半精度量化及動態輸入尺寸（Dynamic Axes），可直接部署於 OpenVINO、TensorRT、ONNX Runtime 等終端裝置。

### 6. 🚀 獨立推論工作站與 API 伺服器 (Standalone Inference Station)
- **Webcam 即時推論**：隨選切換歷史訓練模型，即時疊加預測標籤與 Softmax 機率長條圖。
- **ROI 關注區域裁剪**：支援劃定特定監控區域，僅針對感興趣視野進行高精度辨識。
- **智慧條件觸發規則引擎 (Trigger Rules)**：
  - 🎯 **出現警報**：偵測到特定類別（出現 ≥ 1）。
  - 📦 **數量達標**：偵測數量達到目標閾值（數量 ≥ N）。
  - 🚨 **缺失警報**：未偵測到指定物件（缺件 / 瑕疵檢查）。
- **多語言客戶端程式碼生成**：自動產生 Python、JavaScript (Node.js)、cURL、C# 串接範例。
- **多協定 API 伺服器**：內建 RESTful API (`POST /api/v1/predict`)、WebSocket 即時串流 (`/ws/inference`) 及 MQTT Broker 邊緣推播。

### 7. 🎨 人文溫潤雙主題 (Artisanal Dual Theme)
- 告別生硬刺眼的 AI 紫藍樣板風格，全面導入 **大地人文 5 色色票卡**：
  - 🌸 **暖夕珊瑚 (Warm Coral - `#EB7E83`)**：核心操作與重點焦點
  - 🍑 **陶土暖桃 (Terracotta Peach - `#E1998A`)**：輔助資訊與數值過渡
  - 🪵 **柔霧藕灰 (Dusty Mauve - `#B88F89`)**：邊框架構與細緻次級文字
  - 🌌 **煙燻岩紫 (Slate Plum - `#52495A`)**：暗色模式基底
  - 🌊 **海鼠尾草 (Ocean Sage Teal - `#557B86`)**：平衡對比指標
- **支援模式**：☀️ **溫潤燕麥亮色 (預設)** ✕ 🌙 **煙燻暖岩暗色**，支援頂部快捷按鈕與系統設定無縫切換。

---

## 🧩 支援任務與模型體系 (Supported Tasks & Models)

VisionForge 完整覆蓋現代電腦視覺四大主力任務：

| 任務類型 (Task) | 典型應用場景 | 內建模型架構 |
| :--- | :--- | :--- |
| 🖼️ **影像分類 (Classification)** | 瑕疵良品分級、物體類別辨識、醫學影像篩檢 | • **MobileNetV3-Small** (極速輕量)<br>• **ResNet-18** (經典穩定)<br>• **EfficientNet-B0** (高精度泛化)<br>• **ViT-Tiny** (Vision Transformer) |
| 🎯 **物件偵測 (Object Detection)** | 多目標定位、邊緣計數、安防監控、工件檢測 | • **YOLO26-N / S / M / L** (Ultralytics 端到端無 NMS 高速偵測器)<br>• **D-FINE-N / S / L** (官方 HGNetv2 骨幹 + FDR Transformer 解碼器)<br>• **SSDLite-MobileNetV3** (極致輕量邊緣端) |
| 📈 **特徵迴歸 (Regression)** | 品質分數評定、角度估計、溫度顏色測量、磨損程度評估 | • **ResNet-18**<br>• **MobileNetV3-Large**<br>• **EfficientNet-B0**<br>• **Swin Transformer-T** |
| 🔍 **特徵辨識 (Feature Analysis)** | 骨幹特徵萃取、多層特徵金字塔分析、深層表示學習 | • **ResNet-50 FPN**<br>• **HRNet-W18 / DenseNet-121**<br>• **Swin Transformer-Tiny**<br>• **ViT-Base-16** |

---

## 🚀 快速開始 (Quick Start)

### 1. 環境需求 (Prerequisites)
- **作業系統**：Windows 10 / 11、macOS 或 Linux
- **Python**：`Python 3.9+`（建議使用 Anaconda 或 venv 虛擬環境）
- **Node.js**：`Node.js 18+` 與 `npm`
- **算力裝置 (可選)**：NVIDIA GPU (支援 CUDA 11.8+ / 12.1+) 可享受數十倍訓練加速，亦完全支援純 CPU 模式運作。

---

### 2. 安裝步驟 (Installation)

```bash
# 1. 複製本儲存庫
git clone https://github.com/您的帳號/VisionForge.git
cd VisionForge

# 2. 安裝後端 Python 依賴
cd backend
pip install -r requirements.txt
cd ..

# 3. 安裝前端 Node.js 依賴
cd frontend
npm install
cd ..
```

---

### 3. 一鍵啟動 (One-Click Start)

#### 🪟 Windows 環境：
直接雙擊根目錄下的批次檔，或在終端機中執行：
```cmd
:: 一鍵啟動前後端服務並自動開啟瀏覽器
start.bat
```
*(PowerShell 使用者可執行 `.\start.ps1`)*

#### 🛑 一鍵停止服務：
```cmd
stop.bat
```

---

### 4. 手動分別啟動 (Manual Launch)

若您希望在不同終端機視窗中獨立除錯：

**終端機 1：啟動後端 FastAPI (Port 8000)**
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
- 後端服務位址：`http://127.0.0.1:8000`
- Swagger API 互動文件：`http://127.0.0.1:8000/docs`

**終端機 2：啟動前端 Vite Dev Server (Port 5173)**
```bash
cd frontend
npm run dev
```
- 前端管理介面：`http://localhost:5173`

---

## 📡 獨立推論工作站與 API 伺服器 (API Endpoints)

VisionForge 後端提供標準的 RESTful 與 WebSocket 介面，供外部物聯網設備、工業電腦或後端系統即時串接：

### 1. 影像推論 API (`POST /api/v1/predict`)
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/predict" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@test_image.jpg" \
     -F "project_id=proj_your_project_id" \
     -F "confidence_threshold=0.5"
```

**回傳範例 (JSON)**：
```json
{
  "project_id": "proj_your_project_id",
  "task_type": "classification",
  "model_architecture": "mobilenet_v3_small",
  "inference_time_ms": 14.2,
  "top_prediction": {
    "class_name": "Pass_良品",
    "confidence": 0.982
  },
  "predictions": [
    { "class_name": "Pass_良品", "confidence": 0.982 },
    { "class_name": "NG_瑕疵", "confidence": 0.018 }
  ]
}
```

### 2. WebSocket 實時串流推論 (`/ws/inference/{project_id}`)
- 支援以 Base64 或二進位串流傳輸影像幀，後端即時推播檢測結果與觸發警報事件。

---

## 📂 系統目錄結構 (Project Structure)

```
ai_trainer_app/
├── backend/                  # FastAPI 後端服務
│   ├── app/
│   │   ├── api/              # RESTful API 路由端點
│   │   │   ├── v1/           # Projects, Datasets, Annotations, Training, Inference, Export
│   │   ├── core/             # 設定檔 (config.py)、SQLite 資料庫連線
│   │   ├── db/               # 資料庫 Migration 與 Schema
│   │   ├── engines/          # 深度學習訓練引擎 (Classification, Detection, Regression)
│   │   ├── models/           # Pydantic 資料模型與驗證定義
│   │   └── services/         # 業務邏輯服務 (標註、資料增強、Grad-CAM、推論觸發等)
│   ├── data/                 # 本地資料存放庫 (已加入 .gitignore，不納入版本控制)
│   │   ├── projects/         # 專案目錄、原始圖集、標註 JSON、模型 Checkpoints
│   │   └── visionforge.db    # SQLite 本地資料庫檔案
│   ├── requirements.txt      # Python 依賴套件列表
│   └── run.py                # 後端啟動入口
├── frontend/                 # Vite + React 前端介面
│   ├── src/
│   │   ├── components/       # UI 元件 (標註畫布、圖表、模型選擇器、推論工作台)
│   │   ├── context/          # ProjectContext (專案狀態與外觀主題管理)
│   │   ├── services/         # 前端 API 客戶端封裝
│   │   ├── styles/           # 全域樣式與 5 色調色盤系統 (index.css)
│   │   ├── views/            # 各分頁視圖 (Dashboard, Dataset, Annotation, Train, Inference)
│   │   ├── App.tsx           # 主應用程式佈局
│   │   └── main.tsx          # 前端程式入口
│   ├── package.json          # Node.js 依賴設定
│   └── vite.config.ts        # Vite 建置配置
├── docs/                     # 系統設計文案與架構規格書
├── scripts/                  # 背景服務執行腳本
├── start.bat                 # Windows 一鍵啟動指令檔
├── start.ps1                 # PowerShell 啟動指令檔
├── stop.bat                  # 一鍵停止服務指令檔
└── .gitignore                # Git 忽略配置清單
```

---

## 🛡️ 資料隱私與安全性 (Data Privacy)

- **100% 本地運算**：所有的影像資料集、標註記錄、模型訓練權重與推論運算皆在您的本地電腦完成，**完全不會將任何資料或圖片上傳至任何雲端第三方伺服器**。
- **離線可用**：安裝完成後支援純離線內部網路 (Intranet) 運行，非常適用於高機密性工業產線、醫療研究與敏感個人專案。

---

## 🤝 參與貢獻 (Contributing)

歡迎提交 Issue 與 Pull Request！
1. Fork 本儲存庫
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交修改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送至分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

---

## 📄 開源授權 (License)

本專案採用 **[GNU Affero General Public License v3.0 (AGPL-3.0)](LICENSE)** 授權開源。

### 📌 第三方架構與依賴授權聲明 (Third-Party Licenses & Acknowledgements)
- **YOLO26 系列**：本專案之物件偵測引擎整合並支援 [Ultralytics](https://github.com/ultralytics/ultralytics) 系列架構。依據原作者 Ultralytics Inc. 之授權規範，遵循 **GNU AGPL-3.0** 授權條款開源（如需將 YOLO 用於閉源商業發行，請向 Ultralytics 取得商業授權）。
- **D-FINE 系列**：本專案支援之即時檢測器 [Peterande/D-FINE](https://github.com/Peterande/D-FINE)，遵循 **Apache-2.0 License** 授權釋出。
- **PyTorch & torchvision**：遵循 **BSD-style License**。
- **FastAPI**：遵循 **MIT License**。

<div align="center">
  <sub>Forged with ❤️ by VisionForge Open Source Team</sub>
</div>
