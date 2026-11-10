from pathlib import Path
from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "VisionForge AI Studio"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    # Port the server is expected to listen on (used for informational URLs). Override with VF_PORT or PORT.
    PORT: int = Field(default=8000, validation_alias=AliasChoices("VF_PORT", "PORT"))
    
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

    # env_ignore_empty: treat `VF_PORT=` / `PORT=` (set but empty, e.g. from docker-compose or a bash
    # export) as unset instead of failing int parsing at import; matches run.py's fallback.
    model_config = SettingsConfigDict(case_sensitive=True, env_ignore_empty=True)

settings = Settings()

# Ensure directories exist
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.PROJECTS_DIR.mkdir(parents=True, exist_ok=True)
