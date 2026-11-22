/**
 * SELENESCAPE - Application Coordinator & Module Controller
 * Integrates Starfield, Moon Visuals, API layer, and view routing.
 */

import { state } from "./state.js";
import { ApiService } from "./api.js";
import { Starfield } from "./utils/starfield.js";
import { MoonRenderer } from "./utils/moon_renderer.js";
import { ThreeMoon } from "./utils/three_moon.js";
import { Interactive3DMoon } from "./utils/interactive_3d_moon.js";

import { renderNavbar } from "./components/Navbar.js";
import { renderHeroSection } from "./components/HeroSection.js";
import { renderFactsSection } from "./components/FactsSection.js";
import { renderExploreSection } from "./components/ExploreSection.js";
import { renderMissionCapabilities } from "./components/MissionCapabilities.js";
import { renderLunarDestinations } from "./components/LunarDestinations.js";
import { renderFinalCTA } from "./components/FinalCTA.js";
import { renderFooter } from "./components/Footer.js";
import { renderAuthModal } from "./components/AuthModal.js";

import { renderDashboard } from "./components/Dashboard.js";
import { renderLunarExplorer } from "./components/LunarExplorer.js";
import { renderRoutePlanner } from "./components/RoutePlanner.js";
import { renderHazardAnalysis } from "./components/HazardAnalysis.js";
import { renderOrbitalMonitor } from "./components/OrbitalMonitor.js";
import { renderExplorationOpps } from "./components/ExplorationOpps.js";
import { renderCombinedRisk } from "./components/CombinedRisk.js";
import { renderMissionReports } from "./components/MissionReports.js";
import { renderSettings } from "./components/Settings.js";

class App {
  constructor() {
    this.starfield = null;
    this.heroMoon = null;
    this.interactiveMoon = null;
    this.regionsData = [];
    this.orbitalData = null;
  }

  async start() {
    // 1. Initialize global animated space starfield
    this.starfield = new Starfield("starfield-canvas");

    // 2. Subscribe to reactive state updates
    state.subscribe(() => this.render());

    // 3. Preload core lunar regions
    try {
      const data = await ApiService.request("/api/terrain/regions");
      this.regionsData = data.regions || [];
    } catch (e) {
      console.warn("Using fallback regions data");
    }

    // 4. Initial render
    this.render();

    // 5. Handle scroll parallax and glass effect on Navbar
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;

          // Header glass effect
          const header = document.getElementById("main-header");
          if (header) {
            if (scrollY > 40) {
              header.classList.add("bg-slate-950/80", "backdrop-blur-xl", "border-b", "border-white/10", "shadow-2xl");
            } else {
              header.classList.remove("bg-slate-950/80", "backdrop-blur-xl", "border-b", "border-white/10", "shadow-2xl");
            }
          }

          // Parallax movement on hero moon wrapper and background elements
          const moonWrapper = document.getElementById("hero-moon-wrapper");
          if (moonWrapper) {
            // Smoothly moves the moon at a cinematic parallax speed as page scrolls up and down
            moonWrapper.style.transform = `translate3d(0, calc(-50% + ${scrollY * 0.28}px), 0)`;
          }

          // Subtle parallax on hero text
          const heroText = document.querySelector("#hero-section > .relative.z-20");
          if (heroText) {
            heroText.style.transform = `translate3d(0, ${scrollY * 0.15}px, 0)`;
            heroText.style.opacity = Math.max(0, 1 - (scrollY / 700));
          }

          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  render() {
    const root = document.getElementById("app-root");
    if (!root) return;

    let contentHtml = "";

    switch (state.currentView) {
      case "dashboard":
        contentHtml = renderDashboard();
        break;
      case "explorer":
        contentHtml = renderLunarExplorer();
        break;
      case "routes":
        contentHtml = renderRoutePlanner();
        break;
      case "hazards":
        contentHtml = renderHazardAnalysis();
        break;
      case "orbital":
        contentHtml = renderOrbitalMonitor();
        break;
      case "opportunities":
        contentHtml = renderExplorationOpps();
        break;
      case "risk":
        contentHtml = renderCombinedRisk();
        break;
      case "reports":
        contentHtml = renderMissionReports();
        break;
      case "settings":
        contentHtml = renderSettings();
        break;
      case "landing":
      default:
        contentHtml = `
          ${renderHeroSection()}
          ${renderFactsSection()}
          ${renderMissionCapabilities()}
          ${renderLunarDestinations()}
          ${renderFinalCTA()}
        `;
        break;
    }

    root.innerHTML = `
      ${renderNavbar()}
      <main id="main-content">
        ${contentHtml}
      </main>
      ${renderFooter()}
      ${renderAuthModal()}
    `;

    // Post-render lifecycle setups
    this.postRender();
  }

  postRender() {
    // Teardown previous moon canvases if necessary
    if (this.heroMoon && state.currentView !== "landing") {
      this.heroMoon.destroy();
      this.heroMoon = null;
    }

    if (this.interactiveMoon && state.currentView !== "explorer") {
      this.interactiveMoon.destroy();
      this.interactiveMoon = null;
    }

    // Initialize Hero Landing Page Moon
    if (state.currentView === "landing") {
      const heroCanvas = document.getElementById("hero-moon-canvas");
      if (heroCanvas && !this.heroMoon) {
        if (window.THREE) {
          try {
            this.heroMoon = new ThreeMoon(heroCanvas);
          } catch (err) {
            console.warn("Three.js initialization failed, falling back to Canvas renderer:", err);
            this.heroMoon = new MoonRenderer(heroCanvas);
          }
        } else {
          this.heroMoon = new MoonRenderer(heroCanvas);
        }
      }
    }

    // Initialize 3D Interactive Explorer Moon
    if (state.currentView === "explorer") {
      const expCanvas = document.getElementById("interactive-moon-canvas");
      if (expCanvas) {
        this.interactiveMoon = new Interactive3DMoon(expCanvas, (regionId) => {
          this.updateExplorerSidebar(regionId);
        });
        this.updateExplorerSidebar(state.selectedRegionId);
      }
    }

    // Auto-load route planner if on routes view
    if (state.currentView === "routes") {
      window.calculateRoute();
    }

    // Auto-load hazard analysis
    if (state.currentView === "hazards") {
      window.loadHazardAnalysis("shackleton-crater");
    }

    // Auto-load orbital monitor
    if (state.currentView === "orbital") {
      window.filterOrbitalObjects("All");
    }

    // Auto-load exploration opportunities
    if (state.currentView === "opportunities") {
      window.filterOpportunities("");
    }

    // Auto-load combined risk
    if (state.currentView === "risk") {
      window.evaluateCombinedRisk();
    }

    // Auto-load mission report
    if (state.currentView === "reports") {
      window.generateNewReport();
    }
  }

  updateExplorerSidebar(regionId) {
    const panel = document.getElementById("explorer-telemetry-panel");
    if (!panel) return;

    const region = this.regionsData.find(r => r.id === regionId) || this.regionsData[0] || {
      id: "shackleton-crater",
      name: "Shackleton Crater",
      category: "South Polar Region",
      type: "Impact Crater / Cold Trap",
      lat: -89.9,
      lng: 0.0,
      elevation_m: -4200,
      illumination_pct: 86.5,
      ice_potential: "High (92%)",
      scientific_value: "Critical for Artemis volatiles harvesting and permanent lunar habitat.",
      description: "Located almost exactly at the Lunar South Pole. Its deep interior lies in permanent shadow preserving volatile water ice, while its rim peaks experience near-constant solar illumination.",
      hazards: { slope_max_deg: 32.5, boulder_density: "Moderate", psr_risk: "Extreme in crater basin", overall_hazard_score: 58 }
    };

    const isFav = state.favorites.includes(region.id);

    panel.innerHTML = `
      <div class="space-y-6">
        
        <!-- Region Title Header -->
        <div class="border-b border-white/10 pb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-mono text-sky-400 uppercase tracking-widest">${region.category}</span>
            <button onclick="window.toggleFavorite('${region.id}')" class="text-lg bg-transparent border-0 cursor-pointer text-amber-400 hover:scale-125 transition-transform" title="${isFav ? 'Remove Favorite' : 'Save Favorite'}">
              ${isFav ? '★' : '☆'}
            </button>
          </div>
          <h2 class="font-display font-bold text-2xl text-white">${region.name}</h2>
          <span class="text-xs font-mono text-slate-400">${region.type} • Coordinates: ${region.lat}° Lat, ${region.lng}° Lng</span>
        </div>

        <!-- Description -->
        <p class="text-slate-300 text-xs sm:text-sm leading-relaxed font-light">
          ${region.description}
        </p>

        <!-- Scientific Telemetry Grid -->
        <div class="grid grid-cols-2 gap-3 font-mono text-xs">
          <div class="p-3 rounded-xl bg-slate-900/80 border border-white/5">
            <span class="text-[10px] text-slate-500 block uppercase">ELEVATION</span>
            <span class="font-display font-semibold text-white text-base">${region.elevation_m.toLocaleString()} m</span>
          </div>
          <div class="p-3 rounded-xl bg-slate-900/80 border border-white/5">
            <span class="text-[10px] text-slate-500 block uppercase">SOLAR ILLUMINATION</span>
            <span class="font-display font-semibold text-sky-300 text-base">${region.illumination_pct}% Annual</span>
          </div>
          <div class="p-3 rounded-xl bg-slate-900/80 border border-white/5">
            <span class="text-[10px] text-slate-500 block uppercase">ICE POTENTIAL</span>
            <span class="font-display font-semibold text-emerald-400 text-base">${region.ice_potential || 'High'}</span>
          </div>
          <div class="p-3 rounded-xl bg-slate-900/80 border border-white/5">
            <span class="text-[10px] text-slate-500 block uppercase">HAZARD SCORE</span>
            <span class="font-display font-semibold text-amber-400 text-base">${region.hazards ? region.hazards.overall_hazard_score : 45} / 100</span>
          </div>
        </div>

        <!-- Scientific Value -->
        <div class="p-3.5 rounded-xl bg-sky-950/30 border border-sky-400/20 text-xs text-slate-300">
          <span class="font-mono text-sky-400 block font-bold mb-1">SCIENTIFIC SIGNIFICANCE:</span>
          ${region.scientific_value}
        </div>

      </div>

      <!-- Action Footer -->
      <div class="pt-6 border-t border-white/10 space-y-2 mt-6">
        <button onclick="window.planTraverseTo('${region.id}')" class="btn-primary w-full justify-center text-xs font-mono">
          <span>Plan Rover Traverse to this Site</span>
          <span>→</span>
        </button>
        <button onclick="window.inspectHazardsFor('${region.id}')" class="btn-secondary w-full justify-center text-xs font-mono">
          <span>Detailed Hazard Layer Analysis</span>
        </button>
      </div>
    `;
  }
}

const app = new App();

// Export Global Action Handlers to Window
window.navigateTo = (viewName) => {
  const menu = document.getElementById("mobile-menu");
  if (menu) menu.classList.add("hidden");
  if (viewName === "explorer") {
    window.location.href = "https://selenescape-ilc5.vercel.app/";
    return;
  }
  if (viewName === "hazards") {
    window.location.href = "/terrain/#/analysis/";
    return;
  }
  if (viewName === "routes") {
    window.location.href = "https://lunar-mission-shield-1.vercel.app/";
    return;
  }
  if (viewName === "reports") {
    window.location.href = "https://mission-report-tau.vercel.app/#/report";
    return;
  }
  state.setView(viewName);
};

window.launchExplorerWithRegion = (regionId) => {
  state.selectRegion(regionId);
  window.navigateTo("explorer");
};

window.openLoginModal = (mode = "login") => state.openAuthModal(mode);
window.closeAuthModal = () => state.closeAuthModal();

window.togglePasswordVisibility = (inputId) => {
  const input = document.getElementById(inputId);
  if (input) input.type = input.type === "password" ? "text" : "password";
};

window.fillDemoCommander = () => {
  const email = document.getElementById("auth-email");
  const pwd = document.getElementById("auth-password");
  if (email) email.value = "commander@selenescape.org";
  if (pwd) pwd.value = "Moon2026!";
};

window.handleAuthSubmit = async (e) => {
  e.preventDefault();
  const isRegister = state.authModalMode === "register";
  const email = document.getElementById("auth-email").value.trim();
  const password = document.getElementById("auth-password").value;
  const errorBox = document.getElementById("auth-error");

  try {
    let res;
    if (isRegister) {
      const confirm_password = document.getElementById("auth-confirm-password").value;
      const full_name = document.getElementById("auth-name").value;
      const callsign = document.getElementById("auth-callsign").value;

      if (password !== confirm_password) {
        throw new Error("Passwords do not match.");
      }

      res = await ApiService.request("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, confirm_password, full_name, callsign })
      });
    } else {
      res = await ApiService.request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
    }

    ApiService.setToken(res.token);
    state.setUser(res.user);
    state.closeAuthModal();
    state.addToast(`Authenticated: Welcome ${res.user.full_name} (${res.user.callsign})`, "success");
  } catch (err) {
    if (errorBox) {
      errorBox.textContent = err.message;
      errorBox.classList.remove("hidden");
    }
  }
};

window.logoutUser = async () => {
  try {
    await ApiService.request("/api/auth/logout", { method: "POST" });
  } catch (e) { }
  ApiService.setToken(null);
  state.setUser(null);
  state.addToast("Flight Director session logged out safely.", "info");
};

window.toggleMobileMenu = () => {
  const menu = document.getElementById("mobile-menu");
  if (menu) menu.classList.toggle("hidden");
};

window.toggleFavorite = (regionId) => {
  state.toggleFavorite(regionId);
  if (state.currentView === "explorer") {
    app.updateExplorerSidebar(regionId);
  }
};

window.resetExplorerView = () => app.interactiveMoon && app.interactiveMoon.resetView();
window.toggleExplorerGrid = () => app.interactiveMoon && app.interactiveMoon.toggleGrid();
window.toggleExplorerRotation = () => app.interactiveMoon && app.interactiveMoon.toggleAutoRotate();

window.filterExplorerCategory = (category) => {
  document.querySelectorAll(".glass-pill").forEach(p => p.classList.remove("active-cat", "border-sky-400/40", "bg-sky-500/20"));
  if (event && event.target) {
    event.target.classList.add("active-cat", "border-sky-400/40", "bg-sky-500/20");
  }
  const match = app.regionsData.find(r => category === "All" || r.category.toLowerCase().includes(category.toLowerCase()));
  if (match) {
    state.selectRegion(match.id);
    app.updateExplorerSidebar(match.id);
  }
};

window.planTraverseTo = (regionId) => {
  state.selectRegion(regionId);
  window.navigateTo("routes");
};

window.inspectHazardsFor = (regionId) => {
  state.selectRegion(regionId);
  window.navigateTo("hazards");
};

// Route Calculation Implementation
window.calculateRoute = async () => {
  const container = document.getElementById("route-results-container");
  if (!container) return;

  const originSelect = document.getElementById("route-origin");
  const destSelect = document.getElementById("route-destination");
  const origin_id = originSelect ? originSelect.value : "malapert-massif";
  const destination_id = destSelect ? destSelect.value : "shackleton-crater";

  container.innerHTML = `<div class="glass-panel p-8 text-center text-sky-400 font-mono text-sm animate-pulse">Computing multi-spectral pathfinding across digital elevation grid...</div>`;

  try {
    const data = await ApiService.request("/api/route/plan", {
      method: "POST",
      body: JSON.stringify({ origin_id, destination_id })
    });

    const shortest = data.shortest_route;
    const safer = data.safer_route;

    container.innerHTML = `
      <div class="space-y-8">
        
        <!-- Recommendation Highlight Banner -->
        <div class="glass-panel p-6 border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl font-bold">✓</div>
            <div>
              <span class="text-xs font-mono text-emerald-400 uppercase tracking-widest block">FLIGHT COMPUTER RECOMMENDATION</span>
              <h3 class="font-display font-bold text-xl text-white">${data.recommendation}</h3>
            </div>
          </div>
          <span class="text-xs font-mono text-slate-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-white/10">
            Direct Line: ${data.direct_distance_km} km
          </span>
        </div>

        <!-- Comparative Cards (Shortest vs Safer) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <!-- Route 1: Shortest -->
          <div class="glass-panel p-6 border-amber-500/30 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-4">
                <span class="text-xs font-mono text-amber-400 uppercase font-bold">ROUTE OPTION A • DIRECT</span>
                <span class="badge-amber text-xs px-2 py-0.5 rounded font-mono">RISK: ${shortest.hazard_score}/100</span>
              </div>
              <h3 class="font-display font-bold text-2xl text-white mb-2">${shortest.name}</h3>
              <p class="text-slate-300 text-xs leading-relaxed mb-6">${shortest.risk_profile}</p>

              <div class="grid grid-cols-2 gap-4 font-mono text-xs mb-6">
                <div class="p-3 rounded-lg bg-slate-900 border border-white/5">
                  <span class="text-slate-500 text-[10px] block uppercase">DISTANCE</span>
                  <span class="font-display font-semibold text-lg text-white">${shortest.distance_km} km</span>
                </div>
                <div class="p-3 rounded-lg bg-slate-900 border border-white/5">
                  <span class="text-slate-500 text-[10px] block uppercase">EST. TRAVERSE TIME</span>
                  <span class="font-display font-semibold text-lg text-white">${shortest.estimated_time_hours} hrs</span>
                </div>
                <div class="p-3 rounded-lg bg-slate-900 border border-white/5">
                  <span class="text-slate-500 text-[10px] block uppercase">ENERGY EXPENDITURE</span>
                  <span class="font-display font-semibold text-lg text-amber-300">${shortest.energy_kwh} kWh</span>
                </div>
                <div class="p-3 rounded-lg bg-slate-900 border border-white/5">
                  <span class="text-slate-500 text-[10px] block uppercase">MAX TERRAIN SLOPE</span>
                  <span class="font-display font-semibold text-lg text-rose-400">${shortest.max_slope_deg}° (Steep)</span>
                </div>
              </div>
            </div>

            <div class="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
              ⚠️ Warning: Slope exceeds 20° rollover margin at waypoint #3.
            </div>
          </div>

          <!-- Route 2: Safer -->
          <div class="glass-panel p-6 border-emerald-500/40 shadow-xl shadow-emerald-500/5 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-4">
                <span class="text-xs font-mono text-emerald-400 uppercase font-bold">ROUTE OPTION B • TACTICAL (PREFERRED)</span>
                <span class="badge-green text-xs px-2 py-0.5 rounded font-mono">RISK: ${safer.hazard_score}/100</span>
              </div>
              <h3 class="font-display font-bold text-2xl text-white mb-2">${safer.name}</h3>
              <p class="text-slate-300 text-xs leading-relaxed mb-6">${safer.risk_profile}</p>

              <div class="grid grid-cols-2 gap-4 font-mono text-xs mb-6">
                <div class="p-3 rounded-lg bg-slate-900 border border-white/5">
                  <span class="text-slate-500 text-[10px] block uppercase">DISTANCE</span>
                  <span class="font-display font-semibold text-lg text-white">${safer.distance_km} km</span>
                </div>
                <div class="p-3 rounded-lg bg-slate-900 border border-white/5">
                  <span class="text-slate-500 text-[10px] block uppercase">EST. TRAVERSE TIME</span>
                  <span class="font-display font-semibold text-lg text-white">${safer.estimated_time_hours} hrs</span>
                </div>
                <div class="p-3 rounded-lg bg-slate-900 border border-white/5">
                  <span class="text-slate-500 text-[10px] block uppercase">ENERGY EXPENDITURE</span>
                  <span class="font-display font-semibold text-lg text-emerald-300">${safer.energy_kwh} kWh</span>
                </div>
                <div class="p-3 rounded-lg bg-slate-900 border border-white/5">
                  <span class="text-slate-500 text-[10px] block uppercase">MAX TERRAIN SLOPE</span>
                  <span class="font-display font-semibold text-lg text-emerald-400">${safer.max_slope_deg}° (Safe)</span>
                </div>
              </div>
            </div>

            <div class="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
              ✓ Verified: Constant line-of-sight to Earth & 100% solar array illumination.
            </div>
          </div>

        </div>

        <!-- Waypoint Elevation Profile Table -->
        <div class="glass-panel p-6">
          <h4 class="font-display font-semibold text-lg text-white mb-4">Tactical Ridge Waypoint Elevation Matrix</h4>
          <div class="overflow-x-auto">
            <table class="w-full text-left font-mono text-xs">
              <thead class="border-b border-white/10 text-slate-400">
                <tr>
                  <th class="py-2.5">Waypoint</th>
                  <th class="py-2.5">Elevation</th>
                  <th class="py-2.5">Slope Angle</th>
                  <th class="py-2.5">Condition</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5 text-slate-300">
                ${safer.waypoints.map(w => `
                  <tr>
                    <td class="py-2.5 font-bold text-white">WP-0${w.step}</td>
                    <td class="py-2.5">${w.elevation_m} m</td>
                    <td class="py-2.5 text-sky-400">${w.slope_deg}°</td>
                    <td class="py-2.5"><span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">${w.hazard}</span></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  } catch (e) {
    container.innerHTML = `<div class="glass-panel p-8 text-rose-400 font-mono text-sm">Failed to plan route: ${e.message}</div>`;
  }
};

// Hazard Analysis Implementation
window.loadHazardAnalysis = async (regionId) => {
  const container = document.getElementById("hazard-details-container");
  if (!container) return;

  try {
    const data = await ApiService.request(`/api/hazards/analyze?region_id=${regionId}`);
    const layers = data.layers;

    container.innerHTML = `
      <div class="space-y-8">
        
        <!-- Overall Score Bar -->
        <div class="glass-panel p-6 border-white/15 flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-2xl bg-slate-900 border border-sky-400/40 flex flex-col items-center justify-center font-display font-bold text-2xl ${data.composite_risk_score > 60 ? 'text-rose-400' : 'text-emerald-400'}">
              <span>${data.composite_risk_score}</span>
              <span class="text-[9px] font-mono text-slate-400 -mt-1">/ 100</span>
            </div>
            <div>
              <span class="text-xs font-mono text-slate-400 uppercase tracking-widest block">COMPOSITE TERRAIN RISK</span>
              <h2 class="font-display font-bold text-2xl text-white">${data.region_name}</h2>
              <span class="text-xs font-mono font-semibold ${data.composite_risk_score > 60 ? 'text-rose-400' : 'text-emerald-400'}">${data.safety_grade}</span>
            </div>
          </div>
          <div class="text-right font-mono text-xs text-slate-400">
            <div>Corridor Width: <span class="text-white">${layers.safe_corridors.corridor_width_m} m</span></div>
            <div>Confidence: <span class="text-emerald-400">${layers.safe_corridors.confidence_pct}%</span></div>
          </div>
        </div>

        <!-- 4 Hazard Layers Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <!-- Layer 1: Slopes -->
          <div class="glass-panel p-6">
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-mono text-sky-400 uppercase">LAYER 01: SLOPES</span>
              <span class="badge-${layers.slope_gradient.risk_score > 60 ? 'red' : 'green'} text-[10px] px-2 py-0.5 rounded font-mono">
                ${layers.slope_gradient.status}
              </span>
            </div>
            <h3 class="font-display font-bold text-xl text-white mb-1">Max Slope: ${layers.slope_gradient.max_deg}°</h3>
            <p class="text-slate-400 text-xs leading-relaxed mb-4">${layers.slope_gradient.notes}</p>
            <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div class="bg-rose-400 h-full" style="width: ${layers.slope_gradient.risk_score}%"></div>
            </div>
          </div>

          <!-- Layer 2: Boulders -->
          <div class="glass-panel p-6">
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-mono text-sky-400 uppercase">LAYER 02: BOULDERS</span>
              <span class="badge-${layers.boulder_distribution.risk_score > 60 ? 'amber' : 'blue'} text-[10px] px-2 py-0.5 rounded font-mono">
                ${layers.boulder_distribution.density}
              </span>
            </div>
            <h3 class="font-display font-bold text-xl text-white mb-1">Rock Distribution</h3>
            <p class="text-slate-400 text-xs leading-relaxed mb-4">${layers.boulder_distribution.notes}</p>
            <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div class="bg-amber-400 h-full" style="width: ${layers.boulder_distribution.risk_score}%"></div>
            </div>
          </div>

          <!-- Layer 3: PSR Cold Traps -->
          <div class="glass-panel p-6">
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-mono text-sky-400 uppercase">LAYER 03: SHADOWS</span>
              <span class="badge-red text-[10px] px-2 py-0.5 rounded font-mono">
                ${layers.permanently_shadowed_regions.status}
              </span>
            </div>
            <h3 class="font-display font-bold text-xl text-white mb-1">Cryogenic PSRs</h3>
            <p class="text-slate-400 text-xs leading-relaxed mb-4">${layers.permanently_shadowed_regions.notes}</p>
            <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div class="bg-indigo-400 h-full" style="width: ${layers.permanently_shadowed_regions.risk_score}%"></div>
            </div>
          </div>

        </div>

      </div>
    `;
  } catch (e) {
    container.innerHTML = `<div class="glass-panel p-8 text-rose-400 font-mono text-sm">Failed to load hazard analysis.</div>`;
  }
};

// Orbital Monitor Implementation
window.filterOrbitalObjects = async (filterType) => {
  const container = document.getElementById("orbital-container");
  if (!container) return;

  document.querySelectorAll(".active-orb").forEach(p => p.classList.remove("active-orb", "border-sky-400/40", "bg-sky-500/20"));
  if (event && event.target) {
    event.target.classList.add("active-orb", "border-sky-400/40", "bg-sky-500/20");
  }

  try {
    const data = await ApiService.request("/api/orbital/status");
    let objects = data.objects || [];

    if (filterType === "Active") objects = objects.filter(o => !o.type.includes("Debris"));
    if (filterType === "Debris") objects = objects.filter(o => o.type.includes("Debris"));

    container.innerHTML = `
      <div class="space-y-8">
        
        <!-- Conjunction Alert Top Banner if any -->
        ${data.active_conjunctions && data.active_conjunctions.length > 0 ? `
          <div class="glass-panel p-6 border-rose-500/50 bg-rose-950/20">
            <div class="flex items-center gap-3 mb-2">
              <span class="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
              <span class="font-display font-bold text-lg text-rose-300">ACTIVE CLOSE-APPROACH CONJUNCTION DETECTED</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs pt-2">
              <div>Object: <span class="text-white font-bold">${data.active_conjunctions[0].object_name}</span></div>
              <div>Miss Distance: <span class="text-rose-400 font-bold">${data.active_conjunctions[0].miss_distance_km} km</span></div>
              <div>Collision Probability: <span class="text-amber-400 font-bold">${data.active_conjunctions[0].collision_prob}</span></div>
            </div>
          </div>
        ` : ''}

        <!-- Orbital Traffic Objects Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${objects.map(obj => `
            <div class="glass-panel p-6 flex flex-col justify-between border-white/10 hover:border-sky-400/30 transition-all">
              <div>
                <div class="flex items-center justify-between mb-3">
                  <span class="text-[10px] font-mono text-sky-400 uppercase">${obj.operator || 'OPERATOR'}</span>
                  <span class="badge-${obj.conjunction_risk.includes('Critical') ? 'red' : (obj.conjunction_risk.includes('Elevated') ? 'amber' : 'green')} text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                    ${obj.conjunction_risk}
                  </span>
                </div>
                <h3 class="font-display font-bold text-lg text-white mb-1">${obj.name}</h3>
                <span class="text-xs font-mono text-slate-400 block mb-4">${obj.type}</span>

                <div class="grid grid-cols-2 gap-2 font-mono text-xs mb-4">
                  <div class="p-2 rounded bg-slate-900 border border-white/5">
                    <span class="text-slate-500 text-[9px] block">ALTITUDE</span>
                    <span class="text-white">${obj.altitude_km} km</span>
                  </div>
                  <div class="p-2 rounded bg-slate-900 border border-white/5">
                    <span class="text-slate-500 text-[9px] block">VELOCITY</span>
                    <span class="text-sky-300">${obj.velocity_kms} km/s</span>
                  </div>
                </div>
              </div>

              <div class="pt-3 border-t border-white/10 flex items-center justify-between font-mono text-xs text-slate-400">
                <span>Miss Dist: ${obj.miss_distance_km} km</span>
                <span class="text-sky-400">Tracked ✓</span>
              </div>
            </div>
          `).join("")}
        </div>

      </div>
    `;
  } catch (e) {
    container.innerHTML = `<div class="glass-panel p-8 text-rose-400 font-mono text-sm">Failed to load orbital data.</div>`;
  }
};

// Exploration Opportunities Implementation
window.filterOpportunities = async (query = "") => {
  const container = document.getElementById("opps-container");
  if (!container) return;

  try {
    const data = await ApiService.request(`/api/terrain/regions?search=${encodeURIComponent(query)}`);
    const targets = data.regions || [];

    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${targets.map(t => {
      const isFav = state.favorites.includes(t.id);
      return `
            <div class="glass-panel p-6 flex flex-col justify-between hover:border-sky-400/40 transition-all">
              <div>
                <div class="flex items-center justify-between mb-3">
                  <span class="text-[10px] font-mono text-sky-400 uppercase">${t.category}</span>
                  <button onclick="window.toggleFavorite('${t.id}')" class="text-base bg-transparent border-0 cursor-pointer text-amber-400 hover:scale-125 transition-transform">
                    ${isFav ? '★' : '☆'}
                  </button>
                </div>
                <h3 class="font-display font-bold text-xl text-white mb-2">${t.name}</h3>
                <p class="text-slate-300 text-xs leading-relaxed mb-4 font-light">${t.scientific_value}</p>

                <div class="grid grid-cols-2 gap-2 font-mono text-xs mb-4">
                  <div class="p-2 rounded bg-slate-900">
                    <span class="text-[9px] text-slate-500 block">ILLUMINATION</span>
                    <span class="text-sky-300 font-bold">${t.illumination_pct}%</span>
                  </div>
                  <div class="p-2 rounded bg-slate-900">
                    <span class="text-[9px] text-slate-500 block">ICE POTENTIAL</span>
                    <span class="text-emerald-400 font-bold">${t.ice_potential}</span>
                  </div>
                </div>
              </div>

              <div class="pt-4 border-t border-white/10 flex items-center justify-between">
                <button onclick="window.launchExplorerWithRegion('${t.id}')" class="text-xs font-mono text-sky-400 hover:text-white bg-transparent border-0 cursor-pointer p-0">
                  Inspect in 3D →
                </button>
                <button onclick="window.planTraverseTo('${t.id}')" class="btn-primary btn-sm text-[11px] font-mono">
                  Plan Route
                </button>
              </div>
            </div>
          `;
    }).join("")}
      </div>
    `;
  } catch (e) {
    container.innerHTML = `<div class="glass-panel p-8 text-rose-400 font-mono text-sm">Failed to load opportunities.</div>`;
  }
};

// Combined Risk Assessment Implementation
window.evaluateCombinedRisk = async () => {
  const container = document.getElementById("risk-evaluation-container");
  if (!container) return;

  const reg = document.getElementById("risk-region") ? document.getElementById("risk-region").value : "shackleton-crater";
  const orig = document.getElementById("risk-origin") ? document.getElementById("risk-origin").value : "malapert-massif";

  try {
    const data = await ApiService.request("/api/risk/evaluate", {
      method: "POST",
      body: JSON.stringify({ region_id: reg, origin_id: orig, dest_id: reg })
    });

    container.innerHTML = `
      <div class="space-y-8">
        
        <!-- Flight Director Decision Header Card -->
        <div class="glass-panel p-8 border-sky-400/40 flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="flex items-center gap-5">
            <div class="w-20 h-20 rounded-2xl bg-slate-900 border-2 border-emerald-400 flex flex-col items-center justify-center font-display font-bold text-3xl text-emerald-400 shadow-xl shadow-emerald-500/10">
              <span>${data.overall_mission_safety_score}</span>
              <span class="text-[10px] font-mono text-slate-400 -mt-1">/ 100</span>
            </div>
            <div>
              <span class="text-xs font-mono text-sky-400 uppercase tracking-widest block">FLIGHT DIRECTOR SYNTHESIS</span>
              <h2 class="font-display font-bold text-3xl text-white">${data.primary_action}</h2>
              <span class="badge-green text-xs px-2.5 py-0.5 rounded font-mono font-bold mt-1 inline-block">${data.mission_grade}</span>
            </div>
          </div>
          <button onclick="window.navigateTo('reports')" class="btn-primary text-xs font-mono">
            Generate Flight Dossier →
          </button>
        </div>

        <!-- Multi-Domain Sub-scores -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
          <div class="glass-panel p-5">
            <span class="text-xs text-slate-400 uppercase block mb-1">SURFACE TERRAIN CLEARANCE</span>
            <div class="font-display font-bold text-2xl text-emerald-400 mb-2">${data.sub_scores.terrain_safety}%</div>
            <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div class="bg-emerald-400 h-full" style="width: ${data.sub_scores.terrain_safety}%"></div>
            </div>
          </div>

          <div class="glass-panel p-5">
            <span class="text-xs text-slate-400 uppercase block mb-1">ROVER TRAVERSE VIABILITY</span>
            <div class="font-display font-bold text-2xl text-sky-400 mb-2">${data.sub_scores.route_viability}%</div>
            <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div class="bg-sky-400 h-full" style="width: ${data.sub_scores.route_viability}%"></div>
            </div>
          </div>

          <div class="glass-panel p-5">
            <span class="text-xs text-slate-400 uppercase block mb-1">ORBITAL CORRIDOR CLEARANCE</span>
            <div class="font-display font-bold text-2xl text-indigo-400 mb-2">${data.sub_scores.orbital_clearance}%</div>
            <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div class="bg-indigo-400 h-full" style="width: ${data.sub_scores.orbital_clearance}%"></div>
            </div>
          </div>
        </div>

        <!-- Formal Findings & Rationale List -->
        <div class="glass-panel p-6">
          <h4 class="font-display font-semibold text-lg text-white mb-4">Explainable AI Safety Directives</h4>
          <ul class="space-y-3 font-mono text-xs list-none p-0">
            ${data.recommendations.map(r => `
              <li class="p-3.5 rounded-xl bg-slate-900 border border-white/5 flex items-start gap-3 text-slate-200">
                <span class="text-sky-400 text-sm">▶</span>
                <span>${r}</span>
              </li>
            `).join("")}
          </ul>
        </div>

      </div>
    `;
  } catch (e) {
    container.innerHTML = `<div class="glass-panel p-8 text-rose-400 font-mono text-sm">Failed to evaluate risk.</div>`;
  }
};

// Mission Reports Implementation
window.generateNewReport = async () => {
  const container = document.getElementById("report-document-container");
  if (!container) return;

  const missionNameInput = document.getElementById("report-mission-name");
  const mission_name = missionNameInput ? missionNameInput.value : "Artemis Volatiles Surveyor";
  const region_id = document.getElementById("report-region") ? document.getElementById("report-region").value : "shackleton-crater";
  const origin_id = document.getElementById("report-origin") ? document.getElementById("report-origin").value : "malapert-massif";

  try {
    const data = await ApiService.request("/api/reports/generate", {
      method: "POST",
      body: JSON.stringify({ mission_name, target_region_id: region_id, origin_id, dest_id: region_id })
    });

    container.innerHTML = `
      <div class="glass-panel p-8 sm:p-12 printable-report border-white/20 shadow-2xl">
        
        <!-- Dossier Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-8 mb-8 gap-4">
          <div>
            <div class="text-[11px] font-mono text-sky-400 uppercase tracking-widest mb-1">CISLUNAR MISSION DOSSIER • FORM SLS-2026</div>
            <h2 class="font-display font-bold text-3xl text-white">${data.mission_title}</h2>
            <div class="text-xs font-mono text-slate-400 mt-1">Dossier ID: ${data.report_id} • Generated: ${data.timestamp}</div>
          </div>
          <div class="text-right">
            <span class="badge-green text-sm px-4 py-1.5 rounded-full font-mono font-bold">${data.safety_audit.mission_grade}</span>
            <div class="text-xs font-mono text-slate-400 mt-2">Flight Director: APPROVED</div>
          </div>
        </div>

        <!-- Section 1: Target Location -->
        <div class="mb-8">
          <h3 class="font-display font-bold text-lg text-white mb-3">1. Target Planetary Coordinates</h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
            <div class="p-3 bg-slate-900/80 rounded-lg border border-white/5">
              <span class="text-slate-500 block">REGION NAME</span>
              <span class="text-white font-bold text-sm">${data.target_location.name}</span>
            </div>
            <div class="p-3 bg-slate-900/80 rounded-lg border border-white/5">
              <span class="text-slate-500 block">COORDINATES</span>
              <span class="text-sky-300 font-bold">${data.target_location.coordinates}</span>
            </div>
            <div class="p-3 bg-slate-900/80 rounded-lg border border-white/5">
              <span class="text-slate-500 block">GEOLOGIC CATEGORY</span>
              <span class="text-white font-bold">${data.target_location.category}</span>
            </div>
            <div class="p-3 bg-slate-900/80 rounded-lg border border-white/5">
              <span class="text-slate-500 block">COMPOSITE SAFETY</span>
              <span class="text-emerald-400 font-bold">${data.safety_audit.composite_score} / 100</span>
            </div>
          </div>
        </div>

        <!-- Section 2: Planned Rover Traverse -->
        <div class="mb-8">
          <h3 class="font-display font-bold text-lg text-white mb-3">2. Planned Rover Traverse Profile</h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
            <div class="p-3 bg-slate-900/80 rounded-lg border border-white/5">
              <span class="text-slate-500 block">TRAVERSE DISTANCE</span>
              <span class="text-white font-bold text-sm">${data.rover_route_plan.total_distance_km} km</span>
            </div>
            <div class="p-3 bg-slate-900/80 rounded-lg border border-white/5">
              <span class="text-slate-500 block">EST. TRAVERSE TIME</span>
              <span class="text-white font-bold">${data.rover_route_plan.estimated_traverse_time}</span>
            </div>
            <div class="p-3 bg-slate-900/80 rounded-lg border border-white/5">
              <span class="text-slate-500 block">POWER BUDGET</span>
              <span class="text-sky-300 font-bold">${data.rover_route_plan.power_budget_kwh} kWh</span>
            </div>
            <div class="p-3 bg-slate-900/80 rounded-lg border border-white/5">
              <span class="text-slate-500 block">MAX SLOPE ENCOUNTERED</span>
              <span class="text-emerald-400 font-bold">${data.rover_route_plan.max_slope_encountered}</span>
            </div>
          </div>
        </div>

        <!-- Section 3: Safety Findings & Final Recommendation -->
        <div class="p-6 rounded-xl bg-slate-900/90 border border-white/10 font-mono text-xs">
          <div class="font-display font-bold text-base text-white mb-2">3. Flight Director Directive: ${data.safety_audit.flight_director_decision}</div>
          <ul class="space-y-2 list-none p-0 text-slate-300">
            ${data.safety_audit.formal_findings.map(f => `
              <li class="flex items-start gap-2">
                <span class="text-emerald-400">✓</span>
                <span>${f}</span>
              </li>
            `).join("")}
          </ul>
        </div>

      </div>
    `;
  } catch (e) {
    container.innerHTML = `<div class="glass-panel p-8 text-rose-400 font-mono text-sm">Failed to generate mission dossier.</div>`;
  }
};

window.printReport = () => {
  window.print();
};

// Start application on DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  app.start();
});
