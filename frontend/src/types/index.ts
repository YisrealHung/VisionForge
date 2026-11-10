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
  architecture?: string;
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
  | 'maker-studio'
  | 'harbor-studio'
  | 'forest-studio'
  | 'coral-studio'
  | 'berry-studio'
  | 'midnight-studio'
  | 'vanilla-ice'
  | 'matcha-lilac'
  | 'sky-blossom'
  | 'mint-sakura'
  | 'spring-periwinkle'
  | 'bubblegum-cyan'
  | 'indigo-starlight'
  | 'amber-abyss'
  | 'lagoon-bloom'
  | 'cyber-pulse'
  | 'forest-orchid'
  | 'royal-amethyst';

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
  /** 'studio' = flat rounded layout with floating sidebar (sets <html data-layout="studio">). */
  layout?: 'studio';
}

export const THEME_REGISTRY: ThemeDefinition[] = [
  // --- 0. Maker Studio: flat, rounded, dark floating sidebar (restyles layout, not just colors) ---
  {
    id: 'maker-studio',
    name: '創客工作室',
    nameEn: 'Maker Studio',
    subtitle: '墨紫側欄 · 萊姆亮點',
    category: 'recommended',
    categoryLabel: '工作室',
    mode: 'light',
    layout: 'studio',
    palette: ['#F4F2FF', '#5B3FD9', '#C6F432'],
    bgSample: '#f4f2ff',
    cardSample: '#ffffff',
    accentSample: '#5b3fd9',
    description: '平面圓角卡片、深墨紫浮動側欄與萊姆綠「下一步」提示，清楚引導每個操作步驟，適合教學與初學者。',
    tag: '系統預設',
  },
  {
    id: 'harbor-studio',
    name: '海港工作室',
    nameEn: 'Harbor Studio',
    subtitle: '深海藍側欄 · 向日葵黃',
    category: 'recommended',
    categoryLabel: '工作室',
    mode: 'light',
    layout: 'studio',
    palette: ['#EEF5FB', '#0B6FB8', '#FFD43B'],
    bgSample: '#eef5fb',
    cardSample: '#ffffff',
    accentSample: '#0b6fb8',
    description: '沉穩海軍藍搭配明亮向日葵黃，專業清爽，適合產線與企業展示。',
    tag: '沉穩專業',
  },
  {
    id: 'forest-studio',
    name: '森林工作室',
    nameEn: 'Forest Studio',
    subtitle: '松林綠側欄 · 杏桃橘',
    category: 'recommended',
    categoryLabel: '工作室',
    mode: 'light',
    layout: 'studio',
    palette: ['#EFF5EE', '#1F7A4D', '#FFB347'],
    bgSample: '#eff5ee',
    cardSample: '#ffffff',
    accentSample: '#1f7a4d',
    description: '松林深綠與溫暖杏桃橘，自然穩定，長時間標註也不刺眼。',
    tag: '自然舒適',
  },
  {
    id: 'coral-studio',
    name: '珊瑚工作室',
    nameEn: 'Coral Studio',
    subtitle: '可可棕側欄 · 湖水綠',
    category: 'recommended',
    categoryLabel: '工作室',
    mode: 'light',
    layout: 'studio',
    palette: ['#FFF4EF', '#C2410C', '#66E3D9'],
    bgSample: '#fff4ef',
    cardSample: '#ffffff',
    accentSample: '#c2410c',
    description: '陶土珊瑚橘配湖水綠點綴，溫暖有活力，適合展示與教學活動。',
    tag: '溫暖活力',
  },
  {
    id: 'berry-studio',
    name: '莓果工作室',
    nameEn: 'Berry Studio',
    subtitle: '莓果紫紅側欄 · 芥末黃',
    category: 'recommended',
    categoryLabel: '工作室',
    mode: 'light',
    layout: 'studio',
    palette: ['#FFF0F6', '#C2255C', '#FCC419'],
    bgSample: '#fff0f6',
    cardSample: '#ffffff',
    accentSample: '#c2255c',
    description: '覆盆子莓果紅與芥末黃撞色，鮮明俏皮，讓介面更有個性。',
    tag: '俏皮撞色',
  },
  {
    id: 'midnight-studio',
    name: '午夜工作室',
    nameEn: 'Midnight Studio',
    subtitle: '深夜靛藍 · 萊姆亮點',
    category: 'recommended',
    categoryLabel: '工作室',
    mode: 'dark',
    layout: 'studio',
    palette: ['#121218', '#6E5CF0', '#C6F432'],
    bgSample: '#121218',
    cardSample: '#1c1c26',
    accentSample: '#6e5cf0',
    description: '工作室版型的深色版本，夜間或暗室操作推論工作站時更護眼。',
    tag: '深色版',
  },
  // --- 1. [#FFFFFF, #FFF2C9, #CBD7EF] ---
  {
    id: 'vanilla-ice',
    name: '香草冰藍',
    nameEn: 'Vanilla Mist',
    subtitle: '暖香奶油 · 冰霧晨曦',
    category: 'palette',
    categoryLabel: '柔雅淺色',
    mode: 'light',
    palette: ['#FFFFFF', '#FFF2C9', '#CBD7EF'],
    bgSample: '#f7f9fd',
    cardSample: '#ffffff',
    accentSample: '#4872b7',
    description: '以暖香草奶油與冰霧晨曦藍交織，純白基底澄淨溫潤，長時間專注不疲勞。',
    tag: '暖香澄淨',
  },
  // --- 2. [#FFFFFF, #EBFFC9, #E2CBFE] ---
  {
    id: 'matcha-lilac',
    name: '嫩綠丁香',
    nameEn: 'Pistachio Lilac',
    subtitle: '青檸嫩芽 · 夢幻丁香紫',
    category: 'palette',
    categoryLabel: '柔雅淺色',
    mode: 'light',
    palette: ['#FFFFFF', '#EBFFC9', '#E2CBFE'],
    bgSample: '#fafcf5',
    cardSample: '#ffffff',
    accentSample: '#7f4dc4',
    description: '青檸開心果嫩芽搭配夢幻丁香紫，清新活潑且富自然藝術氣息。',
    tag: '清新自然',
  },
  // --- 3. [#FFFFFF, #C9E0FF, #FECBCC] ---
  {
    id: 'sky-blossom',
    name: '晴空落櫻',
    nameEn: 'Sky Blossom',
    subtitle: '蔚藍晴空 · 柔櫻粉彩',
    category: 'palette',
    categoryLabel: '柔雅淺色',
    mode: 'light',
    palette: ['#FFFFFF', '#C9E0FF', '#FECBCC'],
    bgSample: '#f7faff',
    cardSample: '#ffffff',
    accentSample: '#3b7ad6',
    description: '蔚藍晴空映襯嬌嫩粉櫻，經典雙色柔和調，充滿通透空氣感。',
    tag: '經典',
  },
  // --- 4. [#FFFFFF, #C9FFF2, #FECBCC] ---
  {
    id: 'mint-sakura',
    name: '薄荷櫻雪',
    nameEn: 'Mint Sakura',
    subtitle: '清涼薄荷 · 嬌嫩櫻花',
    category: 'palette',
    categoryLabel: '柔雅淺色',
    mode: 'light',
    palette: ['#FFFFFF', '#C9FFF2', '#FECBCC'],
    bgSample: '#f5fdfb',
    cardSample: '#ffffff',
    accentSample: '#1b9a88',
    description: '清涼薄荷海風與蜜桃櫻花漸層，如初夏微風般沁人心脾。',
    tag: '清爽怡人',
  },
  // --- 5. [#FFFFFF, #E0FFC9, #CBD7FE] ---
  {
    id: 'spring-periwinkle',
    name: '初春長春花',
    nameEn: 'Spring Periwinkle',
    subtitle: '初春嫩芽 · 靜謐長春花藍',
    category: 'palette',
    categoryLabel: '柔雅淺色',
    mode: 'light',
    palette: ['#FFFFFF', '#E0FFC9', '#CBD7FE'],
    bgSample: '#f7fbf6',
    cardSample: '#ffffff',
    accentSample: '#4b61d1',
    description: '初春露水嫩綠與靜謐長春花藍紫，淡雅理性且富生機。',
    tag: '春日生機',
  },
  // --- 6. [#FFFFFF, #FFC9ED, #C8FCFE] ---
  {
    id: 'bubblegum-cyan',
    name: '糖霜青晶',
    nameEn: 'Bubblegum Cyan',
    subtitle: '甜心糖霜 · 晶瑩水藍',
    category: 'palette',
    categoryLabel: '柔雅淺色',
    mode: 'light',
    palette: ['#FFFFFF', '#FFC9ED', '#C8FCFE'],
    bgSample: '#f7fcfe',
    cardSample: '#ffffff',
    accentSample: '#189bb0',
    description: '甜心糖霜粉與晶瑩冰晶水藍，洋溢現代科技感與輕奢美學。',
    tag: '甜心晶瑩',
  },
  // --- 7. [#FFCEE3, #678EC9, #262277] ---
  {
    id: 'indigo-starlight',
    name: '星夜靛藍',
    nameEn: 'Indigo Starlight',
    subtitle: '星河粉櫻 · 鋼藍深空',
    category: 'palette',
    categoryLabel: '深邃暗夜',
    mode: 'dark',
    palette: ['#FFCEE3', '#678EC9', '#262277'],
    bgSample: '#0d0b24',
    cardSample: '#161338',
    accentSample: '#678EC9',
    description: '深邃靛藍極夜為底，鋼藍為階，星河櫻粉為點睛高光，沉穩優雅。',
    tag: '星夜深邃',
  },
  // --- 8. [#FFE28D, #FAC1A8, #13193D] ---
  {
    id: 'amber-abyss',
    name: '暮光極夜',
    nameEn: 'Amber Abyss',
    subtitle: '暖金暮光 · 蜜桃夜幕',
    category: 'palette',
    categoryLabel: '深邃暗夜',
    mode: 'dark',
    palette: ['#FFE28D', '#FAC1A8', '#13193D'],
    bgSample: '#090c1f',
    cardSample: '#101533',
    accentSample: '#FFE28D',
    description: '深海夜幕基底，融合暮光暖金與蜜桃珊瑚光暈，奢華典雅。',
    tag: '奢華暖金',
  },
  // --- 9. [#F9D2E4, #67C9B5, #007E79] ---
  {
    id: 'lagoon-bloom',
    name: '湖水青櫻',
    nameEn: 'Lagoon Bloom',
    subtitle: '碧波青翠 · 幽雅荷粉',
    category: 'palette',
    categoryLabel: '深邃暗夜',
    mode: 'dark',
    palette: ['#F9D2E4', '#67C9B5', '#007E79'],
    bgSample: '#031413',
    cardSample: '#072120',
    accentSample: '#67C9B5',
    description: '幽深松綠碧潭為底，浮水青翠薄荷與幽雅荷粉漸層相映。',
    tag: '碧波幽雅',
  },
  // --- 10. [#FF128D, #21A7CF, #D4FEFA] ---
  {
    id: 'cyber-pulse',
    name: '電光極光',
    nameEn: 'Cyber Pulse',
    subtitle: '霓虹電光 · 賽博青光',
    category: 'palette',
    categoryLabel: '深邃暗夜',
    mode: 'dark',
    palette: ['#FF128D', '#21A7CF', '#D4FEFA'],
    bgSample: '#090e14',
    cardSample: '#0f1822',
    accentSample: '#21A7CF',
    description: '矩陣電光洋紅與賽博青藍，高對比度極致科技衝擊感。',
    tag: '極致對比',
  },
  // --- 11. [#FEDFCB, #106816, #FCC2EB] ---
  {
    id: 'forest-orchid',
    name: '幽林蘭影',
    nameEn: 'Forest Orchid',
    subtitle: '幽深翠林 · 杏桃蘭影',
    category: 'palette',
    categoryLabel: '深邃暗夜',
    mode: 'dark',
    palette: ['#FEDFCB', '#106816', '#FCC2EB'],
    bgSample: '#061308',
    cardSample: '#0d2110',
    accentSample: '#34a840',
    description: '深林墨翠底蘊，映襯杏桃絲綢與蘭花粉紫，自然尊榮護眼。',
    tag: '自然護眼',
  },
  // --- 12. [#FEDFCB, #391A77, #FCC2EB] ---
  {
    id: 'royal-amethyst',
    name: '幻紫夜魅',
    nameEn: 'Royal Amethyst',
    subtitle: '尊貴皇家紫 · 柔桃粉紫',
    category: 'palette',
    categoryLabel: '深邃暗夜',
    mode: 'dark',
    palette: ['#FEDFCB', '#391A77', '#FCC2EB'],
    bgSample: '#0e061a',
    cardSample: '#1a0e2e',
    accentSample: '#9b5de5',
    description: '皇家宇宙深紫為底，搭配紫晶星雲與溫潤蜜桃光澤，神秘尊貴。',
    tag: '宇宙魅影',
  },
];




/** Language-neutral trigger-rule class name meaning "any class". */
export const ALL_CLASSES = '*';
const LEGACY_ALL_CLASSES = new Set([ALL_CLASSES, 'any', '全部類別', 'All Classes']);
export const isAllClasses = (name: string) => LEGACY_ALL_CLASSES.has(name);
