/**
 * Student Scholarship Monitoring and Academic Compliance System
 * Main Application Coordinator, Router & Authentication Guard
 * 
 * Implements:
 * - Requirement 3 & 4: Role-Based Access Control & Navigation Guards
 * - Dedicated User Portals for Admin, Scholarship Staff, and Scholar
 * - Protected Page Enforcement
 */

window.App = (function() {
  let currentViewName = "dashboard";

  // Role Navigation Mapping (Requirement 3)
  const ROLE_ALLOWED_VIEWS = {
    admin: [
      "dashboard",
      "scholars",
      "scholarships",
      "submissions",
      "verification",
      "compliance",
      "renewals",
      "reports",
      "settings"
    ],
    staff: [
      "dashboard",
      "scholars",
      "scholarships",
      "submissions",
      "verification",
      "compliance",
      "renewals",
      "reports"
    ],
    scholar: [
      "dashboard",
      "submissions",
      "compliance",
      "renewals"
    ]
  };

  async function init() {
    console.log("Initializing Student Scholarship Monitoring and Academic Compliance System...");

    // Initialize Services
    window.AuthService.init();
    await window.DataService.init();

    setupLoginPortal();
    setupGlobalNavigation();
    setupMobileSidebar();
    setupSignOutButtons();
    setupAuthListeners();

    // Check Authentication Guard (Requirement 4: Login First)
    if (!window.AuthService.isAuthenticated()) {
      showLoginScreen();
    } else {
      const user = window.AuthService.getCurrentUser();
      showAppShell();
      updateUserUI(user);
      navigate("dashboard");
    }
  }

  function showLoginScreen() {
    const loginScreen = document.querySelector("#login-screen");
    const appShell = document.querySelector("#app");

    if (loginScreen) loginScreen.classList.remove("hidden");
    if (appShell) appShell.style.display = "none";
  }

  function showAppShell() {
    const loginScreen = document.querySelector("#login-screen");
    const appShell = document.querySelector("#app");

    if (loginScreen) loginScreen.classList.add("hidden");
    if (appShell) appShell.style.display = "flex";
  }

  function setupLoginPortal() {
    // 1-Click Demonstration Login Buttons
    document.querySelectorAll(".demo-account-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const role = btn.getAttribute("data-demo-role");
        try {
          const user = await window.AuthService.loginWithDemo(role);
          showAppShell();
          updateUserUI(user);
          navigate("dashboard");
          showToast(`Logged in successfully as ${user.role.toUpperCase()}: ${user.full_name}!`, "success");
        } catch (err) {
          showToast(err.message, "danger");
        }
      });
    });

    // Custom Login Form
    const loginForm = document.querySelector("#login-form-main");
    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.querySelector("#login-input-email").value;
        const password = document.querySelector("#login-input-password").value;
        const submitBtn = document.querySelector("#btn-login-submit");

        submitBtn.disabled = true;
        submitBtn.textContent = "Authenticating...";

        try {
          const user = await window.AuthService.login(email, password);
          showAppShell();
          updateUserUI(user);
          navigate("dashboard");
          showToast(`Successfully authenticated as ${user.full_name}!`, "success");
        } catch (err) {
          showToast(err.message, "danger");
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = "Sign In to System";
        }
      });
    }
  }

  function setupSignOutButtons() {
    const handleSignOut = () => {
      window.AuthService.logout();
      showLoginScreen();
      showToast("You have been signed out.", "info");
    };

    const headerSignOut = document.querySelector("#btn-header-signout");
    const sidebarSignOut = document.querySelector("#btn-sidebar-signout");

    if (headerSignOut) headerSignOut.addEventListener("click", handleSignOut);
    if (sidebarSignOut) sidebarSignOut.addEventListener("click", handleSignOut);
  }

  function setupGlobalNavigation() {
    document.querySelectorAll(".nav-item").forEach(item => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const view = item.getAttribute("data-view");
        if (view) {
          navigate(view);
          document.querySelector(".app-sidebar").classList.remove("open");
          document.querySelector(".sidebar-overlay").classList.remove("active");
        }
      });
    });

    window.addEventListener("hashchange", () => {
      const hashView = window.location.hash.replace("#", "");
      if (hashView && hashView !== currentViewName) {
        navigate(hashView);
      }
    });

    const dbPill = document.querySelector("#header-db-status");
    if (dbPill) {
      dbPill.addEventListener("click", () => {
        const user = window.AuthService.getCurrentUser();
        if (user && user.role === "admin") {
          navigate("settings");
        } else {
          showToast("Database configuration is restricted to System Administrators.", "info");
        }
      });
    }
  }

  function setupMobileSidebar() {
    const toggleBtn = document.querySelector("#btn-mobile-sidebar-toggle");
    const sidebar = document.querySelector(".app-sidebar");
    const overlay = document.querySelector(".sidebar-overlay");

    if (toggleBtn && sidebar && overlay) {
      toggleBtn.addEventListener("click", () => {
        sidebar.classList.toggle("open");
        overlay.classList.toggle("active");
      });

      overlay.addEventListener("click", () => {
        sidebar.classList.remove("open");
        overlay.classList.remove("active");
      });
    }
  }

  function setupAuthListeners() {
    window.addEventListener("auth:changed", (e) => {
      const user = e.detail;
      if (!user) {
        showLoginScreen();
      } else {
        showAppShell();
        updateUserUI(user);
        navigate("dashboard");
      }
    });
  }

  /**
   * Filter Sidebar Navigation & Update Header according to Role (Requirement 3 & 4)
   */
  function updateUserUI(user) {
    if (!user) return;

    // 1. Sidebar User Snippet
    const nameElem = document.querySelector("#sidebar-user-name");
    const roleBadge = document.querySelector("#sidebar-user-role");
    const avatarElem = document.querySelector("#sidebar-user-avatar");

    if (nameElem) nameElem.textContent = user.full_name;
    if (avatarElem) avatarElem.textContent = user.full_name.charAt(0);
    if (roleBadge) {
      roleBadge.textContent = user.role.toUpperCase();
      roleBadge.className = `user-role-badge ${user.role}`;
    }

    // 2. Header Role Indicator Pill
    const portalPill = document.querySelector("#header-portal-pill");
    if (portalPill) {
      let icon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
      let text = "Administrator Portal";
      if (user.role === "staff") {
        icon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>`;
        text = "Staff Evaluator Desk";
      }
      if (user.role === "scholar") {
        icon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`;
        text = "Scholar Academic Portal";
      }
      portalPill.innerHTML = `<span>${icon}</span> <span>${text}</span>`;
      portalPill.className = `role-switcher-banner ${user.role}`;
    }

    // 3. Strict Sidebar Navigation Filtering (Requirement 3: Role-based navigation)
    const allowedViews = ROLE_ALLOWED_VIEWS[user.role] || ROLE_ALLOWED_VIEWS.scholar;

    document.querySelectorAll(".nav-item").forEach(item => {
      const view = item.getAttribute("data-view");
      if (allowedViews.includes(view)) {
        item.style.display = "flex";
      } else {
        item.style.display = "none"; // Hide completely from unauthorized roles
      }
    });

    // Hide or show nav section headings based on role
    const evalSection = document.querySelector("#nav-section-evaluation");
    const govSection = document.querySelector("#nav-section-governance");
    const opsSection = document.querySelector("#nav-section-operations");

    if (user.role === "scholar") {
      if (opsSection) opsSection.textContent = "My Academic Standing";
      if (evalSection) evalSection.textContent = "My Grade Submissions";
      if (govSection) govSection.style.display = "none";
    } else if (user.role === "staff") {
      if (opsSection) opsSection.textContent = "Core Operations";
      if (evalSection) evalSection.textContent = "Academic Evaluation Desk";
      if (govSection) govSection.style.display = "block";
    } else {
      if (opsSection) opsSection.textContent = "Core Operations";
      if (evalSection) evalSection.textContent = "Academic Evaluation";
      if (govSection) govSection.style.display = "block";
    }

    // 4. Update Database connection status pill
    const dbPill = document.querySelector("#header-db-status");
    if (dbPill) {
      const isLive = window.DataService.isUsingLiveSupabase();
      dbPill.className = `db-status-pill ${isLive ? 'connected' : 'offline'}`;
      dbPill.querySelector("span:last-child").textContent = isLive ? "Supabase Live" : "Sandbox Mode";
    }
  }

  /**
   * Protected Route Navigation with Role Guarding
   */
  async function navigate(viewName, params = {}) {
    // 1. Session check
    if (!window.AuthService.isAuthenticated()) {
      showLoginScreen();
      return;
    }

    const user = window.AuthService.getCurrentUser();
    const allowedViews = ROLE_ALLOWED_VIEWS[user.role] || ROLE_ALLOWED_VIEWS.scholar;

    // 2. Role-based Route Guarding (Requirement 3 & 4)
    if (!allowedViews.includes(viewName)) {
      showToast(`Access Restricted: Your account (${user.role.toUpperCase()}) is not authorized to access ${capitalizeFirstLetter(viewName)}.`, "warning");
      viewName = "dashboard";
    }

    currentViewName = viewName;
    window.location.hash = viewName;

    // Update Active Nav Item in Sidebar
    document.querySelectorAll(".nav-item").forEach(item => {
      if (item.getAttribute("data-view") === viewName) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    const breadcrumb = document.querySelector("#header-breadcrumb-active");
    if (breadcrumb) {
      breadcrumb.textContent = capitalizeFirstLetter(viewName);
    }

    const mainContainer = document.querySelector("#main-view-container");
    if (!mainContainer) return;

    mainContainer.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; min-height: 48vh; color: var(--text-muted);">
        <div style="text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px;">
          <svg style="animation: spin 1s linear infinite; width: 32px; height: 32px; color: var(--primary);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
          </svg>
          <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
          <div style="font-size: 0.875rem; font-weight: 500; color: var(--slate-600);">Loading ${capitalizeFirstLetter(viewName)} module...</div>
        </div>
      </div>
    `;

    try {
      switch (viewName) {
        case "dashboard":
          await window.DashboardView.render(mainContainer, params);
          break;
        case "scholars":
          await window.ScholarsView.render(mainContainer, params);
          break;
        case "scholarships":
          await window.ScholarshipsView.render(mainContainer, params);
          break;
        case "submissions":
          await window.SubmissionsView.render(mainContainer, params);
          break;
        case "verification":
          await window.VerificationView.render(mainContainer, params);
          break;
        case "compliance":
          await window.ComplianceView.render(mainContainer, params);
          break;
        case "renewals":
          await window.RenewalsView.render(mainContainer, params);
          break;
        case "reports":
          await window.ReportsView.render(mainContainer, params);
          break;
        case "settings":
          await window.SettingsView.render(mainContainer, params);
          break;
        default:
          await window.DashboardView.render(mainContainer, params);
      }
    } catch (err) {
      console.error(`Error rendering view ${viewName}:`, err);
      mainContainer.innerHTML = `
        <div class="card" style="border-left: 4px solid var(--danger); margin: 2rem;">
          <div class="card-body">
            <h3 style="color: var(--danger); font-size: 1.1rem;">Failed to load view</h3>
            <p style="color: var(--text-muted); font-size: 0.875rem; margin-top: 0.5rem;">${err.message}</p>
            <button class="btn btn-secondary btn-sm" style="margin-top: 1rem;" onclick="window.App.navigate('dashboard')">
              Return to Dashboard
            </button>
          </div>
        </div>
      `;
    }
  }

  function showToast(message, type = "info", duration = 4000) {
    const container = document.querySelector("#toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary);"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>`;
    if (type === "success") {
      icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--success);"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    }
    if (type === "warning") {
      icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--warning);"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>`;
    }
    if (type === "danger") {
      icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--danger);"><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></svg>`;
    }

    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
        <span style="display: flex; align-items: center; flex-shrink: 0;">${icon}</span>
        <div class="toast-message">${escapeHtml(message)}</div>
      </div>
      <button class="toast-close">&times;</button>
    `;

    toast.querySelector(".toast-close").addEventListener("click", () => {
      toast.remove();
    });

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  return {
    init: init,
    navigate: navigate,
    showToast: showToast
  };
})();

// Start application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.App.init();
});
