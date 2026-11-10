"""
Dataset import: images plus COCO and/or YOLO annotations, from a ZIP or loose files.

VisionForge stores annotations COCO-style in annotations/annotations.json, but keyed by
*file name*: each annotation's ``image_id`` is the image's file name in datasets/raw and
``bbox`` is ``[x, y, w, h]`` in pixels. Imported formats are converted to that:

- COCO (e.g. Roboflow ``_annotations.coco.json``): numeric ``image_id`` -> ``images[].file_name``;
  category ids remapped by name to the project's categories.
- YOLO (e.g. Roboflow / Ultralytics ``labels/*.txt`` + ``data.yaml``): normalized
  ``cls xc yc w h`` (or polygon ``cls x1 y1 x2 y2 ...``) -> pixel bbox using the image size;
  class names from ``data.yaml`` / ``classes.txt`` / ``obj.names``.

Re-importing labels for an image replaces that image's previous annotations.
"""
from __future__ import annotations

import io
import json
import logging
import uuid
import zipfile
from dataclasses import dataclass, field
from pathlib import Path, PurePosixPath
from typing import Dict, Iterable, List, Optional, Tuple

import yaml
from PIL import Image

logger = logging.getLogger("visionforge.dataset_import")

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
CLASS_LIST_NAMES = {"classes.txt", "obj.names", "classes.names", "_darknet.labels"}
CATEGORY_COLORS = ["#5b3fd9", "#e8590c", "#0f7b6c", "#c2255c", "#1971c2", "#2b8a3e", "#f59f00", "#862e9c"]


@dataclass
class ImportSource:
    """One file of the import, after unpacking: its base name, path inside the archive, bytes."""
    name: str
    path: str
    data: bytes

    @property
    def suffix(self) -> str:
        return PurePosixPath(self.name).suffix.lower()

    @property
    def stem(self) -> str:
        return PurePosixPath(self.name).stem


@dataclass
class ImportResult:
    imported_images: int = 0
    imported_annotations: int = 0
    labeled_images: int = 0
    formats: List[str] = field(default_factory=list)
    skipped_annotations: int = 0
    warnings: List[str] = field(default_factory=list)


def _safe_base_name(raw_name: str) -> Optional[str]:
    """Base name only (zip entries and upload names may carry ../ or absolute paths)."""
    name = PurePosixPath(raw_name.replace("\\", "/")).name
    if not name or name.startswith(".") or name in ("..",):
        return None
    return name


def expand_sources(uploads: Iterable[Tuple[str, bytes]]) -> List[ImportSource]:
    """Flatten uploaded files and ZIP archives into a list of sources."""
    out: List[ImportSource] = []
    for upload_name, data in uploads:
        if (upload_name or "").lower().endswith(".zip"):
            with zipfile.ZipFile(io.BytesIO(data)) as zf:
                for member in zf.infolist():
                    if member.is_dir():
                        continue
                    member_path = member.filename.replace("\\", "/")
                    if member_path.startswith("__MACOSX/"):
                        continue
                    base = _safe_base_name(member_path)
                    if base:
                        out.append(ImportSource(base, member_path, zf.read(member)))
        else:
            base = _safe_base_name(upload_name or "")
            if base:
                out.append(ImportSource(base, base, data))
    return out


def _parse_class_names_yaml(data: bytes) -> Optional[List[str]]:
    try:
        doc = yaml.safe_load(data.decode("utf-8"))
    except Exception:
        return None
    if not isinstance(doc, dict) or "names" not in doc:
        return None
    names = doc["names"]
    if isinstance(names, dict):  # Ultralytics style {0: a, 1: b}
        try:
            return [str(names[k]) for k in sorted(names, key=lambda k: int(k))]
        except (TypeError, ValueError):
            return [str(v) for v in names.values()]
    if isinstance(names, list):
        return [str(n) for n in names]
    return None


def _is_coco(doc: object) -> bool:
    return isinstance(doc, dict) and isinstance(doc.get("images"), list) and isinstance(doc.get("annotations"), list)


def _parse_yolo_line(line: str) -> Optional[Tuple[int, float, float, float, float]]:
    """Return (class, x_min, y_min, x_max, y_max) normalized, or None for blank / invalid lines."""
    parts = line.strip().split()
    if not parts:
        return None
    try:
        cls = int(float(parts[0]))
        vals = [float(v) for v in parts[1:]]
    except ValueError:
        return None
    if len(vals) == 4:
        xc, yc, w, h = vals
        x0, y0, x1, y1 = xc - w / 2, yc - h / 2, xc + w / 2, yc + h / 2
    elif len(vals) >= 6 and len(vals) % 2 == 0:  # segmentation polygon -> its bounding box
        xs, ys = vals[0::2], vals[1::2]
        x0, y0, x1, y1 = min(xs), min(ys), max(xs), max(ys)
    else:
        return None
    clamp = lambda v: max(0.0, min(1.0, v))  # noqa: E731
    x0, y0, x1, y1 = clamp(x0), clamp(y0), clamp(x1), clamp(y1)
    if x1 <= x0 or y1 <= y0:
        return None
    return cls, x0, y0, x1, y1


class CategoryResolver:
    """Maps imported class names to project category ids, creating categories on first use."""

    def __init__(self, categories: List[dict]):
        self.categories = categories
        self.by_name = {str(c.get("name", "")).strip().lower(): c["id"] for c in categories}
        self.next_id = max([int(c["id"]) for c in categories], default=0) + 1
        self.created: List[str] = []

    def resolve(self, name: str) -> int:
        key = name.strip().lower() or "object"
        if key not in self.by_name:
            self.categories.append({
                "id": self.next_id,
                "name": name.strip() or "object",
                "color": CATEGORY_COLORS[(self.next_id - 1) % len(CATEGORY_COLORS)],
                "supercategory": "object",
            })
            self.by_name[key] = self.next_id
            self.created.append(name)
            self.next_id += 1
        return self.by_name[key]


def _new_annotation(image_file: str, category_id: int, bbox: List[float]) -> dict:
    x, y, w, h = [round(float(v), 2) for v in bbox]
    return {
        "id": f"anno_{uuid.uuid4().hex[:12]}",
        "image_id": image_file,
        "category_id": int(category_id),
        "bbox": [x, y, w, h],
        "area": round(w * h, 2),
        "iscrowd": 0,
    }


def import_into_project(raw_dir: Path, existing: dict, sources: List[ImportSource]) -> Tuple[dict, ImportResult]:
    """
    Write images into ``raw_dir`` and merge annotations into ``existing`` (the project's COCO dict).
    Returns the updated COCO dict and a summary.
    """
    result = ImportResult()
    categories: List[dict] = list(existing.get("categories", []))
    resolver = CategoryResolver(categories)

    # 1. Images
    image_sizes: Dict[str, Tuple[int, int]] = {}
    for src in sources:
        if src.suffix in IMAGE_EXTS:
            (raw_dir / src.name).write_bytes(src.data)
            result.imported_images += 1
            try:
                with Image.open(io.BytesIO(src.data)) as im:
                    image_sizes[src.name] = im.size
            except Exception:
                result.warnings.append(f"無法讀取影像尺寸：{src.name}")

    def image_size(file_name: str) -> Optional[Tuple[int, int]]:
        if file_name not in image_sizes and (raw_dir / file_name).exists():
            try:
                with Image.open(raw_dir / file_name) as im:
                    image_sizes[file_name] = im.size
            except Exception:
                return None
        return image_sizes.get(file_name)

    new_annos: Dict[str, List[dict]] = {}

    # 2. COCO JSON files
    for src in sources:
        if src.suffix != ".json":
            continue
        try:
            doc = json.loads(src.data.decode("utf-8-sig"))
        except Exception as e:
            result.warnings.append(f"JSON 解析失敗：{src.path}（{e}）")
            continue
        if not _is_coco(doc):
            continue
        if "COCO" not in result.formats:
            result.formats.append("COCO")
        id_to_file = {}
        for img in doc["images"]:
            base = _safe_base_name(str(img.get("file_name", "")))
            if base is not None and "id" in img:
                id_to_file[img["id"]] = base
        cat_names = {c.get("id"): str(c.get("name", "object")) for c in doc.get("categories", [])}
        for a in doc["annotations"]:
            img_file = id_to_file.get(a.get("image_id"))
            # Some tools (and older VisionForge exports) already use the file name as image_id.
            if img_file is None and isinstance(a.get("image_id"), str):
                img_file = _safe_base_name(a["image_id"])
            bbox = a.get("bbox") or []
            if img_file is None or image_size(img_file) is None or len(bbox) != 4:
                result.skipped_annotations += 1
                continue
            name = cat_names.get(a.get("category_id"), f"class_{a.get('category_id')}")
            cat_id = resolver.resolve(name)  # only categories actually used get created
            new_annos.setdefault(img_file, []).append(_new_annotation(img_file, cat_id, bbox))

    # 3. YOLO txt labels
    coco_labeled = set(new_annos)
    class_names: Optional[List[str]] = None
    for src in sources:
        if src.suffix in (".yaml", ".yml"):
            class_names = _parse_class_names_yaml(src.data) or class_names
    for src in sources:
        if src.name.lower() in CLASS_LIST_NAMES and class_names is None:
            class_names = [ln.strip() for ln in src.data.decode("utf-8", "ignore").splitlines() if ln.strip()]

    image_by_stem = {PurePosixPath(n).stem: n for n in image_sizes}
    for src in sources:
        if src.suffix != ".txt" or src.name.lower() in CLASS_LIST_NAMES:
            continue
        img_file = image_by_stem.get(src.stem)
        if img_file is None:
            # Label for an image already in the project (labels imported separately).
            for ext in IMAGE_EXTS:
                if (raw_dir / f"{src.stem}{ext}").exists():
                    img_file = f"{src.stem}{ext}"
                    break
        if img_file is None or img_file in coco_labeled:
            # COCO wins when an archive carries both (e.g. a VisionForge export): no duplicate boxes.
            continue
        size = image_size(img_file)
        lines = [ln for ln in src.data.decode("utf-8", "ignore").splitlines() if ln.strip()]
        parsed = [_parse_yolo_line(ln) for ln in lines]
        # Not a YOLO label file (e.g. a README.txt that shares an image's stem). An empty file is a
        # valid YOLO "background" image: it clears that image's boxes.
        if size is None or (lines and all(p is None for p in parsed)):
            continue
        if "YOLO" not in result.formats:
            result.formats.append("YOLO")
        w_img, h_img = size
        annos = new_annos.setdefault(img_file, [])
        for p in parsed:
            if p is None:
                continue
            cls, x0, y0, x1, y1 = p
            name = class_names[cls] if class_names and 0 <= cls < len(class_names) else f"class_{cls}"
            cat_id = resolver.resolve(name)
            annos.append(_new_annotation(img_file, cat_id, [x0 * w_img, y0 * h_img, (x1 - x0) * w_img, (y1 - y0) * h_img]))

    # 4. Merge: imported labels replace that image's previous annotations.
    replaced = set(new_annos)
    kept = [a for a in existing.get("annotations", []) if str(a.get("image_id")) not in replaced]
    merged = kept + [a for annos in new_annos.values() for a in annos]
    result.imported_annotations = sum(len(v) for v in new_annos.values())
    result.labeled_images = sum(1 for v in new_annos.values() if v)
    if result.skipped_annotations:
        result.warnings.append(f"{result.skipped_annotations} 筆標註找不到對應影像或格式不符，已略過")

    updated = dict(existing)
    updated.setdefault("info", {"description": "VisionForge annotations", "version": "1.0"})
    updated["categories"] = categories
    updated["images"] = existing.get("images", [])
    updated["annotations"] = merged
    return updated, result
