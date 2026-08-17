import os
import io
import json
import uuid
import random
import shutil
import zipfile
import tempfile
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict, Any
from PIL import Image
from fastapi import UploadFile, HTTPException

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.models.dataset import ImageItem, DatasetSplitRequest, DatasetStats


class DatasetService:
    @staticmethod
    def get_project_dir(project_id: str) -> Path:
        p_dir = settings.PROJECTS_DIR / project_id
        if not p_dir.exists():
            raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
        return p_dir

    @staticmethod
    def _get_splits_map(project_dir: Path) -> Dict[str, str]:
        splits_file = project_dir / "datasets" / "splits" / "splits.json"
        if splits_file.exists():
            try:
                with open(splits_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return {}
        return {}

    @staticmethod
    def _save_splits_map(project_dir: Path, splits_map: Dict[str, str]):
        splits_file = project_dir / "datasets" / "splits" / "splits.json"
        splits_file.parent.mkdir(parents=True, exist_ok=True)
        with open(splits_file, "w", encoding="utf-8") as f:
            json.dump(splits_map, f, indent=2, ensure_ascii=False)

    @staticmethod
    def _get_annotations_data(project_dir: Path) -> dict:
        anno_file = project_dir / "annotations" / "annotations.json"
        if anno_file.exists():
            try:
                with open(anno_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {"images": [], "annotations": [], "categories": []}

    @staticmethod
    def _save_annotations_data(project_dir: Path, data: dict):
        anno_file = project_dir / "annotations" / "annotations.json"
        anno_file.parent.mkdir(parents=True, exist_ok=True)
        with open(anno_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    @staticmethod
    def _update_project_db_count(project_id: str, count: int):
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE projects SET dataset_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (count, project_id))

    @staticmethod
    async def upload_images(project_id: str, files: List[UploadFile]) -> List[ImageItem]:
        project_dir = DatasetService.get_project_dir(project_id)
        raw_dir = project_dir / "datasets" / "raw"
        raw_dir.mkdir(parents=True, exist_ok=True)
        
        uploaded_items: List[ImageItem] = []
        splits_map = DatasetService._get_splits_map(project_dir)

        for file in files:
            ext = os.path.splitext(file.filename or "")[1].lower()
            if ext not in [".jpg", ".jpeg", ".png", ".webp", ".bmp"]:
                continue
                
            unique_id = uuid.uuid4().hex[:12]
            clean_name = f"img_{unique_id}{ext}"
            file_path = raw_dir / clean_name
            
            content = await file.read()
            with open(file_path, "wb") as f:
                f.write(content)
                
            width, height = 800, 600
            try:
                with Image.open(file_path) as img:
                    width, height = img.size
            except Exception:
                pass
                
            now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            item = ImageItem(
                id=unique_id,
                filename=clean_name,
                width=width,
                height=height,
                size_bytes=len(content),
                url=f"/api/projects/{project_id}/images/{clean_name}",
                split=splits_map.get(clean_name, "unassigned"),
                labeled=False,
                annotation_count=0,
                created_at=now_str
            )
            uploaded_items.append(item)

        all_files = list(raw_dir.glob("*.*"))
        DatasetService._update_project_db_count(project_id, len(all_files))
        return uploaded_items

    @staticmethod
    def list_images(project_id: str) -> List[ImageItem]:
        project_dir = DatasetService.get_project_dir(project_id)
        raw_dir = project_dir / "datasets" / "raw"
        if not raw_dir.exists():
            return []
            
        splits_map = DatasetService._get_splits_map(project_dir)
        anno_data = DatasetService._get_annotations_data(project_dir)
        
        img_annos_count: Dict[str, int] = {}
        for a in anno_data.get("annotations", []):
            img_id = str(a.get("image_id"))
            img_annos_count[img_id] = img_annos_count.get(img_id, 0) + 1

        items: List[ImageItem] = []
        valid_exts = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
        
        for p in sorted(raw_dir.iterdir(), key=os.path.getmtime, reverse=True):
            if p.is_file() and p.suffix.lower() in valid_exts:
                filename = p.name
                file_id = filename.split(".")[0].replace("img_", "")
                
                width, height = 800, 600
                try:
                    with Image.open(p) as img:
                        width, height = img.size
                except Exception:
                    pass
                    
                anno_count = img_annos_count.get(filename, 0) + img_annos_count.get(file_id, 0)
                mtime = datetime.fromtimestamp(p.stat().st_mtime).strftime("%Y-%m-%d %H:%M:%S")
                
                items.append(ImageItem(
                    id=file_id,
                    filename=filename,
                    width=width,
                    height=height,
                    size_bytes=p.stat().st_size,
                    url=f"/api/projects/{project_id}/images/{filename}",
                    split=splits_map.get(filename, "unassigned"),
                    labeled=anno_count > 0,
                    annotation_count=anno_count,
                    created_at=mtime
                ))
                
        DatasetService._update_project_db_count(project_id, len(items))
        return items

    @staticmethod
    def delete_image(project_id: str, filename: str) -> bool:
        project_dir = DatasetService.get_project_dir(project_id)
        raw_dir = project_dir / "datasets" / "raw"
        file_path = raw_dir / filename
        if file_path.exists():
            file_path.unlink()
            
        splits_map = DatasetService._get_splits_map(project_dir)
        if filename in splits_map:
            del splits_map[filename]
            DatasetService._save_splits_map(project_dir, splits_map)
            
        all_files = list(raw_dir.glob("*.*"))
        DatasetService._update_project_db_count(project_id, len(all_files))
        return True

    @staticmethod
    def split_dataset(project_id: str, req: DatasetSplitRequest) -> Dict[str, int]:
        project_dir = DatasetService.get_project_dir(project_id)
        raw_dir = project_dir / "datasets" / "raw"
        files = [p.name for p in raw_dir.iterdir() if p.is_file()]
        
        random.shuffle(files)
        total = len(files)
        if total == 0:
            return {"train": 0, "val": 0, "test": 0}
            
        train_end = int(total * req.train_ratio)
        val_end = train_end + int(total * req.val_ratio)
        
        splits_map: Dict[str, str] = {}
        for i, fname in enumerate(files):
            if i < train_end:
                splits_map[fname] = "train"
            elif i < val_end:
                splits_map[fname] = "val"
            else:
                splits_map[fname] = "test"
                
        DatasetService._save_splits_map(project_dir, splits_map)
        
        return {
            "train": train_end,
            "val": min(val_end - train_end, total - train_end),
            "test": max(0, total - val_end)
        }

    # =========================================================================
    # EXPORT DATASET (IMAGES + COCO JSON + YOLO TXT + YAML)
    # =========================================================================
    @staticmethod
    def export_dataset_zip(project_id: str) -> Path:
        project_dir = DatasetService.get_project_dir(project_id)
        raw_dir = project_dir / "datasets" / "raw"
        anno_data = DatasetService._get_annotations_data(project_dir)
        categories = anno_data.get("categories", [])
        annotations = anno_data.get("annotations", [])
        images_info = anno_data.get("images", [])

        # Create export temp directory
        exports_dir = project_dir / "exports"
        exports_dir.mkdir(parents=True, exist_ok=True)
        zip_path = exports_dir / f"{project_id}_dataset.zip"

        # Build category id map
        cat_id_to_idx = {c["id"]: idx for idx, c in enumerate(categories)}
        class_names = [c["name"] for c in categories] if categories else ["object"]

        # Map annotations to image_id
        img_annos: Dict[str, list] = {}
        for a in annotations:
            img_id = str(a.get("image_id"))
            img_annos.setdefault(img_id, []).append(a)

        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            # 1. Add COCO JSON
            coco_content = json.dumps(anno_data, indent=2, ensure_ascii=False)
            zf.writestr("annotations/annotations_coco.json", coco_content)

            # 2. Add YOLO data.yaml
            yaml_lines = [
                "path: ./",
                "train: images/train",
                "val: images/val",
                f"nc: {len(class_names)}",
                f"names: {json.dumps(class_names, ensure_ascii=False)}"
            ]
            zf.writestr("annotations/data.yaml", "\n".join(yaml_lines))

            # 3. Add Raw Images & YOLO TXT Labels
            valid_exts = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
            if raw_dir.exists():
                for img_file in raw_dir.iterdir():
                    if img_file.is_file() and img_file.suffix.lower() in valid_exts:
                        zf.write(img_file, f"images/{img_file.name}")
                        
                        # Compute YOLO label file
                        fid = img_file.name.split(".")[0].replace("img_", "")
                        annos = img_annos.get(img_file.name, img_annos.get(fid, []))
                        
                        # Read image size
                        try:
                            with Image.open(img_file) as im:
                                iw, ih = im.size
                        except Exception:
                            iw, ih = 800, 600

                        txt_lines = []
                        for a in annos:
                            cat_id = a.get("category_id")
                            cls_idx = cat_id_to_idx.get(cat_id, 0)
                            bbox = a.get("bbox", [0, 0, iw, ih])
                            if len(bbox) == 4 and iw > 0 and ih > 0:
                                bx, by, bw, bh = bbox
                                xc = (bx + bw / 2.0) / float(iw)
                                yc = (by + bh / 2.0) / float(ih)
                                nw = bw / float(iw)
                                nh = bh / float(ih)
                                xc = max(0.0, min(1.0, xc))
                                yc = max(0.0, min(1.0, yc))
                                nw = max(0.001, min(1.0, nw))
                                nh = max(0.001, min(1.0, nh))
                                txt_lines.append(f"{cls_idx} {xc:.6f} {yc:.6f} {nw:.6f} {nh:.6f}")

                        txt_filename = f"labels/{img_file.stem}.txt"
                        zf.writestr(txt_filename, "\n".join(txt_lines))

            # 4. Add README
            readme_text = f"""# VisionForge Dataset Export
- Project ID: {project_id}
- Export Time: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
- Total Images: {len(list(raw_dir.glob('*.*'))) if raw_dir.exists() else 0}
- Categories: {', '.join(class_names)}

Formats Included:
1. `images/`: Original resolution images
2. `annotations/annotations_coco.json`: Standard MS-COCO JSON format
3. `labels/*.txt`: Ultralytics YOLO normalized format
4. `annotations/data.yaml`: YOLO dataset configuration
"""
            zf.writestr("README.md", readme_text)

        return zip_path

    # =========================================================================
    # IMPORT DATASET (ZIP ARCHIVE OR COMBINED FILES)
    # =========================================================================
    @staticmethod
    async def import_dataset(project_id: str, files: List[UploadFile]) -> Dict[str, Any]:
        project_dir = DatasetService.get_project_dir(project_id)
        raw_dir = project_dir / "datasets" / "raw"
        raw_dir.mkdir(parents=True, exist_ok=True)

        existing_coco = DatasetService._get_annotations_data(project_dir)
        categories = existing_coco.get("categories", [])
        annotations = existing_coco.get("annotations", [])
        images_info = existing_coco.get("images", [])

        cat_name_to_id = {c["name"].lower(): c["id"] for c in categories}
        next_cat_id = max([c["id"] for c in categories], default=0) + 1

        imported_images_count = 0
        imported_annos_count = 0
        valid_exts = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

        for file in files:
            fname = file.filename or ""
            content = await file.read()

            # Case A: ZIP Package
            if fname.lower().endswith(".zip"):
                with zipfile.ZipFile(io.BytesIO(content)) as zf:
                    for member in zf.infolist():
                        if member.is_dir():
                            continue
                        
                        mpath = Path(member.filename)
                        suffix = mpath.suffix.lower()

                        # Extract Image
                        if suffix in valid_exts:
                            target_fname = mpath.name
                            target_path = raw_dir / target_fname
                            with zf.open(member) as src, open(target_path, "wb") as dst:
                                dst.write(src.read())
                            imported_images_count += 1

                        # Extract & Merge COCO JSON
                        elif suffix == ".json" and ("coco" in mpath.name.lower() or "anno" in mpath.name.lower()):
                            try:
                                json_data = json.loads(zf.read(member).decode("utf-8"))
                                # Merge categories
                                for c in json_data.get("categories", []):
                                    cname = c.get("name", "object")
                                    if cname.lower() not in cat_name_to_id:
                                        new_cat = {
                                            "id": next_cat_id,
                                            "name": cname,
                                            "color": c.get("color", "#6366f1"),
                                            "supercategory": "object"
                                        }
                                        categories.append(new_cat)
                                        cat_name_to_id[cname.lower()] = next_cat_id
                                        next_cat_id += 1

                                # Merge annotations
                                for a in json_data.get("annotations", []):
                                    annotations.append(a)
                                    imported_annos_count += 1
                            except Exception as e:
                                print(f"Warning parsing imported JSON: {e}")

            # Case B: Loose Image File
            elif Path(fname).suffix.lower() in valid_exts:
                target_path = raw_dir / fname
                with open(target_path, "wb") as f:
                    f.write(content)
                imported_images_count += 1

            # Case C: Loose JSON Annotation File
            elif fname.lower().endswith(".json"):
                try:
                    json_data = json.loads(content.decode("utf-8"))
                    for c in json_data.get("categories", []):
                        cname = c.get("name", "object")
                        if cname.lower() not in cat_name_to_id:
                            new_cat = {
                                "id": next_cat_id,
                                "name": cname,
                                "color": c.get("color", "#6366f1"),
                                "supercategory": "object"
                            }
                            categories.append(new_cat)
                            cat_name_to_id[cname.lower()] = next_cat_id
                            next_cat_id += 1

                    for a in json_data.get("annotations", []):
                        annotations.append(a)
                        imported_annos_count += 1
                except Exception as e:
                    print(f"Warning parsing loose JSON: {e}")

        # Save updated annotations
        updated_coco = {
            "info": {"description": f"VisionForge Annotations for {project_id}", "version": "1.0"},
            "categories": categories,
            "images": images_info,
            "annotations": annotations
        }
        DatasetService._save_annotations_data(project_dir, updated_coco)

        total_files = list(raw_dir.glob("*.*"))
        DatasetService._update_project_db_count(project_id, len(total_files))

        return {
            "success": True,
            "imported_images": imported_images_count,
            "imported_annotations": imported_annos_count,
            "total_images": len(total_files),
            "categories": categories
        }
