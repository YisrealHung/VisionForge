import os
import sys
import time
import json
import uuid
import shutil
import asyncio
import threading
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional, Any, Callable
from PIL import Image

import torch

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.models.training import (
    TrainConfigRequest,
    Hyperparameters,
    ModelArchitecture,
    OptimizerType,
    EpochMetric,
    TrainingStatus
)
from backend.app.engines.engine_registry import ModelEngineRegistry


class TrainingJob:
    def __init__(self, project_id: str, config: TrainConfigRequest):
        self.project_id = project_id
        self.config = config
        self.architecture = config.hyperparameters.architecture.value
        self.status = "pending"
        self.current_epoch = 0
        self.total_epochs = config.hyperparameters.epochs
        self.best_val_acc = 0.0
        self.start_time: Optional[str] = None
        self.end_time: Optional[str] = None
        self.error_message: Optional[str] = None
        self.history: List[EpochMetric] = []
        self.logs: List[str] = []
        self.subscribers: List[asyncio.Queue] = []
        self.should_stop = False

    def log(self, message: str):
        now_str = datetime.now().strftime("%H:%M:%S")
        log_entry = f"[{now_str}] {message}"
        self.logs.append(log_entry)
        print(log_entry)

        # Write to log file
        try:
            log_dir = settings.PROJECTS_DIR / self.project_id / "models"
            log_dir.mkdir(parents=True, exist_ok=True)
            with open(log_dir / "training.log", "a", encoding="utf-8") as f:
                f.write(log_entry + "\n")
        except Exception:
            pass

        # Broadcast log via WebSocket queues
        for q in self.subscribers:
            try:
                q.put_nowait({"type": "log", "message": log_entry})
            except Exception:
                pass

    def emit_metric(self, metric: EpochMetric):
        for q in self.subscribers:
            try:
                q.put_nowait({"type": "metric", "data": metric.model_dump()})
            except Exception:
                pass


class TrainingEngine:
    _jobs: Dict[str, TrainingJob] = {}
    _threads: Dict[str, threading.Thread] = {}

    @classmethod
    def get_job(cls, project_id: str) -> Optional[TrainingJob]:
        return cls._jobs.get(project_id)

    @classmethod
    def get_status(cls, project_id: str) -> TrainingStatus:
        job = cls._jobs.get(project_id)
        if job:
            latest = job.history[-1] if job.history else None
            return TrainingStatus(
                project_id=project_id,
                status=job.status,
                current_epoch=job.current_epoch,
                total_epochs=job.total_epochs,
                best_val_acc=job.best_val_acc,
                latest_train_loss=latest.train_loss if latest else None,
                latest_val_loss=latest.val_loss if latest else None,
                latest_train_acc=latest.train_acc if latest else None,
                latest_val_acc=latest.val_acc if latest else None,
                eta_seconds=latest.eta_sec if latest else None,
                error_message=job.error_message,
                model_architecture=getattr(job, "architecture", None),
                history=job.history,
                logs=job.logs,
                start_time=job.start_time,
                end_time=job.end_time
            )

        # Check saved history file
        history_file = settings.PROJECTS_DIR / project_id / "models" / "training_history.json"
        if history_file.exists():
            try:
                with open(history_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    hist = [EpochMetric(**m) for m in data.get("history", [])]
                    latest = hist[-1] if hist else None
                    return TrainingStatus(
                        project_id=project_id,
                        status=data.get("status", "idle"),
                        current_epoch=len(hist),
                        total_epochs=data.get("total_epochs", 10),
                        best_val_acc=data.get("best_val_acc", 0.0),
                        latest_train_loss=latest.train_loss if latest else None,
                        latest_val_loss=latest.val_loss if latest else None,
                        latest_train_acc=latest.train_acc if latest else None,
                        latest_val_acc=latest.val_acc if latest else None,
                        model_architecture=data.get("architecture"),
                        eta_seconds=0,
                        history=hist,
                        logs=data.get("logs", []),
                        start_time=data.get("start_time"),
                        end_time=data.get("end_time")
                    )
            except Exception:
                pass

        return TrainingStatus(
            project_id=project_id,
            status="idle",
            current_epoch=0,
            total_epochs=10,
            best_val_acc=0.0
        )

    @classmethod
    def start_training(cls, project_id: str, config: TrainConfigRequest) -> TrainingJob:
        existing = cls._jobs.get(project_id)
        if existing and existing.status == "training":
            raise ValueError(f"專案 {project_id} 已有正在執行的訓練作業")

        job = TrainingJob(project_id, config)
        cls._jobs[project_id] = job

        # Clear previous inference cache immediately
        try:
            from backend.app.services.inference_service import InferenceService
            InferenceService.clear_cache(project_id)
        except Exception:
            pass

        thread = threading.Thread(target=cls._run_training_worker, args=(job,), daemon=True)
        cls._threads[project_id] = thread
        thread.start()

        return job

    @classmethod
    def stop_training(cls, project_id: str) -> bool:
        job = cls._jobs.get(project_id)
        if job and job.status == "training":
            job.should_stop = True
            job.status = "stopped"
            job.log("🛑 收到使用者停止訓練指令，正在中斷訓練迴圈...")
            return True
        return False

    @classmethod
    def _run_training_worker(cls, job: TrainingJob):
        project_id = job.project_id
        hp = job.config.hyperparameters
        project_dir = settings.PROJECTS_DIR / project_id

        job.status = "training"
        job.start_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        try:
            # 1. Dispatch training to dedicated specialized model engine
            engine = ModelEngineRegistry.get_engine(hp.architecture)
            engine.train(job, job.config, project_dir)

            # 2. Extract class names from dataset
            dataset_info = engine.prepare_dataset(project_dir)
            class_names = dataset_info.get("classes", ["目標物"])

            # 3. Save Final Training History & Metadata
            job.end_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            histories_file = project_dir / "models" / "training_histories.json"
            existing_histories = []
            if histories_file.exists():
                try:
                    with open(histories_file, "r", encoding="utf-8") as f:
                        existing_histories = json.load(f)
                except Exception:
                    existing_histories = []
            run_number = len(existing_histories) + 1
            run_id = f"run_{run_number}_{uuid.uuid4().hex[:8]}"

            is_det = ModelEngineRegistry.is_detection_architecture(hp.architecture)
            history_data = {
                "run_id": run_id,
                "run_number": run_number,
                "project_id": project_id,
                "status": job.status,
                "architecture": hp.architecture.value,
                "task_type": "detection" if is_det else "classification",
                "total_epochs": hp.epochs,
                "best_val_acc": job.best_val_acc,
                "start_time": job.start_time,
                "end_time": job.end_time,
                "classes": class_names,
                "hyperparameters": {
                    "batch_size": hp.batch_size,
                    "learning_rate": hp.learning_rate,
                    "optimizer": hp.optimizer.value,
                    "image_size": hp.image_size,
                    "pretrained": hp.pretrained,
                    "early_stopping_patience": hp.early_stopping_patience,
                },
                "weights_path": f"/projects/{project_id}/models/checkpoints/best.pt",
                "history": [m.model_dump() for m in job.history],
                "logs": job.logs
            }

            with open(project_dir / "models" / "training_history.json", "w", encoding="utf-8") as f:
                json.dump(history_data, f, indent=2, ensure_ascii=False)

            existing_histories.append(history_data)
            with open(histories_file, "w", encoding="utf-8") as f:
                json.dump(existing_histories, f, indent=2, ensure_ascii=False)

            # Update DB project status and model count
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE projects 
                    SET status = ?, model_count = model_count + 1, updated_at = CURRENT_TIMESTAMP 
                    WHERE id = ?
                """, (job.status, project_id))

            # Register model in TrainedModelService (preserves distinct architectures, overwrites same architecture)
            try:
                from backend.app.services.trained_model_service import TrainedModelService
                TrainedModelService.register_trained_model(
                    project_id=project_id,
                    architecture=hp.architecture.value,
                    best_val_acc=job.best_val_acc,
                    total_epochs=hp.epochs,
                    trained_at=job.end_time,
                    classes=class_names,
                    task_type="detection" if is_det else "classification"
                )
            except Exception as e:
                print(f"Error registering trained model: {e}")

            # Invalidate inference cache
            try:
                from backend.app.services.inference_service import InferenceService
                InferenceService.clear_cache(project_id)
            except Exception:
                pass

        except Exception as e:
            job.status = "failed"
            job.error_message = str(e)
            job.log(f"❌ 訓練過程發生錯誤: {e}")
            import traceback
            traceback.print_exc()
