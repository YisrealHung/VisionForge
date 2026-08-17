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


