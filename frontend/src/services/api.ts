import { 
  Project, 
  ProjectCreateInput, 
  SystemHealth, 
  ImageItem, 
  CategoryItem, 
  ImageAnnotationData, 
  DatasetSplitRequest, 
  TrainConfigRequest, 
  TrainingStatus,
  TrainedModelInfo,
  ModelExportInfo,
  ConfusionMatrixData,
  PredictionResponse,
  OnnxExportRequest,
  OnnxExportResponse,
  InferenceRequestBase64,
  InferenceResponse,
  InferenceBatchRequest,
  InferenceBatchResponse,
  ApiServerStatus,
  RoiBox,
} from '../types';

const API_BASE = '/api';

export const api = {
  // System
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const res = await fetch(`${API_BASE}/system/health`);
      if (!res.ok) throw new Error('Health check failed');
      return await res.json();
    } catch {
      return {
        status: 'offline',
        app_name: 'VisionForge AI Studio',
        version: '1.0.0',
        python_version: 'Unknown',
        platform: 'Unknown',
        gpu: { available: false, device: 'Backend Offline' }
      };
    }
  },

  // Projects
  async listProjects(): Promise<Project[]> {
    const res = await fetch(`${API_BASE}/projects`);
    if (!res.ok) throw new Error('Failed to load projects');
    return await res.json();
  },

  async getActiveProject(): Promise<Project | null> {
    const res = await fetch(`${API_BASE}/projects/active`);
    if (!res.ok) return null;
    return await res.json();
  },

  async createProject(input: ProjectCreateInput): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Creation failed' }));
      throw new Error(err.detail || 'Failed to create project');
    }
    return await res.json();
  },

  async activateProject(projectId: string): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/activate`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to activate project');
    return await res.json();
  },

  async deleteProject(projectId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/projects/${projectId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete project');
  },

  // Dataset
  async listImages(projectId: string): Promise<ImageItem[]> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/images`);
    if (!res.ok) throw new Error('Failed to list images');
    return await res.json();
  },

  async uploadImages(projectId: string, files: File[]): Promise<ImageItem[]> {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    const res = await fetch(`${API_BASE}/projects/${projectId}/images/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return await res.json();
  },

  async deleteImage(projectId: string, filename: string): Promise<void> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/images/${filename}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete image');
  },

  async splitDataset(projectId: string, splitReq: DatasetSplitRequest): Promise<{ train: number; val: number; test: number }> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/dataset/split`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(splitReq),
    });
    if (!res.ok) throw new Error('Split failed');
    return await res.json();
  },

  async importDataset(projectId: string, files: File[]): Promise<{ success: boolean; imported_images: number; imported_annotations: number; total_images: number }> {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    const res = await fetch(`${API_BASE}/projects/${projectId}/dataset/import`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Import failed' }));
      throw new Error(err.detail || 'Import failed');
    }
    return await res.json();
  },

  getDatasetExportUrl(projectId: string): string {
    return `${API_BASE}/projects/${projectId}/dataset/export`;
  },

  // Annotations & Categories
  async getCategories(projectId: string): Promise<CategoryItem[]> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/annotations/categories`);
    if (!res.ok) return [];
    return await res.json();
  },

  async addCategory(projectId: string, name: string, color?: string): Promise<CategoryItem> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/annotations/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color }),
    });
    if (!res.ok) throw new Error('Failed to add category');
    return await res.json();
  },

  async deleteCategory(projectId: string, categoryId: number): Promise<void> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/annotations/categories/${categoryId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete category');
  },

  async getImageAnnotations(projectId: string, imageId: string): Promise<ImageAnnotationData> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/annotations/images/${imageId}`);
    if (!res.ok) return { image_id: imageId, annotations: [] };
    return await res.json();
  },

  async saveImageAnnotations(projectId: string, imageId: string, data: ImageAnnotationData): Promise<ImageAnnotationData> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/annotations/images/${imageId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save annotations');
    return await res.json();
  },

  async batchAssignCategory(projectId: string, imageIds: string[], categoryId: number): Promise<{ success: boolean; count: number }> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/annotations/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_ids: imageIds, category_id: categoryId }),
    });
    if (!res.ok) throw new Error('Failed to batch assign category');
    return await res.json();
  },

  // Training Engine
  async startTraining(projectId: string, config: TrainConfigRequest): Promise<TrainingStatus> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/train/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to start training' }));
      throw new Error(err.detail || 'Failed to start training');
    }
    return await res.json();
  },

  async stopTraining(projectId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/train/stop`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to stop training');
  },

  async getTrainingStatus(projectId: string): Promise<TrainingStatus> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/train/status`);
    if (!res.ok) throw new Error('Failed to get training status');
    return await res.json();
  },

  async getTrainedModels(projectId: string): Promise<TrainedModelInfo[]> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/train/trained-models`);
    if (!res.ok) throw new Error('Failed to get trained models');
    return await res.json();
  },

  async selectTrainedModel(projectId: string, architecture: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/train/trained-models/${architecture}/select`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to select model' }));
      throw new Error(err.detail || 'Failed to select model');
    }
    return await res.json();
  },

  async deleteTrainedModel(projectId: string, architecture: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/train/trained-models/${architecture}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to delete model' }));
      throw new Error(err.detail || 'Failed to delete model');
    }
    return await res.json();
  },

  // Model Export & Evaluation
  async getModelExportInfo(projectId: string): Promise<ModelExportInfo> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/export/info`);
    if (!res.ok) throw new Error('Failed to load model export info');
    return await res.json();
  },

  async evaluateModel(projectId: string): Promise<ConfusionMatrixData> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/export/evaluate`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Evaluation failed' }));
      throw new Error(err.detail || 'Evaluation failed');
    }
    return await res.json();
  },

  async predictImage(projectId: string, file: File): Promise<PredictionResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/projects/${projectId}/export/predict`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Prediction failed' }));
      throw new Error(err.detail || 'Prediction failed');
    }
    return await res.json();
  },

  async exportOnnx(projectId: string, req: OnnxExportRequest): Promise<OnnxExportResponse> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/export/onnx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'ONNX export failed' }));
      throw new Error(err.detail || 'ONNX export failed');
    }
    return await res.json();
  },

  getOnnxDownloadUrl(projectId: string): string {
    return `${API_BASE}/projects/${projectId}/export/download`;
  },

  getPthDownloadUrl(projectId: string): string {
    return `${API_BASE}/projects/${projectId}/export/download/pth`;
  },

  // Inference Station & API Server
  async inferencePredict(req: InferenceRequestBase64): Promise<InferenceResponse> {
    const res = await fetch(`${API_BASE}/inference/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Inference failed' }));
      throw new Error(err.detail || 'Inference failed');
    }
    return await res.json();
  },

  async inferencePredictForm(file: File, modelId?: string, roi?: RoiBox | null): Promise<InferenceResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (modelId) formData.append('model_id', modelId);
    if (roi) formData.append('roi_json', JSON.stringify(roi));

    const res = await fetch(`${API_BASE}/inference/predict-form`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Form inference failed' }));
      throw new Error(err.detail || 'Form inference failed');
    }
    return await res.json();
  },

  async inferenceBatch(req: InferenceBatchRequest): Promise<InferenceBatchResponse> {
    const res = await fetch(`${API_BASE}/inference/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Batch inference failed' }));
      throw new Error(err.detail || 'Batch inference failed');
    }
    return await res.json();
  },

  async getApiServerStatus(): Promise<ApiServerStatus> {
    const res = await fetch(`${API_BASE}/inference/status`);
    if (!res.ok) throw new Error('Failed to get API server status');
    return await res.json();
  },

  async toggleApiServer(enable?: boolean): Promise<ApiServerStatus> {
    const url = enable !== undefined ? `${API_BASE}/inference/toggle?enable=${enable}` : `${API_BASE}/inference/toggle`;
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to toggle API server');
    return await res.json();
  }
};
