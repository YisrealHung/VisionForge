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
    brandTagline: '本機視覺工作站',
    platformSubtitle: '本機電腦視覺資料標註、模型訓練與推論工作站',
    version: 'v1.0.0',
    online: '連線正常',
    offline: '離線',
    save: '儲存',
    cancel: '取消',
    delete: '刪除',
    edit: '編輯',
    confirm: '確認',
    loading: '載入中…',
    actions: '操作',
    status: '狀態',
    success: '成功',
    error: '錯誤',
    copy: '複製程式碼',
    copied: '已複製',
    download: '下載',

    // Sidebar & Navigation
    trainingWorkspace: '訓練流程',
    trainingWorkspaceBadge: 'Training',
    inferenceWorkspace: '推論與服務',
    inferenceWorkspaceBadge: 'Inference',
    navDashboard: '專案總覽',
    navDataset: '資料集與相機',
    navAnnotator: '影像標註',
    navTrain: '模型訓練',
    navMonitor: '訓練監控',
    navExport: '評估與匯出',
    navInferenceStation: '推論工作站',
    navApiServer: '推論 API 伺服器',
    navSettings: '系統設定',

    // Header
    selectOrCreateProject: '選擇或建立專案',
    switchProject: '切換專案',
    noProjectsFound: '尚無專案',
    createNewProject: '建立新專案',
    themeSelector: '外觀主題',
    themeAesthetics: '介面外觀',
    themeCountLabel: '款主題',
    languageSelector: '顯示語言',

    // Settings View
    settingsTitle: '系統設定與診斷',
    settingsSubtitle: '語言偏好、外觀主題、後端服務狀態、運算裝置與儲存路徑',
    languageCardTitle: '介面語言',
    languageCardDesc: '選擇系統介面的顯示語言',
    langZhTW: '繁體中文 (Traditional Chinese)',
    langEnUS: 'English (US)',
    themeCardTitle: '介面外觀主題',
    themeCardDesc: '6 款中性色階主題（5 款淺色與 1 款深色），切換後自動儲存',
    filterAll: '全部',
    filterLight: '淺色',
    filterDark: '深色',
    backendStatusTitle: '後端服務狀態',
    connectionStatus: '連線狀態',
    connOnline: '連線正常 (Online)',
    connOffline: '連線中斷 (Offline)',
    pythonEnv: 'Python 執行環境',
    osPlatform: '作業系統平臺',
    gpuDiagTitle: 'GPU 運算診斷',
    cudaSupport: 'CUDA 支援狀態',
    cudaAvailable: '已啟用 CUDA 加速',
    cudaCpuOnly: '僅使用 CPU（未啟用 CUDA）',
    detectedComputeDevice: '偵測到的運算裝置',
    dataStorageTitle: '資料儲存設定',
    dbType: '資料庫類型',
    dbTypeValue: 'SQLite 3（本機單檔）',
    projectStoragePath: '專案儲存路徑',
    annotationCompatibility: '標註格式相容性',

    // Dashboard View
    dashboardHeroTitleDefault: '本機電腦視覺模型訓練與推論工作站',
    dashboardHeroSubtitleDefault: '在本機完成影像資料整理、標註、GPU 模型訓練、混淆矩陣評估，以及攝影機與 REST API 部署。',
    dashboardHeroCurrentProject: '目前專案：',
    dashboardHeroCurrentDesc: '整合資料匯入、影像標註、模型訓練與 ONNX 匯出流程',
    dashboardBtnNewProject: '建立新專案',
    dashboardBtnGoDataset: '管理資料集',
    dashboardBtnGoTrain: '配置訓練',
    dashboardProjectsTitle: '所有專案',
    dashboardStatsTotalProjects: '專案總數',
    dashboardStatsTotalImages: '累計影像樣本',
    dashboardStatsActiveModels: '已訓練模型',
    dashboardStatsGpuStatus: '運算裝置',
    dashboardRecentProjects: '近期專案',
    dashboardNoProjects: '尚未建立任何專案',
    dashboardCreateFirstPrompt: '建立第一個視覺專案以匯入影像資料並開始標註與訓練',

    // Create Project Modal
    createProjectModalTitle: '建立新專案',
    createProjectNameLabel: '專案名稱',
    createProjectNamePlaceholder: '例如：PCB_Defect_Detector',
    createProjectTaskLabel: '任務類型',
    createProjectDescLabel: '專案說明（選填）',
    createProjectDescPlaceholder: '簡述應用場景與辨識目標…',
    taskClassification: '影像分類',
    taskClassificationDesc: '將整張影像分類至單一類別（良品與瑕疵、物體種類）',
    taskDetection: '物件偵測',
    taskDetectionDesc: '定位多個目標物體並標記邊界框（支援 YOLO26、D-FINE）',
    taskRegression: '座標與數值迴歸',
    taskRegressionDesc: '預測座標點或連續數值（角度、位置、品質評分）',
    btnCreateProject: '建立專案',

    // Dataset View
    datasetTitle: '資料集管理',
    datasetSubtitle: '匯入影像或 COCO / YOLO 資料集、相機擷取與訓練／驗證集分割',
    datasetBtnUpload: '上傳圖片',
    datasetBtnCamera: '相機擷取',
    datasetBtnAugment: '資料增強',
    datasetBtnQuality: '品質檢查',
    datasetTotalImages: '總影像數',
    datasetLabeledImages: '已標註影像',
    datasetUnlabeledImages: '未標註影像',
    datasetClassDistribution: '類別分布',
    datasetFilterAll: '全部',
    datasetFilterLabeled: '已標註',
    datasetFilterUnlabeled: '未標註',
    datasetEmptyPrompt: '尚未新增圖片，可上傳圖片或開啟攝影機擷取',

    // Annotation View
    annotationTitle: '影像標註',
    annotationTools: '標註工具',
    annotationClasses: '類別標籤',
    annotationAddClass: '新增類別',
    annotationPrev: '上一張 (A)',
    annotationNext: '下一張 (D)',
    annotationSave: '儲存標註 (Ctrl+S)',
    annotationAutoSave: '切換時自動儲存',
    annotationBoxCount: '個標註物件',

    // Training View
    trainTitle: '模型配置與訓練',
    trainSubtitle: '選擇訓練預設、神經網路架構與超參數設定',
    trainPresetTitle: '訓練預設範本',
    trainPresetFast: '快速驗證',
    trainPresetFastDesc: '5 個 Epochs，適合檢查資料集與訓練流程',
    trainPresetBalanced: '均衡訓練',
    trainPresetBalancedDesc: '20 個 Epochs，兼顧收斂速度與驗證準確度',
    trainPresetDeep: '深度訓練',
    trainPresetDeepDesc: '50 個 Epochs，使用 Cosine 學習率退火充分收斂',
    trainArchitectureLabel: '模型架構',
    trainEpochsLabel: '訓練輪數 (Epochs)',
    trainBatchSizeLabel: '批次大小 (Batch Size)',
    trainLrLabel: '學習率 (Learning Rate)',
    trainOptimizerLabel: '優化器 (Optimizer)',
    trainBtnStart: '開始訓練',
    trainBtnTraining: '模型訓練中…',

    // Monitor View
    monitorTitle: '即時訓練監控',
    monitorSubtitle: '即時追蹤訓練與驗證損失、準確度變化與日誌串流',
    monitorCurrentEpoch: '目前進度',
    monitorLossChart: '損失收斂曲線',
    monitorMetricChart: '評估指標曲線',
    monitorLiveLogs: '即時訓練日誌',
    monitorBtnStop: '中斷訓練',

    // Export View
    exportTitle: '模型評估與匯出',
    exportSubtitle: '檢視混淆矩陣、進行單張影像測試並匯出 PTH 或 ONNX 模型',
    exportOnnxCardTitle: 'ONNX 跨平台匯出',
    exportOnnxCardDesc: '支援 TensorRT、OpenVINO 與 ONNX Runtime 邊緣推論引擎',
    exportPthCardTitle: 'PyTorch Checkpoint (.pth)',
    exportPthCardDesc: '包含完整模型結構與最佳驗證權重',
    exportBtnDownload: '匯出與下載',

    // Inference Station & API Server View
    inferenceTitle: '推論工作站',
    inferenceSubtitle: '連接本機攝影機或上傳影像，執行即時辨識、ROI 裁切與觸發規則檢查',
    inferenceFeedWebcam: '攝影機串流',
    inferenceFeedImage: '上傳圖片',
    inferenceFeedDataset: '專案樣本',
    inferenceBtnStartCamera: '開啟攝影機',
    inferenceBtnStopCamera: '關閉攝影機',
    inferenceConfThreshold: '信心度門檻',
    inferenceRoiCrop: 'ROI 關注區域',
    inferenceTriggerRules: '條件觸發規則',
    inferenceLatency: '推論延遲',
    inferenceFps: '即時幀率',
    apiServerTitle: '推論 API 伺服器',
    apiServerSubtitle: '提供標準 RESTful 端點供外部設備、測試腳本或產線整合串接',
    apiServerOnlineStatus: 'API 伺服器狀態',
    apiServerToggleBtn: '切換 API 服務狀態',
    apiServerDocLink: '開啟 Swagger API 文件',
    apiServerEndpointsTitle: '可用 API 端點',
    apiServerCodeSamplesTitle: '客戶端串接範例',
  },

  'en-US': {
    // Brand & General
    brandName: 'VisionForge',
    brandTagline: 'Local Vision Workstation',
    platformSubtitle: 'Local computer vision labeling, model training, and inference workstation',
    version: 'v1.0.0',
    online: 'Online',
    offline: 'Offline',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    confirm: 'Confirm',
    loading: 'Loading…',
    actions: 'Actions',
    status: 'Status',
    success: 'Success',
    error: 'Error',
    copy: 'Copy code',
    copied: 'Copied',
    download: 'Download',

    // Sidebar & Navigation
    trainingWorkspace: 'Training',
    trainingWorkspaceBadge: 'Training',
    inferenceWorkspace: 'Inference',
    inferenceWorkspaceBadge: 'Inference',
    navDashboard: 'Overview',
    navDataset: 'Dataset & Camera',
    navAnnotator: 'Annotation',
    navTrain: 'Model Training',
    navMonitor: 'Live Monitor',
    navExport: 'Evaluate & Export',
    navInferenceStation: 'Inference Station',
    navApiServer: 'API Server',
    navSettings: 'Settings',

    // Header
    selectOrCreateProject: 'Select or create project',
    switchProject: 'Switch project',
    noProjectsFound: 'No projects yet',
    createNewProject: 'New project',
    themeSelector: 'Appearance',
    themeAesthetics: 'Appearance',
    themeCountLabel: 'themes',
    languageSelector: 'Language',

    // Settings View
    settingsTitle: 'Settings & Diagnostics',
    settingsSubtitle: 'Language, appearance theme, backend status, compute device, and local storage',
    languageCardTitle: 'Interface Language',
    languageCardDesc: 'Choose the display language for the workstation interface',
    langZhTW: '繁體中文 (Traditional Chinese)',
    langEnUS: 'English (US)',
    themeCardTitle: 'Appearance Theme',
    themeCardDesc: '6 neutral-ramp themes (5 light, 1 dark), saved automatically',
    filterAll: 'All',
    filterLight: 'Light',
    filterDark: 'Dark',
    backendStatusTitle: 'Backend Service',
    connectionStatus: 'Connection',
    connOnline: 'Online (Connected)',
    connOffline: 'Offline (Disconnected)',
    pythonEnv: 'Python Runtime',
    osPlatform: 'Platform',
    gpuDiagTitle: 'Compute Device',
    cudaSupport: 'CUDA Support',
    cudaAvailable: 'CUDA acceleration enabled',
    cudaCpuOnly: 'CPU only (CUDA unavailable)',
    detectedComputeDevice: 'Detected Device',
    dataStorageTitle: 'Local Storage',
    dbType: 'Database',
    dbTypeValue: 'SQLite 3 (local file)',
    projectStoragePath: 'Project Directory',
    annotationCompatibility: 'Annotation Formats',

    // Dashboard View
    dashboardHeroTitleDefault: 'Local computer vision training and inference workstation',
    dashboardHeroSubtitleDefault: 'Organize datasets, annotate images, train GPU models, evaluate metrics, and deploy via camera or REST API locally.',
    dashboardHeroCurrentProject: 'Active project: ',
    dashboardHeroCurrentDesc: 'Dataset management, annotation, training, and ONNX export',
    dashboardBtnNewProject: 'New project',
    dashboardBtnGoDataset: 'Manage dataset',
    dashboardBtnGoTrain: 'Configure training',
    dashboardProjectsTitle: 'All projects',
    dashboardStatsTotalProjects: 'Total projects',
    dashboardStatsTotalImages: 'Dataset images',
    dashboardStatsActiveModels: 'Trained models',
    dashboardStatsGpuStatus: 'Compute device',
    dashboardRecentProjects: 'Recent projects',
    dashboardNoProjects: 'No projects yet',
    dashboardCreateFirstPrompt: 'Create a vision project to import images, label targets, and train a model',

    // Create Project Modal
    createProjectModalTitle: 'New project',
    createProjectNameLabel: 'Project name',
    createProjectNamePlaceholder: 'e.g., PCB_Defect_Detector',
    createProjectTaskLabel: 'Task type',
    createProjectDescLabel: 'Description (optional)',
    createProjectDescPlaceholder: 'Describe the inspection target or goal…',
    taskClassification: 'Classification',
    taskClassificationDesc: 'Assign one class label per image (Pass/NG, object type)',
    taskDetection: 'Object Detection',
    taskDetectionDesc: 'Locate multiple objects with bounding boxes (YOLO26, D-FINE)',
    taskRegression: 'Regression',
    taskRegressionDesc: 'Predict coordinates or continuous numerical values',
    btnCreateProject: 'Create project',

    // Dataset View
    datasetTitle: 'Dataset & Camera',
    datasetSubtitle: 'Import images or COCO / YOLO datasets, capture camera frames, and split subsets',
    datasetBtnUpload: 'Upload images',
    datasetBtnCamera: 'Camera capture',
    datasetBtnAugment: 'Augmentation',
    datasetBtnQuality: 'Quality check',
    datasetTotalImages: 'Total images',
    datasetLabeledImages: 'Labeled',
    datasetUnlabeledImages: 'Unlabeled',
    datasetClassDistribution: 'Class distribution',
    datasetFilterAll: 'All',
    datasetFilterLabeled: 'Labeled',
    datasetFilterUnlabeled: 'Unlabeled',
    datasetEmptyPrompt: 'No images yet. Upload images or capture from camera',

    // Annotation View
    annotationTitle: 'Annotation',
    annotationTools: 'Tools',
    annotationClasses: 'Class labels',
    annotationAddClass: 'Add class',
    annotationPrev: 'Prev (A)',
    annotationNext: 'Next (D)',
    annotationSave: 'Save (Ctrl+S)',
    annotationAutoSave: 'Auto-save on switch',
    annotationBoxCount: 'annotations',

    // Training View
    trainTitle: 'Model Training',
    trainSubtitle: 'Choose a preset, neural network architecture, and hyperparameters',
    trainPresetTitle: 'Training presets',
    trainPresetFast: 'Fast Check',
    trainPresetFastDesc: '5 epochs to validate dataset and pipeline',
    trainPresetBalanced: 'Balanced',
    trainPresetBalancedDesc: '20 epochs balancing training time and accuracy',
    trainPresetDeep: 'Extended',
    trainPresetDeepDesc: '50 epochs with cosine learning rate schedule',
    trainArchitectureLabel: 'Model architecture',
    trainEpochsLabel: 'Epochs',
    trainBatchSizeLabel: 'Batch size',
    trainLrLabel: 'Learning rate',
    trainOptimizerLabel: 'Optimizer',
    trainBtnStart: 'Start training',
    trainBtnTraining: 'Training in progress…',

    // Monitor View
    monitorTitle: 'Live Training Monitor',
    monitorSubtitle: 'Track train/validation loss, evaluation metrics, and real-time logs',
    monitorCurrentEpoch: 'Progress',
    monitorLossChart: 'Loss convergence',
    monitorMetricChart: 'Evaluation metrics',
    monitorLiveLogs: 'Training terminal log',
    monitorBtnStop: 'Stop training',

    // Export View
    exportTitle: 'Evaluation & Export',
    exportSubtitle: 'Review confusion matrix, test single images, and export PTH or ONNX weights',
    exportOnnxCardTitle: 'ONNX Export',
    exportOnnxCardDesc: 'Export for TensorRT, OpenVINO, and ONNX Runtime deployment',
    exportPthCardTitle: 'PyTorch Checkpoint (.pth)',
    exportPthCardDesc: 'Native model state dict and best validation checkpoint',
    exportBtnDownload: 'Export & Download',

    // Inference Station & API Server View
    inferenceTitle: 'Inference Station',
    inferenceSubtitle: 'Run live camera or image inference with ROI filtering and trigger rules',
    inferenceFeedWebcam: 'Webcam stream',
    inferenceFeedImage: 'Upload image',
    inferenceFeedDataset: 'Project sample',
    inferenceBtnStartCamera: 'Start camera',
    inferenceBtnStopCamera: 'Stop camera',
    inferenceConfThreshold: 'Confidence threshold',
    inferenceRoiCrop: 'Region of interest',
    inferenceTriggerRules: 'Trigger rules',
    inferenceLatency: 'Latency',
    inferenceFps: 'FPS',
    apiServerTitle: 'Inference API Server',
    apiServerSubtitle: 'Local REST endpoints for equipment, test scripts, and line integration',
    apiServerOnlineStatus: 'API Server Status',
    apiServerToggleBtn: 'Toggle API Server',
    apiServerDocLink: 'Open Swagger API Docs',
    apiServerEndpointsTitle: 'Available Endpoints',
    apiServerCodeSamplesTitle: 'Client Code Samples',
  },
};
