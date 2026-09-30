/**
 * Student Scholarship Monitoring and Academic Compliance System
 * Scholarship Renewal Monitoring View Controller
 * 
 * Implements:
 * - Requirement 14: Scholarship Renewal Monitoring & Grant Retention Decision
 */

window.RenewalsView = (function() {
  let renewalList = [];

  async function render(container) {
    const canManage = window.AuthService.canManageScholars();

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h1>Scholarship Renewal & Retention Monitoring</h1>
          <p>Track renewal qualification cohorts, grant extension approvals, probation assignments, and disqualifications.</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" id="btn-refresh-renewals">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
            Refresh Status
          </button>
        </div>
      </div>

      <!-- Renewal Workflow Overview -->
      <div class="stats-grid" style="margin-bottom: 1.5rem;">
        <div class="stat-card variant-renewal">
          <div class="stat-header">
            <span class="stat-label">Pending Renewal</span>
            <span class="stat-icon">⏳</span>
          </div>
          <div class="stat-value" id="kpi-ren-pending">0</div>
          <div class="stat-desc">Compliant scholars eligible for extension</div>
        </div>

        <div class="stat-card variant-compliant">
          <div class="stat-header">
            <span class="stat-label">Successfully Renewed</span>
            <span class="stat-icon">🎓</span>
          </div>
          <div class="stat-value" id="kpi-ren-renewed">0</div>
          <div class="stat-desc">Confirmed for upcoming term</div>
        </div>

        <div class="stat-card variant-deficiency">
          <div class="stat-header">
            <span class="stat-label">Deficient / Disqualified</span>
            <span class="stat-icon">🚫</span>
          </div>
          <div class="stat-value" id="kpi-ren-disqualified">0</div>
          <div class="stat-desc">Under academic sanction</div>
        </div>
      </div>

      <!-- Renewals Table (Requirement 14) -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">📜 Renewal Cohort Directory</span>
        </div>
        <div class="card-body" style="padding: 0;">
          <div class="table-responsive" style="border: none;">
            <table class="app-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Scholar Name</th>
                  <th>Scholarship Program</th>
                  <th>Current Status</th>
                  <th>Latest Compliance Result</th>
                  <th>Renewal Decision</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody id="renewals-table-body">
                <tr><td colspan="7" class="table-empty">Loading renewal roster...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Action Confirmation Modal -->
      <div class="modal-backdrop" id="modal-renewal-decision">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3 class="modal-title">Record Renewal Action</h3>
            <button class="modal-close" id="btn-close-renewal-modal">&times;</button>
          </div>
          <div class="modal-body">
            <input type="hidden" id="ren-scholar-id">
            <p style="font-size: 0.9rem; margin-bottom: 1rem;">
              Scholar: <strong id="ren-modal-scholar-name"></strong> (<span id="ren-modal-student-id"></span>)
            </p>
            <div class="form-group">
              <label class="form-label required">Select Official Renewal Determination</label>
              <select id="ren-decision-select" class="form-control">
                <option value="Renewed">✅ Renew Grant (Scholar satisfied retention criteria)</option>
                <option value="Probationary">⚠️ Place on Academic Probation (Conditional continuance)</option>
                <option value="Disqualified">❌ Disqualify from Scholarship (Terminal deficiency)</option>
              </select>
            </div>
            <div style="font-size: 0.8rem; color: var(--text-muted); background: var(--bg-subtle); padding: 0.75rem; border-radius: var(--radius-sm);">
              This action updates the scholar's active status and writes an indelible entry to the audit log.
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="btn-cancel-renewal-modal">Cancel</button>
            <button type="button" class="btn btn-primary" id="btn-confirm-renewal-action">Confirm Decision</button>
          </div>
        </div>
      </div>
    `;

    setupEvents(container, canManage);
    await loadRenewals(container);
  }

  function setupEvents(container, canManage) {
    container.querySelector("#btn-refresh-renewals").addEventListener("click", () => loadRenewals(container));

    const modal = container.querySelector("#modal-renewal-decision");
    const closeModal = () => modal.classList.remove("show");
    container.querySelector("#btn-close-renewal-modal").addEventListener("click", closeModal);
    container.querySelector("#btn-cancel-renewal-modal").addEventListener("click", closeModal);

    container.querySelector("#btn-confirm-renewal-action").addEventListener("click", async () => {
      const scholarId = container.querySelector("#ren-scholar-id").value;
      const decision = container.querySelector("#ren-decision-select").value;
      const user = window.AuthService.getCurrentUser();

      try {
        await window.DataService.updateRenewalDecision(scholarId, decision, user);
        window.App.showToast(`Scholar status updated to "${decision}" successfully.`, "success");
        closeModal();
        await loadRenewals(container);
      } catch (err) {
        window.App.showToast(err.message, "danger");
      }
    });
  }

  async function loadRenewals(container) {
    const tbody = container.querySelector("#renewals-table-body");
    try {
      renewalList = await window.DataService.getRenewalScholars();

      // Counts
      const forRenewalCount = renewalList.filter(item => item.scholar.status === "For Renewal").length;
      const renewedCount = renewalList.filter(item => item.scholar.status === "Renewed").length;
      const disqCount = renewalList.filter(item => item.scholar.status === "Disqualified" || item.scholar.status === "With Deficiency").length;

      container.querySelector("#kpi-ren-pending").textContent = forRenewalCount;
      container.querySelector("#kpi-ren-renewed").textContent = renewedCount;
      container.querySelector("#kpi-ren-disqualified").textContent = disqCount;

      if (renewalList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="table-empty">No scholars currently under renewal cycle review.</td></tr>`;
        return;
      }

      tbody.innerHTML = renewalList.map(item => {
        const s = item.scholar;
        const prog = item.scholarship;
        const ev = item.latestEvaluation;
        const statusBadge = getStatusBadge(s.status);

        return `
          <tr>
            <td style="font-family: var(--font-mono); font-weight: 700; color: var(--primary);">
              ${escapeHtml(s.student_id)}
            </td>
            <td>
              <div style="font-weight: 600;">${escapeHtml(s.full_name)}</div>
              <div style="font-size: 0.725rem; color: var(--text-muted);">${escapeHtml(s.degree_program)} (Yr ${s.year_level})</div>
            </td>
            <td>
              <div style="font-weight: 500;">${escapeHtml(prog ? prog.program_name : 'N/A')}</div>
            </td>
            <td>${statusBadge}</td>
            <td>
              ${ev ? `
                <span class="badge ${ev.result === 'Compliant' ? 'badge-compliant' : 'badge-with-deficiency'}">
                  ${ev.result}
                </span>
                <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">
                  ${new Date(ev.evaluated_at).toLocaleDateString()}
                </div>
              ` : '<span style="color: var(--text-light); font-size: 0.8rem;">No Eval Yet</span>'}
            </td>
            <td>
              <strong>${escapeHtml(s.status)}</strong>
            </td>
            <td style="text-align: right;">
              ${window.AuthService.canManageScholars() ? `
                <button class="btn btn-secondary btn-sm btn-open-decision" data-id="${s.id}" data-name="${escapeHtml(s.full_name)}" data-sid="${escapeHtml(s.student_id)}">
                  Update Grant
                </button>
              ` : `
                <span style="font-size: 0.75rem; color: var(--text-muted);">View Only</span>
              `}
            </td>
          </tr>
        `;
      }).join("");

      tbody.querySelectorAll(".btn-open-decision").forEach(btn => {
        btn.addEventListener("click", () => {
          const scholarId = btn.getAttribute("data-id");
          const scholarName = btn.getAttribute("data-name");
          const sid = btn.getAttribute("data-sid");

          const modal = container.querySelector("#modal-renewal-decision");
          container.querySelector("#ren-scholar-id").value = scholarId;
          container.querySelector("#ren-modal-scholar-name").textContent = scholarName;
          container.querySelector("#ren-modal-student-id").textContent = sid;

          modal.classList.add("show");
        });
      });

    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" class="table-empty" style="color: var(--danger);">${err.message}</td></tr>`;
    }
  }

  function getStatusBadge(status) {
    let cls = "badge-active";
    if (status === "For Renewal") cls = "badge-for-renewal";
    else if (status === "Renewed") cls = "badge-renewed";
    else if (status === "Disqualified") cls = "badge-disqualified";
    else if (status === "With Deficiency") cls = "badge-with-deficiency";
    else if (status === "Probationary") cls = "badge-probationary";
    else if (status === "Compliant") cls = "badge-compliant";

    return `<span class="badge ${cls}"><span class="badge-dot"></span> ${escapeHtml(status)}</span>`;
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
