/**
 * Student Scholarship Monitoring and Academic Compliance System
 * Scholar Management View Controller
 * 
 * Implements:
 * - Requirement 6: Scholar Management (CRUD, validations, table)
 * - Requirement 13: Real-time Search and Multi-filter
 */

window.ScholarsView = (function() {
  let cachedPrograms = [];
  let currentScholars = [];

  async function render(container) {
    cachedPrograms = await window.DataService.getScholarships();
    const canManage = window.AuthService.canManageScholars();

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h1>Scholar Records Directory</h1>
          <p>Manage scholar profiles, assign scholarship programs, and monitor compliance status.</p>
        </div>
        <div class="view-actions">
          ${canManage ? `
            <button class="btn btn-primary" id="btn-open-create-scholar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Register New Scholar
            </button>
          ` : `
            <span class="badge badge-pending-submission">Read-Only Scholar Access</span>
          `}
        </div>
      </div>

      <!-- Filter and Search Toolbar (Requirement 13) -->
      <div class="filter-toolbar">
        <div class="filter-group">
          <div class="search-input-wrap">
            <span class="search-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </span>
            <input type="text" id="scholar-search-input" placeholder="Search by Student ID, Full Name, or Degree..." autocomplete="off">
          </div>

          <select class="filter-select" id="scholar-filter-program">
            <option value="">All Scholarship Programs</option>
            ${cachedPrograms.map(p => `<option value="${p.id}">${p.program_code} - ${p.program_name}</option>`).join("")}
          </select>

          <select class="filter-select" id="scholar-filter-status">
            <option value="">All Statuses</option>
            ${window.APP_CONFIG.SCHOLAR_STATUSES.map(st => `<option value="${st}">${st}</option>`).join("")}
          </select>
        </div>
        <div>
          <button class="btn btn-secondary btn-sm" id="btn-clear-scholar-filters">Clear Filters</button>
        </div>
      </div>

      <!-- Scholars Data Table (Requirement 6) -->
      <div class="table-responsive">
        <table class="app-table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Full Name</th>
              <th>Degree Program</th>
              <th>Year Level</th>
              <th>Assigned Scholarship</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody id="scholars-table-body">
            <tr><td colspan="7" class="table-empty">Loading scholar directory...</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Create / Edit Scholar Modal -->
      <div class="modal-backdrop" id="modal-scholar-form">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3 class="modal-title" id="scholar-modal-title">Register New Scholar</h3>
            <button class="modal-close" id="btn-close-scholar-modal">&times;</button>
          </div>
          <form id="form-scholar">
            <div class="modal-body">
              <input type="hidden" id="scholar-form-id">
              
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label required">Student ID</label>
                  <input type="text" id="scholar-input-student-id" class="form-control" placeholder="e.g. 2025-09812" required>
                  <div class="form-error" id="err-student-id">Student ID is required and must be unique.</div>
                </div>

                <div class="form-group">
                  <label class="form-label required">Year Level</label>
                  <select id="scholar-input-year-level" class="form-control" required>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                    <option value="5">5th Year</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label required">Full Name</label>
                <input type="text" id="scholar-input-fullname" class="form-control" placeholder="e.g. Juan Dela Cruz" required>
                <div class="form-error" id="err-fullname">Full Name cannot be blank.</div>
              </div>

              <div class="form-group">
                <label class="form-label required">Degree Program</label>
                <input type="text" id="scholar-input-degree" class="form-control" placeholder="e.g. BS Computer Science" required>
                <div class="form-error" id="err-degree">Degree Program cannot be blank.</div>
              </div>

              <div class="form-group">
                <label class="form-label required">Scholarship Program Assignment</label>
                <select id="scholar-input-scholarship" class="form-control" required>
                  <option value="">-- Select Scholarship Program --</option>
                  ${cachedPrograms.map(p => `
                    <option value="${p.id}">
                      ${p.program_name} (Req GWA: ${p.required_gwa.toFixed(2)}, Min Units: ${p.min_units})
                    </option>
                  `).join("")}
                </select>
                <div class="form-error" id="err-scholarship">Please select a scholarship program.</div>
                <div class="form-hint">Scholar will be evaluated based on the specific academic rules of this program.</div>
              </div>

              <div class="form-group">
                <label class="form-label required">Scholar Academic Status</label>
                <select id="scholar-input-status" class="form-control" required>
                  ${window.APP_CONFIG.SCHOLAR_STATUSES.map(st => `<option value="${st}">${st}</option>`).join("")}
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="btn-cancel-scholar">Cancel</button>
              <button type="submit" class="btn btn-primary" id="btn-save-scholar">Save Scholar Record</button>
            </div>
          </form>
        </div>
      </div>

      <!-- View Scholar Details Modal -->
      <div class="modal-backdrop" id="modal-view-scholar">
        <div class="modal-dialog modal-lg">
          <div class="modal-header">
            <h3 class="modal-title">Scholar Academic Profile</h3>
            <button class="modal-close" id="btn-close-view-modal">&times;</button>
          </div>
          <div class="modal-body" id="view-scholar-body">
            <!-- Dynamic scholar details populated via JS -->
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="btn-close-view-modal-footer">Close</button>
            <button type="button" class="btn btn-primary" id="btn-view-to-submission">Submit Grades for Scholar</button>
          </div>
        </div>
      </div>
    `;

    setupEvents(container);
    await loadScholars(container);
  }

  function setupEvents(container) {
    const searchInput = container.querySelector("#scholar-search-input");
    const progSelect = container.querySelector("#scholar-filter-program");
    const statusSelect = container.querySelector("#scholar-filter-status");
    const clearBtn = container.querySelector("#btn-clear-scholar-filters");

    const refreshFiltered = () => {
      loadScholars(container, {
        search: searchInput.value,
        scholarship_id: progSelect.value,
        status: statusSelect.value
      });
    };

    searchInput.addEventListener("input", refreshFiltered);
    progSelect.addEventListener("change", refreshFiltered);
    statusSelect.addEventListener("change", refreshFiltered);

    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      progSelect.value = "";
      statusSelect.value = "";
      loadScholars(container);
    });

    // Form Modal triggers
    const modal = container.querySelector("#modal-scholar-form");
    const openCreateBtn = container.querySelector("#btn-open-create-scholar");
    const closeBtn = container.querySelector("#btn-close-scholar-modal");
    const cancelBtn = container.querySelector("#btn-cancel-scholar");
    const form = container.querySelector("#form-scholar");

    if (openCreateBtn) {
      openCreateBtn.addEventListener("click", () => {
        openScholarForm(container, null);
      });
    }

    const closeModal = () => modal.classList.remove("show");
    closeBtn.addEventListener("click", closeModal);
    cancelBtn.addEventListener("click", closeModal);

    // Form Submit
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await handleFormSubmit(container);
    });

    // View Modal Close
    const viewModal = container.querySelector("#modal-view-scholar");
    const closeViewBtn = container.querySelector("#btn-close-view-modal");
    const closeViewFooterBtn = container.querySelector("#btn-close-view-modal-footer");
    const closeViewModal = () => viewModal.classList.remove("show");
    closeViewBtn.addEventListener("click", closeViewModal);
    closeViewFooterBtn.addEventListener("click", closeViewModal);
  }

  async function loadScholars(container, filters = {}) {
    const tbody = container.querySelector("#scholars-table-body");
    try {
      currentScholars = await window.DataService.getScholars(filters);

      if (currentScholars.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="table-empty">No scholars found matching the specified criteria.</td></tr>`;
        return;
      }

      tbody.innerHTML = currentScholars.map(scholar => {
        const progName = scholar.scholarship_program ? scholar.scholarship_program.program_name : "Not Assigned";
        const progCode = scholar.scholarship_program ? scholar.scholarship_program.program_code : "N/A";
        const badgeClass = getStatusBadgeClass(scholar.status);

        return `
          <tr data-id="${scholar.id}">
            <td style="font-weight: 700; font-family: var(--font-mono); color: var(--primary);">
              ${escapeHtml(scholar.student_id)}
            </td>
            <td>
              <div style="font-weight: 600;">${escapeHtml(scholar.full_name)}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(scholar.email || "")}</div>
            </td>
            <td>${escapeHtml(scholar.degree_program)}</td>
            <td>Year ${scholar.year_level}</td>
            <td>
              <div style="font-weight: 500;">${escapeHtml(progName)}</div>
              <div style="font-size: 0.725rem; color: var(--text-muted);">Code: ${escapeHtml(progCode)}</div>
            </td>
            <td>
              <span class="badge ${badgeClass}">
                <span class="badge-dot"></span>
                ${escapeHtml(scholar.status)}
              </span>
            </td>
            <td style="text-align: right; white-space: nowrap;">
              <button class="btn btn-secondary btn-sm btn-action-view" data-id="${scholar.id}">View</button>
              ${window.AuthService.canManageScholars() ? `
                <button class="btn btn-secondary btn-sm btn-action-edit" data-id="${scholar.id}">Edit</button>
              ` : ""}
            </td>
          </tr>
        `;
      }).join("");

      // Bind action buttons
      tbody.querySelectorAll(".btn-action-view").forEach(btn => {
        btn.addEventListener("click", () => openViewModal(container, btn.getAttribute("data-id")));
      });

      tbody.querySelectorAll(".btn-action-edit").forEach(btn => {
        btn.addEventListener("click", () => {
          const s = currentScholars.find(item => item.id === btn.getAttribute("data-id"));
          openScholarForm(container, s);
        });
      });

    } catch (err) {
      console.error(err);
      tbody.innerHTML = `<tr><td colspan="7" class="table-empty" style="color: var(--danger);">Failed to load scholars: ${err.message}</td></tr>`;
    }
  }

  function openScholarForm(container, scholar = null) {
    const modal = container.querySelector("#modal-scholar-form");
    const form = container.querySelector("#form-scholar");
    const title = container.querySelector("#scholar-modal-title");

    form.reset();
    clearErrors(container);

    if (scholar) {
      title.textContent = "Edit Scholar Information";
      container.querySelector("#scholar-form-id").value = scholar.id;
      container.querySelector("#scholar-input-student-id").value = scholar.student_id;
      container.querySelector("#scholar-input-fullname").value = scholar.full_name;
      container.querySelector("#scholar-input-degree").value = scholar.degree_program;
      container.querySelector("#scholar-input-year-level").value = scholar.year_level;
      container.querySelector("#scholar-input-scholarship").value = scholar.scholarship_id;
      container.querySelector("#scholar-input-status").value = scholar.status;
    } else {
      title.textContent = "Register New Scholar";
      container.querySelector("#scholar-form-id").value = "";
      container.querySelector("#scholar-input-status").value = "Pending Submission";
    }

    modal.classList.add("show");
  }

  async function handleFormSubmit(container) {
    clearErrors(container);

    const id = container.querySelector("#scholar-form-id").value;
    const studentId = container.querySelector("#scholar-input-student-id").value.trim();
    const fullName = container.querySelector("#scholar-input-fullname").value.trim();
    const degree = container.querySelector("#scholar-input-degree").value.trim();
    const yearLevel = container.querySelector("#scholar-input-year-level").value;
    const scholarshipId = container.querySelector("#scholar-input-scholarship").value;
    const status = container.querySelector("#scholar-input-status").value;

    let hasError = false;

    if (!studentId) {
      showError(container, "#err-student-id", "Student ID is required.");
      hasError = true;
    }
    if (!fullName) {
      showError(container, "#err-fullname", "Full Name cannot be blank.");
      hasError = true;
    }
    if (!degree) {
      showError(container, "#err-degree", "Degree Program cannot be blank.");
      hasError = true;
    }
    if (!scholarshipId) {
      showError(container, "#err-scholarship", "Please select a scholarship program.");
      hasError = true;
    }

    if (hasError) return;

    try {
      const payload = {
        student_id: studentId,
        full_name: fullName,
        degree_program: degree,
        year_level: yearLevel,
        scholarship_id: scholarshipId,
        status: status
      };

      if (id) {
        await window.DataService.updateScholar(id, payload);
        window.App.showToast("Scholar information updated successfully.", "success");
      } else {
        await window.DataService.createScholar(payload);
        window.App.showToast("New scholar registered successfully!", "success");
      }

      container.querySelector("#modal-scholar-form").classList.remove("show");
      await loadScholars(container);

    } catch (err) {
      window.App.showToast(err.message, "danger");
    }
  }

  async function openViewModal(container, scholarId) {
    const scholar = await window.DataService.getScholarById(scholarId);
    if (!scholar) return;

    const modal = container.querySelector("#modal-view-scholar");
    const body = container.querySelector("#view-scholar-body");
    const prog = scholar.scholarship_program;

    // Load scholar's submissions & evaluations
    const submissions = await window.DataService.getSubmissions({ scholar_id: scholar.id });

    body.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; background: var(--bg-subtle); padding: 1rem; border-radius: var(--radius-md);">
        <div>
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Student ID</div>
          <div style="font-family: var(--font-mono); font-weight: 700; font-size: 1.1rem; color: var(--primary);">${escapeHtml(scholar.student_id)}</div>
        </div>
        <div>
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Current Academic Status</div>
          <div><span class="badge ${getStatusBadgeClass(scholar.status)}">${escapeHtml(scholar.status)}</span></div>
        </div>
        <div>
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Full Name</div>
          <div style="font-weight: 600;">${escapeHtml(scholar.full_name)}</div>
        </div>
        <div>
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Degree & Year</div>
          <div>${escapeHtml(scholar.degree_program)} (Year ${scholar.year_level})</div>
        </div>
      </div>

      <!-- Assigned Scholarship Program Box (Requirement 7 & BR-02) -->
      <div class="card" style="margin-bottom: 1.25rem;">
        <div class="card-header">
          <span class="card-title">📜 Assigned Scholarship Program & Academic Criteria</span>
        </div>
        <div class="card-body" style="font-size: 0.85rem;">
          ${prog ? `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem;">
              <div>
                <span style="color: var(--text-muted);">Program Name:</span><br>
                <strong>${escapeHtml(prog.program_name)}</strong>
              </div>
              <div>
                <span style="color: var(--text-muted);">Required GWA:</span><br>
                <strong style="color: var(--primary); font-size: 1rem;">${prog.required_gwa.toFixed(2)} or better</strong>
              </div>
              <div>
                <span style="color: var(--text-muted);">Minimum Units:</span><br>
                <strong>${prog.min_units} units</strong>
              </div>
              <div>
                <span style="color: var(--text-muted);">Failing Grades Allowed:</span><br>
                <strong>${prog.allow_failing_grade ? "Yes (Probationary)" : "No (Strictly Prohibited)"}</strong>
              </div>
            </div>
            ${prog.description ? `<p style="margin-top: 0.75rem; font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(prog.description)}</p>` : ""}
          ` : `<div style="color: var(--danger);">No scholarship program assigned!</div>`}
        </div>
      </div>

      <!-- Academic Submissions & Compliance History -->
      <div>
        <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.75rem;">Academic Grade Submissions History</h4>
        ${submissions.length === 0 ? `
          <div style="padding: 1.5rem; text-align: center; background: var(--bg-subtle); border-radius: var(--radius-sm); color: var(--text-muted); font-size: 0.85rem;">
            No grade submissions recorded for this scholar yet.
          </div>
        ` : `
          <table class="app-table" style="font-size: 0.8rem;">
            <thead>
              <tr>
                <th>Term</th>
                <th>GWA</th>
                <th>Units</th>
                <th>Deficiencies</th>
                <th>Verification</th>
                <th>Compliance</th>
              </tr>
            </thead>
            <tbody>
              ${submissions.map(sub => `
                <tr>
                  <td>${escapeHtml(sub.academic_year)}<br><span style="color: var(--text-muted);">${escapeHtml(sub.semester)}</span></td>
                  <td style="font-weight: 700;">${parseFloat(sub.gwa).toFixed(2)}</td>
                  <td>${sub.units_enrolled} units</td>
                  <td>Failed: ${sub.failed_subjects}, INC: ${sub.incomplete_subjects}</td>
                  <td>
                    <span class="badge ${sub.submission_status === 'Verified' ? 'badge-verified' : 'badge-for-verification'}">
                      ${sub.submission_status}
                    </span>
                    ${sub.verified_by ? `<div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">By: ${escapeHtml(sub.verified_by)}</div>` : ''}
                  </td>
                  <td>
                    ${sub.evaluation ? `
                      <span class="badge ${sub.evaluation.result === 'Compliant' ? 'badge-compliant' : 'badge-with-deficiency'}">
                        ${sub.evaluation.result}
                      </span>
                    ` : '<span style="color: var(--text-muted);">Pending Verification</span>'}
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        `}
      </div>
    `;

    // Hook quick submit button
    const submitBtn = container.querySelector("#btn-view-to-submission");
    submitBtn.onclick = () => {
      modal.classList.remove("show");
      window.App.navigate("submissions", { preselectScholarId: scholar.id });
    };

    modal.classList.add("show");
  }

  function getStatusBadgeClass(status) {
    switch (status) {
      case "Active": return "badge-active";
      case "Pending Submission": return "badge-pending-submission";
      case "For Verification": return "badge-for-verification";
      case "Compliant": return "badge-compliant";
      case "With Deficiency": return "badge-with-deficiency";
      case "Probationary": return "badge-probationary";
      case "For Renewal": return "badge-for-renewal";
      case "Renewed": return "badge-renewed";
      case "Disqualified": return "badge-disqualified";
      default: return "badge-active";
    }
  }

  function showError(container, selector, message) {
    const errElem = container.querySelector(selector);
    if (errElem) {
      errElem.textContent = message;
      errElem.classList.add("visible");
    }
  }

  function clearErrors(container) {
    container.querySelectorAll(".form-error").forEach(el => el.classList.remove("visible"));
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
