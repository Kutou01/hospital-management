-- Hospital Management Sample Data
-- This script adds comprehensive sample data for the hospital management system

-- 1. Update Departments with contact information
UPDATE departments SET
  phone_number = '028-3123-4567',
  email = 'noitong@hospital.com'
WHERE department_id = 'DEPT001';

UPDATE departments SET
  phone_number = '028-3123-4568',
  email = 'timmach@hospital.com'
WHERE department_id = 'DEPT002';

UPDATE departments SET
  phone_number = '028-3123-4569',
  email = 'nhi@hospital.com'
WHERE department_id = 'DEPT003';

UPDATE departments SET
  phone_number = '028-3123-4570',
  email = 'chinhhinh@hospital.com'
WHERE department_id = 'DEPT004';

UPDATE departments SET
  phone_number = '028-3123-4571',
  email = 'capcuu@hospital.com'
WHERE department_id = 'DEPT005';

-- Add more departments
INSERT INTO departments (department_id, name, description, location, phone_number, email, is_active) VALUES
('DEPT006', 'Khoa Phụ sản', 'Khoa Phụ sản - chăm sóc sức khỏe phụ nữ', 'Tầng 3, Tòa B', '028-3123-4572', 'phusan@hospital.com', true),
('DEPT007', 'Khoa Mắt', 'Khoa Mắt - điều trị các bệnh về mắt', 'Tầng 4, Tòa A', '028-3123-4573', 'mat@hospital.com', true),
('DEPT008', 'Khoa Răng Hàm Mặt', 'Khoa Răng Hàm Mặt - điều trị nha khoa', 'Tầng 1, Tòa C', '028-3123-4574', 'ranghammat@hospital.com', true);

-- 2. Add more profiles for doctors
INSERT INTO profiles (id, email, full_name, phone_number, role, is_active, email_verified, phone_verified) VALUES
-- Doctors
('11111111-1111-1111-1111-111111111111', 'bs.tranvanb@hospital.com', 'BS. Trần Văn B', '0901234567', 'doctor', true, true, true),
('22222222-2222-2222-2222-222222222222', 'bs.lethic@hospital.com', 'BS. Lê Thị C', '0901234568', 'doctor', true, true, true),
('33333333-3333-3333-3333-333333333333', 'bs.phamvand@hospital.com', 'BS. Phạm Văn D', '0901234569', 'doctor', true, true, true),
('44444444-4444-4444-4444-444444444444', 'bs.hoangthie@hospital.com', 'BS. Hoàng Thị E', '0901234570', 'doctor', true, true, true),
('55555555-5555-5555-5555-555555555555', 'bs.vuvang@hospital.com', 'BS. Vũ Văn G', '0901234571', 'doctor', true, true, true),
('66666666-6666-6666-6666-666666666666', 'bs.dothih@hospital.com', 'BS. Đỗ Thị H', '0901234572', 'doctor', true, true, true),
('77777777-7777-7777-7777-777777777777', 'bs.buivani@hospital.com', 'BS. Bùi Văn I', '0901234573', 'doctor', true, true, true),
('88888888-8888-8888-8888-888888888888', 'bs.ngothik@hospital.com', 'BS. Ngô Thị K', '0901234574', 'doctor', true, true, true),
-- Patients
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'patient.nguyenvanl@gmail.com', 'Nguyễn Văn L', '0912345678', 'patient', true, true, true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'patient.tranthim@gmail.com', 'Trần Thị M', '0912345679', 'patient', true, true, true),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'patient.levann@gmail.com', 'Lê Văn N', '0912345680', 'patient', true, true, true),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'patient.phamthio@gmail.com', 'Phạm Thị O', '0912345681', 'patient', true, true, true),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'patient.hoangvanp@gmail.com', 'Hoàng Văn P', '0912345682', 'patient', true, true, true),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'patient.vuthiq@gmail.com', 'Vũ Thị Q', '0912345683', 'patient', true, true, true),
('gggggggg-gggg-gggg-gggg-gggggggggggg', 'patient.dovanr@gmail.com', 'Đỗ Văn R', '0912345684', 'patient', true, true, true),
('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'patient.buithis@gmail.com', 'Bùi Thị S', '0912345685', 'patient', true, true, true),
-- Admins
('99999999-9999-9999-9999-999999999999', 'admin.manager@hospital.com', 'Quản lý Hệ thống', '0909999999', 'admin', true, true, true);

-- 3. Add more doctors
INSERT INTO doctors (doctor_id, profile_id, license_number, specialization, qualification, experience_years, consultation_fee, department_id, status, bio, languages_spoken, working_hours) VALUES
('DOC002', '11111111-1111-1111-1111-111111111111', 'BS002345', 'Tim mạch', 'Bác sĩ Chuyên khoa II', 15, 300000.00, 'DEPT002', 'active', 'Bác sĩ chuyên khoa tim mạch với 15 năm kinh nghiệm', ARRAY['Vietnamese', 'English'], '{"monday": "08:00-17:00", "tuesday": "08:00-17:00", "wednesday": "08:00-17:00", "thursday": "08:00-17:00", "friday": "08:00-17:00"}'),
('DOC003', '22222222-2222-2222-2222-222222222222', 'BS003456', 'Nhi khoa', 'Bác sĩ Chuyên khoa I', 8, 250000.00, 'DEPT003', 'active', 'Bác sĩ nhi khoa chuyên điều trị trẻ em', ARRAY['Vietnamese'], '{"monday": "08:00-17:00", "tuesday": "08:00-17:00", "wednesday": "08:00-17:00", "thursday": "08:00-17:00", "friday": "08:00-12:00"}'),
('DOC004', '33333333-3333-3333-3333-333333333333', 'BS004567', 'Chấn thương chỉnh hình', 'Bác sĩ Chuyên khoa I', 12, 280000.00, 'DEPT004', 'active', 'Bác sĩ chuyên khoa chấn thương và chỉnh hình', ARRAY['Vietnamese', 'English'], '{"monday": "08:00-17:00", "tuesday": "08:00-17:00", "wednesday": "08:00-17:00", "thursday": "08:00-17:00", "friday": "08:00-17:00"}'),
('DOC005', '44444444-4444-4444-4444-444444444444', 'BS005678', 'Cấp cứu', 'Bác sĩ Chuyên khoa I', 6, 200000.00, 'DEPT005', 'active', 'Bác sĩ cấp cứu và hồi sức', ARRAY['Vietnamese'], '{"monday": "00:00-23:59", "tuesday": "00:00-23:59", "wednesday": "00:00-23:59", "thursday": "00:00-23:59", "friday": "00:00-23:59", "saturday": "00:00-23:59", "sunday": "00:00-23:59"}'),
('DOC006', '55555555-5555-5555-5555-555555555555', 'BS006789', 'Phụ sản', 'Bác sĩ Chuyên khoa II', 18, 350000.00, 'DEPT006', 'active', 'Bác sĩ phụ sản với nhiều năm kinh nghiệm', ARRAY['Vietnamese', 'English'], '{"monday": "08:00-17:00", "tuesday": "08:00-17:00", "wednesday": "08:00-17:00", "thursday": "08:00-17:00", "friday": "08:00-17:00"}'),
('DOC007', '66666666-6666-6666-6666-666666666666', 'BS007890', 'Mắt', 'Bác sĩ Chuyên khoa I', 9, 260000.00, 'DEPT007', 'active', 'Bác sĩ chuyên khoa mắt', ARRAY['Vietnamese'], '{"monday": "08:00-17:00", "tuesday": "08:00-17:00", "wednesday": "08:00-17:00", "thursday": "08:00-17:00", "friday": "08:00-17:00"}'),
('DOC008', '77777777-7777-7777-7777-777777777777', 'BS008901', 'Răng Hàm Mặt', 'Bác sĩ Chuyên khoa I', 7, 240000.00, 'DEPT008', 'active', 'Bác sĩ nha khoa và răng hàm mặt', ARRAY['Vietnamese'], '{"monday": "08:00-17:00", "tuesday": "08:00-17:00", "wednesday": "08:00-17:00", "thursday": "08:00-17:00", "friday": "08:00-17:00"}'),
('DOC009', '88888888-8888-8888-8888-888888888888', 'BS009012', 'Nội khoa tổng hợp', 'Bác sĩ Chuyên khoa I', 11, 220000.00, 'DEPT001', 'active', 'Bác sĩ nội khoa tổng hợp', ARRAY['Vietnamese', 'English'], '{"monday": "08:00-17:00", "tuesday": "08:00-17:00", "wednesday": "08:00-17:00", "thursday": "08:00-17:00", "friday": "08:00-17:00"}');

-- 4. Add more patients
INSERT INTO patients (patient_id, profile_id, date_of_birth, gender, blood_type, address, emergency_contact, insurance_info, allergies, chronic_conditions, medical_notes, registration_date, status) VALUES
('PAT002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '1985-03-20', 'male', 'B+', '{"street": "456 Lê Lợi", "district": "Quận 1", "city": "TP.HCM", "zipcode": "70000"}', '{"name": "Trần Thị Lan", "phone": "0901234579", "relationship": "Vợ"}', '{"provider": "BHYT", "policy_number": "HS4020123456790", "expiry_date": "2024-12-31"}', ARRAY['Aspirin'], ARRAY['Tiểu đường'], 'Bệnh nhân tiểu đường type 2, cần kiểm soát đường huyết', '2023-02-10', 'active'),
('PAT003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '1992-07-12', 'female', 'O+', '{"street": "789 Nguyễn Huệ", "district": "Quận 1", "city": "TP.HCM", "zipcode": "70000"}', '{"name": "Lê Văn Minh", "phone": "0901234580", "relationship": "Chồng"}', '{"provider": "BHYT", "policy_number": "HS4020123456791", "expiry_date": "2024-12-31"}', NULL, NULL, NULL, '2023-03-15', 'active'),
('PAT004', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '1978-11-05', 'male', 'AB+', '{"street": "321 Trần Hưng Đạo", "district": "Quận 5", "city": "TP.HCM", "zipcode": "70000"}', '{"name": "Phạm Thị Hương", "phone": "0901234581", "relationship": "Vợ"}', '{"provider": "BHYT", "policy_number": "HS4020123456792", "expiry_date": "2024-12-31"}', ARRAY['Penicillin', 'Sulfa'], ARRAY['Cao huyết áp', 'Gout'], 'Bệnh nhân có tiền sử cao huyết áp và gout', '2023-04-20', 'active'),
('PAT005', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '1995-09-18', 'female', 'A-', '{"street": "654 Võ Văn Tần", "district": "Quận 3", "city": "TP.HCM", "zipcode": "70000"}', '{"name": "Hoàng Văn Tú", "phone": "0901234582", "relationship": "Chồng"}', '{"provider": "BHYT", "policy_number": "HS4020123456793", "expiry_date": "2024-12-31"}', NULL, NULL, NULL, '2023-05-25', 'active'),
('PAT006', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '1988-12-30', 'male', 'O-', '{"street": "987 Cách Mạng Tháng 8", "district": "Quận 10", "city": "TP.HCM", "zipcode": "70000"}', '{"name": "Vũ Thị Mai", "phone": "0901234583", "relationship": "Vợ"}', '{"provider": "BHYT", "policy_number": "HS4020123456794", "expiry_date": "2024-12-31"}', ARRAY['Iodine'], NULL, NULL, '2023-06-30', 'active'),
('PAT007', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '1983-04-14', 'female', 'B-', '{"street": "147 Pasteur", "district": "Quận 1", "city": "TP.HCM", "zipcode": "70000"}', '{"name": "Đỗ Văn Hùng", "phone": "0901234584", "relationship": "Chồng"}', '{"provider": "BHYT", "policy_number": "HS4020123456795", "expiry_date": "2024-12-31"}', NULL, ARRAY['Hen suyễn'], 'Bệnh nhân có tiền sử hen suyễn', '2023-07-15', 'active'),
('PAT008', 'gggggggg-gggg-gggg-gggg-gggggggggggg', '1991-01-22', 'male', 'A+', '{"street": "258 Điện Biên Phủ", "district": "Quận Bình Thạnh", "city": "TP.HCM", "zipcode": "70000"}', '{"name": "Bùi Thị Lan", "phone": "0901234585", "relationship": "Vợ"}', '{"provider": "BHYT", "policy_number": "HS4020123456796", "expiry_date": "2024-12-31"}', NULL, NULL, NULL, '2023-08-10', 'active'),
('PAT009', 'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', '1987-06-08', 'female', 'AB-', '{"street": "369 Lý Thường Kiệt", "district": "Quận 11", "city": "TP.HCM", "zipcode": "70000"}', '{"name": "Ngô Văn Đức", "phone": "0901234586", "relationship": "Chồng"}', '{"provider": "BHYT", "policy_number": "HS4020123456797", "expiry_date": "2024-12-31"}', ARRAY['Latex'], NULL, NULL, '2023-09-05', 'active');

-- 5. Add admin
INSERT INTO admins (admin_id, profile_id, employee_id, department, position, permissions, hire_date, salary, is_super_admin) VALUES
('ADM001', '99999999-9999-9999-9999-999999999999', 'EMP001', 'IT', 'System Administrator', '{"users": "full", "doctors": "full", "patients": "full", "appointments": "full", "departments": "full", "rooms": "full", "billing": "full", "reports": "full"}', '2020-01-01', 25000000.00, true);

-- 6. Add rooms
INSERT INTO rooms (room_id, room_number, department_id, room_type, capacity, status) VALUES
-- Khoa Nội tổng hợp
('ROOM001', '101', 'DEPT001', 'Phòng khám', 1, 'available'),
('ROOM002', '102', 'DEPT001', 'Phòng khám', 1, 'available'),
('ROOM003', '103', 'DEPT001', 'Phòng bệnh', 4, 'available'),
('ROOM004', '104', 'DEPT001', 'Phòng bệnh', 2, 'occupied'),
-- Khoa Tim mạch
('ROOM005', '201', 'DEPT002', 'Phòng khám', 1, 'available'),
('ROOM006', '202', 'DEPT002', 'Phòng khám', 1, 'occupied'),
('ROOM007', '203', 'DEPT002', 'Phòng mổ', 1, 'available'),
('ROOM008', '204', 'DEPT002', 'Phòng hồi sức', 2, 'available'),
-- Khoa Nhi
('ROOM009', '301', 'DEPT003', 'Phòng khám', 1, 'available'),
('ROOM010', '302', 'DEPT003', 'Phòng khám', 1, 'available'),
('ROOM011', '303', 'DEPT003', 'Phòng bệnh', 6, 'occupied'),
-- Khoa Chấn thương chỉnh hình
('ROOM012', '401', 'DEPT004', 'Phòng khám', 1, 'available'),
('ROOM013', '402', 'DEPT004', 'Phòng mổ', 1, 'maintenance'),
('ROOM014', '403', 'DEPT004', 'Phòng bệnh', 4, 'available'),
-- Khoa Cấp cứu
('ROOM015', '501', 'DEPT005', 'Phòng cấp cứu', 2, 'available'),
('ROOM016', '502', 'DEPT005', 'Phòng cấp cứu', 2, 'occupied'),
('ROOM017', '503', 'DEPT005', 'Phòng hồi sức', 1, 'available');

-- 7. Add appointments
INSERT INTO appointments (appointment_id, patient_id, doctor_id, appointment_datetime, duration_minutes, type, status, reason, notes, room_id, created_by) VALUES
('APT001', 'PAT001', 'DOC001', '2024-01-15 09:00:00+07', 30, 'Khám tổng quát', 'completed', 'Khám sức khỏe định kỳ', 'Bệnh nhân khỏe mạnh, tiếp tục theo dõi huyết áp', 'ROOM001', 'b4e4592b-bd2b-4331-858e-7b26d236cd5e'),
('APT002', 'PAT002', 'DOC002', '2024-01-16 10:30:00+07', 45, 'Khám chuyên khoa', 'completed', 'Đau ngực, khó thở', 'Đã làm ECG, kết quả bình thường', 'ROOM005', '11111111-1111-1111-1111-111111111111'),
('APT003', 'PAT003', 'DOC003', '2024-01-17 14:00:00+07', 30, 'Khám tổng quát', 'completed', 'Khám thai định kỳ', 'Thai nhi phát triển bình thường', 'ROOM009', '22222222-2222-2222-2222-222222222222'),
('APT004', 'PAT004', 'DOC004', '2024-01-18 08:30:00+07', 60, 'Khám chuyên khoa', 'completed', 'Đau khớp gối', 'Chẩn đoán viêm khớp, kê đơn thuốc', 'ROOM012', '33333333-3333-3333-3333-333333333333'),
('APT005', 'PAT005', 'DOC001', '2024-01-19 11:00:00+07', 30, 'Tái khám', 'completed', 'Tái khám sau điều trị', 'Tình trạng cải thiện tốt', 'ROOM002', 'b4e4592b-bd2b-4331-858e-7b26d236cd5e'),
-- Upcoming appointments
('APT006', 'PAT006', 'DOC005', '2024-01-25 09:00:00+07', 30, 'Khám cấp cứu', 'confirmed', 'Đau bụng dữ dội', NULL, 'ROOM015', '44444444-4444-4444-4444-444444444444'),
('APT007', 'PAT007', 'DOC006', '2024-01-25 14:30:00+07', 45, 'Khám chuyên khoa', 'confirmed', 'Khám thai định kỳ', NULL, 'ROOM006', '55555555-5555-5555-5555-555555555555'),
('APT008', 'PAT008', 'DOC007', '2024-01-26 10:00:00+07', 30, 'Khám chuyên khoa', 'pending', 'Mờ mắt, nhìn không rõ', NULL, 'ROOM007', '66666666-6666-6666-6666-666666666666'),
('APT009', 'PAT009', 'DOC008', '2024-01-26 15:00:00+07', 60, 'Khám chuyên khoa', 'pending', 'Đau răng', NULL, 'ROOM008', '77777777-7777-7777-7777-777777777777'),
('APT010', 'PAT002', 'DOC009', '2024-01-27 08:00:00+07', 30, 'Tái khám', 'confirmed', 'Tái khám tiểu đường', NULL, 'ROOM003', '88888888-8888-8888-8888-888888888888');

-- 8. Add medical records
INSERT INTO medical_records (record_id, patient_id, doctor_id, appointment_id, visit_date, chief_complaint, present_illness, past_medical_history, physical_examination, vital_signs, diagnosis, treatment_plan, medications, follow_up_instructions, status) VALUES
('MR001', 'PAT001', 'DOC001', 'APT001', '2024-01-15 09:00:00+07', 'Khám sức khỏe định kỳ', 'Bệnh nhân đến khám sức khỏe định kỳ, không có triệu chứng bất thường', 'Tiền sử cao huyết áp', '{"general": "Tỉnh táo, tiếp xúc tốt", "cardiovascular": "Tim đều, không tiếng thổi", "respiratory": "Phổi trong, không ran", "abdomen": "Bụng mềm, không đau ấn"}', '{"temperature": "36.5°C", "blood_pressure": "130/85 mmHg", "heart_rate": "72 bpm", "respiratory_rate": "18/min", "weight": "65 kg", "height": "165 cm"}', 'Cao huyết áp độ 1', 'Tiếp tục dùng thuốc hạ áp, chế độ ăn ít muối, tập thể dục đều đặn', '[{"name": "Amlodipine", "dosage": "5mg", "frequency": "1 lần/ngày", "duration": "30 ngày"}]', 'Tái khám sau 3 tháng, theo dõi huyết áp tại nhà', 'completed'),
('MR002', 'PAT002', 'DOC002', 'APT002', '2024-01-16 10:30:00+07', 'Đau ngực, khó thở', 'Bệnh nhân than đau ngực trái, khó thở khi gắng sức từ 2 ngày nay', 'Tiền sử tiểu đường type 2', '{"general": "Tỉnh táo, lo lắng", "cardiovascular": "Tim đều, không tiếng thổi bất thường", "respiratory": "Phổi trong, thở đều", "extremities": "Không phù"}', '{"temperature": "36.8°C", "blood_pressure": "140/90 mmHg", "heart_rate": "88 bpm", "respiratory_rate": "20/min", "oxygen_saturation": "98%"}', 'Đau ngực không đặc hiệu, loại trừ hội chứng mạch vành cấp', 'Theo dõi, thuốc giảm đau, tái khám nếu có triệu chứng', '[{"name": "Paracetamol", "dosage": "500mg", "frequency": "3 lần/ngày khi đau", "duration": "7 ngày"}]', 'Tái khám ngay nếu đau ngực tăng hoặc khó thở nhiều hơn', 'completed');

-- 9. Add prescriptions
INSERT INTO prescriptions (prescription_id, patient_id, doctor_id, medical_record_id, medications, instructions, issued_date, valid_until, status) VALUES
('PRE001', 'PAT001', 'DOC001', 'MR001', '[{"name": "Amlodipine", "dosage": "5mg", "frequency": "1 lần/ngày buổi sáng", "quantity": 30, "unit": "viên", "instructions": "Uống sau ăn sáng"}]', 'Uống thuốc đều đặn, không được tự ý ngừng thuốc. Theo dõi huyết áp tại nhà.', '2024-01-15', '2024-02-15', 'active'),
('PRE002', 'PAT002', 'DOC002', 'MR002', '[{"name": "Paracetamol", "dosage": "500mg", "frequency": "3 lần/ngày khi đau", "quantity": 21, "unit": "viên", "instructions": "Uống khi đau, cách nhau ít nhất 4 giờ"}]', 'Chỉ uống khi đau ngực. Tái khám ngay nếu triệu chứng không cải thiện.', '2024-01-16', '2024-01-23', 'active');
