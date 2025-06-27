-- ============================================================================
-- SỬA LỖI SYNTAX NHANH - CHẠY SCRIPT NÀY
-- ============================================================================

-- Xóa schema cũ nếu có lỗi
DROP SCHEMA IF EXISTS hospital_dev CASCADE;

-- Tạo schema mới
CREATE SCHEMA hospital_dev;

-- ============================================================================
-- 1. COPY CẤU TRÚC BẢNG
-- ============================================================================

CREATE TABLE hospital_dev.profiles AS SELECT * FROM public.profiles WHERE 1=0;
CREATE TABLE hospital_dev.departments AS SELECT * FROM public.departments WHERE 1=0;
CREATE TABLE hospital_dev.specialties AS SELECT * FROM public.specialties WHERE 1=0;
CREATE TABLE hospital_dev.doctors AS SELECT * FROM public.doctors WHERE 1=0;
CREATE TABLE hospital_dev.patients AS SELECT * FROM public.patients WHERE 1=0;
CREATE TABLE hospital_dev.appointments AS SELECT * FROM public.appointments WHERE 1=0;
CREATE TABLE hospital_dev.doctor_schedules AS SELECT * FROM public.doctor_schedules WHERE 1=0;

-- Copy chatbot tables
CREATE TABLE hospital_dev.chatbot_training_data AS SELECT * FROM public.chatbot_training_data WHERE 1=0;
CREATE TABLE hospital_dev.chatbot_conversations AS SELECT * FROM public.chatbot_conversations WHERE 1=0;
CREATE TABLE hospital_dev.symptoms AS SELECT * FROM public.symptoms WHERE 1=0;
CREATE TABLE hospital_dev.specialty_recommendations AS SELECT * FROM public.specialty_recommendations WHERE 1=0;

-- ============================================================================
-- 2. COPY DỮ LIỆU CẤU HÌNH
-- ============================================================================

INSERT INTO hospital_dev.departments SELECT * FROM public.departments;
INSERT INTO hospital_dev.specialties SELECT * FROM public.specialties;
INSERT INTO hospital_dev.chatbot_training_data SELECT * FROM public.chatbot_training_data;
INSERT INTO hospital_dev.symptoms SELECT * FROM public.symptoms;
INSERT INTO hospital_dev.specialty_recommendations SELECT * FROM public.specialty_recommendations;

-- ============================================================================
-- 3. TẠO DỮ LIỆU TEST
-- ============================================================================

-- Tạo profiles test
INSERT INTO hospital_dev.profiles (id, email, full_name, phone_number, date_of_birth, role, is_active, created_at)
SELECT
    gen_random_uuid(),
    'patient1@test.com',
    'Nguyễn Văn Test',
    '0901234567',
    '1990-01-01'::DATE,
    'patient',
    true,
    NOW()
UNION ALL
SELECT
    gen_random_uuid(),
    'patient2@test.com',
    'Trần Thị Test',
    '0901234568',
    '1985-05-15'::DATE,
    'patient',
    true,
    NOW()
UNION ALL
SELECT
    gen_random_uuid(),
    'doctor1@test.com',
    'BS. Lê Văn Test',
    '0901234569',
    '1980-03-10'::DATE,
    'doctor',
    true,
    NOW();

-- Tạo doctors và patients
INSERT INTO hospital_dev.doctors (doctor_id, profile_id, license_number, specialty_id, department_id, experience_years, consultation_fee, availability_status, created_at)
SELECT 
    'DOC-TEST-001',
    p.id,
    'BS-TEST-001',
    s.specialty_id,
    d.department_id,
    10,
    200000,
    'available',
    NOW()
FROM hospital_dev.profiles p
CROSS JOIN (SELECT specialty_id FROM hospital_dev.specialties LIMIT 1) s
CROSS JOIN (SELECT department_id FROM hospital_dev.departments LIMIT 1) d
WHERE p.email = 'doctor1@test.com';

INSERT INTO hospital_dev.patients (patient_id, profile_id, gender, status, created_at)
SELECT 'PAT-TEST-001', id, 'male', 'active', NOW()
FROM hospital_dev.profiles WHERE email = 'patient1@test.com'
UNION ALL
SELECT 'PAT-TEST-002', id, 'female', 'active', NOW()
FROM hospital_dev.profiles WHERE email = 'patient2@test.com';

-- Tạo doctor schedules
INSERT INTO hospital_dev.doctor_schedules (doctor_id, day_of_week, start_time, end_time, is_available, max_appointments, slot_duration, created_at)
SELECT 'DOC-TEST-001', day_num, '08:00', '17:00', true, 16, 30, NOW()
FROM generate_series(1, 5) as day_num;

-- ============================================================================
-- 4. TẠO BẢNG MỚI CHO CHATBOT
-- ============================================================================

-- Tạo sequences trước
CREATE SEQUENCE hospital_dev.slot_id_seq START 1;
CREATE SEQUENCE hospital_dev.chatbot_booking_seq START 1;

-- Bảng session đặt lịch
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

-- Bảng time slots
CREATE TABLE hospital_dev.doctor_available_slots (
    slot_id VARCHAR(30) PRIMARY KEY DEFAULT ('SLOT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('hospital_dev.slot_id_seq')::TEXT, 4, '0')),
    doctor_id VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    max_bookings INTEGER DEFAULT 1,
    current_bookings INTEGER DEFAULT 0,
    slot_type VARCHAR(20) DEFAULT 'consultation',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(doctor_id, date, start_time)
);

-- Bảng booking history
CREATE TABLE hospital_dev.chatbot_booking_history (
    booking_id VARCHAR(30) PRIMARY KEY DEFAULT ('CHAT-BOOK-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(NEXTVAL('hospital_dev.chatbot_booking_seq')::TEXT, 4, '0')),
    session_id VARCHAR(50),
    appointment_id VARCHAR(20),
    patient_id VARCHAR(20),
    doctor_id VARCHAR(20),
    booking_method VARCHAR(20) DEFAULT 'chatbot',
    conversation_summary TEXT,
    booking_steps JSONB,
    success BOOLEAN DEFAULT false,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 5. TẠO TIME SLOTS (SỬA LỖI SYNTAX)
-- ============================================================================

-- Tạo time slots cho 7 ngày tới
INSERT INTO hospital_dev.doctor_available_slots (doctor_id, date, start_time, end_time, is_available, max_bookings, current_bookings)
SELECT 
    'DOC-TEST-001' as doctor_id,
    (CURRENT_DATE + INTERVAL '1 day' * day_offset)::DATE as date,
    slot_time::TIME as start_time,
    (slot_time + INTERVAL '30 minutes')::TIME as end_time,
    true as is_available,
    1 as max_bookings,
    0 as current_bookings
FROM 
    generate_series(0, 6) as day_offset,
    generate_series(
        '08:00'::TIME, 
        '16:30'::TIME, 
        INTERVAL '30 minutes'
    ) as slot_time
WHERE 
    -- Chỉ tạo cho ngày làm việc (thứ 2-6)
    EXTRACT(DOW FROM (CURRENT_DATE + INTERVAL '1 day' * day_offset)) BETWEEN 1 AND 5
    -- Bỏ qua giờ nghỉ trưa
    AND slot_time NOT BETWEEN '12:00'::TIME AND '12:30'::TIME;

-- ============================================================================
-- 6. TẠO FUNCTIONS
-- ============================================================================

-- Function get available slots
CREATE OR REPLACE FUNCTION hospital_dev.get_available_slots_for_chatbot(
    p_doctor_id TEXT,
    p_date DATE,
    p_duration_minutes INTEGER DEFAULT 30
) RETURNS TABLE (
    slot_id TEXT,
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        das.slot_id,
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
CREATE OR REPLACE FUNCTION hospital_dev.create_appointment_from_chatbot(
    p_session_id TEXT
) RETURNS TABLE (
    success BOOLEAN,
    appointment_id TEXT,
    message TEXT
) AS $$
DECLARE
    v_session_data RECORD;
    v_new_appointment_id TEXT;
BEGIN
    -- Lấy thông tin session
    SELECT * INTO v_session_data
    FROM hospital_dev.chatbot_appointment_sessions
    WHERE session_id = p_session_id AND status = 'active';
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::TEXT, 'Session not found or expired';
        RETURN;
    END IF;
    
    -- Generate appointment ID
    v_new_appointment_id := 'APPT-DEV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
    
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
        v_new_appointment_id,
        v_session_data.selected_doctor_id,
        v_session_data.patient_id,
        v_session_data.selected_date,
        v_session_data.selected_time,
        'scheduled',
        COALESCE(v_session_data.symptoms, '') || ' - Đặt qua chatbot (DEV)',
        NOW()
    );
    
    -- Cập nhật session
    UPDATE hospital_dev.chatbot_appointment_sessions 
    SET status = 'completed', updated_at = NOW()
    WHERE session_id = p_session_id;
    
    RETURN QUERY SELECT true, v_new_appointment_id, 'Appointment created successfully';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. TẠO INDEXES
-- ============================================================================

CREATE INDEX idx_dev_chatbot_sessions_patient ON hospital_dev.chatbot_appointment_sessions(patient_id);
CREATE INDEX idx_dev_chatbot_sessions_status ON hospital_dev.chatbot_appointment_sessions(status);
CREATE INDEX idx_dev_available_slots_doctor_date ON hospital_dev.doctor_available_slots(doctor_id, date);

-- ============================================================================
-- HOÀN THÀNH
-- ============================================================================

SELECT 
    'Schema hospital_dev created successfully!' as status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'hospital_dev') as total_tables,
    (SELECT COUNT(*) FROM hospital_dev.doctor_available_slots) as total_slots,
    (SELECT COUNT(*) FROM hospital_dev.doctors) as total_doctors,
    (SELECT COUNT(*) FROM hospital_dev.patients) as total_patients;
