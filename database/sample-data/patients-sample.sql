-- Sample patients data for testing
-- Run this in Supabase SQL Editor to create test patients

-- First, create sample profiles for patients
INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  phone_number,
  email_verified,
  phone_verified,
  is_active,
  created_at,
  updated_at
) VALUES 
-- Patient 1
(
  '550e8400-e29b-41d4-a716-446655440001',
  'nguyenvana@email.com',
  'Nguyễn Văn A',
  'patient',
  '0901234567',
  true,
  true,
  true,
  NOW(),
  NOW()
),
-- Patient 2
(
  '550e8400-e29b-41d4-a716-446655440002',
  'tranthib@email.com',
  'Trần Thị B',
  'patient',
  '0987654321',
  true,
  true,
  true,
  NOW(),
  NOW()
),
-- Patient 3
(
  '550e8400-e29b-41d4-a716-446655440003',
  'levancuong@email.com',
  'Lê Văn Cường',
  'patient',
  '0912345678',
  true,
  false,
  true,
  NOW(),
  NOW()
),
-- Patient 4
(
  '550e8400-e29b-41d4-a716-446655440004',
  'phamthid@email.com',
  'Phạm Thị D',
  'patient',
  '0923456789',
  true,
  true,
  true,
  NOW(),
  NOW()
),
-- Patient 5
(
  '550e8400-e29b-41d4-a716-446655440005',
  'hoangvane@email.com',
  'Hoàng Văn E',
  'patient',
  '0934567890',
  false,
  true,
  true,
  NOW(),
  NOW()
),
-- Patient 6
(
  '550e8400-e29b-41d4-a716-446655440006',
  'ngothif@email.com',
  'Ngô Thị F',
  'patient',
  '0945678901',
  true,
  true,
  true,
  NOW(),
  NOW()
),
-- Patient 7
(
  '550e8400-e29b-41d4-a716-446655440007',
  'vuvangh@email.com',
  'Vũ Văn G',
  'patient',
  '0956789012',
  true,
  false,
  true,
  NOW(),
  NOW()
),
-- Patient 8
(
  '550e8400-e29b-41d4-a716-446655440008',
  'dothih@email.com',
  'Đỗ Thị H',
  'patient',
  '0967890123',
  true,
  true,
  true,
  NOW(),
  NOW()
),
-- Patient 9
(
  '550e8400-e29b-41d4-a716-446655440009',
  'buivani@email.com',
  'Bùi Văn I',
  'patient',
  '0978901234',
  true,
  true,
  true,
  NOW(),
  NOW()
),
-- Patient 10
(
  '550e8400-e29b-41d4-a716-446655440010',
  'lythik@email.com',
  'Lý Thị K',
  'patient',
  '0989012345',
  false,
  true,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Now insert patients data
INSERT INTO patients (
  patient_id,
  profile_id,
  full_name,
  date_of_birth,
  gender,
  blood_type,
  address,
  emergency_contact,
  insurance_info,
  medical_history,
  allergies,
  current_medications,
  status,
  notes,
  created_at,
  updated_at
) VALUES 
-- Patient 1: Nguyễn Văn A
(
  'PAT000001',
  '550e8400-e29b-41d4-a716-446655440001',
  'Nguyễn Văn A',
  '1990-05-15',
  'male',
  'O+',
  '{"street": "123 Nguyễn Văn Cừ", "ward": "Phường 1", "district": "Quận 5", "city": "TP.HCM", "postal_code": "70000"}',
  '{"name": "Nguyễn Thị B", "relationship": "Vợ", "phone": "0987654321", "address": "123 Nguyễn Văn Cừ, Q.5, TP.HCM"}',
  '{"provider": "Bảo hiểm Y tế Xã hội", "policy_number": "SV123456789", "expiry_date": "2024-12-31", "coverage": "80%"}',
  'Tăng huyết áp (2020), Tiểu đường type 2 (2021)',
  '["Penicillin", "Đậu phộng"]',
  '{"medications": [{"name": "Metformin", "dosage": "500mg", "frequency": "2 lần/ngày", "start_date": "2021-03-01"}]}',
  'active',
  'Bệnh nhân tuân thủ điều trị tốt',
  NOW(),
  NOW()
),
-- Patient 2: Trần Thị B
(
  'PAT000002',
  '550e8400-e29b-41d4-a716-446655440002',
  'Trần Thị B',
  '1985-08-22',
  'female',
  'A+',
  '{"street": "456 Lê Văn Sỹ", "ward": "Phường 12", "district": "Quận 3", "city": "TP.HCM", "postal_code": "70000"}',
  '{"name": "Trần Văn C", "relationship": "Chồng", "phone": "0912345678", "address": "456 Lê Văn Sỹ, Q.3, TP.HCM"}',
  '{"provider": "Bảo hiểm Y tế Xã hội", "policy_number": "SV987654321", "expiry_date": "2024-12-31", "coverage": "80%"}',
  'Hen suyễn (2015), Viêm dạ dày (2019)',
  '["Aspirin", "Tôm cua"]',
  '{"medications": [{"name": "Ventolin", "dosage": "100mcg", "frequency": "Khi cần", "start_date": "2015-06-01"}]}',
  'active',
  'Cần theo dõi hen suyễn định kỳ',
  NOW(),
  NOW()
),
-- Patient 3: Lê Văn Cường
(
  'PAT000003',
  '550e8400-e29b-41d4-a716-446655440003',
  'Lê Văn Cường',
  '1978-12-10',
  'male',
  'B+',
  '{"street": "789 Võ Văn Tần", "ward": "Phường 6", "district": "Quận 3", "city": "TP.HCM", "postal_code": "70000"}',
  '{"name": "Lê Thị D", "relationship": "Vợ", "phone": "0923456789", "address": "789 Võ Văn Tần, Q.3, TP.HCM"}',
  '{"provider": "Bảo hiểm Y tế Xã hội", "policy_number": "SV456789123", "expiry_date": "2024-12-31", "coverage": "80%"}',
  'Bệnh tim mạch (2018), Cholesterol cao (2020)',
  '["Iodine"]',
  '{"medications": [{"name": "Atorvastatin", "dosage": "20mg", "frequency": "1 lần/ngày", "start_date": "2020-01-15"}]}',
  'active',
  'Cần kiểm tra tim mạch định kỳ 6 tháng/lần',
  NOW(),
  NOW()
),
-- Patient 4: Phạm Thị D
(
  'PAT000004',
  '550e8400-e29b-41d4-a716-446655440004',
  'Phạm Thị D',
  '1992-03-25',
  'female',
  'AB+',
  '{"street": "321 Điện Biên Phủ", "ward": "Phường 15", "district": "Bình Thạnh", "city": "TP.HCM", "postal_code": "70000"}',
  '{"name": "Phạm Văn E", "relationship": "Anh trai", "phone": "0934567890", "address": "321 Điện Biên Phủ, Bình Thạnh, TP.HCM"}',
  '{"provider": "Bảo hiểm Y tế Xã hội", "policy_number": "SV789123456", "expiry_date": "2024-12-31", "coverage": "80%"}',
  'Thiếu máu (2019), Viêm khớp (2021)',
  '["Latex", "Thuốc kháng sinh nhóm Sulfa"]',
  '{"medications": [{"name": "Iron supplement", "dosage": "65mg", "frequency": "1 lần/ngày", "start_date": "2019-08-01"}]}',
  'active',
  'Theo dõi chỉ số máu định kỳ',
  NOW(),
  NOW()
),
-- Patient 5: Hoàng Văn E
(
  'PAT000005',
  '550e8400-e29b-41d4-a716-446655440005',
  'Hoàng Văn E',
  '1965-11-08',
  'male',
  'O-',
  '{"street": "654 Cách Mạng Tháng 8", "ward": "Phường 5", "district": "Quận 10", "city": "TP.HCM", "postal_code": "70000"}',
  '{"name": "Hoàng Thị F", "relationship": "Vợ", "phone": "0945678901", "address": "654 Cách Mạng Tháng 8, Q.10, TP.HCM"}',
  '{"provider": "Bảo hiểm Y tế Xã hội", "policy_number": "SV321654987", "expiry_date": "2024-12-31", "coverage": "80%"}',
  'Đái tháo đường type 2 (2010), Tăng huyết áp (2012), Bệnh thận mạn (2020)',
  '["Không có"]',
  '{"medications": [{"name": "Insulin", "dosage": "10 units", "frequency": "2 lần/ngày", "start_date": "2010-05-01"}, {"name": "Lisinopril", "dosage": "10mg", "frequency": "1 lần/ngày", "start_date": "2012-03-01"}]}',
  'active',
  'Bệnh nhân cần theo dõi chặt chẽ đường huyết và chức năng thận',
  NOW(),
  NOW()
)
ON CONFLICT (patient_id) DO NOTHING;
