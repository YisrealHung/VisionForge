import sys
import cv2
import base64
from typing import List
from fastapi import APIRouter

router = APIRouter(prefix="/camera", tags=["Camera"])

# DirectShow only exists on Windows; Linux (e.g. Jetson) uses V4L2.
if sys.platform.startswith("win"):
    _CAP_BACKEND, _BACKEND_NAME = cv2.CAP_DSHOW, "DirectShow"
elif sys.platform.startswith("linux"):
    _CAP_BACKEND, _BACKEND_NAME = cv2.CAP_V4L2, "V4L2"
else:
    _CAP_BACKEND, _BACKEND_NAME = cv2.CAP_ANY, "Default"

MAX_PROBE_INDEX = 5  # probe indexes 0..4

@router.get("/devices")
def list_camera_devices():
    """Detect available local camera indexes."""
    available = []
    for index in range(MAX_PROBE_INDEX):
        cap = cv2.VideoCapture(index, _CAP_BACKEND)
        try:
            if cap.isOpened():
                ret, _ = cap.read()
                if ret:
                    available.append({
                        "index": index,
                        "name": f"Camera Device #{index}",
                        "backend": _BACKEND_NAME
                    })
        finally:
            cap.release()
            
    if not available:
        available.append({
            "index": 0,
            "name": "預設本機攝影機 (Index: 0)",
            "backend": "Default"
        })
        
    return available

@router.get("/snapshot")
def capture_snapshot(device_index: int = 0):
    """Capture a single frame from the specified camera and return as base64 JPEG."""
    cap = cv2.VideoCapture(device_index, _CAP_BACKEND)
    try:
        if not cap.isOpened():
            return {"success": False, "error": "無法開啟攝影機裝置"}
        ret, frame = cap.read()
    finally:
        cap.release()
    if not ret:
        return {"success": False, "error": "攝影機截圖失敗"}
        
    _, buffer = cv2.imencode('.jpg', frame)
    jpg_as_text = base64.b64encode(buffer).decode('utf-8')
    return {
        "success": True,
        "image_base64": f"data:image/jpeg;base64,{jpg_as_text}"
    }
