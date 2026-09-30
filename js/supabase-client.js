/**
 * Student Scholarship Monitoring and Academic Compliance System
 * Supabase Client & Unified Data Storage Layer
 * 
 * Supports both:
 * 1. Live Supabase PostgreSQL database & Auth
 * 2. High-fidelity Offline / Local Sandbox Engine (for instant demonstration & GitHub Pages)
 */

window.DataService = (function() {
  let supabaseClient = null;
  let isLive = false;

  function generateUUID() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === "x" ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Realistic Pre-seeded Data for initial run (matches Requirement 21 & 22)
  const INITIAL_SEED = {
    scholarship_programs: [
      {
        id: "11111111-1111-1111-1111-111111111111",
        program_code: "PRES-EXC",
        program_name: "Presidential Academic Excellence Scholarship",
        required_gwa: 1.50,
        min_units: 18,
        allow_failing_grade: false,
        active: true,
        description: "Full university scholarship for top tier academic rank holders. Strict zero-failing policy."
      },
      {
        id: "22222222-2222-2222-2222-222222222222",
        program_code: "CHED-TDP",
        program_name: "CHED Tulong Dunong Program",
        required_gwa: 2.00,
        min_units: 15,
        allow_failing_grade: false,
        active: true,
        description: "Commission on Higher Education state assistance grant for qualified college students."
      },
      {
        id: "33333333-3333-3333-3333-333333333333",
        program_code: "LGU-LEAD",
        program_name: "City Leadership & Youth Development Grant",
        required_gwa: 2.25,
        min_units: 15,
        allow_failing_grade: true,
        active: true,
        description: "Local municipal scholarship supporting youth leaders; allows 1 deficiency with probation."
      },
      {
        id: "44444444-4444-4444-4444-444444444444",
        program_code: "STEM-INNOV",
        program_name: "DOST-SEI Science & Technology Scholarship",
        required_gwa: 1.75,
        min_units: 18,
        allow_failing_grade: false,
        active: true,
        description: "National priority scholarship for Engineering and Computer Science undergraduates."
      }
    ],
    scholars: [
      {
        id: "a1111111-1111-1111-1111-111111111111",
        student_id: "2023-01042",
        full_name: "Maria Clara Santos",
        degree_program: "BS Computer Science",
        year_level: 3,
        scholarship_id: "11111111-1111-1111-1111-111111111111",
        status: "Compliant",
        email: "maria.santos@university.edu.ph",
        created_at: "2024-08-15T08:00:00.000Z",
        updated_at: "2026-09-20T10:00:00.000Z"
      },
      {
        id: "b2222222-2222-2222-2222-222222222222",
        student_id: "2023-01189",
        full_name: "Juan Dela Cruz",
        degree_program: "BS Information Technology",
        year_level: 2,
        scholarship_id: "22222222-2222-2222-2222-222222222222",
        status: "With Deficiency",
        email: "juan.delacruz@university.edu.ph",
        created_at: "2024-08-16T09:00:00.000Z",
        updated_at: "2026-09-22T14:30:00.000Z"
      },
      {
        id: "c3333333-3333-3333-3333-333333333333",
        student_id: "2024-00512",
        full_name: "Bea Nicole Alonzo",
        degree_program: "BS Civil Engineering",
        year_level: 1,
        scholarship_id: "44444444-4444-4444-4444-444444444444",
        status: "Pending Submission",
        email: "bea.alonzo@university.edu.ph",
        created_at: "2024-09-01T11:00:00.000Z",
        updated_at: "2024-09-01T11:00:00.000Z"
      },
      {
        id: "d4444444-4444-4444-4444-444444444444",
        student_id: "2022-03491",
        full_name: "Jose Protacio Rizal",
        degree_program: "BS Biology",
        year_level: 4,
        scholarship_id: "33333333-3333-3333-3333-333333333333",
        status: "For Verification",
        email: "jose.rizal@university.edu.ph",
        created_at: "2024-08-10T08:30:00.000Z",
        updated_at: "2026-09-25T09:15:00.000Z"
      },
      {
        id: "e5555555-5555-5555-5555-555555555555",
        student_id: "2022-01994",
        full_name: "Gabriela Silang",
        degree_program: "BS Accountancy",
        year_level: 4,
        scholarship_id: "11111111-1111-1111-1111-111111111111",
        status: "For Renewal",
        email: "gabriela.silang@university.edu.ph",
        created_at: "2024-08-12T07:45:00.000Z",
        updated_at: "2026-09-18T16:00:00.000Z"
      }
    ],
    grade_submissions: [
      {
        id: "f1111111-1111-1111-1111-111111111111",
        scholar_id: "a1111111-1111-1111-1111-111111111111",
        academic_year: "2025-2026",
        semester: "1st Semester",
        gwa: 1.35,
        units_enrolled: 21,
        failed_subjects: 0,
        incomplete_subjects: 0,
        submission_status: "Verified",
        submitted_at: "2026-09-15T09:00:00.000Z",
        verified_by: "Scholarship Staff Officer",
        verified_at: "2026-09-16T11:20:00.000Z"
      },
      {
        id: "f2222222-2222-2222-2222-222222222222",
        scholar_id: "b2222222-2222-2222-2222-222222222222",
        academic_year: "2025-2026",
        semester: "1st Semester",
        gwa: 2.30,
        units_enrolled: 18,
        failed_subjects: 1,
        incomplete_subjects: 0,
        submission_status: "Verified",
        submitted_at: "2026-09-18T13:45:00.000Z",
        verified_by: "Admin Specialist",
        verified_at: "2026-09-19T10:00:00.000Z"
      },
      {
        id: "f3333333-3333-3333-3333-333333333333",
        scholar_id: "d4444444-4444-4444-4444-444444444444",
        academic_year: "2025-2026",
        semester: "1st Semester",
        gwa: 1.70,
        units_enrolled: 18,
        failed_subjects: 0,
        incomplete_subjects: 0,
        submission_status: "For Verification",
        submitted_at: "2026-09-28T14:10:00.000Z",
        verified_by: null,
        verified_at: null
      }
    ],
    compliance_evaluations: [
      {
        id: "fa111111-1111-1111-1111-111111111111",
        grade_submission_id: "f1111111-1111-1111-1111-111111111111",
        scholar_id: "a1111111-1111-1111-1111-111111111111",
        result: "Compliant",
        gwa_requirement_met: true,
        units_requirement_met: true,
        failing_grade_requirement_met: true,
        deficiency_details: "All academic compliance requirements fully satisfied.",
        evaluated_at: "2026-09-16T11:20:05.000Z",
        evaluated_by: "Automated Compliance System"
      },
      {
        id: "fa222222-2222-2222-2222-222222222222",
        grade_submission_id: "f2222222-2222-2222-2222-222222222222",
        scholar_id: "b2222222-2222-2222-2222-222222222222",
        result: "With Deficiency",
        gwa_requirement_met: false,
        units_requirement_met: true,
        failing_grade_requirement_met: false,
        deficiency_details: "GWA requirement not satisfied: Achieved 2.30, but 2.00 or better is required • Failing grade policy violated: Incurred 1 failing subject(s), but this scholarship strictly prohibits failing grades.",
        evaluated_at: "2026-09-19T10:00:05.000Z",
        evaluated_by: "Automated Compliance System"
      }
    ],
    audit_logs: [
      {
        id: "aa111111-1111-1111-1111-111111111111",
        user_id: "system",
        user_name: "Automated System",
        action: "COMPLIANCE_EVALUATION",
        record_type: "compliance_evaluations",
        record_id: "fa111111-1111-1111-1111-111111111111",
        details: { result: "Compliant", scholar: "Maria Clara Santos" },
        created_at: "2026-09-16T11:20:05.000Z"
      },
      {
        id: "aa222222-2222-2222-2222-222222222222",
        user_id: "staff-1",
        user_name: "Scholarship Staff",
        action: "GRADE_VERIFICATION",
        record_type: "grade_submissions",
        record_id: "f1111111-1111-1111-1111-111111111111",
        details: { verified_by: "Staff Officer", status: "Verified" },
        created_at: "2026-09-16T11:20:00.000Z"
      },
      {
        id: "aa333333-3333-3333-3333-333333333333",
        user_id: "system",
        user_name: "Automated System",
        action: "COMPLIANCE_EVALUATION",
        record_type: "compliance_evaluations",
        record_id: "fa222222-2222-2222-2222-222222222222",
        details: { result: "With Deficiency", scholar: "Juan Dela Cruz" },
        created_at: "2026-09-19T10:00:05.000Z"
      }
    ]
  };

  /**
   * Initialize Local Storage Store
   */
  function getLocalStore() {
    try {
      const raw = localStorage.getItem(window.APP_CONFIG.STORAGE_KEYS.DATA_STORE);
      if (!raw) {
        localStorage.setItem(window.APP_CONFIG.STORAGE_KEYS.DATA_STORE, JSON.stringify(INITIAL_SEED));
        return JSON.parse(JSON.stringify(INITIAL_SEED));
      }
      return JSON.parse(raw);
    } catch (e) {
      console.warn("Storage parse error, resetting to initial seed:", e);
      localStorage.setItem(window.APP_CONFIG.STORAGE_KEYS.DATA_STORE, JSON.stringify(INITIAL_SEED));
      return JSON.parse(JSON.stringify(INITIAL_SEED));
    }
  }

  function saveLocalStore(store) {
    localStorage.setItem(window.APP_CONFIG.STORAGE_KEYS.DATA_STORE, JSON.stringify(store));
  }

  function cleanSupabaseUrl(rawUrl) {
    if (!rawUrl) return "";
    let clean = String(rawUrl).trim();
    clean = clean.replace(/\/+$/, "");
    clean = clean.replace(/\/rest\/v1\/?$/i, "");
    return clean;
  }

  /**
   * Initialize Supabase Client if URL and Key exist
   */
  async function init() {
    let url = localStorage.getItem(window.APP_CONFIG.STORAGE_KEYS.SUPABASE_URL);
    let key = localStorage.getItem(window.APP_CONFIG.STORAGE_KEYS.SUPABASE_KEY);

    // Fall back to configured institutional credentials if not overridden in localStorage
    if (!url && window.APP_CONFIG && window.APP_CONFIG.SUPABASE_CONFIG) {
      url = window.APP_CONFIG.SUPABASE_CONFIG.URL;
    }
    if (!key && window.APP_CONFIG && window.APP_CONFIG.SUPABASE_CONFIG) {
      key = window.APP_CONFIG.SUPABASE_CONFIG.ANON_KEY;
    }

    url = cleanSupabaseUrl(url);
    if (key) key = String(key).trim();

    if (url && key && window.supabase) {
      try {
        supabaseClient = window.supabase.createClient(url, key);
        // Test connection
        const { error } = await supabaseClient.from("scholarship_programs").select("id").limit(1);
        if (!error) {
          isLive = true;
          console.log("Connected to Live Supabase Database successfully at:", url);
        } else {
          console.warn("Supabase credentials supplied but returned error:", error.message);
          isLive = false;
        }
      } catch (err) {
        console.warn("Could not connect to Supabase, running in Sandbox Mode:", err);
        isLive = false;
      }
    } else {
      isLive = false;
    }

    // Ensure local store initialized
    getLocalStore();
    return { isLive, supabaseClient };
  }

  // --- SCHOLARS ---
  async function getScholars(filters = {}) {
    if (isLive && supabaseClient) {
      let query = supabaseClient.from("scholars").select("*, scholarship_programs(*)");
      if (filters.status) query = query.eq("status", filters.status);
      if (filters.scholarship_id) query = query.eq("scholarship_id", filters.scholarship_id);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map(s => ({
          ...s,
          scholarship_program: s.scholarship_program || s.scholarship_programs || null
        }));
      }
    }

    // Local Store Fallback
    const store = getLocalStore();
    let scholars = [...store.scholars];

    if (filters.status) {
      scholars = scholars.filter(s => s.status === filters.status);
    }
    if (filters.scholarship_id) {
      scholars = scholars.filter(s => s.scholarship_id === filters.scholarship_id);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      scholars = scholars.filter(s => 
        (s.student_id && s.student_id.toLowerCase().includes(q)) ||
        (s.full_name && s.full_name.toLowerCase().includes(q)) ||
        (s.degree_program && s.degree_program.toLowerCase().includes(q))
      );
    }

    // Attach scholarship program object for easy display
    scholars = scholars.map(s => {
      const prog = store.scholarship_programs.find(p => p.id === s.scholarship_id);
      return { ...s, scholarship_program: prog || null };
    });

    return scholars;
  }

  async function getScholarById(id) {
    const scholars = await getScholars();
    return scholars.find(s => s.id === id) || null;
  }

  async function createScholar(data) {
    // Validate Student ID uniqueness (Requirement 6: Student ID must be unique)
    const store = getLocalStore();
    const existing = store.scholars.find(s => s.student_id.toLowerCase().trim() === data.student_id.toLowerCase().trim());
    if (existing) {
      throw new Error(`Validation Error: Student ID "${data.student_id}" already exists in the system.`);
    }

    const newScholar = {
      id: generateUUID(),
      student_id: data.student_id.trim(),
      full_name: data.full_name.trim(),
      degree_program: data.degree_program.trim(),
      year_level: parseInt(data.year_level, 10),
      scholarship_id: data.scholarship_id,
      status: data.status || "Pending Submission",
      email: data.email || `${data.student_id.toLowerCase()}@university.edu.ph`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (isLive && supabaseClient) {
      const { data: dbData, error } = await supabaseClient.from("scholars").insert([newScholar]).select();
      if (error) throw new Error(error.message);
      if (dbData && dbData[0]) newScholar.id = dbData[0].id;
    }

    store.scholars.unshift(newScholar);
    saveLocalStore(store);

    await logAudit("CREATE_SCHOLAR", "scholars", newScholar.id, {
      student_id: newScholar.student_id,
      full_name: newScholar.full_name
    });

    return newScholar;
  }

  async function updateScholar(id, updateData) {
    const store = getLocalStore();
    const index = store.scholars.findIndex(s => s.id === id);
    if (index === -1) throw new Error("Scholar record not found.");

    // If student_id changed, check uniqueness
    if (updateData.student_id) {
      const duplicate = store.scholars.find(s => s.id !== id && s.student_id.toLowerCase().trim() === updateData.student_id.toLowerCase().trim());
      if (duplicate) throw new Error(`Validation Error: Student ID "${updateData.student_id}" is already used by another scholar.`);
    }

    const updated = {
      ...store.scholars[index],
      ...updateData,
      updated_at: new Date().toISOString()
    };

    if (isLive && supabaseClient) {
      const { error } = await supabaseClient.from("scholars").update(updateData).eq("id", id);
      if (error) console.warn("Supabase update error:", error.message);
    }

    store.scholars[index] = updated;
    saveLocalStore(store);

    await logAudit("UPDATE_SCHOLAR", "scholars", id, updateData);
    return updated;
  }

  // --- SCHOLARSHIP PROGRAMS ---
  async function getScholarships() {
    if (isLive && supabaseClient) {
      const { data, error } = await supabaseClient.from("scholarship_programs").select("*").order("program_name");
      if (!error && data && data.length > 0) return data;
    }

    const store = getLocalStore();
    return store.scholarship_programs;
  }

  async function getScholarshipById(id) {
    const list = await getScholarships();
    return list.find(p => p.id === id) || null;
  }

  async function createScholarship(progData) {
    const store = getLocalStore();
    const newProg = {
      id: generateUUID(),
      program_code: progData.program_code.trim().toUpperCase(),
      program_name: progData.program_name.trim(),
      required_gwa: parseFloat(progData.required_gwa),
      min_units: parseInt(progData.min_units, 10),
      allow_failing_grade: Boolean(progData.allow_failing_grade),
      active: progData.active !== undefined ? Boolean(progData.active) : true,
      description: progData.description || "",
      created_at: new Date().toISOString()
    };

    if (isLive && supabaseClient) {
      const { data: dbData, error } = await supabaseClient.from("scholarship_programs").insert([newProg]).select();
      if (error) throw new Error(error.message);
      if (dbData && dbData[0]) newProg.id = dbData[0].id;
    }

    store.scholarship_programs.push(newProg);
    saveLocalStore(store);

    await logAudit("CREATE_SCHOLARSHIP", "scholarship_programs", newProg.id, {
      program_name: newProg.program_name,
      required_gwa: newProg.required_gwa
    });

    return newProg;
  }

  async function updateScholarship(id, updateData) {
    const store = getLocalStore();
    const idx = store.scholarship_programs.findIndex(p => p.id === id);
    if (idx === -1) throw new Error("Scholarship program not found.");

    store.scholarship_programs[idx] = {
      ...store.scholarship_programs[idx],
      ...updateData
    };

    if (isLive && supabaseClient) {
      await supabaseClient.from("scholarship_programs").update(updateData).eq("id", id);
    }

    saveLocalStore(store);
    await logAudit("UPDATE_SCHOLARSHIP", "scholarship_programs", id, updateData);
    return store.scholarship_programs[idx];
  }

  // --- GRADE SUBMISSIONS ---
  async function getSubmissions(filters = {}) {
    const store = getLocalStore();
    let submissions = [...store.grade_submissions];

    if (filters.scholar_id) {
      submissions = submissions.filter(sub => sub.scholar_id === filters.scholar_id);
    }
    if (filters.status) {
      submissions = submissions.filter(sub => sub.submission_status === filters.status);
    }
    if (filters.academic_year) {
      submissions = submissions.filter(sub => sub.academic_year === filters.academic_year);
    }

    // Enrich with scholar and scholarship details
    submissions = submissions.map(sub => {
      const scholar = store.scholars.find(s => s.id === sub.scholar_id);
      const scholarship = scholar ? store.scholarship_programs.find(p => p.id === scholar.scholarship_id) : null;
      const evaluation = store.compliance_evaluations.find(e => e.grade_submission_id === sub.id);
      return {
        ...sub,
        scholar: scholar || null,
        scholarship: scholarship || null,
        evaluation: evaluation || null
      };
    });

    return submissions.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
  }

  async function createSubmission(data) {
    // Validate inputs (Requirement 8)
    if (!data.scholar_id) throw new Error("Validation Error: Scholar is required.");
    if (!data.academic_year) throw new Error("Validation Error: Academic Year is required.");
    if (!data.semester) throw new Error("Validation Error: Semester is required.");

    const gwa = parseFloat(data.gwa);
    if (isNaN(gwa) || gwa < 1.00 || gwa > 5.00) {
      throw new Error("Validation Error: GWA must be within the institutional range (1.00 - 5.00).");
    }

    const units = parseInt(data.units_enrolled, 10);
    if (isNaN(units) || units < 0) {
      throw new Error("Validation Error: Units enrolled cannot be negative.");
    }

    const failed = parseInt(data.failed_subjects, 10) || 0;
    if (failed < 0) throw new Error("Validation Error: Failed subjects cannot be negative.");

    const incomplete = parseInt(data.incomplete_subjects, 10) || 0;
    if (incomplete < 0) throw new Error("Validation Error: Incomplete subjects cannot be negative.");

    const store = getLocalStore();

    // Check duplicate submission for same scholar, AY, and semester (BR-03)
    const duplicate = store.grade_submissions.find(
      s => s.scholar_id === data.scholar_id && s.academic_year === data.academic_year && s.semester === data.semester
    );
    if (duplicate) {
      throw new Error(`Business Rule BR-03 Violation: A grade submission for ${data.academic_year} (${data.semester}) has already been recorded for this scholar.`);
    }

    const newSub = {
      id: generateUUID(),
      scholar_id: data.scholar_id,
      academic_year: data.academic_year,
      semester: data.semester,
      gwa: gwa,
      units_enrolled: units,
      failed_subjects: failed,
      incomplete_subjects: incomplete,
      submission_status: "For Verification", // Requirement 8: Set to Pending / For Verification
      submitted_at: new Date().toISOString(),
      verified_by: null,
      verified_at: null
    };

    if (isLive && supabaseClient) {
      const { data: dbData, error } = await supabaseClient.from("grade_submissions").insert([newSub]).select();
      if (error) throw new Error(error.message);
      if (dbData && dbData[0]) newSub.id = dbData[0].id;
    }

    store.grade_submissions.unshift(newSub);

    // Update scholar status to "For Verification" (Requirement 12)
    const scholarIdx = store.scholars.findIndex(s => s.id === data.scholar_id);
    if (scholarIdx !== -1) {
      store.scholars[scholarIdx].status = "For Verification";
      store.scholars[scholarIdx].updated_at = new Date().toISOString();
    }

    saveLocalStore(store);

    await logAudit("GRADE_SUBMITTED", "grade_submissions", newSub.id, {
      scholar_id: data.scholar_id,
      gwa: newSub.gwa,
      ay_sem: `${data.academic_year} ${data.semester}`
    });

    return newSub;
  }

  // --- GRADE VERIFICATION & COMPLIANCE EVALUATION ---
  async function verifyAndEvaluateSubmission(submissionId, staffUser) {
    if (!staffUser || (staffUser.role !== "admin" && staffUser.role !== "staff")) {
      throw new Error("Business Rule BR-04 & Requirement 3 Violation: You are not authorized to verify grade submissions. Only authorized Staff or Admin users can perform verification.");
    }

    const store = getLocalStore();
    const subIdx = store.grade_submissions.findIndex(s => s.id === submissionId);
    if (subIdx === -1) throw new Error("Grade submission not found.");

    const submission = store.grade_submissions[subIdx];

    // Business Rule BR-09: A submission cannot be verified twice without an authorized correction process
    if (submission.submission_status === "Verified") {
      throw new Error("Business Rule BR-09 Violation: This submission is already verified and locked against duplicate verification.");
    }

    // 1. Mark Submission as Verified (Requirement 9)
    const verifiedTimestamp = new Date().toISOString();
    submission.submission_status = "Verified";
    submission.verified_by = staffUser.full_name || staffUser.email || "Authorized Staff";
    submission.verified_at = verifiedTimestamp;

    // 2. Fetch Scholar and Assigned Scholarship Program (BR-01, BR-02)
    const scholarIdx = store.scholars.findIndex(s => s.id === submission.scholar_id);
    if (scholarIdx === -1) throw new Error("Associated scholar record was not found.");
    const scholar = store.scholars[scholarIdx];

    const scholarship = store.scholarship_programs.find(p => p.id === scholar.scholarship_id);
    if (!scholarship) {
      throw new Error("Business Rule BR-01 Violation: Scholar is not assigned to an active scholarship program.");
    }

    // 3. Automated Compliance Evaluation (Requirement 10 & 11)
    const evaluationResult = window.ComplianceEngine.evaluate(submission, scholarship);

    const newEval = {
      id: generateUUID(),
      grade_submission_id: submission.id,
      scholar_id: scholar.id,
      result: evaluationResult.result,
      gwa_requirement_met: evaluationResult.gwa_requirement_met,
      units_requirement_met: evaluationResult.units_requirement_met,
      failing_grade_requirement_met: evaluationResult.failing_grade_requirement_met,
      deficiency_details: evaluationResult.deficiency_details,
      evaluated_at: evaluationResult.evaluated_at,
      evaluated_by: `${staffUser.full_name} (${staffUser.role}) via Compliance Engine`
    };

    // Remove old evaluation for this submission if any exists
    store.compliance_evaluations = store.compliance_evaluations.filter(e => e.grade_submission_id !== submission.id);
    store.compliance_evaluations.unshift(newEval);

    // 4. Update Scholar Status based on Compliance Result (Requirement 12)
    scholar.status = evaluationResult.suggested_scholar_status;
    scholar.updated_at = new Date().toISOString();

    saveLocalStore(store);

    // 5. Audit Logging (Requirement 19: Traceability)
    await logAudit("GRADE_VERIFIED", "grade_submissions", submission.id, {
      verified_by: submission.verified_by,
      verified_at: verifiedTimestamp,
      scholar_id: scholar.id
    });

    await logAudit("COMPLIANCE_EVALUATED", "compliance_evaluations", newEval.id, {
      scholar_name: scholar.full_name,
      result: newEval.result,
      deficiencies: evaluationResult.deficiencies
    });

    return {
      submission: submission,
      evaluation: newEval,
      scholar: scholar,
      report: evaluationResult
    };
  }

  // --- COMPLIANCE EVALUATIONS ---
  async function getComplianceEvaluations() {
    const store = getLocalStore();
    return store.compliance_evaluations.map(e => {
      const scholar = store.scholars.find(s => s.id === e.scholar_id);
      const sub = store.grade_submissions.find(g => g.id === e.grade_submission_id);
      const scholarship = scholar ? store.scholarship_programs.find(p => p.id === scholar.scholarship_id) : null;
      return {
        ...e,
        scholar: scholar || null,
        submission: sub || null,
        scholarship: scholarship || null
      };
    });
  }

  // --- RENEWALS (Requirement 14) ---
  async function getRenewalScholars() {
    const store = getLocalStore();
    const renewalStatuses = ["For Renewal", "Renewed", "Disqualified", "With Deficiency"];
    const filtered = store.scholars.filter(s => renewalStatuses.includes(s.status));

    return filtered.map(s => {
      const scholarship = store.scholarship_programs.find(p => p.id === s.scholarship_id);
      // latest evaluation
      const evals = store.compliance_evaluations.filter(e => e.scholar_id === s.id);
      evals.sort((a, b) => new Date(b.evaluated_at) - new Date(a.evaluated_at));
      const latestEval = evals[0] || null;

      return {
        scholar: s,
        scholarship: scholarship,
        latestEvaluation: latestEval
      };
    });
  }

  async function updateRenewalDecision(scholarId, decision, staffUser) {
    if (!staffUser || (staffUser.role !== "admin" && staffUser.role !== "staff")) {
      throw new Error("Unauthorized to perform scholarship renewal decisions.");
    }
    const store = getLocalStore();
    const idx = store.scholars.findIndex(s => s.id === scholarId);
    if (idx === -1) throw new Error("Scholar not found.");

    store.scholars[idx].status = decision; // "Renewed" or "Disqualified" or "Probationary"
    store.scholars[idx].updated_at = new Date().toISOString();
    saveLocalStore(store);

    await logAudit("RENEWAL_DECISION", "scholars", scholarId, {
      decision: decision,
      decided_by: staffUser.full_name
    });

    return store.scholars[idx];
  }

  // --- DASHBOARD LIVE STATISTICS (Requirement 5) ---
  async function getDashboardStats() {
    const store = getLocalStore();

    const totalScholars = store.scholars.length;
    const pendingSubmissions = store.grade_submissions.filter(
      s => s.submission_status === "For Verification" || s.submission_status === "Pending"
    ).length;
    const verifiedSubmissions = store.grade_submissions.filter(
      s => s.submission_status === "Verified"
    ).length;
    const compliantScholars = store.scholars.filter(
      s => s.status === "Compliant"
    ).length;
    const scholarsWithDeficiency = store.scholars.filter(
      s => s.status === "With Deficiency"
    ).length;
    const scholarsForRenewal = store.scholars.filter(
      s => s.status === "For Renewal"
    ).length;

    return {
      totalScholars,
      pendingSubmissions,
      verifiedSubmissions,
      compliantScholars,
      scholarsWithDeficiency,
      scholarsForRenewal
    };
  }

  // --- AUDIT LOGS (Requirement 19) ---
  async function logAudit(action, recordType, recordId, details = {}) {
    const store = getLocalStore();
    const currentUser = window.AuthService ? window.AuthService.getCurrentUser() : null;

    const logEntry = {
      id: generateUUID(),
      user_id: currentUser ? currentUser.id : "system",
      user_name: currentUser ? (currentUser.full_name || currentUser.email) : "System Engine",
      action: action,
      record_type: recordType,
      record_id: String(recordId),
      details: details,
      created_at: new Date().toISOString()
    };

    store.audit_logs.unshift(logEntry);
    if (store.audit_logs.length > 100) store.audit_logs.pop(); // keep last 100
    saveLocalStore(store);

    if (isLive && supabaseClient) {
      try {
        await supabaseClient.from("audit_logs").insert([{
          action: logEntry.action,
          record_type: logEntry.record_type,
          record_id: logEntry.record_id,
          details: logEntry.details
        }]);
      } catch (err) {
        // silent fail on audit remote insert
      }
    }
    return logEntry;
  }

  async function getAuditLogs(limit = 20) {
    const store = getLocalStore();
    return store.audit_logs.slice(0, limit);
  }

  // --- UTILITY: DATA RESET & EXPORT ---
  function resetSampleData() {
    localStorage.setItem(window.APP_CONFIG.STORAGE_KEYS.DATA_STORE, JSON.stringify(INITIAL_SEED));
    return true;
  }

  function exportDatabaseJson() {
    return JSON.stringify(getLocalStore(), null, 2);
  }

  return {
    init: init,
    isUsingLiveSupabase: () => isLive,
    getScholars: getScholars,
    getScholarById: getScholarById,
    createScholar: createScholar,
    updateScholar: updateScholar,
    getScholarships: getScholarships,
    getScholarshipById: getScholarshipById,
    createScholarship: createScholarship,
    updateScholarship: updateScholarship,
    getSubmissions: getSubmissions,
    createSubmission: createSubmission,
    verifyAndEvaluateSubmission: verifyAndEvaluateSubmission,
    getComplianceEvaluations: getComplianceEvaluations,
    getRenewalScholars: getRenewalScholars,
    updateRenewalDecision: updateRenewalDecision,
    getDashboardStats: getDashboardStats,
    getAuditLogs: getAuditLogs,
    logAudit: logAudit,
    resetSampleData: resetSampleData,
    exportDatabaseJson: exportDatabaseJson
  };
})();
