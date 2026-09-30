/**
 * Student Scholarship Monitoring and Academic Compliance System
 * Scholarship Programs Management View Controller
 * 
 * Implements:
 * - Requirement 7: Scholarship Program Management (unique requirements per program)
 * - BR-02: Every scholarship program must define its academic requirements
 */

window.ScholarshipsView = (function() {
  let programs = [];

  async function render(container) {
    const canManage = window.AuthService.canManagePrograms();

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h1>Scholarship Programs & Academic Criteria</h1>
          <p>Configure distinct retention benchmarks (GWA cutoffs, minimum load, and failing grade tolerance) per grant.</p>
        </div>
        <div class="view-actions">
          ${canManage ? `
            <button class="btn btn-primary" id="btn-create-program">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Scholarship Program
            </button>
          ` : `
            <span class="badge badge-pending-submission">Read-Only View</span>
          `}
        </div>
      </div>

      <!-- Institutional Rule Notice Card (Requirement 7) -->
      <div class="notice-banner">
        <div style="display: flex; gap: 0.85rem; align-items: flex-start;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--primary-600); flex-shrink: 0; margin-top: 2px;"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>
          <div>
            <div style="color: var(--slate-900); font-weight: 700; font-size: 0.875rem;">Configurable Academic Standards per Grant</div>
            <p style="font-size: 0.8125rem; color: var(--slate-600); margin-top: 0.2rem;">
              Each scholarship operates on independent retention standards. The automated compliance engine evaluates each scholar strictly according to their assigned program's requirements.
            </p>
          </div>
        </div>
      </div>

      <!-- Programs Grid / Table -->
      <div class="table-responsive">
        <table class="app-table">
          <thead>
            <tr>
              <th>Program Code</th>
              <th>Program Name</th>
              <th>Required GWA</th>
              <th>Min. Units</th>
              <th>Failing Grade Allowed?</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody id="programs-table-body">
            <tr><td colspan="7" class="table-empty">Loading scholarship programs...</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Create / Edit Program Modal -->
      <div class="modal-backdrop" id="modal-program-form">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3 class="modal-title" id="program-modal-title">Configure Scholarship Program</h3>
            <button class="modal-close" id="btn-close-program-modal">&times;</button>
          </div>
          <form id="form-program">
            <div class="modal-body">
              <input type="hidden" id="program-form-id">

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label required">Program Code</label>
                  <input type="text" id="prog-code" class="form-control" placeholder="e.g. DOST-SEI" required>
                </div>
                <div class="form-group">
                  <label class="form-label required">Status</label>
                  <select id="prog-active" class="form-control">
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label required">Program Full Name</label>
                <input type="text" id="prog-name" class="form-control" placeholder="e.g. Provincial Academic Honors Grant" required>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label required">Required Retention GWA</label>
                  <input type="number" id="prog-gwa" class="form-control" step="0.01" min="1.00" max="5.00" placeholder="e.g. 1.75" required>
                  <div class="form-hint">Scholar must achieve this GWA or better.</div>
                </div>

                <div class="form-group">
                  <label class="form-label required">Minimum Enrolled Units</label>
                  <input type="number" id="prog-units" class="form-control" min="0" max="36" placeholder="e.g. 18" required>
                  <div class="form-hint">Regular semester academic load.</div>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label required">Failing Grade Policy</label>
                <select id="prog-failing" class="form-control">
                  <option value="false">No (Strictly Zero Failing Grades)</option>
                  <option value="true">Yes (Allows 1 Deficiency with Probation)</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Program Description & Notes</label>
                <textarea id="prog-desc" class="form-control" rows="3" placeholder="Eligibility background, sponsoring agency, terms..."></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="btn-cancel-program">Cancel</button>
              <button type="submit" class="btn btn-primary" id="btn-save-program">Save Program</button>
            </div>
          </form>
        </div>
      </div>
    `;

    setupEvents(container);
    await loadPrograms(container);
  }

  function setupEvents(container) {
    const modal = container.querySelector("#modal-program-form");
    const openBtn = container.querySelector("#btn-create-program");
    const closeBtn = container.querySelector("#btn-close-program-modal");
    const cancelBtn = container.querySelector("#btn-cancel-program");
    const form = container.querySelector("#form-program");

    const closeModal = () => modal.classList.remove("show");

    if (openBtn) {
      openBtn.addEventListener("click", () => {
        openProgramForm(container, null);
      });
    }

    closeBtn.addEventListener("click", closeModal);
    cancelBtn.addEventListener("click", closeModal);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await handleFormSubmit(container);
    });
  }

  async function loadPrograms(container) {
    const tbody = container.querySelector("#programs-table-body");
    try {
      programs = await window.DataService.getScholarships();

      tbody.innerHTML = programs.map(p => {
        return `
          <tr>
            <td style="font-weight: 700; font-family: var(--font-mono); color: var(--primary);">
              ${escapeHtml(p.program_code)}
            </td>
            <td>
              <div style="font-weight: 600;">${escapeHtml(p.program_name)}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(p.description || "")}</div>
            </td>
            <td>
              <span style="font-weight: 700; font-size: 0.95rem; color: #1e3a8a;">
                ${p.required_gwa.toFixed(2)} or better
              </span>
            </td>
            <td><strong>${p.min_units}</strong> units</td>
            <td>
              ${p.allow_failing_grade ? 
                `<span class="badge badge-for-verification">Allowed (Conditional)</span>` : 
                `<span class="badge badge-with-deficiency">No (Strict)</span>`
              }
            </td>
            <td>
              ${p.active ? 
                `<span class="badge badge-compliant"><span class="badge-dot"></span> Active</span>` : 
                `<span class="badge badge-pending-submission">Inactive</span>`
              }
            </td>
            <td style="text-align: right;">
              ${window.AuthService.canManagePrograms() ? `
                <button class="btn btn-secondary btn-sm btn-edit-prog" data-id="${p.id}">Edit</button>
              ` : `
                <button class="btn btn-secondary btn-sm btn-edit-prog" data-id="${p.id}">View</button>
              `}
            </td>
          </tr>
        `;
      }).join("");

      tbody.querySelectorAll(".btn-edit-prog").forEach(btn => {
        btn.addEventListener("click", () => {
          const prog = programs.find(item => item.id === btn.getAttribute("data-id"));
          openProgramForm(container, prog);
        });
      });

    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" class="table-empty" style="color: var(--danger);">Failed to load scholarship programs.</td></tr>`;
    }
  }

  function openProgramForm(container, prog = null) {
    const modal = container.querySelector("#modal-program-form");
    const form = container.querySelector("#form-program");
    const title = container.querySelector("#program-modal-title");

    form.reset();

    if (prog) {
      title.textContent = "Edit Scholarship Program";
      container.querySelector("#program-form-id").value = prog.id;
      container.querySelector("#prog-code").value = prog.program_code;
      container.querySelector("#prog-name").value = prog.program_name;
      container.querySelector("#prog-gwa").value = prog.required_gwa;
      container.querySelector("#prog-units").value = prog.min_units;
      container.querySelector("#prog-failing").value = String(prog.allow_failing_grade);
      container.querySelector("#prog-active").value = String(prog.active);
      container.querySelector("#prog-desc").value = prog.description || "";
    } else {
      title.textContent = "Add Scholarship Program";
      container.querySelector("#program-form-id").value = "";
      container.querySelector("#prog-failing").value = "false";
      container.querySelector("#prog-active").value = "true";
    }

    modal.classList.add("show");
  }

  async function handleFormSubmit(container) {
    const id = container.querySelector("#program-form-id").value;
    const payload = {
      program_code: container.querySelector("#prog-code").value.trim(),
      program_name: container.querySelector("#prog-name").value.trim(),
      required_gwa: parseFloat(container.querySelector("#prog-gwa").value),
      min_units: parseInt(container.querySelector("#prog-units").value, 10),
      allow_failing_grade: container.querySelector("#prog-failing").value === "true",
      active: container.querySelector("#prog-active").value === "true",
      description: container.querySelector("#prog-desc").value.trim()
    };

    try {
      if (id) {
        await window.DataService.updateScholarship(id, payload);
        window.App.showToast("Scholarship program updated successfully.", "success");
      } else {
        await window.DataService.createScholarship(payload);
        window.App.showToast("New scholarship program created successfully!", "success");
      }

      container.querySelector("#modal-program-form").classList.remove("show");
      await loadPrograms(container);
    } catch (err) {
      window.App.showToast(err.message, "danger");
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
