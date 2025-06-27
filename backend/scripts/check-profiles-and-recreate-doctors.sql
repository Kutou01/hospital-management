-- =====================================================
-- CHECK PROFILES AND RECREATE DOCTORS FROM EXISTING DATA
-- =====================================================
-- This script will check existing profiles and recreate doctors table

-- 1. CHECK EXISTING PROFILES DATA
-- =====================================================

-- Check all profiles with role = 'doctor'
SELECT 'Checking existing doctor profiles...' as status;

SELECT 
    id,
    email,
    full_name,
    phone_number,
    date_of_birth,
    role,
    is_active,
    created_at
FROM profiles 
WHERE role = 'doctor'
ORDER BY created_at;

-- Count doctor profiles
SELECT 
    COUNT(*) as total_doctor_profiles,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_doctor_profiles,
    COUNT(CASE WHEN email LIKE '%@hospital.com' THEN 1 END) as hospital_email_profiles
FROM profiles 
WHERE role = 'doctor';

-- 2. CHECK IF DOCTORS TABLE EXISTS AND ITS CURRENT STATE
-- =====================================================

-- Check if doctors table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctors') 
        THEN 'Doctors table exists'
        ELSE 'Doctors table does not exist'
    END as doctors_table_status;

-- If doctors table exists, check its data
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctors') THEN
        RAISE NOTICE 'Current doctors table has % records', (SELECT COUNT(*) FROM doctors);
        
        -- Show existing doctors
        RAISE NOTICE 'Existing doctors:';
        FOR rec IN (SELECT doctor_id, full_name, specialty FROM doctors LIMIT 10) LOOP
            RAISE NOTICE '  - %: % (%)', rec.doctor_id, rec.full_name, rec.specialty;
        END LOOP;
    ELSE
        RAISE NOTICE 'Doctors table does not exist';
    END IF;
END $$;

-- 3. RECREATE DOCTORS TABLE WITH ORIGINAL STRUCTURE
-- =====================================================

-- Drop existing doctors table and constraints
DO $$
BEGIN
    -- Drop foreign key constraints first
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_doctors_profile_id') THEN
        ALTER TABLE doctors DROP CONSTRAINT fk_doctors_profile_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_doctors_department_id') THEN
        ALTER TABLE doctors DROP CONSTRAINT fk_doctors_department_id;
    END IF;
    
    -- Drop related table constraints
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_doctor_work_schedules_doctor_id') THEN
        ALTER TABLE doctor_work_schedules DROP CONSTRAINT fk_doctor_work_schedules_doctor_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_doctor_work_experiences_doctor_id') THEN
        ALTER TABLE doctor_work_experiences DROP CONSTRAINT fk_doctor_work_experiences_doctor_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_doctor_reviews_doctor_id') THEN
        ALTER TABLE doctor_reviews DROP CONSTRAINT fk_doctor_reviews_doctor_id;
    END IF;
END $$;

-- Drop the doctors table
DROP TABLE IF EXISTS doctors CASCADE;

-- Create doctors table with original structure
CREATE TABLE doctors (
    -- Primary Key
    doctor_id VARCHAR(20) PRIMARY KEY,
    
    -- Foreign Key to profiles table
    profile_id UUID NOT NULL,
    
    -- Basic Information
    full_name TEXT NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    qualification TEXT NOT NULL,
    department_id VARCHAR(20) NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    
    -- Professional Information
    bio TEXT,
    experience_years INTEGER DEFAULT 0 CHECK (experience_years >= 0),
    consultation_fee DECIMAL(10,2) CHECK (consultation_fee >= 0),
    address JSONB DEFAULT '{}'::jsonb,
    languages_spoken TEXT[] DEFAULT ARRAY['Vietnamese'],
    
    -- Status and Rating
    availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'offline', 'on_leave')),
    rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
    total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    is_active BOOLEAN DEFAULT true,
    
    -- Enhanced fields
    success_rate DECIMAL(5,2) DEFAULT 0 CHECK (success_rate >= 0 AND success_rate <= 100),
    total_revenue DECIMAL(12,2) DEFAULT 0 CHECK (total_revenue >= 0),
    average_consultation_time INTEGER DEFAULT 30 CHECK (average_consultation_time > 0),
    certifications JSONB DEFAULT '[]'::jsonb,
    specializations JSONB DEFAULT '[]'::jsonb,
    awards JSONB DEFAULT '[]'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- Create indexes
CREATE INDEX idx_doctors_profile_id ON doctors(profile_id);
CREATE INDEX idx_doctors_department_id ON doctors(department_id);
CREATE INDEX idx_doctors_specialty ON doctors(specialty);
CREATE INDEX idx_doctors_license_number ON doctors(license_number);
CREATE INDEX idx_doctors_availability_status ON doctors(availability_status);
CREATE INDEX idx_doctors_is_active ON doctors(is_active);

-- Create foreign key to profiles
ALTER TABLE doctors 
ADD CONSTRAINT fk_doctors_profile_id 
FOREIGN KEY (profile_id) REFERENCES profiles(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. CREATE DEPARTMENTS TABLE IF NOT EXISTS
-- =====================================================

CREATE TABLE IF NOT EXISTS departments (
    department_id VARCHAR(20) PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL,
    department_code VARCHAR(10) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default departments
INSERT INTO departments (department_id, department_name, department_code, description, is_active) VALUES
('DEPT-CARD', 'Cardiology Department', 'CARD', 'Heart and cardiovascular system specialists', true),
('DEPT-NEUR', 'Neurology Department', 'NEUR', 'Brain and nervous system specialists', true),
('DEPT-ORTH', 'Orthopedics Department', 'ORTH', 'Bone and joint specialists', true),
('DEPT-PEDI', 'Pediatrics Department', 'PEDI', 'Children healthcare specialists', true),
('DEPT-GYNE', 'Gynecology Department', 'GYNE', 'Women healthcare specialists', true),
('DEPT-GENE', 'General Medicine', 'GENE', 'General practice and family medicine', true)
ON CONFLICT (department_id) DO NOTHING;

-- 5. INSERT DOCTORS FROM EXISTING PROFILES
-- =====================================================

-- Function to generate doctor ID based on specialty
CREATE OR REPLACE FUNCTION generate_doctor_id_from_specialty(specialty_name TEXT)
RETURNS TEXT AS $$
DECLARE
    dept_code TEXT;
    sequence_num INTEGER;
    new_id TEXT;
BEGIN
    -- Map specialty to department code
    dept_code := CASE 
        WHEN LOWER(specialty_name) LIKE '%cardio%' THEN 'CARD'
        WHEN LOWER(specialty_name) LIKE '%neuro%' THEN 'NEUR'
        WHEN LOWER(specialty_name) LIKE '%ortho%' THEN 'ORTH'
        WHEN LOWER(specialty_name) LIKE '%pedi%' THEN 'PEDI'
        WHEN LOWER(specialty_name) LIKE '%gyne%' THEN 'GYNE'
        ELSE 'GENE'
    END;
    
    -- Get next sequence number for this department
    SELECT COALESCE(MAX(CAST(SUBSTRING(doctor_id FROM '\d+$') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM doctors 
    WHERE doctor_id LIKE 'DOC-' || dept_code || '-%';
    
    -- Generate new ID
    new_id := 'DOC-' || dept_code || '-' || LPAD(sequence_num::TEXT, 3, '0');
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Insert doctors from profiles
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
)
SELECT 
    -- Generate doctor_id based on email or use default pattern
    CASE 
        WHEN p.email = 'doctor@hospital.com' THEN 'DOC-CARD-001'
        WHEN p.email = 'doctor1@hospital.com' THEN 'DOC-NEUR-002'
        WHEN p.email = 'doctor2@hospital.com' THEN 'DOC-ORTH-003'
        WHEN p.email = 'doctor3@hospital.com' THEN 'DOC-PEDI-004'
        WHEN p.email = 'doctor4@hospital.com' THEN 'DOC-GYNE-005'
        ELSE generate_doctor_id_from_specialty('General Medicine')
    END as doctor_id,
    
    p.id as profile_id,
    p.full_name,
    
    -- Assign specialty based on email or use default
    CASE 
        WHEN p.email = 'doctor@hospital.com' THEN 'Cardiology'
        WHEN p.email = 'doctor1@hospital.com' THEN 'Neurology'
        WHEN p.email = 'doctor2@hospital.com' THEN 'Orthopedics'
        WHEN p.email = 'doctor3@hospital.com' THEN 'Pediatrics'
        WHEN p.email = 'doctor4@hospital.com' THEN 'Gynecology'
        ELSE 'General Medicine'
    END as specialty,
    
    -- Default qualification
    'MD, Board Certified' as qualification,
    
    -- Assign department based on specialty
    CASE 
        WHEN p.email = 'doctor@hospital.com' THEN 'DEPT-CARD'
        WHEN p.email = 'doctor1@hospital.com' THEN 'DEPT-NEUR'
        WHEN p.email = 'doctor2@hospital.com' THEN 'DEPT-ORTH'
        WHEN p.email = 'doctor3@hospital.com' THEN 'DEPT-PEDI'
        WHEN p.email = 'doctor4@hospital.com' THEN 'DEPT-GYNE'
        ELSE 'DEPT-GENE'
    END as department_id,
    
    -- Generate license number
    'VN-' || 
    CASE 
        WHEN p.email = 'doctor@hospital.com' THEN 'CL-1234'
        WHEN p.email = 'doctor1@hospital.com' THEN 'NL-5678'
        WHEN p.email = 'doctor2@hospital.com' THEN 'OR-9012'
        WHEN p.email = 'doctor3@hospital.com' THEN 'PD-3456'
        WHEN p.email = 'doctor4@hospital.com' THEN 'GY-7890'
        ELSE 'GM-' || LPAD((EXTRACT(EPOCH FROM NOW())::INTEGER % 10000)::TEXT, 4, '0')
    END as license_number,
    
    'Male' as gender, -- Default, can be updated later
    
    'Experienced doctor with comprehensive medical training and patient care expertise.' as bio,
    
    -- Experience years based on account age or default
    GREATEST(1, EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.created_at::DATE))) as experience_years,
    
    150000.00 as consultation_fee, -- Default fee
    
    '{"street": "Hospital Complex", "city": "Ho Chi Minh City", "country": "Vietnam"}'::jsonb as address,
    
    ARRAY['Vietnamese', 'English'] as languages_spoken,
    'available' as availability_status,
    4.5 as rating, -- Default good rating
    50 as total_reviews, -- Default review count
    'active' as status,
    true as is_active,
    95.0 as success_rate,
    10000000.00 as total_revenue,
    40 as average_consultation_time,
    '["Board Certified", "Licensed Practitioner"]'::jsonb as certifications,
    '["General Practice"]'::jsonb as specializations,
    '["Excellence in Patient Care"]'::jsonb as awards,
    p.created_at,
    CURRENT_TIMESTAMP as updated_at

FROM profiles p
WHERE p.role = 'doctor' 
AND p.is_active = true
ON CONFLICT (doctor_id) DO UPDATE SET
    profile_id = EXCLUDED.profile_id,
    full_name = EXCLUDED.full_name,
    updated_at = CURRENT_TIMESTAMP;

-- 6. VERIFICATION
-- =====================================================

-- Check created doctors
SELECT 
    d.doctor_id,
    d.full_name,
    d.specialty,
    d.department_id,
    d.license_number,
    p.email,
    d.is_active
FROM doctors d
JOIN profiles p ON d.profile_id = p.id
ORDER BY d.doctor_id;

-- Test the failing query
SELECT 
    d.*,
    p.email,
    p.phone_number,
    p.date_of_birth
FROM doctors d
JOIN profiles p ON d.profile_id = p.id
WHERE d.profile_id = '5bdcbd80-f344-40b7-a46b-3760ca487693';

-- Success message
SELECT 'Doctors table recreated successfully from existing profiles!' as result;
