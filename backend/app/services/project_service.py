import json
import uuid
import shutil
from datetime import datetime
from pathlib import Path
from typing import List, Optional
from fastapi import HTTPException

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.models.project import ProjectCreate, ProjectResponse, ProjectUpdate

class ProjectService:
    @staticmethod
    def _create_project_directory_structure(project_id: str, project_data: dict) -> Path:
        project_path = settings.PROJECTS_DIR / project_id
        project_path.mkdir(parents=True, exist_ok=True)
        
        # Subdirectories according to architecture doc
        (project_path / "datasets" / "raw").mkdir(parents=True, exist_ok=True)
        (project_path / "datasets" / "augmented").mkdir(parents=True, exist_ok=True)
        (project_path / "datasets" / "splits").mkdir(parents=True, exist_ok=True)
        (project_path / "annotations").mkdir(parents=True, exist_ok=True)
        (project_path / "models" / "checkpoints").mkdir(parents=True, exist_ok=True)
        (project_path / "models" / "exports").mkdir(parents=True, exist_ok=True)
        (project_path / "logs" / "training_logs").mkdir(parents=True, exist_ok=True)
        (project_path / "configs").mkdir(parents=True, exist_ok=True)
        
        # Write initial project.json
        project_config = {
            "id": project_id,
            "name": project_data["name"],
            "description": project_data.get("description", ""),
            "task_type": project_data["task_type"],
            "created_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "classes": []
        }
        with open(project_path / "project.json", "w", encoding="utf-8") as f:
            json.dump(project_config, f, indent=2, ensure_ascii=False)
            
        return project_path

    @staticmethod
    def create_project(data: ProjectCreate) -> ProjectResponse:
        project_id = f"proj_{uuid.uuid4().hex[:10]}"
        now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        
        # 1. Create file directory
        ProjectService._create_project_directory_structure(project_id, data.model_dump())
        
        # 2. Insert into DB (if it's the first project, make it active by default)
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) as count FROM projects")
            count = cursor.fetchone()["count"]
            is_active = 1 if count == 0 else 0
            
            cursor.execute("""
                INSERT INTO projects (id, name, description, task_type, created_at, updated_at, is_active, status, dataset_count, model_count)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'ready', 0, 0)
            """, (project_id, data.name, data.description, data.task_type.value, now, now, is_active))
            
        return ProjectService.get_project(project_id)

    @staticmethod
    def get_all_projects() -> List[ProjectResponse]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM projects ORDER BY updated_at DESC")
            rows = cursor.fetchall()
            return [
                ProjectResponse(
                    id=row["id"],
                    name=row["name"],
                    description=row["description"],
                    task_type=row["task_type"],
                    created_at=row["created_at"],
                    updated_at=row["updated_at"],
                    is_active=bool(row["is_active"]),
                    status=row["status"],
                    dataset_count=row["dataset_count"],
                    model_count=row["model_count"]
                )
                for row in rows
            ]

    @staticmethod
    def get_project(project_id: str) -> ProjectResponse:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
            row = cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
            return ProjectResponse(
                id=row["id"],
                name=row["name"],
                description=row["description"],
                task_type=row["task_type"],
                created_at=row["created_at"],
                updated_at=row["updated_at"],
                is_active=bool(row["is_active"]),
                status=row["status"],
                dataset_count=row["dataset_count"],
                model_count=row["model_count"]
            )

    @staticmethod
    def get_active_project() -> Optional[ProjectResponse]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM projects WHERE is_active = 1 LIMIT 1")
            row = cursor.fetchone()
            if not row:
                # Return the latest project if none is active
                cursor.execute("SELECT * FROM projects ORDER BY updated_at DESC LIMIT 1")
                row = cursor.fetchone()
                if not row:
                    return None
            return ProjectResponse(
                id=row["id"],
                name=row["name"],
                description=row["description"],
                task_type=row["task_type"],
                created_at=row["created_at"],
                updated_at=row["updated_at"],
                is_active=bool(row["is_active"]),
                status=row["status"],
                dataset_count=row["dataset_count"],
                model_count=row["model_count"]
            )

    @staticmethod
    def set_active_project(project_id: str) -> ProjectResponse:
        # Check project exists
        ProjectService.get_project(project_id)
        
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE projects SET is_active = 0")
            cursor.execute("UPDATE projects SET is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (project_id,))
            
        return ProjectService.get_project(project_id)

    @staticmethod
    def delete_project(project_id: str) -> bool:
        # Check project exists
        ProjectService.get_project(project_id)
        
        # 1. Delete DB record
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM projects WHERE id = ?", (project_id,))
            
        # 2. Delete files on disk
        project_path = settings.PROJECTS_DIR / project_id
        if project_path.exists():
            shutil.rmtree(project_path, ignore_errors=True)
            
        return True
