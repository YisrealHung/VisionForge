from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ModelInfoResponse(BaseModel):
    project_id: str
    architecture: str
    classes: List[str]
    num_classes: int
    checkpoint_exists: bool
    checkpoint_size_bytes: int = 0
    checkpoint_size_str: str = "0 MB"
    best_val_acc: float = 0.0
    total_epochs_trained: int = 0
    onnx_exported: bool = False
    onnx_path: Optional[str] = None
    onnx_size_bytes: int = 0
    onnx_size_str: str = "0 MB"
    estimated_latency_ms: float = 15.0

class PerClassMetric(BaseModel):
    category_name: str
    precision: float
    recall: float
    f1_score: float
    support: int

class ConfusionMatrixData(BaseModel):
    labels: List[str]
    matrix: List[List[int]]  # matrix[actual_idx][predicted_idx]
    per_class_metrics: List[PerClassMetric]
    overall_accuracy: float
    total_samples: int

class PredictionItem(BaseModel):
    label: str
    confidence: float  # 0.0 to 100.0%
    probability: float  # 0.0 to 1.0

class PredictionResponse(BaseModel):
    top_label: str
    top_confidence: float
    predictions: List[PredictionItem]
    inference_time_ms: float

class OnnxExportRequest(BaseModel):
    opset_version: int = Field(default=14, ge=11, le=18)
    dynamic_batch: bool = True
    image_size: int = Field(default=640, ge=128, le=1280)

class OnnxExportResponse(BaseModel):
    success: bool
    onnx_path: str
    file_size_bytes: int
    file_size_str: str
    opset_version: int
    message: str
