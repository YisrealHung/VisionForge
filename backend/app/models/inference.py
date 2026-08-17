from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class RoiBox(BaseModel):
    # Normalized coordinates 0.0 to 1.0 (or pixel values if > 1)
    x: float = 0.0
    y: float = 0.0
    width: float = 1.0
    height: float = 1.0

class TriggerRule(BaseModel):
    id: str
    class_name: str
    min_confidence: float = 10.0  # 0 to 100%
    enabled: bool = True
    action_type: str = "alert"  # alert, webhook, mqtt
    condition_type: str = "present"  # 'present' (只要出現 >= 1), 'count_gte' (數量 >= N), 'absent' (未偵測到/缺件)
    min_count: int = 1  # 數量條件

class InferenceResultItem(BaseModel):
    label: str
    confidence: float  # 0.0 ~ 100.0%
    probability: float  # 0.0 ~ 1.0
    bbox: Optional[List[float]] = None  # [x, y, w, h] normalized 0.0 ~ 1.0 (relative to canvas)

class InferenceRequestBase64(BaseModel):
    model_id: Optional[str] = None  # project_id
    architecture: Optional[str] = None  # specific model architecture (e.g. dfine_n, yolo26_s, ssdlite_mobilenet_v3)
    image_base64: str
    roi: Optional[RoiBox] = None
    trigger_rules: Optional[List[TriggerRule]] = None

class InferenceBatchRequest(BaseModel):
    model_id: Optional[str] = None
    architecture: Optional[str] = None
    images_base64: List[str]

class TriggerEvent(BaseModel):
    timestamp: str
    rule_id: str
    rule_name: str
    class_name: str
    confidence: float
    message: str
    count: int = 1

class InferenceResponse(BaseModel):
    success: bool
    inference_time_ms: float
    top_label: str
    top_confidence: float
    predictions: List[InferenceResultItem]
    model_architecture: Optional[str] = None
    roi_applied: bool = False
    trigger_matched: bool = False
    triggered_events: List[TriggerEvent] = []
    timestamp: str

class InferenceBatchResponse(BaseModel):
    success: bool
    total_images: int
    total_time_ms: float
    avg_time_ms: float
    results: List[InferenceResponse]

class ApiServerStatus(BaseModel):
    is_running: bool = True
    port: int = 8000
    endpoint_url: str = "http://127.0.0.1:8000/api/inference/predict"
    total_requests: int = 0
    avg_latency_ms: float = 0.0
    loaded_model: Optional[str] = None
    uptime_seconds: float = 0.0
