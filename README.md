<div align="center">

# ⚡ VisionForge

### 本地 No-Code AI 影像模型訓練與推論工作站

**上傳影像 → 標註 → 訓練 → 匯出 → 部署，全程在自己的電腦上完成，不必寫任何程式。**

[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.x-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-AGPL_3.0-blue?style=for-the-badge)](LICENSE)

[功能](#-功能) • [支援模型](#-支援的任務與模型) • [快速開始](#-快速開始) • [資料集匯入格式](#-資料集匯入格式) • [推論-api](#-推論-api) • [設定](#️-環境變數) • [開發](#-開發與測試) • [授權](#-授權)

</div>

---

## 📖 簡介

VisionForge 是一套在本機執行的電腦視覺訓練平台：後端是 FastAPI + PyTorch，前端是 React + Vite。
透過瀏覽器介面就能管理資料集、標註影像、用 GPU 訓練模型、查看即時訓練曲線，並在「推論工作站」用攝影機即時辨識，或透過 REST API 讓產線設備串接。

```
 🖼️ 上傳 / 📷 攝影機 / 📦 匯入 COCO・YOLO
        │
        ▼
 🏷️ 標註（分類 / 偵測框 / 座標點）──▶ 🧠 GPU 訓練（即時曲線）──▶ 📦 匯出 ONNX / PTH
                                                                      │
                                                                      ▼
                                             🚀 推論工作站（攝影機 + 觸發規則）/ REST API
```

所有影像、標註與模型都存放在本機 `backend/data/`，不會上傳到任何雲端服務；安裝完成後可在無網路的內部網路使用。

---

## ✨ 功能

### 資料集
- 拖放或多選上傳影像（JPG / PNG / WEBP / BMP），也能用瀏覽器攝影機單張或連續擷取。
- **匯入既有資料集**：ZIP 或多個檔案，支援 **COCO** 與 **YOLO** 標註格式（見[資料集匯入格式](#-資料集匯入格式)），可直接匯入 Roboflow 匯出的資料。
- 匯出資料集 ZIP（影像 + COCO JSON + YOLO txt + `data.yaml`）。
- 一鍵切分 train / val / test。
- 資料品質檢查：模糊、重複、尺寸異常、色彩異常、損毀與未標註影像。

### 標註工作站
- 影像分類（點選或直接輸入類別、批次套用）、物件偵測框、特徵 ROI、座標迴歸點。
- 偵測框可拖曳、四角縮放、方向鍵微調（Shift 加速）、Delete 刪除。
- **滾輪縮放（以滑鼠位置為中心）**、中鍵或空白鍵 + 拖曳平移、一鍵符合視窗；大圖開啟時自動縮放到版面內。
- 快捷鍵 `A` / `D` 切換上一張 / 下一張，切換時自動儲存。

### 訓練與監控
- 預設情境（快速 / 平衡 / 精準）或自訂超參數：Epochs 1–500、Batch Size、Learning Rate、AdamW / SGD / Adam、影像尺寸、Early Stopping、資料增強（翻轉、旋轉、YOLO Mosaic）。
- 透過 WebSocket 即時推送 log 與每個 epoch 的 Loss / Accuracy / mAP@0.5；監控頁以一張狀態卡說明目前進度與下一步。
- 自動保存最佳權重，同一專案可保留多種架構的訓練結果並切換使用。

### 評估與匯出
- 混淆矩陣、單張影像測試、**Grad-CAM** 熱力圖。
- 匯出 **ONNX**（可設定 opset 與動態 batch）或 PyTorch `.pth` 權重。

### 推論工作站與 API
- 攝影機或上傳影像即時推論，可框選 ROI 只辨識特定區域，並調整信心度門檻。
- **觸發規則**：「出現目標」、「數量 ≥ N」、「未偵測到（缺件）」，可指定類別或「全部類別」。
- 自動產生 Python、JavaScript、C#、cURL、ESP32 串接範例。

### 介面
- 「工作室」版型：深色浮動側欄、圓角卡片，總覽頁的「下一步」卡片會依專案進度提示該做什麼。
- 6 組配色：創客（預設）、海港、森林、珊瑚、莓果、午夜（深色），可在頁首或「系統設定」切換。
- 繁體中文 / English 介面。

---

## 🧩 支援的任務與模型

| 任務 | 用途 | 架構 |
| :--- | :--- | :--- |
| 🖼️ **影像分類** | 良品 / 瑕疵分級、物件種類辨識 | ResNet-18、ResNet-50、EfficientNet-B0、MobileNetV3-Small、ConvNeXt-Tiny、ViT-B/16、Custom CNN |
| 🎯 **物件偵測** | 多目標定位、計數、瑕疵檢測 | YOLO26-N / S / M / L（Ultralytics）、D-FINE-N / S / L、SSDLite-MobileNetV3 |
| 📈 **座標迴歸** | 取件點、關鍵點、數值預測 | ResNet-18、ResNet-50、EfficientNet-B0、MobileNetV3 |
| 🔍 **特徵分析** | 局部特徵 ROI 辨識 | ResNet-50 FPN、HRNet-W18、Swin-Tiny、ViT |

第一次訓練某個架構時會自動下載預訓練權重（例如 `yolo26n.pt`），之後即可離線使用。

---

## 🚀 快速開始

### 1. 環境需求
- Windows 10 / 11、Linux（x86_64）或 NVIDIA Jetson Orin（ARM64）
- Python 3.10+（建議使用 Conda 環境）
- Node.js 18+ 與 npm
- 選用：NVIDIA GPU + CUDA。沒有 GPU 也能以 CPU 模式訓練，只是較慢。

### 2. 安裝

最簡單的方式是執行安裝精靈，它會找到 Conda 環境、安裝後端與前端相依套件，並產生啟動腳本：

```bash
# Windows
setup_env.bat

# Linux / Jetson
./setup_env.sh
```

也可以手動安裝：

```bash
git clone https://github.com/YisrealHung/VisionForge.git
cd VisionForge

# 後端：請先依平台裝好 PyTorch（CUDA 版 / Jetson 專用 wheel），再安裝其餘套件
python scripts/safe_pip.py -r backend/requirements.txt
python scripts/safe_pip.py ultralytics

# 前端
cd frontend
npm install
cd ..
```

> **為什麼用 `safe_pip.py`？** 它會先鎖定環境中已安裝的 torch、torchvision、numpy、OpenCV、onnxruntime 版本再呼叫 pip，所以重複安裝也不會把 CUDA 版 PyTorch 換掉，或把 numpy 升級到與 NVIDIA wheel 不相容的版本。在 Jetson 上它也不會用 pip 版 OpenCV 覆蓋 JetPack 內建版本。

### 3. 啟動

| 平台 | 啟動 | 停止 |
| :--- | :--- | :--- |
| Windows | `start.bat`（或 PowerShell：`.\start.ps1`） | `stop.bat` / `.\stop.ps1` |
| Linux / Jetson | `./start.sh` | `./stop.sh` |

- **Windows**：`start.bat` 會開兩個視窗（後端 + 前端），並自動開啟 <http://localhost:5173>。
- **Jetson**：`start.sh` 由後端直接提供網頁（第一次執行會自動 `npm run build`），並監聽 `0.0.0.0`，區網內的電腦可用 `http://<Jetson IP>:8000` 開啟。

也可以分開啟動：

```bash
# 後端（API 文件：http://127.0.0.1:8000/docs）
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000

# 前端開發伺服器（http://localhost:5173，/api 會轉給後端）
cd frontend && npm run dev
```

> 如果前端畫面顯示離線、Vite 出現 `http proxy error ... ECONNREFUSED`，代表後端沒有在執行。`scripts\run_frontend.bat` 啟動時會先檢查並提示。

### 4. 平台部署手冊
- 🪟 [Windows 部署與 GPU 加速指南](docs/DEPLOYMENT_WINDOWS.md)
- 🐧 [NVIDIA Jetson Orin 部署指南](docs/DEPLOYMENT_JETSON_ORIN.md)：JetPack、NVIDIA 專用 PyTorch、CSI 相機與 systemd 開機自動啟動。

---

## 📦 資料集匯入格式

在「資料集管理」或「影像標註」頁按「匯入資料集 (COCO / YOLO)」，選擇 ZIP 或多個檔案即可。

| 格式 | 需要的檔案 | 說明 |
| :--- | :--- | :--- |
| **COCO** | 影像 + `*.json`（含 `images`、`annotations`、`categories`） | 例如 Roboflow 的 `_annotations.coco.json`。依 `file_name` 對應影像、依名稱對應類別；Roboflow 額外產生、沒有被使用的佔位類別會略過。 |
| **YOLO** | `images/*.jpg` + `labels/*.txt` + `data.yaml`（或 `classes.txt` / `obj.names`） | 支援 `cls xc yc w h` 方框與多邊形格式（取外框）；`names` 可以是清單或 `{0: a}` 字典。空的 txt 代表背景圖。也可以只匯入標籤，對應專案中已有的影像。 |

- 重複匯入同一批影像時，會**取代**舊的標註，不會重複疊加。
- 同一個 ZIP 同時含 COCO 與 YOLO 時（例如 VisionForge 自己匯出的資料集），以 COCO 為準。
- 匯入完成後會顯示偵測到的格式、已標註張數與略過的標註。

---

## 📡 推論 API

後端 API 的前綴都是 `/api`，完整說明請開 <http://127.0.0.1:8000/docs>。

| 端點 | 說明 |
| :--- | :--- |
| `POST /api/inference/predict` | Base64 影像推論，可帶 `roi`、`trigger_rules`、`architecture` |
| `POST /api/inference/predict-form` | multipart 上傳影像推論（欄位 `file`、`model_id`、`roi_json`、`architecture`） |
| `POST /api/inference/batch` | 一次推論多張 Base64 影像 |
| `GET /api/inference/status` | 推論服務狀態與統計 |
| `WS /api/projects/{project_id}/train/ws` | 訓練 log 與指標即時串流 |

```bash
curl -X POST "http://127.0.0.1:8000/api/inference/predict" \
     -H "Content-Type: application/json" \
     -d '{
       "model_id": "proj_0123456789",
       "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
       "trigger_rules": [
         {"id": "r1", "class_name": "*", "min_confidence": 50, "condition_type": "present"}
       ]
     }'
```

回應範例：

```json
{
  "success": true,
  "inference_time_ms": 13.8,
  "top_label": "scratch",
  "top_confidence": 98.2,
  "predictions": [
    {"label": "scratch", "confidence": 98.2, "probability": 0.982, "bbox": [0.32, 0.45, 0.18, 0.09]}
  ],
  "model_architecture": "yolo26_s",
  "roi_applied": false,
  "trigger_matched": true,
  "triggered_events": [
    {"rule_id": "r1", "rule_name": "[*] present", "class_name": "*", "confidence": 98.2,
     "message": "🔔 目標偵測命中：發現「*」共 1 個（最高置信度 98.2% ≥ 50.0%）", "count": 1,
     "timestamp": "2026-11-10T14:30:00"}
  ],
  "timestamp": "2026-11-10T14:30:00"
}
```

- `model_id` 是專案 ID（`proj_` + 10 碼，可在網址或 `GET /api/projects` 取得）。
- `bbox` 為相對於影像的 `[x, y, w, h]`，數值 0–1；`confidence` 為 0–100%。
- 觸發規則的 `class_name` 填 `"*"` 代表全部類別；`condition_type` 可為 `present`、`count_gte`（搭配 `min_count`）、`absent`。

---

## ⚙️ 環境變數

| 變數 | 預設 | 說明 |
| :--- | :--- | :--- |
| `VF_PORT` | `8000` | 後端埠號。啟動 / 停止腳本、Vite 開發代理與 API 狀態頁都會跟著使用。 |
| `VF_HOST` | `127.0.0.1` | `backend/run.py` 的監聽位址。 |
| `VF_RELOAD` | `0` | 設為 `1` 時 `backend/run.py` 會在程式變更時自動重新載入（會中斷進行中的訓練）。 |
| `VF_DATALOADER_WORKERS` | Windows `0`；Linux / Jetson 最多 `4` | 訓練時讀取影像的背景程序數。Windows 每個程序都要重新載入 CUDA 函式庫，數量太多會出現「分頁檔太小」而中斷訓練。 |

---

## 📂 專案結構

```
VisionForge/
├── backend/
│   ├── app/
│   │   ├── api/          # API 路由：projects、dataset、annotations、train、export、inference、quality、camera、system
│   │   ├── core/         # 設定、SQLite、路徑驗證、運算環境設定
│   │   ├── engines/      # 各模型家族的訓練 / 推論引擎（分類、YOLO、D-FINE、SSDLite、迴歸）
│   │   ├── models/       # Pydantic 資料模型
│   │   └── services/     # 業務邏輯（資料集匯入匯出、標註、訓練排程、推論、Grad-CAM、品質檢查）
│   ├── data/             # 專案資料與 SQLite（不納入版本控制）
│   ├── tests/            # pytest 測試
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   └── src/
│       ├── components/   # 標註畫布、圖表、推論畫布等元件
│       ├── context/      # 專案狀態、主題、語言
│       ├── services/     # API 客戶端
│       ├── styles/       # 工作室版型與 6 組配色（index.css）
│       └── views/        # 各頁面
├── scripts/              # safe_pip、安裝精靈、前後端啟動腳本、Jetson 啟動腳本
├── docs/                 # 部署手冊與設計文件
├── setup_env.bat / .sh   # 安裝精靈
├── start.* / stop.*      # 啟動 / 停止
└── LICENSE
```

---

## 🧪 開發與測試

```bash
# 後端測試
python -m pytest backend/tests

# 前端型別檢查與建置
cd frontend
npx tsc --noEmit
npm run build
```

- 新增配色：在 `frontend/src/styles/index.css` 第 13 節加一個 `[data-theme="…"]` 色彩區塊，並在 `frontend/src/types/index.ts` 的 `THEME_REGISTRY` 登錄。
- 歡迎提交 Issue 與 Pull Request。

---

## 📄 授權

本專案以 **[GNU AGPL-3.0](LICENSE)** 授權。

第三方元件：
- **Ultralytics YOLO**：AGPL-3.0；若要用於閉源商業產品，請向 Ultralytics 取得商業授權。
- **D-FINE**：Apache-2.0。
- **PyTorch / torchvision**：BSD-style。
- **FastAPI**：MIT。
