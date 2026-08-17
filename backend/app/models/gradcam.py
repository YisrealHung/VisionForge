from typing import List, Optional
from pydantic import BaseModel


class GradCamRegion(BaseModel):
    """A region of interest identified by Grad-CAM."""
    region_name: str
    contribution_pct: float  # 0.0 ~ 100.0


class GradCamResponse(BaseModel):
    """Grad-CAM analysis result."""
    success: bool = True
    original_image_b64: str  # base64 PNG
    heatmap_overlay_b64: str  # base64 PNG (heatmap on original)
    heatmap_only_b64: str  # base64 PNG (only heatmap)
    predicted_label: str
    predicted_confidence: float
    top_regions: List[GradCamRegion] = []
    inference_time_ms: float = 0.0
    message: str = ""
