import cv2
import base64
from typing import List
from fastapi import APIRouter

router = APIRouter(prefix="/camera", tags=["Camera"])

@router.get("/devices")
def list_camera_devices():
    """Detect available local camera indexes."""
    available = []
    # Test indexes 0 to 4
    for index in range(4):
        cap = cv2.VideoCapture(index, cv2.CAP_DSHOW)
        if cap.isOpened():
            ret, _ = cap.read()
            if ret:
                available.append({
                    "index": index,
                    "name": f"Camera Device #{index}",
                    "backend": "DirectShow"
                })
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
    cap = cv2.VideoCapture(device_index)
    if not cap.isOpened():
        return {"success": False, "error": "無法開啟攝影機裝置"}
    
    ret, frame = cap.read()
    cap.release()
    if not ret:
        return {"success": False, "error": "攝影機截圖失敗"}
        
    _, buffer = cv2.imencode('.jpg', frame)
    jpg_as_text = base64.b64encode(buffer).decode('utf-8')
    return {
        "success": True,
        "image_base64": f"data:image/jpeg;base64,{jpg_as_text}"
    }
