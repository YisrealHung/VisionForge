import json
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from backend.app.models.inference import (
    InferenceRequestBase64,
    InferenceBatchRequest,
    InferenceResponse,
    InferenceBatchResponse,
    ApiServerStatus,
    RoiBox,
)
from backend.app.services.inference_service import InferenceService

router = APIRouter(prefix="/inference", tags=["Inference API Server & Station"])

@router.post("/predict", response_model=InferenceResponse)
def predict_base64_endpoint(request: InferenceRequestBase64):
    """Run single-image prediction via Base64 payload with optional ROI and trigger rules."""
    try:
        return InferenceService.predict_base64(request)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/predict-form", response_model=InferenceResponse)
async def predict_form_endpoint(
    file: UploadFile = File(...),
    model_id: Optional[str] = Form(None),
    roi_json: Optional[str] = Form(None)
):
    """Run prediction via Multipart Form upload with optional ROI."""
    try:
        image_bytes = await file.read()
        roi = None
        if roi_json:
            try:
                roi_dict = json.loads(roi_json)
                roi = RoiBox(**roi_dict)
            except Exception:
                pass
        return InferenceService.predict_form(image_bytes, model_id=model_id, roi=roi)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/batch", response_model=InferenceBatchResponse)
def predict_batch_endpoint(request: InferenceBatchRequest):
    """Run high-throughput parallel batch prediction across multiple images."""
    try:
        return InferenceService.predict_batch(request)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/status", response_model=ApiServerStatus)
def get_inference_api_status():
    """Get real-time status of the local inference API server."""
    return InferenceService.get_status()

@router.post("/toggle", response_model=ApiServerStatus)
def toggle_inference_api(enable: Optional[bool] = None):
    """Toggle local inference API server online/offline status."""
    return InferenceService.toggle_server(enable)
