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

[功能亮點](#-核心功能亮點) • [12 款風格主題](#-12-款三色特調風格主題) • [模型體系](#-支援任務與模型體系) • [快速開始](#-快速開始) • [推論與部署](#-獨立推論工作站與-api-伺服器) • [未來演進計畫](#-未來演進計畫無狀態算力節點架構) • [開源授權](#-開源授權-license)

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
- **多協定 API 伺服器**：內建 RESTful API (`POST /api/v1/inference/predict`)、WebSocket 即時串流 (`/ws/inference`) 及批次預測介面。

### 7. 🎨 12 款三色特調風格主題 (12-Theme Color Architecture)
VisionForge 捨棄傳統單一死板的主題樣式，全面由 **12 組經典三色調色盤** 精心建構，完美涵蓋 **6 款柔雅淺色** 與 **6 款深邃暗夜**，每款主題均支援三主色之間的線性漸層 (`linear-gradient`)、環境氛圍光暈 (`--ambient-glow`) 與高對比度易讀文字：

| # | 主題名稱 | 模式 | 官方指定 3 色調色盤 | 風格氛圍與漸層設計 |
|:---:|:---|:---:|:---|:---|
| **1** | **香草冰藍** (*Vanilla Mist*) | ☀️ 淺色 | `[#FFFFFF, #FFF2C9, #CBD7EF]` | 純白基底揉合暖香奶油與晨曦冰霧藍，澄淨溫潤、長時間專注不疲勞 |
| **2** | **嫩綠丁香** (*Pistachio Lilac*) | ☀️ 淺色 | `[#FFFFFF, #EBFFC9, #E2CBFE]` | 青檸開心果嫩芽搭配夢幻丁香紫，清新活潑且富自然藝術氣息 |
| **3** | **晴空落櫻** (*Sky Blossom*) 🌟 | ☀️ 淺色 **(系統預設)** | `[#FFFFFF, #C9E0FF, #FECBCC]` | **蔚藍晴空映襯嬌嫩粉櫻，經典雙色柔和調，空氣感十足、高雅透亮** |
| **4** | **薄荷櫻雪** (*Mint Sakura*) | ☀️ 淺色 | `[#FFFFFF, #C9FFF2, #FECBCC]` | 清涼冰薄荷海風與蜜桃櫻花漸層，如同初夏微風，清爽舒適 |
| **5** | **初春長春花** (*Spring Periwinkle*) | ☀️ 淺色 | `[#FFFFFF, #E0FFC9, #CBD7FE]` | 初春露水嫩綠與靜謐長春花藍紫，淡雅理性且富生機 |
| **6** | **糖霜青晶** (*Bubblegum Cyan*) | ☀️ 淺色 | `[#FFFFFF, #FFC9ED, #C8FCFE]` | 甜心糖霜粉與晶瑩冰晶水藍，洋溢現代科技感與輕奢美學 |
| **7** | **星夜靛藍** (*Indigo Starlight*) | 🌙 深色 | `[#FFCEE3, #678EC9, #262277]` | 深邃靛藍極夜為底，鋼藍為階，星河櫻粉為點睛高光，沉穩優雅 |
| **8** | **暮光極夜** (*Amber Abyss*) | 🌙 深色 | `[#FFE28D, #FAC1A8, #13193D]` | 深海夜幕基底，融合暮光暖金與蜜桃珊瑚光暈，奢華典雅 |
| **9** | **湖水青櫻** (*Lagoon Bloom*) | 🌙 深色 | `[#F9D2E4, #67C9B5, #007E79]` | 幽深松綠碧潭為底，浮水青翠薄荷與幽雅荷粉漸層相映 |
| **10** | **電光極光** (*Cyber Pulse*) | 🌙 深色 | `[#FF128D, #21A7CF, #D4FEFA]` | 矩陣電光洋紅與賽博青藍，高對比度極致未來科技衝擊感 |
| **11** | **幽林蘭影** (*Forest Orchid*) | 🌙 深色 | `[#FEDFCB, #106816, #FCC2EB]` | 深林墨翠底蘊，映襯杏桃絲綢與蘭花粉紫，自然尊榮且極致護眼 |
| **12** | **幻紫夜魅** (*Royal Amethyst*) | 🌙 深色 | `[#FEDFCB, #391A77, #FCC2EB]` | 皇家宇宙深紫為底，搭配紫晶星雲與溫潤蜜桃光澤，神秘尊貴 |

- **即時切換與個人化儲存**：可透過頂部 Header 快捷下拉選單或進入「⚙️ 系統設定」依深淺分頁切換，偏好設定自動儲存於瀏覽器 LocalStorage。

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

# 2. 安裝後端 Python 依賴（safe_pip 會鎖定已安裝的 torch / numpy 等版本，避免被升級破壞）
python scripts/safe_pip.py -r backend/requirements.txt

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

#### 🐧 Linux / NVIDIA Jetson Orin 環境：
```bash
chmod +x start.sh
./start.sh
```

#### 🛑 一鍵停止服務 (Windows)：
```cmd
stop.bat
```

---

### 📖 平台專屬部署手冊 (Deployment Guides)

針對不同作業系統與邊緣硬體平台，請參閱詳細的步驟指南與 GPU/CUDA 安裝說明：

- 🪟 **[Windows 部署與 GPU 加速指南 (docs/DEPLOYMENT_WINDOWS.md)](docs/DEPLOYMENT_WINDOWS.md)**：包含 Windows 10/11 系統需求、NVIDIA GPU 驅動、CUDA 12.1、cuDNN 安裝、CPU 模式與常見問題排解。
- 🐧 **[Linux (ARM64 / NVIDIA Jetson Orin) 部署指南 (docs/DEPLOYMENT_JETSON_ORIN.md)](docs/DEPLOYMENT_JETSON_ORIN.md)**：專為 Jetson Orin Nano / Orin NX / AGX Orin 打造，包含 JetPack 6/5.1 配置、NVIDIA 官方 PyTorch for Jetson、Torchvision 編譯、TensorRT、CSI 相機與 systemd 開機自啟動服務設定。

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

VisionForge 後端提供標準的 RESTful 與批次預測介面，供外部物聯網設備、工業電腦或後端系統即時串接：

### 1. 影像推論 API (`POST /api/v1/inference/predict`)
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/inference/predict" \
     -H "Content-Type: application/json" \
     -d '{
       "model_id": "proj_defect_inspection",
       "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
       "confidence_threshold": 0.5
     }'
```

**回傳範例 (JSON)**：
```json
{
  "model_id": "proj_defect_inspection",
  "task_type": "detection",
  "architecture": "yolo26_s",
  "inference_time_ms": 13.8,
  "predictions": [
    {
      "label": "scratch_刮痕",
      "confidence": 98.2,
      "bbox": [0.32, 0.45, 0.18, 0.09]
    }
  ],
  "trigger_matched": true,
  "triggered_events": [
    {
      "rule_id": "rule_1",
      "rule_name": "重大刮痕警報",
      "message": "偵測到 scratch_刮痕 (98.2%)，已觸發自動警報",
      "timestamp": "2026-08-24T14:30:00.000Z"
    }
  ]
}
```

---

## 🔮 未來演進計畫：無狀態算力節點架構 (Stateless AI Compute Node)

為滿足未來跨工廠、跨部門之**極致隱私保護**與**高併發彈性擴展**需求，VisionForge 規劃在未來架構演進中導入 **「方案 2：無狀態算力節點架構 (Stateless AI Compute Node Architecture)」**：

```
                    ┌──────────────────────────────────────────────────────────┐
                    │               ⚖️ Nginx / 負載平衡器 (Load Balancer)        │
                    └─────────────────────────────┬────────────────────────────┘
                                                  │ (純記憶體傳輸，零磁碟 I/O)
                    ┌─────────────────────────────┴────────────────────────────┐
                    ▼                                                          ▼
    ┌───────────────────────────────┐                          ┌───────────────────────────────┐
    │ 🖥️ 無狀態算力節點 A1 (GPU 1)   │                          │ 🖥️ 無狀態算力節點 A2 (GPU 2)   │
    │  • VRAM 模型快取 (In-Memory)  │                          │  • VRAM 模型快取 (In-Memory)  │
    │  • 零硬碟寫入 (Zero-Disk I/O) │                          │  • 零硬碟寫入 (Zero-Disk I/O) │
    │  • 算完即釋放 (Instant GC)    │                          │  • 算完即釋放 (Instant GC)    │
    └───────────────────────────────┘                          └───────────────────────────────┘
```

### 🌟 架構核心特點：

1. **共享硬體算力，隔離用戶數據 (Shared Compute, Isolated Data)**
   - **算力主機零數據殘留**：伺服器硬碟不儲存任何客戶端的照片、標註資訊或專案資料。
   - **客戶端私有保存**：所有樣本照片與資料集完整保留於各客戶端電腦（B、C、D）本機，徹底杜絕主機端資料外洩風險。

2. **全內存管線運算 (In-Memory Zero-Disk I/O Pipeline)**
   - 影像串流經由 HTTP/WebSocket 進入伺服器 RAM 後，直接轉為 Tensor 載入 GPU 顯存運算，輸出 JSON 後**立即垃圾回收釋放**。
   - 消除磁碟 I/O 瓶頸，單幀推論延遲降低至 10~15ms，伺服器永遠不會有硬碟爆滿的維護負擔。

3. **支援多客戶端高併發與多伺服器水平擴展 (Horizontal Scalability)**
   - **多對一併發**：單台 GPU 伺服器支援數十台產線設備或相機同時呼叫推論 API。
   - **多對多叢集**：透過前端搭配 Nginx 負載平衡器，可隨意橫向新增 GPU 伺服器節點（A1, A2, A3...），實現企業級高可用性 (High Availability)。

4. **攜帶型模型推論 (Bring-Your-Own-Model & Data)**
   - 支援客戶端在請求中動態攜帶輕量化模型權重與圖片，算力節點臨時加載、運算完畢即刻銷毀，提供軍工級與跨企業租賃等級的隱私隔離。

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
│   │   ├── context/          # ProjectContext (專案狀態與 12 款主題風格管理)
│   │   ├── services/         # 前端 API 客戶端封裝
│   │   ├── styles/           # 全域樣式與 12 款三色調色盤系統 (index.css)
│   │   ├── views/            # 各分頁視圖 (Dashboard, Dataset, Annotation, Train, Inference, Settings)
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
