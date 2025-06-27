-- ============================================================================
-- SỬA LỖI UUID - CHẠY SCRIPT NÀY TRƯỚC
-- ============================================================================
-- Chạy script này trong SQL Editor để sửa lỗi UUID

-- Xóa schema cũ nếu có lỗi
DROP SCHEMA IF EXISTS hospital_dev CASCADE;

-- Tạo lại schema mới
CREATE SCHEMA hospital_dev;

-- Set search path
SET search_path TO hospital_dev, public;

-- ============================================================================
-- 1. COPY CẤU TRÚC BẢNG (Sửa lỗi UUID)
-- ============================================================================

-- Copy structure với đúng kiểu dữ liệu
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
CREATE TABLE hospital_dev.chatbot_conversation_context AS SELECT * FROM public.chatbot_conversation_context WHERE 1=0;
CREATE TABLE hospital_dev.chatbot_triage_rules AS SELECT * FROM public.chatbot_triage_rules WHERE 1=0;
CREATE TABLE hospital_dev.symptoms AS SELECT * FROM public.symptoms WHERE 1=0;
CREATE TABLE hospital_dev.specialty_recommendations AS SELECT * FROM public.specialty_recommendations WHERE 1=0;

-- ============================================================================
-- 2. COPY DỮ LIỆU CẤU HÌNH (An toàn)
-- ============================================================================

-- Copy departments
INSERT INTO hospital_dev.departments SELECT * FROM public.departments;

-- Copy specialties
INSERT INTO hospital_dev.specialties SELECT * FROM public.specialties;

-- Copy chatbot data
INSERT INTO hospital_dev.chatbot_training_data SELECT * FROM public.chatbot_training_data;
INSERT INTO hospital_dev.chatbot_triage_rules SELECT * FROM public.chatbot_triage_rules;
INSERT INTO hospital_dev.symptoms SELECT * FROM public.symptoms;
INSERT INTO hospital_dev.specialty_recommendations SELECT * FROM public.specialty_recommendations;

-- ============================================================================
-- 3. TẠO DỮ LIỆU TEST VỚI UUID ĐÚNG
-- ============================================================================

DO $$
DECLARE
    patient1_uuid UUID := gen_random_uuid();
    patient2_uuid UUID := gen_random_uuid();
    doctor1_uuid UUID := gen_random_uuid();
    first_specialty_id TEXT;
    first_department_id TEXT;
BEGIN
    -- Lấy specialty và department đầu tiên
    SELECT specialty_id INTO first_specialty_id FROM hospital_dev.specialties LIMIT 1;
    SELECT department_id INTO first_department_id FROM hospital_dev.departments LIMIT 1;
    
    -- Tạo profiles test với UUID
    INSERT INTO hospital_dev.profiles (id, email, full_name, phone_number, date_of_birth, role, is_active, created_at) VALUES
    (patient1_uuid, 'patient1@test.com', 'Nguyễn Văn Test', '0901234567', '1990-01-01', 'patient', true, NOW()),
    (patient2_uuid, 'patient2@test.com', 'Trần Thị Test', '0901234568', '1985-05-15', 'patient', true, NOW()),
    (doctor1_uuid, 'doctor1@test.com', 'BS. Lê Văn Test', '0901234569', '1980-03-10', 'doctor', true, NOW());

    -- Tạo doctors test
    INSERT INTO hospital_dev.doctors (doctor_id, profile_id, license_number, specialty_id, department_id, experience_years, consultation_fee, availability_status, created_at) VALUES
    ('DOC-TEST-001', doctor1_uuid, 'BS-TEST-001', first_specialty_id, first_department_id, 10, 200000, 'available', NOW());

    -- Tạo patients test
    INSERT INTO hospital_dev.patients (patient_id, profile_id, gender, status, created_at) VALUES
    ('PAT-TEST-001', patient1_uuid, 'male', 'active', NOW()),
    ('PAT-TEST-002', patient2_uuid, 'female', 'active', NOW());

    -- Tạo doctor schedules test
    INSERT INTO hospital_dev.doctor_schedules (doctor_id, day_of_week, start_time, end_time, is_available, max_appointments, slot_duration, created_at) VALUES
    ('DOC-TEST-001', 1, '08:00', '17:00', true, 16, 30, NOW()),
    ('DOC-TEST-001', 2, '08:00', '17:00', true, 16, 30, NOW()),
    ('DOC-TEST-001', 3, '08:00', '17:00', true, 16, 30, NOW()),
    ('DOC-TEST-001', 4, '08:00', '17:00', true, 16, 30, NOW()),
    ('DOC-TEST-001', 5, '08:00', '17:00', true, 16, 30, NOW());
END $$;

-- ============================================================================
-- 4. TẠO BẢNG MỚI CHO CHATBOT APPOINTMENT
-- ============================================================================

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

-- Tạo sequence cho slots
CREATE SEQUENCE hospital_dev.slot_id_seq START 1;

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

-- Tạo sequence cho booking
CREATE SEQUENCE hospital_dev.chatbot_booking_seq START 1;

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
-- 5. TẠO INDEXES
-- ============================================================================

CREATE INDEX idx_dev_chatbot_sessions_patient ON hospital_dev.chatbot_appointment_sessions(patient_id);
CREATE INDEX idx_dev_chatbot_sessions_status ON hospital_dev.chatbot_appointment_sessions(status);
CREATE INDEX idx_dev_available_slots_doctor_date ON hospital_dev.doctor_available_slots(doctor_id, date);
CREATE INDEX idx_dev_booking_history_patient ON hospital_dev.chatbot_booking_history(patient_id);

-- ============================================================================
-- 6. TẠO SAMPLE TIME SLOTS
-- ============================================================================

-- Tạo time slots cho test
DO $$
DECLARE
    target_date DATE;
    slot_time TIME;
    doctor_id TEXT := 'DOC-TEST-001';
BEGIN
    FOR i IN 0..6 LOOP
        target_date := CURRENT_DATE + INTERVAL '1 day' * i;

        IF EXTRACT(DOW FROM target_date) BETWEEN 1 AND 5 THEN
            slot_time := '08:00'::TIME;

            WHILE slot_time < '17:00'::TIME LOOP
                IF slot_time NOT BETWEEN '12:00'::TIME AND '13:00'::TIME THEN
                    INSERT INTO hospital_dev.doctor_available_slots (
                        doctor_id,
                        date,
                        start_time,
                        end_time,
                        is_available,
                        max_bookings,
                        current_bookings
                    ) VALUES (
                        doctor_id,
                        target_date,
                        slot_time,
                        slot_time + INTERVAL '30 minutes',
                        true,
                        1,
                        0
                    );
                END IF;

                slot_time := slot_time + INTERVAL '30 minutes';
            END LOOP;
        END IF;
    END LOOP;
END $$;

-- ============================================================================
-- 7. FUNCTIONS CHO CHATBOT
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

-- ============================================================================
-- HOÀN THÀNH
-- ============================================================================

SELECT 
    'Schema hospital_dev created successfully!' as status,
    COUNT(CASE WHEN table_schema = 'hospital_dev' THEN 1 END) as dev_tables,
    COUNT(CASE WHEN table_schema = 'public' THEN 1 END) as public_tables
FROM information_schema.tables 
WHERE table_schema IN ('hospital_dev', 'public');
