import os
import json
import time
from pathlib import Path
from typing import List, Dict, Tuple, Optional, Any
from PIL import Image

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import torchvision.transforms as transforms
import torchvision.models as models

from backend.app.models.training import (
    TrainConfigRequest,
    Hyperparameters,
    ModelArchitecture,
    OptimizerType,
    EpochMetric
)
from backend.app.models.inference import RoiBox, InferenceResultItem
from backend.app.engines.base_engine import BaseModelEngine


class ClassificationDataset(Dataset):
    def __init__(self, samples: List[Dict[str, Any]], transform=None):
        self.samples = samples
        self.transform = transform

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        item = self.samples[idx]
        img = Image.open(item["path"]).convert("RGB")
        if self.transform:
            img = self.transform(img)
        return img, item["label"]


class ClassificationModelEngine(BaseModelEngine):
    """
    Dedicated Model Engine for Image Classification (ResNet18/50, MobileNetV3, EfficientNet, ViT).
    """

    def prepare_dataset(self, project_dir: Path) -> Dict[str, Any]:
        raw_dir = project_dir / "datasets" / "raw"
        anno_file = project_dir / "annotations" / "annotations.json"
        splits_file = project_dir / "datasets" / "splits" / "splits.json"

        splits_map = {}
        if splits_file.exists():
            try:
                with open(splits_file, "r", encoding="utf-8") as f:
                    splits_map = json.load(f)
            except Exception:
                pass

        categories_map = {}
        class_names = []
        img_label_map = {}

        if anno_file.exists():
            try:
                with open(anno_file, "r", encoding="utf-8") as f:
                    coco = json.load(f)
                    cats = coco.get("categories", [])
                    sorted_cats = sorted(cats, key=lambda x: x["id"])
                    class_names = [c["name"] for c in sorted_cats]
                    categories_map = {c["id"]: idx for idx, c in enumerate(sorted_cats)}

                    for a in coco.get("annotations", []):
                        img_id = str(a.get("image_id"))
                        cat_id = a.get("category_id")
                        cat_idx = categories_map.get(cat_id, 0)
                        img_label_map[img_id] = cat_idx
            except Exception:
                pass

        if not class_names:
            class_names = ["類別_0", "類別_1"]

        all_files = [p for p in raw_dir.iterdir() if p.is_file() and p.suffix.lower() in [".jpg", ".jpeg", ".png", ".webp", ".bmp"]] if raw_dir.exists() else []

        train_samples = []
        val_samples = []

        for idx, p in enumerate(all_files):
            fname = p.name
            fid = fname.split(".")[0].replace("img_", "")
            label = img_label_map.get(fname, img_label_map.get(fid, idx % len(class_names)))
            split = splits_map.get(fname, "train" if idx % 5 != 0 else "val")

            sample = {"path": p, "label": label, "filename": fname}
            if split == "val":
                val_samples.append(sample)
            else:
                train_samples.append(sample)

        if not val_samples and train_samples:
            val_samples = train_samples[:max(1, len(train_samples) // 5)]

        return {
            "train_samples": train_samples,
            "val_samples": val_samples,
            "classes": class_names,
            "train_count": len(train_samples),
            "val_count": len(val_samples)
        }

    def _build_model(self, arch: ModelArchitecture | str, num_classes: int, pretrained: bool = True) -> nn.Module:
        num_classes = max(2, num_classes)
        arch_str = arch.value if isinstance(arch, ModelArchitecture) else str(arch).lower()

        if "swin" in arch_str:
            weights = models.Swin_T_Weights.DEFAULT if pretrained and hasattr(models, 'Swin_T_Weights') else None
            m = models.swin_t(weights=weights)
            m.head = nn.Linear(m.head.in_features, num_classes)
            return m
        elif "hrnet" in arch_str:
            weights = models.DenseNet121_Weights.DEFAULT if pretrained and hasattr(models, 'DenseNet121_Weights') else None
            m = models.densenet121(weights=weights)
            m.classifier = nn.Linear(m.classifier.in_features, num_classes)
            return m
        elif "resnet50" in arch_str or "fpn" in arch_str:
            weights = models.ResNet50_Weights.DEFAULT if pretrained and hasattr(models, 'ResNet50_Weights') else None
            m = models.resnet50(weights=weights)
            m.fc = nn.Linear(m.fc.in_features, num_classes)
            return m
        elif "mobilenet" in arch_str:
            weights = models.MobileNet_V3_Small_Weights.DEFAULT if pretrained and hasattr(models, 'MobileNet_V3_Small_Weights') else None
            m = models.mobilenet_v3_small(weights=weights)
            m.classifier[3] = nn.Linear(m.classifier[3].in_features, num_classes)
            return m
        elif "efficientnet" in arch_str:
            weights = models.EfficientNet_B0_Weights.DEFAULT if pretrained and hasattr(models, 'EfficientNet_B0_Weights') else None
            m = models.efficientnet_b0(weights=weights)
            m.classifier[1] = nn.Linear(m.classifier[1].in_features, num_classes)
            return m
        elif "convnext" in arch_str:
            weights = models.ConvNeXt_Tiny_Weights.DEFAULT if pretrained and hasattr(models, 'ConvNeXt_Tiny_Weights') else None
            m = models.convnext_tiny(weights=weights)
            m.classifier[2] = nn.Linear(m.classifier[2].in_features, num_classes)
            return m
        elif "vit" in arch_str:
            weights = models.ViT_B_16_Weights.DEFAULT if pretrained and hasattr(models, 'ViT_B_16_Weights') else None
            m = models.vit_b_16(weights=weights)
            m.heads.head = nn.Linear(m.heads.head.in_features, num_classes)
            return m
        else: # Default ResNet18
            weights = models.ResNet18_Weights.DEFAULT if pretrained and hasattr(models, 'ResNet18_Weights') else None
            m = models.resnet18(weights=weights)
            m.fc = nn.Linear(m.fc.in_features, num_classes)
            return m

    def train(self, job: Any, config: TrainConfigRequest, project_dir: Path) -> None:
        hp = config.hyperparameters
        aug = config.augmentation
        dataset_info = self.prepare_dataset(project_dir)
        train_samples = dataset_info["train_samples"]
        val_samples = dataset_info["val_samples"]
        class_names = dataset_info["classes"]
        num_classes = max(2, len(class_names))

        job.log(f"🚀 初始化影像分類模型訓練 (架構: {hp.architecture.value}, 類別數: {num_classes})")
        job.log(f"📂 樣本載入完成: 訓練集 {len(train_samples)} 張, 驗證集 {len(val_samples)} 張")

        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model = self._build_model(hp.architecture, num_classes=num_classes, pretrained=hp.pretrained).to(device)

        transform_train_list = [
            transforms.Resize((hp.image_size, hp.image_size)),
            transforms.RandomHorizontalFlip(p=0.5 if aug.random_flip else 0.0),
            transforms.RandomRotation(degrees=15 if aug.random_rotation else 0),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ]
        transform_val = transforms.Compose([
            transforms.Resize((hp.image_size, hp.image_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

        train_ds = ClassificationDataset(train_samples, transform=transforms.Compose(transform_train_list))
        val_ds = ClassificationDataset(val_samples, transform=transform_val)

        train_loader = DataLoader(train_ds, batch_size=min(hp.batch_size, max(1, len(train_samples))), shuffle=True)
        val_loader = DataLoader(val_ds, batch_size=min(hp.batch_size, max(1, len(val_samples))), shuffle=False)

        criterion = nn.CrossEntropyLoss()
        optimizer = optim.AdamW(model.parameters(), lr=hp.learning_rate, weight_decay=1e-4)
        if hp.optimizer == OptimizerType.SGD:
            optimizer = optim.SGD(model.parameters(), lr=hp.learning_rate, momentum=0.9, weight_decay=1e-4)

        scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=max(1, hp.epochs))

        ckpt_dir = project_dir / "models" / "checkpoints"
        ckpt_dir.mkdir(parents=True, exist_ok=True)

        job.log("🏁 影像分類神經網絡訓練正式開始...")

        for epoch in range(1, hp.epochs + 1):
            if getattr(job, 'should_stop', False):
                break

            t0 = time.time()
            model.train()
            total_train_loss = 0.0
            correct_train = 0
            total_train = 0

            for imgs, targets in train_loader:
                imgs, targets = imgs.to(device), targets.to(device)
                optimizer.zero_grad()
                outputs = model(imgs)
                loss = criterion(outputs, targets)
                loss.backward()
                optimizer.step()

                total_train_loss += loss.item() * imgs.size(0)
                _, preds = torch.max(outputs, 1)
                correct_train += (preds == targets).sum().item()
                total_train += imgs.size(0)

            scheduler.step()
            train_loss = total_train_loss / max(1, total_train)
            train_acc = (correct_train / max(1, total_train)) * 100.0

            # Evaluation
            model.eval()
            total_val_loss = 0.0
            correct_val = 0
            total_val = 0

            with torch.no_grad():
                for imgs, targets in val_loader:
                    imgs, targets = imgs.to(device), targets.to(device)
                    outputs = model(imgs)
                    loss = criterion(outputs, targets)
                    total_val_loss += loss.item() * imgs.size(0)
                    _, preds = torch.max(outputs, 1)
                    correct_val += (preds == targets).sum().item()
                    total_val += imgs.size(0)

            val_loss = total_val_loss / max(1, total_val)
            val_acc = (correct_val / max(1, total_val)) * 100.0

            dur = max(0.2, time.time() - t0)
            eta = (hp.epochs - epoch) * dur

            is_best = val_acc >= job.best_val_acc
            if is_best:
                job.best_val_acc = round(val_acc, 2)
                torch.save(model.state_dict(), ckpt_dir / f"{hp.architecture.value}_best.pt")
                torch.save(model.state_dict(), ckpt_dir / "best.pt")

            torch.save(model.state_dict(), ckpt_dir / f"{hp.architecture.value}_last.pt")
            torch.save(model.state_dict(), ckpt_dir / "last.pt")

            metric = EpochMetric(
                epoch=epoch,
                total_epochs=hp.epochs,
                train_loss=round(train_loss, 4),
                train_acc=round(train_acc, 2),
                val_loss=round(val_loss, 4),
                val_acc=round(val_acc, 2),
                epoch_duration_sec=round(dur, 2),
                best_val_acc=job.best_val_acc,
                eta_sec=round(eta, 1),
                lr=round(float(optimizer.param_groups[0]["lr"]), 6)
            )
            job.current_epoch = epoch
            job.history.append(metric)
            job.emit_metric(metric)

        if not getattr(job, 'should_stop', False):
            job.status = "completed"
            job.current_epoch = hp.epochs
            job.log(f"🎉 影像分類訓練完成！最佳準確率: {job.best_val_acc:.2f}% | 權重已儲存")
        else:
            job.status = "stopped"
            job.log(f"🛑 訓練已手動中斷！已成功保留迄今最佳模型 (最佳準確率: {job.best_val_acc:.2f}%) | 權重已儲存")

    def load_model(self, project_dir: Path, checkpoint_path: Optional[Path] = None) -> Tuple[Any, List[str]]:
        anno_file = project_dir / "annotations" / "annotations.json"
        classes = ["類別_0", "類別_1"]
        if anno_file.exists():
            try:
                with open(anno_file, "r", encoding="utf-8") as f:
                    coco = json.load(f)
                    cats = coco.get("categories", [])
                    if cats:
                        classes = [c["name"] for c in sorted(cats, key=lambda x: x["id"])]
            except Exception:
                pass

        arch_str = "resnet18"
        all_candidates = [
            "swin_tiny", "vit_feature", "resnet50_fpn", "hrnet_w18",
            "resnet50", "mobilenet_v3_small", "efficientnet_b0", "convnext_tiny", "vit_b16", "resnet18"
        ]
        if checkpoint_path:
            name = checkpoint_path.name.lower()
            for cand in all_candidates:
                if cand in name:
                    arch_str = cand
                    break

        if arch_str == "resnet18":
            history_file = project_dir / "models" / "training_history.json"
            if history_file.exists():
                try:
                    with open(history_file, "r", encoding="utf-8") as f:
                        hist_data = json.load(f)
                        hist_arch = str(hist_data.get("architecture", "")).lower()
                        for cand in all_candidates:
                            if cand in hist_arch:
                                arch_str = cand
                                break
                except Exception:
                    pass

        model = self._build_model(arch_str, num_classes=max(2, len(classes)), pretrained=False)
        ckpt_file = checkpoint_path or (project_dir / "models" / "checkpoints" / f"{arch_str}_best.pt")
        if not ckpt_file or not ckpt_file.exists():
            ckpt_file = project_dir / "models" / "checkpoints" / "best.pt"

        if ckpt_file and ckpt_file.exists():
            try:
                state = torch.load(ckpt_file, map_location="cpu")
                model.load_state_dict(state)
            except Exception as e:
                print(f"Warning loading classification checkpoint: {e}")
        model.eval()
        return model, classes

    def predict(
        self,
        model: Any,
        image: Image.Image,
        classes: List[str],
        conf_threshold: float = 0.01,
        roi: Optional[RoiBox] = None
    ) -> List[InferenceResultItem]:
        processed_img = image
        if roi and roi.width > 10 and roi.height > 10:
            w, h = image.size
            rx = roi.x * w if roi.x <= 1.0 else roi.x
            ry = roi.y * h if roi.y <= 1.0 else roi.y
            rw = roi.width * w if roi.width <= 1.0 else roi.width
            rh = roi.height * h if roi.height <= 1.0 else roi.height
            processed_img = image.crop((int(rx), int(ry), int(rx + rw), int(ry + rh)))

        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

        tensor = transform(processed_img).unsqueeze(0)
        with torch.no_grad():
            outputs = model(tensor)
            probs = torch.softmax(outputs, dim=1)[0].tolist()

        predictions: List[InferenceResultItem] = []
        for idx, prob in enumerate(probs):
            label = classes[idx] if idx < len(classes) else f"類別_{idx}"
            predictions.append(
                InferenceResultItem(
                    label=label,
                    confidence=round(prob * 100.0, 2),
                    probability=round(prob, 4),
                    bbox=None
                )
            )

        predictions.sort(key=lambda x: x.confidence, reverse=True)
        return predictions

    def export_onnx(
        self,
        project_dir: Path,
        checkpoint_path: Path,
        output_path: Path,
        image_size: int = 224
    ) -> Path:
        model, _ = self.load_model(project_dir, checkpoint_path)
        dummy_input = torch.randn(1, 3, image_size, image_size)
        torch.onnx.export(
            model,
            dummy_input,
            str(output_path),
            input_names=["input"],
            output_names=["output"],
            dynamic_axes={"input": {0: "batch"}, "output": {0: "batch"}},
            opset_version=13
        )
        return output_path
