/**
 * SELENESCAPE - Unified API Service
 * Queries the FastAPI server when available, or seamlessly falls back
 * to scientific client simulation so the landing page and all tools work offline/standalone.
 */

const API_BASE = window.location.origin.includes("http") ? "" : "http://127.0.0.1:8000";

export const ApiService = {
  token: localStorage.getItem("selenescape_token") || null,

  setToken(t) {
    this.token = t;
    if (t) localStorage.setItem("selenescape_token", t);
    else localStorage.removeItem("selenescape_token");
  },

  getHeaders() {
    const headers = { "Content-Type": "application/json" };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    return headers;
  },

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...(options.headers || {})
        }
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Request failed with status ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.warn(`[SELENESCAPE API] Backend unavailable or failed on ${endpoint}: ${err.message}. Invoking client fallback simulation.`);
      return this.fallback(endpoint, options);
    }
  },

  // Client Fallback Simulation Data
  fallback(endpoint, options) {
    if (endpoint.includes("/api/terrain/facts")) {
      return {
        constants: {
          radius_km: 1737.4,
          surface_gravity_ms2: 1.62,
          mean_distance_km: 384400,
          orbital_period_days: 27.32,
          surface_temp_min_c: -246,
          surface_temp_max_c: 121
        },
        facts: [
          { label: "Mean Distance from Earth", value: "384,400 km", metric: "0.00257 AU" },
          { label: "Mean Equatorial Radius", value: "1,737.4 km", metric: "0.273 Earths" },
          { label: "Surface Gravity", value: "1.62 m/s²", metric: "0.166 g" },
          { label: "Orbital Period (Sidereal)", value: "27.32 Days", metric: "Synchronous" },
          { label: "Surface Temp Extremes", value: "-246°C to +121°C", metric: "27 K to 394 K" },
          { label: "South Pole Volatile Traps", value: "Permanently Shadowed", metric: "Cryogenic" }
        ]
      };
    }

    if (endpoint.includes("/api/terrain/regions")) {
      return {
        count: 9,
        regions: [
          {
            id: "shackleton-crater",
            name: "Shackleton Crater",
            category: "South Polar Region",
            type: "Impact Crater / Cold Trap",
            lat: -89.9,
            lng: 0.0,
            diameter_km: 21.0,
            depth_km: 4.2,
            elevation_m: -4200,
            illumination_pct: 86.5,
            ice_potential: "High (92%)",
            scientific_value: "Critical for Artemis volatiles harvesting and permanent lunar habitat.",
            description: "Located almost exactly at the Lunar South Pole. Its deep interior lies in permanent shadow preserving volatile water ice, while its rim peaks experience near-constant solar illumination.",
            hazards: { slope_max_deg: 32.5, boulder_density: "Moderate", psr_risk: "Extreme in crater basin", overall_hazard_score: 58 }
          },
          {
            id: "malapert-massif",
            name: "Malapert Massif",
            category: "South Polar Region",
            type: "Highland Mountain / Peak of Light",
            lat: -86.04,
            lng: 2.7,
            diameter_km: 45.0,
            depth_km: -5.0,
            elevation_m: 5000,
            illumination_pct: 92.8,
            ice_potential: "Moderate (45%)",
            scientific_value: "Prime candidate for primary lunar basecamp and Earth telecom relay station.",
            description: "A prominent lunar mountain near the South Pole. Its summit remains illuminated for over 90% of the lunar year and maintains continuous line-of-sight to Earth.",
            hazards: { slope_max_deg: 18.0, boulder_density: "Low-Moderate", psr_risk: "Low on plateau", overall_hazard_score: 24 }
          },
          {
            id: "cabeus-crater",
            name: "Cabeus Crater",
            category: "South Polar Region",
            type: "Complex Impact Crater",
            lat: -84.9,
            lng: -35.5,
            diameter_km: 100.0,
            depth_km: 4.0,
            elevation_m: -3900,
            illumination_pct: 32.0,
            ice_potential: "Very High (95% confirmed by LCROSS)",
            scientific_value: "Proven water vapor and hydroxyl deposits detected by NASA LCROSS impact.",
            description: "Large impact crater where NASA's LCROSS mission detected substantial signatures of water ice, carbon monoxide, and methane in the excavated plume.",
            hazards: { slope_max_deg: 28.0, boulder_density: "High", psr_risk: "Extreme in central floor", overall_hazard_score: 64 }
          },
          {
            id: "haworth-crater",
            name: "Haworth Crater",
            category: "South Polar Region",
            type: "Deep Cold Trap",
            lat: -87.4,
            lng: -5.1,
            diameter_km: 35.0,
            depth_km: 3.8,
            elevation_m: -3800,
            illumination_pct: 12.0,
            ice_potential: "High (88%)",
            scientific_value: "One of the coldest recorded locations in the solar system (< 40 Kelvin).",
            description: "Hosts large permanently shadowed regions with temperatures cold enough to trap ultra-volatile compounds including ammonia, CO2, and organics.",
            hazards: { slope_max_deg: 34.0, boulder_density: "High", psr_risk: "Extreme", overall_hazard_score: 72 }
          },
          {
            id: "mare-tranquillitatis",
            name: "Mare Tranquillitatis",
            category: "Lunar Maria",
            type: "Basaltic Plain",
            lat: 8.5,
            lng: 31.4,
            diameter_km: 873.0,
            depth_km: 0.5,
            elevation_m: -1200,
            illumination_pct: 50.0,
            ice_potential: "Negligible (< 1%)",
            scientific_value: "Historic Apollo 11 landing site; rich titanium-bearing basaltic geology.",
            description: "Smooth basaltic plain formed by ancient volcanic floods. Low slopes and high titanium content ideal for surface construction.",
            hazards: { slope_max_deg: 6.5, boulder_density: "Low", psr_risk: "None", overall_hazard_score: 12 }
          },
          {
            id: "marius-hills",
            name: "Marius Hills Pit",
            category: "Lunar Rilles / Volcanic",
            type: "Lava Tube Skylight",
            lat: 14.08,
            lng: -56.77,
            diameter_km: 0.065,
            depth_km: 0.09,
            elevation_m: -850,
            illumination_pct: 45.0,
            ice_potential: "Moderate in subsurface",
            scientific_value: "Subterranean cavern providing radiation shielding and thermal stability.",
            description: "A natural opening into a vast subsurface lava tube network. Provides natural radiation shielding from cosmic rays.",
            hazards: { slope_max_deg: 90.0, boulder_density: "Extreme at opening", psr_risk: "High inside cave", overall_hazard_score: 62 }
          }
        ]
      };
    }

    if (endpoint.includes("/api/orbital/status")) {
      return {
        tracked_objects_count: 6,
        orbital_safety_score: 88,
        status_code: "GREEN",
        active_conjunctions: [
          {
            object_name: "Deb-2023-089A (Spent Upper Stage)",
            miss_distance_km: 2.1,
            collision_prob: 0.0034,
            time_to_closest_approach_hrs: 4.6,
            severity: "CRITICAL"
          }
        ],
        objects: [
          { id: "lro", name: "Lunar Reconnaissance Orbiter (LRO)", operator: "NASA", type: "Active Science", altitude_km: 50, velocity_kms: 1.63, conjunction_risk: "Nominal", miss_distance_km: 14.2 },
          { id: "chandrayaan-3", name: "Chandrayaan-3 Propulsion Module", operator: "ISRO", type: "Relay / Science", altitude_km: 154, velocity_kms: 1.58, conjunction_risk: "Low", miss_distance_km: 8.7 },
          { id: "capstone", name: "CAPSTONE", operator: "NASA", type: "Pathfinder", altitude_km: 3100, velocity_kms: 0.82, conjunction_risk: "Nominal", miss_distance_km: 42.1 },
          { id: "gateway", name: "Lunar Gateway (Simulated Orbit)", operator: "NASA/ESA/JAXA", type: "Crewed Habitat", altitude_km: 3000, velocity_kms: 0.85, conjunction_risk: "Nominal", miss_distance_km: 65.0 },
          { id: "danuri", name: "KPLO Danuri", operator: "KARI", type: "Science Orbiter", altitude_km: 100, velocity_kms: 1.61, conjunction_risk: "Elevated", miss_distance_km: 3.8 },
          { id: "debris", name: "Deb-2023-089A", operator: "Derelict", type: "Tracked Debris", altitude_km: 82, velocity_kms: 1.62, conjunction_risk: "Critical Conjunction", miss_distance_km: 2.1 }
        ]
      };
    }

    if (endpoint.includes("/api/route/plan") || endpoint.includes("/api/route/quick")) {
      return {
        origin: { name: "Malapert Massif Peak", lat: -86.04, lng: 2.7 },
        destination: { name: "Shackleton Crater Rim", lat: -89.9, lng: 0.0 },
        direct_distance_km: 122.4,
        recommendation: "Safer Route (Ridge Corridor)",
        shortest_route: {
          name: "Direct Penetration Route",
          distance_km: 137.1,
          estimated_time_hours: 274.2,
          energy_kwh: 57.6,
          max_slope_deg: 32.5,
          hazard_score: 72,
          risk_profile: "High slope and potential shadow entrapment in intermediate craters.",
          waypoints: [
            { step: 1, elevation_m: 5000, slope_deg: 4.2, hazard: "Clear" },
            { step: 2, elevation_m: 3200, slope_deg: 18.4, hazard: "Steep Slope" },
            { step: 3, elevation_m: -1500, slope_deg: 29.1, hazard: "Steep Slope / Shadow" },
            { step: 4, elevation_m: -4200, slope_deg: 32.5, hazard: "Steep Crater Wall" }
          ]
        },
        safer_route: {
          name: "Tactical Ridge Corridor",
          distance_km: 181.2,
          estimated_time_hours: 362.4,
          energy_kwh: 72.4,
          max_slope_deg: 14.0,
          hazard_score: 22,
          risk_profile: "Continuous solar line-of-sight, avoids slopes > 15°, minimal boulder risk.",
          waypoints: [
            { step: 1, elevation_m: 5000, slope_deg: 3.5, hazard: "Clear Corridor" },
            { step: 2, elevation_m: 4200, slope_deg: 7.8, hazard: "Clear Corridor" },
            { step: 3, elevation_m: 3100, slope_deg: 11.2, hazard: "Moderate Incline" },
            { step: 4, elevation_m: 1200, slope_deg: 13.9, hazard: "Ridge Crest Safe" }
          ]
        }
      };
    }

    if (endpoint.includes("/api/hazards/analyze")) {
      return {
        region_id: "shackleton-crater",
        region_name: "Shackleton Crater",
        composite_risk_score: 58,
        safety_grade: "AMBER (Cautious)",
        layers: {
          slope_gradient: { max_deg: 32.5, risk_score: 74, status: "Critical", notes: "Slopes above 20° present rollover hazards." },
          boulder_distribution: { density: "Moderate", risk_score: 55, status: "Manageable", notes: "Rock clusters detected on inner terrace." },
          permanently_shadowed_regions: { description: "Extreme in crater basin", risk_score: 95, status: "Extreme Cryogenic", notes: "Cryogenic temps < 40 K." },
          safe_corridors: { available: true, corridor_width_m: 180, confidence_pct: 92.4 }
        }
      };
    }

    if (endpoint.includes("/api/risk/evaluate") || endpoint.includes("/api/risk/quick")) {
      return {
        overall_mission_safety_score: 84,
        mission_grade: "CLASS-A (GO)",
        primary_action: "Safe to Proceed",
        recommendations: [
          "Safe to Proceed: All terrain gradients and thermal constraints within acceptable tolerances when utilizing Tactical Ridge Corridor.",
          "Caution: Monitor debris conjunction Deb-2023-089A closely."
        ],
        sub_scores: { terrain_safety: 76, route_viability: 82, orbital_clearance: 92 }
      };
    }

    if (endpoint.includes("/api/reports/generate")) {
      return {
        report_id: "SLS-8841-SHAC",
        timestamp: new Date().toUTCString(),
        mission_title: "Artemis Volatiles Surveyor",
        target_location: { name: "Shackleton Crater", coordinates: "-89.9° Lat, 0.0° Lng", category: "South Polar Region" },
        rover_route_plan: { origin: "Malapert Massif", destination: "Shackleton Crater", path_type: "Tactical Ridge Corridor", total_distance_km: 181.2, estimated_traverse_time: "362 Earth Hours", power_budget_kwh: 72.4, max_slope_encountered: "14.0°" },
        safety_audit: { composite_score: 84, mission_grade: "CLASS-A (GO)", flight_director_decision: "Safe to Proceed", formal_findings: ["Terrain gradients verified via LOLA laser altimeter.", "Orbital corridor clear."] }
      };
    }

    // Default auth responses
    if (endpoint.includes("/api/auth/login") || endpoint.includes("/api/auth/register")) {
      return {
        token: "sls-tok-simulated-session-991",
        user: { id: "usr-01", email: "commander@selenescape.org", full_name: "Commander Elena Vance", callsign: "ARTEMIS-LEAD", role: "Flight Director" },
        message: "Authentication successful (Simulated Mode)."
      };
    }

    return {};
  }
};
