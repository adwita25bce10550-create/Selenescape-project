"""
Combined Risk Assessment Router for SELENESCAPE
Synthesizes lunar surface hazards and orbital traffic to produce actionable mission decisions.
"""

from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional
from backend.services.lunar_engine import compute_combined_risk_assessment

router = APIRouter(prefix="/api/risk", tags=["Combined Risk Assessment"])

class RiskAssessmentRequest(BaseModel):
    region_id: str = "shackleton-crater"
    origin_id: str = "malapert-massif"
    dest_id: str = "shackleton-crater"

@router.post("/evaluate")
def evaluate_risk(req: RiskAssessmentRequest):
    """Evaluate multi-domain mission safety (Surface + Orbital + Trajectory)."""
    return compute_combined_risk_assessment(req.region_id, req.origin_id, req.dest_id)

@router.get("/quick")
def quick_evaluate(region_id: str = "shackleton-crater", origin_id: str = "malapert-massif", dest_id: str = "shackleton-crater"):
    """Quick GET endpoint for dashboard mission safety gauges."""
    return compute_combined_risk_assessment(region_id, origin_id, dest_id)
