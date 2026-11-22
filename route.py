"""
Rover Route Planner Router for SELENESCAPE
Calculates comparative trajectories: Shortest Penetration vs Tactical Safe Ridge.
"""

from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.services.lunar_engine import generate_rover_route

router = APIRouter(prefix="/api/route", tags=["Rover Route Planning"])

class RoutePlanRequest(BaseModel):
    origin_id: str = "malapert-massif"
    destination_id: str = "shackleton-crater"

@router.post("/plan")
def plan_route(req: RoutePlanRequest):
    """Generate comparative rover pathways with slope and hazard profile."""
    try:
        route_data = generate_rover_route(req.origin_id, req.destination_id)
        return route_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Trajectory calculation failed: {str(e)}")

@router.get("/quick")
def quick_plan(origin: str = "malapert-massif", destination: str = "shackleton-crater"):
    """Quick GET endpoint for lightweight route inspection."""
    return generate_rover_route(origin, destination)
