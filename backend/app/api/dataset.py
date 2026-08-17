from typing import List, Dict, Any
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse

from backend.app.core.config import settings
from backend.app.models.dataset import ImageItem, DatasetSplitRequest
from backend.app.services.dataset_service import DatasetService

router = APIRouter(prefix="/projects/{project_id}", tags=["Dataset"])

@router.get("/images", response_model=List[ImageItem])
def list_images(project_id: str):
    """List all images in the project dataset."""
    return DatasetService.list_images(project_id)

@router.post("/images/upload", response_model=List[ImageItem])
async def upload_images(project_id: str, files: List[UploadFile] = File(...)):
    """Upload one or more images into the project dataset."""
    return await DatasetService.upload_images(project_id, files)

@router.get("/images/{filename}")
def get_image_file(project_id: str, filename: str):
    """Serve the raw image file."""
    file_path = settings.PROJECTS_DIR / project_id / "datasets" / "raw" / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(file_path)

@router.delete("/images/{filename}")
def delete_image(project_id: str, filename: str):
    """Delete an image file from the dataset."""
    DatasetService.delete_image(project_id, filename)
    return {"success": True, "message": f"Image {filename} deleted"}

@router.post("/dataset/split")
def split_dataset(project_id: str, req: DatasetSplitRequest):
    """Split dataset into train, val, and test subsets."""
    return DatasetService.split_dataset(project_id, req)

@router.get("/dataset/export")
def export_dataset(project_id: str):
    """Export complete dataset (images + COCO JSON + YOLO txt annotations + data.yaml) as ZIP archive."""
    try:
        zip_path = DatasetService.export_dataset_zip(project_id)
        if not zip_path.exists():
            raise HTTPException(status_code=404, detail="無法生成資料集 ZIP 壓縮檔")
        return FileResponse(
            path=str(zip_path),
            filename=f"{project_id}_dataset.zip",
            media_type="application/zip"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/dataset/import")
async def import_dataset(project_id: str, files: List[UploadFile] = File(...)):
    """Import dataset from ZIP package or loose image and annotation JSON files."""
    try:
        return await DatasetService.import_dataset(project_id, files)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
