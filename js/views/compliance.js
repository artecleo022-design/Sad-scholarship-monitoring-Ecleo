/**
 * Student Scholarship Monitoring and Academic Compliance System
 * Compliance & Deficiency Management View Controller
 * 
 * Implements:
 * - Requirement 10: Compliance Evaluation Results
 * - Requirement 11: Deficiency Management (Detailed Explanations)
 */

window.ComplianceView = (function() {
  let evaluations = [];

  async function render(container) {
    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h1>Academic Compliance & Deficiency Management</h1>
          <p>Audit trail of evaluated semester grades, institutional rule verifications, and deficiency breakdowns.</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" id="btn-refresh-compliance">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
            Refresh Evaluations
          </button>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="filter-toolbar">
        <div class="filter-group">
          <div class="search-input-wrap">
            <span class="search-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </span>
            <input type="text" id="comp-search-input" placeholder="Search by scholar name or student ID...">
          </div>
          <select class="filter-select" id="comp-filter-result">
            <option value="">All Results</option>
            <option value="Compliant">Compliant Only</option>
            <option value="With Deficiency">With Deficiency Only</option>
          </select>
        </div>
      </div>

      <!-- Compliance Records Table -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Compliance Evaluation Records</span>
        </div>
        <div class="card-body" style="padding: 0;">
          <div class="table-responsive" style="border: none;">
            <table class="app-table">
              <thead>
                <tr>
                  <th>Evaluation ID</th>
                  <th>Scholar Details</th>
                  <th>Scholarship Program</th>
                  <th>Term Evaluated</th>
                  <th>Compliance Result</th>
                  <th>Requirement Checks</th>
                  <th>Evaluated At</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody id="compliance-table-body">
                <tr><td colspan="8" class="table-empty">Loading compliance evaluations...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Deficiency Detail Modal (Requirement 11) -->
      <div class="modal-backdrop" id="modal-deficiency-details">
        <div class="modal-dialog modal-lg">
          <div class="modal-header">
            <h3 class="modal-title">Compliance & Deficiency Analysis Report</h3>
            <button class="modal-close" id="btn-close-comp-modal">&times;</button>
          </div>
          <div class="modal-body" id="comp-modal-content">
            <!-- Dynamic compliance report details -->
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="btn-close-comp-modal-footer">Close</button>
          </div>
        </div>
      </div>
    `;

    setupEvents(container);
    await loadEvaluations(container);
  }

  function setupEvents(container) {
    container.querySelector("#btn-refresh-compliance").addEventListener("click", () => loadEvaluations(container));

    const searchInput = container.querySelector("#comp-search-input");
    const resultSelect = container.querySelector("#comp-filter-result");

    const filterList = () => {
      loadEvaluations(container, {
        search: searchInput.value,
        result: resultSelect.value
      });
    };

    searchInput.addEventListener("input", filterList);
    resultSelect.addEventListener("change", filterList);

    const modal = container.querySelector("#modal-deficiency-details");
    const closeModal = () => modal.classList.remove("show");
    container.querySelector("#btn-close-comp-modal").addEventListener("click", closeModal);
    container.querySelector("#btn-close-comp-modal-footer").addEventListener("click", closeModal);
  }

  async function loadEvaluations(container, filters = {}) {
    const tbody = container.querySelector("#compliance-table-body");
    try {
      evaluations = await window.DataService.getComplianceEvaluations();

      let filtered = [...evaluations];
      if (filters.result) {
        filtered = filtered.filter(e => e.result === filters.result);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        filtered = filtered.filter(e => {
          const name = e.scholar ? e.scholar.full_name.toLowerCase() : "";
          const sid = e.scholar ? e.scholar.student_id.toLowerCase() : "";
          return name.includes(q) || sid.includes(q);
        });
      }

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="table-empty">No compliance evaluation records found.</td></tr>`;
        return;
      }

      tbody.innerHTML = filtered.map(item => {
        const scholar = item.scholar;
        const sub = item.submission;
        const prog = item.scholarship;
        const isCompliant = item.result === "Compliant";

        return `
          <tr>
            <td style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted);">
              ${escapeHtml(item.id.substring(0, 10))}...
            </td>
            <td>
              <div style="font-weight: 600;">${escapeHtml(scholar ? scholar.full_name : 'Unknown')}</div>
              <div style="font-size: 0.75rem; color: var(--primary); font-family: var(--font-mono);">${escapeHtml(scholar ? scholar.student_id : 'N/A')}</div>
            </td>
            <td>
              <div style="font-size: 0.85rem; font-weight: 500;">${escapeHtml(prog ? prog.program_name : 'N/A')}</div>
            </td>
            <td>
              ${sub ? `<div>${escapeHtml(sub.academic_year)}</div><div style="font-size: 0.725rem; color: var(--text-muted);">${escapeHtml(sub.semester)}</div>` : '-'}
            </td>
            <td>
              <span class="badge ${isCompliant ? 'badge-compliant' : 'badge-with-deficiency'}">
                <span class="badge-dot"></span>
                ${escapeHtml(item.result)}
              </span>
            </td>
            <td style="font-size: 0.8rem;">
              <span title="GWA Criterion">${item.gwa_requirement_met ? '🟢 GWA' : '🔴 GWA'}</span> &bull; 
              <span title="Units Load Criterion">${item.units_requirement_met ? '🟢 Units' : '🔴 Units'}</span> &bull; 
              <span title="Failing Grade Policy">${item.failing_grade_requirement_met ? '🟢 No Fail' : '🔴 Failed Subject'}</span>
            </td>
            <td style="font-size: 0.75rem; color: var(--text-muted);">
              ${new Date(item.evaluated_at).toLocaleDateString()}
            </td>
            <td style="text-align: right;">
              <button class="btn btn-secondary btn-sm btn-view-deficiency" data-id="${item.id}">
                Examine Breakdown
              </button>
            </td>
          </tr>
        `;
      }).join("");

      tbody.querySelectorAll(".btn-view-deficiency").forEach(btn => {
        btn.addEventListener("click", () => openDeficiencyModal(container, btn.getAttribute("data-id")));
      });

    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="8" class="table-empty" style="color: var(--danger);">${err.message}</td></tr>`;
    }
  }

  function openDeficiencyModal(container, evalId) {
    const item = evaluations.find(e => e.id === evalId);
    if (!item) return;

    const modal = container.querySelector("#modal-deficiency-details");
    const content = container.querySelector("#comp-modal-content");
    const scholar = item.scholar;
    const sub = item.submission;
    const prog = item.scholarship;
    const isCompliant = item.result === "Compliant";

    // Split deficiencies
    const deficiencies = item.deficiency_details ? item.deficiency_details.split(" • ") : [];

    content.innerHTML = `
      <div class="compliance-banner ${isCompliant ? 'compliant' : 'deficiency'}">
        <span style="font-size: 1.75rem;">${isCompliant ? '✅' : '⚠️'}</span>
        <div>
          <h3 style="font-size: 1.2rem; font-weight: 800; text-transform: uppercase;">
            ${isCompliant ? 'ACADEMIC COMPLIANCE VERIFIED' : 'ACADEMIC DEFICIENCY DETECTED'}
          </h3>
          <div style="font-size: 0.875rem; margin-top: 0.25rem;">
            Scholar: <strong>${escapeHtml(scholar ? scholar.full_name : '')}</strong> (${escapeHtml(scholar ? scholar.student_id : '')})
          </div>
          <div style="font-size: 0.8rem; margin-top: 0.2rem;">
            Scholarship Grant: <strong>${escapeHtml(prog ? prog.program_name : '')}</strong>
          </div>
        </div>
      </div>

      <!-- Side by Side Comparative Analysis -->
      <div class="card" style="margin-bottom: 1.25rem;">
        <div class="card-header">
          <span class="card-title">📊 Evaluated Grade vs Program Requirement Comparison</span>
        </div>
        <div class="card-body" style="padding: 0;">
          <table class="app-table" style="font-size: 0.85rem;">
            <thead>
              <tr>
                <th>Criterion</th>
                <th>Assigned Requirement</th>
                <th>Scholar Performance</th>
                <th>Evaluation Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>GWA / GPA Cutoff</strong></td>
                <td>&le; ${prog ? prog.required_gwa.toFixed(2) : '-'}</td>
                <td style="font-weight: 700; color: var(--primary);">${sub ? parseFloat(sub.gwa).toFixed(2) : '-'}</td>
                <td>
                  ${item.gwa_requirement_met ? 
                    `<span style="color: var(--success); font-weight: 600;">✅ Satisfied</span>` : 
                    `<span style="color: var(--danger); font-weight: 600;">❌ Below Required GWA</span>`}
                </td>
              </tr>
              <tr>
                <td><strong>Minimum Enrolled Units</strong></td>
                <td>&ge; ${prog ? prog.min_units : '-'} units</td>
                <td>${sub ? sub.units_enrolled : '-'} units</td>
                <td>
                  ${item.units_requirement_met ? 
                    `<span style="color: var(--success); font-weight: 600;">✅ Satisfied</span>` : 
                    `<span style="color: var(--danger); font-weight: 600;">❌ Underloaded</span>`}
                </td>
              </tr>
              <tr>
                <td><strong>Failing Grades Policy</strong></td>
                <td>${prog && prog.allow_failing_grade ? 'Allowed (Probation)' : 'Strictly Zero Allowed'}</td>
                <td>${sub ? sub.failed_subjects : 0} Failed Subject(s)</td>
                <td>
                  ${item.failing_grade_requirement_met ? 
                    `<span style="color: var(--success); font-weight: 600;">✅ Satisfied</span>` : 
                    `<span style="color: var(--danger); font-weight: 600;">❌ Policy Violated</span>`}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Clear Deficiency Details Box (Requirement 11) -->
      ${!isCompliant ? `
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: var(--radius-md); padding: 1.25rem;">
          <strong style="color: #991b1b; font-size: 0.95rem; display: block; margin-bottom: 0.5rem;">
            Identified Academic Deficiencies (Action Required):
          </strong>
          <ul class="deficiency-list" style="color: #7f1d1d;">
            ${deficiencies.map(d => `<li><strong>${escapeHtml(d)}</strong></li>`).join("")}
          </ul>
          <div style="margin-top: 0.75rem; font-size: 0.8rem; color: #991b1b;">
            Notice: Scholars with deficiencies are placed on academic probation or flagged for disqualification review prior to the next grant renewal cycle.
          </div>
        </div>
      ` : `
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: var(--radius-md); padding: 1.25rem; color: #166534; font-size: 0.85rem;">
          <strong>No Academic Deficiencies:</strong> This scholar satisfies all statutory retention criteria set forth by the scholarship grantor and institution.
        </div>
      `}
    `;

    modal.classList.add("show");
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
