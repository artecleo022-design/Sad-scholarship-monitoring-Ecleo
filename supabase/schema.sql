-- ==============================================================================
-- Student Scholarship Monitoring and Academic Compliance System
-- PostgreSQL Database Schema & Security Policies (Supabase Compatible)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS & DOMAINS
DO $$ BEGIN
    CREATE TYPE user_role_type AS ENUM ('admin', 'staff', 'scholar');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE scholar_status_type AS ENUM (
        'Active',
        'Pending Submission',
        'For Verification',
        'Compliant',
        'With Deficiency',
        'Probationary',
        'For Renewal',
        'Renewed',
        'Disqualified'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE submission_status_type AS ENUM (
        'Pending',
        'For Verification',
        'Verified',
        'Rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE compliance_result_type AS ENUM (
        'Compliant',
        'With Deficiency'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Supabase auth.users profile sync)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role user_role_type NOT NULL DEFAULT 'scholar',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. SCHOLARSHIP PROGRAMS TABLE
CREATE TABLE IF NOT EXISTS scholarship_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_code TEXT UNIQUE NOT NULL,
    program_name TEXT NOT NULL,
    required_gwa NUMERIC(4,2) NOT NULL,
    min_units INTEGER NOT NULL CHECK (min_units >= 0),
    allow_failing_grade BOOLEAN NOT NULL DEFAULT false,
    active BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. SCHOLARS TABLE
CREATE TABLE IF NOT EXISTS scholars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    degree_program TEXT NOT NULL,
    year_level INTEGER NOT NULL CHECK (year_level BETWEEN 1 AND 6),
    scholarship_id UUID NOT NULL REFERENCES scholarship_programs(id) ON DELETE RESTRICT,
    status scholar_status_type NOT NULL DEFAULT 'Pending Submission',
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. GRADE SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS grade_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scholar_id UUID NOT NULL REFERENCES scholars(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL,
    semester TEXT NOT NULL,
    gwa NUMERIC(4,2) NOT NULL CHECK (gwa >= 1.00 AND gwa <= 5.00),
    units_enrolled INTEGER NOT NULL CHECK (units_enrolled >= 0),
    failed_subjects INTEGER NOT NULL DEFAULT 0 CHECK (failed_subjects >= 0),
    incomplete_subjects INTEGER NOT NULL DEFAULT 0 CHECK (incomplete_subjects >= 0),
    submission_status submission_status_type NOT NULL DEFAULT 'For Verification',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    notes TEXT,
    CONSTRAINT unique_scholar_ay_sem UNIQUE (scholar_id, academic_year, semester)
);

-- 7. COMPLIANCE EVALUATIONS TABLE
CREATE TABLE IF NOT EXISTS compliance_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grade_submission_id UUID UNIQUE NOT NULL REFERENCES grade_submissions(id) ON DELETE CASCADE,
    scholar_id UUID NOT NULL REFERENCES scholars(id) ON DELETE CASCADE,
    result compliance_result_type NOT NULL,
    gwa_requirement_met BOOLEAN NOT NULL,
    units_requirement_met BOOLEAN NOT NULL,
    failing_grade_requirement_met BOOLEAN NOT NULL,
    deficiency_details TEXT,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    evaluated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- 8. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    record_type TEXT NOT NULL,
    record_id TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO system_settings (key, value)
VALUES (
    'grading_scale',
    '{"scale": "PH_1_TO_5", "description": "1.00 Highest / 5.00 Failing (GWA must be <= Required GWA)", "lower_is_better": true}'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarship_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholars ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role_type AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE POLICY "Public profiles viewable by admins and staff"
    ON profiles FOR SELECT
    USING (
        current_user_role() IN ('admin', 'staff') OR
        id = auth.uid()
    );

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "Anyone can view active scholarship programs"
    ON scholarship_programs FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Staff and Admins can manage scholarship programs"
    ON scholarship_programs FOR ALL
    TO authenticated
    USING (current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Scholars view own profile, staff/admin view all"
    ON scholars FOR SELECT
    TO authenticated
    USING (
        current_user_role() IN ('admin', 'staff') OR
        user_id = auth.uid()
    );

CREATE POLICY "Staff and Admins can manage scholars"
    ON scholars FOR ALL
    TO authenticated
    USING (current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Scholars view own submissions, staff/admin view all"
    ON grade_submissions FOR SELECT
    TO authenticated
    USING (
        current_user_role() IN ('admin', 'staff') OR
        scholar_id IN (SELECT id FROM scholars WHERE user_id = auth.uid())
    );

CREATE POLICY "Scholars can insert their own grade submissions"
    ON grade_submissions FOR INSERT
    TO authenticated
    WITH CHECK (
        scholar_id IN (SELECT id FROM scholars WHERE user_id = auth.uid()) OR
        current_user_role() IN ('admin', 'staff')
    );

CREATE POLICY "Only staff/admin can verify or update submissions"
    ON grade_submissions FOR UPDATE
    TO authenticated
    USING (current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Scholars view own evaluations, staff/admin view all"
    ON compliance_evaluations FOR SELECT
    TO authenticated
    USING (
        current_user_role() IN ('admin', 'staff') OR
        scholar_id IN (SELECT id FROM scholars WHERE user_id = auth.uid())
    );

CREATE POLICY "Only staff/admin can record compliance evaluations"
    ON compliance_evaluations FOR ALL
    TO authenticated
    USING (current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Authenticated users view settings"
    ON system_settings FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins manage settings"
    ON system_settings FOR ALL
    TO authenticated
    USING (current_user_role() = 'admin');

CREATE POLICY "Admins and Staff view audit logs"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (current_user_role() IN ('admin', 'staff'));

CREATE POLICY "System can record audit logs"
    ON audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 11. SAMPLE DATA
INSERT INTO scholarship_programs (id, program_code, program_name, required_gwa, min_units, allow_failing_grade, active, description)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'PRES-EXC', 'Presidential Academic Excellence Scholarship', 1.50, 18, false, true, 'Full academic scholarship for university top achievers. Strictly no failing grades.'),
    ('22222222-2222-2222-2222-222222222222', 'CHED-TDP', 'CHED Tulong Dunong Program', 2.00, 15, false, true, 'Government tertiary scholarship supporting qualified underprivileged scholars.'),
    ('33333333-3333-3333-3333-333333333333', 'LGU-LEAD', 'City Leadership & Youth Development Grant', 2.25, 15, true, true, 'Local government grant focusing on student leaders and community service. Allows 1 failing grade if units satisfied.'),
    ('44444444-4444-4444-4444-444444444444', 'STEM-INNOV', 'DOST-SEI Science & Technology Scholarship', 1.75, 18, false, true, 'National scholarship for engineering, science, and computing majors with high academic benchmarks.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO scholars (id, student_id, full_name, degree_program, year_level, scholarship_id, status, email)
VALUES
    ('a1111111-1111-1111-1111-111111111111', '2023-01042', 'Maria Clara Santos', 'BS Computer Science', 3, '11111111-1111-1111-1111-111111111111', 'Compliant', 'maria.santos@university.edu.ph'),
    ('b2222222-2222-2222-2222-222222222222', '2023-01189', 'Juan Dela Cruz', 'BS Information Technology', 2, '22222222-2222-2222-2222-222222222222', 'With Deficiency', 'juan.delacruz@university.edu.ph'),
    ('c3333333-3333-3333-3333-333333333333', '2024-00512', 'Bea Nicole Alonzo', 'BS Civil Engineering', 1, '44444444-4444-4444-4444-444444444444', 'Pending Submission', 'bea.alonzo@university.edu.ph'),
    ('d4444444-4444-4444-4444-444444444444', '2022-03491', 'Jose Protacio Rizal', 'BS Biology', 4, '33333333-3333-3333-3333-333333333333', 'For Verification', 'jose.rizal@university.edu.ph'),
    ('e5555555-5555-5555-5555-555555555555', '2022-01994', 'Gabriela Silang', 'BS Accountancy', 4, '11111111-1111-1111-1111-111111111111', 'For Renewal', 'gabriela.silang@university.edu.ph')
ON CONFLICT (id) DO NOTHING;

INSERT INTO grade_submissions (id, scholar_id, academic_year, semester, gwa, units_enrolled, failed_subjects, incomplete_subjects, submission_status, submitted_at, verified_at)
VALUES
    ('f1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '2025-2026', '1st Semester', 1.35, 21, 0, 0, 'Verified', NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days'),
    ('f2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', '2025-2026', '1st Semester', 2.30, 18, 1, 0, 'Verified', NOW() - INTERVAL '6 days', NOW() - INTERVAL '4 days'),
    ('f3333333-3333-3333-3333-333333333333', 'd4444444-4444-4444-4444-444444444444', '2025-2026', '1st Semester', 1.70, 18, 0, 0, 'For Verification', NOW() - INTERVAL '1 day', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO compliance_evaluations (id, grade_submission_id, scholar_id, result, gwa_requirement_met, units_requirement_met, failing_grade_requirement_met, deficiency_details, evaluated_at)
VALUES
    ('fa111111-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Compliant', true, true, true, 'All academic requirements satisfied.', NOW() - INTERVAL '8 days'),
    ('fa222222-2222-2222-2222-222222222222', 'f2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'With Deficiency', false, true, false, 'GWA 2.30 did not meet minimum required GWA of 2.00; Incurred 1 failing subject (policy prohibits failing grades)', NOW() - INTERVAL '4 days')
ON CONFLICT (id) DO NOTHING;
