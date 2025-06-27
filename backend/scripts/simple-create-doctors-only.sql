-- =====================================================
-- TẠO LẠI DỮ LIỆU DOCTORS TỪ PROFILES (KHÔNG ĐỘNG VÀO DEPARTMENTS)
-- =====================================================
-- Script đơn giản chỉ tạo doctors từ profiles có sẵn

-- 1. KIỂM TRA DEPARTMENTS CÓ SẴN
-- =====================================================

-- Xem departments hiện có
SELECT 'Departments hiện có:' as thong_tin;
SELECT department_id, department_name, department_code FROM departments ORDER BY department_id;

-- 2. TẠO FUNCTION ĐỂ GENERATE DOCTOR ID
-- =====================================================

CREATE OR REPLACE FUNCTION generate_simple_doctor_id(dept_code TEXT)
RETURNS TEXT AS $$
DECLARE
    sequence_num INTEGER;
    new_id TEXT;
BEGIN
    -- Lấy số thứ tự tiếp theo cho department này
    SELECT COALESCE(MAX(CAST(SUBSTRING(doctor_id FROM '\d+$') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM doctors 
    WHERE doctor_id LIKE 'DOC-' || dept_code || '-%';
    
    -- Tạo ID mới
    new_id := 'DOC-' || dept_code || '-' || LPAD(sequence_num::TEXT, 3, '0');
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- 3. TẠO FUNCTION MAP EMAIL SANG CHUYÊN KHOA
-- =====================================================

CREATE OR REPLACE FUNCTION get_doctor_info_from_email(email_addr TEXT)
RETURNS TABLE(specialty_name TEXT, dept_id TEXT, dept_code TEXT) AS $$
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
            -- Phân bổ ngẫu nhiên cho các email khác
            ELSE (ARRAY['Tim Mạch', 'Thần Kinh', 'Nhi Khoa', 'Phụ Sản', 'Da Liễu', 'Nội Tổng Hợp'])[1 + (EXTRACT(EPOCH FROM NOW())::INTEGER % 6)]
        END::TEXT as specialty_name,

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
            -- Sử dụng department có sẵn hoặc mặc định
            ELSE COALESCE(
                (SELECT d.department_id FROM departments d WHERE d.department_code = 'GENE' LIMIT 1),
                (SELECT d.department_id FROM departments d LIMIT 1),
                'DEPT-GENE'
            )
        END::TEXT as dept_id,

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
            ELSE 'GENE'
        END::TEXT as dept_code;
END;
$$ LANGUAGE plpgsql;

-- 4. TẠO DOCTORS TỪ PROFILES
-- =====================================================

-- Xóa dữ liệu doctors cũ nếu có (để tránh conflict)
DELETE FROM doctors;

-- Tạo doctors từ profiles
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
    generate_simple_doctor_id(info.dept_code) as doctor_id,
    p.id as profile_id,
    p.full_name,
    info.specialty_name,
    'Bác sĩ chuyên khoa' as qualification,
    info.dept_id,
    'VN-' || info.dept_code || '-' || LPAD((EXTRACT(EPOCH FROM p.created_at)::INTEGER % 10000)::TEXT, 4, '0') as license_number,
    'Nam' as gender,
    'Bác sĩ có kinh nghiệm với chuyên môn cao trong lĩnh vực ' || info.specialty_name || '. Cam kết mang lại dịch vụ chăm sóc sức khỏe tốt nhất cho bệnh nhân.' as bio,
    GREATEST(1, EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.created_at::DATE))) as experience_years,

    -- Phí khám theo chuyên khoa
    CASE
        WHEN info.specialty_name = 'Tim Mạch' THEN 200000
        WHEN info.specialty_name = 'Thần Kinh' THEN 250000
        WHEN info.specialty_name = 'Chấn Thương Chỉnh Hình' THEN 180000
        WHEN info.specialty_name = 'Nhi Khoa' THEN 150000
        WHEN info.specialty_name = 'Phụ Sản' THEN 170000
        WHEN info.specialty_name = 'Da Liễu' THEN 160000
        WHEN info.specialty_name = 'Tâm Thần' THEN 220000
        WHEN info.specialty_name = 'Nội Tiết' THEN 190000
        WHEN info.specialty_name = 'Tiêu Hóa' THEN 200000
        ELSE 150000
    END as consultation_fee,
    
    '{"city": "Thành phố Hồ Chí Minh", "district": "Quận 1", "country": "Việt Nam"}'::jsonb as address,
    ARRAY['Tiếng Việt', 'Tiếng Anh'] as languages_spoken,
    'available' as availability_status,
    4.0 + (RANDOM() * 1.0) as rating,
    (RANDOM() * 100)::INTEGER as total_reviews,
    'active' as status,
    true as is_active,
    90.0 + (RANDOM() * 10.0) as success_rate,
    (RANDOM() * 50000000)::NUMERIC(12,2) as total_revenue,
    30 + (RANDOM() * 30)::INTEGER as average_consultation_time,
    '["Bác sĩ chuyên khoa", "Chứng chỉ hành nghề"]'::jsonb as certifications,
    ('["' || info.specialty_name || '"]')::jsonb as specializations,
    '["Bác sĩ xuất sắc"]'::jsonb as awards,
    p.created_at,
    CURRENT_TIMESTAMP as updated_at

FROM profiles p
CROSS JOIN LATERAL get_doctor_info_from_email(p.email) as info
WHERE p.role = 'doctor' 
AND p.is_active = true
ORDER BY p.email;

-- 5. KIỂM TRA KẾT QUẢ
-- =====================================================

-- Đếm số lượng doctors đã tạo
SELECT
    COUNT(*) as tong_so_bac_si,
    COUNT(CASE WHEN specialty = 'Tim Mạch' THEN 1 END) as tim_mach,
    COUNT(CASE WHEN specialty = 'Thần Kinh' THEN 1 END) as than_kinh,
    COUNT(CASE WHEN specialty = 'Nhi Khoa' THEN 1 END) as nhi_khoa
FROM doctors;

-- Kiểm tra doctor cho profile_id bị lỗi
SELECT 
    d.doctor_id,
    d.profile_id,
    d.full_name,
    d.specialty,
    d.department_id,
    p.email,
    d.is_active,
    'ĐÂY LÀ DOCTOR CHO PROFILE BỊ LỖI' as ghi_chu
FROM doctors d
JOIN profiles p ON d.profile_id = p.id
WHERE d.profile_id = '5bdcbd80-f344-40b7-a46b-3760ca487693';

-- Test query API bị lỗi
SELECT 
    d.doctor_id,
    d.profile_id,
    d.full_name,
    d.specialty,
    d.consultation_fee,
    d.rating,
    p.email,
    p.phone_number,
    p.date_of_birth,
    'TEST API QUERY' as test_type
FROM doctors d
JOIN profiles p ON d.profile_id = p.id
WHERE d.profile_id = '5bdcbd80-f344-40b7-a46b-3760ca487693';

-- Hiển thị 10 doctors đầu tiên
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

-- Thông báo kết quả
SELECT 
    'Đã tạo thành công ' || COUNT(*) || ' bác sĩ từ ' || 
    (SELECT COUNT(*) FROM profiles WHERE role = 'doctor') || ' profiles!' as ket_qua_cuoi_cung
FROM doctors;
