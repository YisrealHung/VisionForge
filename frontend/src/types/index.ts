export type TaskType = 'classification' | 'detection' | 'regression' | 'feature';

export interface Project {
  id: string;
  name: string;
  description?: string;
  task_type: TaskType;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  status: string;
  dataset_count: number;
  model_count: number;
}

export interface ProjectCreateInput {
  name: string;
  description?: string;
  task_type: TaskType;
}

export interface SystemHealth {
  status: 'online' | 'offline';
  app_name: string;
  version: string;
  python_version: string;
  platform: string;
  gpu: {
    available: boolean;
    device: string;
  };
}

export interface ImageItem {
  id: string;
  filename: string;
  width: number;
  height: number;
  size_bytes: number;
  url: string;
  split: string; // 'train' | 'val' | 'test' | 'unassigned'
  labeled: boolean;
  annotation_count: number;
  created_at: string;
}

export interface CategoryItem {
  id: number;
  name: string;
  color: string;
  supercategory?: string;
}

export interface AnnotationItem {
  id: string;
  image_id: string;
  category_id: number;
  category_name?: string;
  bbox: [number, number, number, number]; // [x, y, width, height]
  area?: number;
  is_crowd?: number;
}

export interface ImageAnnotationData {
  image_id: string;
  annotations: AnnotationItem[];
  tags?: string[];
}

export interface DatasetSplitRequest {
  train_ratio: number;
  val_ratio: number;
  test_ratio: number;
}

export type ModelArchitecture = 
  // Object Detection
  | 'yolo26_n'
  | 'yolo26_s'
  | 'yolo26_m'
  | 'yolo26_l'
  | 'dfine_n'
  | 'dfine_s'
  | 'dfine_l'
  | 'ssdlite_mobilenet_v3'
  // Classification
  | 'resnet18'
  | 'resnet50'
  | 'efficientnet_b0'
  | 'mobilenet_v3_small'
  | 'convnext_tiny'
  | 'vit_b16'
  | 'custom_cnn'
  // Regression
  | 'resnet18_reg'
  | 'resnet50_reg'
  | 'efficientnet_b0_reg'
  | 'mobilenet_v3_reg'
  // Feature Identification
  | 'resnet50_fpn'
  | 'hrnet_w18'
  | 'swin_tiny'
  | 'vit_feature';

export type OptimizerType = 'adamw' | 'sgd' | 'adam';
export type PresetType = 'fast' | 'balanced' | 'accurate' | 'custom';

export interface Hyperparameters {
  architecture: ModelArchitecture;
  epochs: number;
  batch_size: number;
  learning_rate: number;
  optimizer: OptimizerType;
  pretrained: boolean;
  image_size: number;
  early_stopping_patience: number;
}

export interface AugmentationConfig {
  random_flip: boolean;
  random_rotation: boolean;
  color_jitter: boolean;
  random_crop: boolean;
  mosaic?: boolean;
}

export interface TrainConfigRequest {
  preset: PresetType;
  hyperparameters: Hyperparameters;
  augmentation: AugmentationConfig;
}

export interface EpochMetric {
  epoch: number;
  total_epochs: number;
  train_loss: number;
  train_acc: number;
  val_loss: number;
  val_acc: number;
  epoch_duration_sec: number;
  best_val_acc: number;
  eta_sec: number;
  lr: number;
}

export interface TrainingStatus {
  project_id: string;
  status: 'idle' | 'training' | 'completed' | 'failed' | 'stopped';
  current_epoch: number;
  total_epochs: number;
  history: EpochMetric[];
  best_val_acc: number;
  start_time?: string;
  end_time?: string;
  error_message?: string;
  model_architecture?: string;
  weights_path?: string;
  logs?: string[];
}

export type ActiveWorkspace = 'training' | 'inference';

export type NavView = 
  // Training Section
  | 'dashboard'
  | 'dataset'
  | 'annotator'
  | 'train'
  | 'monitor'
  | 'export'
  | 'model_arena'
  // Inference Section
  | 'inference_station'
  | 'api_server'
  // System
  | 'settings';

// Model Export & Evaluation Types
export interface ModelExportInfo {
  project_id: string;
  architecture: string;
  classes: string[];
  num_classes: number;
  checkpoint_exists: boolean;
  checkpoint_size_bytes: number;
  checkpoint_size_str: string;
  best_val_acc: number;
  total_epochs_trained: number;
  onnx_exported: boolean;
  onnx_path?: string;
  onnx_size_bytes: number;
  onnx_size_str: string;
  estimated_latency_ms: number;
}

export interface PerClassMetric {
  category_name: string;
  precision: number;
  recall: number;
  f1_score: number;
  support: number;
}

export interface ConfusionMatrixData {
  labels: string[];
  matrix: number[][]; // matrix[actual][predicted]
  per_class_metrics: PerClassMetric[];
  overall_accuracy: number;
  total_samples: number;
}

export interface PredictionItem {
  label: string;
  confidence: number; // 0.0 ~ 100.0%
  probability: number;
}

export interface PredictionResponse {
  top_label: string;
  top_confidence: number;
  predictions: PredictionItem[];
  inference_time_ms: number;
}

export interface OnnxExportRequest {
  opset_version: number;
  dynamic_batch: boolean;
  image_size?: number;
}

export interface OnnxExportResponse {
  success: boolean;
  onnx_path: string;
  file_size_bytes: number;
  file_size_str: string;
  opset_version: number;
  message: string;
}

// Inference Station & API Server Types
export interface RoiBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TriggerRule {
  id: string;
  class_name: string;
  min_confidence: number;
  enabled: boolean;
  action_type?: string;
  condition_type?: 'present' | 'count_gte' | 'absent';
  min_count?: number;
}

export interface TriggerEvent {
  timestamp: string;
  rule_id: string;
  rule_name: string;
  class_name: string;
  confidence: number;
  message: string;
  count?: number;
}

export interface InferenceResultItem {
  label: string;
  confidence: number;
  probability: number;
  bbox?: number[] | null; // [x, y, w, h] normalized 0.0 ~ 1.0
}

export interface TrainedModelInfo {
  architecture: string;
  name: string;
  task_type: string;
  best_val_acc: number;
  total_epochs: number;
  trained_at?: string;
  checkpoint_file: string;
  checkpoint_size_str: string;
  classes: string[];
  is_latest: boolean;
}

export interface InferenceRequestBase64 {
  model_id?: string;
  architecture?: string;
  image_base64: string;
  roi?: RoiBox | null;
  trigger_rules?: TriggerRule[];
}

export interface InferenceResponse {
  success: boolean;
  inference_time_ms: number;
  top_label: string;
  top_confidence: number;
  predictions: InferenceResultItem[];
  model_architecture?: string;
  roi_applied: boolean;
  trigger_matched: boolean;
  triggered_events: TriggerEvent[];
  timestamp: string;
}

export interface InferenceBatchRequest {
  model_id?: string;
  images_base64: string[];
}

export interface InferenceBatchResponse {
  success: boolean;
  total_images: number;
  total_time_ms: number;
  avg_time_ms: number;
  results: InferenceResponse[];
}

export interface ApiServerStatus {
  is_running: boolean;
  port: number;
  endpoint_url: string;
  total_requests: number;
  avg_latency_ms: number;
  loaded_model?: string;
  uptime_seconds: number;
}

export type AppTheme = 
  | 'dark'
  | 'light'
  | 'nordic-frost'
  | 'ocean-slate'
  | 'lavender-mist'
  | 'matcha-pistachio'
  | 'cyber-neon'
  | 'forest-emerald'
  | 'midnight-amethyst'
  | 'sunset-amber';

export interface ThemeDefinition {
  id: AppTheme;
  name: string;
  nameEn: string;
  subtitle: string;
  category: 'palette' | 'classic' | 'recommended';
  categoryLabel: string;
  mode: 'dark' | 'light';
  palette: string[];
  bgSample: string;
  cardSample: string;
  accentSample: string;
  description: string;
  tag?: string;
}

export const THEME_REGISTRY: ThemeDefinition[] = [
  // --- 色票特調 (User Palette Derived) ---
  {
    id: 'nordic-frost',
    name: '極光冰川',
    nameEn: 'Nordic Frost',
    subtitle: '澄澈晨曦 · 北歐冷岩',
    category: 'palette',
    categoryLabel: '色票特調',
    mode: 'light',
    palette: ['#6BBCCF', '#6EA4D2', '#7388A3', '#D9E8E5', '#F9F9F1'],
    bgSample: '#f3f7fa',
    cardSample: '#ffffff',
    accentSample: '#299bb6',
    description: '使用象牙白底與青藍海調，如晨曦初升時覆蓋薄霜的北歐冰川，清爽理性。',
    tag: '系統預設',
  },
  {
    id: 'ocean-slate',
    name: '蔚藍深海',
    nameEn: 'Ocean Slate',
    subtitle: '深邃海藍 · 冰晶高光',
    category: 'palette',
    categoryLabel: '色票特調',
    mode: 'dark',
    palette: ['#4EC3DA', '#6EA4D2', '#8B9DC5', '#7388A3', '#0C131C'],
    bgSample: '#0c131c',
    cardSample: '#131e2c',
    accentSample: '#4ec3da',
    description: '沉靜的深邃海洋基底，點綴耀眼的冰晶青藍與天青光澤，專注且科技感十足。',
    tag: '色票精選',
  },
  {
    id: 'lavender-mist',
    name: '薰衣草霧',
    nameEn: 'Lavender Mist',
    subtitle: '紫藤晨露 · 珍珠粉霧',
    category: 'palette',
    categoryLabel: '色票特調',
    mode: 'light',
    palette: ['#7164B3', '#8B9DC5', '#BCC6DF', '#E9E7F5', '#F6F5FB'],
    bgSample: '#f6f5fb',
    cardSample: '#ffffff',
    accentSample: '#7164b3',
    description: '融合柔紫珍珠雲霧與薰衣草藍灰，法式優雅而溫潤柔和，長時間瀏覽不疲倦。',
    tag: '色票精選',
  },
  {
    id: 'matcha-pistachio',
    name: '抹茶開心果',
    nameEn: 'Matcha Pistachio',
    subtitle: '青檸晨露 · 開心果奶霜',
    category: 'palette',
    categoryLabel: '色票特調',
    mode: 'light',
    palette: ['#728D22', '#D9E59B', '#F5F0C6', '#6BBCCF', '#F8F8F0'],
    bgSample: '#f8f8f0',
    cardSample: '#ffffff',
    accentSample: '#728d22',
    description: '充滿自然生機的抹茶青檸與奶油香草調和，點綴清涼薄荷青，清新活潑。',
    tag: '色票精選',
  },

  // --- 經典工坊系列 (Artisanal Classic) ---
  {
    id: 'dark',
    name: '煙燻暖岩',
    nameEn: 'Smoky Slate',
    subtitle: '珊瑚夕照 · 沉穩岩灰',
    category: 'classic',
    categoryLabel: '經典工坊',
    mode: 'dark',
    palette: ['#EB7E83', '#E1998A', '#B88F89', '#557B86', '#141217'],
    bgSample: '#141217',
    cardSample: '#1c1921',
    accentSample: '#EB7E83',
    description: '手作工坊溫潤岩灰底蘊，交織夕照珊瑚與陶土粉桃，預設深色護眼風格。',
    tag: '預設深色',
  },
  {
    id: 'light',
    name: '溫潤燕麥',
    nameEn: 'Warm Oat & Paper',
    subtitle: '亞麻柔白 · 雜誌質感',
    category: 'classic',
    categoryLabel: '經典工坊',
    mode: 'light',
    palette: ['#DB666C', '#CF7C6A', '#A17872', '#436A75', '#F9F6F4'],
    bgSample: '#f9f6f4',
    cardSample: '#ffffff',
    accentSample: '#db666c',
    description: '溫潤亞麻纖維底質，搭配溫和暖珊瑚紅，如高檔設計刊物般的通透質感。',
    tag: '預設淺色',
  },

  // --- 專業推薦系列 (Curated Recommendations) ---
  {
    id: 'cyber-neon',
    name: '賽博霓虹',
    nameEn: 'Cyber Midnight',
    subtitle: '矩陣極夜 · 電光青光',
    category: 'recommended',
    categoryLabel: '推薦主題',
    mode: 'dark',
    palette: ['#00F0FF', '#7928CA', '#FF007F', '#00FF9D', '#08090D'],
    bgSample: '#08090d',
    cardSample: '#0f121b',
    accentSample: '#00f0ff',
    description: '黑洞級純黑極夜與高飽和電光霓虹青，極致對比度與未來科幻視覺衝擊。',
    tag: '極致對比',
  },
  {
    id: 'forest-emerald',
    name: '深林翡翠',
    nameEn: 'Forest Emerald',
    subtitle: '幽境松綠 · 璀璨晨露',
    category: 'recommended',
    categoryLabel: '推薦主題',
    mode: 'dark',
    palette: ['#10B981', '#34D399', '#D9E59B', '#6BBCCF', '#09120E'],
    bgSample: '#09120e',
    cardSample: '#101c17',
    accentSample: '#10b981',
    description: '深邃幽靜的林間松綠，點綴璀璨翡翠與晨露薄荷光暈，低奢且極致護眼。',
    tag: '自然護眼',
  },
  {
    id: 'midnight-amethyst',
    name: '暗夜紫晶',
    nameEn: 'Midnight Amethyst',
    subtitle: '浩瀚星河 · 夢幻幻境',
    category: 'recommended',
    categoryLabel: '推薦主題',
    mode: 'dark',
    palette: ['#A855F7', '#C084FC', '#F472B6', '#8B9DC5', '#0F0B18'],
    bgSample: '#0f0b18',
    cardSample: '#171124',
    accentSample: '#a855f7',
    description: '黑曜夜幕中閃耀的神祕紫晶光澤，融合星雲粉與柔光霧藍，夢幻且深具張力。',
    tag: '星空奢華',
  },
  {
    id: 'sunset-amber',
    name: '暖金暮光',
    nameEn: 'Sunset Amber',
    subtitle: '焦糖琥珀 · 奢華溫金',
    category: 'recommended',
    categoryLabel: '推薦主題',
    mode: 'dark',
    palette: ['#F59E0B', '#FBBF24', '#EA580C', '#F5F0C6', '#140F0A'],
    bgSample: '#140f0a',
    cardSample: '#1c160f',
    accentSample: '#f59e0b',
    description: '溫潤深沉的黑咖啡與烘焙橡木表面，映襯香檳暖金與日暮琥珀微光。',
    tag: '暖金奢華',
  },
];


