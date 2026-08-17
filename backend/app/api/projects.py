from typing import List, Optional
from fastapi import APIRouter, status

from backend.app.models.project import ProjectCreate, ProjectResponse
from backend.app.services.project_service import ProjectService

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("", response_model=List[ProjectResponse])
def list_projects():
    """List all projects."""
    return ProjectService.get_all_projects()

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate):
    """Create a new project with initialized folder structure."""
    return ProjectService.create_project(payload)

@router.get("/active", response_model=Optional[ProjectResponse])
def get_active_project():
    """Get the currently active project."""
    return ProjectService.get_active_project()

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str):
    """Get project details by ID."""
    return ProjectService.get_project(project_id)

@router.post("/{project_id}/activate", response_model=ProjectResponse)
def activate_project(project_id: str):
    """Set a project as the current active project."""
    return ProjectService.set_active_project(project_id)

@router.delete("/{project_id}")
def delete_project(project_id: str):
    """Delete a project and its files."""
    ProjectService.delete_project(project_id)
    return {"success": True, "message": f"Project {project_id} deleted successfully"}
