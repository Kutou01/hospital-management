-- ============================================================================
-- CHATBOT BOOKING FUNCTIONS - ADVANCED
-- ============================================================================
-- Các functions chuyên biệt cho chatbot appointment booking
-- Sử dụng schema hospital_dev đã được backup
-- ============================================================================

-- ============================================================================
-- 1. FUNCTION LẤY DANH SÁCH BÁC SĨ THEO CHUYÊN KHOA
-- ============================================================================

CREATE OR REPLACE FUNCTION hospital_dev.get_doctors_by_specialty(
    p_specialty_id TEXT DEFAULT NULL
) RETURNS TABLE (
    doctor_id TEXT,
    doctor_name TEXT,
    specialty_name TEXT,
    consultation_fee DECIMAL,
    experience_years INTEGER,
    availability_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.doctor_id,
        p.full_name as doctor_name,
        s.name_vi as specialty_name,
        d.consultation_fee,
        d.experience_years,
        d.availability_status
    FROM hospital_dev.doctors d
    JOIN hospital_dev.profiles p ON d.profile_id = p.id
    JOIN hospital_dev.specialties s ON d.specialty_id = s.specialty_id
    WHERE (p_specialty_id IS NULL OR d.specialty_id = p_specialty_id)
      AND d.availability_status = 'available'
      AND p.is_active = true
    ORDER BY d.experience_years DESC, p.full_name;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. FUNCTION LẤY SLOTS THEO NGÀY VÀ BÁC SĨ (CHO CHATBOT)
-- ============================================================================

CREATE OR REPLACE FUNCTION hospital_dev.get_chatbot_available_slots(
    p_doctor_id TEXT,
    p_date DATE
) RETURNS TABLE (
    slot_id TEXT,
    time_display TEXT,
    start_time TIME,
    end_time TIME,
    is_morning BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        das.slot_id,
        TO_CHAR(das.start_time, 'HH24:MI') || ' - ' || TO_CHAR(das.end_time, 'HH24:MI') as time_display,
        das.start_time,
        das.end_time,
        CASE WHEN das.start_time < TIME '12:00' THEN true ELSE false END as is_morning
    FROM hospital_dev.doctor_available_slots das
    WHERE das.doctor_id = p_doctor_id
      AND das.date = p_date
      AND das.is_available = true
      AND das.current_bookings < das.max_bookings
    ORDER BY das.start_time;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. FUNCTION CẬP NHẬT SESSION CHATBOT
-- ============================================================================

CREATE OR REPLACE FUNCTION hospital_dev.update_booking_session(
    p_session_id TEXT,
    p_step TEXT DEFAULT NULL,
    p_specialty TEXT DEFAULT NULL,
    p_doctor_id TEXT DEFAULT NULL,
    p_date DATE DEFAULT NULL,
    p_time TIME DEFAULT NULL,
    p_symptoms TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_session_data JSONB DEFAULT NULL
) RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    session_info JSONB
) AS $$
DECLARE
    v_session_exists BOOLEAN;
    v_session_data JSONB;
BEGIN
    -- Kiểm tra session tồn tại và chưa hết hạn
    SELECT EXISTS(
        SELECT 1 FROM hospital_dev.chatbot_appointment_sessions 
        WHERE session_id = p_session_id 
          AND expires_at > NOW()
          AND status = 'active'
    ) INTO v_session_exists;
    
    IF NOT v_session_exists THEN
        RETURN QUERY SELECT false, 'Session không tồn tại hoặc đã hết hạn', NULL::JSONB;
        RETURN;
    END IF;
    
    -- Cập nhật session
    UPDATE hospital_dev.chatbot_appointment_sessions 
    SET 
        current_step = COALESCE(p_step, current_step),
        selected_specialty = COALESCE(p_specialty, selected_specialty),
        selected_doctor_id = COALESCE(p_doctor_id, selected_doctor_id),
        selected_date = COALESCE(p_date, selected_date),
        selected_time = COALESCE(p_time, selected_time),
        symptoms = COALESCE(p_symptoms, symptoms),
        notes = COALESCE(p_notes, notes),
        session_data = COALESCE(p_session_data, session_data),
        updated_at = NOW()
    WHERE session_id = p_session_id;
    
    -- Lấy thông tin session sau khi cập nhật
    SELECT jsonb_build_object(
        'session_id', session_id,
        'current_step', current_step,
        'selected_specialty', selected_specialty,
        'selected_doctor_id', selected_doctor_id,
        'selected_date', selected_date,
        'selected_time', selected_time,
        'symptoms', symptoms,
        'notes', notes,
        'expires_at', expires_at
    ) INTO v_session_data
    FROM hospital_dev.chatbot_appointment_sessions 
    WHERE session_id = p_session_id;
    
    RETURN QUERY SELECT true, 'Session updated successfully', v_session_data;
    
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, SQLERRM, NULL::JSONB;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. FUNCTION TẠO APPOINTMENT TỪ SESSION
-- ============================================================================

CREATE OR REPLACE FUNCTION hospital_dev.create_appointment_from_session(
    p_session_id TEXT
) RETURNS TABLE (
    success BOOLEAN,
    appointment_id TEXT,
    message TEXT,
    appointment_info JSONB
) AS $$
DECLARE
    v_session RECORD;
    v_appointment_id TEXT;
    v_appointment_info JSONB;
BEGIN
    -- Lấy thông tin session
    SELECT * INTO v_session
    FROM hospital_dev.chatbot_appointment_sessions 
    WHERE session_id = p_session_id 
      AND expires_at > NOW()
      AND status = 'active';
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::TEXT, 'Session không tồn tại hoặc đã hết hạn', NULL::JSONB;
        RETURN;
    END IF;
    
    -- Kiểm tra thông tin đầy đủ
    IF v_session.selected_doctor_id IS NULL OR 
       v_session.selected_date IS NULL OR 
       v_session.selected_time IS NULL THEN
        RETURN QUERY SELECT false, NULL::TEXT, 'Thông tin booking chưa đầy đủ', NULL::JSONB;
        RETURN;
    END IF;
    
    -- Tạo appointment ID
    v_appointment_id := 'APPT-CHAT-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
    
    -- Tạo appointment
    INSERT INTO hospital_dev.appointments (
        appointment_id,
        doctor_id,
        patient_id,
        appointment_date,
        start_time,
        end_time,
        appointment_type,
        status,
        reason,
        notes,
        created_at
    ) VALUES (
        v_appointment_id,
        v_session.selected_doctor_id,
        v_session.patient_id,
        v_session.selected_date,
        v_session.selected_time,
        v_session.selected_time + INTERVAL '30 minutes',
        'consultation',
        'scheduled',
        v_session.symptoms,
        COALESCE(v_session.notes, '') || ' - Đặt qua chatbot',
        NOW()
    );
    
    -- Cập nhật slot
    UPDATE hospital_dev.doctor_available_slots 
    SET current_bookings = current_bookings + 1,
        is_available = CASE WHEN current_bookings + 1 >= max_bookings THEN false ELSE true END
    WHERE doctor_id = v_session.selected_doctor_id 
      AND date = v_session.selected_date 
      AND start_time = v_session.selected_time;
    
    -- Đánh dấu session hoàn thành
    UPDATE hospital_dev.chatbot_appointment_sessions 
    SET status = 'completed', updated_at = NOW()
    WHERE session_id = p_session_id;
    
    -- Tạo thông tin appointment
    SELECT jsonb_build_object(
        'appointment_id', a.appointment_id,
        'doctor_name', p.full_name,
        'specialty', s.name_vi,
        'appointment_date', a.appointment_date,
        'start_time', a.start_time,
        'end_time', a.end_time,
        'status', a.status,
        'consultation_fee', d.consultation_fee
    ) INTO v_appointment_info
    FROM hospital_dev.appointments a
    JOIN hospital_dev.doctors d ON a.doctor_id = d.doctor_id
    JOIN hospital_dev.profiles p ON d.profile_id = p.id
    JOIN hospital_dev.specialties s ON d.specialty_id = s.specialty_id
    WHERE a.appointment_id = v_appointment_id;
    
    RETURN QUERY SELECT true, v_appointment_id, 'Appointment created successfully', v_appointment_info;
    
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, NULL::TEXT, SQLERRM, NULL::JSONB;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. FUNCTION LẤY THÔNG TIN SESSION
-- ============================================================================

CREATE OR REPLACE FUNCTION hospital_dev.get_session_info(
    p_session_id TEXT
) RETURNS TABLE (
    session_id TEXT,
    patient_id TEXT,
    current_step TEXT,
    selected_specialty TEXT,
    selected_doctor_id TEXT,
    doctor_name TEXT,
    specialty_name TEXT,
    selected_date DATE,
    selected_time TIME,
    symptoms TEXT,
    notes TEXT,
    status TEXT,
    expires_at TIMESTAMP,
    is_expired BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.session_id,
        s.patient_id,
        s.current_step,
        s.selected_specialty,
        s.selected_doctor_id,
        p.full_name as doctor_name,
        sp.name_vi as specialty_name,
        s.selected_date,
        s.selected_time,
        s.symptoms,
        s.notes,
        s.status,
        s.expires_at,
        CASE WHEN s.expires_at <= NOW() THEN true ELSE false END as is_expired
    FROM hospital_dev.chatbot_appointment_sessions s
    LEFT JOIN hospital_dev.doctors d ON s.selected_doctor_id = d.doctor_id
    LEFT JOIN hospital_dev.profiles p ON d.profile_id = p.id
    LEFT JOIN hospital_dev.specialties sp ON s.selected_specialty = sp.specialty_id
    WHERE s.session_id = p_session_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. FUNCTION DỌN DẸP SESSION HẾT HẠN
-- ============================================================================

CREATE OR REPLACE FUNCTION hospital_dev.cleanup_expired_sessions()
RETURNS TABLE (
    cleaned_count INTEGER,
    message TEXT
) AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Đánh dấu các session hết hạn
    UPDATE hospital_dev.chatbot_appointment_sessions 
    SET status = 'expired', updated_at = NOW()
    WHERE expires_at <= NOW() 
      AND status = 'active';
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    RETURN QUERY SELECT v_count, 'Cleaned up ' || v_count || ' expired sessions';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. TẠO INDEXES BỔ SUNG
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_dev_sessions_expires ON hospital_dev.chatbot_appointment_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_dev_sessions_step ON hospital_dev.chatbot_appointment_sessions(current_step);
CREATE INDEX IF NOT EXISTS idx_dev_doctors_specialty ON hospital_dev.doctors(specialty_id);

-- ============================================================================
-- 8. TEST CÁC FUNCTIONS MỚI
-- ============================================================================

-- Test lấy doctors by specialty
SELECT 'Testing get_doctors_by_specialty:' as test_1;
SELECT * FROM hospital_dev.get_doctors_by_specialty() LIMIT 3;

-- Test lấy chatbot slots
SELECT 'Testing get_chatbot_available_slots:' as test_2;
SELECT * FROM hospital_dev.get_chatbot_available_slots('DOC-TEST-001', CURRENT_DATE + 1) LIMIT 5;

-- Test tạo và cập nhật session
SELECT 'Testing create and update session:' as test_3;
SELECT * FROM hospital_dev.create_booking_session('PAT-TEST-001');

-- Test cleanup expired sessions
SELECT 'Testing cleanup_expired_sessions:' as test_4;
SELECT * FROM hospital_dev.cleanup_expired_sessions();

SELECT 'All chatbot functions created successfully!' as status;
