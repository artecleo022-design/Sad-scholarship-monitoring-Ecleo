/**
 * Student Scholarship Monitoring and Academic Compliance System
 * Grade Submission View Controller
 * 
 * Implements:
 * - Requirement 8: Semester Grade Submission (forms, institutional validation, status lifecycle)
 * - BR-03: Every grade submission must belong to one scholar, AY, and semester
 */

window.SubmissionsView = (function() {
  let scholars = [];

  async function render(container, params = {}) {
    scholars = await window.DataService.getScholars();
    const currentUser = window.AuthService.getCurrentUser();
    const isScholar = currentUser && currentUser.role === "scholar";

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h1>Semester Grade Submissions</h1>
          <p>File academic grade records for verification and automated compliance evaluation.</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-primary" id="btn-toggle-submit-panel">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Grade Submission Form
          </button>
        </div>
      </div>

      <!-- Submission Form Card -->
      <div class="card" id="submission-card-form" style="display: none;">
        <div class="card-header">
          <span class="card-title">Semester Grade Submission Form</span>
          <button class="btn btn-secondary btn-sm" id="btn-close-submit-panel">Close Form</button>
        </div>
        <div class="card-body">
          <form id="form-grade-submission">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label required">Select Scholar</label>
                <select id="sub-input-scholar" class="form-control" required>
                  <option value="">-- Choose Scholar --</option>
                  ${scholars.map(s => `
                    <option value="${s.id}" data-scholarship="${s.scholarship_id}" ${params.preselectScholarId === s.id ? 'selected' : ''}>
                      ${escapeHtml(s.student_id)} - ${escapeHtml(s.full_name)} (${escapeHtml(s.scholarship_program ? s.scholarship_program.program_code : 'No Grant')})
                    </option>
                  `).join("")}
                </select>
                <div class="form-hint" id="scholar-program-hint">Select a scholar to view assigned program benchmark.</div>
              </div>

              <div class="form-group">
                <label class="form-label required">Academic Year</label>
                <select id="sub-input-ay" class="form-control" required>
                  ${window.APP_CONFIG.ACADEMIC_YEARS.map(ay => `<option value="${ay}">${ay}</option>`).join("")}
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label required">Semester Term</label>
                <select id="sub-input-sem" class="form-control" required>
                  ${window.APP_CONFIG.SEMESTERS.map(sem => `<option value="${sem}">${sem}</option>`).join("")}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label required">General Weighted Average (GWA)</label>
                <input type="number" id="sub-input-gwa" class="form-control" step="0.01" min="1.00" max="5.00" placeholder="e.g. 1.75" required>
                <div class="form-hint">Valid institutional range: 1.00 (highest) to 5.00 (failing).</div>
              </div>
            </div>

            <div class="form-row" style="grid-template-columns: repeat(3, 1fr);">
              <div class="form-group">
                <label class="form-label required">Enrolled Units</label>
                <input type="number" id="sub-input-units" class="form-control" min="0" max="36" placeholder="e.g. 18" required>
                <div class="form-hint">Must not be negative.</div>
              </div>

              <div class="form-group">
                <label class="form-label required">Failed Subjects</label>
                <input type="number" id="sub-input-failed" class="form-control" min="0" max="10" value="0" required>
                <div class="form-hint">Must not be negative.</div>
              </div>

              <div class="form-group">
                <label class="form-label required">Incomplete (INC) Subjects</label>
                <input type="number" id="sub-input-inc" class="form-control" min="0" max="10" value="0" required>
                <div class="form-hint">Pending completion.</div>
              </div>
            </div>

            <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 0.85rem; margin-bottom: 1.25rem; font-size: 0.8rem; color: var(--text-muted);">
              <strong>System Notice (Requirement 8):</strong> Upon filing, submission status will be initialized to 
              <span class="badge badge-for-verification">For Verification</span>. 
              Grades will NOT be considered final until verified by an authorized Scholarship Staff/Admin evaluator.
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
              <button type="button" class="btn btn-secondary" id="btn-cancel-submission">Cancel</button>
              <button type="submit" class="btn btn-primary" id="btn-submit-grades">Submit Grades for Verification</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Submissions History Table -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">📋 Grade Submissions Backlog & History</span>
        </div>
        <div class="card-body" style="padding: 0;">
          <div class="table-responsive" style="border: none;">
            <table class="app-table">
              <thead>
                <tr>
                  <th>Submission ID</th>
                  <th>Scholar Name</th>
                  <th>Term</th>
                  <th>GWA</th>
                  <th>Units</th>
                  <th>Deficiencies</th>
                  <th>Status</th>
                  <th>Verified By</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody id="submissions-table-body">
                <tr><td colspan="9" class="table-empty">Loading grade submissions...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    setupEvents(container, isScholar, currentUser);
    await loadSubmissions(container);

    if (params.preselectScholarId) {
      container.querySelector("#submission-card-form").style.display = "block";
    }
  }

  function setupEvents(container, isScholar, currentUser) {
    const toggleBtn = container.querySelector("#btn-toggle-submit-panel");
    const closeBtn = container.querySelector("#btn-close-submit-panel");
    const cancelBtn = container.querySelector("#btn-cancel-submission");
    const formCard = container.querySelector("#submission-card-form");
    const form = container.querySelector("#form-grade-submission");
    const scholarSelect = container.querySelector("#sub-input-scholar");
    const hintElem = container.querySelector("#scholar-program-hint");

    const toggleForm = (show) => {
      formCard.style.display = show ? "block" : "none";
      if (show) formCard.scrollIntoView({ behavior: "smooth" });
    };

    toggleBtn.addEventListener("click", () => toggleForm(true));
    closeBtn.addEventListener("click", () => toggleForm(false));
    cancelBtn.addEventListener("click", () => toggleForm(false));

    // If active user is scholar, lock scholar dropdown to their own profile
    if (isScholar && currentUser && currentUser.scholar_id) {
      scholarSelect.value = currentUser.scholar_id;
      scholarSelect.disabled = true;
    }

    scholarSelect.addEventListener("change", () => {
      const selected = scholars.find(s => s.id === scholarSelect.value);
      if (selected && selected.scholarship_program) {
        hintElem.innerHTML = `Assigned Grant: <strong>${escapeHtml(selected.scholarship_program.program_name)}</strong> (Benchmark GWA: &le; <strong>${selected.scholarship_program.required_gwa.toFixed(2)}</strong>, Min Units: <strong>${selected.scholarship_program.min_units}</strong>)`;
      } else {
        hintElem.textContent = "Select a scholar to view assigned program benchmark.";
      }
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await handleSubmit(container, scholarSelect.value);
    });
  }

  async function handleSubmit(container, scholarId) {
    const ay = container.querySelector("#sub-input-ay").value;
    const sem = container.querySelector("#sub-input-sem").value;
    const gwa = container.querySelector("#sub-input-gwa").value;
    const units = container.querySelector("#sub-input-units").value;
    const failed = container.querySelector("#sub-input-failed").value;
    const inc = container.querySelector("#sub-input-inc").value;

    try {
      await window.DataService.createSubmission({
        scholar_id: scholarId,
        academic_year: ay,
        semester: sem,
        gwa: gwa,
        units_enrolled: units,
        failed_subjects: failed,
        incomplete_subjects: inc
      });

      window.App.showToast("Semester grades submitted successfully! Status initialized to 'For Verification'.", "success");
      container.querySelector("#form-grade-submission").reset();
      container.querySelector("#submission-card-form").style.display = "none";
      await loadSubmissions(container);

    } catch (err) {
      window.App.showToast(err.message, "danger");
    }
  }

  async function loadSubmissions(container) {
    const tbody = container.querySelector("#submissions-table-body");
    try {
      const submissions = await window.DataService.getSubmissions();

      if (submissions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="table-empty">No grade submissions found.</td></tr>`;
        return;
      }

      tbody.innerHTML = submissions.map(sub => {
        const scholarName = sub.scholar ? sub.scholar.full_name : "Unknown Scholar";
        const studentId = sub.scholar ? sub.scholar.student_id : "N/A";
        const badgeClass = sub.submission_status === "Verified" ? "badge-verified" : "badge-for-verification";

        return `
          <tr>
            <td style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(sub.id.substring(0, 10))}...</td>
            <td>
              <div style="font-weight: 600;">${escapeHtml(scholarName)}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">${escapeHtml(studentId)}</div>
            </td>
            <td>
              <div>${escapeHtml(sub.academic_year)}</div>
              <div style="font-size: 0.725rem; color: var(--text-muted);">${escapeHtml(sub.semester)}</div>
            </td>
            <td style="font-weight: 700; color: var(--primary); font-size: 0.95rem;">${parseFloat(sub.gwa).toFixed(2)}</td>
            <td>${sub.units_enrolled} units</td>
            <td>
              ${sub.failed_subjects > 0 ? `<span style="color: var(--danger); font-weight: 600;">${sub.failed_subjects} Failed</span>` : `<span style="color: var(--success);">0 Failed</span>`}, 
              ${sub.incomplete_subjects > 0 ? `<span style="color: var(--warning);">${sub.incomplete_subjects} INC</span>` : `0 INC`}
            </td>
            <td>
              <span class="badge ${badgeClass}">${sub.submission_status}</span>
            </td>
            <td>
              ${sub.verified_by ? `
                <div style="font-size: 0.8rem; font-weight: 500;">${escapeHtml(sub.verified_by)}</div>
                <div style="font-size: 0.7rem; color: var(--text-muted);">${new Date(sub.verified_at).toLocaleDateString()}</div>
              ` : `<span style="color: var(--text-light); font-size: 0.8rem;">Unverified</span>`}
            </td>
            <td style="text-align: right;">
              ${sub.submission_status !== "Verified" ? `
                <button class="btn btn-primary btn-sm btn-go-verify" data-id="${sub.id}">
                  Verify
                </button>
              ` : `
                <button class="btn btn-secondary btn-sm" onclick="window.App.navigate('compliance')">
                  View Eval
                </button>
              `}
            </td>
          </tr>
        `;
      }).join("");

      tbody.querySelectorAll(".btn-go-verify").forEach(btn => {
        btn.addEventListener("click", () => {
          window.App.navigate("verification", { preselectSubId: btn.getAttribute("data-id") });
        });
      });

    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="9" class="table-empty" style="color: var(--danger);">Failed to load submissions: ${err.message}</td></tr>`;
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
