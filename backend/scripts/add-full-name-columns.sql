-- =====================================================
-- ADD FULL_NAME COLUMNS
-- Hospital Management System - Add missing full_name columns
-- =====================================================

-- Step 1: Add full_name column to doctors table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'doctors' AND column_name = 'full_name' AND table_schema = 'public') THEN
        ALTER TABLE public.doctors ADD COLUMN full_name VARCHAR(255);
        RAISE NOTICE 'Added full_name column to doctors table';
    ELSE
        RAISE NOTICE 'full_name column already exists in doctors table';
    END IF;
END $$;

-- Step 2: Add full_name column to patients table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'patients' AND column_name = 'full_name' AND table_schema = 'public') THEN
        ALTER TABLE public.patients ADD COLUMN full_name VARCHAR(255);
        RAISE NOTICE 'Added full_name column to patients table';
    ELSE
        RAISE NOTICE 'full_name column already exists in patients table';
    END IF;
END $$;

-- Step 3: Update existing records to populate full_name from profiles (if any exist)
-- For doctors
UPDATE public.doctors 
SET full_name = p.full_name
FROM public.profiles p
WHERE doctors.profile_id = p.id 
AND doctors.full_name IS NULL;

-- For patients
UPDATE public.patients 
SET full_name = p.full_name
FROM public.profiles p
WHERE patients.profile_id = p.id 
AND patients.full_name IS NULL;

-- Step 4: Add NOT NULL constraint after populating data (optional)
-- Uncomment these if you want full_name to be required
-- ALTER TABLE public.doctors ALTER COLUMN full_name SET NOT NULL;
-- ALTER TABLE public.patients ALTER COLUMN full_name SET NOT NULL;

-- Step 5: Verify the changes
SELECT 
    'DOCTORS TABLE COLUMNS' as table_info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'doctors' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
    'PATIENTS TABLE COLUMNS' as table_info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'patients' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 6: Test insert to verify columns work
-- Test doctors table
INSERT INTO public.doctors (
    doctor_id,
    profile_id,
    full_name,
    specialization,
    license_number,
    qualification,
    department_id,
    gender,
    phone_number,
    status,
    schedule,
    created_at,
    updated_at
) VALUES (
    'DOC999999',
    '99999999-9999-9999-9999-999999999999',
    'Test Doctor Full Name',
    'General Medicine',
    'TEST123',
    'MD',
    'DEPT001',
    'other',
    '0123456789',
    'active',
    '{}',
    NOW(),
    NOW()
) ON CONFLICT (doctor_id) DO NOTHING;

-- Test patients table
INSERT INTO public.patients (
    patient_id,
    profile_id,
    full_name,
    dateofbirth,
    gender,
    phone_number,
    address,
    registration_date,
    status,
    created_at,
    updated_at
) VALUES (
    'PAT999999',
    '88888888-8888-8888-8888-888888888888',
    'Test Patient Full Name',
    '1990-01-01',
    'other',
    '0987654321',
    '{}',
    CURRENT_DATE,
    'active',
    NOW(),
    NOW()
) ON CONFLICT (patient_id) DO NOTHING;

-- Step 7: Verify test records were created
SELECT 'TEST DOCTOR RECORD' as info, doctor_id, full_name, specialization 
FROM public.doctors 
WHERE doctor_id = 'DOC999999';

SELECT 'TEST PATIENT RECORD' as info, patient_id, full_name, gender 
FROM public.patients 
WHERE patient_id = 'PAT999999';

-- Step 8: Clean up test records
DELETE FROM public.doctors WHERE doctor_id = 'DOC999999';
DELETE FROM public.patients WHERE patient_id = 'PAT999999';

-- Step 9: Show final status
SELECT 'COLUMN ADDITION COMPLETED' as status, NOW() as timestamp;

-- Step 10: Show updated table structures
SELECT 
    'FINAL DOCTORS STRUCTURE' as info,
    COUNT(*) as total_columns,
    STRING_AGG(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_name = 'doctors' AND table_schema = 'public';

SELECT 
    'FINAL PATIENTS STRUCTURE' as info,
    COUNT(*) as total_columns,
    STRING_AGG(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_name = 'patients' AND table_schema = 'public';
