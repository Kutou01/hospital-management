-- Sample doctors data for testing
-- Run this in Supabase SQL Editor to create test doctors

INSERT INTO doctors (
  doctor_id,
  full_name,
  email,
  phone_number,
  specialty,
  license_number,
  department_id,
  qualification,
  gender,
  schedule,
  bio,
  experience_years,
  consultation_fee,
  languages_spoken,
  certifications,
  awards,
  research_interests,
  status
) VALUES 
(
  'DOC000001',
  'BS. Nguyễn Văn An',
  'nguyenvanan@hospital.com',
  '0901234567',
  'Tim mạch',
  'VN-TM-0001',
  'DEPT001',
  'Tiến sĩ Y khoa',
  'Nam',
  'Thứ 2-6, 08:00-17:00',
  'Bác sĩ chuyên khoa Tim mạch với hơn 15 năm kinh nghiệm. Chuyên điều trị các bệnh lý tim mạch phức tạp.',
  15,
  500000,
  ARRAY['Tiếng Việt', 'English'],
  ARRAY['Chứng chỉ Tim mạch can thiệp', 'Chứng chỉ Siêu âm tim'],
  ARRAY['Bác sĩ xuất sắc năm 2023', 'Giải thưởng nghiên cứu khoa học'],
  ARRAY['Tim mạch can thiệp', 'Siêu âm tim', 'Điện tâm đồ'],
  'active'
),
(
  'DOC000002',
  'BS. Trần Thị Bình',
  'tranthibinh@hospital.com',
  '0912345678',
  'Nhi khoa',
  'VN-NK-0002',
  'DEPT002',
  'Thạc sĩ Y khoa',
  'Nữ',
  'Thứ 2-6, 07:30-16:30',
  'Bác sĩ Nhi khoa với kinh nghiệm 10 năm trong điều trị các bệnh lý trẻ em.',
  10,
  400000,
  ARRAY['Tiếng Việt'],
  ARRAY['Chứng chỉ Nhi khoa', 'Chứng chỉ Cấp cứu nhi'],
  ARRAY['Bác sĩ tận tâm năm 2022'],
  ARRAY['Bệnh lý hô hấp trẻ em', 'Dinh dưỡng trẻ em'],
  'active'
),
(
  'DOC000003',
  'BS. Lê Minh Cường',
  'leminhcuong@hospital.com',
  '0923456789',
  'Ngoại khoa',
  'VN-NK-0003',
  'DEPT003',
  'Tiến sĩ Y khoa',
  'Nam',
  'Thứ 2-7, 06:00-14:00',
  'Bác sĩ Ngoại khoa chuyên về phẫu thuật nội soi và phẫu thuật tối thiểu xâm lấn.',
  12,
  600000,
  ARRAY['Tiếng Việt', 'English', '日本語'],
  ARRAY['Chứng chỉ Phẫu thuật nội soi', 'Chứng chỉ Phẫu thuật robot'],
  ARRAY['Phẫu thuật viên xuất sắc 2023', 'Giải thưởng đổi mới kỹ thuật'],
  ARRAY['Phẫu thuật nội soi', 'Phẫu thuật robot', 'Ung thư'],
  'active'
);

-- Insert sample departments if not exists
INSERT INTO departments (department_id, department_name, description, head_doctor_id, location, phone_number, email)
VALUES 
('DEPT001', 'Khoa Tim mạch', 'Chuyên điều trị các bệnh lý tim mạch', NULL, 'Tầng 3', '0281234567', 'timmach@hospital.com'),
('DEPT002', 'Khoa Nhi', 'Chuyên điều trị các bệnh lý trẻ em', NULL, 'Tầng 2', '0281234568', 'nhi@hospital.com'),
('DEPT003', 'Khoa Ngoại', 'Chuyên phẫu thuật các bệnh lý ngoại khoa', NULL, 'Tầng 4', '0281234569', 'ngoai@hospital.com')
ON CONFLICT (department_id) DO NOTHING;

-- Insert sample schedules
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, is_available, break_start, break_end, max_appointments, slot_duration)
VALUES 
-- Doctor 1 schedule (Monday to Friday)
('DOC000001', 1, '08:00', '17:00', true, '12:00', '13:00', 16, 30),
('DOC000001', 2, '08:00', '17:00', true, '12:00', '13:00', 16, 30),
('DOC000001', 3, '08:00', '17:00', true, '12:00', '13:00', 16, 30),
('DOC000001', 4, '08:00', '17:00', true, '12:00', '13:00', 16, 30),
('DOC000001', 5, '08:00', '17:00', true, '12:00', '13:00', 16, 30),

-- Doctor 2 schedule
('DOC000002', 1, '07:30', '16:30', true, '12:00', '13:00', 18, 25),
('DOC000002', 2, '07:30', '16:30', true, '12:00', '13:00', 18, 25),
('DOC000002', 3, '07:30', '16:30', true, '12:00', '13:00', 18, 25),
('DOC000002', 4, '07:30', '16:30', true, '12:00', '13:00', 18, 25),
('DOC000002', 5, '07:30', '16:30', true, '12:00', '13:00', 18, 25),

-- Doctor 3 schedule (Monday to Saturday)
('DOC000003', 1, '06:00', '14:00', true, '11:00', '12:00', 12, 40),
('DOC000003', 2, '06:00', '14:00', true, '11:00', '12:00', 12, 40),
('DOC000003', 3, '06:00', '14:00', true, '11:00', '12:00', 12, 40),
('DOC000003', 4, '06:00', '14:00', true, '11:00', '12:00', 12, 40),
('DOC000003', 5, '06:00', '14:00', true, '11:00', '12:00', 12, 40),
('DOC000003', 6, '06:00', '14:00', true, '11:00', '12:00', 12, 40);

-- Insert sample experiences
INSERT INTO doctor_experiences (doctor_id, institution_name, position, start_date, end_date, is_current, description, experience_type)
VALUES 
-- Doctor 1 experiences
('DOC000001', 'Bệnh viện Chợ Rẫy', 'Bác sĩ điều trị', '2020-01-01', NULL, true, 'Bác sĩ điều trị tại khoa Tim mạch', 'work'),
('DOC000001', 'Đại học Y Dược TP.HCM', 'Tiến sĩ Y khoa', '2015-09-01', '2019-06-30', false, 'Chuyên ngành Tim mạch', 'education'),
('DOC000001', 'Bệnh viện Đại học Y Dược', 'Bác sĩ nội trú', '2012-01-01', '2019-12-31', false, 'Thực tập và làm việc tại khoa Tim mạch', 'work'),

-- Doctor 2 experiences  
('DOC000002', 'Bệnh viện Nhi Đồng 1', 'Bác sĩ điều trị', '2018-03-01', NULL, true, 'Bác sĩ điều trị tại khoa Nhi', 'work'),
('DOC000002', 'Đại học Y Dược TP.HCM', 'Thạc sĩ Y khoa', '2012-09-01', '2016-06-30', false, 'Chuyên ngành Nhi khoa', 'education'),

-- Doctor 3 experiences
('DOC000003', 'Bệnh viện Việt Đức', 'Phó trưởng khoa Ngoại', '2019-01-01', NULL, true, 'Phó trưởng khoa Ngoại tổng hợp', 'work'),
('DOC000003', 'Đại học Y Hà Nội', 'Tiến sĩ Y khoa', '2014-09-01', '2018-12-31', false, 'Chuyên ngành Ngoại khoa', 'education'),
('DOC000003', 'Bệnh viện Bạch Mai', 'Bác sĩ điều trị', '2011-01-01', '2018-12-31', false, 'Bác sĩ điều trị khoa Ngoại', 'work');

-- Insert sample reviews
INSERT INTO doctor_reviews (doctor_id, patient_id, rating, review_text, review_date, is_anonymous, is_verified, helpful_count)
VALUES 
('DOC000001', 'PAT000001', 5, 'Bác sĩ rất tận tâm và chuyên nghiệp. Giải thích rõ ràng về tình trạng bệnh.', '2024-01-15', false, true, 5),
('DOC000001', 'PAT000002', 4, 'Khám bệnh kỹ lưỡng, tuy nhiên thời gian chờ hơi lâu.', '2024-01-10', true, true, 3),
('DOC000001', 'PAT000003', 5, 'Rất hài lòng với dịch vụ. Bác sĩ nhiệt tình và có kinh nghiệm.', '2024-01-08', false, true, 8),

('DOC000002', 'PAT000004', 5, 'Bác sĩ rất giỏi với trẻ em. Con tôi không sợ khám bệnh nữa.', '2024-01-12', false, true, 6),
('DOC000002', 'PAT000005', 4, 'Chuyên môn tốt, thái độ thân thiện với trẻ.', '2024-01-05', true, true, 2),

('DOC000003', 'PAT000006', 5, 'Phẫu thuật thành công, hồi phục nhanh. Cảm ơn bác sĩ.', '2024-01-20', false, true, 10),
('DOC000003', 'PAT000007', 5, 'Kỹ thuật phẫu thuật cao, chăm sóc chu đáo.', '2024-01-18', false, true, 7);

-- Insert sample shifts
INSERT INTO doctor_shifts (doctor_id, shift_type, shift_date, start_time, end_time, department_id, status, is_emergency_shift, notes)
VALUES 
('DOC000001', 'morning', '2024-02-01', '08:00', '16:00', 'DEPT001', 'scheduled', false, 'Ca sáng thường'),
('DOC000001', 'night', '2024-02-05', '20:00', '08:00', 'DEPT001', 'confirmed', false, 'Ca trực đêm'),

('DOC000002', 'afternoon', '2024-02-02', '14:00', '22:00', 'DEPT002', 'scheduled', false, 'Ca chiều'),
('DOC000002', 'emergency', '2024-02-03', '18:00', '06:00', 'DEPT002', 'confirmed', true, 'Ca cấp cứu nhi'),

('DOC000003', 'morning', '2024-02-01', '06:00', '14:00', 'DEPT003', 'completed', false, 'Ca phẫu thuật'),
('DOC000003', 'night', '2024-02-04', '22:00', '06:00', 'DEPT003', 'scheduled', false, 'Ca trực đêm');

-- Verify data
SELECT 'DOCTORS CREATED' as status, COUNT(*) as count FROM doctors;
SELECT 'SCHEDULES CREATED' as status, COUNT(*) as count FROM doctor_schedules;
SELECT 'EXPERIENCES CREATED' as status, COUNT(*) as count FROM doctor_experiences;
SELECT 'REVIEWS CREATED' as status, COUNT(*) as count FROM doctor_reviews;
SELECT 'SHIFTS CREATED' as status, COUNT(*) as count FROM doctor_shifts;
