/**
 * Student Scholarship Monitoring and Academic Compliance System
 * Grade Verification Desk View Controller
 * 
 * Implements:
 * - Requirement 9: Grade Verification (staff review, audit stamps)
 * - Requirement 10: Automated Compliance Evaluation Trigger
 * - Requirement 3: Role-based restriction (scholars forbidden from self-verifying)
 * - BR-04, BR-05, BR-09
 */

window.VerificationView = (function() {
  let pendingSubmissions = [];

  async function render(container, params = {}) {
    const currentUser = window.AuthService.getCurrentUser();
    const canVerify = window.AuthService.canVerify();

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h1>Grade Verification Desk</h1>
          <p>Official evaluation portal for verifying pending academic grade submissions against primary school records.</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" id="btn-refresh-verification">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
            Refresh Queue
          </button>
        </div>
      </div>

      <!-- Role Security Notice (Requirement 3 & BR-04) -->
      ${!canVerify ? `
        <div class="compliance-banner deficiency" style="margin-bottom: 1.5rem;">
          <div>
            <div style="font-weight: 700; font-size: 0.95rem;">Access Restricted: Scholar Account Detected</div>
            <div style="font-size: 0.825rem; margin-top: 0.25rem;">
              According to institutional policy (BR-04), scholars are strictly prohibited from verifying their own grade submissions. Only authorized Scholarship Staff or Administrators may perform verification actions.
            </div>
          </div>
        </div>
      ` : `
        <div class="evaluator-banner">
          <div style="font-size: 0.85rem; color: var(--success-700);">
            Logged in as <strong>${escapeHtml(currentUser.full_name)}</strong> (${currentUser.role.toUpperCase()}). You have official authority to review and verify academic submissions.
          </div>
        </div>
      `}

      <!-- Verification Queue Table -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Submissions Awaiting Verification Queue</span>
          <span class="badge badge-for-verification" id="queue-count-badge">0 Pending</span>
        </div>
        <div class="card-body" style="padding: 0;">
          <div class="table-responsive" style="border: none;">
            <table class="app-table">
              <thead>
                <tr>
                  <th>Scholar ID & Name</th>
                  <th>Assigned Scholarship</th>
                  <th>Term</th>
                  <th>Submitted GWA</th>
                  <th>Units</th>
                  <th>Failed / INC</th>
                  <th>Submission Date</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody id="verification-table-body">
                <tr><td colspan="8" class="table-empty">Loading pending verification queue...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Verification Review Modal (Requirement 9) -->
      <div class="modal-backdrop" id="modal-verify-review">
        <div class="modal-dialog modal-lg">
          <div class="modal-header">
            <h3 class="modal-title">Official Grade Submission Verification</h3>
            <button class="modal-close" id="btn-close-verify-modal">&times;</button>
          </div>
          <div class="modal-body" id="verify-review-content">
            <!-- Dynamic review details populated via JS -->
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="btn-cancel-verify">Cancel</button>
            <button type="button" class="btn btn-success" id="btn-confirm-verify" ${!canVerify ? "disabled" : ""}>
              <span>✅</span> Verify Submission & Run Compliance Evaluation
            </button>
          </div>
        </div>
      </div>

      <!-- Evaluation Result Feedback Modal (Requirement 10 & 11) -->
      <div class="modal-backdrop" id="modal-eval-result">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3 class="modal-title">Evaluation Completed</h3>
            <button class="modal-close" id="btn-close-eval-modal">&times;</button>
          </div>
          <div class="modal-body" id="eval-result-content">
            <!-- Populated after successful verification -->
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-primary" id="btn-dismiss-eval-modal">Continue</button>
          </div>
        </div>
      </div>
    `;

    setupEvents(container, canVerify, currentUser);
    await loadQueue(container, params.preselectSubId);
  }

  function setupEvents(container, canVerify, currentUser) {
    container.querySelector("#btn-refresh-verification").addEventListener("click", () => loadQueue(container));

    const reviewModal = container.querySelector("#modal-verify-review");
    const closeReview = () => reviewModal.classList.remove("show");
    container.querySelector("#btn-close-verify-modal").addEventListener("click", closeReview);
    container.querySelector("#btn-cancel-verify").addEventListener("click", closeReview);

    const evalModal = container.querySelector("#modal-eval-result");
    const closeEval = () => {
      evalModal.classList.remove("show");
      loadQueue(container);
    };
    container.querySelector("#btn-close-eval-modal").addEventListener("click", closeEval);
    container.querySelector("#btn-dismiss-eval-modal").addEventListener("click", closeEval);
  }

  async function loadQueue(container, autoOpenSubId = null) {
    const tbody = container.querySelector("#verification-table-body");
    const countBadge = container.querySelector("#queue-count-badge");

    try {
      const allSubmissions = await window.DataService.getSubmissions();
      pendingSubmissions = allSubmissions.filter(s => s.submission_status === "For Verification" || s.submission_status === "Pending");

      countBadge.textContent = `${pendingSubmissions.length} Pending`;

      if (pendingSubmissions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="table-empty">All submitted grades have been verified! No pending records.</td></tr>`;
        return;
      }

      tbody.innerHTML = pendingSubmissions.map(sub => {
        const scholar = sub.scholar;
        const prog = sub.scholarship;

        return `
          <tr>
            <td>
              <div style="font-weight: 700; color: var(--text-main);">${escapeHtml(scholar ? scholar.full_name : 'Unknown')}</div>
              <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--primary);">${escapeHtml(scholar ? scholar.student_id : 'N/A')}</div>
            </td>
            <td>
              <div style="font-weight: 600;">${escapeHtml(prog ? prog.program_name : 'No Program')}</div>
              <div style="font-size: 0.725rem; color: var(--text-muted);">Req: &le; ${prog ? prog.required_gwa.toFixed(2) : '-'} | Min: ${prog ? prog.min_units : '-'} units</div>
            </td>
            <td>
              <div>${escapeHtml(sub.academic_year)}</div>
              <div style="font-size: 0.725rem; color: var(--text-muted);">${escapeHtml(sub.semester)}</div>
            </td>
            <td style="font-weight: 700; font-size: 1rem; color: var(--primary);">${parseFloat(sub.gwa).toFixed(2)}</td>
            <td><strong>${sub.units_enrolled}</strong> units</td>
            <td>
              ${sub.failed_subjects > 0 ? `<span style="color: var(--danger); font-weight: 600;">${sub.failed_subjects} Failed</span>` : `0 Failed`}, 
              ${sub.incomplete_subjects > 0 ? `<span style="color: var(--warning);">${sub.incomplete_subjects} INC</span>` : `0 INC`}
            </td>
            <td style="font-size: 0.775rem; color: var(--text-muted);">
              ${new Date(sub.submitted_at).toLocaleDateString()}
            </td>
            <td style="text-align: right;">
              <button class="btn btn-primary btn-sm btn-open-review" data-id="${sub.id}">
                Review & Verify
              </button>
            </td>
          </tr>
        `;
      }).join("");

      tbody.querySelectorAll(".btn-open-review").forEach(btn => {
        btn.addEventListener("click", () => openReviewModal(container, btn.getAttribute("data-id")));
      });

      if (autoOpenSubId) {
        openReviewModal(container, autoOpenSubId);
      }

    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="8" class="table-empty" style="color: var(--danger);">${err.message}</td></tr>`;
    }
  }

  function openReviewModal(container, subId) {
    const sub = pendingSubmissions.find(s => s.id === subId);
    if (!sub) return;

    const modal = container.querySelector("#modal-verify-review");
    const content = container.querySelector("#verify-review-content");
    const prog = sub.scholarship;
    const scholar = sub.scholar;

    content.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem; background: var(--bg-subtle); padding: 1.25rem; border-radius: var(--radius-md);">
        <div>
          <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Scholar Information</span>
          <div style="font-weight: 700; font-size: 1.05rem; margin-top: 0.2rem;">${escapeHtml(scholar ? scholar.full_name : '')}</div>
          <div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--primary);">${escapeHtml(scholar ? scholar.student_id : '')} • ${escapeHtml(scholar ? scholar.degree_program : '')}</div>
        </div>

        <div>
          <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Assigned Scholarship Benchmark</span>
          <div style="font-weight: 700; font-size: 1.05rem; margin-top: 0.2rem;">${escapeHtml(prog ? prog.program_name : '')}</div>
          <div style="font-size: 0.85rem; color: var(--text-muted);">
            Req GWA: &le; <strong>${prog ? prog.required_gwa.toFixed(2) : '-'}</strong> | Min Units: <strong>${prog ? prog.min_units : '-'}</strong> | Failing Allowed: <strong>${prog && prog.allow_failing_grade ? 'Yes' : 'No'}</strong>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom: 1.25rem;">
        <div class="card-header">
          <span class="card-title">📄 Submitted Academic Records for Review (AY ${escapeHtml(sub.academic_year)} - ${escapeHtml(sub.semester)})</span>
        </div>
        <div class="card-body">
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; text-align: center;">
            <div style="background: #f8fafc; padding: 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
              <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Submitted GWA</div>
              <div style="font-size: 1.75rem; font-weight: 800; color: var(--primary); margin-top: 0.25rem;">${parseFloat(sub.gwa).toFixed(2)}</div>
            </div>

            <div style="background: #f8fafc; padding: 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
              <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Enrolled Units</div>
              <div style="font-size: 1.75rem; font-weight: 800; color: var(--text-main); margin-top: 0.25rem;">${sub.units_enrolled}</div>
            </div>

            <div style="background: #f8fafc; padding: 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
              <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Failed Subjects</div>
              <div style="font-size: 1.75rem; font-weight: 800; color: ${sub.failed_subjects > 0 ? 'var(--danger)' : 'var(--success)'}; margin-top: 0.25rem;">${sub.failed_subjects}</div>
            </div>

            <div style="background: #f8fafc; padding: 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
              <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Incomplete (INC)</div>
              <div style="font-size: 1.75rem; font-weight: 800; color: ${sub.incomplete_subjects > 0 ? 'var(--warning)' : 'var(--text-muted)'}; margin-top: 0.25rem;">${sub.incomplete_subjects}</div>
            </div>
          </div>
        </div>
      </div>

      <div style="font-size: 0.8rem; color: var(--text-muted); background: #fefce8; border: 1px solid #fef08a; padding: 0.75rem; border-radius: var(--radius-sm);">
        <strong>Verification & Audit Protocol:</strong> Clicking "Verify Submission" will stamp this record with your staff identity and the current timestamp. The system will then immediately invoke the Compliance Engine to compare the verified grades against the scholarship requirements.
      </div>
    `;

    // Hook verify button
    const confirmBtn = container.querySelector("#btn-confirm-verify");
    confirmBtn.onclick = async () => {
      await executeVerification(container, sub.id);
    };

    modal.classList.add("show");
  }

  async function executeVerification(container, subId) {
    const currentUser = window.AuthService.getCurrentUser();
    if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "staff")) {
      window.App.showToast("You are not authorized to verify grade submissions.", "danger");
      return;
    }

    try {
      const outcome = await window.DataService.verifyAndEvaluateSubmission(subId, currentUser);
      container.querySelector("#modal-verify-review").classList.remove("show");

      // Show Evaluation Result Modal (Requirement 10, 11, 12)
      showEvaluationModal(container, outcome);
      window.App.showToast(`Submission verified and evaluated successfully: ${outcome.evaluation.result}!`, "success");

    } catch (err) {
      window.App.showToast(err.message, "danger");
    }
  }

  function showEvaluationModal(container, outcome) {
    const modal = container.querySelector("#modal-eval-result");
    const content = container.querySelector("#eval-result-content");
    const report = outcome.report;
    const scholar = outcome.scholar;

    const isCompliant = report.isCompliant;
    const bannerClass = isCompliant ? "compliant" : "deficiency";
    const bannerIcon = isCompliant ? "✅" : "⚠️";

    content.innerHTML = `
      <div class="compliance-banner ${bannerClass}">
        <span style="font-size: 1.5rem;">${bannerIcon}</span>
        <div>
          <div style="font-weight: 800; font-size: 1.15rem; text-transform: uppercase; letter-spacing: 0.05em;">
            COMPLIANCE RESULT: ${report.result}
          </div>
          <div style="font-size: 0.85rem; margin-top: 0.25rem;">
            Scholar: <strong>${escapeHtml(scholar.full_name)}</strong> (${escapeHtml(scholar.student_id)})
          </div>
          <div style="font-size: 0.8rem; margin-top: 0.2rem;">
            Updated Scholar Status: <span class="badge ${isCompliant ? 'badge-compliant' : 'badge-with-deficiency'}">${scholar.status}</span>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom: 1rem;">
        <div class="card-header" style="padding: 0.75rem 1rem;">
          <span class="card-title" style="font-size: 0.875rem;">Requirement-by-Requirement Breakdown</span>
        </div>
        <div class="card-body" style="padding: 0.85rem 1rem; font-size: 0.825rem;">
          <div style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid var(--border-color);">
            <span>GWA Requirement (Achieved: <strong>${report.comparison_summary.gwa.achieved.toFixed(2)}</strong> / Req: &le; <strong>${report.comparison_summary.gwa.required.toFixed(2)}</strong>):</span>
            <strong>${report.gwa_requirement_met ? '✅ Satisfied' : '❌ Not Satisfied'}</strong>
          </div>

          <div style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid var(--border-color);">
            <span>Enrolled Units (Enrolled: <strong>${report.comparison_summary.units.achieved}</strong> / Min: <strong>${report.comparison_summary.units.required}</strong>):</span>
            <strong>${report.units_requirement_met ? '✅ Satisfied' : '❌ Not Satisfied'}</strong>
          </div>

          <div style="display: flex; justify-content: space-between; padding: 0.4rem 0;">
            <span>Failing Grade Policy (Failed: <strong>${report.comparison_summary.failingGrades.incurred}</strong>):</span>
            <strong>${report.failing_grade_requirement_met ? '✅ Satisfied' : '❌ Violated'}</strong>
          </div>
        </div>
      </div>

      ${report.deficiencies.length > 0 ? `
        <div style="background: #fff1f2; border: 1px solid #fecdd3; padding: 0.85rem; border-radius: var(--radius-sm); font-size: 0.8rem; color: #9f1239;">
          <strong>Specific Deficiencies Identified (Requirement 11):</strong>
          <ul class="deficiency-list" style="margin-top: 0.35rem;">
            ${report.deficiencies.map(d => `<li>${escapeHtml(d)}</li>`).join("")}
          </ul>
        </div>
      ` : `
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 0.85rem; border-radius: var(--radius-sm); font-size: 0.8rem; color: #166534;">
          <strong>Academic Excellence:</strong> All academic requirements have been met in full. Scholar is compliant and eligible for continued scholarship funding.
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
