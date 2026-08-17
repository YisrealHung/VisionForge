from typing import Dict, Type
from backend.app.models.training import ModelArchitecture
from backend.app.engines.base_engine import BaseModelEngine
from backend.app.engines.yolo_engine import YOLOModelEngine
from backend.app.engines.dfine_engine import DFINEModelEngine
from backend.app.engines.ssdlite_engine import SSDLiteModelEngine
from backend.app.engines.classification_engine import ClassificationModelEngine
from backend.app.engines.regression_engine import RegressionModelEngine


class ModelEngineRegistry:
    """
    Central Registry for Model Engines.
    Provides dedicated architecture adapters and runners dynamically based on ModelArchitecture.
    """

    _yolo_engine = YOLOModelEngine()
    _dfine_engine = DFINEModelEngine()
    _ssdlite_engine = SSDLiteModelEngine()
    _classification_engine = ClassificationModelEngine()
    _regression_engine = RegressionModelEngine()

    @classmethod
    def get_engine(cls, architecture: ModelArchitecture | str) -> BaseModelEngine:
        arch_str = architecture.value if isinstance(architecture, ModelArchitecture) else str(architecture).lower()

        # 1. Ultralytics YOLO Family (uses normalized .txt + data.yaml)
        if "yolo" in arch_str:
            return cls._yolo_engine

        # 2. SSDLite MobileNetV3 (TorchVision Native Mobile Detection)
        elif "ssd" in arch_str:
            return cls._ssdlite_engine

        # 3. D-FINE / RT-DETR / Transformer Detection Family (uses native COCO JSON)
        elif any(k in arch_str for k in ["dfine", "detr"]):
            return cls._dfine_engine

        # 4. Continuous Regression Family
        elif "reg" in arch_str:
            return cls._regression_engine

        # 5. Classification & Feature Extraction Family (ResNet, MobileNet, EfficientNet, ViT, Swin, etc.)
        else:
            return cls._classification_engine

    @classmethod
    def is_detection_architecture(cls, architecture: ModelArchitecture | str) -> bool:
        arch_str = architecture.value if isinstance(architecture, ModelArchitecture) else str(architecture).lower()
        return any(k in arch_str for k in ["yolo", "dfine", "detr", "ssd"])
