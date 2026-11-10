import sys
from pathlib import Path

import pytest

# Make `import backend.app...` work when running `pytest` from the repo root or backend/.
ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


@pytest.fixture()
def tmp_settings(tmp_path, monkeypatch):
    """Point all data paths at a temporary directory so tests never touch real projects."""
    from backend.app.core.config import settings

    data_dir = tmp_path / "data"
    projects_dir = data_dir / "projects"
    projects_dir.mkdir(parents=True)
    dist_dir = tmp_path / "dist"
    monkeypatch.setattr(settings, "DATA_DIR", data_dir)
    monkeypatch.setattr(settings, "PROJECTS_DIR", projects_dir)
    monkeypatch.setattr(settings, "DATABASE_PATH", data_dir / "test.db")
    monkeypatch.setattr(settings, "FRONTEND_DIST", dist_dir)
    return settings


@pytest.fixture()
def client(tmp_settings):
    from fastapi.testclient import TestClient
    from backend.app.main import app

    with TestClient(app) as c:  # runs lifespan -> init_db on the temp database
        yield c


@pytest.fixture()
def project(client):
    res = client.post("/api/projects", json={"name": "t", "description": "", "task_type": "detection"})
    assert res.status_code == 201, res.text
    return res.json()
