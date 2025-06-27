-- ============================================================================
-- SCRIPT SIÊU ĐỠN GIẢN - KHÔNG DÙNG GENERATE_SERIES CHO TIME
-- ============================================================================

-- Xóa và tạo lại schema
DROP SCHEMA IF EXISTS hospital_dev CASCADE;
CREATE SCHEMA hospital_dev;

-- ============================================================================
-- 1. COPY CẤU TRÚC BẢNG CẦN THIẾT
-- ============================================================================

CREATE TABLE hospital_dev.profiles AS SELECT * FROM public.profiles WHERE 1=0;
CREATE TABLE hospital_dev.doctors AS SELECT * FROM public.doctors WHERE 1=0;
CREATE TABLE hospital_dev.patients AS SELECT * FROM public.patients WHERE 1=0;
CREATE TABLE hospital_dev.appointments AS SELECT * FROM public.appointments WHERE 1=0;
CREATE TABLE hospital_dev.specialties AS SELECT * FROM public.specialties WHERE 1=0;
CREATE TABLE hospital_dev.departments AS SELECT * FROM public.departments WHERE 1=0;

-- Copy dữ liệu cấu hình
INSERT INTO hospital_dev.specialties SELECT * FROM public.specialties;
INSERT INTO hospital_dev.departments SELECT * FROM public.departments;

-- ============================================================================
-- 2. TẠO DỮ LIỆU TEST
-- ============================================================================

-- Tạo profiles
INSERT INTO hospital_dev.profiles (id, email, full_name, phone_number, date_of_birth, role, is_active, created_at) 
VALUES 
    (gen_random_uuid(), 'doctor.test@hospital.com', 'BS. Nguyễn Văn Test', '0901234567', DATE '1980-01-01', 'doctor', true, NOW()),
    (gen_random_uuid(), 'patient.test@hospital.com', 'Trần Thị Test', '0901234568', DATE '1990-01-01', 'patient', true, NOW());

-- Tạo doctor
INSERT INTO hospital_dev.doctors (doctor_id, profile_id, license_number, specialty_id, department_id, experience_years, consultation_fee, availability_status, created_at)
SELECT 
    'DOC-TEST-001',
    p.id,
    'BS-TEST-001',
    (SELECT specialty_id FROM hospital_dev.specialties LIMIT 1),
    (SELECT department_id FROM hospital_dev.departments LIMIT 1),
    10,
    200000,
    'available',
    NOW()
FROM hospital_dev.profiles p WHERE p.email = 'doctor.test@hospital.com';

-- Tạo patient
INSERT INTO hospital_dev.patients (patient_id, profile_id, gender, status, created_at)
SELECT 'PAT-TEST-001', p.id, 'male', 'active', NOW()
FROM hospital_dev.profiles p WHERE p.email = 'patient.test@hospital.com';

-- ============================================================================
-- 3. TẠO BẢNG TIME SLOTS
-- ============================================================================

CREATE SEQUENCE hospital_dev.slot_id_seq START 1;

CREATE TABLE hospital_dev.doctor_available_slots (
    slot_id VARCHAR(30) PRIMARY KEY DEFAULT ('SLOT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('hospital_dev.slot_id_seq')::TEXT, 4, '0')),
    doctor_id VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    max_bookings INTEGER DEFAULT 1,
    current_bookings INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(doctor_id, date, start_time)
);

-- ============================================================================
-- 4. TẠO TIME SLOTS BẰNG CÁCH ĐƠN GIẢN
-- ============================================================================

-- Tạo time slots cho ngày mai (thứ 2-6)
INSERT INTO hospital_dev.doctor_available_slots (doctor_id, date, start_time, end_time, is_available, max_bookings, current_bookings)
VALUES 
    -- Ngày mai - Morning slots
    ('DOC-TEST-001', CURRENT_DATE + 1, '08:00', '08:30', true, 1, 0),
    ('DOC-TEST-001', CURRENT_DATE + 1, '08:30', '09:00', true, 1, 0),
    ('DOC-TEST-001', CURRENT_DATE + 1, '09:00', '09:30', true, 1, 0),
    ('DOC-TEST-001', CURRENT_DATE + 1, '09:30', '10:00', true, 1, 0),
    ('DOC-TEST-001', CURRENT_DATE + 1, '10:00', '10:30', true, 1, 0),
    ('DOC-TEST-001', CURRENT_DATE + 1, '10:30', '11:00', true, 1, 0),
    ('DOC-TEST-001', CURRENT_DATE + 1, '11:00', '11:30', true, 1, 0),
    ('DOC-TEST-001', CURRENT_DATE + 1, '11:30', '12:00', true, 1, 0),
    -- Afternoon slots (skip lunch 12:00-13:00)
    ('DOC-TEST-001', CURRENT_DATE + 1, '13:00', '13:30', true, 1, 0),
    ('DOC-TEST-001', CURRENT_DATE + 1, '13:30', '14:00', true, 1, 0),
    ('DOC-TEST-001', CURRENT_DATE + 1, '14:00', '14:30', true, 1, 0),
    ('DOC-TEST-001', CURRENT_DATE + 1, '14:30', '15:00', true, 1, 0),
    ('DOC-TEST-001', CURRENT_DATE + 1, '15:00', '15:30', true, 1, 0),
    ('DOC-TEST-001', CURRENT_DATE + 1, '15:30', '16:00', true, 1, 0),
    ('DOC-TEST-001', CURRENT_DATE + 1, '16:00', '16:30', true, 1, 0),
    ('DOC-TEST-001', CURRENT_DATE + 1, '16:30', '17:00', true, 1, 0),
    
    -- Ngày kia - Morning slots
    ('DOC-TEST-001', CURRENT_DATE + 2, '08:00', '08:30', true, 1, 0),
    ('DOC-TEST-001', CURRENT_DATE + 2, '08:30', '09:00', true, 1, 0),
    ('DOC-TEST-001', CURRENT_DATE + 2, '09:00', '09:30', true, 1, 0),
    ('DOC-TEST-001', CURRENT_DATE + 2, '09:30', '10:00', true, 1, 0),
    ('DOC-TEST-001', CURRENT_DATE + 2, '10:00', '10:30', true, 1, 0),
    ('DOC-TEST-001', CURRENT_DATE + 2, '10:30', '11:00', true, 1, 0),
    ('DOC-TEST-001', CURRENT_DATE + 2, '11:00', '11:30', true, 1, 0),
    ('DOC-TEST-001', CURRENT_DATE + 2, '11:30', '12:00', true, 1, 0),
    -- Afternoon slots
    ('DOC-TEST-001', CURRENT_DATE + 2, '13:00', '13:30', true, 1, 0),
    ('DOC-TEST-001', CURRENT_DATE + 2, '13:30', '14:00', true, 1, 0),
    ('DOC-TEST-001', CURRENT_DATE + 2, '14:00', '14:30', true, 1, 0),
    ('DOC-TEST-001', CURRENT_DATE + 2, '14:30', '15:00', true, 1, 0),
    ('DOC-TEST-001', CURRENT_DATE + 2, '15:00', '15:30', true, 1, 0),
    ('DOC-TEST-001', CURRENT_DATE + 2, '15:30', '16:00', true, 1, 0),
    ('DOC-TEST-001', CURRENT_DATE + 2, '16:00', '16:30', true, 1, 0),
    ('DOC-TEST-001', CURRENT_DATE + 2, '16:30', '17:00', true, 1, 0);

-- ============================================================================
-- 5. TẠO BẢNG SESSION CHATBOT
-- ============================================================================

CREATE TABLE hospital_dev.chatbot_appointment_sessions (
    session_id VARCHAR(50) PRIMARY KEY DEFAULT ('CHAT-APPT-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS') || '-' || SUBSTR(MD5(RANDOM()::TEXT), 1, 6)),
    patient_id VARCHAR(20),
    current_step VARCHAR(50) DEFAULT 'selecting_specialty',
    selected_specialty VARCHAR(20),
    selected_doctor_id VARCHAR(20),
    selected_date DATE,
    selected_time TIME,
    symptoms TEXT,
    notes TEXT,
    session_data JSONB DEFAULT '{}'::JSONB,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 minutes')
);

-- ============================================================================
-- 6. TẠO FUNCTIONS
-- ============================================================================

-- Function lấy available slots
CREATE OR REPLACE FUNCTION hospital_dev.get_available_slots(
    p_doctor_id TEXT,
    p_date DATE
) RETURNS TABLE (
    slot_id TEXT,
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        das.slot_id::TEXT,
        das.start_time,
        das.end_time,
        das.is_available
    FROM hospital_dev.doctor_available_slots das
    WHERE das.doctor_id = p_doctor_id
      AND das.date = p_date
      AND das.is_available = true
      AND das.current_bookings < das.max_bookings
    ORDER BY das.start_time;
END;
$$ LANGUAGE plpgsql;

-- Function tạo appointment
CREATE OR REPLACE FUNCTION hospital_dev.create_appointment_simple(
    p_doctor_id TEXT,
    p_patient_id TEXT,
    p_date DATE,
    p_time TIME,
    p_notes TEXT DEFAULT ''
) RETURNS TABLE (
    success BOOLEAN,
    appointment_id TEXT,
    message TEXT
) AS $$
DECLARE
    v_appointment_id TEXT;
BEGIN
    -- Generate appointment ID
    v_appointment_id := 'APPT-DEV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
    
    -- Tạo appointment
    INSERT INTO hospital_dev.appointments (
        appointment_id,
        doctor_id,
        patient_id,
        appointment_date,
        appointment_time,
        status,
        notes,
        created_at
    ) VALUES (
        v_appointment_id,
        p_doctor_id,
        p_patient_id,
        p_date,
        p_time,
        'scheduled',
        p_notes || ' - Đặt qua chatbot (DEV)',
        NOW()
    );
    
    -- Cập nhật slot
    UPDATE hospital_dev.doctor_available_slots 
    SET current_bookings = current_bookings + 1,
        is_available = CASE WHEN current_bookings + 1 >= max_bookings THEN false ELSE true END
    WHERE doctor_id = p_doctor_id 
      AND date = p_date 
      AND start_time = p_time;
    
    RETURN QUERY SELECT true, v_appointment_id, 'Appointment created successfully';
    
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, NULL::TEXT, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. TẠO INDEXES
-- ============================================================================

CREATE INDEX idx_dev_slots_doctor_date ON hospital_dev.doctor_available_slots(doctor_id, date);
CREATE INDEX idx_dev_sessions_patient ON hospital_dev.chatbot_appointment_sessions(patient_id);

-- ============================================================================
-- 8. KIỂM TRA KẾT QUẢ
-- ============================================================================

SELECT 
    'SUCCESS: Schema hospital_dev created!' as status,
    (SELECT COUNT(*) FROM hospital_dev.doctor_available_slots) as total_slots,
    (SELECT COUNT(*) FROM hospital_dev.doctors) as total_doctors,
    (SELECT COUNT(*) FROM hospital_dev.patients) as total_patients;

-- Test function
SELECT 'Testing available slots for tomorrow:' as test_info;
SELECT slot_id, start_time, end_time FROM hospital_dev.get_available_slots('DOC-TEST-001', CURRENT_DATE + 1) LIMIT 5;
