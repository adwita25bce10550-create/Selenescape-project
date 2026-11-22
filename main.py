"""
SELENESCAPE — Sustainable Lunar Mission Planner
FastAPI Backend Application Entrypoint
"""

import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.routers import auth, terrain, route, hazards, orbital, risk, reports

app = FastAPI(
    title="SELENESCAPE — Sustainable Lunar Mission Planner",
    description="Scientific Lunar Exploration & Sustainable Cislunar Mission Planning API",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Enable CORS for all local environments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router)
app.include_router(terrain.router)
app.include_router(route.router)
app.include_router(hazards.router)
app.include_router(orbital.router)
app.include_router(risk.router)
app.include_router(reports.router)

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "system": "SELENESCAPE Lunar Mission Engine",
        "telemetry": "Active",
        "coordinates": "Lunar South Pole (89.9°S, 0.0°E)",
        "version": "2.0.0"
    }

# Mount Frontend static files
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

    @app.get("/")
    async def serve_index():
        return FileResponse(FRONTEND_DIR / "index.html")
    
    @app.get("/{full_path:path}")
    async def serve_spa_fallback(full_path: str):
        file_path = FRONTEND_DIR / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIR / "index.html")

if __name__ == "__main__":
    import uvicorn
    print("\n" + "="*70)
    print("🚀 LAUNCHING SELENESCAPE LUNAR MISSION PLANNER SERVER")
    print("📍 Local URL: http://127.0.0.1:8000")
    print("📖 API Documentation: http://127.0.0.1:8000/api/docs")
    print("="*70 + "\n")
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
