-- =====================================================
-- FIX TABLE COLUMNS
-- Hospital Management System - Add full_name to all tables and fix date_of_birth
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

-- Step 3: Add full_name column to admins table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'admins' AND column_name = 'full_name' AND table_schema = 'public') THEN
        ALTER TABLE public.admins ADD COLUMN full_name VARCHAR(255);
        RAISE NOTICE 'Added full_name column to admins table';
    ELSE
        RAISE NOTICE 'full_name column already exists in admins table';
    END IF;
END $$;

-- Step 4: Add date_of_birth column to patients table if not exists (alternative to dateofbirth)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'patients' AND column_name = 'date_of_birth' AND table_schema = 'public') THEN
        ALTER TABLE public.patients ADD COLUMN date_of_birth DATE;
        RAISE NOTICE 'Added date_of_birth column to patients table';
    ELSE
        RAISE NOTICE 'date_of_birth column already exists in patients table';
    END IF;
END $$;

-- Step 5: Update existing records to populate full_name from profiles (if any exist)
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

-- For admins
UPDATE public.admins 
SET full_name = p.full_name
FROM public.profiles p
WHERE admins.profile_id = p.id 
AND admins.full_name IS NULL;

-- Step 6: Copy dateofbirth to date_of_birth if dateofbirth exists and date_of_birth is null
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'patients' AND column_name = 'dateofbirth' AND table_schema = 'public') THEN
        UPDATE public.patients 
        SET date_of_birth = dateofbirth 
        WHERE date_of_birth IS NULL AND dateofbirth IS NOT NULL;
        RAISE NOTICE 'Copied dateofbirth to date_of_birth column';
    END IF;
END $$;

-- Step 7: Verify the changes
SELECT 
    'DOCTORS TABLE COLUMNS' as table_info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'doctors' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
    'PATIENTS TABLE COLUMNS' as table_info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'patients' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
    'ADMINS TABLE COLUMNS' as table_info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'admins' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 8: Test insert to verify all columns work
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

-- Test patients table with both date columns
INSERT INTO public.patients (
    patient_id,
    profile_id,
    full_name,
    date_of_birth,
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
    '1990-01-01',
    'other',
    '0987654321',
    '{}',
    CURRENT_DATE,
    'active',
    NOW(),
    NOW()
) ON CONFLICT (patient_id) DO NOTHING;

-- Test admins table
INSERT INTO public.admins (
    admin_id,
    profile_id,
    full_name,
    phone_number,
    role_level,
    permissions,
    status,
    created_at,
    updated_at
) VALUES (
    'ADM999999',
    '77777777-7777-7777-7777-777777777777',
    'Test Admin Full Name',
    '0555666777',
    'standard',
    '{}',
    'active',
    NOW(),
    NOW()
) ON CONFLICT (admin_id) DO NOTHING;

-- Step 9: Verify test records were created
SELECT 'TEST DOCTOR RECORD' as info, doctor_id, full_name, specialization 
FROM public.doctors 
WHERE doctor_id = 'DOC999999';

SELECT 'TEST PATIENT RECORD' as info, patient_id, full_name, date_of_birth, dateofbirth 
FROM public.patients 
WHERE patient_id = 'PAT999999';

SELECT 'TEST ADMIN RECORD' as info, admin_id, full_name, role_level 
FROM public.admins 
WHERE admin_id = 'ADM999999';

-- Step 10: Clean up test records
DELETE FROM public.doctors WHERE doctor_id = 'DOC999999';
DELETE FROM public.patients WHERE patient_id = 'PAT999999';
DELETE FROM public.admins WHERE admin_id = 'ADM999999';

-- Step 11: Show final status
SELECT 'COLUMN FIXES COMPLETED' as status, NOW() as timestamp;

-- Step 12: Show summary of available date columns in patients table
SELECT 
    'PATIENTS DATE COLUMNS' as info,
    STRING_AGG(column_name, ', ') as date_columns
FROM information_schema.columns 
WHERE table_name = 'patients' 
AND table_schema = 'public' 
AND (column_name LIKE '%date%' OR column_name LIKE '%birth%');

-- Step 13: Show final table structures summary
SELECT 
    'FINAL TABLES SUMMARY' as info,
    json_build_object(
        'doctors_has_full_name', EXISTS(
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'doctors' AND column_name = 'full_name' AND table_schema = 'public'
        ),
        'patients_has_full_name', EXISTS(
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'patients' AND column_name = 'full_name' AND table_schema = 'public'
        ),
        'patients_has_date_of_birth', EXISTS(
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'patients' AND column_name = 'date_of_birth' AND table_schema = 'public'
        ),
        'patients_has_dateofbirth', EXISTS(
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'patients' AND column_name = 'dateofbirth' AND table_schema = 'public'
        ),
        'admins_has_full_name', EXISTS(
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'admins' AND column_name = 'full_name' AND table_schema = 'public'
        )
    ) as column_status;
