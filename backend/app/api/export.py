from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse

from backend.app.core.config import settings
from backend.app.models.export import (
    ModelInfoResponse,
    ConfusionMatrixData,
    PredictionResponse,
    OnnxExportRequest,
    OnnxExportResponse,
)
from backend.app.models.gradcam import GradCamResponse
from backend.app.services.export_service import ExportService
from backend.app.services.gradcam_service import GradCamService

router = APIRouter(prefix="/projects/{project_id}/export", tags=["Model Export & Evaluation"])

@router.get("/info", response_model=ModelInfoResponse)
def get_export_model_info(project_id: str):
    """Get current project trained model info and export status."""
    try:
        return ExportService.get_model_info(project_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/evaluate", response_model=ConfusionMatrixData)
def evaluate_model(project_id: str):
    """Run evaluation on validation/test split and generate confusion matrix."""
    try:
        return ExportService.evaluate_model(project_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/predict", response_model=PredictionResponse)
async def predict_single_image(project_id: str, file: UploadFile = File(...)):
    """Run interactive single-image classification test."""
    try:
        contents = await file.read()
        return ExportService.predict_image(project_id, contents)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/gradcam", response_model=GradCamResponse)
async def generate_gradcam(project_id: str, file: UploadFile = File(...)):
    """Generate Grad-CAM attention heatmap for an uploaded image."""
    try:
        contents = await file.read()
        return GradCamService.generate_gradcam(project_id, contents)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/onnx", response_model=OnnxExportResponse)
def export_model_to_onnx(project_id: str, request: OnnxExportRequest):
    """Convert PyTorch checkpoint to standard ONNX model format."""
    try:
        return ExportService.export_to_onnx(project_id, request)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/download")
def download_onnx_model(project_id: str):
    """Download exported ONNX model binary file."""
    info = ExportService.get_model_info(project_id)
    if not info.onnx_exported or not info.onnx_path:
        raise HTTPException(status_code=404, detail="ONNX 模型尚未匯出，請先點擊一鍵匯出")
    
    file_path = Path(info.onnx_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="找不到 ONNX 模型檔案")

    filename = f"{info.architecture}_best.onnx"
    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type="application/octet-stream"
    )

@router.get("/download/pth")
def download_pth_model(project_id: str):
    """Download trained PyTorch checkpoint (.pth / .pt) binary file."""
    info = ExportService.get_model_info(project_id)
    if not info.checkpoint_exists:
        raise HTTPException(status_code=404, detail="PyTorch 權重檔尚未生成，請先完成模型訓練")

    project_dir = settings.PROJECTS_DIR / project_id
    ckpt_dir = project_dir / "models" / "checkpoints"
    
    # Priority: {architecture}_best.pt -> best.pt -> last.pt
    file_path = ckpt_dir / f"{info.architecture}_best.pt"
    if not file_path.exists():
        file_path = ckpt_dir / "best.pt"
    if not file_path.exists():
        file_path = ckpt_dir / "last.pt"

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="找不到 PyTorch 權重檔案")

    filename = f"{info.architecture}_best.pth"
    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type="application/octet-stream"
    )
