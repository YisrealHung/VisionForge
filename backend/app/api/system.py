import platform
import sys
from fastapi import APIRouter
from backend.app.core.config import settings

router = APIRouter(prefix="/system", tags=["System"])

@router.get("/health")
def health_check():
    """System health check and runtime information."""
    cuda_available = False
    device_name = "CPU Only"
    try:
        import torch
        cuda_available = torch.cuda.is_available()
        if cuda_available:
            device_name = torch.cuda.get_device_name(0)
    except ImportError:
        pass

    return {
        "status": "online",
        "app_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "python_version": sys.version.split()[0],
        "platform": platform.platform(),
        "gpu": {
            "available": cuda_available,
            "device": device_name
        }
    }
