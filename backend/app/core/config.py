from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "VisionForge AI Studio"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Paths
    BACKEND_DIR: Path = Path(__file__).resolve().parent.parent.parent
    ROOT_DIR: Path = BACKEND_DIR.parent
    FRONTEND_DIST: Path = ROOT_DIR / "frontend" / "dist"
    DATA_DIR: Path = BACKEND_DIR / "data"
    PROJECTS_DIR: Path = DATA_DIR / "projects"
    DATABASE_PATH: Path = DATA_DIR / "visionforge.db"
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]

    class Config:
        case_sensitive = True

settings = Settings()

# Ensure directories exist
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.PROJECTS_DIR.mkdir(parents=True, exist_ok=True)
