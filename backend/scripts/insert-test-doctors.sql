-- =====================================================
-- INSERT TEST DOCTORS DATA
-- =====================================================
-- This script inserts the original test doctor data
-- Run this AFTER recreate-doctors-table.sql

-- 1. ENSURE PROFILES EXIST FIRST
-- =====================================================

-- Insert test profile for main doctor (if not exists)
INSERT INTO profiles (
    id, 
    email, 
    full_name, 
    phone_number, 
    date_of_birth, 
    role, 
    is_active, 
    email_verified, 
    phone_verified, 
    login_count, 
    two_factor_enabled,
    created_at,
    updated_at
) VALUES (
    '5bdcbd80-f344-40b7-a46b-3760ca487693',
    'doctor@hospital.com',
    'Dr. Petra Winsbury',
    '+84901234567',
    '1980-05-15',
    'doctor',
    true,
    true,
    false,
    5,
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone_number = EXCLUDED.phone_number,
    updated_at = CURRENT_TIMESTAMP;

-- Insert additional test profiles for other doctors
INSERT INTO profiles (
    id, 
    email, 
    full_name, 
    phone_number, 
    date_of_birth, 
    role, 
    is_active, 
    email_verified, 
    phone_verified, 
    login_count, 
    two_factor_enabled,
    created_at,
    updated_at
) VALUES 
(
    'profile-doctor-2',
    'doctor1@hospital.com',
    'Dr. Sarah Johnson',
    '+84901234568',
    '1985-03-20',
    'doctor',
    true,
    true,
    false,
    3,
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'profile-doctor-3',
    'doctor2@hospital.com',
    'Dr. Michael Chen',
    '+84901234569',
    '1982-08-10',
    'doctor',
    true,
    true,
    false,
    2,
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'profile-doctor-4',
    'doctor3@hospital.com',
    'Dr. Emily Rodriguez',
    '+84901234570',
    '1988-12-05',
    'doctor',
    true,
    true,
    false,
    1,
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'profile-doctor-5',
    'doctor4@hospital.com',
    'Dr. James Wilson',
    '+84901234571',
    '1979-07-22',
    'doctor',
    true,
    true,
    false,
    4,
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone_number = EXCLUDED.phone_number,
    updated_at = CURRENT_TIMESTAMP;

-- 2. ENSURE DEPARTMENTS EXIST
-- =====================================================

-- Create departments table if not exists
CREATE TABLE IF NOT EXISTS departments (
    department_id VARCHAR(20) PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL,
    department_code VARCHAR(10) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert test departments
INSERT INTO departments (department_id, department_name, department_code, description, is_active) VALUES
('DEPT-CARD', 'Cardiology Department', 'CARD', 'Heart and cardiovascular system specialists', true),
('DEPT-NEUR', 'Neurology Department', 'NEUR', 'Brain and nervous system specialists', true),
('DEPT-ORTH', 'Orthopedics Department', 'ORTH', 'Bone and joint specialists', true),
('DEPT-PEDI', 'Pediatrics Department', 'PEDI', 'Children healthcare specialists', true),
('DEPT-GYNE', 'Gynecology Department', 'GYNE', 'Women healthcare specialists', true)
ON CONFLICT (department_id) DO NOTHING;

-- 3. INSERT TEST DOCTORS
-- =====================================================

INSERT INTO doctors (
    doctor_id,
    profile_id,
    full_name,
    specialty,
    qualification,
    department_id,
    license_number,
    gender,
    bio,
    experience_years,
    consultation_fee,
    address,
    languages_spoken,
    availability_status,
    rating,
    total_reviews,
    status,
    is_active,
    success_rate,
    total_revenue,
    average_consultation_time,
    certifications,
    specializations,
    awards,
    created_at,
    updated_at
) VALUES 
(
    'DOC-CARD-001',
    '5bdcbd80-f344-40b7-a46b-3760ca487693',
    'Dr. Petra Winsbury',
    'Cardiology',
    'MD, FACC, Board Certified Cardiologist',
    'DEPT-CARD',
    'VN-CL-1234',
    'Male',
    'Dr. Petra Winsbury is an experienced cardiologist with over 15 years of experience in treating heart conditions. He specializes in interventional cardiology and has performed over 2000 successful procedures.',
    15,
    150000.00,
    '{"street": "456 Elm Street", "city": "Springfield", "state": "IL", "country": "USA", "zipcode": "62701"}'::jsonb,
    ARRAY['Vietnamese', 'English'],
    'available',
    4.8,
    127,
    'active',
    true,
    95.5,
    25000000.00,
    45,
    '["Board Certified in Cardiology", "Fellow of American College of Cardiology", "Advanced Cardiac Life Support"]'::jsonb,
    '["Interventional Cardiology", "Preventive Cardiology", "Heart Failure Management"]'::jsonb,
    '["Best Doctor Award 2023", "Excellence in Patient Care 2022"]'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'DOC-NEUR-002',
    'profile-doctor-2',
    'Dr. Sarah Johnson',
    'Neurology',
    'MD, PhD in Neuroscience',
    'DEPT-NEUR',
    'VN-NL-5678',
    'Female',
    'Dr. Sarah Johnson is a renowned neurologist specializing in brain disorders and neurological conditions. She has extensive research experience and has published numerous papers in top medical journals.',
    12,
    200000.00,
    '{"street": "789 Oak Avenue", "city": "Springfield", "state": "IL", "country": "USA", "zipcode": "62702"}'::jsonb,
    ARRAY['Vietnamese', 'English'],
    'available',
    4.9,
    89,
    'active',
    true,
    97.2,
    18000000.00,
    50,
    '["Board Certified in Neurology", "PhD in Neuroscience", "Epilepsy Specialist"]'::jsonb,
    '["Epilepsy", "Stroke Management", "Neurodegenerative Diseases"]'::jsonb,
    '["Research Excellence Award 2023", "Top Neurologist 2022"]'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'DOC-ORTH-003',
    'profile-doctor-3',
    'Dr. Michael Chen',
    'Orthopedics',
    'MD, MS in Orthopedic Surgery',
    'DEPT-ORTH',
    'VN-OR-9012',
    'Male',
    'Dr. Michael Chen is an expert orthopedic surgeon with specialization in bone and joint surgery. He has performed over 1500 successful surgeries and is known for his minimally invasive techniques.',
    10,
    180000.00,
    '{"street": "321 Pine Street", "city": "Springfield", "state": "IL", "country": "USA", "zipcode": "62703"}'::jsonb,
    ARRAY['Vietnamese', 'English', 'Chinese'],
    'available',
    4.7,
    156,
    'active',
    true,
    93.8,
    22000000.00,
    40,
    '["Board Certified in Orthopedic Surgery", "Fellowship in Sports Medicine", "Arthroscopy Specialist"]'::jsonb,
    '["Sports Medicine", "Joint Replacement", "Arthroscopic Surgery"]'::jsonb,
    '["Surgeon of the Year 2023", "Innovation in Surgery Award 2022"]'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'DOC-PEDI-004',
    'profile-doctor-4',
    'Dr. Emily Rodriguez',
    'Pediatrics',
    'MD, Board Certified Pediatrician',
    'DEPT-PEDI',
    'VN-PD-3456',
    'Female',
    'Dr. Emily Rodriguez is a compassionate pediatrician dedicated to providing comprehensive healthcare for children from infancy through adolescence. She has a special interest in developmental pediatrics.',
    8,
    120000.00,
    '{"street": "654 Maple Drive", "city": "Springfield", "state": "IL", "country": "USA", "zipcode": "62704"}'::jsonb,
    ARRAY['Vietnamese', 'English', 'Spanish'],
    'available',
    4.9,
    203,
    'active',
    true,
    96.1,
    15000000.00,
    35,
    '["Board Certified in Pediatrics", "Developmental Pediatrics Fellowship", "PALS Certified"]'::jsonb,
    '["Developmental Pediatrics", "Adolescent Medicine", "Preventive Care"]'::jsonb,
    '["Pediatrician of the Year 2023", "Excellence in Child Care 2022"]'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'DOC-GYNE-005',
    'profile-doctor-5',
    'Dr. James Wilson',
    'Gynecology',
    'MD, FACOG',
    'DEPT-GYNE',
    'VN-GY-7890',
    'Male',
    'Dr. James Wilson is an experienced gynecologist with expertise in women\'s health and reproductive medicine. He provides comprehensive care for women of all ages with a focus on minimally invasive procedures.',
    13,
    160000.00,
    '{"street": "987 Cedar Lane", "city": "Springfield", "state": "IL", "country": "USA", "zipcode": "62705"}'::jsonb,
    ARRAY['Vietnamese', 'English'],
    'available',
    4.6,
    178,
    'active',
    true,
    94.3,
    20000000.00,
    42,
    '["Board Certified in Obstetrics and Gynecology", "Fellow of ACOG", "Laparoscopic Surgery Specialist"]'::jsonb,
    '["Reproductive Medicine", "Minimally Invasive Surgery", "Menopause Management"]'::jsonb,
    '["Excellence in Women\'s Health 2023", "Top Gynecologist 2022"]'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (doctor_id) DO UPDATE SET
    profile_id = EXCLUDED.profile_id,
    full_name = EXCLUDED.full_name,
    specialty = EXCLUDED.specialty,
    qualification = EXCLUDED.qualification,
    department_id = EXCLUDED.department_id,
    license_number = EXCLUDED.license_number,
    gender = EXCLUDED.gender,
    bio = EXCLUDED.bio,
    experience_years = EXCLUDED.experience_years,
    consultation_fee = EXCLUDED.consultation_fee,
    address = EXCLUDED.address,
    languages_spoken = EXCLUDED.languages_spoken,
    availability_status = EXCLUDED.availability_status,
    rating = EXCLUDED.rating,
    total_reviews = EXCLUDED.total_reviews,
    status = EXCLUDED.status,
    is_active = EXCLUDED.is_active,
    success_rate = EXCLUDED.success_rate,
    total_revenue = EXCLUDED.total_revenue,
    average_consultation_time = EXCLUDED.average_consultation_time,
    certifications = EXCLUDED.certifications,
    specializations = EXCLUDED.specializations,
    awards = EXCLUDED.awards,
    updated_at = CURRENT_TIMESTAMP;

-- 4. VERIFICATION
-- =====================================================

-- Check inserted data
SELECT 
    doctor_id,
    profile_id,
    full_name,
    specialty,
    department_id,
    license_number,
    is_active
FROM doctors 
ORDER BY doctor_id;

-- Check profile relationships
SELECT 
    d.doctor_id,
    d.full_name as doctor_name,
    p.email,
    p.role
FROM doctors d
JOIN profiles p ON d.profile_id = p.id
ORDER BY d.doctor_id;

-- Success message
SELECT 'Test doctors data inserted successfully!' as result;
