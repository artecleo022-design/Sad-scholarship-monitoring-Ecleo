/**
 * Student Scholarship Monitoring and Academic Compliance System
 * Role-Based Dashboard View Controller
 * 
 * Implements:
 * - Requirement 3 & 5: Dedicated Dashboards for Admin, Staff, and Scholar
 * - Live Database Statistics & Traceable Activity Feeds
 */

window.DashboardView = (function() {

  async function render(container) {
    const user = window.AuthService.getCurrentUser();
    if (!user) {
      window.App.navigate("dashboard");
      return;
    }

    if (user.role === "admin") {
      await renderAdminDashboard(container, user);
    } else if (user.role === "staff") {
      await renderStaffDashboard(container, user);
    } else if (user.role === "scholar") {
      await renderScholarDashboard(container, user);
    } else {
      await renderStaffDashboard(container, user);
    }
  }

  // =========================================================================
  // 1. ADMIN DASHBOARD
  // =========================================================================
  async function renderAdminDashboard(container, user) {
    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h1>System Administrator Dashboard</h1>
          <p>Institutional scholarship governance, policy configuration, compliance metrics, and system audit trail.</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" id="btn-refresh-dash">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
            Refresh
          </button>
          <button class="btn btn-primary btn-sm" onclick="window.App.navigate('scholars')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Register Scholar
          </button>
        </div>
      </div>

      <!-- Admin Identity Banner -->
      <div class="identity-banner">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.85rem;">
          <div>
            <div style="font-weight: 700; color: var(--primary-700); font-size: 0.95rem; display: flex; align-items: center; gap: 8px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Administrator Session: ${escapeHtml(user.full_name)}
            </div>
            <div style="font-size: 0.8rem; color: var(--slate-500); margin-top: 0.25rem;">
              Full system authority active &bull; System policy, evaluation algorithms, and scholar database unlocked.
            </div>
          </div>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button class="btn btn-sm btn-secondary" onclick="window.App.navigate('scholarships')">Programs</button>
            <button class="btn btn-sm btn-secondary" onclick="window.App.navigate('settings')">Grading Scale</button>
            <button class="btn btn-sm btn-primary" onclick="window.App.navigate('verification')">Verification Queue</button>
          </div>
        </div>
      </div>

      <!-- Live KPI Metrics Grid (Requirement 5) -->
      <div class="stats-grid">
        <div class="stat-card variant-total">
          <div class="stat-header">
            <span class="stat-label">Total Scholars</span>
            <span class="stat-icon">🎓</span>
          </div>
          <div class="stat-value" id="kpi-total-scholars">-</div>
          <div class="stat-desc">Enrolled scholars</div>
        </div>

        <div class="stat-card variant-pending">
          <div class="stat-header">
            <span class="stat-label">Pending Verification</span>
            <span class="stat-icon">⏳</span>
          </div>
          <div class="stat-value" id="kpi-pending-submissions">-</div>
          <div class="stat-desc">Unverified grade records</div>
        </div>

        <div class="stat-card variant-verified">
          <div class="stat-header">
            <span class="stat-label">Verified Submissions</span>
            <span class="stat-icon">📋</span>
          </div>
          <div class="stat-value" id="kpi-verified-submissions">-</div>
          <div class="stat-desc">Officially verified records</div>
        </div>

        <div class="stat-card variant-compliant">
          <div class="stat-header">
            <span class="stat-label">Compliant Scholars</span>
            <span class="stat-icon">✅</span>
          </div>
          <div class="stat-value" id="kpi-compliant-scholars">-</div>
          <div class="stat-desc">Satisfied all academic benchmarks</div>
        </div>

        <div class="stat-card variant-deficiency">
          <div class="stat-header">
            <span class="stat-label">With Deficiency</span>
            <span class="stat-icon">⚠️</span>
          </div>
          <div class="stat-value" id="kpi-deficiency-scholars">-</div>
          <div class="stat-desc">Flagged for academic intervention</div>
        </div>

        <div class="stat-card variant-renewal">
          <div class="stat-header">
            <span class="stat-label">For Renewal</span>
            <span class="stat-icon">🔄</span>
          </div>
          <div class="stat-value" id="kpi-renewal-scholars">-</div>
          <div class="stat-desc">Eligible for grant extension</div>
        </div>
      </div>

      <!-- Admin Two-Column Layout -->
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem;" class="dashboard-columns">
        <!-- Traceable Audit Feed (Requirement 19) -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">🕒 Institutional Audit & Workflow Activity</span>
            <button class="btn btn-sm btn-secondary" onclick="window.App.navigate('reports')">Master Report</button>
          </div>
          <div class="card-body">
            <div class="activity-feed" id="admin-activity-feed">
              <div style="text-align: center; color: var(--text-muted); padding: 1.5rem;">Loading activity...</div>
            </div>
          </div>
        </div>

        <!-- System Governance & Supabase Status -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">⚙️ System Governance</span>
          </div>
          <div class="card-body">
            <div style="font-size: 0.85rem; margin-bottom: 1rem;">
              <strong>Institutional Grading Policy:</strong>
              <div id="dash-scale-name" style="margin-top: 0.25rem; color: var(--primary); font-weight: 600;"></div>
              <div id="dash-scale-desc" style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;"></div>
            </div>

            <div style="border-top: 1px solid var(--border-color); padding-top: 0.75rem; font-size: 0.85rem;">
              <strong>Admin Controls:</strong>
              <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem;">
                <button class="btn btn-secondary btn-sm" style="justify-content: flex-start;" onclick="window.App.navigate('scholarships')">
                  📜 Manage Scholarship Programs
                </button>
                <button class="btn btn-secondary btn-sm" style="justify-content: flex-start;" onclick="window.App.navigate('settings')">
                  ⚡ Supabase & Grading Direction
                </button>
                <button class="btn btn-secondary btn-sm" style="justify-content: flex-start;" onclick="window.App.navigate('reports')">
                  📈 Generate Compliance Master Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    container.querySelector("#btn-refresh-dash").addEventListener("click", () => render(container));
    await loadSharedStats(container);
    await loadAuditFeed(container, "#admin-activity-feed");
  }

  // =========================================================================
  // 2. SCHOLARSHIP STAFF DASHBOARD
  // =========================================================================
  async function renderStaffDashboard(container, user) {
    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h1>Scholarship Evaluator & Staff Desk</h1>
          <p>Evaluate academic compliance, verify submitted semester grades, and monitor scholar status.</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" id="btn-refresh-dash">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
            Refresh Desk
          </button>
          <button class="btn btn-primary btn-sm" onclick="window.App.navigate('verification')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
            Open Verification Desk
          </button>
        </div>
      </div>

      <!-- Staff Desk Callout -->
      <div class="evaluator-banner">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.85rem;">
          <div>
            <div style="font-weight: 700; color: var(--success-700); font-size: 0.95rem; display: flex; align-items: center; gap: 8px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
              Evaluator On Duty: ${escapeHtml(user.full_name)}
            </div>
            <div style="font-size: 0.8rem; color: var(--slate-600); margin-top: 0.25rem;">
              Authorized evaluation desk active &bull; Verification queue and student compliance evaluation unlocked.
            </div>
          </div>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button class="btn btn-sm btn-primary" onclick="window.App.navigate('verification')">Pending Queue</button>
            <button class="btn btn-sm btn-secondary" onclick="window.App.navigate('scholars')">Register Scholar</button>
          </div>
        </div>
      </div>

      <!-- Staff Priority Metrics Grid -->
      <div class="stats-grid">
        <div class="stat-card variant-pending" style="border-color: #f59e0b;">
          <div class="stat-header">
            <span class="stat-label">Pending Verification</span>
            <span class="stat-icon">⏳</span>
          </div>
          <div class="stat-value" id="kpi-pending-submissions" style="color: #d97706;">-</div>
          <div class="stat-desc">Priority submissions awaiting review</div>
        </div>

        <div class="stat-card variant-verified">
          <div class="stat-header">
            <span class="stat-label">Verified Submissions</span>
            <span class="stat-icon">📋</span>
          </div>
          <div class="stat-value" id="kpi-verified-submissions">-</div>
          <div class="stat-desc">Officially verified by staff</div>
        </div>

        <div class="stat-card variant-compliant">
          <div class="stat-header">
            <span class="stat-label">Compliant Scholars</span>
            <span class="stat-icon">✅</span>
          </div>
          <div class="stat-value" id="kpi-compliant-scholars">-</div>
          <div class="stat-desc">Passing all requirements</div>
        </div>

        <div class="stat-card variant-deficiency">
          <div class="stat-header">
            <span class="stat-label">With Deficiency</span>
            <span class="stat-icon">⚠️</span>
          </div>
          <div class="stat-value" id="kpi-deficiency-scholars">-</div>
          <div class="stat-desc">Flagged for academic review</div>
        </div>

        <div class="stat-card variant-renewal">
          <div class="stat-header">
            <span class="stat-label">For Renewal</span>
            <span class="stat-icon">🔄</span>
          </div>
          <div class="stat-value" id="kpi-renewal-scholars">-</div>
          <div class="stat-desc">Eligible for grant renewal</div>
        </div>

        <div class="stat-card variant-total">
          <div class="stat-header">
            <span class="stat-label">Total Scholars</span>
            <span class="stat-icon">🎓</span>
          </div>
          <div class="stat-value" id="kpi-total-scholars">-</div>
          <div class="stat-desc">Total active roster</div>
        </div>
      </div>

      <!-- Staff Two-Column Layout -->
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem;" class="dashboard-columns">
        <!-- Verification Feed -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">✅ Recent Verifications & Compliance Audits</span>
            <button class="btn btn-sm btn-primary" onclick="window.App.navigate('verification')">Open Queue</button>
          </div>
          <div class="card-body">
            <div class="activity-feed" id="staff-activity-feed">
              <div style="text-align: center; color: var(--text-muted); padding: 1.5rem;">Loading activity...</div>
            </div>
          </div>
        </div>

        <!-- Quick Evaluator Links -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">⚡ Evaluator Workflow Shortcuts</span>
          </div>
          <div class="card-body" style="font-size: 0.85rem;">
            <p style="color: var(--text-muted); margin-bottom: 1rem;">
              Standard Academic Compliance Procedure:
            </p>
            <ol style="padding-left: 1.25rem; color: var(--text-muted); line-height: 1.7; font-size: 0.8rem; margin-bottom: 1.25rem;">
              <li>Inspect submitted semester grades vs student transcript</li>
              <li>Execute <strong>Grade Verification</strong></li>
              <li>Engine automatically evaluates GWA, units & failing policy</li>
              <li>Resolve deficiencies with scholar if required</li>
            </ol>

            <button class="btn btn-primary btn-sm" style="width: 100%; margin-bottom: 0.5rem;" onclick="window.App.navigate('verification')">
              Go to Verification Desk
            </button>
            <button class="btn btn-secondary btn-sm" style="width: 100%;" onclick="window.App.navigate('compliance')">
              Review Compliance Results
            </button>
          </div>
        </div>
      </div>
    `;

    container.querySelector("#btn-refresh-dash").addEventListener("click", () => render(container));
    await loadSharedStats(container);
    await loadAuditFeed(container, "#staff-activity-feed");
  }

  // =========================================================================
  // 3. SCHOLAR PERSONAL PORTAL DASHBOARD (Requirement 3: Scholar View)
  // =========================================================================
  async function renderScholarDashboard(container, user) {
    // Find the linked scholar record
    const allScholars = await window.DataService.getScholars();
    let scholar = allScholars.find(s => s.id === user.scholar_id);

    // Fallback: match by email or use first scholar
    if (!scholar && user.email) {
      scholar = allScholars.find(s => s.email && s.email.toLowerCase() === user.email.toLowerCase());
    }
    if (!scholar) {
      scholar = allScholars[1] || allScholars[0]; // fallback to Juan Dela Cruz
    }

    const prog = scholar ? scholar.scholarship_program : null;
    const submissions = scholar ? await window.DataService.getSubmissions({ scholar_id: scholar.id }) : [];
    const latestSub = submissions[0] || null;
    const latestEval = latestSub ? latestSub.evaluation : null;

    const isCompliant = scholar ? scholar.status === "Compliant" || scholar.status === "For Renewal" || scholar.status === "Renewed" : false;
    const hasDeficiency = scholar ? scholar.status === "With Deficiency" || scholar.status === "Probationary" : false;

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h1>Scholar Academic Portal</h1>
          <p>Welcome, <strong>${escapeHtml(scholar ? scholar.full_name : user.full_name)}</strong>! Track your scholarship standing, requirements, and grade filings.</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-primary" onclick="window.App.navigate('submissions')">
            <span>📝</span> Submit Semester Grades
          </button>
        </div>
      </div>

      <!-- Status Alert Banner -->
      ${hasDeficiency ? `
        <div class="compliance-banner deficiency" style="margin-bottom: 1.5rem;">
          <span style="font-size: 1.75rem;">⚠️</span>
          <div>
            <div style="font-weight: 800; font-size: 1.15rem; text-transform: uppercase;">
              CURRENT STANDING: WITH ACADEMIC DEFICIENCY
            </div>
            <div style="font-size: 0.85rem; margin-top: 0.35rem;">
              ${latestEval && latestEval.deficiency_details ? escapeHtml(latestEval.deficiency_details) : 'Your academic performance did not meet one or more retention criteria for your assigned scholarship.'}
            </div>
            <div style="font-size: 0.8rem; margin-top: 0.35rem; font-weight: 600;">
              Please contact the Scholarship Office for academic counseling and probation terms.
            </div>
          </div>
        </div>
      ` : isCompliant ? `
        <div class="compliance-banner compliant" style="margin-bottom: 1.5rem;">
          <span style="font-size: 1.75rem;">✅</span>
          <div>
            <div style="font-weight: 800; font-size: 1.15rem; text-transform: uppercase;">
              CURRENT STANDING: FULLY COMPLIANT
            </div>
            <div style="font-size: 0.85rem; margin-top: 0.25rem;">
              You have satisfied all academic retention standards for the current period. Your scholarship grant remains in excellent standing.
            </div>
          </div>
        </div>
      ` : `
        <div class="card" style="border-left: 4px solid var(--primary); background: #f8fafc; margin-bottom: 1.5rem;">
          <div class="card-body" style="padding: 1rem 1.25rem;">
            <strong style="color: var(--primary);">Academic Standing: ${escapeHtml(scholar ? scholar.status : 'Pending')}</strong>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
              ${scholar && scholar.status === 'For Verification' ? 'Your latest grade submission is under review by the scholarship staff.' : 'Please ensure your semester grades are filed promptly.'}
            </div>
          </div>
        </div>
      `}

      <!-- Scholar Overview Cards -->
      <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));">
        <div class="stat-card variant-total">
          <div class="stat-header">
            <span class="stat-label">Student ID</span>
            <span class="stat-icon">🪪</span>
          </div>
          <div class="stat-value" style="font-size: 1.5rem; font-family: var(--font-mono); color: var(--primary);">
            ${escapeHtml(scholar ? scholar.student_id : 'N/A')}
          </div>
          <div class="stat-desc">${escapeHtml(scholar ? scholar.degree_program : '')} (Year ${scholar ? scholar.year_level : 1})</div>
        </div>

        <div class="stat-card variant-compliant">
          <div class="stat-header">
            <span class="stat-label">Academic Status</span>
            <span class="stat-icon">🎓</span>
          </div>
          <div class="stat-value" style="font-size: 1.35rem;">
            ${escapeHtml(scholar ? scholar.status : 'Active')}
          </div>
          <div class="stat-desc">Official standing on record</div>
        </div>

        <div class="stat-card variant-verified">
          <div class="stat-header">
            <span class="stat-label">Submissions Filed</span>
            <span class="stat-icon">📋</span>
          </div>
          <div class="stat-value">${submissions.length}</div>
          <div class="stat-desc">Semester grade submissions</div>
        </div>

        <div class="stat-card variant-renewal">
          <div class="stat-header">
            <span class="stat-label">Renewal Standing</span>
            <span class="stat-icon">🔄</span>
          </div>
          <div class="stat-value" style="font-size: 1.3rem;">
            ${scholar && scholar.status === 'For Renewal' ? 'Eligible' : scholar && scholar.status === 'Renewed' ? 'Renewed' : 'Pending Term'}
          </div>
          <div class="stat-desc">Grant continuance eligibility</div>
        </div>
      </div>

      <!-- Assigned Scholarship Requirements Box (Requirement 3: Scholar can view assigned scholarship & requirements) -->
      <div class="card" style="margin-bottom: 1.5rem;">
        <div class="card-header">
          <span class="card-title">📜 My Assigned Scholarship Retention Requirements</span>
        </div>
        <div class="card-body">
          ${prog ? `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.25rem;">
              <div>
                <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Grant Program</span>
                <div style="font-size: 1rem; font-weight: 700; color: var(--primary); margin-top: 0.2rem;">${escapeHtml(prog.program_name)}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Code: ${escapeHtml(prog.program_code)}</div>
              </div>

              <div>
                <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Required Retention GWA</span>
                <div style="font-size: 1.35rem; font-weight: 800; color: #1e3a8a; margin-top: 0.2rem;">
                  &le; ${prog.required_gwa.toFixed(2)}
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Must achieve this GWA or better</div>
              </div>

              <div>
                <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Minimum Academic Load</span>
                <div style="font-size: 1.35rem; font-weight: 800; color: var(--text-main); margin-top: 0.2rem;">
                  ${prog.min_units} units
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Regular semester requirement</div>
              </div>

              <div>
                <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Failing Grade Tolerance</span>
                <div style="font-size: 1rem; font-weight: 700; margin-top: 0.25rem; color: ${prog.allow_failing_grade ? 'var(--warning)' : 'var(--danger)'};">
                  ${prog.allow_failing_grade ? '⚠️ Allows 1 on Probation' : '🚫 Strictly Prohibited'}
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Subject retention policy</div>
              </div>
            </div>
            ${prog.description ? `<p style="margin-top: 1rem; font-size: 0.8rem; color: var(--text-muted); border-top: 1px solid var(--border-color); padding-top: 0.75rem;">${escapeHtml(prog.description)}</p>` : ''}
          ` : `
            <div style="color: var(--danger); font-size: 0.85rem;">No scholarship program assigned to this scholar record. Please contact the administrator.</div>
          `}
        </div>
      </div>

      <!-- My Submissions History -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">📝 My Semester Grade Filings & Verification Status</span>
          <button class="btn btn-primary btn-sm" onclick="window.App.navigate('submissions')">File New Grades</button>
        </div>
        <div class="card-body" style="padding: 0;">
          <div class="table-responsive" style="border: none;">
            <table class="app-table">
              <thead>
                <tr>
                  <th>Academic Term</th>
                  <th>Submitted GWA</th>
                  <th>Units</th>
                  <th>Failed / INC</th>
                  <th>Verification Status</th>
                  <th>Compliance Evaluation</th>
                </tr>
              </thead>
              <tbody>
                ${submissions.length === 0 ? `
                  <tr><td colspan="6" class="table-empty">You have not submitted any semester grades yet. Click "File New Grades" to submit.</td></tr>
                ` : submissions.map(sub => `
                  <tr>
                    <td>
                      <strong>${escapeHtml(sub.academic_year)}</strong><br>
                      <span style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(sub.semester)}</span>
                    </td>
                    <td style="font-weight: 800; font-size: 1rem; color: var(--primary);">
                      ${parseFloat(sub.gwa).toFixed(2)}
                    </td>
                    <td>${sub.units_enrolled} units</td>
                    <td>
                      ${sub.failed_subjects > 0 ? `<span style="color: var(--danger); font-weight: 600;">${sub.failed_subjects} Failed</span>` : `0 Failed`}, 
                      ${sub.incomplete_subjects > 0 ? `<span style="color: var(--warning);">${sub.incomplete_subjects} INC</span>` : `0 INC`}
                    </td>
                    <td>
                      <span class="badge ${sub.submission_status === 'Verified' ? 'badge-verified' : 'badge-for-verification'}">
                        ${sub.submission_status}
                      </span>
                      ${sub.verified_by ? `<div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">Verified by: ${escapeHtml(sub.verified_by)}</div>` : '<div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">Awaiting staff review</div>'}
                    </td>
                    <td>
                      ${sub.evaluation ? `
                        <span class="badge ${sub.evaluation.result === 'Compliant' ? 'badge-compliant' : 'badge-with-deficiency'}">
                          ${sub.evaluation.result}
                        </span>
                      ` : '<span style="color: var(--text-light); font-size: 0.8rem;">Evaluated after verification</span>'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // --- Helpers for Shared Stats ---
  async function loadSharedStats(container) {
    try {
      const stats = await window.DataService.getDashboardStats();
      const setVal = (id, val) => {
        const el = container.querySelector(id);
        if (el) el.textContent = val;
      };

      setVal("#kpi-total-scholars", stats.totalScholars);
      setVal("#kpi-pending-submissions", stats.pendingSubmissions);
      setVal("#kpi-verified-submissions", stats.verifiedSubmissions);
      setVal("#kpi-compliant-scholars", stats.compliantScholars);
      setVal("#kpi-deficiency-scholars", stats.scholarsWithDeficiency);
      setVal("#kpi-renewal-scholars", stats.scholarsForRenewal);

      const scale = window.ComplianceEngine.getActiveGradingScale();
      const scaleName = container.querySelector("#dash-scale-name");
      const scaleDesc = container.querySelector("#dash-scale-desc");
      if (scaleName) scaleName.textContent = scale.name;
      if (scaleDesc) scaleDesc.textContent = scale.description;
    } catch (e) {
      console.warn("Error loading stats:", e);
    }
  }

  async function loadAuditFeed(container, selector) {
    const feed = container.querySelector(selector);
    if (!feed) return;

    try {
      const logs = await window.DataService.getAuditLogs(6);
      if (logs.length === 0) {
        feed.innerHTML = `<div class="table-empty">No workflow activity recorded yet.</div>`;
        return;
      }

      feed.innerHTML = logs.map(log => {
        let icon = "📝";
        let iconClass = "submit";
        if (log.action.includes("VERIF")) { icon = "✅"; iconClass = "verify"; }
        else if (log.action.includes("EVAL")) { icon = "⚖️"; iconClass = "eval"; }
        else if (log.action.includes("SCHOLAR")) { icon = "🎓"; iconClass = "scholar"; }

        const time = new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' on ' + new Date(log.created_at).toLocaleDateString();

        return `
          <div class="activity-item">
            <div class="activity-icon ${iconClass}">${icon}</div>
            <div class="activity-content">
              <div class="activity-title">${escapeHtml(log.action.replace(/_/g, ' '))}</div>
              <div class="activity-meta">By ${escapeHtml(log.user_name)} &bull; ${time}</div>
            </div>
          </div>
        `;
      }).join("");
    } catch (e) {
      feed.innerHTML = `<div class="table-empty" style="color: var(--danger);">Failed to load activity log.</div>`;
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
