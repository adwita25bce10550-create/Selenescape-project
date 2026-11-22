"""
Terrain Hazard Analysis Router for SELENESCAPE
Provides real-time hazard layer mapping and terrain risk scoring.
"""

from fastapi import APIRouter, Query, HTTPException
from backend.services.lunar_engine import analyze_terrain_hazards, LUNAR_REGIONS

router = APIRouter(prefix="/api/hazards", tags=["Hazard Analysis"])

@router.get("/analyze")
def get_hazard_analysis(region_id: str = "shackleton-crater"):
    """Evaluate multi-layer terrain hazards: Slopes, Boulders, Shadow/PSR."""
    return analyze_terrain_hazards(region_id)

@router.get("/summary")
def get_all_hazards_summary():
    """Summary of all explored sites and their composite hazard levels."""
    summary = []
    for reg in LUNAR_REGIONS:
        haz = analyze_terrain_hazards(reg["id"])
        summary.append({
            "region_id": reg["id"],
            "name": reg["name"],
            "score": haz["composite_risk_score"],
            "grade": haz["safety_grade"],
            "slope_max": reg["hazards"]["slope_max_deg"],
            "psr_risk": reg["hazards"]["psr_risk"]
        })
    return {"hazards_matrix": summary}
