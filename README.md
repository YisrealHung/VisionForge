# VisionForge

在本機瀏覽器中完成影像整理、標註、模型訓練、評估匯出與即時推論的電腦視覺工作站。後端採用 FastAPI 與 PyTorch，前端為 React 與 Vite，所有資料與權重皆保留於本機，不需寫程式即可使用，亦可在無外網環境的內部網路運行。

`Python 3.10+` · `FastAPI 0.110+` · `PyTorch 2.x` · `React 18` · `Vite 5` · `GNU AGPL-3.0`

[功能介紹](#功能介紹) · [支援的任務與模型](#支援的任務與模型) · [安裝與啟動](#安裝與啟動) · [資料集匯入格式](#資料集匯入格式) · [推論 API](#推論-api) · [環境變數](#環境變數) · [專案結構](#專案結構) · [開發與測試](#開發與測試) · [授權](#授權)

---

## 功能介紹

### 資料集管理與攝影機擷取
- **批次上傳與攝影機連拍**：支援拖放或多選上傳 JPG、PNG、WEBP、BMP 影像；可直接呼叫瀏覽器攝影機單張拍照或定時連拍，並框選保存局部 ROI（各專案獨立記憶）。
- **COCO / YOLO 資料集匯入與匯出**：支援上傳 ZIP 或多選檔案直接匯入（相容 Roboflow 匯出格式）；亦可一鍵匯出包含原始影像、COCO JSON、YOLO txt 與 `data.yaml` 的完整資料集壓縮檔。
- **子集切分與品質檢查**：依比例隨機劃分 train / val / test 子集，並檢測模糊、重複、尺寸異常、色彩異常、損毀與未標註影像。

### 影像標註
- **四種任務工作區**：提供影像分類（點選類別、直接輸入新建並套用、批次標註）、物件偵測框、局部特徵 ROI 與 2D 座標迴歸點標註。
- **畫布操作**：偵測框可拖曳移動、四角縮放、方向鍵微調（搭配 Shift 加大幅度）與 Delete 刪除。支援以游標位置為中心滾輪縮放、中鍵或空白鍵拖曳平移，以及一鍵符合視窗大小。
- **快速切換與自動存檔**：使用 `A` / `D` 或左右鍵切換上一張／下一張影像，切換時自動儲存標註。

### 模型訓練與即時監控
- **預設模板與完整超參數**：內建「快速實驗」、「均衡訓練」、「深度收斂」三種預設模板，並可手動調整 Epochs（1–500）、Batch Size、Learning Rate、優化器（AdamW / SGD / Adam）、輸入解析度、Early Stopping 與資料增強（水平翻轉、旋轉、色彩擾動、隨機縮放裁切、YOLO Mosaic）。
- **即時訓練曲線與終端輸出**：透過 WebSocket 串流每個 epoch 的訓練／驗證 Loss、Accuracy 或 mAP@0.5 變化與後端日誌。
- **多架構管理**：自動保存最佳驗證權重，同一專案可訓練並保留多種架構的檢查點，隨時切換啟用。

### 評估與模型匯出
- **效能評估與熱力圖**：提供測試集混淆矩陣、各類別 Precision / Recall / F1-Score 明細表、單張影像即時測試（含 Softmax 機率分佈）與 Grad-CAM 熱力圖。
- **跨平台匯出**：支援下載原生 PyTorch `.pth` 權重檔，或轉換匯出為 ONNX 格式（可自訂輸入解析度、Opset 14–18 與 Dynamic Batch），供 TensorRT、OpenVINO 或 ONNX Runtime 部署。

### 推論工作站與 REST API
- **即時視覺串流推論**：支援攝影機串流、上傳圖片或載入專案樣本進行推論，可在畫面上拖曳設定 ROI 過濾範圍並即時調整信心度門檻。
- **條件觸發規則**：支援「出現目標」、「數量 ≥ N」與「未偵測到（缺件告警）」，可指定特定類別或套用至全部類別（`*`），即時記錄觸發事件。
- **測試工作台與串接範例**：內建互動式 API 測試工作台（Base64 / Multipart / Batch），並自動產生 Python、Node.js / JS、C#、cURL 與 ESP32 串接範例。

### 介面與離線運行
- **語系與外觀切換**：支援繁體中文與英文介面即時切換，內建 6 款中性色階主題（光學石墨、海港灰藍、松林苔石、暖紙琥珀、石墨絳紅與深色版暗室石墨），並自託管離線 Allo 可變字體。
- **純本機儲存**：所有專案資料、標註檔、SQLite 資料庫與模型權重皆存放在 `backend/data/`，不連外上傳任何影像。

---

## 支援的任務與模型

| 任務 | 常見用途 | 可選架構 |
| :--- | :--- | :--- |
| **影像分類** | 良品／瑕疵判別、物件種類分類 | ResNet-18、ResNet-50、EfficientNet-B0、MobileNetV3-Small、ConvNeXt-Tiny、ViT-B/16、Custom CNN |
| **物件偵測** | 多目標定位、數量統計、表面瑕疵框選 | YOLO26-N / S / M / L（Ultralytics）、D-FINE-N / S / L、SSDLite-MobileNetV3 |
| **座標與數值迴歸** | 取件點定位、角度估計、品質分數預測 | ResNet-18、ResNet-50、EfficientNet-B0、MobileNetV3 |
| **特徵辨識** | 局部特徵 ROI 比對與嵌入向量檢索 | ResNet-50 + FPN、HRNet-W18、Swin-Tiny、ViT-B/16 Feature |

首次使用某個架構進行訓練時會自動下載預訓練權重（例如 `yolo26n.pt`），下載過後即可於離線環境重複使用。

---

## 安裝與啟動

### 1. 環境需求
- Windows 10 / 11、Linux（x86_64）或 NVIDIA Jetson Orin（ARM64）
- Python 3.10+（建議使用 Conda 環境）
- Node.js 18+ 與 npm
- 選用：NVIDIA GPU + CUDA（無 GPU 時自動以 CPU 模式執行）

### 2. 安裝相依套件

執行安裝精靈可自動偵測 Conda 環境、安裝前後端套件並產生本機啟動設定：

```bash
# Windows
setup_env.bat

# Linux / Jetson
./setup_env.sh
```

或手動安裝：

```bash
git clone https://github.com/YisrealHung/VisionForge.git
cd VisionForge

# 後端：請先依作業系統與硬體裝好 PyTorch，再安裝其餘套件
python scripts/safe_pip.py -r backend/requirements.txt
python scripts/safe_pip.py ultralytics

# 前端
cd frontend
npm install
cd ..
```

> `scripts/safe_pip.py` 會在呼叫 pip 前鎖定目前環境已安裝的 `torch`、`torchvision`、`numpy`、`opencv` 與 `onnxruntime` 版本，避免重複安裝時蓋掉 CUDA 版 PyTorch 或 Jetson 內建套件。

### 3. 啟動與停止服務

| 平台 | 啟動指令 | 停止指令 |
| :--- | :--- | :--- |
| Windows | `start.bat`（或 PowerShell `.\start.ps1`） | `stop.bat` / `.\stop.ps1` |
| Linux / Jetson | `./start.sh` | `./stop.sh` |

- **Windows**：`start.bat` 會同時開啟後端與前端開發伺服器視窗，並自動開啟 <http://localhost:5173>。
- **Linux / Jetson**：`start.sh` 會建置前端靜態檔案（`npm run build`）並由後端統一於 `0.0.0.0:8000` 提供服務，區域網路內其他電腦可透過 `http://<主機 IP>:8000` 連線。

分開手動啟動：

```bash
# 後端（API 文件位於 http://127.0.0.1:8000/docs）
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000

# 前端開發伺服器（http://localhost:5173，/api 請求自動代理至後端）
cd frontend && npm run dev
```

---

## 資料集匯入格式

在「資料集管理」或「影像標註」頁面選擇匯入，可上傳單一 ZIP 壓縮檔或同時多選檔案：

| 格式 | 需要的檔案 | 說明 |
| :--- | :--- | :--- |
| **COCO** | 影像檔 + `*.json`（含 `images`、`annotations`、`categories`） | 支援 Roboflow 匯出的 `_annotations.coco.json`。依檔名對應影像、依類別名稱建立標籤，並略過未實際使用的佔位類別。 |
| **YOLO** | `images/*.jpg` + `labels/*.txt` + `data.yaml`（或 `classes.txt` / `obj.names`） | 支援 `cls xc yc w h` 矩形框與多邊形座標（自動轉為外接矩形框）；空的 txt 視為背景無標註圖；亦可單獨匯入標籤對應專案內既有影像。 |

- 重複匯入同一批影像時會覆蓋該影像的舊標註，不會重複疊加。
- 同一份 ZIP 若同時包含 COCO 與 YOLO（例如由 VisionForge 匯出的資料集），以 COCO 標註為準。

---

## 推論 API

後端 API 前綴皆為 `/api`，完整規格請開啟 <http://127.0.0.1:8000/docs>。

| 端點 | 說明 |
| :--- | :--- |
| `POST /api/inference/predict` | Base64 單張影像推論，可傳入 `roi`、`trigger_rules`、`architecture` |
| `POST /api/inference/predict-form` | `multipart/form-data` 上傳圖片檔案推論（欄位 `file`、`model_id`、`roi_json`、`architecture`） |
| `POST /api/inference/batch` | 多張 Base64 影像批次推論 |
| `GET /api/inference/status` | 查詢推論伺服器狀態、累計請求數與平均延遲 |
| `WS /api/projects/{project_id}/train/ws` | 即時訂閱訓練日誌與 epoch 指標 |

請求範例：

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
    {
      "rule_id": "r1",
      "rule_name": "[*] present",
      "class_name": "*",
      "confidence": 98.2,
      "message": "目標偵測命中：發現「*」共 1 個（最高置信度 98.2% >= 50.0%）",
      "count": 1,
      "timestamp": "2026-11-10T14:30:00"
    }
  ],
  "timestamp": "2026-11-10T14:30:00"
}
```

- `model_id` 為專案 ID（格式 `proj_` + 10 碼，可從 `GET /api/projects` 取得）。
- `bbox` 為相對於影像寬高的 `[x, y, w, h]`（範圍 `0–1`）；`confidence` 範圍為 `0–100%`。
- 觸發規則 `class_name` 設為 `"*"` 代表匹配全部類別；`condition_type` 支援 `present`、`count_gte`（搭配 `min_count`）與 `absent`。

---

## 環境變數

| 變數 | 預設值 | 說明 |
| :--- | :--- | :--- |
| `VF_PORT` | `8000` | 後端服務埠號。啟動／停止腳本、Vite 代理與推論端點位址皆會同步採用。 |
| `VF_HOST` | `127.0.0.1` | `backend/run.py` 監聽位址。 |
| `VF_RELOAD` | `0` | 設為 `1` 時啟用檔案變更自動重載（重載會中斷正在進行的訓練）。 |
| `VF_DATALOADER_WORKERS` | Windows `0`；Linux / Jetson 最多 `4` | 訓練資料讀取的背景 worker 數量。Windows 下設為 `0` 以避免重複載入 CUDA DLL 導致記憶體或分頁檔耗盡。 |

---

## 專案結構

```text
VisionForge/
├── backend/
│   ├── app/
│   │   ├── api/          # REST / WebSocket 路由（projects, dataset, annotations, train, export, inference, quality, camera, system）
│   │   ├── core/         # 環境設定、SQLite 連線、路徑驗證
│   │   ├── engines/      # 訓練與推論引擎（分類、YOLO、D-FINE、SSDLite、迴歸）
│   │   ├── models/       # Pydantic 資料模型
│   │   └── services/     # 資料集匯入匯出、標註管理、訓練排程、Grad-CAM 與品質診斷
│   ├── data/             # 本機 SQLite 資料庫與專案檔案（不納入版本控制）
│   ├── tests/            # pytest 測試
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   └── src/
│       ├── assets/fonts/allo/  # 離線自託管 Allo 可變字體與授權檔
│       ├── components/         # 標註畫布、圖表、推論畫布、API 測試台等元件
│       ├── context/            # 專案狀態、主題與多語系切換
│       ├── i18n/               # 繁體中文 / English 介面字典
│       ├── services/           # API 客戶端與攝影機佇列輔助
│       ├── styles/             # allo.css 字體定義與 index.css 設計系統（6 款中性主題）
│       └── views/              # 訓練流程、推論工作站、API 伺服器與系統設定頁面
├── docs/                 # Windows 與 NVIDIA Jetson Orin 部署手冊
├── scripts/              # safe_pip、安裝精靈與平台啟動腳本
├── setup_env.bat / .sh   # 環境安裝精靈
└── start.* / stop.*      # 一鍵啟動／停止腳本
```

---

## 開發與測試

```bash
# 後端單元測試
python -m pytest backend/tests

# 前端型別檢查與生產建置
cd frontend
npx tsc --noEmit
npm run build
```

- 平台部署文件：[Windows 部署指南](docs/DEPLOYMENT_WINDOWS.md) · [NVIDIA Jetson Orin 部署指南](docs/DEPLOYMENT_JETSON_ORIN.md)
- 若要新增介面主題，可在 `frontend/src/styles/index.css` 新增對應 `[data-theme="…"]` 色彩變數區塊，並於 `frontend/src/types/index.ts` 的 `THEME_REGISTRY` 註冊。

---

## 授權

本專案以 **[GNU AGPL-3.0](LICENSE)** 授權釋出。

主要第三方元件授權：
- **Ultralytics YOLO**：AGPL-3.0（閉源商業使用請向 Ultralytics 取得授權）
- **D-FINE**：Apache-2.0
- **PyTorch / torchvision**：BSD-style
- **FastAPI**：MIT
- **Allo Typeface**：SIL Open Font License 1.1（見 `frontend/src/assets/fonts/allo/OFL.txt`）
