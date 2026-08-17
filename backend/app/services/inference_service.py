import io
import time
import base64
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Tuple, Optional, Any
from PIL import Image

import torch

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.models.training import ModelArchitecture
from backend.app.models.inference import (
    RoiBox,
    TriggerRule,
    TriggerEvent,
    InferenceResultItem,
    InferenceRequestBase64,
    InferenceBatchRequest,
    InferenceResponse,
    InferenceBatchResponse,
    ApiServerStatus,
)
from backend.app.engines.base_engine import BaseModelEngine
from backend.app.engines.engine_registry import ModelEngineRegistry


class InferenceService:
    _model_cache: Dict[str, Tuple[Any, List[str], str, BaseModelEngine, float]] = {}
    _server_running: bool = True
    _server_start_time: float = time.time()
    _total_requests: int = 0
    _total_latency: float = 0.0
    _last_loaded_model_id: Optional[str] = None

    @classmethod
    def clear_cache(cls, project_id: Optional[str] = None):
        if project_id:
            keys_to_remove = [k for k in cls._model_cache.keys() if k == project_id or k.startswith(f"{project_id}:")]
            for k in keys_to_remove:
                cls._model_cache.pop(k, None)
        else:
            cls._model_cache.clear()

    @classmethod
    def _get_active_or_default_project_id(cls) -> str:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM projects WHERE is_active = 1 LIMIT 1")
            row = cursor.fetchone()
            if row:
                return row["id"]
            cursor.execute("SELECT id FROM projects ORDER BY created_at DESC LIMIT 1")
            row = cursor.fetchone()
            if row:
                return row["id"]
        return "default"

    @classmethod
    def _get_or_load_model(cls, model_id: Optional[str], architecture: Optional[str] = None) -> Tuple[Any, List[str], str, BaseModelEngine]:
        pid = model_id or cls._get_active_or_default_project_id()
        project_dir = settings.PROJECTS_DIR / pid
        ckpt_dir = project_dir / "models" / "checkpoints"

        # 1. Resolve architecture
        arch_str = architecture
        history_file = project_dir / "models" / "training_history.json"
        hist_mtime = history_file.stat().st_mtime if history_file.exists() else 0.0

        if not arch_str:
            if history_file.exists():
                try:
                    import json
                    with open(history_file, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        arch_str = data.get("architecture", "resnet18")
                except Exception:
                    arch_str = "resnet18"
            else:
                try:
                    with get_db() as conn:
                        cursor = conn.cursor()
                        cursor.execute("SELECT task_type FROM projects WHERE id = ?", (pid,))
                        row = cursor.fetchone()
                        if row and row["task_type"] == "detection":
                            arch_str = "yolo26_s"
                        else:
                            arch_str = "resnet18"
                except Exception:
                    arch_str = "resnet18"

        # 2. Pick architecture-specific best checkpoint
        ckpt_file = None
        specific_ckpt = ckpt_dir / f"{arch_str}_best.pt"
        if specific_ckpt.exists():
            ckpt_file = specific_ckpt
        elif "dfine" in arch_str.lower():
            dfine_ckpt = ckpt_dir / "dfine_best.pt"
            if dfine_ckpt.exists():
                ckpt_file = dfine_ckpt
        elif "ssd" in arch_str.lower():
            ssd_ckpt = ckpt_dir / "ssdlite_best.pt"
            if ssd_ckpt.exists():
                ckpt_file = ssd_ckpt
        elif "yolo" in arch_str.lower():
            yolo_ckpt = ckpt_dir / "yolo_best.pt"
            if yolo_ckpt.exists():
                ckpt_file = yolo_ckpt
            elif (ckpt_dir / "best.pt").exists():
                ckpt_file = ckpt_dir / "best.pt"

        if not ckpt_file or not ckpt_file.exists():
            fallback_best = ckpt_dir / "best.pt"
            fallback_last = ckpt_dir / "last.pt"
            ckpt_file = fallback_best if fallback_best.exists() else fallback_last

        ckpt_mtime = ckpt_file.stat().st_mtime if ckpt_file and ckpt_file.exists() else 0.0

        # Cache check by (pid, arch_str)
        cache_key = f"{pid}:{arch_str}"
        if cache_key in cls._model_cache:
            cached_model, cached_classes, cached_arch, cached_engine, cached_ckpt_mtime, cached_hist_mtime = cls._model_cache[cache_key]
            if cached_arch == arch_str and cached_ckpt_mtime == ckpt_mtime:
                return cached_model, cached_classes, cached_arch, cached_engine

        engine = ModelEngineRegistry.get_engine(arch_str)
        model, classes = engine.load_model(project_dir, ckpt_file if (ckpt_file and ckpt_file.exists()) else None)

        cls._model_cache[cache_key] = (model, classes, arch_str, engine, ckpt_mtime, hist_mtime)
        cls._last_loaded_model_id = pid
        return model, classes, arch_str, engine

    @classmethod
    def _decode_image(cls, b64_str: str) -> Image.Image:
        if "," in b64_str:
            b64_str = b64_str.split(",", 1)[1]
        img_data = base64.b64decode(b64_str)
        return Image.open(io.BytesIO(img_data)).convert("RGB")

    @classmethod
    def predict_base64(cls, request: InferenceRequestBase64) -> InferenceResponse:
        if not cls._server_running:
            raise RuntimeError("推論 API 伺服器目前已暫停服務")

        start_t = time.time()
        model, classes, arch_str, engine = cls._get_or_load_model(request.model_id, request.architecture)

        try:
            pil_img = cls._decode_image(request.image_base64)
        except Exception as e:
            raise ValueError(f"Base64 圖片解碼失敗: {e}")

        # Delegate prediction directly to specialized model engine
        predictions = engine.predict(
            model=model,
            image=pil_img,
            classes=classes,
            conf_threshold=0.01,
            roi=request.roi
        )

        latency_ms = round((time.time() - start_t) * 1000.0, 2)

        # Update stats
        cls._total_requests += 1
        cls._total_latency += latency_ms

        top = predictions[0] if predictions else InferenceResultItem(label="未知", confidence=0.0, probability=0.0)
        is_detection = ModelEngineRegistry.is_detection_architecture(arch_str)

        # =========================================================================
        # TRIGGER RULES EVALUATION
        # =========================================================================
        trigger_matched = False
        triggered_events: List[TriggerEvent] = []
        now_str = datetime.now().strftime("%H:%M:%S")

        if request.trigger_rules:
            for rule in request.trigger_rules:
                if not rule.enabled:
                    continue

                if is_detection:
                    matching_items = [
                        p for p in predictions
                        if p.bbox is not None and p.confidence >= rule.min_confidence and (rule.class_name in ["全部類別", "any"] or p.label == rule.class_name)
                    ]
                    matched_count = len(matching_items)
                    rule_hit = False
                    hit_message = ""

                    if rule.condition_type == "count_gte":
                        if matched_count >= rule.min_count:
                            rule_hit = True
                            hit_message = f"🔔 數量條件命中：偵測到「{rule.class_name}」共 {matched_count} 個（門檻 ≥ {rule.min_count} 個，信心度 ≥ {rule.min_confidence}%）"
                    elif rule.condition_type == "absent":
                        if matched_count == 0:
                            rule_hit = True
                            hit_message = f"🚨 缺失警報命中：未偵測到「{rule.class_name}」（數量為 0，預期應存在）"
                    else:
                        if matched_count >= 1:
                            rule_hit = True
                            top_c = matching_items[0].confidence
                            hit_message = f"🔔 目標偵測命中：發現「{rule.class_name}」共 {matched_count} 個（最高置信度 {top_c:.1f}% ≥ {rule.min_confidence}%）"

                    if rule_hit:
                        trigger_matched = True
                        triggered_events.append(
                            TriggerEvent(
                                timestamp=now_str,
                                rule_id=rule.id,
                                rule_name=f"[{rule.class_name}] {rule.condition_type}",
                                class_name=rule.class_name,
                                confidence=matching_items[0].confidence if matching_items else 0.0,
                                count=matched_count,
                                message=hit_message
                            )
                        )

                else:
                    if top.label == rule.class_name and top.confidence >= rule.min_confidence:
                        trigger_matched = True
                        triggered_events.append(
                            TriggerEvent(
                                timestamp=now_str,
                                rule_id=rule.id,
                                rule_name=f"[{rule.class_name}] 信心度 ≥ {rule.min_confidence}%",
                                class_name=top.label,
                                confidence=top.confidence,
                                count=1,
                                message=f"🔔 觸發條件命中：偵測到「{top.label}」（置信度 {top.confidence:.1f}% ≥ {rule.min_confidence}%）"
                            )
                        )

        return InferenceResponse(
            success=True,
            inference_time_ms=latency_ms,
            top_label=top.label,
            top_confidence=top.confidence,
            predictions=predictions,
            model_architecture=arch_str,
            roi_applied=request.roi is not None and request.roi.width > 10,
            trigger_matched=trigger_matched,
            triggered_events=triggered_events,
            timestamp=now_str
        )

    @classmethod
    def predict_form(cls, image_bytes: bytes, model_id: Optional[str] = None, roi: Optional[RoiBox] = None) -> InferenceResponse:
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        req = InferenceRequestBase64(model_id=model_id, image_base64=b64, roi=roi)
        return cls.predict_base64(req)

    @classmethod
    def predict_batch(cls, request: InferenceBatchRequest) -> InferenceBatchResponse:
        start_t = time.time()
        results: List[InferenceResponse] = []

        for b64 in request.images_base64:
            req = InferenceRequestBase64(model_id=request.model_id, image_base64=b64)
            resp = cls.predict_base64(req)
            results.append(resp)

        total_time_ms = round((time.time() - start_t) * 1000.0, 2)
        avg_time = round(total_time_ms / max(1, len(results)), 2)

        return InferenceBatchResponse(
            success=True,
            total_images=len(results),
            total_time_ms=total_time_ms,
            avg_time_ms=avg_time,
            results=results
        )

    @classmethod
    def get_server_status(cls) -> ApiServerStatus:
        uptime = round(time.time() - cls._server_start_time, 1)
        avg_latency = round(cls._total_latency / max(1, cls._total_requests), 2)
        active_pid = cls._last_loaded_model_id or cls._get_active_or_default_project_id()

        return ApiServerStatus(
            is_running=cls._server_running,
            port=settings.PORT,
            endpoint_url=f"http://localhost:{settings.PORT}/api/inference/predict",
            total_requests=cls._total_requests,
            avg_latency_ms=avg_latency,
            loaded_model=active_pid,
            uptime_seconds=uptime
        )

    @classmethod
    def toggle_server(cls, enable: bool) -> ApiServerStatus:
        cls._server_running = enable
        return cls.get_server_status()

    @classmethod
    def reset_stats(cls) -> ApiServerStatus:
        cls._total_requests = 0
        cls._total_latency = 0.0
        cls._server_start_time = time.time()
        return cls.get_server_status()
