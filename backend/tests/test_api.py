import asyncio
import json
import time

import pytest


# ---------------------------------------------------------------- projects
def test_project_crud(client, project):
    pid = project["id"]
    assert client.get(f"/api/projects/{pid}").status_code == 200
    assert any(p["id"] == pid for p in client.get("/api/projects").json())
    assert client.delete(f"/api/projects/{pid}").status_code == 200
    assert client.get(f"/api/projects/{pid}").status_code == 404


def test_active_project_route_not_blocked_by_guard(client, project):
    assert client.get("/api/projects/active").status_code == 200


# ---------------------------------------------------------------- path traversal
@pytest.mark.parametrize("bad_id", ["..", "..%5C..%5Cdata", "proj_ZZZZZZZZZZ", "proj_123"])
def test_invalid_project_id_rejected(client, bad_id):
    assert client.get(f"/api/projects/{bad_id}/images").status_code == 404


@pytest.mark.parametrize("bad_name", ["..%5C..%5Cproject.json", ".hidden", "a%5Cb.png"])
def test_image_filename_traversal_rejected(client, project, bad_name):
    pid = project["id"]
    assert client.get(f"/api/projects/{pid}/images/{bad_name}").status_code in (400, 404)
    assert client.delete(f"/api/projects/{pid}/images/{bad_name}").status_code in (400, 404)


def test_import_strips_directories_from_upload_names(client, project, tmp_settings):
    pid = project["id"]
    files = [("files", ("../../evil.png", b"not really a png", "image/png"))]
    res = client.post(f"/api/projects/{pid}/dataset/import", files=files)
    assert res.status_code == 200, res.text
    raw = tmp_settings.PROJECTS_DIR / pid / "datasets" / "raw"
    assert (raw / "evil.png").exists()
    assert not (tmp_settings.PROJECTS_DIR / "evil.png").exists()
    assert not (tmp_settings.DATA_DIR / "evil.png").exists()


def test_spa_fallback_cannot_escape_dist(tmp_settings):
    from backend.app.main import serve_spa

    dist = tmp_settings.FRONTEND_DIST
    dist.mkdir()
    (dist / "index.html").write_text("<html></html>")
    (tmp_settings.FRONTEND_DIST.parent / "secret.txt").write_text("secret")

    resp = asyncio.run(serve_spa("../secret.txt"))
    assert str(resp.path).endswith("index.html")
    # Missing assets must 404, not return index.html with the wrong MIME type.
    assert asyncio.run(serve_spa("assets/missing.js")).status_code == 404


# ---------------------------------------------------------------- inference status
def test_inference_status_ok(client):
    res = client.get("/api/inference/status")
    assert res.status_code == 200, res.text


def test_all_classes_sentinel_accepted():
    from backend.app.services.inference_service import ALL_CLASSES_NAMES

    assert {"*", "全部類別", "All Classes"} <= ALL_CLASSES_NAMES


# ---------------------------------------------------------------- training
class FakeEngine:
    """Stands in for a real model engine: emits two epochs of logs/metrics without torch work."""

    def __init__(self, epochs_to_run=2, delay=0.0):
        self.epochs_to_run = epochs_to_run
        self.delay = delay

    def prepare_dataset(self, project_dir):
        raise AssertionError("training_engine must not re-run prepare_dataset after training")

    def train(self, job, config, project_dir):
        from backend.app.models.training import EpochMetric

        job.class_names = ["cat", "dog"]
        for epoch in range(1, self.epochs_to_run + 1):
            if job.should_stop:
                break
            time.sleep(self.delay)
            job.log(f"epoch {epoch}")
            metric = EpochMetric(epoch=epoch, total_epochs=2, train_loss=1.0, train_acc=50.0, val_loss=1.0,
                                 val_acc=60.0, epoch_duration_sec=0.0, best_val_acc=60.0, eta_sec=0.0, lr=0.001)
            job.history.append(metric)
            job.emit_metric(metric)
        job.status = "stopped" if job.should_stop else "completed"


def _wait_done(project_id, timeout=10):
    from backend.app.services.training_engine import TrainingEngine

    t = TrainingEngine._threads.get(project_id)
    if t:
        t.join(timeout)
        assert not t.is_alive()


TRAIN_BODY = {"hyperparameters": {"architecture": "resnet18", "epochs": 2}}


def test_training_start_returns_200(client, project, monkeypatch, tmp_settings):
    from backend.app.engines.engine_registry import ModelEngineRegistry

    monkeypatch.setattr(ModelEngineRegistry, "get_engine", classmethod(lambda cls, a: FakeEngine()))
    pid = project["id"]

    res = client.post(f"/api/projects/{pid}/train/start", json=TRAIN_BODY)
    assert res.status_code == 200, res.text  # used to fail with AttributeError: log_callbacks
    _wait_done(pid)
    hist = json.loads((tmp_settings.PROJECTS_DIR / pid / "models" / "training_history.json").read_text("utf-8"))
    assert hist["status"] == "completed"
    assert hist["classes"] == ["cat", "dog"]  # taken from the engine's training run


def test_training_callbacks_receive_logs_and_metrics(tmp_settings, project, monkeypatch):
    # Callbacks are what the WebSocket route uses to stream. (TestClient runs each HTTP request on its
    # own short-lived event loop, so the cross-loop WS broadcast is checked here at the engine level.)
    from backend.app.engines.engine_registry import ModelEngineRegistry
    from backend.app.models.training import TrainConfigRequest
    from backend.app.services.training_engine import TrainingEngine

    monkeypatch.setattr(ModelEngineRegistry, "get_engine", classmethod(lambda cls, a: FakeEngine()))
    pid = project["id"]
    logs, metrics = [], []
    TrainingEngine.start_training(pid, TrainConfigRequest(**TRAIN_BODY),
                                  log_callbacks=[logs.append], metric_callbacks=[metrics.append])
    _wait_done(pid)
    assert any("epoch 1" in line for line in logs)
    assert [m.epoch for m in metrics] == [1, 2]


def test_cannot_start_twice_while_running(client, project, monkeypatch):
    from backend.app.engines.engine_registry import ModelEngineRegistry

    monkeypatch.setattr(ModelEngineRegistry, "get_engine", classmethod(lambda cls, a: FakeEngine(delay=0.3)))
    pid = project["id"]
    assert client.post(f"/api/projects/{pid}/train/start", json=TRAIN_BODY).status_code == 200
    # Even after a stop request, the old thread is still running, so a new start must be refused.
    client.post(f"/api/projects/{pid}/train/stop")
    assert client.post(f"/api/projects/{pid}/train/start", json=TRAIN_BODY).status_code == 400
    _wait_done(pid)


def test_stopped_before_first_epoch_is_not_registered(client, project, monkeypatch, tmp_settings):
    from backend.app.engines.engine_registry import ModelEngineRegistry

    monkeypatch.setattr(ModelEngineRegistry, "get_engine", classmethod(lambda cls, a: FakeEngine(epochs_to_run=0)))
    pid = project["id"]
    assert client.post(f"/api/projects/{pid}/train/start", json=TRAIN_BODY).status_code == 200
    _wait_done(pid)
    assert not (tmp_settings.PROJECTS_DIR / pid / "models" / "training_histories.json").exists()
    assert client.get(f"/api/projects/{pid}").json()["model_count"] == 0


# ---------------------------------------------------------------- follow-up regressions
def test_assets_built_after_startup_are_served(tmp_settings):
    # The /assets StaticFiles mount only exists if dist/assets existed at import time;
    # the SPA fallback must still serve real asset files built later, and 404 missing ones.
    from backend.app.main import serve_spa

    assets = tmp_settings.FRONTEND_DIST / "assets"
    assets.mkdir(parents=True)
    (tmp_settings.FRONTEND_DIST / "index.html").write_text("<html></html>")
    (assets / "index-abc.js").write_text("console.log(1)")

    resp = asyncio.run(serve_spa("assets/index-abc.js"))
    assert str(resp.path).endswith("index-abc.js")
    assert asyncio.run(serve_spa("assets/missing.js")).status_code == 404


def test_project_id_with_trailing_newline_rejected():
    from backend.app.core.paths import is_valid_project_id

    assert is_valid_project_id("proj_0123456789abcdef"[:15])
    assert not is_valid_project_id("proj_0123456789\n")


@pytest.mark.parametrize("env,expected", [
    ({}, 8000),
    ({"VF_PORT": ""}, 8000),
    ({"VF_PORT": "", "PORT": "9002"}, 9002),
    ({"VF_PORT": "9001", "PORT": "9002"}, 9001),
])
def test_port_env_empty_means_unset(monkeypatch, env, expected):
    from backend.app.core.config import Settings

    for k in ("VF_PORT", "PORT"):
        monkeypatch.delenv(k, raising=False)
    for k, v in env.items():
        monkeypatch.setenv(k, v)
    assert Settings().PORT == expected


def test_training_ws_sends_init_and_logs_endpoint(client, project):
    # TrainingEngine.get_logs used to be missing: the WS closed right after accept and /logs 500'd.
    pid = project["id"]
    assert client.get(f"/api/projects/{pid}/train/logs").json() == {"logs": []}
    with client.websocket_connect(f"/api/projects/{pid}/train/ws") as ws:
        msg = ws.receive_json()
        assert msg["type"] == "init" and msg["logs"] == []


@pytest.mark.parametrize("env,platform,cpus,expected", [
    (None, "win32", 16, 0),     # spawn + torch DLLs per worker exhausts the page file on Windows
    (None, "linux", 16, 4),
    (None, "linux", 2, 1),
    ("3", "win32", 16, 3),      # explicit override wins
    ("", "linux", 8, 4),        # empty means unset
    ("abc", "win32", 8, 0),     # invalid falls back to the default
])
def test_dataloader_workers(env, platform, cpus, expected):
    from backend.app.core.compute import dataloader_workers

    assert dataloader_workers(env_value=env if env is not None else "", platform=platform, cpu_count=cpus) == expected
