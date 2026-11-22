"""
SELENESCAPE - Core Lunar Physics & Mission Analysis Engine
Simulates lunar terrain metrics, orbital mechanics, hazard detection,
route optimization, and flight safety analysis.
"""

import math
import random
from typing import Dict, List, Any, Optional

LUNAR_CONSTANTS = {
    "radius_km": 1737.4,
    "surface_gravity_ms2": 1.62,
    "mean_distance_km": 384400,
    "orbital_period_days": 27.32,
    "solar_day_hours": 708.7,
    "surface_temp_min_c": -246,  # Deep cold trap in PSR
    "surface_temp_max_c": 121,   # Lunar noon at equator
    "rover_nominal_speed_kph": 0.5, # Nominal exploration rover speed
    "rover_energy_rate_kwh_per_km": 0.42 # Typical lunar rover power consumption
}

LUNAR_REGIONS = [
    {
        "id": "shackleton-crater",
        "name": "Shackleton Crater",
        "category": "South Polar Region",
        "type": "Impact Crater / Cold Trap",
        "lat": -89.9,
        "lng": 0.0,
        "diameter_km": 21.0,
        "depth_km": 4.2,
        "elevation_m": -4200,
        "illumination_pct": 86.5, # Rim peaks receive near-permanent sunlight
        "ice_potential": "High (92%)",
        "thermal_min_k": 40,
        "thermal_max_k": 220,
        "earth_los_pct": 98.0,
        "scientific_value": "Critical for Artemis volatiles harvesting and permanent lunar habitat.",
        "description": "Located almost exactly at the Lunar South Pole. Its deep interior lies in permanent shadow, acting as a cryogenic trap preserving volatile water ice for billions of years, while its rim peaks experience near-constant solar illumination.",
        "hazards": {
            "slope_max_deg": 32.5,
            "boulder_density": "Moderate",
            "psr_risk": "Extreme in crater basin",
            "overall_hazard_score": 58
        }
    },
    {
        "id": "malapert-massif",
        "name": "Malapert Massif",
        "category": "South Polar Region",
        "type": "Highland Mountain / Peak of Light",
        "lat": -86.04,
        "lng": 2.7,
        "diameter_km": 45.0,
        "depth_km": -5.0, # Elevation above datum
        "elevation_m": 5000,
        "illumination_pct": 92.8,
        "ice_potential": "Moderate (45% in sub-ridges)",
        "thermal_min_k": 110,
        "thermal_max_k": 240,
        "earth_los_pct": 100.0,
        "scientific_value": "Prime candidate for primary lunar basecamp and Earth telecom relay station.",
        "description": "A prominent lunar mountain near the South Pole. Its summit remains illuminated for over 90% of the lunar year and maintains continuous line-of-sight to Earth, making it the most strategic communications hub on the Moon.",
        "hazards": {
            "slope_max_deg": 18.0,
            "boulder_density": "Low-Moderate",
            "psr_risk": "Low on plateau",
            "overall_hazard_score": 24
        }
    },
    {
        "id": "cabeus-crater",
        "name": "Cabeus Crater",
        "category": "South Polar Region",
        "type": "Complex Impact Crater",
        "lat": -84.9,
        "lng": -35.5,
        "diameter_km": 100.0,
        "depth_km": 4.0,
        "elevation_m": -3900,
        "illumination_pct": 32.0,
        "ice_potential": "Very High (95% confirmed by LCROSS)",
        "thermal_min_k": 38,
        "thermal_max_k": 180,
        "earth_los_pct": 65.0,
        "scientific_value": "Proven water vapor and hydroxyl deposits detected by NASA LCROSS impact.",
        "description": "Large impact crater famous for NASA's LCROSS mission, which struck the floor in 2009 and detected substantial signatures of water ice, carbon monoxide, and methane in the excavated plume.",
        "hazards": {
            "slope_max_deg": 28.0,
            "boulder_density": "High",
            "psr_risk": "Extreme in central floor",
            "overall_hazard_score": 64
        }
    },
    {
        "id": "haworth-crater",
        "name": "Haworth Crater",
        "category": "South Polar Region",
        "type": "Deep Cold Trap",
        "lat": -87.4,
        "lng": -5.1,
        "diameter_km": 35.0,
        "depth_km": 3.8,
        "elevation_m": -3800,
        "illumination_pct": 12.0,
        "ice_potential": "High (88%)",
        "thermal_min_k": 35,
        "thermal_max_k": 170,
        "earth_los_pct": 40.0,
        "scientific_value": "One of the coldest recorded locations in the solar system (< 40 Kelvin).",
        "description": "Situated between Shoemaker and Faustini craters. Haworth hosts large permanently shadowed regions with temperatures cold enough to trap ultra-volatile compounds including ammonia, CO2, and organics.",
        "hazards": {
            "slope_max_deg": 34.0,
            "boulder_density": "High",
            "psr_risk": "Extreme",
            "overall_hazard_score": 72
        }
    },
    {
        "id": "mare-tranquillitatis",
        "name": "Mare Tranquillitatis",
        "category": "Lunar Maria",
        "type": "Basaltic Plain",
        "lat": 8.5,
        "lng": 31.4,
        "diameter_km": 873.0,
        "depth_km": 0.5,
        "elevation_m": -1200,
        "illumination_pct": 50.0, # Normal day/night 14-day cycle
        "ice_potential": "Negligible (< 1%)",
        "thermal_min_k": 95,
        "thermal_max_k": 390,
        "earth_los_pct": 100.0,
        "scientific_value": "Historic Apollo 11 landing site; rich titanium-bearing basaltic geology.",
        "description": "The Sea of Tranquility is a vast lunar mare formed by ancient flood basalt eruptions. Smooth, gently undulating terrain with high ilmenite and titanium content, perfect for large-scale solar arrays and resource extraction.",
        "hazards": {
            "slope_max_deg": 6.5,
            "boulder_density": "Low",
            "psr_risk": "None",
            "overall_hazard_score": 12
        }
    },
    {
        "id": "oceanus-procellarum",
        "name": "Oceanus Procellarum",
        "category": "Lunar Maria",
        "type": "Vast Lunar Mare",
        "lat": 18.4,
        "lng": -57.4,
        "diameter_km": 2592.0,
        "depth_km": 1.2,
        "elevation_m": -1800,
        "illumination_pct": 50.0,
        "ice_potential": "Negligible (< 1%)",
        "thermal_min_k": 90,
        "thermal_max_k": 395,
        "earth_los_pct": 100.0,
        "scientific_value": "Largest lunar mare; volcanic complexes, rilles, and young mare basalts.",
        "description": "The Ocean of Storms covers over 4 million square kilometers on the western edge of the near side. Contains significant concentrations of heat-producing radioactive elements (KREEP terrain).",
        "hazards": {
            "slope_max_deg": 8.0,
            "boulder_density": "Low",
            "psr_risk": "None",
            "overall_hazard_score": 16
        }
    },
    {
        "id": "tycho-crater",
        "name": "Tycho Crater",
        "category": "Impact Craters",
        "type": "Copernican Impact Crater",
        "lat": -43.31,
        "lng": -11.22,
        "diameter_km": 85.0,
        "depth_km": 4.8,
        "elevation_m": -4800,
        "illumination_pct": 50.0,
        "ice_potential": "Low (5%)",
        "thermal_min_k": 85,
        "thermal_max_k": 380,
        "earth_los_pct": 100.0,
        "scientific_value": "Young impact (108 Myr) with immense ray system spanning 1,500 km across the lunar disk.",
        "description": "A textbook example of a young, pristine complex impact crater with sharply terraced walls, central mountain peaks rising 2 km, and dazzling high-albedo rays visible with binoculars from Earth.",
        "hazards": {
            "slope_max_deg": 38.0,
            "boulder_density": "Severe",
            "psr_risk": "Moderate (wall shadows)",
            "overall_hazard_score": 76
        }
    },
    {
        "id": "hadley-rille",
        "name": "Hadley Rille / Apennine",
        "category": "Lunar Rilles",
        "type": "Collapsed Lava Channel",
        "lat": 26.13,
        "lng": 3.63,
        "diameter_km": 120.0, # Length
        "depth_km": 0.4,
        "elevation_m": -1400,
        "illumination_pct": 50.0,
        "ice_potential": "Low (8%)",
        "thermal_min_k": 90,
        "thermal_max_k": 385,
        "earth_los_pct": 100.0,
        "scientific_value": "Apollo 15 site; volcanic channel unveiling cross-sections of pristine lunar crust.",
        "description": "A sinuous channel carved by torrential ancient lava flows winding along the foot of the towering Montes Apenninus mountain range, providing a natural open trench exposing deep stratigraphy.",
        "hazards": {
            "slope_max_deg": 26.0,
            "boulder_density": "High near trench",
            "psr_risk": "Low",
            "overall_hazard_score": 48
        }
    },
    {
        "id": "marius-hills",
        "name": "Marius Hills Pit",
        "category": "Lunar Rilles / Volcanic",
        "type": "Lava Tube Skylight",
        "lat": 14.08,
        "lng": -56.77,
        "diameter_km": 0.065, # Skylight diameter 65m
        "depth_km": 0.09,
        "elevation_m": -850,
        "illumination_pct": 45.0,
        "ice_potential": "Moderate in subsurface",
        "thermal_min_k": 255, # Stable ~ -18°C inside tube!
        "thermal_max_k": 255,
        "earth_los_pct": 100.0,
        "scientific_value": "Natural subterranean cavern providing radiation shielding and thermal stability for human habitats.",
        "description": "A gaping skylight into an underground lava tube. Shielded from cosmic radiation, micrometeorites, and temperature extremes, it offers an ideal natural vault for pressurized human colonies.",
        "hazards": {
            "slope_max_deg": 90.0, # Vertical drop at skylight rim
            "boulder_density": "Extreme at opening",
            "psr_risk": "High inside cave",
            "overall_hazard_score": 62
        }
    }
]

ORBITAL_OBJECTS = [
    {
        "id": "lro",
        "name": "Lunar Reconnaissance Orbiter (LRO)",
        "operator": "NASA / Goddard",
        "type": "Active Science Orbiter",
        "orbit_type": "Polar Elliptical",
        "altitude_km": 50,
        "inclination_deg": 90.0,
        "period_min": 113.8,
        "velocity_kms": 1.63,
        "status": "Operational",
        "conjunction_risk": "Nominal",
        "miss_distance_km": 14.2,
        "collision_prob": 1.2e-7
    },
    {
        "id": "chandrayaan-3-prop",
        "name": "Chandrayaan-3 Propulsion Module",
        "operator": "ISRO",
        "type": "Relay / Science",
        "orbit_type": "High Lunar / Return Orbit",
        "altitude_km": 154,
        "inclination_deg": 89.2,
        "period_min": 127.4,
        "velocity_kms": 1.58,
        "status": "Operational",
        "conjunction_risk": "Low",
        "miss_distance_km": 8.7,
        "collision_prob": 3.4e-6
    },
    {
        "id": "capstone",
        "name": "CAPSTONE (Cislunar Explorer)",
        "operator": "NASA / Advanced Space",
        "type": "Pathfinder",
        "orbit_type": "Near Rectilinear Halo (NRHO)",
        "altitude_km": 3100,
        "inclination_deg": 71.4,
        "period_min": 10080, # 7 days
        "velocity_kms": 0.82,
        "status": "Operational",
        "conjunction_risk": "Nominal",
        "miss_distance_km": 42.1,
        "collision_prob": 1.0e-9
    },
    {
        "id": "kplo-danuri",
        "name": "KPLO (Danuri)",
        "operator": "KARI (Korea)",
        "type": "Science Orbiter",
        "orbit_type": "Circular Polar",
        "altitude_km": 100,
        "inclination_deg": 90.0,
        "period_min": 118.0,
        "velocity_kms": 1.61,
        "status": "Operational",
        "conjunction_risk": "Elevated",
        "miss_distance_km": 3.8,
        "collision_prob": 2.1e-4
    },
    {
        "id": "lunar-gateway-halo",
        "name": "Lunar Gateway (Simulated Orbit)",
        "operator": "NASA / ESA / JAXA / CSA",
        "type": "Crewed Space Station",
        "orbit_type": "NRHO 9:2 Resonant",
        "altitude_km": 3000,
        "inclination_deg": 70.8,
        "period_min": 9360,
        "velocity_kms": 0.85,
        "status": "Simulated Planning",
        "conjunction_risk": "Nominal",
        "miss_distance_km": 65.0,
        "collision_prob": 1.0e-11
    },
    {
        "id": "debris-sat-spent-stage",
        "name": "Deb-2023-089A (Spent Upper Stage)",
        "operator": "Unknown / Derelict",
        "type": "Tracked Space Debris",
        "orbit_type": "Decaying Elliptical",
        "altitude_km": 82,
        "inclination_deg": 88.4,
        "period_min": 116.2,
        "velocity_kms": 1.62,
        "status": "Uncontrolled Debris",
        "conjunction_risk": "Critical Conjunction",
        "miss_distance_km": 1.9,
        "collision_prob": 8.5e-3
    }
]

def calculate_great_circle_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance on Moon in kilometers using Haversine formula."""
    r = LUNAR_CONSTANTS["radius_km"]
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lng2 - lng1)
    a = math.sin(delta_phi/2.0)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(delta_lambda/2.0)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c

def generate_rover_route(origin_id: str, dest_id: str) -> Dict[str, Any]:
    """Generate two competing rover routes: Shortest vs Safer."""
    origin = next((r for r in LUNAR_REGIONS if r["id"] == origin_id), LUNAR_REGIONS[1]) # Default Malapert
    dest = next((r for r in LUNAR_REGIONS if r["id"] == dest_id), LUNAR_REGIONS[0]) # Default Shackleton

    direct_dist = calculate_great_circle_distance(origin["lat"], origin["lng"], dest["lat"], dest["lng"])
    if direct_dist < 1.0:
        direct_dist = 18.5 # Meaningful minimum exploration path

    # Shortest Route: direct path, cuts across terrain, steeper slopes, faster distance
    shortest_dist = round(direct_dist * 1.12, 2)
    shortest_time_hrs = round(shortest_dist / LUNAR_CONSTANTS["rover_nominal_speed_kph"], 1)
    shortest_energy_kwh = round(shortest_dist * LUNAR_CONSTANTS["rover_energy_rate_kwh_per_km"] * 1.25, 2) # Higher slope penalty
    shortest_max_slope = round(min(38.0, max(origin["hazards"]["slope_max_deg"], dest["hazards"]["slope_max_deg"]) + 3.5), 1)
    shortest_hazard_score = min(88, int((origin["hazards"]["overall_hazard_score"] + dest["hazards"]["overall_hazard_score"]) * 0.65 + 12))

    # Safer Route: follows ridge lines, avoids boulder traps and deep shadows
    safer_dist = round(direct_dist * 1.48, 2)
    safer_time_hrs = round(safer_dist / LUNAR_CONSTANTS["rover_nominal_speed_kph"], 1)
    safer_energy_kwh = round(safer_dist * LUNAR_CONSTANTS["rover_energy_rate_kwh_per_km"] * 0.95, 2) # Gentle terrain efficiency
    safer_max_slope = round(max(8.0, min(origin["hazards"]["slope_max_deg"], dest["hazards"]["slope_max_deg"]) - 4.0), 1)
    safer_hazard_score = max(14, int((origin["hazards"]["overall_hazard_score"] + dest["hazards"]["overall_hazard_score"]) * 0.35))

    # Generate 8 synthetic waypoints with elevation and illumination
    waypoints_shortest = []
    waypoints_safer = []
    num_steps = 7
    
    for i in range(num_steps + 1):
        t = i / num_steps
        lat = origin["lat"] + t * (dest["lat"] - origin["lat"])
        lng = origin["lng"] + t * (dest["lng"] - origin["lng"])
        
        # Shortest route drops into depression
        elev_short = int(origin["elevation_m"] + t * (dest["elevation_m"] - origin["elevation_m"]) - math.sin(t * math.pi) * 800)
        waypoints_shortest.append({
            "step": i + 1,
            "lat": round(lat, 4),
            "lng": round(lng, 4),
            "elevation_m": elev_short,
            "slope_deg": round(abs(math.sin(t * math.pi * 2)) * shortest_max_slope, 1),
            "hazard": "Steep Slope / Shadow" if (i in [2, 3, 4] and shortest_hazard_score > 40) else "Passable"
        })

        # Safer route stays on ridges
        elev_safe = int(origin["elevation_m"] + t * (dest["elevation_m"] - origin["elevation_m"]) + math.sin(t * math.pi) * 350)
        waypoints_safer.append({
            "step": i + 1,
            "lat": round(lat + math.sin(t * math.pi) * 0.25, 4),
            "lng": round(lng + math.sin(t * math.pi) * 0.45, 4),
            "elevation_m": elev_safe,
            "slope_deg": round(abs(math.sin(t * math.pi * 1.5)) * safer_max_slope, 1),
            "hazard": "Clear Corridor"
        })

    recommendation = "Safer Route (Ridge Corridor)" if shortest_hazard_score > 45 else "Shortest Route (Terrain Acceptable)"

    return {
        "origin": origin,
        "destination": dest,
        "direct_distance_km": round(direct_dist, 2),
        "recommendation": recommendation,
        "shortest_route": {
            "name": "Direct Penetration Route",
            "distance_km": shortest_dist,
            "estimated_time_hours": shortest_time_hrs,
            "energy_kwh": shortest_energy_kwh,
            "max_slope_deg": shortest_max_slope,
            "hazard_score": shortest_hazard_score,
            "risk_profile": "High slope and potential shadow entrapment in intermediate craters.",
            "waypoints": waypoints_shortest
        },
        "safer_route": {
            "name": "Tactical Ridge Corridor",
            "distance_km": safer_dist,
            "estimated_time_hours": safer_time_hrs,
            "energy_kwh": safer_energy_kwh,
            "max_slope_deg": safer_max_slope,
            "hazard_score": safer_hazard_score,
            "risk_profile": "Continuous solar line-of-sight, avoids slopes > 15°, minimal boulder risk.",
            "waypoints": waypoints_safer
        }
    }

def analyze_terrain_hazards(region_id: str) -> Dict[str, Any]:
    """Provide detailed breakdown of terrain hazard layers for a specific region."""
    region = next((r for r in LUNAR_REGIONS if r["id"] == region_id), LUNAR_REGIONS[0])
    hazards = region["hazards"]

    slope_risk = min(100, int(hazards["slope_max_deg"] / 35.0 * 100))
    boulder_map = {"Low": 20, "Low-Moderate": 40, "Moderate": 55, "High": 80, "Severe": 92, "Extreme": 98}
    boulder_risk = boulder_map.get(hazards["boulder_density"], 50)
    psr_risk_score = 95 if "Extreme" in hazards["psr_risk"] else (60 if "Moderate" in hazards["psr_risk"] else 15)

    composite_score = int(0.4 * slope_risk + 0.3 * boulder_risk + 0.3 * psr_risk_score)
    safety_grade = "GREEN (Safe)" if composite_score < 30 else ("AMBER (Cautious)" if composite_score < 60 else "RED (Hazardous)")

    return {
        "region_id": region["id"],
        "region_name": region["name"],
        "composite_risk_score": composite_score,
        "safety_grade": safety_grade,
        "layers": {
            "slope_gradient": {
                "max_deg": hazards["slope_max_deg"],
                "risk_score": slope_risk,
                "status": "Critical" if slope_risk > 70 else ("Caution" if slope_risk > 40 else "Safe"),
                "notes": "Slopes above 20° present significant wheel slip and rollover danger for standard rovers."
            },
            "boulder_distribution": {
                "density": hazards["boulder_density"],
                "risk_score": boulder_risk,
                "status": "High Density" if boulder_risk > 70 else "Manageable",
                "notes": "Large rock clusters (> 0.8m diameter) can disable suspension systems."
            },
            "permanently_shadowed_regions": {
                "description": hazards["psr_risk"],
                "risk_score": psr_risk_score,
                "status": "Extreme Cryogenic" if psr_risk_score > 80 else "Normal Sunlight",
                "notes": "Temperatures plummet to 40 K (-233°C). Requires radioisotope heating units (RHUs)."
            },
            "safe_corridors": {
                "available": True if composite_score < 75 else False,
                "corridor_width_m": 450 if composite_score < 40 else 120,
                "confidence_pct": 94.2
            }
        }
    }

def get_orbital_safety_status() -> Dict[str, Any]:
    """Calculate cislunar traffic status and highlight close-approach conjunctions."""
    conjunctions = []
    for sat in ORBITAL_OBJECTS:
        if sat["miss_distance_km"] < 5.0 or sat["collision_prob"] > 1e-4:
            conjunctions.append({
                "object_name": sat["name"],
                "miss_distance_km": sat["miss_distance_km"],
                "collision_prob": sat["collision_prob"],
                "time_to_closest_approach_hrs": round(random.uniform(2.1, 9.4), 1),
                "severity": "CRITICAL" if sat["collision_prob"] > 1e-3 else "WARNING"
            })

    orbital_score = 92 # Nominal baseline
    if any(c["severity"] == "CRITICAL" for c in conjunctions):
        orbital_score = 48
    elif conjunctions:
        orbital_score = 72

    return {
        "tracked_objects_count": len(ORBITAL_OBJECTS),
        "orbital_safety_score": orbital_score,
        "status_code": "GREEN" if orbital_score > 80 else ("AMBER" if orbital_score > 60 else "RED"),
        "active_conjunctions": conjunctions,
        "objects": ORBITAL_OBJECTS
    }

def compute_combined_risk_assessment(region_id: str, origin_id: str, dest_id: str) -> Dict[str, Any]:
    """Combines Lunar Surface Terrain safety and Cislunar Orbital traffic."""
    hazard_analysis = analyze_terrain_hazards(region_id)
    route_data = generate_rover_route(origin_id, dest_id)
    orbital_data = get_orbital_safety_status()

    terrain_risk = hazard_analysis["composite_risk_score"]
    route_risk = route_data["safer_route"]["hazard_score"]
    orbital_risk = 100 - orbital_data["orbital_safety_score"]

    # Fused mission safety formula: 100 - weighted risks
    overall_safety_score = max(5, int(100 - (0.4 * terrain_risk + 0.35 * route_risk + 0.25 * orbital_risk)))

    # Determine actionable flight director recommendation
    recommendations = []
    action_type = "Safe to Proceed"

    if orbital_data["active_conjunctions"]:
        crit = next((c for c in orbital_data["active_conjunctions"] if c["severity"] == "CRITICAL"), None)
        if crit:
            recommendations.append(f"Adjust Orbit: Orbital conjunction with {crit['object_name']} (Miss dist: {crit['miss_distance_km']} km). Execute 1.8 m/s delta-v phase burn.")
            action_type = "Adjust Orbit"

    if terrain_risk > 65:
        recommendations.append(f"Change Landing Point: Selected target {hazard_analysis['region_name']} exceeds safe slope limits (Risk {terrain_risk}/100). Shift landing ellipse +4.2 km North.")
        action_type = "Change Landing Point"
    elif route_data["shortest_route"]["hazard_score"] > 55:
        recommendations.append("Replan Rover Route: Direct path crosses high-risk boulder field. Adopt 'Tactical Ridge Corridor' instead.")
        if action_type == "Safe to Proceed":
            action_type = "Replan Rover Route"

    if not recommendations:
        recommendations.append("Safe to Proceed: All terrain gradients, thermal constraints, and orbital clearance margins are within NASA/ESA green bounds.")

    return {
        "overall_mission_safety_score": overall_safety_score,
        "mission_grade": "CLASS-A (GO)" if overall_safety_score >= 80 else ("CLASS-B (CAUTION)" if overall_safety_score >= 60 else "CLASS-C (NO-GO / REPLAN)"),
        "primary_action": action_type,
        "recommendations": recommendations,
        "sub_scores": {
            "terrain_safety": 100 - terrain_risk,
            "route_viability": 100 - route_risk,
            "orbital_clearance": orbital_data["orbital_safety_score"]
        },
        "target_region": hazard_analysis["region_name"],
        "selected_route_summary": {
            "origin": route_data["origin"]["name"],
            "destination": route_data["destination"]["name"],
            "recommended_path": route_data["recommendation"],
            "distance_km": route_data["safer_route"]["distance_km"],
            "time_hours": route_data["safer_route"]["estimated_time_hours"]
        }
    }

def generate_mission_report(mission_name: str, target_region_id: str, origin_id: str, dest_id: str) -> Dict[str, Any]:
    """Generates an executive mission flight dossier ready for PDF download."""
    assessment = compute_combined_risk_assessment(target_region_id, origin_id, dest_id)
    region = next((r for r in LUNAR_REGIONS if r["id"] == target_region_id), LUNAR_REGIONS[0])
    route = generate_rover_route(origin_id, dest_id)

    report_id = f"SLS-{random.randint(1000, 9999)}-{target_region_id[:4].upper()}"

    return {
        "report_id": report_id,
        "timestamp": "2026-11-21 22:15 UTC",
        "mission_title": mission_name or "Artemis Volatiles Surveyor Alpha",
        "target_location": {
            "name": region["name"],
            "coordinates": f"{region['lat']}° Lat, {region['lng']}° Lng",
            "category": region["category"],
            "scientific_significance": region["scientific_value"]
        },
        "rover_route_plan": {
            "origin": route["origin"]["name"],
            "destination": route["destination"]["name"],
            "path_type": route["recommendation"],
            "total_distance_km": route["safer_route"]["distance_km"],
            "estimated_traverse_time": f"{route['safer_route']['estimated_time_hours']} Earth Hours",
            "power_budget_kwh": route["safer_route"]["energy_kwh"],
            "max_slope_encountered": f"{route['safer_route']['max_slope_deg']}°"
        },
        "environmental_hazards": {
            "slope_status": region["hazards"]["slope_max_deg"],
            "boulder_density": region["hazards"]["boulder_density"],
            "cryogenic_psr_status": region["hazards"]["psr_risk"],
            "mitigation_strategy": "Rover trajectory restricted to permanently sunlit ridges; radioisotope heat active."
        },
        "orbital_traffic_status": {
            "score": assessment["sub_scores"]["orbital_clearance"],
            "tracked_assets": len(ORBITAL_OBJECTS),
            "status": "Monitored / Cleared"
        },
        "safety_audit": {
            "composite_score": assessment["overall_mission_safety_score"],
            "mission_grade": assessment["mission_grade"],
            "flight_director_decision": assessment["primary_action"],
            "formal_findings": assessment["recommendations"]
        }
    }
