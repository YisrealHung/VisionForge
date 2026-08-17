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

class RegressionDataset(Dataset):
    def __init__(self, samples: List[Dict[str, Any]], transform=None):
        self.samples = samples
        self.transform = transform

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        sample = self.samples[idx]
        img_path = sample["path"]
        target = sample["target"]  # [x, y]
        
        try:
            image = Image.open(img_path).convert("RGB")
        except Exception:
            # Fallback to empty if missing
            image = Image.new("RGB", (224, 224))
            
        if self.transform:
            image = self.transform(image)
            
        return image, torch.tensor(target, dtype=torch.float32)

class RegressionModelEngine(BaseModelEngine):
    """
    Dedicated Model Engine for Continuous Image Regression (ResNet18/50 Regressor).
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

        img_target_map = {}
        if anno_file.exists():
            try:
                with open(anno_file, "r", encoding="utf-8") as f:
                    coco = json.load(f)
                    for a in coco.get("annotations", []):
                        img_id = str(a.get("image_id"))
                        bbox = a.get("bbox")
                        if bbox and len(bbox) >= 2:
                            img_target_map[img_id] = [bbox[0], bbox[1]]
                        else:
                            val = float(a.get("value", a.get("area", 0.5)))
                            img_target_map[img_id] = [val, val]
            except Exception:
                pass

        all_files = [p for p in raw_dir.iterdir() if p.is_file()] if raw_dir.exists() else []
        train_samples = []
        val_samples = []

        for idx, p in enumerate(all_files):
            fname = p.name
            fid = fname.split(".")[0].replace("img_", "")
            target_val = img_target_map.get(fname, img_target_map.get(fid, [0.5, 0.5]))
            split = splits_map.get(fname, "train" if idx % 5 != 0 else "val")

            sample = {"path": p, "target": target_val, "filename": fname}
            if split == "val":
                val_samples.append(sample)
            else:
                train_samples.append(sample)

        return {
            "train_samples": train_samples,
            "val_samples": val_samples,
            "classes": ["迴歸座標 X", "迴歸座標 Y"],
            "train_count": len(train_samples),
            "val_count": len(val_samples)
        }

    def _build_model(self, arch: ModelArchitecture, pretrained: bool = True) -> nn.Module:
        if arch.value.startswith("resnet50"):
            weights = models.ResNet50_Weights.DEFAULT if pretrained and hasattr(models, 'ResNet50_Weights') else None
            m = models.resnet50(weights=weights)
            in_features = m.fc.in_features
            m.fc = nn.Sequential(nn.Linear(in_features, 2), nn.Sigmoid())
        elif arch.value.startswith("efficientnet"):
            weights = models.EfficientNet_B0_Weights.DEFAULT if pretrained and hasattr(models, 'EfficientNet_B0_Weights') else None
            m = models.efficientnet_b0(weights=weights)
            in_features = m.classifier[1].in_features
            m.classifier[1] = nn.Sequential(nn.Linear(in_features, 2), nn.Sigmoid())
        elif arch.value.startswith("mobilenet"):
            weights = models.MobileNet_V3_Small_Weights.DEFAULT if pretrained and hasattr(models, 'MobileNet_V3_Small_Weights') else None
            m = models.mobilenet_v3_small(weights=weights)
            in_features = m.classifier[3].in_features
            m.classifier[3] = nn.Sequential(nn.Linear(in_features, 2), nn.Sigmoid())
        else:
            weights = models.ResNet18_Weights.DEFAULT if pretrained and hasattr(models, 'ResNet18_Weights') else None
            m = models.resnet18(weights=weights)
            in_features = m.fc.in_features
            m.fc = nn.Sequential(nn.Linear(in_features, 2), nn.Sigmoid())
            
        return m

    def train(self, job: Any, config: TrainConfigRequest, project_dir: Path) -> None:
        hp = config.hyperparameters
        dataset_info = self.prepare_dataset(project_dir)
        train_samples = dataset_info["train_samples"]
        val_samples = dataset_info["val_samples"]

        job.log(f"🚀 初始化影像迴歸模型訓練 (架構: {hp.architecture.value})")
        job.log(f"📂 樣本載入完成: 訓練集 {len(train_samples)} 筆, 驗證集 {len(val_samples)} 筆")

        # Prepare DataLoaders
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
        train_ds = RegressionDataset(train_samples, transform=transform)
        val_ds = RegressionDataset(val_samples, transform=transform)
        
        train_loader = DataLoader(train_ds, batch_size=hp.batch_size, shuffle=True, num_workers=0)
        val_loader = DataLoader(val_ds, batch_size=hp.batch_size, shuffle=False, num_workers=0)

        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model = self._build_model(hp.architecture, pretrained=hp.pretrained).to(device)

        criterion = nn.MSELoss()
        optimizer = optim.AdamW(model.parameters(), lr=hp.learning_rate)

        ckpt_dir = project_dir / "models" / "checkpoints"
        ckpt_dir.mkdir(parents=True, exist_ok=True)

        job.log("🏁 影像 2D 座標迴歸訓練正式開始 (Real PyTorch Training)...")

        for epoch in range(1, hp.epochs + 1):
            if getattr(job, 'should_stop', False):
                break

            t0 = time.time()
            
            # Training Phase
            model.train()
            total_train_loss = 0.0
            for images, targets in train_loader:
                images, targets = images.to(device), targets.to(device)
                optimizer.zero_grad()
                outputs = model(images)
                loss = criterion(outputs, targets)
                loss.backward()
                optimizer.step()
                total_train_loss += loss.item() * images.size(0)
            
            avg_train_loss = total_train_loss / max(1, len(train_samples))
            
            # Validation Phase
            model.eval()
            total_val_loss = 0.0
            with torch.no_grad():
                for images, targets in val_loader:
                    images, targets = images.to(device), targets.to(device)
                    outputs = model(images)
                    loss = criterion(outputs, targets)
                    total_val_loss += loss.item() * images.size(0)
                    
            avg_val_loss = total_val_loss / max(1, len(val_samples))
            rmse = avg_val_loss ** 0.5
            
            # Acc metric (heuristic, 0 distance = 100%, 0.1 dist = 90%)
            acc_metric = max(0.0, 100.0 - rmse * 100.0)

            dur = max(0.01, time.time() - t0)
            eta = (hp.epochs - epoch) * dur

            is_best = acc_metric >= job.best_val_acc
            if is_best:
                job.best_val_acc = round(acc_metric, 2)
                torch.save(model.state_dict(), ckpt_dir / "best.pt")

            torch.save(model.state_dict(), ckpt_dir / "last.pt")

            metric = EpochMetric(
                epoch=epoch,
                total_epochs=hp.epochs,
                train_loss=round(avg_train_loss, 4),
                train_acc=round(acc_metric, 2),
                val_loss=round(avg_val_loss, 4),
                val_acc=round(acc_metric, 2),
                epoch_duration_sec=round(dur, 2),
                best_val_acc=job.best_val_acc,
                eta_sec=round(eta, 1),
                lr=round(hp.learning_rate, 6)
            )
            job.current_epoch = epoch
            job.history.append(metric)
            job.emit_metric(metric)

            best_badge = " 🔥 (New Best RMSE!)" if is_best else ""
            job.log(f"Epoch [{epoch:02d}/{hp.epochs:02d}] - Loss: {avg_train_loss:.4f} | Val RMSE: {rmse:.4f} ({dur:.1f}s, ETA: {eta:.0f}s){best_badge}")

        job.status = "completed"
        job.current_epoch = hp.epochs
        job.log(f"🎉 真實影像迴歸模型訓練完成！最佳精確度指標: {job.best_val_acc:.2f}%")

    def load_model(self, project_dir: Path, checkpoint_path: Optional[Path] = None) -> Tuple[Any, List[str]]:
        arch_str = "resnet18_reg"
        history_file = project_dir / "models" / "training_history.json"
        if history_file.exists():
            try:
                import json
                with open(history_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    hist_arch = data.get("architecture", "")
                    if hist_arch.startswith("resnet50"):
                        arch_str = "resnet50_reg"
                    elif hist_arch.startswith("efficientnet"):
                        arch_str = "efficientnet_b0_reg"
                    elif hist_arch.startswith("mobilenet"):
                        arch_str = "mobilenet_v3_reg"
            except Exception:
                pass
                
        if arch_str == "resnet50_reg":
            arch_enum = ModelArchitecture.RESNET50_REG
        elif arch_str == "efficientnet_b0_reg":
            arch_enum = ModelArchitecture.EFFICIENTNET_B0_REG
        elif arch_str == "mobilenet_v3_reg":
            arch_enum = ModelArchitecture.MOBILENET_V3_REG
        else:
            arch_enum = ModelArchitecture.RESNET18_REG
            
        model = self._build_model(arch_enum, pretrained=False)
        ckpt_file = checkpoint_path or (project_dir / "models" / "checkpoints" / "best.pt")
        if ckpt_file.exists():
            try:
                state = torch.load(ckpt_file, map_location="cpu")
                model.load_state_dict(state)
            except Exception as e:
                print(f"Warning loading regression checkpoint: {e}")
        model.eval()
        return model, ["迴歸點座標"]

    def predict(
        self,
        model: Any,
        image: Image.Image,
        classes: List[str],
        conf_threshold: float = 0.01,
        roi: Optional[RoiBox] = None
    ) -> List[InferenceResultItem]:
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        tensor = transform(image).unsqueeze(0)
        with torch.no_grad():
            output = model(tensor)
            # output shape: (1, 2)
            x_val = float(output[0, 0].item())
            y_val = float(output[0, 1].item())

        return [
            InferenceResultItem(
                label=f"預測點 (X:{int(x_val * image.width)}, Y:{int(y_val * image.height)})",
                confidence=100.0,
                probability=1.0,
                bbox=[x_val, y_val, 0, 0]
            )
        ]

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
            output_names=["scalar_output"],
            opset_version=13
        )
        return output_path
