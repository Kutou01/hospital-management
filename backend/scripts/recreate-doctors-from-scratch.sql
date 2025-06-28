-- =====================================================
-- RECREATE DOCTORS TABLE AND POPULATE FROM PROFILES
-- =====================================================
-- Complete script to recreate doctors table and populate from existing profiles
-- Run this directly in Supabase SQL Editor

-- 1. DROP EXISTING DOCTORS TABLE (if exists)
-- =====================================================

DROP TABLE IF EXISTS doctors CASCADE;

-- 2. CREATE DOCTORS TABLE
-- =====================================================

CREATE TABLE doctors (
    -- Primary Key
    doctor_id VARCHAR(20) PRIMARY KEY,

    -- Foreign Key to profiles table
    profile_id UUID NOT NULL,

    -- Basic Information
    full_name TEXT NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    qualification TEXT NOT NULL,
    department_id VARCHAR(20) NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),

    -- Professional Information
    bio TEXT,
    experience_years INTEGER DEFAULT 0 CHECK (experience_years >= 0),
    consultation_fee DECIMAL(10,2) CHECK (consultation_fee >= 0),
    address JSONB DEFAULT '{}'::jsonb,
    languages_spoken TEXT[] DEFAULT ARRAY['Vietnamese'],

    -- Status and Rating
    availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'offline', 'on_leave')),
    rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
    total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    is_active BOOLEAN DEFAULT true,

    -- Enhanced fields
    success_rate DECIMAL(5,2) DEFAULT 0 CHECK (success_rate >= 0 AND success_rate <= 100),
    total_revenue DECIMAL(12,2) DEFAULT 0 CHECK (total_revenue >= 0),
    average_consultation_time INTEGER DEFAULT 30 CHECK (average_consultation_time > 0),
    certifications JSONB DEFAULT '[]'::jsonb,
    specializations JSONB DEFAULT '[]'::jsonb,
    awards JSONB DEFAULT '[]'::jsonb,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- 3. CREATE INDEXES
-- =====================================================

CREATE INDEX idx_doctors_profile_id ON doctors(profile_id);
CREATE INDEX idx_doctors_department_id ON doctors(department_id);
CREATE INDEX idx_doctors_specialty ON doctors(specialty);
CREATE INDEX idx_doctors_license_number ON doctors(license_number);
CREATE INDEX idx_doctors_availability_status ON doctors(availability_status);
CREATE INDEX idx_doctors_is_active ON doctors(is_active);

-- 4. CREATE FOREIGN KEY CONSTRAINTS
-- =====================================================

ALTER TABLE doctors
ADD CONSTRAINT fk_doctors_profile_id
FOREIGN KEY (profile_id) REFERENCES profiles(id)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE doctors
ADD CONSTRAINT fk_doctors_department_id
FOREIGN KEY (department_id) REFERENCES departments(department_id)
ON DELETE RESTRICT ON UPDATE CASCADE;

-- 5. HELPER FUNCTIONS
-- =====================================================

-- Function to map email to department and specialty
CREATE OR REPLACE FUNCTION get_department_info(email_addr TEXT)
RETURNS TABLE(dept_id TEXT, dept_code TEXT, specialty_name TEXT, license_prefix TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        CASE
            WHEN email_addr LIKE 'cardio%' THEN 'DEPT001'
            WHEN email_addr LIKE 'neuro%' THEN 'DEPT004'
            WHEN email_addr LIKE 'ortho%' THEN 'DEPT002'
            WHEN email_addr LIKE 'nhi%' THEN 'DEPT003'
            WHEN email_addr LIKE 'obgyn%' THEN 'DEPT006'
            WHEN email_addr LIKE 'internal%' THEN 'DEPT008'
            WHEN email_addr LIKE 'surgery%' THEN 'DEPT009'
            ELSE 'DEPT008' -- Default to Internal Medicine
        END as dept_id,
        CASE
            WHEN email_addr LIKE 'cardio%' THEN 'CARD'
            WHEN email_addr LIKE 'neuro%' THEN 'NEUR'
            WHEN email_addr LIKE 'ortho%' THEN 'ORTH'
            WHEN email_addr LIKE 'nhi%' THEN 'PEDI'
            WHEN email_addr LIKE 'obgyn%' THEN 'GYNE'
            WHEN email_addr LIKE 'internal%' THEN 'GENE'
            WHEN email_addr LIKE 'surgery%' THEN 'SURG'
            ELSE 'GENE'
        END as dept_code,
        CASE
            WHEN email_addr LIKE 'cardio%' THEN 'Tim Mạch'
            WHEN email_addr LIKE 'neuro%' THEN 'Thần Kinh'
            WHEN email_addr LIKE 'ortho%' THEN 'Chấn Thương Chỉnh Hình'
            WHEN email_addr LIKE 'nhi%' THEN 'Nhi Khoa'
            WHEN email_addr LIKE 'obgyn%' THEN 'Phụ Sản'
            WHEN email_addr LIKE 'internal%' THEN 'Nội Tổng Hợp'
            WHEN email_addr LIKE 'surgery%' THEN 'Phẫu Thuật Tổng Hợp'
            ELSE 'Nội Tổng Hợp'
        END as specialty_name,
        CASE
            WHEN email_addr LIKE 'cardio%' THEN 'VN-TM'
            WHEN email_addr LIKE 'neuro%' THEN 'VN-TK'
            WHEN email_addr LIKE 'ortho%' THEN 'VN-CT'
            WHEN email_addr LIKE 'nhi%' THEN 'VN-NK'
            WHEN email_addr LIKE 'obgyn%' THEN 'VN-PS'
            WHEN email_addr LIKE 'internal%' THEN 'VN-NT'
            WHEN email_addr LIKE 'surgery%' THEN 'VN-PT'
            ELSE 'VN-TH'
        END as license_prefix;
END;
$$ LANGUAGE plpgsql;

-- 6. POPULATE DOCTORS TABLE FROM EXISTING PROFILES
-- =====================================================

-- Insert doctors from all existing doctor profiles
INSERT INTO doctors (
    doctor_id,
    profile_id,
    full_name,
    specialty,
    qualification,
    department_id,
    license_number,
    gender,
    bio,
    experience_years,
    consultation_fee,
    address,
    languages_spoken,
    availability_status,
    rating,
    total_reviews,
    status,
    is_active,
    success_rate,
    total_revenue,
    average_consultation_time,
    certifications,
    specializations,
    awards,
    created_at,
    updated_at
)
SELECT
    -- Generate doctor_id with correct department-based format: DEPT_CODE-DOC-YYYYMM-XXX
    dept_info.dept_code || '-DOC-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(
        (ROW_NUMBER() OVER (PARTITION BY dept_info.dept_code ORDER BY p.email))::TEXT,
        3, '0'
    ) as doctor_id,

    p.id as profile_id,
    p.full_name,
    dept_info.specialty_name as specialty,

    -- Generate qualification based on specialty
    CASE
        WHEN dept_info.specialty_name = 'Tim Mạch' THEN 'Bác sĩ Chuyên khoa I Tim Mạch'
        WHEN dept_info.specialty_name = 'Thần Kinh' THEN 'Bác sĩ Chuyên khoa I Thần Kinh'
        WHEN dept_info.specialty_name = 'Chấn Thương Chỉnh Hình' THEN 'Bác sĩ Chuyên khoa I Chấn Thương Chỉnh Hình'
        WHEN dept_info.specialty_name = 'Nhi Khoa' THEN 'Bác sĩ Chuyên khoa I Nhi'
        WHEN dept_info.specialty_name = 'Phụ Sản' THEN 'Bác sĩ Chuyên khoa I Phụ Sản'
        WHEN dept_info.specialty_name = 'Nội Tổng Hợp' THEN 'Bác sĩ Đa khoa'
        WHEN dept_info.specialty_name = 'Phẫu Thuật Tổng Hợp' THEN 'Bác sĩ Chuyên khoa I Phẫu Thuật'
        ELSE 'Bác sĩ Đa khoa'
    END as qualification,

    dept_info.dept_id as department_id,

    -- Generate license number with department-based format
    dept_info.license_prefix || '-' || dept_info.dept_code || '-' || LPAD(
        (1000 + ROW_NUMBER() OVER (PARTITION BY dept_info.dept_code ORDER BY p.email))::TEXT,
        4, '0'
    ) as license_number,

    -- Assign gender based on name patterns (simple heuristic)
    CASE
        WHEN p.full_name LIKE '%Thị%' OR p.full_name LIKE '%Hương%' OR p.full_name LIKE '%Lan%'
             OR p.full_name LIKE '%Mai%' OR p.full_name LIKE '%Hạnh%' OR p.full_name LIKE '%Oanh%'
             OR p.full_name LIKE '%Bình%' OR p.full_name LIKE '%Hoa%' OR p.full_name LIKE '%Linh%'
             OR p.full_name LIKE '%Nga%' OR p.full_name LIKE '%Liên%' OR p.full_name LIKE '%Phương%'
             OR p.full_name LIKE '%Xuân%' OR p.full_name LIKE '%Yến%' OR p.full_name LIKE '%Hồng%'
             OR p.full_name LIKE '%Kim%' OR p.full_name LIKE '%Thu%' THEN 'Female'
        ELSE 'Male'
    END as gender,

    -- Generate bio based on specialty
    'Bác sĩ chuyên khoa ' || dept_info.specialty_name || ' với nhiều năm kinh nghiệm trong lĩnh vực điều trị và chăm sóc bệnh nhân.' as bio,

    -- Random experience years between 5-20
    (5 + (EXTRACT(EPOCH FROM p.created_at)::INTEGER % 16)) as experience_years,

    -- Consultation fee based on specialty
    CASE
        WHEN dept_info.specialty_name = 'Tim Mạch' THEN 500000.00
        WHEN dept_info.specialty_name = 'Thần Kinh' THEN 450000.00
        WHEN dept_info.specialty_name = 'Chấn Thương Chỉnh Hình' THEN 400000.00
        WHEN dept_info.specialty_name = 'Phẫu Thuật Tổng Hợp' THEN 600000.00
        WHEN dept_info.specialty_name = 'Phụ Sản' THEN 350000.00
        WHEN dept_info.specialty_name = 'Nhi Khoa' THEN 300000.00
        ELSE 250000.00
    END as consultation_fee,

    -- Default address
    '{"street": "Bệnh viện Đa khoa", "city": "TP.HCM", "district": "Quận 1"}'::jsonb as address,

    -- Languages
    ARRAY['Vietnamese', 'English'] as languages_spoken,

    'available' as availability_status,

    -- Random rating between 4.0-5.0
    (4.0 + (EXTRACT(EPOCH FROM p.created_at)::INTEGER % 100) / 100.0) as rating,

    -- Random review count
    (20 + (EXTRACT(EPOCH FROM p.created_at)::INTEGER % 80)) as total_reviews,

    'active' as status,
    true as is_active,

    -- Random success rate between 85-98%
    (85.0 + (EXTRACT(EPOCH FROM p.created_at)::INTEGER % 14)) as success_rate,

    -- Random revenue
    (10000000.0 + (EXTRACT(EPOCH FROM p.created_at)::INTEGER % 40000000)) as total_revenue,

    -- Average consultation time
    (30 + (EXTRACT(EPOCH FROM p.created_at)::INTEGER % 30)) as average_consultation_time,

    -- Default certifications
    '["Chứng chỉ hành nghề", "Chứng chỉ chuyên khoa"]'::jsonb as certifications,

    -- Specializations based on department
    ('["' || dept_info.specialty_name || '"]')::jsonb as specializations,

    -- Default awards
    '["Bác sĩ tận tâm"]'::jsonb as awards,

    p.created_at,
    CURRENT_TIMESTAMP as updated_at

FROM profiles p
CROSS JOIN LATERAL get_department_info(p.email) as dept_info
WHERE p.role = 'doctor'
AND p.is_active = true
ORDER BY dept_info.dept_code, p.email;

-- 7. VERIFICATION AND SUMMARY
-- =====================================================

-- Show summary of created doctors
SELECT
    'DOCTORS CREATED SUCCESSFULLY!' as status,
    COUNT(*) as total_doctors,
    COUNT(DISTINCT department_id) as departments_used,
    COUNT(DISTINCT specialty) as specialties_created
FROM doctors;

-- Show doctors by department
SELECT
    d.department_name,
    d.department_code,
    COUNT(doc.doctor_id) as doctor_count,
    STRING_AGG(doc.full_name, ', ' ORDER BY doc.doctor_id) as doctors
FROM doctors doc
JOIN departments d ON doc.department_id = d.department_id
GROUP BY d.department_name, d.department_code, d.department_id
ORDER BY d.department_name;

-- Show sample of created doctors
SELECT
    doctor_id,
    full_name,
    specialty,
    department_id,
    license_number,
    experience_years,
    consultation_fee,
    rating
FROM doctors
ORDER BY department_id, doctor_id
LIMIT 10;

-- Final success message
SELECT
    '✅ DOCTORS TABLE RECREATED SUCCESSFULLY!' as message,
    'All ' || COUNT(*) || ' doctor profiles have been converted to doctors records' as details
FROM doctors;
