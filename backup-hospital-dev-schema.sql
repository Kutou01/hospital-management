-- ============================================================================
-- BACKUP HOSPITAL_DEV SCHEMA - CREATED ON 2025-06-27
-- ============================================================================
-- Backup của schema hospital_dev đã được tạo thành công
-- Bao gồm: tables, data, functions, indexes
-- Status: HOÀN THÀNH - 32 time slots, 1 doctor, 1 patient, 3 functions
-- ============================================================================

-- Backup toàn bộ schema hospital_dev
-- Chạy script này để restore lại schema nếu cần

-- ============================================================================
-- 1. TẠO SCHEMA
-- ============================================================================

DROP SCHEMA IF EXISTS hospital_dev CASCADE;
CREATE SCHEMA hospital_dev;

-- ============================================================================
-- 2. TẠO CẤU TRÚC BẢNG
-- ============================================================================

-- Copy cấu trúc từ public schema
CREATE TABLE hospital_dev.profiles AS SELECT * FROM public.profiles WHERE 1=0;
CREATE TABLE hospital_dev.doctors AS SELECT * FROM public.doctors WHERE 1=0;
CREATE TABLE hospital_dev.patients AS SELECT * FROM public.patients WHERE 1=0;
CREATE TABLE hospital_dev.appointments AS SELECT * FROM public.appointments WHERE 1=0;
CREATE TABLE hospital_dev.specialties AS SELECT * FROM public.specialties WHERE 1=0;
CREATE TABLE hospital_dev.departments AS SELECT * FROM public.departments WHERE 1=0;

-- Tạo bảng time slots
CREATE TABLE hospital_dev.doctor_available_slots (
    slot_id TEXT PRIMARY KEY DEFAULT ('SLOT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')),
    doctor_id TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    max_bookings INTEGER DEFAULT 1,
    current_bookings INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(doctor_id, date, start_time)
);

-- Tạo bảng session chatbot
CREATE TABLE hospital_dev.chatbot_appointment_sessions (
    session_id TEXT PRIMARY KEY DEFAULT ('CHAT-APPT-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS') || '-' || SUBSTR(MD5(RANDOM()::TEXT), 1, 6)),
    patient_id TEXT,
    current_step TEXT DEFAULT 'selecting_specialty',
    selected_specialty TEXT,
    selected_doctor_id TEXT,
    selected_date DATE,
    selected_time TIME,
    symptoms TEXT,
    notes TEXT,
    session_data JSONB DEFAULT '{}'::JSONB,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 minutes')
);

-- ============================================================================
-- 3. COPY DỮ LIỆU CẤU HÌNH
-- ============================================================================

INSERT INTO hospital_dev.specialties SELECT * FROM public.specialties;
INSERT INTO hospital_dev.departments SELECT * FROM public.departments;

-- ============================================================================
-- 4. TẠO DỮ LIỆU TEST
-- ============================================================================

INSERT INTO hospital_dev.profiles (id, email, full_name, phone_number, date_of_birth, role, is_active, created_at) 
VALUES 
    (gen_random_uuid(), 'doctor.test@hospital.com', 'BS. Nguyễn Văn Test', '0901234567', DATE '1980-01-01', 'doctor', true, NOW()),
    (gen_random_uuid(), 'patient.test@hospital.com', 'Trần Thị Test', '0901234568', DATE '1990-01-01', 'patient', true, NOW());

INSERT INTO hospital_dev.doctors (doctor_id, profile_id, license_number, specialty_id, department_id, experience_years, consultation_fee, availability_status, created_at)
SELECT 
    'DOC-TEST-001', p.id, 'BS-TEST-001',
    (SELECT specialty_id FROM hospital_dev.specialties LIMIT 1),
    (SELECT department_id FROM hospital_dev.departments LIMIT 1),
    10, 200000, 'available', NOW()
FROM hospital_dev.profiles p WHERE p.email = 'doctor.test@hospital.com';

INSERT INTO hospital_dev.patients (patient_id, profile_id, gender, status, created_at)
SELECT 'PAT-TEST-001', p.id, 'male', 'active', NOW()
FROM hospital_dev.profiles p WHERE p.email = 'patient.test@hospital.com';

-- ============================================================================
-- 5. TẠO TIME SLOTS (32 SLOTS)
-- ============================================================================

INSERT INTO hospital_dev.doctor_available_slots (slot_id, doctor_id, date, start_time, end_time, is_available, max_bookings, current_bookings)
VALUES 
    -- Ngày mai (16 slots)
    ('SLOT-001', 'DOC-TEST-001', CURRENT_DATE + 1, '08:00', '08:30', true, 1, 0),
    ('SLOT-002', 'DOC-TEST-001', CURRENT_DATE + 1, '08:30', '09:00', true, 1, 0),
    ('SLOT-003', 'DOC-TEST-001', CURRENT_DATE + 1, '09:00', '09:30', true, 1, 0),
    ('SLOT-004', 'DOC-TEST-001', CURRENT_DATE + 1, '09:30', '10:00', true, 1, 0),
    ('SLOT-005', 'DOC-TEST-001', CURRENT_DATE + 1, '10:00', '10:30', true, 1, 0),
    ('SLOT-006', 'DOC-TEST-001', CURRENT_DATE + 1, '10:30', '11:00', true, 1, 0),
    ('SLOT-007', 'DOC-TEST-001', CURRENT_DATE + 1, '11:00', '11:30', true, 1, 0),
    ('SLOT-008', 'DOC-TEST-001', CURRENT_DATE + 1, '11:30', '12:00', true, 1, 0),
    ('SLOT-009', 'DOC-TEST-001', CURRENT_DATE + 1, '13:00', '13:30', true, 1, 0),
    ('SLOT-010', 'DOC-TEST-001', CURRENT_DATE + 1, '13:30', '14:00', true, 1, 0),
    ('SLOT-011', 'DOC-TEST-001', CURRENT_DATE + 1, '14:00', '14:30', true, 1, 0),
    ('SLOT-012', 'DOC-TEST-001', CURRENT_DATE + 1, '14:30', '15:00', true, 1, 0),
    ('SLOT-013', 'DOC-TEST-001', CURRENT_DATE + 1, '15:00', '15:30', true, 1, 0),
    ('SLOT-014', 'DOC-TEST-001', CURRENT_DATE + 1, '15:30', '16:00', true, 1, 0),
    ('SLOT-015', 'DOC-TEST-001', CURRENT_DATE + 1, '16:00', '16:30', true, 1, 0),
    ('SLOT-016', 'DOC-TEST-001', CURRENT_DATE + 1, '16:30', '17:00', true, 1, 0),
    
    -- Ngày kia (16 slots)
    ('SLOT-017', 'DOC-TEST-001', CURRENT_DATE + 2, '08:00', '08:30', true, 1, 0),
    ('SLOT-018', 'DOC-TEST-001', CURRENT_DATE + 2, '08:30', '09:00', true, 1, 0),
    ('SLOT-019', 'DOC-TEST-001', CURRENT_DATE + 2, '09:00', '09:30', true, 1, 0),
    ('SLOT-020', 'DOC-TEST-001', CURRENT_DATE + 2, '09:30', '10:00', true, 1, 0),
    ('SLOT-021', 'DOC-TEST-001', CURRENT_DATE + 2, '10:00', '10:30', true, 1, 0),
    ('SLOT-022', 'DOC-TEST-001', CURRENT_DATE + 2, '10:30', '11:00', true, 1, 0),
    ('SLOT-023', 'DOC-TEST-001', CURRENT_DATE + 2, '11:00', '11:30', true, 1, 0),
    ('SLOT-024', 'DOC-TEST-001', CURRENT_DATE + 2, '11:30', '12:00', true, 1, 0),
    ('SLOT-025', 'DOC-TEST-001', CURRENT_DATE + 2, '13:00', '13:30', true, 1, 0),
    ('SLOT-026', 'DOC-TEST-001', CURRENT_DATE + 2, '13:30', '14:00', true, 1, 0),
    ('SLOT-027', 'DOC-TEST-001', CURRENT_DATE + 2, '14:00', '14:30', true, 1, 0),
    ('SLOT-028', 'DOC-TEST-001', CURRENT_DATE + 2, '14:30', '15:00', true, 1, 0),
    ('SLOT-029', 'DOC-TEST-001', CURRENT_DATE + 2, '15:00', '15:30', true, 1, 0),
    ('SLOT-030', 'DOC-TEST-001', CURRENT_DATE + 2, '15:30', '16:00', true, 1, 0),
    ('SLOT-031', 'DOC-TEST-001', CURRENT_DATE + 2, '16:00', '16:30', true, 1, 0),
    ('SLOT-032', 'DOC-TEST-001', CURRENT_DATE + 2, '16:30', '17:00', true, 1, 0);

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
    v_appointment_id := 'APPT-DEV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
    
    INSERT INTO hospital_dev.appointments (
        appointment_id, doctor_id, patient_id, appointment_date,
        start_time, end_time, appointment_type, status, notes, created_at
    ) VALUES (
        v_appointment_id, p_doctor_id, p_patient_id, p_date,
        p_time, p_time + INTERVAL '30 minutes', 'consultation', 'scheduled', 
        p_notes || ' - Đặt qua chatbot (DEV)', NOW()
    );
    
    UPDATE hospital_dev.doctor_available_slots 
    SET current_bookings = current_bookings + 1,
        is_available = CASE WHEN current_bookings + 1 >= max_bookings THEN false ELSE true END
    WHERE doctor_id = p_doctor_id AND date = p_date AND start_time = p_time;
    
    RETURN QUERY SELECT true, v_appointment_id, 'Appointment created successfully';
    
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, NULL::TEXT, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Function tạo session
CREATE OR REPLACE FUNCTION hospital_dev.create_booking_session(
    p_patient_id TEXT
) RETURNS TABLE (
    session_id TEXT,
    expires_at TIMESTAMP
) AS $$
DECLARE
    v_session_id TEXT;
    v_expires_at TIMESTAMP;
BEGIN
    v_session_id := 'CHAT-APPT-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS') || '-' || SUBSTR(MD5(RANDOM()::TEXT), 1, 6);
    v_expires_at := NOW() + INTERVAL '30 minutes';
    
    INSERT INTO hospital_dev.chatbot_appointment_sessions (session_id, patient_id, expires_at) 
    VALUES (v_session_id, p_patient_id, v_expires_at);
    
    RETURN QUERY SELECT v_session_id, v_expires_at;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. TẠO INDEXES
-- ============================================================================

CREATE INDEX idx_dev_slots_doctor_date ON hospital_dev.doctor_available_slots(doctor_id, date);
CREATE INDEX idx_dev_sessions_patient ON hospital_dev.chatbot_appointment_sessions(patient_id);
CREATE INDEX idx_dev_sessions_status ON hospital_dev.chatbot_appointment_sessions(status);

-- ============================================================================
-- 8. VERIFICATION
-- ============================================================================

SELECT 
    'BACKUP COMPLETED SUCCESSFULLY!' as status,
    (SELECT COUNT(*) FROM hospital_dev.doctor_available_slots) as total_slots,
    (SELECT COUNT(*) FROM hospital_dev.doctors) as total_doctors,
    (SELECT COUNT(*) FROM hospital_dev.patients) as total_patients,
    (SELECT COUNT(*) FROM hospital_dev.specialties) as total_specialties,
    (SELECT COUNT(*) FROM hospital_dev.departments) as total_departments;

-- ============================================================================
-- BACKUP INFO
-- ============================================================================
-- Created: 2025-06-27
-- Schema: hospital_dev
-- Tables: 8 (profiles, doctors, patients, appointments, specialties, departments, doctor_available_slots, chatbot_appointment_sessions)
-- Functions: 3 (get_available_slots, create_appointment_simple, create_booking_session)
-- Test Data: 1 doctor, 1 patient, 32 time slots
-- Status: READY FOR CHATBOT BOOKING DEVELOPMENT
-- ============================================================================
