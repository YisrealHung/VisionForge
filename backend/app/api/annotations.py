from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter

from backend.app.models.dataset import CategoryItem, ImageAnnotationData
from backend.app.services.annotation_service import AnnotationService

router = APIRouter(prefix="/projects/{project_id}/annotations", tags=["Annotations"])

class CreateCategoryPayload(BaseModel):
    name: str
    color: Optional[str] = None

@router.get("", response_model=dict)
def get_full_coco(project_id: str):
    """Get the complete COCO format annotations JSON."""
    return AnnotationService.get_full_annotations(project_id)

@router.get("/categories", response_model=List[CategoryItem])
def get_categories(project_id: str):
    """Get all defined categories in the project."""
    return AnnotationService.get_categories(project_id)

@router.post("/categories", response_model=CategoryItem)
def add_category(project_id: str, payload: CreateCategoryPayload):
    """Add a new category label."""
    return AnnotationService.add_category(project_id, payload.name, payload.color)

@router.delete("/categories/{category_id}")
def delete_category(project_id: str, category_id: int):
    """Delete a category label."""
    AnnotationService.delete_category(project_id, category_id)
    return {"success": True}

@router.get("/images/{image_id}", response_model=ImageAnnotationData)
def get_image_annotations(project_id: str, image_id: str):
    """Get all annotations for a specific image."""
    return AnnotationService.get_image_annotations(project_id, image_id)

class BatchCategoryPayload(BaseModel):
    image_ids: List[str]
    category_id: int

@router.post("/batch", response_model=dict)
def batch_assign_category(project_id: str, payload: BatchCategoryPayload):
    """Batch assign a category label to multiple images at once."""
    count = AnnotationService.batch_set_category(project_id, payload.image_ids, payload.category_id)
    return {"success": True, "count": count}

@router.post("/images/{image_id}", response_model=ImageAnnotationData)
def save_image_annotations(project_id: str, image_id: str, payload: ImageAnnotationData):
    """Save/update annotations for a specific image."""
    payload.image_id = image_id
    return AnnotationService.save_image_annotations(project_id, payload)
