-- ============================================================================
-- TẠO SCHEMA DEVELOPMENT TRONG PROJECT CŨ
-- ============================================================================
-- Chạy script này trong SQL Editor của Supabase project hiện tại

-- Tạo schema mới
CREATE SCHEMA IF NOT EXISTS hospital_dev;

-- Set search path
SET search_path TO hospital_dev, public;

-- ============================================================================
-- 1. COPY CẤU TRÚC BẢNG (không copy dữ liệu thực)
-- ============================================================================

-- Copy structure của các bảng chính
CREATE TABLE hospital_dev.profiles AS SELECT * FROM public.profiles WHERE 1=0;
CREATE TABLE hospital_dev.departments AS SELECT * FROM public.departments WHERE 1=0;
CREATE TABLE hospital_dev.specialties AS SELECT * FROM public.specialties WHERE 1=0;
CREATE TABLE hospital_dev.doctors AS SELECT * FROM public.doctors WHERE 1=0;
CREATE TABLE hospital_dev.patients AS SELECT * FROM public.patients WHERE 1=0;
CREATE TABLE hospital_dev.appointments AS SELECT * FROM public.appointments WHERE 1=0;
CREATE TABLE hospital_dev.doctor_schedules AS SELECT * FROM public.doctor_schedules WHERE 1=0;
CREATE TABLE hospital_dev.medical_records AS SELECT * FROM public.medical_records WHERE 1=0;

-- Copy chatbot tables structure
CREATE TABLE hospital_dev.chatbot_training_data AS SELECT * FROM public.chatbot_training_data WHERE 1=0;
CREATE TABLE hospital_dev.chatbot_conversations AS SELECT * FROM public.chatbot_conversations WHERE 1=0;
CREATE TABLE hospital_dev.chatbot_conversation_context AS SELECT * FROM public.chatbot_conversation_context WHERE 1=0;
CREATE TABLE hospital_dev.chatbot_triage_rules AS SELECT * FROM public.chatbot_triage_rules WHERE 1=0;
CREATE TABLE hospital_dev.symptoms AS SELECT * FROM public.symptoms WHERE 1=0;
CREATE TABLE hospital_dev.specialty_recommendations AS SELECT * FROM public.specialty_recommendations WHERE 1=0;

-- ============================================================================
-- 2. COPY DỮ LIỆU CẤU HÌNH HỆ THỐNG (An toàn)
-- ============================================================================

-- Copy departments
INSERT INTO hospital_dev.departments SELECT * FROM public.departments;

-- Copy specialties
INSERT INTO hospital_dev.specialties SELECT * FROM public.specialties;

-- Copy chatbot training data
INSERT INTO hospital_dev.chatbot_training_data SELECT * FROM public.chatbot_training_data;
INSERT INTO hospital_dev.chatbot_triage_rules SELECT * FROM public.chatbot_triage_rules;
INSERT INTO hospital_dev.symptoms SELECT * FROM public.symptoms;
INSERT INTO hospital_dev.specialty_recommendations SELECT * FROM public.specialty_recommendations;

-- ============================================================================
-- 3. TẠO DỮ LIỆU TEST
-- ============================================================================

-- Tạo profiles test với UUID hợp lệ
INSERT INTO hospital_dev.profiles (id, email, full_name, phone_number, date_of_birth, role, is_active, created_at) VALUES
(gen_random_uuid(), 'patient1@test.com', 'Nguyễn Văn Test', '0901234567', '1990-01-01', 'patient', true, NOW()),
(gen_random_uuid(), 'patient2@test.com', 'Trần Thị Test', '0901234568', '1985-05-15', 'patient', true, NOW()),
(gen_random_uuid(), 'doctor1@test.com', 'BS. Lê Văn Test', '0901234569', '1980-03-10', 'doctor', true, NOW());

-- Lấy UUID vừa tạo để sử dụng
DO $$
DECLARE
    patient1_uuid UUID;
    patient2_uuid UUID;
    doctor1_uuid UUID;
    specialty_id TEXT;
    department_id TEXT;
BEGIN
    -- Lấy UUID của profiles vừa tạo
    SELECT id INTO patient1_uuid FROM hospital_dev.profiles WHERE email = 'patient1@test.com';
    SELECT id INTO patient2_uuid FROM hospital_dev.profiles WHERE email = 'patient2@test.com';
    SELECT id INTO doctor1_uuid FROM hospital_dev.profiles WHERE email = 'doctor1@test.com';

    -- Lấy specialty_id và department_id đầu tiên có sẵn
    SELECT specialty_id INTO specialty_id FROM hospital_dev.specialties LIMIT 1;
    SELECT department_id INTO department_id FROM hospital_dev.departments LIMIT 1;

    -- Tạo doctors test
    INSERT INTO hospital_dev.doctors (doctor_id, profile_id, license_number, specialty_id, department_id, experience_years, consultation_fee, availability_status, created_at) VALUES
    ('DOC-TEST-001', doctor1_uuid, 'BS-TEST-001', specialty_id, department_id, 10, 200000, 'available', NOW());

    -- Tạo patients test
    INSERT INTO hospital_dev.patients (patient_id, profile_id, gender, status, created_at) VALUES
    ('PAT-TEST-001', patient1_uuid, 'male', 'active', NOW()),
    ('PAT-TEST-002', patient2_uuid, 'female', 'active', NOW());
END $$;

-- Tạo doctor schedules test
INSERT INTO hospital_dev.doctor_schedules (doctor_id, day_of_week, start_time, end_time, is_available, max_appointments, slot_duration, created_at) VALUES
('DOC-TEST-001', 1, '08:00', '17:00', true, 16, 30, NOW()),
('DOC-TEST-001', 2, '08:00', '17:00', true, 16, 30, NOW()),
('DOC-TEST-001', 3, '08:00', '17:00', true, 16, 30, NOW()),
('DOC-TEST-001', 4, '08:00', '17:00', true, 16, 30, NOW()),
('DOC-TEST-001', 5, '08:00', '17:00', true, 16, 30, NOW());

-- ============================================================================
-- 4. TẠO BẢNG MỚI CHO CHATBOT APPOINTMENT BOOKING
-- ============================================================================

-- Bảng session đặt lịch qua chatbot
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

-- Bảng time slots available
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

-- Tạo sequence trong schema mới
CREATE SEQUENCE hospital_dev.slot_id_seq START 1;

-- Bảng lịch sử đặt lịch qua chatbot
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

-- Tạo sequence cho booking
CREATE SEQUENCE hospital_dev.chatbot_booking_seq START 1;

-- ============================================================================
-- 5. TẠO INDEXES
-- ============================================================================

CREATE INDEX idx_dev_chatbot_sessions_patient ON hospital_dev.chatbot_appointment_sessions(patient_id);
CREATE INDEX idx_dev_chatbot_sessions_status ON hospital_dev.chatbot_appointment_sessions(status);
CREATE INDEX idx_dev_available_slots_doctor_date ON hospital_dev.doctor_available_slots(doctor_id, date);
CREATE INDEX idx_dev_booking_history_patient ON hospital_dev.chatbot_booking_history(patient_id);

-- ============================================================================
-- 6. TẠO FUNCTIONS CHO SCHEMA DEV
-- ============================================================================

-- Function tìm available slots trong dev schema
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

-- Function tạo appointment từ chatbot trong dev schema
CREATE OR REPLACE FUNCTION hospital_dev.create_appointment_from_chatbot(
    p_session_id TEXT,
    p_appointment_data JSONB
) RETURNS TABLE (
    success BOOLEAN,
    appointment_id TEXT,
    message TEXT
) AS $$
DECLARE
    v_appointment_id TEXT;
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
    
    -- Tạo appointment trong dev schema
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
    
    -- Cập nhật session status
    UPDATE hospital_dev.chatbot_appointment_sessions 
    SET status = 'completed', updated_at = NOW()
    WHERE session_id = p_session_id;
    
    -- Lưu booking history
    INSERT INTO hospital_dev.chatbot_booking_history (
        session_id,
        appointment_id,
        patient_id,
        doctor_id,
        success,
        conversation_summary
    ) VALUES (
        p_session_id,
        v_new_appointment_id,
        v_session_data.patient_id,
        v_session_data.selected_doctor_id,
        true,
        'Đặt lịch thành công qua chatbot (DEV)'
    );
    
    RETURN QUERY SELECT true, v_new_appointment_id, 'Appointment created successfully in DEV';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. TẠO SAMPLE TIME SLOTS CHO TEST
-- ============================================================================

-- Tạo time slots cho 7 ngày tới
DO $$
DECLARE
    current_date DATE;
    slot_time TIME;
    doctor_id TEXT := 'DOC-TEST-001';
BEGIN
    -- Tạo slots cho 7 ngày tới
    FOR i IN 0..6 LOOP
        current_date := CURRENT_DATE + i;
        
        -- Chỉ tạo slots cho ngày làm việc (thứ 2-6)
        IF EXTRACT(DOW FROM current_date) BETWEEN 1 AND 5 THEN
            -- Tạo slots từ 8:00 đến 17:00, mỗi slot 30 phút
            slot_time := '08:00'::TIME;
            
            WHILE slot_time < '17:00'::TIME LOOP
                -- Bỏ qua giờ nghỉ trưa (12:00-13:00)
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
                        current_date,
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
-- HOÀN THÀNH
-- ============================================================================

SELECT 'Development schema created successfully!' as status,
       'hospital_dev' as schema_name,
       COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'hospital_dev';
