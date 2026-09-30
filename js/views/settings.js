/**
 * Student Scholarship Monitoring and Academic Compliance System
 * System Configuration & Settings View Controller
 * 
 * Implements:
 * - Requirement 10: Configurable institutional grading scale
 * - Requirement 1: Supabase backend credentials connection
 * - System test utilities (data reset, JSON export)
 */

window.SettingsView = (function() {
  async function render(container) {
    const currentUrl = localStorage.getItem(window.APP_CONFIG.STORAGE_KEYS.SUPABASE_URL) || 
                       (window.APP_CONFIG.SUPABASE_CONFIG && window.APP_CONFIG.SUPABASE_CONFIG.URL) || "";
    const currentKey = localStorage.getItem(window.APP_CONFIG.STORAGE_KEYS.SUPABASE_KEY) || 
                       (window.APP_CONFIG.SUPABASE_CONFIG && window.APP_CONFIG.SUPABASE_CONFIG.ANON_KEY) || "";
    const currentScale = localStorage.getItem(window.APP_CONFIG.STORAGE_KEYS.GRADING_SCALE) || window.APP_CONFIG.DEFAULT_GRADING_SCALE;
    const isLive = window.DataService.isUsingLiveSupabase();

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h1>System Configuration & Database Settings</h1>
          <p>Configure Supabase cloud connection credentials, institutional grading system policies, and database resets.</p>
        </div>
      </div>

      <!-- Institutional Grading Scale Configuration (Requirement 10) -->
      <div class="card" style="margin-bottom: 1.5rem;">
        <div class="card-header">
          <span class="card-title">⚖️ Institutional Grading System Policy</span>
        </div>
        <div class="card-body">
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem;">
            Academic institutions use different grading conventions. Configure the evaluation rule direction used by the Compliance Engine when evaluating student General Weighted Average (GWA).
          </p>

          <form id="form-grading-scale">
            <div class="form-group">
              <label class="form-label required">Select Institutional Grading Scale</label>
              <select id="setting-grading-scale" class="form-control" style="font-weight: 600;">
                <option value="PH_1_TO_5" ${currentScale === 'PH_1_TO_5' ? 'selected' : ''}>
                  Philippine Scale: 1.00 (Highest) to 5.00 (Failing) - Lower GWA is Better (Requirement Met when GWA &le; Required GWA)
                </option>
                <option value="US_4_SCALE" ${currentScale === 'US_4_SCALE' ? 'selected' : ''}>
                  US 4.00 Scale: 4.00 (Highest) to 0.00 (Failing) - Higher GPA is Better (Requirement Met when GPA &ge; Required GPA)
                </option>
              </select>
            </div>

            <div id="grading-scale-info-box" style="background: var(--bg-subtle); padding: 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); font-size: 0.825rem; margin-bottom: 1rem;">
              <!-- Dynamic description -->
            </div>

            <button type="submit" class="btn btn-primary btn-sm">Save Grading Policy</button>
          </form>
        </div>
      </div>

      <!-- Supabase Cloud Connection Settings (Requirement 1 & 16) -->
      <div class="card" style="margin-bottom: 1.5rem;">
        <div class="card-header">
          <span class="card-title">⚡ Supabase Database & Authentication Connection</span>
          <span class="db-status-pill ${isLive ? 'connected' : 'offline'}">
            <span class="status-dot"></span>
            ${isLive ? 'Connected to Live Cloud Database' : 'Running in Offline Sandbox Mode'}
          </span>
        </div>
        <div class="card-body">
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem;">
            Enter your project's <strong>Project URL</strong> and <strong>Public Anon Key</strong> from the Supabase dashboard. You can execute the full SQL script from <code>supabase/schema.sql</code> in the Supabase SQL Editor.
          </p>

          <form id="form-supabase-config">
            <div class="form-group">
              <label class="form-label">Supabase Project URL</label>
              <input type="url" id="setting-supabase-url" class="form-control" placeholder="https://your-project-id.supabase.co" value="${escapeHtml(currentUrl)}">
              <div class="form-hint">Found under Supabase Dashboard &gt; Project Settings &gt; API.</div>
            </div>

            <div class="form-group">
              <label class="form-label">Supabase Public Anon Key</label>
              <input type="password" id="setting-supabase-key" class="form-control" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." value="${escapeHtml(currentKey)}">
              <div class="form-hint">Client-safe public anonymous key (never paste your service-role key).</div>
            </div>

            <div style="display: flex; gap: 0.75rem;">
              <button type="submit" class="btn btn-primary btn-sm">Save & Connect to Supabase</button>
              <button type="button" class="btn btn-secondary btn-sm" id="btn-disconnect-supabase">Use Local Sandbox</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Demonstration Data Controls (Requirement 21 & 22) -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">🔄 Demonstration Data Management & Backup</span>
        </div>
        <div class="card-body">
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem;">
            Reset sample scholars, scholarship programs, and grade submissions to run a fresh, clean evaluation demonstration.
          </p>

          <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
            <button class="btn btn-warning btn-sm" id="btn-reset-sample-data">
              <span>⚠️</span> Reset to Default Demonstration Data
            </button>
            <button class="btn btn-secondary btn-sm" id="btn-export-json">
              <span>📥</span> Export Database as JSON
            </button>
          </div>
        </div>
      </div>
    `;

    setupEvents(container);
    updateGradingInfo(container);
  }

  function setupEvents(container) {
    const scaleSelect = container.querySelector("#setting-grading-scale");
    scaleSelect.addEventListener("change", () => updateGradingInfo(container));

    container.querySelector("#form-grading-scale").addEventListener("submit", (e) => {
      e.preventDefault();
      const val = scaleSelect.value;
      localStorage.setItem(window.APP_CONFIG.STORAGE_KEYS.GRADING_SCALE, val);
      window.App.showToast("Institutional grading policy updated successfully.", "success");
    });

    container.querySelector("#form-supabase-config").addEventListener("submit", async (e) => {
      e.preventDefault();
      let url = container.querySelector("#setting-supabase-url").value.trim();
      const key = container.querySelector("#setting-supabase-key").value.trim();

      // Clean URL: Strip /rest/v1 or trailing slashes so JS SDK connects to project base
      if (url) {
        url = url.replace(/\/+$/, "").replace(/\/rest\/v1\/?$/i, "");
      }

      if (url && key) {
        localStorage.setItem(window.APP_CONFIG.STORAGE_KEYS.SUPABASE_URL, url);
        localStorage.setItem(window.APP_CONFIG.STORAGE_KEYS.SUPABASE_KEY, key);
        window.App.showToast("Supabase credentials saved! Initializing connection...", "info");
        await window.DataService.init();
        setTimeout(() => window.location.reload(), 800);
      } else {
        window.App.showToast("Please provide both Supabase URL and Anon Key.", "warning");
      }
    });

    container.querySelector("#btn-disconnect-supabase").addEventListener("click", () => {
      localStorage.removeItem(window.APP_CONFIG.STORAGE_KEYS.SUPABASE_URL);
      localStorage.removeItem(window.APP_CONFIG.STORAGE_KEYS.SUPABASE_KEY);
      window.App.showToast("Reverted to Local Sandbox mode.", "info");
      setTimeout(() => window.location.reload(), 600);
    });

    container.querySelector("#btn-reset-sample-data").addEventListener("click", () => {
      if (confirm("Reset local database to initial demonstration dataset? All custom test records will be restored to default.")) {
        window.DataService.resetSampleData();
        window.App.showToast("Demonstration dataset reset to initial state!", "success");
        setTimeout(() => window.location.reload(), 600);
      }
    });

    container.querySelector("#btn-export-json").addEventListener("click", () => {
      const jsonStr = window.DataService.exportDatabaseJson();
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `scholarship_compliance_backup_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  function updateGradingInfo(container) {
    const val = container.querySelector("#setting-grading-scale").value;
    const info = window.APP_CONFIG.GRADING_SCALES[val];
    const box = container.querySelector("#grading-scale-info-box");
    if (box && info) {
      box.innerHTML = `
        <strong>Active Rule Description:</strong> ${escapeHtml(info.description)}<br>
        <span style="color: var(--text-muted);">Range: ${info.minGwa.toFixed(2)} to ${info.maxGwa.toFixed(2)} | Passing Cutoff: ${info.passingGwa.toFixed(2)}</span>
      `;
    }
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
    render: render
  };
})();
