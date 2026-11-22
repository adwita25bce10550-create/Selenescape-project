"""
Orbital Safety Monitor Router for SELENESCAPE
Monitors cislunar space traffic, satellite ephemeris, and orbital conjunction risks.
"""

from fastapi import APIRouter, Query
from backend.services.lunar_engine import get_orbital_safety_status, ORBITAL_OBJECTS
from typing import Optional

router = APIRouter(prefix="/api/orbital", tags=["Orbital Traffic"])

@router.get("/status")
def get_orbital_status():
    """Retrieve current orbital traffic safety score and active conjunction alerts."""
    return get_orbital_safety_status()

@router.get("/objects")
def get_orbital_objects(type_filter: Optional[str] = None):
    """List tracked cislunar assets, satellites, and debris."""
    objects = ORBITAL_OBJECTS
    if type_filter and type_filter != "All":
        objects = [o for o in objects if type_filter.lower() in o["type"].lower()]
    return {
        "count": len(objects),
        "objects": objects
    }
