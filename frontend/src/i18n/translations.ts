export type Language = 'zh-TW' | 'en-US';

export interface TranslationDictionary {
  // Brand & General
  brandName: string;
  brandTagline: string;
  platformSubtitle: string;
  version: string;
  online: string;
  offline: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  confirm: string;
  loading: string;
  actions: string;
  status: string;
  success: string;
  error: string;
  copy: string;
  copied: string;
  download: string;

  // Sidebar & Navigation
  trainingWorkspace: string;
  trainingWorkspaceBadge: string;
  inferenceWorkspace: string;
  inferenceWorkspaceBadge: string;
  navDashboard: string;
  navDataset: string;
  navAnnotator: string;
  navTrain: string;
  navMonitor: string;
  navExport: string;
  navInferenceStation: string;
  navApiServer: string;
  navSettings: string;

  // Header
  selectOrCreateProject: string;
  switchProject: string;
  noProjectsFound: string;
  createNewProject: string;
  themeSelector: string;
  themeAesthetics: string;
  themeCountLabel: string;
  languageSelector: string;

  // Settings View
  settingsTitle: string;
  settingsSubtitle: string;
  languageCardTitle: string;
  languageCardDesc: string;
  langZhTW: string;
  langEnUS: string;
  themeCardTitle: string;
  themeCardDesc: string;
  filterAll: string;
  filterLight: string;
  filterDark: string;
  backendStatusTitle: string;
  connectionStatus: string;
  connOnline: string;
  connOffline: string;
  pythonEnv: string;
  osPlatform: string;
  gpuDiagTitle: string;
  cudaSupport: string;
  cudaAvailable: string;
  cudaCpuOnly: string;
  detectedComputeDevice: string;
  dataStorageTitle: string;
  dbType: string;
  dbTypeValue: string;
  projectStoragePath: string;
  annotationCompatibility: string;

  // Dashboard View
  dashboardHeroTitleDefault: string;
  dashboardHeroSubtitleDefault: string;
  dashboardHeroCurrentProject: string;
  dashboardHeroCurrentDesc: string;
  dashboardBtnNewProject: string;
  dashboardBtnGoDataset: string;
  dashboardBtnGoTrain: string;
  dashboardProjectsTitle: string;
  dashboardStatsTotalProjects: string;
  dashboardStatsTotalImages: string;
  dashboardStatsActiveModels: string;
  dashboardStatsGpuStatus: string;
  dashboardRecentProjects: string;
  dashboardNoProjects: string;
  dashboardCreateFirstPrompt: string;

  // Create Project Modal
  createProjectModalTitle: string;
  createProjectNameLabel: string;
  createProjectNamePlaceholder: string;
  createProjectTaskLabel: string;
  createProjectDescLabel: string;
  createProjectDescPlaceholder: string;
  taskClassification: string;
  taskClassificationDesc: string;
  taskDetection: string;
  taskDetectionDesc: string;
  taskRegression: string;
  taskRegressionDesc: string;
  btnCreateProject: string;

  // Dataset View
  datasetTitle: string;
  datasetSubtitle: string;
  datasetBtnUpload: string;
  datasetBtnCamera: string;
  datasetBtnAugment: string;
  datasetBtnQuality: string;
  datasetTotalImages: string;
  datasetLabeledImages: string;
  datasetUnlabeledImages: string;
  datasetClassDistribution: string;
  datasetFilterAll: string;
  datasetFilterLabeled: string;
  datasetFilterUnlabeled: string;
  datasetEmptyPrompt: string;

  // Annotation View
  annotationTitle: string;
  annotationTools: string;
  annotationClasses: string;
  annotationAddClass: string;
  annotationPrev: string;
  annotationNext: string;
  annotationSave: string;
  annotationAutoSave: string;
  annotationBoxCount: string;

  // Training View
  trainTitle: string;
  trainSubtitle: string;
  trainPresetTitle: string;
  trainPresetFast: string;
  trainPresetFastDesc: string;
  trainPresetBalanced: string;
  trainPresetBalancedDesc: string;
  trainPresetDeep: string;
  trainPresetDeepDesc: string;
  trainArchitectureLabel: string;
  trainEpochsLabel: string;
  trainBatchSizeLabel: string;
  trainLrLabel: string;
  trainOptimizerLabel: string;
  trainBtnStart: string;
  trainBtnTraining: string;

  // Monitor View
  monitorTitle: string;
  monitorSubtitle: string;
  monitorCurrentEpoch: string;
  monitorLossChart: string;
  monitorMetricChart: string;
  monitorLiveLogs: string;
  monitorBtnStop: string;

  // Export View
  exportTitle: string;
  exportSubtitle: string;
  exportOnnxCardTitle: string;
  exportOnnxCardDesc: string;
  exportPthCardTitle: string;
  exportPthCardDesc: string;
  exportBtnDownload: string;

  // Inference Station & API Server View
  inferenceTitle: string;
  inferenceSubtitle: string;
  inferenceFeedWebcam: string;
  inferenceFeedImage: string;
  inferenceFeedDataset: string;
  inferenceBtnStartCamera: string;
  inferenceBtnStopCamera: string;
  inferenceConfThreshold: string;
  inferenceRoiCrop: string;
  inferenceTriggerRules: string;
  inferenceLatency: string;
  inferenceFps: string;
  apiServerTitle: string;
  apiServerSubtitle: string;
  apiServerOnlineStatus: string;
  apiServerToggleBtn: string;
  apiServerDocLink: string;
  apiServerEndpointsTitle: string;
  apiServerCodeSamplesTitle: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  'zh-TW': {
    // Brand & General
    brandName: 'VisionForge',
    brandTagline: 'No-Code AI',
    platformSubtitle: '本地 No-Code AI 影像模型訓練與推論平台',
    version: 'v1.0.0',
    online: '正常連線',
    offline: '連線中斷',
    save: '儲存',
    cancel: '取消',
    delete: '刪除',
    edit: '編輯',
    confirm: '確認',
    loading: '載入中...',
    actions: '操作',
    status: '狀態',
    success: '成功',
    error: '錯誤',
    copy: '複製程式碼',
    copied: '已複製！',
    download: '下載',

    // Sidebar & Navigation
    trainingWorkspace: '訓練區塊',
    trainingWorkspaceBadge: 'Training',
    inferenceWorkspace: '推論區塊',
    inferenceWorkspaceBadge: 'Inference',
    navDashboard: '專案總覽',
    navDataset: '資料集與相機',
    navAnnotator: '影像標註工具',
    navTrain: '模型配置與訓練',
    navMonitor: '即時訓練監控',
    navExport: '模型管理與匯出',
    navInferenceStation: '獨立推論工作站',
    navApiServer: '推論 API 伺服器',
    navSettings: '系統設定',

    // Header
    selectOrCreateProject: '選擇或建立專案',
    switchProject: '切換專案',
    noProjectsFound: '尚無專案，請先建立新專案',
    createNewProject: '建立新專案',
    themeSelector: '介面主題風格',
    themeAesthetics: '介面外觀風格',
    themeCountLabel: '款主題',
    languageSelector: '顯示語言切換',

    // Settings View
    settingsTitle: '⚙️ 系統設定與診斷',
    settingsSubtitle: '語言切換、介面風格、後端運行狀態、硬體算力環境與系統儲存路徑',
    languageCardTitle: '🌐 系統介面語言 (Interface Language)',
    languageCardDesc: '切換系統介面的顯示語言',
    langZhTW: '🇹🇼 繁體中文 (Traditional Chinese)',
    langEnUS: '🇺🇸 English (英文)',
    themeCardTitle: '介面外觀風格 (Theme & Aesthetics)',
    themeCardDesc: '共 12 款三色特調主題 · 6 款柔雅淺色與 6 款深邃暗夜 · 即時切換自動儲存',
    filterAll: '全部',
    filterLight: '☀️ 柔雅淺色',
    filterDark: '🌙 深邃暗夜',
    backendStatusTitle: '後端服務狀態',
    connectionStatus: '連線狀態',
    connOnline: '🟢 正常連線中 (Online)',
    connOffline: '🔴 連線中斷 (Offline)',
    pythonEnv: 'Python 執行環境',
    osPlatform: '作業系統平臺',
    gpuDiagTitle: 'GPU 加速診斷',
    cudaSupport: 'CUDA 加速支援',
    cudaAvailable: '🟢 支援 CUDA 加速',
    cudaCpuOnly: '🟡 僅使用 CPU (未啟用 CUDA)',
    detectedComputeDevice: '偵測到的運算裝置',
    dataStorageTitle: '資料儲存設定',
    dbType: '資料庫類型',
    dbTypeValue: 'SQLite 3 (本地獨立檔案)',
    projectStoragePath: '專案儲存路徑',
    annotationCompatibility: '標註格式相容性',

    // Dashboard View
    dashboardHeroTitleDefault: '鍛造屬於你的專屬 AI 視覺模型',
    dashboardHeroSubtitleDefault: '透過直覺的圖形化介面，輕鬆完成資料集管理、模型訓練與即時推論。',
    dashboardHeroCurrentProject: '當前專案：',
    dashboardHeroCurrentDesc: '零程式碼匯入資料、影像標註、GPU 加速訓練與一鍵匯出 ONNX 模型。',
    dashboardBtnNewProject: '建立新專案',
    dashboardBtnGoDataset: '進入資料集管理',
    dashboardBtnGoTrain: '開始配置訓練',
    dashboardProjectsTitle: '所有專案列表',
    dashboardStatsTotalProjects: '總專案數',
    dashboardStatsTotalImages: '累計資料集樣本',
    dashboardStatsActiveModels: '已訓練模型',
    dashboardStatsGpuStatus: '算力核心',
    dashboardRecentProjects: '近期專案',
    dashboardNoProjects: '目前尚無專案',
    dashboardCreateFirstPrompt: '立即建立您的第一個 AI 視覺專案，開啟 No-Code 影像鍛造之旅！',

    // Create Project Modal
    createProjectModalTitle: '建立新專案',
    createProjectNameLabel: '專案名稱',
    createProjectNamePlaceholder: '例如：PCB_Defect_Detector',
    createProjectTaskLabel: '任務類型',
    createProjectDescLabel: '專案說明 (選填)',
    createProjectDescPlaceholder: '簡述此專案的應用場景與目標...',
    taskClassification: '影像分類 (Classification)',
    taskClassificationDesc: '單張影像判別為單一類別（良品/瑕疵、物體種類等）',
    taskDetection: '物件偵測 (Object Detection)',
    taskDetectionDesc: '定位多個目標物體並標記邊界框 Bounding Box（支援 YOLO26 / D-FINE）',
    taskRegression: '特徵迴歸 (Regression)',
    taskRegressionDesc: '預測連續數值（品質評分、角度估計、溫度測量等）',
    btnCreateProject: '立即建立專案',

    // Dataset View
    datasetTitle: '資料集與相機採集',
    datasetSubtitle: '批次匯入本地圖片、使用攝影機即時連拍採集樣本，並診斷資料集健康度',
    datasetBtnUpload: '批次上傳圖片',
    datasetBtnCamera: '相機即時採集',
    datasetBtnAugment: '資料增強配置',
    datasetBtnQuality: '資料集健康診斷',
    datasetTotalImages: '總影像數',
    datasetLabeledImages: '已標註影像',
    datasetUnlabeledImages: '未標註影像',
    datasetClassDistribution: '類別分布',
    datasetFilterAll: '全部圖片',
    datasetFilterLabeled: '已標註',
    datasetFilterUnlabeled: '未標註',
    datasetEmptyPrompt: '尚未新增任何圖片，請點擊上方按鈕上傳照片或開啟相機拍照！',

    // Annotation View
    annotationTitle: '專業影像標註工具',
    annotationTools: '標註工具列',
    annotationClasses: '類別標籤清單',
    annotationAddClass: '新增類別',
    annotationPrev: '上一張 (A)',
    annotationNext: '下一張 (D)',
    annotationSave: '儲存標註 (Ctrl+S)',
    annotationAutoSave: '切換時自動儲存',
    annotationBoxCount: '個標註物件',

    // Training View
    trainTitle: '模型配置與訓練',
    trainSubtitle: '選擇神經網路骨幹架構、調優預設超參數並啟動 GPU 加速深度學習訓練',
    trainPresetTitle: '快速調優配置範本',
    trainPresetFast: '⚡ 快速驗證 (Fast)',
    trainPresetFastDesc: '極少 Epochs 快速檢查資料集與跑通管線',
    trainPresetBalanced: '⚖️ 平衡推薦 (Balanced)',
    trainPresetBalancedDesc: '兼顧訓練時間與泛化準確度的推薦配置',
    trainPresetDeep: '🎯 深度鍛造 (Deep)',
    trainPresetDeepDesc: '充分訓練以達到極限準確度與極佳收斂',
    trainArchitectureLabel: '模型神經網路架構',
    trainEpochsLabel: '訓練輪數 (Epochs)',
    trainBatchSizeLabel: '批次大小 (Batch Size)',
    trainLrLabel: '學習率 (Learning Rate)',
    trainOptimizerLabel: '優化器 (Optimizer)',
    trainBtnStart: '🚀 開始訓練模型',
    trainBtnTraining: '🧠 模型訓練中...',

    // Monitor View
    monitorTitle: '即時訓練監控看板',
    monitorSubtitle: '實時追蹤損失收斂曲線、準確度/mAP 指標變化與後端即時日誌串流',
    monitorCurrentEpoch: '當前進度',
    monitorLossChart: '損失收斂曲線 (Loss)',
    monitorMetricChart: '評估指標曲線 (Accuracy / mAP)',
    monitorLiveLogs: '後端實時訓練日誌 (Live Logs)',
    monitorBtnStop: '終止訓練',

    // Export View
    exportTitle: '模型管理與多平臺匯出',
    exportSubtitle: '下載最佳訓練權重 Checkpoint 或匯出為跨平台通用 ONNX 格式',
    exportOnnxCardTitle: 'ONNX 跨平台格式匯出',
    exportOnnxCardDesc: '支援 TensorRT、OpenVINO、ONNX Runtime 等邊緣推論加速引擎',
    exportPthCardTitle: 'PyTorch Checkpoint (.pt) 權重',
    exportPthCardDesc: '包含完整模型結構、最佳驗證權重與訓練超參數狀態',
    exportBtnDownload: '立即匯出下載',

    // Inference Station & API Server View
    inferenceTitle: '獨立推論工作站',
    inferenceSubtitle: '連接本地攝影機或上傳圖片，以毫秒級延遲即時執行 AI 視覺辨識與條件觸發',
    inferenceFeedWebcam: '📷 攝影機即時串流',
    inferenceFeedImage: '🖼️ 上傳測試圖片',
    inferenceFeedDataset: '📁 載入專案樣本',
    inferenceBtnStartCamera: '開啟攝影機',
    inferenceBtnStopCamera: '關閉攝影機',
    inferenceConfThreshold: '信心度過濾閾值',
    inferenceRoiCrop: 'ROI 關注區域',
    inferenceTriggerRules: '條件警報觸發規則',
    inferenceLatency: '推論延遲',
    inferenceFps: '即時幀率',
    apiServerTitle: '推論 API 伺服器',
    apiServerSubtitle: '提供標準 RESTful API 與 WebSocket 介面，供外部設備或自動化產線串接',
    apiServerOnlineStatus: 'API 伺服器運行狀態',
    apiServerToggleBtn: '啟動 / 暫停 API 服務',
    apiServerDocLink: '查看 Swagger 互動式 API 文件',
    apiServerEndpointsTitle: '可用 API 介面端點',
    apiServerCodeSamplesTitle: '多語言客戶端串接範例 (Python, JS, cURL, C#)',
  },

  'en-US': {
    // Brand & General
    brandName: 'VisionForge',
    brandTagline: 'No-Code AI',
    platformSubtitle: 'Local No-Code AI Vision Model Training & Inference Platform',
    version: 'v1.0.0',
    online: 'Online',
    offline: 'Offline',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    confirm: 'Confirm',
    loading: 'Loading...',
    actions: 'Actions',
    status: 'Status',
    success: 'Success',
    error: 'Error',
    copy: 'Copy Code',
    copied: 'Copied!',
    download: 'Download',

    // Sidebar & Navigation
    trainingWorkspace: 'Training',
    trainingWorkspaceBadge: 'Training',
    inferenceWorkspace: 'Inference',
    inferenceWorkspaceBadge: 'Inference',
    navDashboard: 'Project Overview',
    navDataset: 'Dataset & Camera',
    navAnnotator: 'Annotation Tool',
    navTrain: 'Model & Training',
    navMonitor: 'Live Monitoring',
    navExport: 'Export & Models',
    navInferenceStation: 'Inference Station',
    navApiServer: 'Inference API Server',
    navSettings: 'System Settings',

    // Header
    selectOrCreateProject: 'Select or Create Project',
    switchProject: 'Switch Project',
    noProjectsFound: 'No projects found. Please create one.',
    createNewProject: 'New Project',
    themeSelector: 'Theme & Aesthetics',
    themeAesthetics: 'Theme & Aesthetics',
    themeCountLabel: 'Themes',
    languageSelector: 'Language',

    // Settings View
    settingsTitle: '⚙️ System Settings & Diagnostics',
    settingsSubtitle: 'Language, Appearance, Backend Status, Hardware Compute & Storage Settings',
    languageCardTitle: '🌐 Interface Language (顯示語言)',
    languageCardDesc: 'Switch interface between Traditional Chinese and English',
    langZhTW: '🇹🇼 繁體中文 (Traditional Chinese)',
    langEnUS: '🇺🇸 English (英文)',
    themeCardTitle: 'Interface Appearance (Theme & Aesthetics)',
    themeCardDesc: '12 curated 3-color themes · 6 Light & 6 Dark · Instant switch and auto-saved',
    filterAll: 'All',
    filterLight: '☀️ Light',
    filterDark: '🌙 Dark',
    backendStatusTitle: 'Backend Service Status',
    connectionStatus: 'Connection Status',
    connOnline: '🟢 Online (Connected)',
    connOffline: '🔴 Offline (Disconnected)',
    pythonEnv: 'Python Environment',
    osPlatform: 'OS Platform',
    gpuDiagTitle: 'GPU Acceleration Diagnostics',
    cudaSupport: 'CUDA Acceleration',
    cudaAvailable: '🟢 CUDA Acceleration Enabled',
    cudaCpuOnly: '🟡 CPU Only (CUDA Not Enabled)',
    detectedComputeDevice: 'Detected Compute Device',
    dataStorageTitle: 'Data Storage Settings',
    dbType: 'Database Type',
    dbTypeValue: 'SQLite 3 (Local Standalone File)',
    projectStoragePath: 'Project Storage Path',
    annotationCompatibility: 'Annotation Compatibility',

    // Dashboard View
    dashboardHeroTitleDefault: 'Forge Your Custom AI Vision Models',
    dashboardHeroSubtitleDefault: 'Effortlessly manage datasets, train models, and run real-time inference via an intuitive graphical interface.',
    dashboardHeroCurrentProject: 'Active Project: ',
    dashboardHeroCurrentDesc: 'No-code data import, annotation, GPU-accelerated training, and one-click ONNX export.',
    dashboardBtnNewProject: 'New Project',
    dashboardBtnGoDataset: 'Manage Dataset',
    dashboardBtnGoTrain: 'Configure & Train',
    dashboardProjectsTitle: 'All Projects',
    dashboardStatsTotalProjects: 'Total Projects',
    dashboardStatsTotalImages: 'Dataset Images',
    dashboardStatsActiveModels: 'Trained Models',
    dashboardStatsGpuStatus: 'Compute Engine',
    dashboardRecentProjects: 'Recent Projects',
    dashboardNoProjects: 'No projects yet',
    dashboardCreateFirstPrompt: 'Create your first AI vision project and start your No-Code journey!',

    // Create Project Modal
    createProjectModalTitle: 'Create New Project',
    createProjectNameLabel: 'Project Name',
    createProjectNamePlaceholder: 'e.g., PCB_Defect_Detector',
    createProjectTaskLabel: 'Task Type',
    createProjectDescLabel: 'Description (Optional)',
    createProjectDescPlaceholder: 'Briefly describe application goal...',
    taskClassification: 'Classification',
    taskClassificationDesc: 'Classify single images into discrete categories (Pass/NG, object class)',
    taskDetection: 'Object Detection',
    taskDetectionDesc: 'Locate multiple objects with Bounding Boxes (supports YOLO26 / D-FINE)',
    taskRegression: 'Feature Regression',
    taskRegressionDesc: 'Predict continuous numerical scores (quality index, angle, temperature)',
    btnCreateProject: 'Create Project Now',

    // Dataset View
    datasetTitle: 'Dataset & Camera Capture',
    datasetSubtitle: 'Batch import images, capture live camera samples, and diagnose dataset quality',
    datasetBtnUpload: 'Upload Images',
    datasetBtnCamera: 'Webcam Capture',
    datasetBtnAugment: 'Augmentation',
    datasetBtnQuality: 'Quality Health Check',
    datasetTotalImages: 'Total Images',
    datasetLabeledImages: 'Labeled Images',
    datasetUnlabeledImages: 'Unlabeled Images',
    datasetClassDistribution: 'Class Distribution',
    datasetFilterAll: 'All Images',
    datasetFilterLabeled: 'Labeled',
    datasetFilterUnlabeled: 'Unlabeled',
    datasetEmptyPrompt: 'No images yet. Click above to upload photos or open camera to capture!',

    // Annotation View
    annotationTitle: 'Interactive Annotation Suite',
    annotationTools: 'Tools',
    annotationClasses: 'Class Labels',
    annotationAddClass: 'Add Class',
    annotationPrev: 'Previous (A)',
    annotationNext: 'Next (D)',
    annotationSave: 'Save (Ctrl+S)',
    annotationAutoSave: 'Auto-save on switch',
    annotationBoxCount: 'Annotated Objects',

    // Training View
    trainTitle: 'Model Configuration & Training',
    trainSubtitle: 'Select backbone architecture, tune hyperparameters, and launch GPU-accelerated deep learning training',
    trainPresetTitle: 'Hyperparameter Presets',
    trainPresetFast: '⚡ Fast Verification',
    trainPresetFastDesc: 'Few epochs for quick pipeline validation',
    trainPresetBalanced: '⚖️ Balanced Recommended',
    trainPresetBalancedDesc: 'Recommended balance between training time and accuracy',
    trainPresetDeep: '🎯 Deep Forge',
    trainPresetDeepDesc: 'Full training for maximum convergence and high accuracy',
    trainArchitectureLabel: 'Neural Network Architecture',
    trainEpochsLabel: 'Training Epochs',
    trainBatchSizeLabel: 'Batch Size',
    trainLrLabel: 'Learning Rate',
    trainOptimizerLabel: 'Optimizer',
    trainBtnStart: '🚀 Start Training Model',
    trainBtnTraining: '🧠 Model Training in Progress...',

    // Monitor View
    monitorTitle: 'Live Training Monitor',
    monitorSubtitle: 'Track loss convergence, evaluation metrics, and stream real-time backend training logs',
    monitorCurrentEpoch: 'Progress',
    monitorLossChart: 'Loss Convergence (Train / Val)',
    monitorMetricChart: 'Evaluation Metrics (Accuracy / mAP)',
    monitorLiveLogs: 'Live Training Logs',
    monitorBtnStop: 'Stop Training',

    // Export View
    exportTitle: 'Model Management & Multi-Platform Export',
    exportSubtitle: 'Download best checkpoint weights or export to cross-platform ONNX format',
    exportOnnxCardTitle: 'ONNX Cross-Platform Export',
    exportOnnxCardDesc: 'Compatible with TensorRT, OpenVINO, and ONNX Runtime edge inference engines',
    exportPthCardTitle: 'PyTorch Checkpoint (.pt)',
    exportPthCardDesc: 'Contains full model graph, best validation weights, and training states',
    exportBtnDownload: 'Export & Download',

    // Inference Station & API Server View
    inferenceTitle: 'Standalone Inference Station',
    inferenceSubtitle: 'Connect webcam or upload images for real-time millisecond AI vision detection and trigger rules',
    inferenceFeedWebcam: '📷 Live Webcam Stream',
    inferenceFeedImage: '🖼️ Upload Image',
    inferenceFeedDataset: '📁 Project Sample',
    inferenceBtnStartCamera: 'Start Camera',
    inferenceBtnStopCamera: 'Stop Camera',
    inferenceConfThreshold: 'Confidence Threshold',
    inferenceRoiCrop: 'ROI Crop Area',
    inferenceTriggerRules: 'Trigger Alarm Rules',
    inferenceLatency: 'Inference Latency',
    inferenceFps: 'Live FPS',
    apiServerTitle: 'Inference API Server',
    apiServerSubtitle: 'Standard RESTful and WebSocket endpoints for external devices and factory automation',
    apiServerOnlineStatus: 'API Server Status',
    apiServerToggleBtn: 'Start / Pause API Server',
    apiServerDocLink: 'View Interactive Swagger API Docs',
    apiServerEndpointsTitle: 'Available Endpoints',
    apiServerCodeSamplesTitle: 'Client SDK Code Samples (Python, JS, cURL, C#)',
  },
};
