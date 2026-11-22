"""
Lunar Terrain Router for SELENESCAPE
Provides verified scientific data on lunar topology, maria, craters, and South Pole features.
"""

from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from backend.services.lunar_engine import LUNAR_REGIONS, LUNAR_CONSTANTS

router = APIRouter(prefix="/api/terrain", tags=["Lunar Terrain"])

@router.get("/facts")
def get_lunar_facts():
    """Return core physical, orbital and environmental constants of the Moon."""
    return {
        "constants": LUNAR_CONSTANTS,
        "facts": [
            {"label": "Mean Distance from Earth", "value": "384,400 km", "metric": "0.00257 AU"},
            {"label": "Mean Equatorial Radius", "value": "1,737.4 km", "metric": "0.273 Earths"},
            {"label": "Surface Gravity", "value": "1.62 m/s²", "metric": "0.166 g (1/6th Earth)"},
            {"label": "Orbital Period (Sidereal)", "value": "27.32 Earth Days", "metric": "Synchronous Rotation"},
            {"label": "Surface Temperature Extremes", "value": "-246°C to +121°C", "metric": "27 K to 394 K"},
            {"label": "South Pole Volatile Traps", "value": "Permanently Shadowed", "metric": "Cryogenic Reservoirs"}
        ]
    }

@router.get("/regions")
def get_regions(category: Optional[str] = None, search: Optional[str] = None):
    """Retrieve lunar features filtered by category and search keyword."""
    results = LUNAR_REGIONS
    if category and category != "All":
        results = [r for r in results if r["category"].lower() == category.lower()]
    if search:
        s = search.lower()
        results = [r for r in results if s in r["name"].lower() or s in r["type"].lower() or s in r["scientific_value"].lower()]
    return {
        "count": len(results),
        "regions": results
    }

@router.get("/regions/{region_id}")
def get_region(region_id: str):
    """Retrieve deep scientific telemetry for a specific lunar landmark."""
    region = next((r for r in LUNAR_REGIONS if r["id"] == region_id), None)
    if not region:
        raise HTTPException(status_code=404, detail="Lunar landmark identifier not found.")
    return region

@router.get("/opportunities")
def get_exploration_opportunities(priority: Optional[str] = None):
    """Curated exploration targets sorted by scientific return and human settlement viability."""
    sorted_targets = sorted(LUNAR_REGIONS, key=lambda x: (x["illumination_pct"], -x["hazards"]["overall_hazard_score"]), reverse=True)
    return {
        "total_targets": len(sorted_targets),
        "top_strategic_sites": sorted_targets
    }
