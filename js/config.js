/**
 * Student Scholarship Monitoring and Academic Compliance System
 * System Configuration & Business Constants
 */

window.APP_CONFIG = {
  APP_NAME: "Student Scholarship Monitoring and Academic Compliance System",
  INSTITUTION_NAME: "Agusan del Sur State College of Agriculture and Technology (ASSCAT)",
  COLLEGE_NAME: "College of Computing and Information Sciences (CCIS)",
  CAMPUS_LOCATION: "Bunawan, Agusan del Sur",

  // Default Supabase Cloud Connection Credentials
  SUPABASE_CONFIG: {
    URL: "https://idsjsidpfubgpqzjjwku.supabase.co/rest/v1/",
    ANON_KEY: "sb_publishable_oXTphNq64Q2Ldil2azv2Cg_BRqjn4-h"
  },

  // Storage Keys
  STORAGE_KEYS: {
    SUPABASE_URL: "ssmacs_supabase_url",
    SUPABASE_KEY: "ssmacs_supabase_key",
    DATA_STORE: "ssmacs_local_store_v1",
    AUTH_USER: "ssmacs_auth_user",
    GRADING_SCALE: "ssmacs_grading_scale_setting"
  },

  // Institutional Grading Scales (Requirement 10: "The GWA comparison direction must be configurable")
  GRADING_SCALES: {
    PH_1_TO_5: {
      id: "PH_1_TO_5",
      name: "Philippine System (1.00 Highest to 5.00 Failing)",
      minGwa: 1.00,
      maxGwa: 5.00,
      passingGwa: 3.00,
      lowerIsBetter: true,
      description: "A lower GWA represents higher achievement (e.g., 1.25 is superior to 1.75). Scholar GWA must be <= Required GWA."
    },
    US_4_SCALE: {
      id: "US_4_SCALE",
      name: "US 4.00 System (4.00 Highest to 0.00 Failing)",
      minGwa: 0.00,
      maxGwa: 4.00,
      passingGwa: 2.00,
      lowerIsBetter: false,
      description: "A higher GPA represents higher achievement (e.g., 3.8 is superior to 3.0). Scholar GPA must be >= Required GPA."
    }
  },

  DEFAULT_GRADING_SCALE: "PH_1_TO_5",

  // Scholar Status Lifecycle (Requirement 12)
  SCHOLAR_STATUSES: [
    "Active",
    "Pending Submission",
    "For Verification",
    "Compliant",
    "With Deficiency",
    "Probationary",
    "For Renewal",
    "Renewed",
    "Disqualified"
  ],

  // Submission Statuses (Requirement 8 & 9)
  SUBMISSION_STATUSES: [
    "Pending",
    "For Verification",
    "Verified",
    "Rejected"
  ],

  // User Roles (Requirement 3)
  USER_ROLES: {
    ADMIN: "admin",
    STAFF: "staff",
    SCHOLAR: "scholar"
  },

  // Academic Semesters
  SEMESTERS: [
    "1st Semester",
    "2nd Semester",
    "Summer Term"
  ],

  // Academic Years
  ACADEMIC_YEARS: [
    "2024-2025",
    "2025-2026",
    "2026-2027"
  ]
};
