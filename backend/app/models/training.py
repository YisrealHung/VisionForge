from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field

class ModelArchitecture(str, Enum):
    # Object Detection
    YOLO26_N = "yolo26_n"
    YOLO26_S = "yolo26_s"
    YOLO26_M = "yolo26_m"
    YOLO26_L = "yolo26_l"
    DFINE_N = "dfine_n"
    DFINE_S = "dfine_s"
    DFINE_L = "dfine_l"
    SSDLITE_MOBILENET_V3 = "ssdlite_mobilenet_v3"
    
    # Classification
    RESNET18 = "resnet18"
    RESNET50 = "resnet50"
    EFFICIENTNET_B0 = "efficientnet_b0"
    MOBILENET_V3_SMALL = "mobilenet_v3_small"
    CONVNEXT_TINY = "convnext_tiny"
    VIT_B16 = "vit_b16"
    CUSTOM_CNN = "custom_cnn"
    
    # Regression
    RESNET18_REG = "resnet18_reg"
    RESNET50_REG = "resnet50_reg"
    EFFICIENTNET_B0_REG = "efficientnet_b0_reg"
    MOBILENET_V3_REG = "mobilenet_v3_reg"
    
    # Feature Identification
    RESNET50_FPN = "resnet50_fpn"
    HRNET_W18 = "hrnet_w18"
    SWIN_TINY = "swin_tiny"
    VIT_FEATURE = "vit_feature"

class OptimizerType(str, Enum):
    ADAMW = "adamw"
    SGD = "sgd"
    ADAM = "adam"

class PresetType(str, Enum):
    FAST = "fast"
    BALANCED = "balanced"
    ACCURATE = "accurate"
    CUSTOM = "custom"

class AugmentationConfig(BaseModel):
    random_flip: bool = True
    random_rotation: bool = True
    color_jitter: bool = False
    random_crop: bool = False
    mosaic: bool = False

class Hyperparameters(BaseModel):
    architecture: ModelArchitecture = ModelArchitecture.RESNET18
    epochs: int = Field(default=10, ge=1, le=500)
    batch_size: int = Field(default=16, ge=1, le=128)
    learning_rate: float = Field(default=0.001, ge=0.00001, le=0.1)
    optimizer: OptimizerType = OptimizerType.ADAMW
    pretrained: bool = True
    image_size: int = Field(default=224, ge=64, le=1024)
    early_stopping_patience: int = Field(default=5, ge=0, le=50)

class TrainConfigRequest(BaseModel):
    preset: PresetType = PresetType.FAST
    hyperparameters: Hyperparameters
    augmentation: AugmentationConfig = AugmentationConfig()

class EpochMetric(BaseModel):
    epoch: int
    total_epochs: int
    train_loss: float
    train_acc: float
    val_loss: float
    val_acc: float
    epoch_duration_sec: float
    best_val_acc: float
    eta_sec: float
    lr: float

class TrainingStatus(BaseModel):
    project_id: str
    status: str  # idle, training, completed, failed, stopped
    current_epoch: int = 0
    total_epochs: int = 0
    history: List[EpochMetric] = []
    best_val_acc: float = 0.0
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    error_message: Optional[str] = None
    model_architecture: Optional[str] = None
    weights_path: Optional[str] = None
    logs: List[str] = []

class TrainedModelInfo(BaseModel):
    architecture: str
    name: str
    task_type: str
    best_val_acc: float = 0.0
    total_epochs: int = 0
    trained_at: Optional[str] = None
    checkpoint_file: str
    checkpoint_size_str: str = "0 MB"
    classes: List[str] = []
    is_latest: bool = False
