from abc import ABC, abstractmethod
from pathlib import Path
from typing import List, Dict, Tuple, Optional, Any
from PIL import Image

from backend.app.models.training import TrainConfigRequest
from backend.app.models.inference import RoiBox, InferenceResultItem


class BaseModelEngine(ABC):
    """
    Abstract Base Class for all VisionForge Model Engines.
    Each model family (YOLO, D-FINE/RT-DETR, Classification, Regression)
    implements its own dedicated dataset preparation, training runner,
    inference predictor, and ONNX exporter.
    """

    @abstractmethod
    def prepare_dataset(self, project_dir: Path) -> Dict[str, Any]:
        """
        Convert project raw images and annotations into the model's native format.
        Returns metadata dictionary (e.g. data_path, classes, train_count, val_count).
        """
        pass

    @abstractmethod
    def train(self, job: Any, config: TrainConfigRequest, project_dir: Path) -> None:
        """
        Execute the native training loop for this specific model architecture.
        Streams metrics and logs to the provided job object.
        """
        pass

    @abstractmethod
    def load_model(self, project_dir: Path, checkpoint_path: Optional[Path] = None) -> Tuple[Any, List[str]]:
        """
        Load a trained model instance and return (model, class_names).
        """
        pass

    @abstractmethod
    def predict(
        self,
        model: Any,
        image: Image.Image,
        classes: List[str],
        conf_threshold: float = 0.01,
        roi: Optional[RoiBox] = None
    ) -> List[InferenceResultItem]:
        """
        Run inference on the image and return normalized predictions.
        Handles geometric transformations and bounding box re-projections.
        """
        pass

    @abstractmethod
    def export_onnx(
        self,
        project_dir: Path,
        checkpoint_path: Path,
        output_path: Path,
        image_size: int = 640
    ) -> Path:
        """
        Export the model checkpoint to standard ONNX format.
        """
        pass
