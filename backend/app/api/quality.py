from fastapi import APIRouter, HTTPException

from backend.app.models.quality import QualityReport
from backend.app.services.quality_service import QualityService

router = APIRouter(prefix="/projects/{project_id}/quality", tags=["Data Quality"])


@router.post("/check", response_model=QualityReport)
def run_quality_check(project_id: str):
    """Run full 7-dimension dataset quality check."""
    try:
        return QualityService.run_quality_check(project_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/report", response_model=QualityReport)
def get_quality_report(project_id: str):
    """Get cached quality report (if previously generated)."""
    report = QualityService.get_cached_report(project_id)
    if report is None:
        raise HTTPException(status_code=404, detail="尚未執行品質健檢，請先點擊「一鍵健檢」。")
    return report
