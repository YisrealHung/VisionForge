from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from contextlib import asynccontextmanager
import logging

from backend.app.core.config import settings
from backend.app.core.database import init_db
from backend.app.core.paths import is_valid_project_id

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
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

class ProjectIdGuard:
    """Reject /api/projects/<id>/... requests (HTTP and WebSocket) whose id is not a real project id.

    Every service builds paths as PROJECTS_DIR / project_id, so this single check
    keeps ids like "../../x" (or Windows backslash variants) from reaching the filesystem.
    """

    PREFIX = f"{settings.API_V1_STR}/projects/"
    ALLOWED_NON_IDS = {"active"}

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] in ("http", "websocket"):
            path = scope.get("path", "")
            if path.startswith(self.PREFIX):
                segment = path[len(self.PREFIX):].split("/", 1)[0]
                if segment and segment not in self.ALLOWED_NON_IDS and not is_valid_project_id(segment):
                    if scope["type"] == "websocket":
                        await send({"type": "websocket.close", "code": 4404})
                        return
                    response = JSONResponse({"detail": f"Project {segment} not found"}, status_code=404)
                    await response(scope, receive, send)
                    return
        await self.app(scope, receive, send)


app.add_middleware(ProjectIdGuard)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    if full_path.startswith(("api", "docs", "openapi.json", "assets/")):
        # Missing assets must 404 instead of falling back to index.html (which breaks JS MIME types).
        return JSONResponse({"detail": "Not Found"}, status_code=404)
    dist_dir = settings.FRONTEND_DIST.resolve()
    if (dist_dir / "index.html").exists():
        file_path = (dist_dir / full_path).resolve()
        if file_path.is_relative_to(dist_dir) and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(dist_dir / "index.html")
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "version": settings.VERSION,
        "docs": "/docs"
    }
