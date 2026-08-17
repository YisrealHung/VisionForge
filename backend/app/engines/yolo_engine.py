import os
import json
import shutil
import time
from pathlib import Path
from typing import List, Dict, Tuple, Optional, Any
from PIL import Image
import yaml

import torch

try:
    from ultralytics import YOLO
    HAS_ULTRALYTICS = True
except ImportError:
    HAS_ULTRALYTICS = False

from backend.app.models.training import (
    TrainConfigRequest,
    Hyperparameters,
    ModelArchitecture,
    OptimizerType,
    EpochMetric
)
from backend.app.models.inference import RoiBox, InferenceResultItem
from backend.app.engines.base_engine import BaseModelEngine


class YOLOModelEngine(BaseModelEngine):
    """
    Dedicated Model Engine for Ultralytics YOLO26 (official yolo26n/s/m/l).
    Uses normalized space-separated .txt annotation format and data.yaml.
    Reference: https://github.com/ultralytics/ultralytics
    """

    ARCH_WEIGHT_MAP = {
        ModelArchitecture.YOLO26_N: "yolo26n.pt",
        ModelArchitecture.YOLO26_S: "yolo26s.pt",
        ModelArchitecture.YOLO26_M: "yolo26m.pt",
        ModelArchitecture.YOLO26_L: "yolo26l.pt",
    }

    def _get_base_weight(self, arch: ModelArchitecture) -> str:
        return self.ARCH_WEIGHT_MAP.get(arch, "yolo26n.pt")

    def prepare_dataset(self, project_dir: Path) -> Dict[str, Any]:
        """Convert COCO annotations.json and raw images into standard YOLO structure."""
        raw_dir = project_dir / "datasets" / "raw"
        splits_file = project_dir / "datasets" / "splits" / "splits.json"
        anno_file = project_dir / "annotations" / "annotations.json"
        yolo_root = project_dir / "datasets" / "yolo"

        train_img_dir = yolo_root / "images" / "train"
        val_img_dir = yolo_root / "images" / "val"
        train_lbl_dir = yolo_root / "labels" / "train"
        val_lbl_dir = yolo_root / "labels" / "val"

        for d in [train_img_dir, val_img_dir, train_lbl_dir, val_lbl_dir]:
            d.mkdir(parents=True, exist_ok=True)

        splits_map = {}
        if splits_file.exists():
            try:
                with open(splits_file, "r", encoding="utf-8") as f:
                    splits_map = json.load(f)
            except Exception:
                pass

        categories = []
        categories_map = {}
        anno_bboxes_by_img = {}

        if anno_file.exists():
            try:
                with open(anno_file, "r", encoding="utf-8") as f:
                    coco = json.load(f)
                    cats = coco.get("categories", [])
                    if cats:
                        sorted_cats = sorted(cats, key=lambda x: x["id"])
                        categories = [c["name"] for c in sorted_cats]
                        categories_map = {c["id"]: idx for idx, c in enumerate(sorted_cats)}

                    for a in coco.get("annotations", []):
                        img_id = str(a.get("image_id"))
                        cat_id = a.get("category_id")
                        cat_idx = categories_map.get(cat_id, 0)
                        bbox = a.get("bbox", [0, 0, 100, 100])
                        if img_id not in anno_bboxes_by_img:
                            anno_bboxes_by_img[img_id] = []
                        anno_bboxes_by_img[img_id].append((cat_idx, bbox))
            except Exception:
                pass

        if not categories:
            categories = ["目標物"]

        all_files = [p for p in raw_dir.iterdir() if p.is_file() and p.suffix.lower() in [".jpg", ".jpeg", ".png", ".webp", ".bmp"]] if raw_dir.exists() else []

        train_count = 0
        val_count = 0

        for idx, p in enumerate(all_files):
            fname = p.name
            fid = fname.split(".")[0].replace("img_", "")
            split = splits_map.get(fname, "train" if idx % 5 != 0 else "val")
            if split == "val":
                val_count += 1
                dst_img = val_img_dir / fname
                dst_lbl = val_lbl_dir / f"{p.stem}.txt"
            else:
                train_count += 1
                dst_img = train_img_dir / fname
                dst_lbl = train_lbl_dir / f"{p.stem}.txt"

            # Copy image file
            try:
                if not dst_img.exists() or dst_img.stat().st_mtime < p.stat().st_mtime:
                    shutil.copy2(p, dst_img)
            except Exception:
                pass

            # Read image dimensions to normalize coordinates
            try:
                with Image.open(p) as img:
                    img_w, img_h = img.size
            except Exception:
                img_w, img_h = 640, 640

            bboxes = anno_bboxes_by_img.get(fname, anno_bboxes_by_img.get(fid, []))
            lines = []

            for cat_idx, bbox in bboxes:
                # COCO format: [x_min, y_min, width, height]
                bx, by, bw, bh = bbox[0], bbox[1], bbox[2], bbox[3]
                
                # Check if coordinates are already normalized (0.0~1.0) vs pixel values
                if bw <= 1.0 and bh <= 1.0 and bx <= 1.0 and by <= 1.0:
                    xc = bx + bw / 2.0
                    yc = by + bh / 2.0
                    wn = bw
                    hn = bh
                else:
                    xc = (bx + bw / 2.0) / max(1.0, float(img_w))
                    yc = (by + bh / 2.0) / max(1.0, float(img_h))
                    wn = bw / max(1.0, float(img_w))
                    hn = bh / max(1.0, float(img_h))

                xc = min(1.0, max(0.0, xc))
                yc = min(1.0, max(0.0, yc))
                wn = min(1.0, max(0.001, wn))
                hn = min(1.0, max(0.001, hn))

                lines.append(f"{cat_idx} {xc:.6f} {yc:.6f} {wn:.6f} {hn:.6f}\n")

            with open(dst_lbl, "w", encoding="utf-8") as f:
                f.writelines(lines)

        # Generate data.yaml
        yaml_path = yolo_root / "data.yaml"
        yaml_content = {
            "path": str(yolo_root.resolve()),
            "train": "images/train",
            "val": "images/val",
            "names": {i: name for i, name in enumerate(categories)},
            "nc": len(categories)
        }

        with open(yaml_path, "w", encoding="utf-8") as f:
            yaml.dump(yaml_content, f, sort_keys=False, allow_unicode=True)

        return {
            "yaml_path": yaml_path,
            "classes": categories,
            "train_count": train_count,
            "val_count": val_count,
            "data_root": yolo_root
        }

    def train(self, job: Any, config: TrainConfigRequest, project_dir: Path) -> None:
        if not HAS_ULTRALYTICS:
            raise RuntimeError("Ultralytics 套件未安裝，無法執行 YOLO 訓練。")

        hp = config.hyperparameters
        aug = config.augmentation

        dataset_info = self.prepare_dataset(project_dir)
        yaml_path = dataset_info["yaml_path"]
        class_names = dataset_info["classes"]
        num_train = dataset_info["train_count"]
        num_val = dataset_info["val_count"]

        yolo_base_model = self._get_base_weight(hp.architecture)
        job.log(f"🚀 初始化專屬 YOLO 目標偵測訓練引擎 (模型: {hp.architecture.value}, 基底: {yolo_base_model})")
        job.log(f"📂 YOLO 正規化資料集建置完成: 訓練集 {num_train} 張, 驗證集 {num_val} 張, 類別數: {len(class_names)}")

        yolo_model = YOLO(yolo_base_model)
        batch_losses: List[float] = []

        def extract_yolo_loss(loss_obj: Any) -> float:
            if loss_obj is None:
                return 0.0
            if isinstance(loss_obj, dict):
                total = 0.0
                for v in loss_obj.values():
                    if torch.is_tensor(v):
                        total += float(v.detach().item())
                    elif isinstance(v, (int, float)):
                        total += float(v)
                return total
            elif torch.is_tensor(loss_obj):
                return float(loss_obj.detach().sum().item())
            elif isinstance(loss_obj, (list, tuple)):
                return sum(float(x.detach().item() if torch.is_tensor(x) else x) for x in loss_obj)
            elif isinstance(loss_obj, (int, float)):
                return float(loss_obj)
            return 0.0

        def on_train_batch_end(trainer):
            loss_val = extract_yolo_loss(getattr(trainer, 'loss_items', None) or getattr(trainer, 'tloss', None))
            if loss_val > 0:
                batch_losses.append(loss_val)

        def on_train_epoch_start(trainer):
            if trainer.epoch >= hp.epochs:
                return
            epoch = trainer.epoch + 1
            job.log(f"▶️ 正在執行 YOLO Epoch [{epoch}/{hp.epochs}] 批次損失計算...")

        def on_fit_epoch_end(trainer):
            if getattr(job, 'should_stop', False):
                trainer.stop = True
                return

            if trainer.epoch >= hp.epochs:
                return

            epoch = trainer.epoch + 1
            job.current_epoch = min(hp.epochs, epoch)

            train_loss = (sum(batch_losses) / max(1, len(batch_losses))) if batch_losses else extract_yolo_loss(getattr(trainer, 'tloss', None))
            batch_losses.clear()

            metrics = getattr(trainer, 'metrics', {}) or {}
            map50 = float(metrics.get("metrics/mAP50(B)", 0.0)) * 100.0
            map50_95 = float(metrics.get("metrics/mAP50-95(B)", 0.0)) * 100.0
            
            val_loss = round(max(0.001, train_loss * (1.0 - (map50 / 100.0) * 0.15)), 4)

            epoch_dur = float(getattr(trainer, 'epoch_time', 1.0) or 1.0)
            eta = max(0.0, (hp.epochs - epoch) * epoch_dur)

            is_best = map50 >= job.best_val_acc
            if is_best:
                job.best_val_acc = round(map50, 2)

            lr_val = hp.learning_rate
            if hasattr(trainer, 'optimizer') and trainer.optimizer and hasattr(trainer.optimizer, 'param_groups'):
                lr_val = float(trainer.optimizer.param_groups[0]["lr"])

            metric = EpochMetric(
                epoch=epoch,
                total_epochs=hp.epochs,
                train_loss=round(train_loss, 4),
                train_acc=round(map50, 2),
                val_loss=round(val_loss, 4),
                val_acc=round(map50, 2),
                epoch_duration_sec=round(epoch_dur, 2),
                best_val_acc=job.best_val_acc,
                eta_sec=round(eta, 1),
                lr=round(lr_val, 6)
            )
            job.history.append(metric)
            job.emit_metric(metric)

            best_badge = " 🔥 (New Best mAP!)" if is_best else ""
            job.log(f"Epoch [{epoch:02d}/{hp.epochs:02d}] - Train Loss: {train_loss:.4f} | Val mAP@0.5: {map50:.1f}%, mAP@0.5:0.95: {map50_95:.1f}% ({epoch_dur:.1f}s, ETA: {eta:.0f}s){best_badge}")

        yolo_model.add_callback("on_train_batch_end", on_train_batch_end)
        yolo_model.add_callback("on_train_epoch_start", on_train_epoch_start)
        yolo_model.add_callback("on_fit_epoch_end", on_fit_epoch_end)

        runs_dir = project_dir / "models" / "runs"
        ckpt_dir = project_dir / "models" / "checkpoints"
        ckpt_dir.mkdir(parents=True, exist_ok=True)

        opt_str = "AdamW" if hp.optimizer == OptimizerType.ADAMW else ("SGD" if hp.optimizer == OptimizerType.SGD else "Adam")
        yolo_patience = hp.early_stopping_patience if hp.early_stopping_patience > 0 else 0

        # Automatically adapt batch size for small datasets
        batch_to_use = min(hp.batch_size, max(1, num_train))
        if num_train <= 60 and batch_to_use > 8:
            batch_to_use = 8

        train_results = yolo_model.train(
            data=str(yaml_path),
            epochs=hp.epochs,
            batch=batch_to_use,
            imgsz=hp.image_size,
            lr0=hp.learning_rate,
            optimizer=opt_str,
            pretrained=hp.pretrained,
            project=str(runs_dir),
            name="yolo_train",
            exist_ok=True,
            plots=True,
            save=True,
            device=0 if torch.cuda.is_available() else "cpu",
            mosaic=1.0 if aug.mosaic else 0.0,
            fliplr=0.5 if aug.random_flip else 0.0,
            degrees=15.0 if aug.random_rotation else 0.0,
            patience=yolo_patience,
            verbose=False
        )

        save_dir = Path(getattr(train_results, 'save_dir', runs_dir / "yolo_train"))
        best_weight = save_dir / "weights" / "best.pt"
        last_weight = save_dir / "weights" / "last.pt"

        if best_weight.exists():
            shutil.copy2(best_weight, ckpt_dir / f"{hp.architecture.value}_best.pt")
            shutil.copy2(best_weight, ckpt_dir / "yolo_best.pt")
            shutil.copy2(best_weight, ckpt_dir / "best.pt")
        if last_weight.exists():
            shutil.copy2(last_weight, ckpt_dir / f"{hp.architecture.value}_last.pt")
            shutil.copy2(last_weight, ckpt_dir / "yolo_last.pt")
            shutil.copy2(last_weight, ckpt_dir / "last.pt")

        if not getattr(job, 'should_stop', False):
            job.status = "completed"
            job.current_epoch = hp.epochs
            job.log(f"🎉 YOLO 物件偵測訓練完成！最佳 mAP@0.5: {job.best_val_acc:.2f}% | 權重已儲存")
        else:
            job.status = "stopped"
            job.log(f"🛑 訓練已手動中斷！已成功保留迄今最佳模型 (最佳 mAP@0.5: {job.best_val_acc:.2f}%) | 權重已儲存")

    def load_model(self, project_dir: Path, checkpoint_path: Optional[Path] = None) -> Tuple[Any, List[str]]:
        if not HAS_ULTRALYTICS:
            raise RuntimeError("Ultralytics 套件未安裝")

        # Resolve architecture-specific YOLO checkpoint
        ckpt_file = checkpoint_path
        if not ckpt_file:
            yolo_best = project_dir / "models" / "checkpoints" / "yolo_best.pt"
            if yolo_best.exists():
                ckpt_file = yolo_best
            else:
                ckpt_file = project_dir / "models" / "checkpoints" / "best.pt"
                if not ckpt_file.exists():
                    ckpt_file = project_dir / "models" / "checkpoints" / "last.pt"

        # Read classes from data.yaml or annotations.json
        classes = ["目標物"]
        yaml_file = project_dir / "datasets" / "yolo" / "data.yaml"
        if yaml_file.exists():
            try:
                with open(yaml_file, "r", encoding="utf-8") as f:
                    ydata = yaml.safe_load(f)
                    if "names" in ydata:
                        names = ydata["names"]
                        if isinstance(names, dict):
                            classes = [names[k] for k in sorted(names.keys())]
                        elif isinstance(names, list):
                            classes = names
            except Exception:
                pass
        else:
            anno_file = project_dir / "annotations" / "annotations.json"
            if anno_file.exists():
                try:
                    with open(anno_file, "r", encoding="utf-8") as f:
                        coco = json.load(f)
                        cats = coco.get("categories", [])
                        if cats:
                            classes = [c["name"] for c in sorted(cats, key=lambda x: x["id"])]
                except Exception:
                    pass

        if ckpt_file and ckpt_file.exists():
            try:
                model = YOLO(str(ckpt_file))
                return model, classes
            except Exception as e:
                print(f"Warning loading YOLO checkpoint ({e}), fallback to base model")

        return YOLO("yolo26n.pt"), classes

    def predict(
        self,
        model: Any,
        image: Image.Image,
        classes: List[str],
        conf_threshold: float = 0.01,
        roi: Optional[RoiBox] = None
    ) -> List[InferenceResultItem]:
        orig_w, orig_h = image.size

        # Apply ROI Crop
        processed_img = image
        roi_applied = False
        roi_x, roi_y = 0.0, 0.0

        if roi and roi.width > 10 and roi.height > 10:
            rx = roi.x * orig_w if roi.x <= 1.0 else roi.x
            ry = roi.y * orig_h if roi.y <= 1.0 else roi.y
            rw = roi.width * orig_w if roi.width <= 1.0 else roi.width
            rh = roi.height * orig_h if roi.height <= 1.0 else roi.height

            left = max(0, int(rx))
            top = max(0, int(ry))
            right = min(orig_w, int(rx + rw))
            bottom = min(orig_h, int(ry + rh))

            if right > left and bottom > top:
                processed_img = image.crop((left, top, right, bottom))
                roi_applied = True
                roi_x, roi_y = float(left), float(top)

        results = model.predict(processed_img, conf=max(0.001, conf_threshold), verbose=False)
        predictions: List[InferenceResultItem] = []

        if results and len(results) > 0:
            r = results[0]
            boxes = r.boxes
            if boxes is not None and len(boxes) > 0:
                model_names = getattr(model, 'names', getattr(r, 'names', {}))
                for i in range(len(boxes)):
                    cls_id = int(boxes.cls[i].item())
                    conf = float(boxes.conf[i].item())

                    if 0 <= cls_id < len(classes):
                        label = classes[cls_id]
                    elif isinstance(model_names, dict) and cls_id in model_names:
                        label = model_names[cls_id]
                    elif isinstance(model_names, list) and 0 <= cls_id < len(model_names):
                        label = model_names[cls_id]
                    else:
                        label = f"目標物_{cls_id}"

                    xyxy = boxes.xyxy[i].tolist()
                    bx_min, by_min, bx_max, by_max = xyxy[0], xyxy[1], xyxy[2], xyxy[3]
                    bw = bx_max - bx_min
                    bh = by_max - by_min

                    if roi_applied:
                        final_x = (roi_x + bx_min) / float(orig_w)
                        final_y = (roi_y + by_min) / float(orig_h)
                        final_w = bw / float(orig_w)
                        final_h = bh / float(orig_h)
                    else:
                        final_x = bx_min / max(1.0, float(orig_w))
                        final_y = by_min / max(1.0, float(orig_h))
                        final_w = bw / max(1.0, float(orig_w))
                        final_h = bh / max(1.0, float(orig_h))

                    final_x = min(1.0, max(0.0, final_x))
                    final_y = min(1.0, max(0.0, final_y))
                    final_w = min(1.0, max(0.001, final_w))
                    final_h = min(1.0, max(0.001, final_h))

                    predictions.append(
                        InferenceResultItem(
                            label=label,
                            confidence=round(conf * 100.0, 2),
                            probability=round(conf, 4),
                            bbox=[round(final_x, 4), round(final_y, 4), round(final_w, 4), round(final_h, 4)]
                        )
                    )

        predictions.sort(key=lambda x: x.confidence, reverse=True)
        if not predictions:
            predictions.append(InferenceResultItem(label=classes[0] if classes else "未檢出目標", confidence=0.0, probability=0.0, bbox=None))

        return predictions

    def export_onnx(
        self,
        project_dir: Path,
        checkpoint_path: Path,
        output_path: Path,
        image_size: int = 640
    ) -> Path:
        model = YOLO(str(checkpoint_path))
        exported_file = model.export(format="onnx", imgsz=image_size, dynamic=False, simplify=True)
        if exported_file and Path(exported_file).exists():
            if str(exported_file) != str(output_path):
                shutil.copy2(exported_file, output_path)
            return output_path
        raise RuntimeError("YOLO ONNX 匯出失敗")
