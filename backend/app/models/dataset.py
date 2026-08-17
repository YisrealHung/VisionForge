from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ImageItem(BaseModel):
    id: str
    filename: str
    width: int
    height: int
    size_bytes: int
    url: str
    split: Optional[str] = "unassigned"  # train, val, test, unassigned
    labeled: bool = False
    annotation_count: int = 0
    created_at: str

class CategoryItem(BaseModel):
    id: int
    name: str
    color: str
    supercategory: Optional[str] = "object"

class BoundingBox(BaseModel):
    # [x, y, width, height]
    x: float
    y: float
    width: float
    height: float

class AnnotationItem(BaseModel):
    id: str
    image_id: str
    category_id: int
    category_name: Optional[str] = None
    bbox: List[float] = Field(..., description="[x, y, width, height]")
    area: float
    is_crowd: int = 0

class ImageAnnotationData(BaseModel):
    image_id: str
    annotations: List[AnnotationItem]
    tags: Optional[List[str]] = []

class DatasetSplitRequest(BaseModel):
    train_ratio: float = 0.8
    val_ratio: float = 0.2
    test_ratio: float = 0.0

class DatasetStats(BaseModel):
    total_images: int
    labeled_images: int
    unlabeled_images: int
    train_count: int
    val_count: int
    test_count: int
    categories: List[CategoryItem]
    category_counts: Dict[str, int]
