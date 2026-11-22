"""
Mission Reports Router for SELENESCAPE
Compiles comprehensive flight documentation ready for review and PDF archiving.
"""

from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.services.lunar_engine import generate_mission_report

router = APIRouter(prefix="/api/reports", tags=["Mission Dossiers"])

class ReportGenerateRequest(BaseModel):
    mission_name: Optional[str] = "Artemis Volatiles Surveyor"
    target_region_id: str = "shackleton-crater"
    origin_id: str = "malapert-massif"
    dest_id: str = "shackleton-crater"

RECENT_REPORTS_STORAGE = [
    {
        "report_id": "SLS-8841-SHAC",
        "timestamp": "2026-11-20 18:30 UTC",
        "mission_title": "VIPER-2 Cryogenic Survey",
        "target_location": "Shackleton Crater",
        "overall_score": 84,
        "recommendation": "Safe to Proceed (Ridge Corridor)",
        "status": "APPROVED"
    },
    {
        "report_id": "SLS-4120-MALA",
        "timestamp": "2026-11-18 10:15 UTC",
        "mission_title": "Malapert Power Station Hub",
        "target_location": "Malapert Massif",
        "overall_score": 96,
        "recommendation": "Safe to Proceed",
        "status": "APPROVED"
    },
    {
        "report_id": "SLS-1903-CABE",
        "timestamp": "2026-11-15 09:40 UTC",
        "mission_title": "Cabeus Volatiles Extraction",
        "target_location": "Cabeus Crater",
        "overall_score": 58,
        "recommendation": "Replan Rover Route (Avoid Steep Slopes)",
        "status": "REQUIRES REVISION"
    }
]

@router.post("/generate")
def create_report(req: ReportGenerateRequest):
    """Generate a formal mission report."""
    report = generate_mission_report(
        mission_name=req.mission_name or "Lunar Exploration Mission",
        target_region_id=req.target_region_id,
        origin_id=req.origin_id,
        dest_id=req.dest_id
    )
    # Cache to recent reports
    RECENT_REPORTS_STORAGE.insert(0, {
        "report_id": report["report_id"],
        "timestamp": report["timestamp"],
        "mission_title": report["mission_title"],
        "target_location": report["target_location"]["name"],
        "overall_score": report["safety_audit"]["composite_score"],
        "recommendation": report["safety_audit"]["flight_director_decision"],
        "status": "APPROVED" if report["safety_audit"]["composite_score"] >= 70 else "ACTION REQUIRED"
    })
    return report

@router.get("/recent")
def get_recent_reports():
    """List recently authored mission reports."""
    return {"reports": RECENT_REPORTS_STORAGE[:10]}
