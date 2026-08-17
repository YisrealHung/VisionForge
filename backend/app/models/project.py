from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

class TaskType(str, Enum):
    CLASSIFICATION = "classification"
    DETECTION = "detection"
    REGRESSION = "regression"
    FEATURE = "feature"

class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Project Name")
    description: Optional[str] = Field(None, max_length=500, description="Project Description")
    task_type: TaskType = Field(default=TaskType.CLASSIFICATION, description="AI Task Type")

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: str
    created_at: str
    updated_at: str
    is_active: bool = False
    status: str = "ready"
    dataset_count: int = 0
    model_count: int = 0

class ProjectStats(BaseModel):
    total_projects: int
    active_project_id: Optional[str] = None
    tasks_breakdown: dict[str, int]
