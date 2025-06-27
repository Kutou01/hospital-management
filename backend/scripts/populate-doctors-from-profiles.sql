-- =====================================================
-- POPULATE DOCTORS TABLE FROM EXISTING PROFILES
-- =====================================================
-- This script will create doctor records from existing doctor profiles

-- 1. ENSURE DEPARTMENTS EXIST
-- =====================================================

-- Create departments table if not exists
CREATE TABLE IF NOT EXISTS departments (
    department_id VARCHAR(20) PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL,
    department_code VARCHAR(10) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default departments (handle conflicts)
INSERT INTO departments (department_id, department_name, department_code, description, is_active) VALUES
('DEPT-CARD', 'Khoa Tim Mạch', 'CARD', 'Chuyên khoa về tim và hệ thống tuần hoàn', true),
('DEPT-NEUR', 'Khoa Thần Kinh', 'NEUR', 'Chuyên khoa về não bộ và hệ thần kinh', true),
('DEPT-ORTH', 'Khoa Chấn Thương Chỉnh Hình', 'ORTH', 'Chuyên khoa về xương khớp', true),
('DEPT-PEDI', 'Khoa Nhi', 'PEDI', 'Chuyên khoa chăm sóc sức khỏe trẻ em', true),
('DEPT-GYNE', 'Khoa Phụ Sản', 'GYNE', 'Chuyên khoa chăm sóc sức khỏe phụ nữ', true),
('DEPT-GENE', 'Khoa Nội Tổng Hợp', 'GENE', 'Khoa khám bệnh tổng quát và y học gia đình', true),
('DEPT-DERM', 'Khoa Da Liễu', 'DERM', 'Chuyên khoa về da và các bệnh ngoài da', true),
('DEPT-PSYC', 'Khoa Tâm Thần', 'PSYC', 'Chuyên khoa về sức khỏe tâm thần', true),
('DEPT-ENDO', 'Khoa Nội Tiết', 'ENDO', 'Chuyên khoa về hormone và chuyển hóa', true),
('DEPT-GAST', 'Khoa Tiêu Hóa', 'GAST', 'Chuyên khoa về hệ tiêu hóa', true)
ON CONFLICT (department_id) DO UPDATE SET
    department_name = EXCLUDED.department_name,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

-- 2. CREATE FUNCTION TO GENERATE DOCTOR ID
-- =====================================================

CREATE OR REPLACE FUNCTION generate_doctor_id(dept_code TEXT)
RETURNS TEXT AS $$
DECLARE
    sequence_num INTEGER;
    new_id TEXT;
BEGIN
    -- Get next sequence number for this department
    SELECT COALESCE(MAX(CAST(SUBSTRING(doctor_id FROM '\d+$') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM doctors 
    WHERE doctor_id LIKE 'DOC-' || dept_code || '-%';
    
    -- Generate new ID
    new_id := 'DOC-' || dept_code || '-' || LPAD(sequence_num::TEXT, 3, '0');
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- 3. CREATE FUNCTION TO MAP EMAIL TO SPECIALTY
-- =====================================================

CREATE OR REPLACE FUNCTION get_specialty_from_email(email_addr TEXT)
RETURNS TABLE(specialty TEXT, department_id TEXT, dept_code TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        CASE
            WHEN email_addr = 'doctor@hospital.com' THEN 'Tim Mạch'
            WHEN email_addr LIKE 'doctor1@%' THEN 'Thần Kinh'
            WHEN email_addr LIKE 'doctor2@%' THEN 'Chấn Thương Chỉnh Hình'
            WHEN email_addr LIKE 'doctor3@%' THEN 'Nhi Khoa'
            WHEN email_addr LIKE 'doctor4@%' THEN 'Phụ Sản'
            WHEN email_addr LIKE 'doctor5@%' THEN 'Da Liễu'
            WHEN email_addr LIKE 'doctor6@%' THEN 'Tâm Thần'
            WHEN email_addr LIKE 'doctor7@%' THEN 'Nội Tiết'
            WHEN email_addr LIKE 'doctor8@%' THEN 'Tiêu Hóa'
            WHEN email_addr LIKE 'doctor9@%' THEN 'Tim Mạch'
            WHEN email_addr LIKE '%cardio%' THEN 'Tim Mạch'
            WHEN email_addr LIKE '%neuro%' THEN 'Thần Kinh'
            WHEN email_addr LIKE '%ortho%' THEN 'Chấn Thương Chỉnh Hình'
            WHEN email_addr LIKE '%pedi%' THEN 'Nhi Khoa'
            WHEN email_addr LIKE '%gyne%' THEN 'Phụ Sản'
            WHEN email_addr LIKE '%derm%' THEN 'Da Liễu'
            WHEN email_addr LIKE '%psyc%' THEN 'Tâm Thần'
            WHEN email_addr LIKE '%endo%' THEN 'Nội Tiết'
            WHEN email_addr LIKE '%gast%' THEN 'Tiêu Hóa'
            ELSE 'Nội Tổng Hợp'
        END as specialty,
        
        CASE 
            WHEN email_addr = 'doctor@hospital.com' THEN 'DEPT-CARD'
            WHEN email_addr LIKE 'doctor1@%' THEN 'DEPT-NEUR'
            WHEN email_addr LIKE 'doctor2@%' THEN 'DEPT-ORTH'
            WHEN email_addr LIKE 'doctor3@%' THEN 'DEPT-PEDI'
            WHEN email_addr LIKE 'doctor4@%' THEN 'DEPT-GYNE'
            WHEN email_addr LIKE 'doctor5@%' THEN 'DEPT-DERM'
            WHEN email_addr LIKE 'doctor6@%' THEN 'DEPT-PSYC'
            WHEN email_addr LIKE 'doctor7@%' THEN 'DEPT-ENDO'
            WHEN email_addr LIKE 'doctor8@%' THEN 'DEPT-GAST'
            WHEN email_addr LIKE 'doctor9@%' THEN 'DEPT-CARD'
            WHEN email_addr LIKE '%cardio%' THEN 'DEPT-CARD'
            WHEN email_addr LIKE '%neuro%' THEN 'DEPT-NEUR'
            WHEN email_addr LIKE '%ortho%' THEN 'DEPT-ORTH'
            WHEN email_addr LIKE '%pedi%' THEN 'DEPT-PEDI'
            WHEN email_addr LIKE '%gyne%' THEN 'DEPT-GYNE'
            WHEN email_addr LIKE '%derm%' THEN 'DEPT-DERM'
            WHEN email_addr LIKE '%psyc%' THEN 'DEPT-PSYC'
            WHEN email_addr LIKE '%endo%' THEN 'DEPT-ENDO'
            WHEN email_addr LIKE '%gast%' THEN 'DEPT-GAST'
            ELSE 'DEPT-GENE'
        END as department_id,
        
        CASE 
            WHEN email_addr = 'doctor@hospital.com' THEN 'CARD'
            WHEN email_addr LIKE 'doctor1@%' THEN 'NEUR'
            WHEN email_addr LIKE 'doctor2@%' THEN 'ORTH'
            WHEN email_addr LIKE 'doctor3@%' THEN 'PEDI'
            WHEN email_addr LIKE 'doctor4@%' THEN 'GYNE'
            WHEN email_addr LIKE 'doctor5@%' THEN 'DERM'
            WHEN email_addr LIKE 'doctor6@%' THEN 'PSYC'
            WHEN email_addr LIKE 'doctor7@%' THEN 'ENDO'
            WHEN email_addr LIKE 'doctor8@%' THEN 'GAST'
            WHEN email_addr LIKE 'doctor9@%' THEN 'CARD'
            WHEN email_addr LIKE '%cardio%' THEN 'CARD'
            WHEN email_addr LIKE '%neuro%' THEN 'NEUR'
            WHEN email_addr LIKE '%ortho%' THEN 'ORTH'
            WHEN email_addr LIKE '%pedi%' THEN 'PEDI'
            WHEN email_addr LIKE '%gyne%' THEN 'GYNE'
            WHEN email_addr LIKE '%derm%' THEN 'DERM'
            WHEN email_addr LIKE '%psyc%' THEN 'PSYC'
            WHEN email_addr LIKE '%endo%' THEN 'ENDO'
            WHEN email_addr LIKE '%gast%' THEN 'GAST'
            ELSE 'GENE'
        END as dept_code;
END;
$$ LANGUAGE plpgsql;

-- 4. INSERT DOCTORS FROM PROFILES
-- =====================================================

-- Insert all doctor profiles as doctors
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
    generate_doctor_id(spec.dept_code) as doctor_id,
    p.id as profile_id,
    p.full_name,
    spec.specialty,
    'Bác sĩ chuyên khoa' as qualification,
    spec.department_id,
    'VN-' || spec.dept_code || '-' || LPAD((EXTRACT(EPOCH FROM p.created_at)::INTEGER % 10000)::TEXT, 4, '0') as license_number,
    'Nam' as gender, -- Default, can be updated later
    'Bác sĩ có kinh nghiệm với chuyên môn cao trong lĩnh vực ' || spec.specialty as bio,
    GREATEST(1, EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.created_at::DATE))) as experience_years,
    
    -- Phí khám theo chuyên khoa
    CASE
        WHEN spec.specialty = 'Tim Mạch' THEN 200000
        WHEN spec.specialty = 'Thần Kinh' THEN 250000
        WHEN spec.specialty = 'Chấn Thương Chỉnh Hình' THEN 180000
        WHEN spec.specialty = 'Nhi Khoa' THEN 150000
        WHEN spec.specialty = 'Phụ Sản' THEN 170000
        WHEN spec.specialty = 'Da Liễu' THEN 160000
        WHEN spec.specialty = 'Tâm Thần' THEN 220000
        WHEN spec.specialty = 'Nội Tiết' THEN 190000
        WHEN spec.specialty = 'Tiêu Hóa' THEN 200000
        ELSE 150000
    END as consultation_fee,
    
    '{"city": "Thành phố Hồ Chí Minh", "district": "Quận 1", "country": "Việt Nam"}'::jsonb as address,
    ARRAY['Tiếng Việt', 'Tiếng Anh'] as languages_spoken,
    'Có thể khám' as availability_status,
    4.0 + (RANDOM() * 1.0) as rating, -- Đánh giá ngẫu nhiên từ 4.0-5.0
    (RANDOM() * 100)::INTEGER as total_reviews, -- Số lượt đánh giá ngẫu nhiên 0-100
    'Đang hoạt động' as status,
    true as is_active,
    90.0 + (RANDOM() * 10.0) as success_rate, -- Tỷ lệ thành công ngẫu nhiên 90-100%
    (RANDOM() * 50000000)::NUMERIC(12,2) as total_revenue, -- Doanh thu ngẫu nhiên
    30 + (RANDOM() * 30)::INTEGER as average_consultation_time, -- Thời gian khám 30-60 phút
    '["Bác sĩ chuyên khoa", "Chứng chỉ hành nghề"]'::jsonb as certifications,
    ('["' || spec.specialty || '"]')::jsonb as specializations,
    '["Bác sĩ xuất sắc"]'::jsonb as awards,
    p.created_at,
    CURRENT_TIMESTAMP as updated_at

FROM profiles p
CROSS JOIN LATERAL get_specialty_from_email(p.email) as spec
WHERE p.role = 'doctor' 
AND p.is_active = true
ORDER BY p.email;

-- 5. VERIFICATION
-- =====================================================

-- Kiểm tra số lượng bác sĩ đã thêm
SELECT
    COUNT(*) as tong_so_bac_si_da_them,
    COUNT(CASE WHEN specialty = 'Tim Mạch' THEN 1 END) as bac_si_tim_mach,
    COUNT(CASE WHEN specialty = 'Thần Kinh' THEN 1 END) as bac_si_than_kinh,
    COUNT(CASE WHEN specialty = 'Nội Tổng Hợp' THEN 1 END) as bac_si_noi_tong_hop
FROM doctors;

-- Check the specific failing profile
SELECT 
    d.doctor_id,
    d.profile_id,
    d.full_name,
    d.specialty,
    d.department_id,
    p.email,
    d.is_active
FROM doctors d
JOIN profiles p ON d.profile_id = p.id
WHERE d.profile_id = '5bdcbd80-f344-40b7-a46b-3760ca487693';

-- Test the failing API query
SELECT 
    d.*,
    p.email,
    p.phone_number,
    p.date_of_birth
FROM doctors d
JOIN profiles p ON d.profile_id = p.id
WHERE d.profile_id = '5bdcbd80-f344-40b7-a46b-3760ca487693';

-- Show sample of all doctors
SELECT 
    d.doctor_id,
    d.full_name,
    d.specialty,
    d.department_id,
    p.email,
    d.is_active
FROM doctors d
JOIN profiles p ON d.profile_id = p.id
ORDER BY d.doctor_id
LIMIT 10;

-- Thông báo thành công
SELECT 'Đã tạo thành công ' || COUNT(*) || ' bác sĩ từ dữ liệu profiles!' as ket_qua
FROM doctors;
