from typing import List, Optional
from pydantic import BaseModel, Field


class QualityIssue(BaseModel):
    """A single quality issue found in the dataset."""
    image_filename: str
    issue_type: str  # blur | abnormal_size | color_anomaly | duplicate | unlabeled | corrupted
    severity: str  # low | medium | high
    description: str
    value: Optional[float] = None  # numeric metric (e.g. blur score)


class QualityCheckItem(BaseModel):
    """Result of one quality check dimension."""
    check_name: str
    check_icon: str = "🔍"
    status: str  # pass | warn | fail
    passed_count: int = 0
    issue_count: int = 0
    total_count: int = 0
    summary: str = ""
    details: List[str] = []


class QualityReport(BaseModel):
    """Complete dataset quality report."""
    project_id: str
    overall_grade: str = "A"  # A | B | C | D | F
    overall_score: float = Field(default=100.0, ge=0.0, le=100.0)
    total_images: int = 0
    checks: List[QualityCheckItem] = []
    issues: List[QualityIssue] = []
    suggestions: List[str] = []
    scan_time_ms: float = 0.0
