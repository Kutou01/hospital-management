-- =====================================================
-- HOSPITAL MANAGEMENT SYSTEM - SAMPLE DATA
-- =====================================================
-- This script creates sample data for testing the hospital management system
-- Run this in Supabase SQL Editor after setting up the database schema

-- =====================================================
-- 1. CLEAR EXISTING DATA (OPTIONAL)
-- =====================================================
-- Uncomment these lines if you want to start fresh
-- DELETE FROM medical_records;
-- DELETE FROM prescriptions;
-- DELETE FROM appointments;
-- DELETE FROM patients;
-- DELETE FROM doctors;
-- DELETE FROM admins;
-- DELETE FROM departments;
-- DELETE FROM rooms;
-- DELETE FROM profiles;

-- =====================================================
-- 2. CREATE TEST USER ACCOUNTS IN SUPABASE AUTH
-- =====================================================
-- Note: These need to be created through Supabase Auth API or Dashboard
-- We'll create the profiles manually with UUIDs that match auth.users

-- =====================================================
-- 3. INSERT DEPARTMENTS
-- =====================================================
INSERT INTO departments (department_id, name, description, location, phone_number, email, is_active) VALUES
('DEPT001', 'Khoa Nội', 'Khoa Nội tổng hợp - điều trị các bệnh lý nội khoa', 'Tầng 2, Tòa A', '0123456789', 'noi@hospital.com', true),
('DEPT002', 'Khoa Ngoại', 'Khoa Phẫu thuật tổng hợp', 'Tầng 3, Tòa A', '0123456790', 'ngoai@hospital.com', true),
('DEPT003', 'Khoa Sản', 'Khoa Sản phụ khoa', 'Tầng 4, Tòa B', '0123456791', 'san@hospital.com', true),
('DEPT004', 'Khoa Nhi', 'Khoa Nhi - điều trị trẻ em', 'Tầng 1, Tòa B', '0123456792', 'nhi@hospital.com', true),
('DEPT005', 'Khoa Tim mạch', 'Khoa Tim mạch can thiệp', 'Tầng 5, Tòa A', '0123456793', 'tim@hospital.com', true),
('DEPT006', 'Khoa Thần kinh', 'Khoa Thần kinh học', 'Tầng 6, Tòa A', '0123456794', 'thankinh@hospital.com', true),
('DEPT007', 'Khoa Chấn thương chỉnh hình', 'Khoa Chấn thương và chỉnh hình', 'Tầng 2, Tòa B', '0123456795', 'chanthuong@hospital.com', true);

-- =====================================================
-- 4. INSERT ROOMS
-- =====================================================
INSERT INTO rooms (room_id, room_number, room_type, department_id, capacity, status, equipment, location) VALUES
('ROOM001', '101', 'consultation', 'DEPT001', 1, 'available', '["desk", "chair", "examination_bed", "computer"]', 'Tầng 1, Tòa A'),
('ROOM002', '102', 'consultation', 'DEPT001', 1, 'available', '["desk", "chair", "examination_bed", "computer"]', 'Tầng 1, Tòa A'),
('ROOM003', '201', 'consultation', 'DEPT002', 1, 'available', '["desk", "chair", "examination_bed", "computer"]', 'Tầng 2, Tòa A'),
('ROOM004', '202', 'surgery', 'DEPT002', 1, 'available', '["operating_table", "anesthesia_machine", "monitors"]', 'Tầng 2, Tòa A'),
('ROOM005', '301', 'consultation', 'DEPT003', 1, 'available', '["desk", "chair", "examination_bed", "ultrasound"]', 'Tầng 3, Tòa B'),
('ROOM006', '401', 'consultation', 'DEPT004', 1, 'available', '["desk", "chair", "pediatric_bed", "toys"]', 'Tầng 4, Tòa B'),
('ROOM007', '501', 'consultation', 'DEPT005', 1, 'available', '["desk", "chair", "examination_bed", "ecg_machine"]', 'Tầng 5, Tòa A'),
('ROOM008', '502', 'procedure', 'DEPT005', 1, 'available', '["cathlab_equipment", "monitors", "emergency_cart"]', 'Tầng 5, Tòa A');

-- =====================================================
-- 5. INSERT PROFILES (TEST ACCOUNTS)
-- =====================================================
-- Admin Account
INSERT INTO profiles (id, email, full_name, phone_number, role, is_active, email_verified) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@hospital.com', 'Nguyễn Văn Admin', '0901234567', 'admin', true, true);

-- Doctor Accounts
INSERT INTO profiles (id, email, full_name, phone_number, role, is_active, email_verified) VALUES
('22222222-2222-2222-2222-222222222222', 'doctor1@hospital.com', 'Bác sĩ Nguyễn Văn A', '0901234568', 'doctor', true, true),
('33333333-3333-3333-3333-333333333333', 'doctor2@hospital.com', 'Bác sĩ Trần Thị B', '0901234569', 'doctor', true, true),
('44444444-4444-4444-4444-444444444444', 'doctor3@hospital.com', 'Bác sĩ Lê Văn C', '0901234570', 'doctor', true, true),
('55555555-5555-5555-5555-555555555555', 'doctor4@hospital.com', 'Bác sĩ Phạm Thị D', '0901234571', 'doctor', true, true),
('66666666-6666-6666-6666-666666666666', 'doctor5@hospital.com', 'Bác sĩ Hoàng Văn E', '0901234572', 'doctor', true, true);

-- Patient Accounts
INSERT INTO profiles (id, email, full_name, phone_number, role, is_active, email_verified) VALUES
('77777777-7777-7777-7777-777777777777', 'patient1@gmail.com', 'Nguyễn Thị Hoa', '0901234573', 'patient', true, true),
('88888888-8888-8888-8888-888888888888', 'patient2@gmail.com', 'Trần Văn Nam', '0901234574', 'patient', true, true),
('99999999-9999-9999-9999-999999999999', 'patient3@gmail.com', 'Lê Thị Mai', '0901234575', 'patient', true, true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'patient4@gmail.com', 'Phạm Văn Đức', '0901234576', 'patient', true, true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'patient5@gmail.com', 'Hoàng Thị Lan', '0901234577', 'patient', true, true);

-- =====================================================
-- 6. INSERT ADMINS
-- =====================================================
INSERT INTO admins (admin_id, profile_id, employee_id, position, department_access, permissions, hire_date, status) VALUES
('ADM001', '11111111-1111-1111-1111-111111111111', 'EMP001', 'Quản trị viên hệ thống', '["all"]', '["all"]', '2023-01-01', 'active');

-- =====================================================
-- 7. INSERT DOCTORS
-- =====================================================
INSERT INTO doctors (doctor_id, profile_id, license_number, specialization, qualification, experience_years, consultation_fee, department_id, status, bio, languages_spoken, working_hours) VALUES
('DOC001', '22222222-2222-2222-2222-222222222222', 'BS001234', 'Nội khoa tổng hợp', 'Bác sĩ Chuyên khoa I', 10, 200000, 'DEPT001', 'active', 'Bác sĩ có 10 năm kinh nghiệm trong lĩnh vực nội khoa', '["Vietnamese", "English"]', '{"monday": "08:00-17:00", "tuesday": "08:00-17:00", "wednesday": "08:00-17:00", "thursday": "08:00-17:00", "friday": "08:00-17:00"}'),
('DOC002', '33333333-3333-3333-3333-333333333333', 'BS001235', 'Phẫu thuật tổng hợp', 'Bác sĩ Chuyên khoa II', 15, 300000, 'DEPT002', 'active', 'Bác sĩ phẫu thuật có 15 năm kinh nghiệm', '["Vietnamese", "English"]', '{"monday": "07:00-16:00", "tuesday": "07:00-16:00", "wednesday": "07:00-16:00", "thursday": "07:00-16:00", "friday": "07:00-16:00"}'),
('DOC003', '44444444-4444-4444-4444-444444444444', 'BS001236', 'Sản phụ khoa', 'Bác sĩ Chuyên khoa I', 8, 250000, 'DEPT003', 'active', 'Chuyên gia sản phụ khoa với nhiều năm kinh nghiệm', '["Vietnamese"]', '{"monday": "08:00-17:00", "tuesday": "08:00-17:00", "wednesday": "08:00-17:00", "thursday": "08:00-17:00", "friday": "08:00-17:00"}'),
('DOC004', '55555555-5555-5555-5555-555555555555', 'BS001237', 'Nhi khoa', 'Bác sĩ Chuyên khoa I', 12, 180000, 'DEPT004', 'active', 'Bác sĩ nhi khoa tận tâm với trẻ em', '["Vietnamese", "English"]', '{"monday": "08:00-17:00", "tuesday": "08:00-17:00", "wednesday": "08:00-17:00", "thursday": "08:00-17:00", "friday": "08:00-17:00"}'),
('DOC005', '66666666-6666-6666-6666-666666666666', 'BS001238', 'Tim mạch', 'Bác sĩ Chuyên khoa II', 20, 400000, 'DEPT005', 'active', 'Chuyên gia tim mạch hàng đầu', '["Vietnamese", "English", "French"]', '{"monday": "08:00-17:00", "tuesday": "08:00-17:00", "wednesday": "08:00-17:00", "thursday": "08:00-17:00", "friday": "08:00-17:00"}');

-- =====================================================
-- 8. INSERT PATIENTS
-- =====================================================
INSERT INTO patients (patient_id, profile_id, date_of_birth, gender, blood_type, address, emergency_contact, insurance_info, allergies, chronic_conditions, medical_notes, registration_date, status) VALUES
('PAT001', '77777777-7777-7777-7777-777777777777', '1990-05-15', 'female', 'A+', '{"street": "123 Nguyễn Văn Cừ", "district": "Quận 5", "city": "TP.HCM", "zipcode": "70000"}', '{"name": "Nguyễn Văn Tùng", "relationship": "Chồng", "phone": "0901234578"}', '{"provider": "BHYT", "policy_number": "HS4020123456789", "expiry_date": "2024-12-31"}', '["Penicillin"]', '["Cao huyết áp"]', 'Bệnh nhân có tiền sử cao huyết áp, cần theo dõi thường xuyên', '2023-01-15', 'active'),
('PAT002', '88888888-8888-8888-8888-888888888888', '1985-08-22', 'male', 'B+', '{"street": "456 Lê Văn Sỹ", "district": "Quận 3", "city": "TP.HCM", "zipcode": "70000"}', '{"name": "Trần Thị Lan", "relationship": "Vợ", "phone": "0901234579"}', '{"provider": "BHYT", "policy_number": "HS4020123456790", "expiry_date": "2024-12-31"}', '[]', '["Tiểu đường type 2"]', 'Bệnh nhân tiểu đường, cần kiểm soát đường huyết', '2023-02-10', 'active'),
('PAT003', '99999999-9999-9999-9999-999999999999', '1995-12-03', 'female', 'O+', '{"street": "789 Võ Văn Tần", "district": "Quận 1", "city": "TP.HCM", "zipcode": "70000"}', '{"name": "Lê Văn Minh", "relationship": "Anh trai", "phone": "0901234580"}', '{"provider": "Bảo hiểm tư nhân", "policy_number": "PV123456789", "expiry_date": "2024-12-31"}', '["Tôm cua"]', '[]', 'Bệnh nhân khỏe mạnh, không có bệnh lý mãn tính', '2023-03-05', 'active'),
('PAT004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '1978-04-18', 'male', 'AB+', '{"street": "321 Điện Biên Phủ", "district": "Quận Bình Thạnh", "city": "TP.HCM", "zipcode": "70000"}', '{"name": "Phạm Thị Hương", "relationship": "Vợ", "phone": "0901234581"}', '{"provider": "BHYT", "policy_number": "HS4020123456791", "expiry_date": "2024-12-31"}', '["Aspirin"]', '["Bệnh tim mạch"]', 'Bệnh nhân có tiền sử bệnh tim, cần theo dõi đặc biệt', '2023-04-12', 'active'),
('PAT005', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2010-07-25', 'female', 'A-', '{"street": "654 Cách Mạng Tháng 8", "district": "Quận 10", "city": "TP.HCM", "zipcode": "70000"}', '{"name": "Hoàng Văn Tâm", "relationship": "Bố", "phone": "0901234582"}', '{"provider": "BHYT", "policy_number": "HS4020123456792", "expiry_date": "2024-12-31"}', '[]', '[]', 'Trẻ em khỏe mạnh, phát triển bình thường', '2023-05-20', 'active');

-- =====================================================
-- 9. INSERT APPOINTMENTS
-- =====================================================
-- Past appointments (completed)
INSERT INTO appointments (appointment_id, patient_id, doctor_id, appointment_datetime, duration_minutes, type, status, reason, notes, room_id, created_by) VALUES
('APT001', 'PAT001', 'DOC001', '2024-01-15 09:00:00+07', 30, 'consultation', 'completed', 'Khám tổng quát', 'Bệnh nhân đã được khám và tư vấn', 'ROOM001', '77777777-7777-7777-7777-777777777777'),
('APT002', 'PAT002', 'DOC001', '2024-01-16 10:30:00+07', 30, 'consultation', 'completed', 'Kiểm tra đường huyết', 'Đường huyết ổn định', 'ROOM001', '88888888-8888-8888-8888-888888888888'),
('APT003', 'PAT003', 'DOC002', '2024-01-17 14:00:00+07', 45, 'consultation', 'completed', 'Tư vấn phẫu thuật', 'Đã tư vấn về phương pháp điều trị', 'ROOM003', '99999999-9999-9999-9999-999999999999'),
('APT004', 'PAT004', 'DOC005', '2024-01-18 08:30:00+07', 60, 'consultation', 'completed', 'Khám tim mạch', 'Cần theo dõi thêm', 'ROOM007', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('APT005', 'PAT005', 'DOC004', '2024-01-19 15:00:00+07', 30, 'consultation', 'completed', 'Khám định kỳ', 'Trẻ phát triển tốt', 'ROOM006', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),

-- Today's appointments
('APT006', 'PAT001', 'DOC001', CURRENT_DATE + INTERVAL '9 hours', 30, 'consultation', 'confirmed', 'Tái khám', 'Kiểm tra kết quả điều trị', 'ROOM001', '77777777-7777-7777-7777-777777777777'),
('APT007', 'PAT002', 'DOC001', CURRENT_DATE + INTERVAL '10 hours 30 minutes', 30, 'consultation', 'confirmed', 'Khám định kỳ', 'Theo dõi tiểu đường', 'ROOM001', '88888888-8888-8888-8888-888888888888'),
('APT008', 'PAT003', 'DOC003', CURRENT_DATE + INTERVAL '14 hours', 45, 'consultation', 'confirmed', 'Khám sản khoa', 'Khám thai định kỳ', 'ROOM005', '99999999-9999-9999-9999-999999999999'),
('APT009', 'PAT004', 'DOC005', CURRENT_DATE + INTERVAL '15 hours 30 minutes', 60, 'consultation', 'pending', 'Khám tim mạch', 'Kiểm tra tình trạng tim', 'ROOM007', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),

-- Future appointments
('APT010', 'PAT005', 'DOC004', CURRENT_DATE + INTERVAL '1 day 9 hours', 30, 'consultation', 'confirmed', 'Tiêm chủng', 'Tiêm vaccine định kỳ', 'ROOM006', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
('APT011', 'PAT001', 'DOC002', CURRENT_DATE + INTERVAL '2 days 10 hours', 45, 'consultation', 'confirmed', 'Tư vấn phẫu thuật', 'Bàn về phương án điều trị', 'ROOM003', '77777777-7777-7777-7777-777777777777'),
('APT012', 'PAT002', 'DOC005', CURRENT_DATE + INTERVAL '3 days 14 hours', 60, 'consultation', 'confirmed', 'Khám chuyên khoa', 'Kiểm tra biến chứng tiểu đường', 'ROOM007', '88888888-8888-8888-8888-888888888888');

-- =====================================================
-- 10. INSERT MEDICAL RECORDS
-- =====================================================
INSERT INTO medical_records (record_id, patient_id, doctor_id, appointment_id, visit_date, chief_complaint, present_illness, past_medical_history, physical_examination, vital_signs, diagnosis, treatment_plan, medications, follow_up_instructions, status) VALUES
('MR001', 'PAT001', 'DOC001', 'APT001', '2024-01-15 09:00:00+07', 'Đau đầu và chóng mặt', 'Bệnh nhân than phiền đau đầu kéo dài 3 ngày, kèm chóng mặt nhẹ', 'Tiền sử cao huyết áp', '{"general": "Tỉnh táo, tiếp xúc tốt", "cardiovascular": "Tim đều, không tiếng thổi", "respiratory": "Phổi trong, không ran"}', '{"temperature": 36.5, "blood_pressure": "140/90", "heart_rate": 78, "respiratory_rate": 18}', 'Cao huyết áp không kiểm soát', 'Điều chỉnh thuốc hạ áp, theo dõi huyết áp tại nhà', '[{"name": "Amlodipine", "dosage": "5mg", "frequency": "1 lần/ngày", "duration": "30 ngày"}]', 'Tái khám sau 2 tuần, đo huyết áp hàng ngày', 'active'),

('MR002', 'PAT002', 'DOC001', 'APT002', '2024-01-16 10:30:00+07', 'Kiểm tra đường huyết định kỳ', 'Bệnh nhân tiểu đường type 2, đến kiểm tra định kỳ', 'Tiểu đường type 2 từ 5 năm', '{"general": "Tỉnh táo, dinh dưỡng tốt", "extremities": "Không phù, mạch đầu ngón tay tốt"}', '{"temperature": 36.8, "blood_pressure": "130/80", "heart_rate": 72, "weight": 70}', 'Tiểu đường type 2 kiểm soát tốt', 'Tiếp tục điều trị hiện tại, chế độ ăn kiêng', '[{"name": "Metformin", "dosage": "500mg", "frequency": "2 lần/ngày", "duration": "30 ngày"}]', 'Tái khám sau 3 tháng, xét nghiệm HbA1c', 'active'),

('MR003', 'PAT003', 'DOC002', 'APT003', '2024-01-17 14:00:00+07', 'Đau bụng dưới bên phải', 'Đau bụng dưới bên phải kéo dài 2 ngày, tăng dần', 'Không có tiền sử phẫu thuật', '{"abdomen": "Đau nhấn McBurney, không phản ứng thành bụng", "general": "Sốt nhẹ, mệt mỏi"}', '{"temperature": 37.8, "blood_pressure": "120/70", "heart_rate": 88, "respiratory_rate": 20}', 'Nghi ngờ viêm ruột thừa cấp', 'Chỉ định phẫu thuật cắt ruột thừa', '[{"name": "Ceftriaxone", "dosage": "1g", "frequency": "2 lần/ngày", "duration": "5 ngày"}]', 'Phẫu thuật trong 24h, theo dõi sau mổ', 'active'),

('MR004', 'PAT004', 'DOC005', 'APT004', '2024-01-18 08:30:00+07', 'Đau ngực và khó thở', 'Đau ngực trái khi gắng sức, khó thở khi vận động', 'Bệnh tim mạch, đã đặt stent 2 năm trước', '{"cardiovascular": "Tiếng thổi tâm thu 2/6, không phù", "respiratory": "Phổi trong"}', '{"temperature": 36.7, "blood_pressure": "150/95", "heart_rate": 92, "oxygen_saturation": 96}', 'Bệnh mạch vành, cần theo dõi', 'Điều chỉnh thuốc, siêu âm tim kiểm tra', '[{"name": "Atorvastatin", "dosage": "20mg", "frequency": "1 lần/ngày", "duration": "30 ngày"}, {"name": "Clopidogrel", "dosage": "75mg", "frequency": "1 lần/ngày", "duration": "30 ngày"}]', 'Tái khám sau 1 tháng, làm ECG và siêu âm tim', 'active'),

('MR005', 'PAT005', 'DOC004', 'APT005', '2024-01-19 15:00:00+07', 'Khám sức khỏe định kỳ', 'Trẻ 13 tuổi, khám sức khỏe định kỳ', 'Sinh non 36 tuần, phát triển bình thường', '{"general": "Trẻ hoạt bát, phát triển tốt", "growth": "Chiều cao và cân nặng phù hợp tuổi"}', '{"temperature": 36.6, "blood_pressure": "100/60", "heart_rate": 88, "height": 150, "weight": 42}', 'Trẻ khỏe mạnh, phát triển bình thường', 'Tiếp tục chế độ dinh dưỡng hợp lý', '[]', 'Khám định kỳ sau 6 tháng, tiêm vaccine đầy đủ', 'active');

-- =====================================================
-- 11. INSERT PRESCRIPTIONS
-- =====================================================
INSERT INTO prescriptions (prescription_id, patient_id, doctor_id, medical_record_id, prescription_date, medications, instructions, status, pharmacy_notes, dispensed_date, dispensed_by) VALUES
('PRE001', 'PAT001', 'DOC001', 'MR001', '2024-01-15', '[{"name": "Amlodipine", "dosage": "5mg", "quantity": 30, "frequency": "1 lần/ngày", "duration": "30 ngày", "instructions": "Uống sau ăn"}]', 'Uống thuốc đều đặn, theo dõi huyết áp', 'dispensed', 'Đã cấp phát đầy đủ', '2024-01-15', 'Dược sĩ Nguyễn Thị X'),

('PRE002', 'PAT002', 'DOC001', 'MR002', '2024-01-16', '[{"name": "Metformin", "dosage": "500mg", "quantity": 60, "frequency": "2 lần/ngày", "duration": "30 ngày", "instructions": "Uống cùng bữa ăn"}]', 'Kiểm soát chế độ ăn, tập thể dục đều đặn', 'dispensed', 'Đã tư vấn cách sử dụng', '2024-01-16', 'Dược sĩ Trần Văn Y'),

('PRE003', 'PAT003', 'DOC002', 'MR003', '2024-01-17', '[{"name": "Ceftriaxone", "dosage": "1g", "quantity": 10, "frequency": "2 lần/ngày", "duration": "5 ngày", "instructions": "Tiêm tĩnh mạch"}]', 'Kháng sinh sau phẫu thuật, dùng đủ liều', 'dispensed', 'Đã chuẩn bị cho khoa phẫu thuật', '2024-01-17', 'Dược sĩ Lê Thị Z'),

('PRE004', 'PAT004', 'DOC005', 'MR004', '2024-01-18', '[{"name": "Atorvastatin", "dosage": "20mg", "quantity": 30, "frequency": "1 lần/ngày", "duration": "30 ngày", "instructions": "Uống vào buổi tối"}, {"name": "Clopidogrel", "dosage": "75mg", "quantity": 30, "frequency": "1 lần/ngày", "duration": "30 ngày", "instructions": "Uống sau ăn sáng"}]', 'Không được tự ý ngừng thuốc, tái khám đúng hẹn', 'dispensed', 'Đã tư vấn tác dụng phụ', '2024-01-18', 'Dược sĩ Phạm Văn A'),

('PRE005', 'PAT001', 'DOC001', NULL, CURRENT_DATE, '[{"name": "Amlodipine", "dosage": "5mg", "quantity": 30, "frequency": "1 lần/ngày", "duration": "30 ngày", "instructions": "Uống sau ăn"}]', 'Tái cấp thuốc hạ áp', 'pending', 'Chờ bệnh nhân đến nhận', NULL, NULL),

('PRE006', 'PAT002', 'DOC001', NULL, CURRENT_DATE, '[{"name": "Metformin", "dosage": "500mg", "quantity": 60, "frequency": "2 lần/ngày", "duration": "30 ngày", "instructions": "Uống cùng bữa ăn"}]', 'Tái cấp thuốc tiểu đường', 'pending', 'Chờ bệnh nhân đến nhận', NULL, NULL);

-- =====================================================
-- 12. UPDATE DEPARTMENT HEAD DOCTORS
-- =====================================================
UPDATE departments SET head_doctor_id = 'DOC001' WHERE department_id = 'DEPT001';
UPDATE departments SET head_doctor_id = 'DOC002' WHERE department_id = 'DEPT002';
UPDATE departments SET head_doctor_id = 'DOC003' WHERE department_id = 'DEPT003';
UPDATE departments SET head_doctor_id = 'DOC004' WHERE department_id = 'DEPT004';
UPDATE departments SET head_doctor_id = 'DOC005' WHERE department_id = 'DEPT005';

-- =====================================================
-- 13. VERIFICATION QUERIES
-- =====================================================
-- Run these to verify data was inserted correctly
/*
SELECT 'Profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'Departments', COUNT(*) FROM departments
UNION ALL
SELECT 'Doctors', COUNT(*) FROM doctors
UNION ALL
SELECT 'Patients', COUNT(*) FROM patients
UNION ALL
SELECT 'Appointments', COUNT(*) FROM appointments
UNION ALL
SELECT 'Medical Records', COUNT(*) FROM medical_records
UNION ALL
SELECT 'Prescriptions', COUNT(*) FROM prescriptions
UNION ALL
SELECT 'Rooms', COUNT(*) FROM rooms;
*/

-- =====================================================
-- 14. TEST ACCOUNT CREDENTIALS
-- =====================================================
/*
IMPORTANT: You need to create these accounts in Supabase Auth first!

Go to Supabase Dashboard > Authentication > Users and create these accounts:

1. ADMIN ACCOUNT:
   Email: admin@hospital.com
   Password: Admin123!@#
   Role: admin

2. DOCTOR ACCOUNTS:
   Email: doctor1@hospital.com
   Password: Doctor123!@#
   Role: doctor

   Email: doctor2@hospital.com
   Password: Doctor123!@#
   Role: doctor

3. PATIENT ACCOUNTS:
   Email: patient1@gmail.com
   Password: Patient123!@#
   Role: patient

   Email: patient2@gmail.com
   Password: Patient123!@#
   Role: patient

After creating these accounts in Supabase Auth, the UUIDs should match the ones in this script.
If they don't match, update the profile_id fields in the doctors/patients tables accordingly.
*/

-- =====================================================
-- 15. SAMPLE QUERIES FOR TESTING
-- =====================================================
/*
-- Test doctor dashboard data
SELECT
    d.doctor_id,
    p.full_name,
    d.specialization,
    dept.name as department_name,
    COUNT(a.appointment_id) as total_appointments
FROM doctors d
JOIN profiles p ON d.profile_id = p.id
JOIN departments dept ON d.department_id = dept.department_id
LEFT JOIN appointments a ON d.doctor_id = a.doctor_id
WHERE p.role = 'doctor'
GROUP BY d.doctor_id, p.full_name, d.specialization, dept.name;

-- Test patient dashboard data
SELECT
    pat.patient_id,
    p.full_name,
    pat.date_of_birth,
    pat.blood_type,
    COUNT(a.appointment_id) as total_appointments
FROM patients pat
JOIN profiles p ON pat.profile_id = p.id
LEFT JOIN appointments a ON pat.patient_id = a.patient_id
WHERE p.role = 'patient'
GROUP BY pat.patient_id, p.full_name, pat.date_of_birth, pat.blood_type;

-- Test admin dashboard data
SELECT
    (SELECT COUNT(*) FROM profiles WHERE role = 'doctor') as total_doctors,
    (SELECT COUNT(*) FROM profiles WHERE role = 'patient') as total_patients,
    (SELECT COUNT(*) FROM appointments WHERE status = 'confirmed') as confirmed_appointments,
    (SELECT COUNT(*) FROM appointments WHERE DATE(appointment_datetime) = CURRENT_DATE) as today_appointments;
*/
