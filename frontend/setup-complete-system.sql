-- Setup Complete Hospital Management System
-- Liên kết tất cả các bảng và tạo dữ liệu mẫu

-- =====================================================
-- BƯỚC 1: TẠO PROFILE CHO USER HIỆN TẠI
-- =====================================================

-- Tạo profile cho user đang đăng nhập
INSERT INTO profiles (
    id, 
    email, 
    full_name, 
    role, 
    email_verified, 
    is_active, 
    created_at, 
    updated_at
) VALUES (
    '34111382-07b2-40ca-af28-69af7341e594',
    'namprophunong003@gmail.com',
    'Nam Pro',
    'patient',
    true,
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = NOW();

-- =====================================================
-- BƯỚC 2: TẠO PATIENT RECORD
-- =====================================================

-- Tạo patient record liên kết với profile
INSERT INTO patients (
    patient_id,
    profile_id,
    full_name,
    date_of_birth,
    gender,
    phone,
    address,
    emergency_contact,
    insurance_info,
    chronic_conditions,
    created_at,
    updated_at
) VALUES (
    'PAT-001',
    '34111382-07b2-40ca-af28-69af7341e594',
    'Nam Pro',
    '1990-01-01',
    'male',
    '0123456789',
    '{"street": "123 Test Street", "city": "Ho Chi Minh", "district": "District 1", "ward": "Ward 1"}',
    '{"name": "Emergency Contact", "phone": "0987654321", "relationship": "Family"}',
    '{"provider": "BHYT", "policy_number": "ABC123456", "valid_until": "2025-12-31"}',
    '[]',
    NOW(),
    NOW()
) ON CONFLICT (patient_id) DO UPDATE SET
    profile_id = EXCLUDED.profile_id,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

-- =====================================================
-- BƯỚC 3: TẠO THÊM PATIENT KHÁC ĐỂ TEST
-- =====================================================

-- Tạo profile cho user khác để test privacy
INSERT INTO profiles (
    id, 
    email, 
    full_name, 
    role, 
    email_verified, 
    is_active, 
    created_at, 
    updated_at
) VALUES (
    gen_random_uuid(),
    'testuser@example.com',
    'Test User',
    'patient',
    true,
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Lấy ID của profile vừa tạo và tạo patient
DO $$
DECLARE
    test_profile_id UUID;
BEGIN
    SELECT id INTO test_profile_id 
    FROM profiles 
    WHERE email = 'testuser@example.com' 
    LIMIT 1;
    
    IF test_profile_id IS NOT NULL THEN
        INSERT INTO patients (
            patient_id,
            profile_id,
            full_name,
            date_of_birth,
            gender,
            phone,
            address,
            emergency_contact,
            insurance_info,
            chronic_conditions,
            created_at,
            updated_at
        ) VALUES (
            'PAT-002',
            test_profile_id,
            'Test User',
            '1985-05-15',
            'female',
            '0987654321',
            '{"street": "456 Another Street", "city": "Ha Noi", "district": "District 2", "ward": "Ward 2"}',
            '{"name": "Test Emergency", "phone": "0123456789", "relationship": "Friend"}',
            '{"provider": "Private", "policy_number": "XYZ789", "valid_until": "2025-06-30"}',
            '["Diabetes", "Hypertension"]',
            NOW(),
            NOW()
        ) ON CONFLICT (patient_id) DO NOTHING;
    END IF;
END $$;

-- =====================================================
-- BƯỚC 4: CẬP NHẬT PAYMENTS VỚI PATIENT_ID
-- =====================================================

-- Cập nhật một số payments cho user chính (PAT-001)
UPDATE payments
SET
    patient_id = 'PAT-001',
    updated_at = NOW()
WHERE patient_id IS NULL
AND order_code IN (
    '1750004006508',
    '1749998502037',
    '1749998363890',
    '1749996854072'
);

-- Cập nhật một số payments cho user test (PAT-002)
UPDATE payments
SET
    patient_id = 'PAT-002',
    updated_at = NOW()
WHERE patient_id IS NULL
AND order_code IN (
    '1749998363922',
    '1749996856374',
    '1749996855176'
);

-- =====================================================
-- BƯỚC 5: TẠO MEDICAL RECORDS LIÊN KẾT
-- =====================================================

-- Tạo medical record cho PAT-001
INSERT INTO medical_records (
    record_id,
    patient_id,
    doctor_id,
    visit_date,
    diagnosis,
    treatment_plan,
    prescription,
    notes,
    vital_signs,
    physical_examination,
    medications_prescribed,
    follow_up_date,
    status,
    created_at,
    updated_at
) VALUES (
    'MR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-001',
    'PAT-001',
    'DOC-001',
    NOW()::date,
    'Khám tổng quát định kỳ',
    'Theo dõi sức khỏe, tái khám sau 3 tháng',
    'Vitamin D3 1000IU/ngày',
    'Bệnh nhân có sức khỏe tốt, không có triệu chứng bất thường',
    '{"blood_pressure": "120/80", "heart_rate": "72", "temperature": "36.5", "weight": "70", "height": "175"}',
    '{"general": "Tốt", "cardiovascular": "Bình thường", "respiratory": "Bình thường"}',
    '[{"name": "Vitamin D3", "dosage": "1000IU", "frequency": "1 lần/ngày", "duration": "3 tháng"}]',
    NOW()::date + INTERVAL '3 months',
    'completed',
    NOW(),
    NOW()
) ON CONFLICT (record_id) DO NOTHING;

-- =====================================================
-- BƯỚC 6: LIÊN KẾT PAYMENTS VỚI MEDICAL RECORDS
-- =====================================================

-- Cập nhật payments với record_id
UPDATE payments
SET
    record_id = 'MR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-001',
    updated_at = NOW()
WHERE patient_id = 'PAT-001'
AND record_id IS NULL;

-- =====================================================
-- BƯỚC 7: KIỂM TRA KẾT QUẢ
-- =====================================================

-- Kiểm tra profiles
SELECT 'PROFILES' as table_name, COUNT(*) as count FROM profiles;

-- Kiểm tra patients
SELECT 'PATIENTS' as table_name, COUNT(*) as count FROM patients;

-- Kiểm tra payments theo patient
SELECT
    'PAYMENTS BY PATIENT' as info,
    patient_id,
    COUNT(*) as payment_count,
    SUM(amount) FILTER (WHERE status = 'completed') as total_paid
FROM payments
WHERE patient_id IS NOT NULL
GROUP BY patient_id;

-- Kiểm tra medical records
SELECT 'MEDICAL_RECORDS' as table_name, COUNT(*) as count FROM medical_records;

-- Hiển thị liên kết hoàn chỉnh cho PAT-001
SELECT
    p.full_name as patient_name,
    pay.order_code,
    pay.amount,
    pay.status as payment_status,
    mr.diagnosis,
    mr.visit_date
FROM patients p
LEFT JOIN payments pay ON p.patient_id = pay.patient_id
LEFT JOIN medical_records mr ON pay.record_id = mr.record_id
WHERE p.patient_id = 'PAT-001'
AND pay.status = 'completed'
ORDER BY pay.created_at DESC
LIMIT 5;
