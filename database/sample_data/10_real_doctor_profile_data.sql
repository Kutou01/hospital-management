-- =============================================
-- Sample Data for Real Doctors - Profile Enhancements
-- Based on actual doctor_id from database
-- =============================================

-- 1. Create default work schedules for all existing doctors (Monday to Friday)
INSERT INTO doctor_work_schedules (doctor_id, day_of_week, start_time, end_time, lunch_start_time, lunch_end_time, max_patients_per_day, is_active)
SELECT 
    d.doctor_id,
    generate_series(1, 5) as day_of_week, -- Monday to Friday
    '08:00'::TIME as start_time,
    '17:00'::TIME as end_time,
    '12:00'::TIME as lunch_start_time,
    '13:00'::TIME as lunch_end_time,
    CASE 
        WHEN RANDOM() < 0.3 THEN 15  -- 30% doctors have 15 patients/day
        WHEN RANDOM() < 0.7 THEN 20  -- 40% doctors have 20 patients/day
        ELSE 25                      -- 30% doctors have 25 patients/day
    END as max_patients_per_day,
    true as is_active
FROM doctors d
WHERE d.doctor_id NOT IN (SELECT DISTINCT doctor_id FROM doctor_work_schedules WHERE doctor_id IS NOT NULL)
ON CONFLICT (doctor_id, day_of_week) DO NOTHING;

-- 2. Create default settings for all existing doctors
INSERT INTO doctor_settings (doctor_id, notification_email, notification_sms, notification_appointment_reminder, notification_patient_review, privacy_show_phone, privacy_show_email, privacy_show_experience, language_preference, timezone, theme_preference)
SELECT 
    doctor_id,
    true as notification_email,
    CASE WHEN RANDOM() < 0.8 THEN true ELSE false END as notification_sms,
    true as notification_appointment_reminder,
    true as notification_patient_review,
    CASE WHEN RANDOM() < 0.9 THEN true ELSE false END as privacy_show_phone,
    CASE WHEN RANDOM() < 0.95 THEN true ELSE false END as privacy_show_email,
    true as privacy_show_experience,
    'vi' as language_preference,
    'Asia/Ho_Chi_Minh' as timezone,
    CASE WHEN RANDOM() < 0.8 THEN 'light' ELSE 'dark' END as theme_preference
FROM doctors
WHERE doctor_id NOT IN (SELECT doctor_id FROM doctor_settings WHERE doctor_id IS NOT NULL)
ON CONFLICT (doctor_id) DO NOTHING;

-- 3. Create sample work experiences for first 10 doctors
INSERT INTO doctor_work_experiences (doctor_id, hospital_name, position, department, start_date, end_date, description, achievements, is_current) VALUES
-- Doctor 1: GEN-DOC-202506-079
('GEN-DOC-202506-079', 'Bệnh viện Chợ Rẫy', 'Bác sĩ nội trú', 'Khoa Nội', '2018-01-01', '2020-12-31', 'Làm việc tại khoa nội, chuyên điều trị các bệnh nội khoa', 'Điều trị thành công 500+ ca bệnh nội khoa', false),
('GEN-DOC-202506-079', 'Bệnh viện Đại học Y Dược TP.HCM', 'Bác sĩ chuyên khoa', 'Khoa Nội', '2021-01-01', NULL, 'Bác sĩ chuyên khoa nội, phụ trách các ca bệnh phức tạp', 'Thực hiện 200+ ca điều trị thành công', true),

-- Doctor 2: GEN-DOC-202506-107
('GEN-DOC-202506-107', 'Bệnh viện Nhi đồng 1', 'Bác sĩ nội trú', 'Nhi khoa', '2019-06-01', '2021-05-31', 'Chăm sóc trẻ em từ 0-16 tuổi', 'Được khen thưởng bác sĩ xuất sắc năm 2020', false),
('GEN-DOC-202506-107', 'Bệnh viện Đại học Y Dược TP.HCM', 'Bác sĩ chuyên khoa', 'Nhi khoa', '2021-06-01', NULL, 'Chuyên điều trị các bệnh nhi khoa phức tạp', 'Nghiên cứu và phát triển phương pháp điều trị mới cho trẻ em', true),

-- Doctor 3: GEN-DOC-202506-128
('GEN-DOC-202506-128', 'Bệnh viện Việt Đức', 'Bác sĩ nội trú', 'Chấn thương chỉnh hình', '2017-01-01', '2019-12-31', 'Điều trị các chấn thương xương khớp', 'Tham gia 300+ ca phẫu thuật chỉnh hình', false),
('GEN-DOC-202506-128', 'Bệnh viện Đại học Y Dược TP.HCM', 'Bác sĩ chuyên khoa', 'Chấn thương chỉnh hình', '2020-01-01', NULL, 'Chuyên gia phẫu thuật cột sống và khớp', 'Đạt chứng chỉ phẫu thuật nội soi cột sống', true);

-- 4. Create sample patient reviews for first 5 doctors
INSERT INTO doctor_reviews (doctor_id, patient_id, rating, review_text, review_date, is_verified, helpful_count) VALUES
-- Reviews for Doctor 1
('GEN-DOC-202506-079', 'PAT-202412-001', 5, 'Bác sĩ rất tận tâm và chuyên nghiệp. Giải thích rõ ràng về tình trạng bệnh.', '2024-12-01 10:00:00+07', true, 5),
('GEN-DOC-202506-079', 'PAT-202412-002', 5, 'Khám rất kỹ, tư vấn chi tiết. Cảm ơn bác sĩ!', '2024-12-02 14:30:00+07', true, 3),
('GEN-DOC-202506-079', 'PAT-202412-003', 4, 'Bác sĩ giỏi nhưng hơi khó tính. Tuy nhiên điều trị hiệu quả.', '2024-12-03 09:15:00+07', true, 2),

-- Reviews for Doctor 2
('GEN-DOC-202506-107', 'PAT-202412-004', 5, 'Bác sĩ rất yêu trẻ em, con tôi không sợ khám bệnh nữa.', '2024-12-01 11:00:00+07', true, 8),
('GEN-DOC-202506-107', 'PAT-202412-005', 5, 'Chuyên môn cao, tư vấn tận tình cho phụ huynh.', '2024-12-02 16:00:00+07', true, 6),

-- Reviews for Doctor 3
('GEN-DOC-202506-128', 'PAT-202412-006', 4, 'Phẫu thuật thành công, hồi phục nhanh chóng.', '2024-12-01 08:30:00+07', true, 4),
('GEN-DOC-202506-128', 'PAT-202412-007', 5, 'Bác sĩ phẫu thuật rất khéo léo, sẹo nhỏ và đẹp.', '2024-12-03 13:45:00+07', true, 7);

-- 5. Create sample emergency contacts for first 5 doctors
INSERT INTO doctor_emergency_contacts (doctor_id, contact_name, relationship, phone_number, email, address, is_primary) VALUES
('GEN-DOC-202506-079', 'Nguyễn Thị Lan', 'Vợ', '0987654321', 'lan.nguyen@email.com', '{"street": "123 Nguyễn Văn Cừ", "district": "Quận 5", "city": "TP.HCM"}', true),
('GEN-DOC-202506-079', 'Nguyễn Văn Nam', 'Anh trai', '0976543210', 'nam.nguyen@email.com', '{"street": "456 Lê Văn Sỹ", "district": "Quận 3", "city": "TP.HCM"}', false),

('GEN-DOC-202506-107', 'Trần Văn Hùng', 'Chồng', '0965432109', 'hung.tran@email.com', '{"street": "789 Cách Mạng Tháng 8", "district": "Quận 10", "city": "TP.HCM"}', true),

('GEN-DOC-202506-128', 'Lê Thị Mai', 'Mẹ', '0954321098', 'mai.le@email.com', '{"street": "321 Điện Biên Phủ", "district": "Quận Bình Thạnh", "city": "TP.HCM"}', true);

-- 6. Create sample statistics for first 5 doctors (last 7 days)
INSERT INTO doctor_statistics (doctor_id, stat_date, total_appointments, completed_appointments, cancelled_appointments, no_show_appointments, new_patients, returning_patients, average_consultation_time, revenue) VALUES
-- Doctor 1 stats
('GEN-DOC-202506-079', CURRENT_DATE - INTERVAL '6 days', 12, 10, 1, 1, 3, 7, 25, 2000000),
('GEN-DOC-202506-079', CURRENT_DATE - INTERVAL '5 days', 15, 13, 2, 0, 5, 8, 30, 2600000),
('GEN-DOC-202506-079', CURRENT_DATE - INTERVAL '4 days', 10, 9, 1, 0, 2, 7, 28, 1800000),
('GEN-DOC-202506-079', CURRENT_DATE - INTERVAL '3 days', 14, 12, 1, 1, 4, 8, 27, 2400000),
('GEN-DOC-202506-079', CURRENT_DATE - INTERVAL '2 days', 11, 10, 1, 0, 3, 7, 26, 2000000),
('GEN-DOC-202506-079', CURRENT_DATE - INTERVAL '1 day', 13, 11, 2, 0, 4, 7, 29, 2200000),
('GEN-DOC-202506-079', CURRENT_DATE, 8, 6, 1, 1, 2, 4, 25, 1200000),

-- Doctor 2 stats
('GEN-DOC-202506-107', CURRENT_DATE - INTERVAL '6 days', 8, 7, 1, 0, 2, 5, 20, 1400000),
('GEN-DOC-202506-107', CURRENT_DATE - INTERVAL '5 days', 10, 9, 1, 0, 3, 6, 22, 1800000),
('GEN-DOC-202506-107', CURRENT_DATE - INTERVAL '4 days', 6, 6, 0, 0, 1, 5, 25, 1200000),
('GEN-DOC-202506-107', CURRENT_DATE - INTERVAL '3 days', 9, 8, 1, 0, 2, 6, 21, 1600000),
('GEN-DOC-202506-107', CURRENT_DATE - INTERVAL '2 days', 7, 7, 0, 0, 1, 6, 23, 1400000),
('GEN-DOC-202506-107', CURRENT_DATE - INTERVAL '1 day', 11, 10, 1, 0, 3, 7, 24, 2000000),
('GEN-DOC-202506-107', CURRENT_DATE, 5, 4, 1, 0, 1, 3, 22, 800000);

-- 7. Update doctors table with enhanced information for first 10 doctors
UPDATE doctors SET 
    success_rate = 95.5,
    total_revenue = 50000000,
    average_consultation_time = 28,
    certifications = '[
        {"name": "Chứng chỉ hành nghề", "issuer": "Bộ Y tế", "date": "2020-06-15"},
        {"name": "Chứng chỉ chuyên khoa nội", "issuer": "Hội Nội khoa Việt Nam", "date": "2019-03-20"}
    ]'::jsonb,
    specializations = '["Nội tiêu hóa", "Nội tim mạch", "Khám tổng quát"]'::jsonb,
    awards = '[
        {"name": "Bác sĩ xuất sắc năm 2023", "organization": "Bộ Y tế", "year": 2023},
        {"name": "Giải thưởng nghiên cứu khoa học", "organization": "Đại học Y Dược TP.HCM", "year": 2022}
    ]'::jsonb
WHERE doctor_id = 'GEN-DOC-202506-079';

UPDATE doctors SET 
    success_rate = 98.2,
    total_revenue = 35000000,
    average_consultation_time = 22,
    certifications = '[
        {"name": "Chứng chỉ Nhi khoa", "issuer": "Hội Nhi khoa Việt Nam", "date": "2021-08-10"},
        {"name": "Chứng chỉ Dinh dưỡng trẻ em", "issuer": "Viện Dinh dưỡng", "date": "2020-11-05"}
    ]'::jsonb,
    specializations = '["Nhi tiêu hóa", "Dinh dưỡng trẻ em", "Nhi hô hấp"]'::jsonb,
    awards = '[
        {"name": "Bác sĩ trẻ xuất sắc 2023", "organization": "Hội Nhi khoa TP.HCM", "year": 2023}
    ]'::jsonb
WHERE doctor_id = 'GEN-DOC-202506-107';

UPDATE doctors SET 
    success_rate = 92.8,
    total_revenue = 60000000,
    average_consultation_time = 35,
    certifications = '[
        {"name": "Chứng chỉ Phẫu thuật cột sống", "issuer": "Hội Chấn thương chỉnh hình", "date": "2020-12-15"},
        {"name": "Chứng chỉ Nội soi khớp", "issuer": "Bệnh viện Việt Đức", "date": "2019-09-20"}
    ]'::jsonb,
    specializations = '["Phẫu thuật cột sống", "Nội soi khớp", "Chấn thương thể thao"]'::jsonb,
    awards = '[
        {"name": "Thầy thuốc ưu tú", "organization": "Chủ tịch nước", "year": 2023},
        {"name": "Giải thưởng phẫu thuật xuất sắc", "organization": "Hội Chấn thương chỉnh hình", "year": 2022}
    ]'::jsonb
WHERE doctor_id = 'GEN-DOC-202506-128';

-- 8. Update remaining doctors with random but realistic data
UPDATE doctors SET 
    success_rate = CASE 
        WHEN specialty LIKE 'SPEC028%' OR specialty LIKE 'SPEC029%' THEN 94.0 + (RANDOM() * 4)  -- Nhi khoa
        WHEN specialty LIKE 'SPEC030%' OR specialty LIKE 'SPEC031%' THEN 96.0 + (RANDOM() * 3)  -- Nội khoa
        WHEN specialty LIKE 'SPEC032%' OR specialty LIKE 'SPEC033%' THEN 91.0 + (RANDOM() * 5)  -- Phẫu thuật
        ELSE 90.0 + (RANDOM() * 8)
    END,
    total_revenue = 20000000 + (RANDOM() * 40000000),
    average_consultation_time = 20 + (RANDOM() * 20)::INTEGER,
    certifications = '[{"name": "Chứng chỉ hành nghề", "issuer": "Bộ Y tế", "date": "2020-01-01"}]'::jsonb,
    specializations = '["Khám tổng quát", "Tư vấn sức khỏe"]'::jsonb,
    awards = '[]'::jsonb
WHERE doctor_id NOT IN ('GEN-DOC-202506-079', 'GEN-DOC-202506-107', 'GEN-DOC-202506-128')
AND (success_rate IS NULL OR success_rate = 0);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ SAMPLE DATA CREATED SUCCESSFULLY!';
    RAISE NOTICE '📊 Work schedules created for all doctors';
    RAISE NOTICE '⚙️ Settings created for all doctors';
    RAISE NOTICE '💼 Work experiences created for 3 doctors';
    RAISE NOTICE '⭐ Reviews created for 3 doctors';
    RAISE NOTICE '🚨 Emergency contacts created for 3 doctors';
    RAISE NOTICE '📈 Statistics created for 2 doctors';
    RAISE NOTICE '🎯 Enhanced data updated for all doctors';
END $$;
