from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.app.core.config import settings
from backend.app.core.database import init_db
from backend.app.api.projects import router as projects_router
from backend.app.api.system import router as system_router
from backend.app.api.dataset import router as dataset_router
from backend.app.api.annotations import router as annotations_router
from backend.app.api.training import router as training_router
from backend.app.api.camera import router as camera_router
from backend.app.api.export import router as export_router
from backend.app.api.inference import router as inference_router
from backend.app.api.quality import router as quality_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema on startup
    init_db()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Local No-Code AI Vision Model Training & Inference Platform",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

# Include API routers (sub-resources first)
app.include_router(system_router, prefix=settings.API_V1_STR)
app.include_router(dataset_router, prefix=settings.API_V1_STR)
app.include_router(annotations_router, prefix=settings.API_V1_STR)
app.include_router(training_router, prefix=settings.API_V1_STR)
app.include_router(export_router, prefix=settings.API_V1_STR)
app.include_router(inference_router, prefix=settings.API_V1_STR)
app.include_router(quality_router, prefix=settings.API_V1_STR)
app.include_router(projects_router, prefix=settings.API_V1_STR)
app.include_router(camera_router, prefix=settings.API_V1_STR)

# Mount assets directory if it exists
frontend_assets = settings.FRONTEND_DIST / "assets"
if frontend_assets.exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_assets)), name="assets")

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
        return JSONResponse({"detail": "Not Found"}, status_code=404)
    if (settings.FRONTEND_DIST / "index.html").exists():
        file_path = settings.FRONTEND_DIST / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(settings.FRONTEND_DIST / "index.html")
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "version": settings.VERSION,
        "docs": "/docs"
    }
