# Student Scholarship Monitoring and Academic Compliance System

A production-grade, web-based institutional application designed to centralize and automate scholarship monitoring, grade verification, compliance evaluation, deficiency identification, and renewal retention.

---

## 1. System Technology Stack
* **Frontend**: HTML5, Modern Semantic CSS3, Vanilla JavaScript (ES6+ Modular Architecture).
* **Backend & Database**: Supabase (PostgreSQL with Row-Level Security, Supabase Auth, Foreign Key Cascades).
* **Client Library**: Official `@supabase/supabase-js` v2 via CDN.
* **Dual-Engine Architecture**: Operates directly with Supabase Cloud or seamlessly in an interactive Local Sandbox mode with pre-seeded test data, allowing instant testing and demonstration without configuration blockers.
* **Hosting**: 100% compatible with **GitHub Pages**, static CDN hosting, or local HTTP servers.

---

## 2. Core Workflow

```
LOGIN
  │
  ▼
SCHOLAR MANAGEMENT (Create / Search / Multi-Filter / View Profile)
  │
  ▼
SCHOLARSHIP ASSIGNMENT (Define required GWA, minimum units, failing grade policy)
  │
  ▼
GRADE SUBMISSION (Term grades filed -> Status initialized to "For Verification")
  │
  ▼
AUTHORIZED VERIFICATION (Staff/Admin review -> Audit stamp recorded)
  │
  ▼
AUTOMATED COMPLIANCE EVALUATION (GWA comparison direction, units, failing policy)
  │
  ├── Result: COMPLIANT ─────────► Scholar Status: "Compliant" / "For Renewal"
  └── Result: WITH DEFICIENCY ──► Scholar Status: "With Deficiency" / "Probationary"
                                  (Specific deficiencies clearly identified)
  │
  ▼
RENEWAL MONITORING & DASHBOARD METRICS UPDATE
```

---

## 3. Database Design & Supabase PostgreSQL Schema

Located at `supabase/schema.sql`.

### Core Tables
1. **`profiles`**: User identities, roles (`admin`, `staff`, `scholar`), and created timestamps.
2. **`scholarship_programs`**: Grant parameters (`program_code`, `program_name`, `required_gwa`, `min_units`, `allow_failing_grade`, `active`).
3. **`scholars`**: Student records (`student_id` unique, `full_name`, `degree_program`, `year_level`, `scholarship_id`, `status`).
4. **`grade_submissions`**: Academic filings (`scholar_id`, `academic_year`, `semester`, `gwa`, `units_enrolled`, `failed_subjects`, `incomplete_subjects`, `submission_status`, `verified_by`, `verified_at`).
5. **`compliance_evaluations`**: Evaluation outputs (`grade_submission_id`, `scholar_id`, `result`, `gwa_requirement_met`, `units_requirement_met`, `failing_grade_requirement_met`, `deficiency_details`, `evaluated_at`).
6. **`audit_logs`**: Traceability of all verification, compliance, and update actions (`user_id`, `action`, `record_type`, `record_id`, `details`, `created_at`).
7. **`system_settings`**: Configurable institutional grading scale and comparison directions.

---

## 4. User Roles & Role-Based Permissions

| Capability | Admin | Staff | Scholar |
|---|:---:|:---:|:---:|
| View Live Dashboard KPIs | ✅ | ✅ | ✅ (Personalized) |
| Register & Edit Scholars | ✅ | ✅ | ❌ |
| Configure Scholarship Programs | ✅ | ✅ | ❌ (Read-only) |
| Submit Semester Grades | ✅ | ✅ | ✅ (Own profile) |
| Verify Grade Submissions | ✅ | ✅ | ❌ **Strictly Forbidden** |
| Run Compliance Evaluation | ✅ | ✅ | ❌ |
| Record Renewal Decisions | ✅ | ✅ | ❌ |
| Configure Institutional Grading Scale | ✅ | ❌ | ❌ |
| Export Database / Reset Sample Data | ✅ | ❌ | ❌ |

---

## 5. Business Rules Implemented

* **BR-01**: Every scholar must be assigned to an active scholarship program.
* **BR-02**: Every scholarship program must define its unique academic requirements (different GWA benchmarks and unit loads).
* **BR-03**: Every grade submission must belong to one scholar, academic year, and semester.
* **BR-04**: Only authorized personnel (Staff/Admin) may verify submitted grades; scholars cannot verify their own submissions.
* **BR-05**: Only verified submissions may be used for final compliance evaluation.
* **BR-06**: A scholar cannot be marked Compliant while mandatory requirements are incomplete or unverified.
* **BR-07**: Scholar status must be based on the rules of the assigned scholarship program.
* **BR-08**: Changes to verified academic records must be traceable through audit logs.
* **BR-09**: A submission cannot be verified twice without an authorized correction process.
* **BR-10**: Sensitive grade information must only be visible to authorized users.

---

## 6. Configurable Institutional Grading Scale (Requirement 10)

The system supports configurable grading directions under **System Settings**:
1. **Philippine System (1.00 Highest to 5.00 Failing)** *(Default)*:
   - Lower is better: `Scholar GWA <= Required GWA` satisfies requirement (e.g. 1.45 achieves requirement of 1.75).
2. **US 4.00 Scale (4.00 Highest to 0.00 Failing)**:
   - Higher is better: `Scholar GPA >= Required GPA` satisfies requirement.

---

## 7. Step-by-Step Demonstration Walkthrough (All 22 Steps)

Use the top **Demo Role Switcher** (`Admin` | `Staff` | `Scholar`) or the login key icon:

1. **Login using an authorized account**: Select `Admin` or `Staff` in the top bar.
2. **Open Dashboard**: Note the real-time KPI counters (`Total Scholars`, `Pending Submissions`, `Verified Submissions`, `Compliant`, `With Deficiency`, `For Renewal`).
3. **Register a new scholar**:
   - Go to **Scholar Records** &gt; click **Register New Scholar**.
   - Enter Student ID: `2026-00999`, Full Name: `Carlos P. Garcia`, Degree: `BS Electrical Engineering`, Year: `2`.
4. **Assign scholarship program**: Select `Presidential Academic Excellence Scholarship` (Req GWA: 1.50, Min Units: 18, Zero Failures).
5. **View scholarship requirements**: Open **Scholarship Programs** page to examine the program's specific benchmarks.
6. **Create a semester grade submission**:
   - Go to **Grade Submissions** &gt; click **New Grade Submission Form**.
   - Select `Carlos P. Garcia`, AY: `2025-2026`, Semester: `1st Semester`.
   - Enter compliant grades: GWA: `1.40`, Units: `19`, Failed: `0`, Incomplete: `0`.
7. **Show initial status**: Note that the submission status is immediately set to **`For Verification`** (not verified yet).
8. **Switch role to authorized staff**: Switch to `Staff` in the top bar.
9. **Open pending submission**: Go to **Grade Verification** desk &gt; locate Carlos Garcia's pending entry &gt; click **Review & Verify**.
10. **Verify the submission**: Click **Verify Submission & Run Compliance Evaluation**.
11. **Automatic compliance evaluation**: The system compares GWA 1.40 vs Required 1.50, Units 19 vs 18, and 0 failed subjects.
12. **Show Compliant status**: The modal pops up showing **`COMPLIANCE RESULT: Compliant`** with green checkmarks.
13. **Open scholar record**: Go to **Scholar Records** &gt; click **View** on Carlos Garcia.
14. **Show updated scholar status**: Notice scholar status has automatically updated to **`Compliant`**.
15. **Search for scholar**: Type `Garcia` in the search bar. Real-time filtering shows only matching records.
16. **Filter scholars**: Filter by Scholarship Program or Status (`Compliant`).
17. **Show dashboard counts updating**: Return to **Dashboard**; observe `Compliant Scholars` and `Verified Submissions` incremented.
18. **Demonstrate With Deficiency (Failure Case)**:
   - Go to **Grade Submissions** &gt; submit another record for a scholar with GWA `2.35` (below requirement) and `1` failed subject.
   - Go to **Grade Verification** &gt; verify the submission.
   - Observe the immediate **`COMPLIANCE RESULT: With Deficiency`** warning.
   - Check **Compliance Results** &gt; **Examine Breakdown** to see the clear, itemized deficiency reasons (Requirement 11).
19. **Test Scholar Role Security**:
   - Switch role to `Scholar`.
   - Try visiting **Grade Verification**; note the access warning and disabled verify buttons.
20. **Renewal Monitoring**: Go to **Renewal Monitoring** to review scholars for renewal and record grant retention decisions.

---

## 8. Connecting to Supabase Cloud

1. Create a free project on [Supabase](https://supabase.com).
2. Go to **SQL Editor** &gt; paste and execute the entire script from `supabase/schema.sql`.
3. In your Supabase Dashboard, go to **Project Settings &gt; API**.
4. Copy the **Project URL** and the **anon public** key.
5. In this web application, open **System & Supabase** (or click the database status pill).
6. Paste the URL and Anon Key and click **Save & Connect to Supabase**.
7. The system status will update to **Connected to Live Cloud Database**!

---

## 9. GitHub Pages Deployment

1. Commit and push the repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Student Scholarship Monitoring System"
   git remote add origin https://github.com/your-username/scholarship-compliance-system.git
   git push -u origin main
   ```
2. In GitHub, navigate to **Settings &gt; Pages**.
3. Under **Branch**, select `main` branch and `/ (root)` directory, then click **Save**.
4. Your application will be live at `https://your-username.github.io/scholarship-compliance-system/`.
