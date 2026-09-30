/**
 * Student Scholarship Monitoring and Academic Compliance System
 * Compliance & Audit Reports View Controller
 * 
 * Implements:
 * - Requirement 20: Compliance Report Generation & Filtered Summaries
 */

window.ReportsView = (function() {
  let programs = [];

  async function render(container) {
    programs = await window.DataService.getScholarships();

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h1>Academic Compliance & Evaluation Report</h1>
          <p>Official institutional compliance summaries, cohort breakdown, and accreditation documentation.</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" id="btn-print-report">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
            Print / Export PDF
          </button>
        </div>
      </div>

      <!-- Report Filter Toolbar (Requirement 20) -->
      <div class="filter-toolbar no-print">
        <div class="filter-group">
          <select class="filter-select" id="rep-filter-program">
            <option value="">All Scholarship Programs</option>
            ${programs.map(p => `<option value="${p.id}">${p.program_code} - ${p.program_name}</option>`).join("")}
          </select>

          <select class="filter-select" id="rep-filter-status">
            <option value="">All Statuses</option>
            ${window.APP_CONFIG.SCHOLAR_STATUSES.map(st => `<option value="${st}">${st}</option>`).join("")}
          </select>

          <select class="filter-select" id="rep-filter-ay">
            <option value="">All Academic Years</option>
            ${window.APP_CONFIG.ACADEMIC_YEARS.map(ay => `<option value="${ay}">${ay}</option>`).join("")}
          </select>

          <select class="filter-select" id="rep-filter-sem">
            <option value="">All Semesters</option>
            ${window.APP_CONFIG.SEMESTERS.map(sem => `<option value="${sem}">${sem}</option>`).join("")}
          </select>
        </div>
        <div>
          <button class="btn btn-primary btn-sm" id="btn-apply-report-filters">Generate Filtered Report</button>
        </div>
      </div>

      <!-- Printable Report Document Shell -->
      <div class="card printable-report-card" id="printable-report-area">
        <div class="card-body" style="padding: 2rem;">
          <!-- Institutional Header -->
          <div style="display: flex; align-items: center; justify-content: center; gap: 1.5rem; border-bottom: 2px solid var(--primary); padding-bottom: 1.25rem; margin-bottom: 1.5rem;">
            <img src="assets/asscat-logo.jpg" alt="ASSCAT" style="width: 70px; height: 70px; object-fit: cover; border-radius: var(--radius-full);">
            <div style="text-align: center;">
              <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em;">Republic of the Philippines</div>
              <h2 style="font-size: 1.25rem; color: var(--primary); text-transform: uppercase; letter-spacing: 0.03em; margin: 0.15rem 0;">
                ${window.APP_CONFIG.INSTITUTION_NAME}
              </h2>
              <div style="font-size: 0.85rem; font-weight: 700; color: var(--secondary); text-transform: uppercase;">
                ${window.APP_CONFIG.COLLEGE_NAME} &bull; ${window.APP_CONFIG.CAMPUS_LOCATION}
              </div>
              <h3 style="font-size: 0.95rem; font-weight: 600; color: var(--text-main); margin-top: 0.25rem;">
                Student Scholarship Academic Compliance & Monitoring Report
              </h3>
              <div style="font-size: 0.725rem; color: var(--text-light); margin-top: 0.25rem;">
                Generated on: <span id="report-timestamp"></span> &bull; Academic Year Cycle Review
              </div>
            </div>
            <img src="assets/ccis-logo.jpg" alt="CCIS" style="width: 70px; height: 70px; object-fit: cover; border-radius: var(--radius-full);">
          </div>

          <!-- Summary Metric Cards (Requirement 20) -->
          <div class="stats-grid" style="margin-bottom: 2rem;">
            <div class="stat-card variant-total">
              <div class="stat-label">Total Scholars</div>
              <div class="stat-value" id="rep-total-scholars">0</div>
            </div>
            <div class="stat-card variant-compliant">
              <div class="stat-label">Compliant</div>
              <div class="stat-value" id="rep-compliant-scholars">0</div>
            </div>
            <div class="stat-card variant-deficiency">
              <div class="stat-label">With Deficiency</div>
              <div class="stat-value" id="rep-deficiency-scholars">0</div>
            </div>
            <div class="stat-card variant-pending">
              <div class="stat-label">Pending Verification</div>
              <div class="stat-value" id="rep-pending-submissions">0</div>
            </div>
            <div class="stat-card variant-verified">
              <div class="stat-label">Verified Submissions</div>
              <div class="stat-value" id="rep-verified-submissions">0</div>
            </div>
            <div class="stat-card variant-renewal">
              <div class="stat-label">For Renewal</div>
              <div class="stat-value" id="rep-renewal-scholars">0</div>
            </div>
          </div>

          <!-- Detailed Roster Table -->
          <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.75rem; color: var(--text-main);">
            Scholar Compliance Master Roster
          </h4>
          <div class="table-responsive">
            <table class="app-table" style="font-size: 0.8rem;">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Scholar Name</th>
                  <th>Degree & Year</th>
                  <th>Assigned Program</th>
                  <th>Required GWA</th>
                  <th>Scholar Status</th>
                  <th>Compliance Standing</th>
                </tr>
              </thead>
              <tbody id="report-table-body">
                <tr><td colspan="7" class="table-empty">Aggregating compliance records...</td></tr>
              </tbody>
            </table>
          </div>

          <!-- Report Sign-off Footer -->
          <div style="margin-top: 3rem; display: flex; justify-content: space-between; font-size: 0.825rem; color: var(--text-muted); border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
            <div>
              <div style="border-bottom: 1px solid var(--border-strong); width: 220px; height: 40px;"></div>
              <div style="margin-top: 0.4rem; font-weight: 600;">Prepared by: Scholarship Evaluator</div>
            </div>
            <div>
              <div style="border-bottom: 1px solid var(--border-strong); width: 220px; height: 40px;"></div>
              <div style="margin-top: 0.4rem; font-weight: 600;">Certified by: Director of Academic Affairs</div>
            </div>
          </div>
        </div>
      </div>
    `;

    setupEvents(container);
    await generateReport(container);
  }

  function setupEvents(container) {
    container.querySelector("#btn-print-report").addEventListener("click", () => {
      window.print();
    });

    container.querySelector("#btn-apply-report-filters").addEventListener("click", () => {
      generateReport(container);
    });
  }

  async function generateReport(container) {
    const progFilter = container.querySelector("#rep-filter-program").value;
    const statusFilter = container.querySelector("#rep-filter-status").value;

    container.querySelector("#report-timestamp").textContent = new Date().toLocaleString();

    try {
      const scholars = await window.DataService.getScholars({
        scholarship_id: progFilter,
        status: statusFilter
      });

      const stats = await window.DataService.getDashboardStats();
      container.querySelector("#rep-total-scholars").textContent = scholars.length;
      container.querySelector("#rep-compliant-scholars").textContent = scholars.filter(s => s.status === "Compliant").length;
      container.querySelector("#rep-deficiency-scholars").textContent = scholars.filter(s => s.status === "With Deficiency").length;
      container.querySelector("#rep-pending-submissions").textContent = stats.pendingSubmissions;
      container.querySelector("#rep-verified-submissions").textContent = stats.verifiedSubmissions;
      container.querySelector("#rep-renewal-scholars").textContent = scholars.filter(s => s.status === "For Renewal").length;

      const tbody = container.querySelector("#report-table-body");
      if (scholars.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="table-empty">No scholars match the specified report filters.</td></tr>`;
        return;
      }

      tbody.innerHTML = scholars.map(s => {
        const prog = s.scholarship_program;
        return `
          <tr>
            <td style="font-family: var(--font-mono); font-weight: 700; color: var(--primary);">${escapeHtml(s.student_id)}</td>
            <td style="font-weight: 600;">${escapeHtml(s.full_name)}</td>
            <td>${escapeHtml(s.degree_program)} (Yr ${s.year_level})</td>
            <td>${escapeHtml(prog ? prog.program_name : 'N/A')}</td>
            <td>&le; ${prog ? prog.required_gwa.toFixed(2) : '-'}</td>
            <td><span class="badge ${getStatusBadge(s.status)}">${escapeHtml(s.status)}</span></td>
            <td>
              ${s.status === 'Compliant' ? `<strong style="color: var(--success);">Satisfied</strong>` :
                s.status === 'With Deficiency' ? `<strong style="color: var(--danger);">Deficiency Logged</strong>` :
                `<span style="color: var(--text-muted);">${escapeHtml(s.status)}</span>`
              }
            </td>
          </tr>
        `;
      }).join("");

    } catch (err) {
      console.error(err);
    }
  }

  function getStatusBadge(status) {
    switch (status) {
      case "Compliant": return "badge-compliant";
      case "With Deficiency": return "badge-with-deficiency";
      case "For Verification": return "badge-for-verification";
      case "For Renewal": return "badge-for-renewal";
      default: return "badge-active";
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
