-- =============================================
-- Sample Data for Doctor Profile Enhancements
-- =============================================

-- Sample Work Experiences for doctors
INSERT INTO doctor_work_experiences (doctor_id, hospital_name, position, department, start_date, end_date, description, achievements, is_current) VALUES
-- Doctor 1 experiences
('DOC-CARD-001', 'Bệnh viện Chợ Rẫy', 'Bác sĩ nội trú', 'Tim mạch', '2018-01-01', '2020-12-31', 'Làm việc tại khoa tim mạch, chuyên điều trị các bệnh về tim', 'Điều trị thành công 500+ ca bệnh tim mạch', false),
('DOC-CARD-001', 'Bệnh viện Đại học Y Dược TP.HCM', 'Bác sĩ chuyên khoa', 'Tim mạch', '2021-01-01', NULL, 'Bác sĩ chuyên khoa tim mạch, phụ trách các ca phẫu thuật tim', 'Thực hiện 200+ ca phẫu thuật tim thành công', true),

-- Doctor 2 experiences  
('DOC-PEDI-002', 'Bệnh viện Nhi đồng 1', 'Bác sĩ nội trú', 'Nhi khoa', '2019-06-01', '2021-05-31', 'Chăm sóc trẻ em từ 0-16 tuổi', 'Được khen thưởng bác sĩ xuất sắc năm 2020', false),
('DOC-PEDI-002', 'Bệnh viện Đại học Y Dược TP.HCM', 'Bác sĩ chuyên khoa', 'Nhi khoa', '2021-06-01', NULL, 'Chuyên điều trị các bệnh nhi khoa phức tạp', 'Nghiên cứu và phát triển phương pháp điều trị mới cho trẻ em', true),

-- Doctor 3 experiences
('DOC-ORTH-003', 'Bệnh viện Việt Đức', 'Bác sĩ nội trú', 'Chấn thương chỉnh hình', '2017-01-01', '2019-12-31', 'Điều trị các chấn thương xương khớp', 'Tham gia 300+ ca phẫu thuật chỉnh hình', false),
('DOC-ORTH-003', 'Bệnh viện Đại học Y Dược TP.HCM', 'Bác sĩ chuyên khoa', 'Chấn thương chỉnh hình', '2020-01-01', NULL, 'Chuyên gia phẫu thuật cột sống và khớp', 'Đạt chứng chỉ phẫu thuật nội soi cột sống', true);

-- Sample Patient Reviews
INSERT INTO doctor_reviews (doctor_id, patient_id, rating, review_text, review_date, is_verified) VALUES
-- Reviews for Doctor 1
('DOC-CARD-001', 'PAT-202412-001', 5, 'Bác sĩ rất tận tâm và chuyên nghiệp. Giải thích rõ ràng về tình trạng bệnh.', '2024-12-01 10:00:00+07', true),
('DOC-CARD-001', 'PAT-202412-002', 5, 'Khám rất kỹ, tư vấn chi tiết. Cảm ơn bác sĩ!', '2024-12-02 14:30:00+07', true),
('DOC-CARD-001', 'PAT-202412-003', 4, 'Bác sĩ giỏi nhưng hơi khó tính. Tuy nhiên điều trị hiệu quả.', '2024-12-03 09:15:00+07', true),

-- Reviews for Doctor 2
('DOC-PEDI-002', 'PAT-202412-004', 5, 'Bác sĩ rất yêu trẻ em, con tôi không sợ khám bệnh nữa.', '2024-12-01 11:00:00+07', true),
('DOC-PEDI-002', 'PAT-202412-005', 5, 'Chuyên môn cao, tư vấn tận tình cho phụ huynh.', '2024-12-02 16:00:00+07', true),

-- Reviews for Doctor 3
('DOC-ORTH-003', 'PAT-202412-006', 4, 'Phẫu thuật thành công, hồi phục nhanh chóng.', '2024-12-01 08:30:00+07', true),
('DOC-ORTH-003', 'PAT-202412-007', 5, 'Bác sĩ phẫu thuật rất khéo léo, sẹo nhỏ và đẹp.', '2024-12-03 13:45:00+07', true);

-- Sample Emergency Contacts
INSERT INTO doctor_emergency_contacts (doctor_id, contact_name, relationship, phone_number, email, address, is_primary) VALUES
('DOC-CARD-001', 'Nguyễn Thị Lan', 'Vợ', '0987654321', 'lan.nguyen@email.com', '{"street": "123 Nguyễn Văn Cừ", "district": "Quận 5", "city": "TP.HCM"}', true),
('DOC-CARD-001', 'Nguyễn Văn Nam', 'Anh trai', '0976543210', 'nam.nguyen@email.com', '{"street": "456 Lê Văn Sỹ", "district": "Quận 3", "city": "TP.HCM"}', false),

('DOC-PEDI-002', 'Trần Văn Hùng', 'Chồng', '0965432109', 'hung.tran@email.com', '{"street": "789 Cách Mạng Tháng 8", "district": "Quận 10", "city": "TP.HCM"}', true),

('DOC-ORTH-003', 'Lê Thị Mai', 'Mẹ', '0954321098', 'mai.le@email.com', '{"street": "321 Điện Biên Phủ", "district": "Quận Bình Thạnh", "city": "TP.HCM"}', true);

-- Sample Statistics Data (last 30 days)
INSERT INTO doctor_statistics (doctor_id, stat_date, total_appointments, completed_appointments, cancelled_appointments, no_show_appointments, new_patients, returning_patients, average_consultation_time, revenue) VALUES
-- Doctor 1 stats
('DOC-CARD-001', '2024-12-01', 12, 10, 1, 1, 3, 7, 25, 2000000),
('DOC-CARD-001', '2024-12-02', 15, 13, 2, 0, 5, 8, 30, 2600000),
('DOC-CARD-001', '2024-12-03', 10, 9, 1, 0, 2, 7, 28, 1800000),

-- Doctor 2 stats
('DOC-PEDI-002', '2024-12-01', 8, 7, 1, 0, 2, 5, 20, 1400000),
('DOC-PEDI-002', '2024-12-02', 10, 9, 1, 0, 3, 6, 22, 1800000),
('DOC-PEDI-002', '2024-12-03', 6, 6, 0, 0, 1, 5, 25, 1200000),

-- Doctor 3 stats
('DOC-ORTH-003', '2024-12-01', 6, 5, 1, 0, 1, 4, 35, 1500000),
('DOC-ORTH-003', '2024-12-02', 8, 7, 1, 0, 2, 5, 40, 2100000),
('DOC-ORTH-003', '2024-12-03', 4, 4, 0, 0, 0, 4, 30, 1200000);

-- Update doctors table with enhanced information
UPDATE doctors SET 
    success_rate = 95.5,
    total_revenue = 50000000,
    average_consultation_time = 28,
    certifications = '[
        {"name": "Chứng chỉ Tim mạch can thiệp", "issuer": "Hội Tim mạch Việt Nam", "date": "2020-06-15"},
        {"name": "Chứng chỉ Siêu âm tim", "issuer": "Bệnh viện Chợ Rẫy", "date": "2019-03-20"}
    ]'::jsonb,
    specializations = '["Tim mạch can thiệp", "Siêu âm tim", "Điện tâm đồ"]'::jsonb,
    awards = '[
        {"name": "Bác sĩ xuất sắc năm 2023", "organization": "Bộ Y tế", "year": 2023},
        {"name": "Giải thưởng nghiên cứu khoa học", "organization": "Đại học Y Dược TP.HCM", "year": 2022}
    ]'::jsonb
WHERE doctor_id = 'DOC-CARD-001';

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
WHERE doctor_id = 'DOC-PEDI-002';

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
WHERE doctor_id = 'DOC-ORTH-003';

-- Add more sample data for other doctors if they exist
UPDATE doctors SET 
    success_rate = CASE 
        WHEN doctor_id LIKE 'DOC-CARD%' THEN 94.0 + (RANDOM() * 4)
        WHEN doctor_id LIKE 'DOC-PEDI%' THEN 96.0 + (RANDOM() * 3)
        WHEN doctor_id LIKE 'DOC-ORTH%' THEN 91.0 + (RANDOM() * 5)
        ELSE 90.0 + (RANDOM() * 8)
    END,
    total_revenue = 20000000 + (RANDOM() * 40000000),
    average_consultation_time = 20 + (RANDOM() * 20)::INTEGER,
    certifications = '[]'::jsonb,
    specializations = '[]'::jsonb,
    awards = '[]'::jsonb
WHERE doctor_id NOT IN ('DOC-CARD-001', 'DOC-PEDI-002', 'DOC-ORTH-003');
