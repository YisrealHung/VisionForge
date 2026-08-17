import json
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import HTTPException

from backend.app.core.config import settings
from backend.app.models.dataset import CategoryItem, AnnotationItem, ImageAnnotationData

DEFAULT_COLORS = [
  "#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e", 
  "#a855f7", "#ec4899", "#3b82f6", "#14b8a6", "#eab308"
]

class AnnotationService:
    @staticmethod
    def get_anno_file(project_id: str) -> Path:
        project_dir = settings.PROJECTS_DIR / project_id
        if not project_dir.exists():
            raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
        anno_dir = project_dir / "annotations"
        anno_dir.mkdir(parents=True, exist_ok=True)
        return anno_dir / "annotations.json"

    @staticmethod
    def _read_coco(project_id: str) -> dict:
        anno_file = AnnotationService.get_anno_file(project_id)
        if anno_file.exists():
            try:
                with open(anno_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {
            "info": {"description": f"VisionForge Annotations for {project_id}", "version": "1.0"},
            "categories": [],
            "images": [],
            "annotations": []
        }

    @staticmethod
    def _save_coco(project_id: str, data: dict):
        anno_file = AnnotationService.get_anno_file(project_id)
        with open(anno_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    @staticmethod
    def get_categories(project_id: str) -> List[CategoryItem]:
        coco = AnnotationService._read_coco(project_id)
        return [CategoryItem(**c) for c in coco.get("categories", [])]

    @staticmethod
    def add_category(project_id: str, name: str, color: Optional[str] = None) -> CategoryItem:
        coco = AnnotationService._read_coco(project_id)
        categories = coco.get("categories", [])
        
        # Check duplicate
        for c in categories:
            if c["name"].lower() == name.lower():
                return CategoryItem(**c)
                
        next_id = max([c["id"] for c in categories], default=0) + 1
        picked_color = color or DEFAULT_COLORS[(next_id - 1) % len(DEFAULT_COLORS)]
        new_cat = {
            "id": next_id,
            "name": name,
            "color": picked_color,
            "supercategory": "object"
        }
        categories.append(new_cat)
        coco["categories"] = categories
        AnnotationService._save_coco(project_id, coco)
        return CategoryItem(**new_cat)

    @staticmethod
    def delete_category(project_id: str, category_id: int) -> bool:
        coco = AnnotationService._read_coco(project_id)
        coco["categories"] = [c for c in coco.get("categories", []) if c["id"] != category_id]
        # Also clean related annotations
        coco["annotations"] = [a for a in coco.get("annotations", []) if a.get("category_id") != category_id]
        AnnotationService._save_coco(project_id, coco)
        return True

    @staticmethod
    def get_image_annotations(project_id: str, image_id: str) -> ImageAnnotationData:
        coco = AnnotationService._read_coco(project_id)
        cats_map = {c["id"]: c["name"] for c in coco.get("categories", [])}
        
        image_annos: List[AnnotationItem] = []
        for a in coco.get("annotations", []):
            if str(a.get("image_id")) == str(image_id):
                cat_id = a.get("category_id")
                image_annos.append(AnnotationItem(
                    id=str(a.get("id")),
                    image_id=str(image_id),
                    category_id=cat_id,
                    category_name=cats_map.get(cat_id, "Unknown"),
                    bbox=a.get("bbox", [0, 0, 0, 0]),
                    area=a.get("area", 0.0),
                    is_crowd=a.get("iscrowd", 0)
                ))
        return ImageAnnotationData(image_id=image_id, annotations=image_annos)

    @staticmethod
    def save_image_annotations(project_id: str, data: ImageAnnotationData) -> ImageAnnotationData:
        coco = AnnotationService._read_coco(project_id)
        
        # Remove existing annotations for this image
        coco["annotations"] = [a for a in coco.get("annotations", []) if str(a.get("image_id")) != str(data.image_id)]
        
        # Append new annotations
        for item in data.annotations:
            anno_id = item.id or uuid.uuid4().hex[:8]
            coco["annotations"].append({
                "id": anno_id,
                "image_id": data.image_id,
                "category_id": item.category_id,
                "bbox": item.bbox,
                "area": item.area or (item.bbox[2] * item.bbox[3]),
                "iscrowd": item.is_crowd
            })
            
        AnnotationService._save_coco(project_id, coco)
        return AnnotationService.get_image_annotations(project_id, data.image_id)

    @staticmethod
    def batch_set_category(project_id: str, image_ids: List[str], category_id: int) -> int:
        coco = AnnotationService._read_coco(project_id)
        img_set = set(str(i) for i in image_ids)
        
        # Remove existing annotations for these images
        coco["annotations"] = [a for a in coco.get("annotations", []) if str(a.get("image_id")) not in img_set]
        
        # Add new classification annotation for each image
        for img_id in image_ids:
            anno_id = f"anno_{uuid.uuid4().hex[:8]}"
            coco["annotations"].append({
                "id": anno_id,
                "image_id": img_id,
                "category_id": category_id,
                "bbox": [0, 0, 800, 600],
                "area": 480000.0,
                "iscrowd": 0
            })
            
        AnnotationService._save_coco(project_id, coco)
        return len(image_ids)

    @staticmethod
    def get_full_annotations(project_id: str) -> dict:
        return AnnotationService._read_coco(project_id)
