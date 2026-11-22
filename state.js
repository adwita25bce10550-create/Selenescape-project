/**
 * SELENESCAPE - Reactive Application State Management
 */

class AppState {
  constructor() {
    this.currentView = "landing"; // 'landing', 'dashboard', 'explorer', 'routes', 'hazards', 'orbital', 'opportunities', 'risk', 'reports'
    this.currentUser = JSON.parse(localStorage.getItem("selenescape_user") || "null");
    this.isAuthModalOpen = false;
    this.authModalMode = "login"; // 'login' | 'register'
    this.selectedRegionId = "shackleton-crater";
    this.favorites = JSON.parse(localStorage.getItem("selenescape_favorites") || "[\"shackleton-crater\", \"malapert-massif\"]");
    this.toasts = [];
    this.subscribers = new Set();
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify() {
    for (const callback of this.subscribers) {
      try {
        callback(this);
      } catch (err) {
        console.error("State subscriber error:", err);
      }
    }
  }

  setView(viewName) {
    if (this.currentView !== viewName) {
      this.currentView = viewName;
      window.scrollTo({ top: 0, behavior: "smooth" });
      this.notify();
    }
  }

  setUser(user) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem("selenescape_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("selenescape_user");
      localStorage.removeItem("selenescape_token");
    }
    this.notify();
  }

  openAuthModal(mode = "login") {
    this.authModalMode = mode;
    this.isAuthModalOpen = true;
    this.notify();
  }

  closeAuthModal() {
    this.isAuthModalOpen = false;
    this.notify();
  }

  selectRegion(regionId) {
    this.selectedRegionId = regionId;
    this.notify();
  }

  toggleFavorite(regionId) {
    if (this.favorites.includes(regionId)) {
      this.favorites = this.favorites.filter(id => id !== regionId);
      this.addToast("Removed from Exploration Favorites", "info");
    } else {
      this.favorites.push(regionId);
      this.addToast("Saved to Exploration Favorites ⭐", "success");
    }
    localStorage.setItem("selenescape_favorites", JSON.stringify(this.favorites));
    this.notify();
  }

  addToast(message, type = "info", duration = 4000) {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    const toast = { id, message, type };
    this.toasts.push(toast);
    this.renderToasts();

    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id);
      this.renderToasts();
    }, duration);
  }

  renderToasts() {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      document.body.appendChild(container);
    }

    container.innerHTML = this.toasts.map(t => {
      let icon = "🛰️";
      let borderColor = "rgba(56, 189, 248, 0.4)";
      if (t.type === "success") { icon = "✅"; borderColor = "rgba(16, 185, 129, 0.4)"; }
      if (t.type === "error") { icon = "⚠️"; borderColor = "rgba(244, 63, 94, 0.5)"; }
      
      return `
        <div class="toast" style="border-left: 4px solid ${borderColor}">
          <span style="font-size: 1.2rem;">${icon}</span>
          <div style="flex: 1;">
            <p style="font-size: 0.88rem; color: #f8fafc; font-weight: 500;">${t.message}</p>
          </div>
        </div>
      `;
    }).join("");
  }
}

export const state = new AppState();
