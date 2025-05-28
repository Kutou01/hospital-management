-- Hospital Management System - Linked Sample Data with Auto-Update Triggers
-- This script creates comprehensive sample data with proper relationships and triggers

-- =====================================================
-- 1. CREATE TRIGGERS FOR AUTO-UPDATE
-- =====================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at column
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_doctors_updated_at ON doctors;
CREATE TRIGGER update_doctors_updated_at
    BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_medical_records_updated_at ON medical_records;
CREATE TRIGGER update_medical_records_updated_at
    BEFORE UPDATE ON medical_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_prescriptions_updated_at ON prescriptions;
CREATE TRIGGER update_prescriptions_updated_at
    BEFORE UPDATE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_departments_updated_at ON departments;
CREATE TRIGGER update_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. FUNCTION TO AUTO-ASSIGN DEPARTMENT BASED ON SPECIALIZATION
-- =====================================================

CREATE OR REPLACE FUNCTION auto_assign_department()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-assign department based on specialization
    CASE
        WHEN NEW.specialization ILIKE '%nội khoa%' OR NEW.specialization ILIKE '%nội tổng hợp%' THEN
            NEW.department_id = 'DEPT001';
        WHEN NEW.specialization ILIKE '%tim mạch%' OR NEW.specialization ILIKE '%tim%' THEN
            NEW.department_id = 'DEPT002';
        WHEN NEW.specialization ILIKE '%nhi%' OR NEW.specialization ILIKE '%trẻ em%' THEN
            NEW.department_id = 'DEPT003';
        WHEN NEW.specialization ILIKE '%chấn thương%' OR NEW.specialization ILIKE '%chỉnh hình%' OR NEW.specialization ILIKE '%xương khớp%' THEN
            NEW.department_id = 'DEPT004';
        WHEN NEW.specialization ILIKE '%cấp cứu%' OR NEW.specialization ILIKE '%hồi sức%' THEN
            NEW.department_id = 'DEPT005';
        WHEN NEW.specialization ILIKE '%phụ sản%' OR NEW.specialization ILIKE '%sản khoa%' THEN
            NEW.department_id = 'DEPT006';
        WHEN NEW.specialization ILIKE '%mắt%' OR NEW.specialization ILIKE '%nhãn khoa%' THEN
            NEW.department_id = 'DEPT007';
        WHEN NEW.specialization ILIKE '%răng%' OR NEW.specialization ILIKE '%nha khoa%' OR NEW.specialization ILIKE '%hàm mặt%' THEN
            NEW.department_id = 'DEPT008';
        ELSE
            NEW.department_id = 'DEPT001'; -- Default to internal medicine
    END CASE;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to doctors table
DROP TRIGGER IF EXISTS auto_assign_doctor_department ON doctors;
CREATE TRIGGER auto_assign_doctor_department
    BEFORE INSERT OR UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION auto_assign_department();

-- =====================================================
-- 3. FUNCTION TO AUTO-UPDATE APPOINTMENT STATUS
-- =====================================================

CREATE OR REPLACE FUNCTION update_appointment_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-update status based on appointment datetime
    IF NEW.appointment_datetime < NOW() AND NEW.status = 'confirmed' THEN
        NEW.status = 'completed';
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to appointments table
DROP TRIGGER IF EXISTS auto_update_appointment_status ON appointments;
CREATE TRIGGER auto_update_appointment_status
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_appointment_status();

-- =====================================================
-- 4. UPDATE EXISTING DEPARTMENTS
-- =====================================================

-- Update departments with proper information
UPDATE departments SET
    phone_number = '028-3123-4567',
    email = 'noitong@hospital.com',
    description = 'Khoa Nội tổng hợp - điều trị các bệnh lý nội khoa',
    location = 'Tầng 2, Tòa A'
WHERE department_id = 'DEPT001';

UPDATE departments SET
    phone_number = '028-3123-4568',
    email = 'timmach@hospital.com',
    description = 'Khoa Tim mạch can thiệp',
    location = 'Tầng 5, Tòa A'
WHERE department_id = 'DEPT002';

UPDATE departments SET
    phone_number = '028-3123-4569',
    email = 'nhi@hospital.com',
    description = 'Khoa Nhi - điều trị trẻ em',
    location = 'Tầng 1, Tòa B'
WHERE department_id = 'DEPT003';

UPDATE departments SET
    phone_number = '028-3123-4570',
    email = 'chinhhinh@hospital.com',
    description = 'Khoa Chấn thương và chỉnh hình',
    location = 'Tầng 2, Tòa B'
WHERE department_id = 'DEPT004';

UPDATE departments SET
    phone_number = '028-3123-4571',
    email = 'capcuu@hospital.com',
    description = 'Khoa Cấp cứu và hồi sức',
    location = 'Tầng 1, Tòa A'
WHERE department_id = 'DEPT005';

-- Update existing departments with new names and info
UPDATE departments SET
    name = 'Khoa Phụ sản',
    description = 'Khoa Phụ sản - chăm sóc sức khỏe phụ nữ',
    location = 'Tầng 3, Tòa B',
    phone_number = '028-3123-4572',
    email = 'phusan@hospital.com'
WHERE department_id = 'DEPT006';

UPDATE departments SET
    name = 'Khoa Mắt',
    description = 'Khoa Mắt - điều trị các bệnh về mắt',
    location = 'Tầng 4, Tòa A',
    phone_number = '028-3123-4573',
    email = 'mat@hospital.com'
WHERE department_id = 'DEPT007';

UPDATE departments SET
    name = 'Khoa Răng Hàm Mặt',
    description = 'Khoa Răng Hàm Mặt - điều trị nha khoa',
    location = 'Tầng 1, Tòa C',
    phone_number = '028-3123-4574',
    email = 'ranghammat@hospital.com'
WHERE department_id = 'DEPT008';

-- =====================================================
-- 5. ADD MORE ROOMS WITH PROPER RELATIONSHIPS
-- =====================================================

-- Clear existing rooms and add comprehensive room data
DELETE FROM rooms WHERE room_id LIKE 'ROOM%';

INSERT INTO rooms (room_id, room_number, department_id, room_type, capacity, status) VALUES
-- Khoa Nội tổng hợp (DEPT001)
('ROOM001', '101', 'DEPT001', 'Phòng khám', 1, 'available'),
('ROOM002', '102', 'DEPT001', 'Phòng khám', 1, 'available'),
('ROOM003', '103', 'DEPT001', 'Phòng bệnh', 4, 'available'),
('ROOM004', '104', 'DEPT001', 'Phòng bệnh', 2, 'occupied'),
-- Khoa Tim mạch (DEPT002)
('ROOM005', '201', 'DEPT002', 'Phòng khám', 1, 'available'),
('ROOM006', '202', 'DEPT002', 'Phòng khám', 1, 'occupied'),
('ROOM007', '203', 'DEPT002', 'Phòng mổ', 1, 'available'),
('ROOM008', '204', 'DEPT002', 'Phòng hồi sức', 2, 'available'),
-- Khoa Nhi (DEPT003)
('ROOM009', '301', 'DEPT003', 'Phòng khám', 1, 'available'),
('ROOM010', '302', 'DEPT003', 'Phòng khám', 1, 'available'),
('ROOM011', '303', 'DEPT003', 'Phòng bệnh', 6, 'occupied'),
-- Khoa Chấn thương chỉnh hình (DEPT004)
('ROOM012', '401', 'DEPT004', 'Phòng khám', 1, 'available'),
('ROOM013', '402', 'DEPT004', 'Phòng mổ', 1, 'maintenance'),
('ROOM014', '403', 'DEPT004', 'Phòng bệnh', 4, 'available'),
-- Khoa Cấp cứu (DEPT005)
('ROOM015', '501', 'DEPT005', 'Phòng cấp cứu', 2, 'available'),
('ROOM016', '502', 'DEPT005', 'Phòng cấp cứu', 2, 'occupied'),
('ROOM017', '503', 'DEPT005', 'Phòng hồi sức', 1, 'available'),
-- Khoa Phụ sản (DEPT006)
('ROOM018', '601', 'DEPT006', 'Phòng khám', 1, 'available'),
('ROOM019', '602', 'DEPT006', 'Phòng sinh', 1, 'available'),
('ROOM020', '603', 'DEPT006', 'Phòng bệnh', 2, 'occupied'),
-- Khoa Mắt (DEPT007)
('ROOM021', '701', 'DEPT007', 'Phòng khám', 1, 'available'),
('ROOM022', '702', 'DEPT007', 'Phòng mổ', 1, 'available'),
-- Khoa Răng Hàm Mặt (DEPT008)
('ROOM023', '801', 'DEPT008', 'Phòng khám', 1, 'available'),
('ROOM024', '802', 'DEPT008', 'Phòng khám', 1, 'available');

-- =====================================================
-- 6. UPDATE EXISTING DOCTORS WITH PROPER SPECIALIZATIONS
-- =====================================================

-- Update existing doctors to trigger auto-department assignment
UPDATE doctors SET
    specialization = 'Nội khoa tổng hợp',
    qualification = 'Bác sĩ Chuyên khoa I',
    experience_years = 10,
    consultation_fee = 200000.00,
    bio = 'Bác sĩ có 10 năm kinh nghiệm trong lĩnh vực nội khoa',
    languages_spoken = ARRAY['Vietnamese', 'English'],
    working_hours = '{"monday": "08:00-17:00", "tuesday": "08:00-17:00", "wednesday": "08:00-17:00", "thursday": "08:00-17:00", "friday": "08:00-17:00"}'::jsonb
WHERE doctor_id = 'DOC001';

-- Update other existing doctors
UPDATE doctors SET
    specialization = 'Tim mạch',
    qualification = 'Bác sĩ Chuyên khoa II',
    experience_years = 15,
    consultation_fee = 300000.00,
    bio = 'Bác sĩ chuyên khoa tim mạch với 15 năm kinh nghiệm',
    languages_spoken = ARRAY['Vietnamese', 'English'],
    working_hours = '{"monday": "08:00-17:00", "tuesday": "08:00-17:00", "wednesday": "08:00-17:00", "thursday": "08:00-17:00", "friday": "08:00-17:00"}'::jsonb
WHERE doctor_id = 'DOC142946';

UPDATE doctors SET
    specialization = 'Nhi khoa',
    qualification = 'Bác sĩ Chuyên khoa I',
    experience_years = 8,
    consultation_fee = 250000.00,
    bio = 'Bác sĩ nhi khoa chuyên điều trị trẻ em',
    languages_spoken = ARRAY['Vietnamese'],
    working_hours = '{"monday": "08:00-17:00", "tuesday": "08:00-17:00", "wednesday": "08:00-17:00", "thursday": "08:00-17:00", "friday": "08:00-12:00"}'::jsonb
WHERE doctor_id = 'DOC1748359569';

-- =====================================================
-- 7. ADD SAMPLE APPOINTMENTS WITH PROPER RELATIONSHIPS
-- =====================================================

-- Clear existing appointments and add linked data
DELETE FROM appointments WHERE appointment_id LIKE 'APT%';

INSERT INTO appointments (appointment_id, patient_id, doctor_id, appointment_datetime, duration_minutes, type, status, reason, notes, room_id, created_by) VALUES
-- Completed appointments (past dates)
('APT001', 'PAT001', 'DOC001', '2024-01-15 09:00:00+07', 30, 'Khám tổng quát', 'completed', 'Khám sức khỏe định kỳ', 'Bệnh nhân khỏe mạnh, tiếp tục theo dõi huyết áp', 'ROOM001', (SELECT id FROM profiles WHERE email = 'doctor1@hospital.com')),
('APT002', 'PAT426749', 'DOC142946', '2024-01-16 10:30:00+07', 45, 'Khám chuyên khoa', 'completed', 'Đau ngực, khó thở', 'Đã làm ECG, kết quả bình thường', 'ROOM005', (SELECT id FROM profiles WHERE email = 'namprophunong007@gmail.com')),
('APT003', 'PAT522843', 'DOC1748359569', '2024-01-17 14:00:00+07', 30, 'Khám tổng quát', 'completed', 'Khám sức khỏe trẻ em', 'Trẻ phát triển bình thường', 'ROOM009', (SELECT id FROM profiles WHERE email = 'doctor30@gmail.com')),

-- Upcoming appointments (future dates)
('APT004', 'PAT001', 'DOC001', '2024-02-15 09:00:00+07', 30, 'Tái khám', 'confirmed', 'Tái khám sau điều trị', NULL, 'ROOM001', (SELECT id FROM profiles WHERE email = 'doctor1@hospital.com')),
('APT005', 'PAT426749', 'DOC142946', '2024-02-16 14:30:00+07', 45, 'Khám chuyên khoa', 'confirmed', 'Theo dõi tim mạch', NULL, 'ROOM005', (SELECT id FROM profiles WHERE email = 'namprophunong007@gmail.com')),
('APT006', 'PAT522843', 'DOC1748359569', '2024-02-17 10:00:00+07', 30, 'Khám chuyên khoa', 'pending', 'Khám định kỳ', NULL, 'ROOM009', (SELECT id FROM profiles WHERE email = 'doctor30@gmail.com')),

-- Emergency appointments
('APT007', 'PAT001', 'DOC001', '2024-02-20 08:00:00+07', 60, 'Khám cấp cứu', 'confirmed', 'Đau bụng dữ dội', NULL, 'ROOM015', (SELECT id FROM profiles WHERE email = 'doctor1@hospital.com'));

-- =====================================================
-- 8. ADD MEDICAL RECORDS LINKED TO APPOINTMENTS
-- =====================================================

-- Clear existing medical records and add linked data
DELETE FROM medical_records WHERE record_id LIKE 'MR%';

INSERT INTO medical_records (record_id, patient_id, doctor_id, appointment_id, visit_date, chief_complaint, present_illness, past_medical_history, physical_examination, vital_signs, diagnosis, treatment_plan, medications, follow_up_instructions, status) VALUES
('MR001', 'PAT001', 'DOC001', 'APT001', '2024-01-15 09:00:00+07',
 'Khám sức khỏe định kỳ',
 'Bệnh nhân đến khám sức khỏe định kỳ, không có triệu chứng bất thường',
 'Tiền sử cao huyết áp',
 '{"general": "Tỉnh táo, tiếp xúc tốt", "cardiovascular": "Tim đều, không tiếng thổi", "respiratory": "Phổi trong, không ran", "abdomen": "Bụng mềm, không đau ấn"}'::jsonb,
 '{"temperature": "36.5°C", "blood_pressure": "130/85 mmHg", "heart_rate": "72 bpm", "respiratory_rate": "18/min", "weight": "65 kg", "height": "165 cm"}'::jsonb,
 'Cao huyết áp độ 1',
 'Tiếp tục dùng thuốc hạ áp, chế độ ăn ít muối, tập thể dục đều đặn',
 '[{"name": "Amlodipine", "dosage": "5mg", "frequency": "1 lần/ngày", "duration": "30 ngày"}]'::jsonb,
 'Tái khám sau 3 tháng, theo dõi huyết áp tại nhà',
 'completed'),

('MR002', 'PAT426749', 'DOC142946', 'APT002', '2024-01-16 10:30:00+07',
 'Đau ngực, khó thở',
 'Bệnh nhân than đau ngực trái, khó thở khi gắng sức từ 2 ngày nay',
 'Không có tiền sử bệnh tim mạch',
 '{"general": "Tỉnh táo, lo lắng", "cardiovascular": "Tim đều, không tiếng thổi bất thường", "respiratory": "Phổi trong, thở đều", "extremities": "Không phù"}'::jsonb,
 '{"temperature": "36.8°C", "blood_pressure": "140/90 mmHg", "heart_rate": "88 bpm", "respiratory_rate": "20/min", "oxygen_saturation": "98%"}'::jsonb,
 'Đau ngực không đặc hiệu, loại trừ hội chứng mạch vành cấp',
 'Theo dõi, thuốc giảm đau, tái khám nếu có triệu chứng',
 '[{"name": "Paracetamol", "dosage": "500mg", "frequency": "3 lần/ngày khi đau", "duration": "7 ngày"}]'::jsonb,
 'Tái khám ngay nếu đau ngực tăng hoặc khó thở nhiều hơn',
 'completed');

-- =====================================================
-- 9. ADD PRESCRIPTIONS LINKED TO MEDICAL RECORDS
-- =====================================================

-- Clear existing prescriptions and add linked data
DELETE FROM prescriptions WHERE prescription_id LIKE 'PRE%';

INSERT INTO prescriptions (prescription_id, patient_id, doctor_id, medical_record_id, medications, instructions, issued_date, valid_until, status) VALUES
('PRE001', 'PAT001', 'DOC001', 'MR001',
 '[{"name": "Amlodipine", "dosage": "5mg", "frequency": "1 lần/ngày buổi sáng", "quantity": 30, "unit": "viên", "instructions": "Uống sau ăn sáng"}]'::jsonb,
 'Uống thuốc đều đặn, không được tự ý ngừng thuốc. Theo dõi huyết áp tại nhà.',
 '2024-01-15', '2024-02-15', 'active'),

('PRE002', 'PAT426749', 'DOC142946', 'MR002',
 '[{"name": "Paracetamol", "dosage": "500mg", "frequency": "3 lần/ngày khi đau", "quantity": 21, "unit": "viên", "instructions": "Uống khi đau, cách nhau ít nhất 4 giờ"}]'::jsonb,
 'Chỉ uống khi đau ngực. Tái khám ngay nếu triệu chứng không cải thiện.',
 '2024-01-16', '2024-01-23', 'expired');

-- =====================================================
-- 10. CREATE VIEWS FOR EASY DATA ACCESS
-- =====================================================

-- View for complete doctor information
CREATE OR REPLACE VIEW doctor_details AS
SELECT
    d.doctor_id,
    p.full_name,
    p.email,
    p.phone_number,
    d.license_number,
    d.specialization,
    d.qualification,
    d.experience_years,
    d.consultation_fee,
    d.status,
    d.bio,
    d.languages_spoken,
    d.working_hours,
    dept.name as department_name,
    dept.location as department_location,
    d.created_at,
    d.updated_at
FROM doctors d
JOIN profiles p ON d.profile_id = p.id
LEFT JOIN departments dept ON d.department_id = dept.department_id
WHERE p.is_active = true AND d.status = 'active';

-- View for complete patient information
CREATE OR REPLACE VIEW patient_details AS
SELECT
    pt.patient_id,
    p.full_name,
    p.email,
    p.phone_number,
    pt.date_of_birth,
    pt.gender,
    pt.blood_type,
    pt.address,
    pt.emergency_contact,
    pt.insurance_info,
    pt.allergies,
    pt.chronic_conditions,
    pt.medical_notes,
    pt.registration_date,
    pt.status,
    EXTRACT(YEAR FROM AGE(pt.date_of_birth)) as age,
    pt.created_at,
    pt.updated_at
FROM patients pt
JOIN profiles p ON pt.profile_id = p.id
WHERE p.is_active = true AND pt.status = 'active';

-- View for appointment details with related information
CREATE OR REPLACE VIEW appointment_details AS
SELECT
    a.appointment_id,
    a.appointment_datetime,
    a.duration_minutes,
    a.type,
    a.status,
    a.reason,
    a.notes,
    -- Patient info
    pt.patient_id,
    pt_profile.full_name as patient_name,
    pt_profile.phone_number as patient_phone,
    -- Doctor info
    d.doctor_id,
    dr_profile.full_name as doctor_name,
    d.specialization as doctor_specialization,
    -- Room info
    r.room_number,
    r.room_type,
    dept.name as department_name,
    -- Creator info
    creator.full_name as created_by_name,
    a.created_at,
    a.updated_at
FROM appointments a
JOIN patients pt ON a.patient_id = pt.patient_id
JOIN profiles pt_profile ON pt.profile_id = pt_profile.id
JOIN doctors d ON a.doctor_id = d.doctor_id
JOIN profiles dr_profile ON d.profile_id = dr_profile.id
LEFT JOIN rooms r ON a.room_id = r.room_id
LEFT JOIN departments dept ON r.department_id = dept.department_id
LEFT JOIN profiles creator ON a.created_by = creator.id;

-- =====================================================
-- 11. CREATE FUNCTIONS FOR STATISTICS
-- =====================================================

-- Function to get dashboard statistics
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE(
    total_patients bigint,
    total_doctors bigint,
    total_departments bigint,
    total_rooms bigint,
    available_rooms bigint,
    occupied_rooms bigint,
    appointments_today bigint,
    appointments_pending bigint,
    appointments_confirmed bigint,
    appointments_completed bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM patients WHERE status = 'active'),
        (SELECT COUNT(*) FROM doctors WHERE status = 'active'),
        (SELECT COUNT(*) FROM departments WHERE is_active = true),
        (SELECT COUNT(*) FROM rooms),
        (SELECT COUNT(*) FROM rooms WHERE status = 'available'),
        (SELECT COUNT(*) FROM rooms WHERE status = 'occupied'),
        (SELECT COUNT(*) FROM appointments WHERE DATE(appointment_datetime) = CURRENT_DATE),
        (SELECT COUNT(*) FROM appointments WHERE status = 'pending'),
        (SELECT COUNT(*) FROM appointments WHERE status = 'confirmed'),
        (SELECT COUNT(*) FROM appointments WHERE status = 'completed');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 12. FINAL DATA CONSISTENCY CHECK
-- =====================================================

-- Update department head doctors
UPDATE departments SET head_doctor_id = 'DOC001' WHERE department_id = 'DEPT001';
UPDATE departments SET head_doctor_id = 'DOC142946' WHERE department_id = 'DEPT002';
UPDATE departments SET head_doctor_id = 'DOC1748359569' WHERE department_id = 'DEPT003';

-- Ensure all timestamps are current
UPDATE departments SET updated_at = CURRENT_TIMESTAMP;
UPDATE doctors SET updated_at = CURRENT_TIMESTAMP;
UPDATE patients SET updated_at = CURRENT_TIMESTAMP;
