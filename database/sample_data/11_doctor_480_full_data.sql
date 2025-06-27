-- =============================================
-- Full Sample Data for Doctor GEN-DOC-202506-480 (BS. Nguyễn Văn Đức)
-- Complete profile enhancement data
-- =============================================

-- 1. Work Experience for Doctor GEN-DOC-202506-480
INSERT INTO doctor_work_experiences (doctor_id, hospital_name, position, department, start_date, end_date, description, achievements, is_current) VALUES
-- Previous experience
('GEN-DOC-202506-480', 'Bệnh viện Bình Dân', 'Bác sĩ nội trú', 'Khoa Nội tổng hợp', '2016-07-01', '2019-06-30', 'Làm việc tại khoa nội tổng hợp, chuyên điều trị các bệnh nội khoa thường gặp như tiểu đường, cao huyết áp, bệnh tim mạch', 'Điều trị thành công 800+ ca bệnh nội khoa, được bệnh nhân đánh giá cao về thái độ tận tâm', false),

-- Second experience
('GEN-DOC-202506-480', 'Bệnh viện Thống Nhất', 'Bác sĩ chuyên khoa I', 'Khoa Tim mạch', '2019-07-01', '2022-12-31', 'Chuyên sâu về tim mạch, thực hiện các thủ thuật can thiệp tim mạch, siêu âm tim, điện tâm đồ', 'Thực hiện 300+ ca can thiệp tim mạch thành công, tham gia nghiên cứu về bệnh mạch vành', false),

-- Current position
('GEN-DOC-202506-480', 'Bệnh viện Đại học Y Dược TP.HCM', 'Bác sĩ chuyên khoa II', 'Khoa Tim mạch', '2023-01-01', NULL, 'Bác sĩ chuyên khoa tim mạch cao cấp, phụ trách các ca bệnh phức tạp, đào tạo bác sĩ trẻ', 'Trưởng nhóm nghiên cứu tim mạch, xuất bản 5 bài báo khoa học quốc tế, đào tạo 20+ bác sĩ trẻ', true);

-- 2. Patient Reviews for Doctor GEN-DOC-202506-480
INSERT INTO doctor_reviews (doctor_id, patient_id, rating, review_text, review_date, is_verified, helpful_count, is_anonymous) VALUES
-- Excellent reviews
('GEN-DOC-202506-480', 'PAT-202412-101', 5, 'Bác sĩ Đức rất chuyên nghiệp và tận tâm. Giải thích rõ ràng về tình trạng bệnh tim của tôi, đưa ra phương án điều trị hiệu quả. Sau 3 tháng điều trị, tình trạng sức khỏe của tôi đã cải thiện rõ rệt.', '2024-12-01 09:30:00+07', true, 12, false),

('GEN-DOC-202506-480', 'PAT-202412-102', 5, 'Bác sĩ khám rất kỹ, hỏi thăm tình trạng sức khỏe chi tiết. Thái độ ân cần, lịch sự. Tôi rất tin tưởng vào chuyên môn của bác sĩ.', '2024-12-02 14:15:00+07', true, 8, false),

('GEN-DOC-202506-480', 'PAT-202412-103', 5, 'Cảm ơn bác sĩ Đức đã cứu sống tôi trong ca cấp cứu nhồi máu cơ tim. Bác sĩ đã xử lý rất nhanh và chính xác. Tôi và gia đình vô cùng biết ơn.', '2024-12-03 16:45:00+07', true, 15, false),

('GEN-DOC-202506-480', 'PAT-202412-104', 4, 'Bác sĩ giỏi chuyên môn, tuy nhiên thời gian chờ khám hơi lâu. Nhưng khi được khám thì rất kỹ lưỡng và chu đáo.', '2024-12-04 11:20:00+07', true, 6, false),

('GEN-DOC-202506-480', 'PAT-202412-105', 5, 'Bác sĩ Đức là một trong những bác sĩ tim mạch giỏi nhất mà tôi từng gặp. Chuyên môn cao, kinh nghiệm phong phú, thái độ rất tốt với bệnh nhân.', '2024-12-05 10:00:00+07', true, 10, false),

('GEN-DOC-202506-480', 'PAT-202412-106', 5, 'Tôi đã được bác sĩ Đức phẫu thuật đặt stent mạch vành. Ca phẫu thuật rất thành công, hồi phục nhanh chóng. Bác sĩ rất khéo léo và có kinh nghiệm.', '2024-12-06 15:30:00+07', true, 9, false),

('GEN-DOC-202506-480', 'PAT-202412-107', 4, 'Bác sĩ chuyên môn tốt, tư vấn chi tiết về chế độ ăn uống và tập luyện cho người bệnh tim. Tuy nhiên giá khám hơi cao.', '2024-12-07 13:10:00+07', true, 4, false),

('GEN-DOC-202506-480', 'PAT-202412-108', 5, 'Bác sĩ rất kiên nhẫn giải thích về bệnh tình, không vội vàng trong quá trình khám. Tôi cảm thấy được quan tâm và chăm sóc tốt.', '2024-12-08 09:45:00+07', true, 7, false);

-- 3. Emergency Contacts for Doctor GEN-DOC-202506-480
INSERT INTO doctor_emergency_contacts (doctor_id, contact_name, relationship, phone_number, email, address, is_primary) VALUES
-- Primary contact - Wife
('GEN-DOC-202506-480', 'Trần Thị Hồng Nhung', 'Vợ', '0987123456', 'nhung.tran@gmail.com', '{"street": "234 Nguyễn Thị Minh Khai", "district": "Quận 1", "city": "TP.HCM"}', true),

-- Secondary contact - Brother
('GEN-DOC-202506-480', 'Nguyễn Văn Hùng', 'Anh trai', '0976234567', 'hung.nguyen@yahoo.com', '{"street": "567 Lê Lợi", "district": "Quận 1", "city": "TP.HCM"}', false),

-- Third contact - Mother
('GEN-DOC-202506-480', 'Lê Thị Lan', 'Mẹ', '0965345678', 'lan.le@hotmail.com', '{"street": "890 Hai Bà Trưng", "district": "Quận 3", "city": "TP.HCM"}', false);

-- 4. Statistics for Doctor GEN-DOC-202506-480 (Last 14 days)
INSERT INTO doctor_statistics (doctor_id, stat_date, total_appointments, completed_appointments, cancelled_appointments, no_show_appointments, new_patients, returning_patients, average_consultation_time, revenue) VALUES
-- Week 1
('GEN-DOC-202506-480', CURRENT_DATE - INTERVAL '13 days', 18, 16, 1, 1, 4, 12, 35, 3200000),
('GEN-DOC-202506-480', CURRENT_DATE - INTERVAL '12 days', 20, 18, 2, 0, 6, 12, 38, 3600000),
('GEN-DOC-202506-480', CURRENT_DATE - INTERVAL '11 days', 16, 15, 1, 0, 3, 12, 33, 3000000),
('GEN-DOC-202506-480', CURRENT_DATE - INTERVAL '10 days', 22, 20, 1, 1, 7, 13, 36, 4000000),
('GEN-DOC-202506-480', CURRENT_DATE - INTERVAL '9 days', 19, 17, 2, 0, 5, 12, 34, 3400000),
('GEN-DOC-202506-480', CURRENT_DATE - INTERVAL '8 days', 15, 14, 1, 0, 2, 12, 32, 2800000),
('GEN-DOC-202506-480', CURRENT_DATE - INTERVAL '7 days', 21, 19, 1, 1, 6, 13, 37, 3800000),

-- Week 2
('GEN-DOC-202506-480', CURRENT_DATE - INTERVAL '6 days', 17, 16, 1, 0, 4, 12, 35, 3200000),
('GEN-DOC-202506-480', CURRENT_DATE - INTERVAL '5 days', 23, 21, 2, 0, 8, 13, 39, 4200000),
('GEN-DOC-202506-480', CURRENT_DATE - INTERVAL '4 days', 18, 17, 1, 0, 5, 12, 36, 3400000),
('GEN-DOC-202506-480', CURRENT_DATE - INTERVAL '3 days', 20, 18, 1, 1, 6, 12, 34, 3600000),
('GEN-DOC-202506-480', CURRENT_DATE - INTERVAL '2 days', 16, 15, 1, 0, 3, 12, 33, 3000000),
('GEN-DOC-202506-480', CURRENT_DATE - INTERVAL '1 day', 19, 17, 2, 0, 5, 12, 35, 3400000),
('GEN-DOC-202506-480', CURRENT_DATE, 12, 10, 1, 1, 3, 7, 32, 2000000);

-- 5. Update Doctor GEN-DOC-202506-480 with comprehensive information
UPDATE doctors SET 
    success_rate = 96.8,
    total_revenue = 85000000,
    average_consultation_time = 35,
    certifications = '[
        {"name": "Chứng chỉ Tim mạch can thiệp", "issuer": "Hội Tim mạch Việt Nam", "date": "2019-08-15"},
        {"name": "Chứng chỉ Siêu âm tim", "issuer": "Bệnh viện Thống Nhất", "date": "2020-03-20"},
        {"name": "Chứng chỉ Điện tâm đồ nâng cao", "issuer": "Đại học Y Dược TP.HCM", "date": "2021-06-10"},
        {"name": "Chứng chỉ Cấp cứu tim mạch", "issuer": "Bộ Y tế", "date": "2022-01-15"}
    ]'::jsonb,
    specializations = '[
        "Tim mạch can thiệp", 
        "Siêu âm tim", 
        "Điện tâm đồ", 
        "Cấp cứu tim mạch",
        "Phẫu thuật tim hở",
        "Điều trị rối loạn nhịp tim"
    ]'::jsonb,
    awards = '[
        {"name": "Bác sĩ xuất sắc năm 2023", "organization": "Bộ Y tế", "year": 2023},
        {"name": "Giải thưởng nghiên cứu khoa học tim mạch", "organization": "Hội Tim mạch Việt Nam", "year": 2022},
        {"name": "Thầy thuốc trẻ tiêu biểu", "organization": "Đoàn Thanh niên Y tế TP.HCM", "year": 2021},
        {"name": "Giải nhất hội thi tay nghề tim mạch", "organization": "Bệnh viện Đại học Y Dược TP.HCM", "year": 2023}
    ]'::jsonb
WHERE doctor_id = 'GEN-DOC-202506-480';

-- 6. Ensure work schedule exists for this doctor
INSERT INTO doctor_work_schedules (doctor_id, day_of_week, start_time, end_time, lunch_start_time, lunch_end_time, max_patients_per_day, is_active)
VALUES 
('GEN-DOC-202506-480', 1, '07:30', '17:30', '12:00', '13:00', 25, true), -- Monday
('GEN-DOC-202506-480', 2, '07:30', '17:30', '12:00', '13:00', 25, true), -- Tuesday  
('GEN-DOC-202506-480', 3, '07:30', '17:30', '12:00', '13:00', 25, true), -- Wednesday
('GEN-DOC-202506-480', 4, '07:30', '17:30', '12:00', '13:00', 25, true), -- Thursday
('GEN-DOC-202506-480', 5, '07:30', '16:30', '12:00', '13:00', 20, true), -- Friday
('GEN-DOC-202506-480', 6, '08:00', '12:00', NULL, NULL, 10, true)        -- Saturday (morning only)
ON CONFLICT (doctor_id, day_of_week) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    lunch_start_time = EXCLUDED.lunch_start_time,
    lunch_end_time = EXCLUDED.lunch_end_time,
    max_patients_per_day = EXCLUDED.max_patients_per_day,
    is_active = EXCLUDED.is_active;

-- 7. Ensure settings exist for this doctor
INSERT INTO doctor_settings (doctor_id, notification_email, notification_sms, notification_appointment_reminder, notification_patient_review, privacy_show_phone, privacy_show_email, privacy_show_experience, language_preference, timezone, theme_preference)
VALUES ('GEN-DOC-202506-480', true, true, true, true, true, true, true, 'vi', 'Asia/Ho_Chi_Minh', 'light')
ON CONFLICT (doctor_id) DO UPDATE SET
    notification_email = EXCLUDED.notification_email,
    notification_sms = EXCLUDED.notification_sms,
    notification_appointment_reminder = EXCLUDED.notification_appointment_reminder,
    notification_patient_review = EXCLUDED.notification_patient_review,
    privacy_show_phone = EXCLUDED.privacy_show_phone,
    privacy_show_email = EXCLUDED.privacy_show_email,
    privacy_show_experience = EXCLUDED.privacy_show_experience,
    language_preference = EXCLUDED.language_preference,
    timezone = EXCLUDED.timezone,
    theme_preference = EXCLUDED.theme_preference;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ FULL DATA CREATED FOR DOCTOR GEN-DOC-202506-480!';
    RAISE NOTICE '👨‍⚕️ BS. Nguyễn Văn Đức - Tim mạch chuyên sâu';
    RAISE NOTICE '💼 3 work experiences (7+ years experience)';
    RAISE NOTICE '⭐ 8 patient reviews (4.75/5 average rating)';
    RAISE NOTICE '🚨 3 emergency contacts';
    RAISE NOTICE '📊 14 days of statistics';
    RAISE NOTICE '🏆 4 certifications, 6 specializations, 4 awards';
    RAISE NOTICE '📅 6-day work schedule (Mon-Sat)';
    RAISE NOTICE '⚙️ Complete settings profile';
    RAISE NOTICE '🎯 Ready for comprehensive testing!';
END $$;
