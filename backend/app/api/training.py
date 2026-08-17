import asyncio
import json
from typing import Dict, List
from pathlib import Path
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException

from backend.app.core.config import settings
from backend.app.models.training import TrainConfigRequest, TrainingStatus, TrainedModelInfo
from backend.app.services.training_engine import TrainingEngine

router = APIRouter(prefix="/projects/{project_id}/train", tags=["Training"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, project_id: str, websocket: WebSocket):
        await websocket.accept()
        if project_id not in self.active_connections:
            self.active_connections[project_id] = []
        self.active_connections[project_id].append(websocket)

    def disconnect(self, project_id: str, websocket: WebSocket):
        if project_id in self.active_connections:
            if websocket in self.active_connections[project_id]:
                self.active_connections[project_id].remove(websocket)

    async def broadcast_json(self, project_id: str, data: dict):
        if project_id in self.active_connections:
            for connection in list(self.active_connections[project_id]):
                try:
                    await connection.send_json(data)
                except Exception:
                    self.disconnect(project_id, connection)

manager = ConnectionManager()

@router.post("/start", response_model=TrainingStatus)
async def start_training(project_id: str, config: TrainConfigRequest):
    """Start model training background worker."""
    try:
        loop = asyncio.get_running_loop()
        job = TrainingEngine.start_training(project_id, config)
        
        # Attach broadcast callbacks
        def on_log(msg: str):
            try:
                asyncio.run_coroutine_threadsafe(
                    manager.broadcast_json(project_id, {"type": "log", "message": msg}),
                    loop
                )
            except Exception:
                pass

        def on_metric(metric):
            try:
                asyncio.run_coroutine_threadsafe(
                    manager.broadcast_json(project_id, {"type": "metric", "data": metric.model_dump()}),
                    loop
                )
            except Exception:
                pass

        job.log_callbacks.append(on_log)
        job.metric_callbacks.append(on_metric)

        return TrainingEngine.get_status(project_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/stop")
async def stop_training(project_id: str):
    """Stop active training job."""
    success = TrainingEngine.stop_training(project_id)
    return {"success": success, "message": "Stop signal sent" if success else "No active training job found"}

@router.get("/status", response_model=TrainingStatus)
def get_training_status(project_id: str):
    """Get current training status, metrics, and logs."""
    return TrainingEngine.get_status(project_id)

@router.get("/logs")
def get_training_logs(project_id: str):
    """Get real-time terminal logs."""
    return {"logs": TrainingEngine.get_logs(project_id)}

@router.get("/history-list")
def get_training_history_list(project_id: str):
    """Get all training runs for Model Arena comparison."""
    histories_file = settings.PROJECTS_DIR / project_id / "models" / "training_histories.json"
    if not histories_file.exists():
        # Fallback: try single history file
        single_file = settings.PROJECTS_DIR / project_id / "models" / "training_history.json"
        if single_file.exists():
            try:
                with open(single_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                if "run_id" not in data:
                    data["run_id"] = "run_1_legacy"
                    data["run_number"] = 1
                return [data]
            except Exception:
                return []
        return []
    try:
        with open(histories_file, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

@router.get("/trained-models", response_model=List[TrainedModelInfo])
def get_trained_models_endpoint(project_id: str):
    """Get all available distinct trained model architectures and their latest checkpoints for inference selection."""
    from backend.app.services.trained_model_service import TrainedModelService
    return TrainedModelService.list_trained_models(project_id)

@router.post("/trained-models/{architecture}/select")
def select_trained_model(project_id: str, architecture: str):
    """Select a specific trained model as the active one."""
    from backend.app.services.trained_model_service import TrainedModelService
    success = TrainedModelService.select_model(project_id, architecture)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to select model")
    return {"success": True, "message": f"Model {architecture} selected as active"}

@router.delete("/trained-models/{architecture}")
def delete_trained_model(project_id: str, architecture: str):
    """Delete a specific trained model."""
    from backend.app.services.trained_model_service import TrainedModelService
    success = TrainedModelService.delete_model(project_id, architecture)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete model")
    return {"success": True, "message": f"Model {architecture} deleted"}

@router.websocket("/ws")
async def websocket_training_stream(websocket: WebSocket, project_id: str):
    """WebSocket stream for real-time training metrics and logs."""
    await manager.connect(project_id, websocket)
    try:
        # Send initial status with full history and logs
        status = TrainingEngine.get_status(project_id)
        logs = TrainingEngine.get_logs(project_id)
        await websocket.send_json({
            "type": "init", 
            "status": status.model_dump(), 
            "logs": logs
        })
        
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(project_id, websocket)
    except Exception:
        manager.disconnect(project_id, websocket)
