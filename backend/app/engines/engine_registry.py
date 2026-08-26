from typing import Dict, Type
from backend.app.models.training import ModelArchitecture
from backend.app.engines.base_engine import BaseModelEngine


class ModelEngineRegistry:
    """
    Central Registry for Model Engines.
    Provides dedicated architecture adapters and runners dynamically based on ModelArchitecture (Lazy loaded).
    """

    _engines: Dict[str, BaseModelEngine] = {}

    @classmethod
    def get_engine(cls, architecture: ModelArchitecture | str) -> BaseModelEngine:
        arch_str = architecture.value if isinstance(architecture, ModelArchitecture) else str(architecture).lower()

        # 1. Ultralytics YOLO Family (uses normalized .txt + data.yaml)
        if "yolo" in arch_str:
            if "yolo" not in cls._engines:
                from backend.app.engines.yolo_engine import YOLOModelEngine
                cls._engines["yolo"] = YOLOModelEngine()
            return cls._engines["yolo"]

        # 2. SSDLite MobileNetV3 (TorchVision Native Mobile Detection)
        elif "ssd" in arch_str:
            if "ssd" not in cls._engines:
                from backend.app.engines.ssdlite_engine import SSDLiteModelEngine
                cls._engines["ssd"] = SSDLiteModelEngine()
            return cls._engines["ssd"]

        # 3. D-FINE / RT-DETR / Transformer Detection Family (uses native COCO JSON)
        elif any(k in arch_str for k in ["dfine", "detr"]):
            if "dfine" not in cls._engines:
                from backend.app.engines.dfine_engine import DFINEModelEngine
                cls._engines["dfine"] = DFINEModelEngine()
            return cls._engines["dfine"]

        # 4. Continuous Regression Family
        elif "reg" in arch_str:
            if "regression" not in cls._engines:
                from backend.app.engines.regression_engine import RegressionModelEngine
                cls._engines["regression"] = RegressionModelEngine()
            return cls._engines["regression"]

        # 5. Classification & Feature Extraction Family (ResNet, MobileNet, EfficientNet, ViT, Swin, etc.)
        else:
            if "classification" not in cls._engines:
                from backend.app.engines.classification_engine import ClassificationModelEngine
                cls._engines["classification"] = ClassificationModelEngine()
            return cls._engines["classification"]

    @classmethod
    def is_detection_architecture(cls, architecture: ModelArchitecture | str) -> bool:
        arch_str = architecture.value if isinstance(architecture, ModelArchitecture) else str(architecture).lower()
        return any(k in arch_str for k in ["yolo", "dfine", "detr", "ssd"])
