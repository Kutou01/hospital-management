-- =====================================================
-- CHECK ROLE RECORDS SCRIPT
-- Hospital Management System - Verify Role-Specific Records
-- =====================================================

-- 1. CHECK USERS AND THEIR PROFILES
SELECT 
    'USER PROFILE MAPPING' as info,
    u.id as user_id,
    u.email,
    u.created_at as user_created,
    u.raw_user_meta_data->>'role' as metadata_role,
    p.id as profile_id,
    p.full_name,
    p.role as profile_role,
    p.created_at as profile_created,
    CASE 
        WHEN p.id IS NULL THEN '❌ NO PROFILE'
        ELSE '✅ HAS PROFILE'
    END as profile_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 10;

-- 2. CHECK DOCTORS AND THEIR PROFILES
SELECT 
    'DOCTOR RECORDS' as info,
    p.id as profile_id,
    p.email,
    p.full_name,
    p.role,
    d.doctor_id,
    d.specialty,
    d.license_number,
    d.department_id,
    d.status as doctor_status,
    CASE 
        WHEN d.doctor_id IS NULL THEN '❌ NO DOCTOR RECORD'
        ELSE '✅ HAS DOCTOR RECORD'
    END as doctor_record_status
FROM public.profiles p
LEFT JOIN public.doctors d ON p.id = d.profile_id
WHERE p.role = 'doctor'
ORDER BY p.created_at DESC;

-- 3. CHECK PATIENTS AND THEIR PROFILES
SELECT 
    'PATIENT RECORDS' as info,
    p.id as profile_id,
    p.email,
    p.full_name,
    p.role,
    pt.patient_id,
    pt.date_of_birth,
    pt.gender,
    pt.registration_date,
    pt.status as patient_status,
    CASE 
        WHEN pt.patient_id IS NULL THEN '❌ NO PATIENT RECORD'
        ELSE '✅ HAS PATIENT RECORD'
    END as patient_record_status
FROM public.profiles p
LEFT JOIN public.patients pt ON p.id = pt.profile_id
WHERE p.role = 'patient'
ORDER BY p.created_at DESC;

-- 4. CHECK ADMINS AND THEIR PROFILES (if admins table exists)
SELECT 
    'ADMIN RECORDS' as info,
    p.id as profile_id,
    p.email,
    p.full_name,
    p.role,
    a.admin_id,
    a.role_level,
    a.status as admin_status,
    CASE 
        WHEN a.admin_id IS NULL THEN '❌ NO ADMIN RECORD'
        ELSE '✅ HAS ADMIN RECORD'
    END as admin_record_status
FROM public.profiles p
LEFT JOIN public.admins a ON p.id = a.profile_id
WHERE p.role = 'admin'
ORDER BY p.created_at DESC;

-- 5. SUMMARY STATISTICS
SELECT 
    'SUMMARY STATISTICS' as info,
    json_build_object(
        'total_users', (SELECT COUNT(*) FROM auth.users),
        'total_profiles', (SELECT COUNT(*) FROM public.profiles),
        'total_doctors', (SELECT COUNT(*) FROM public.doctors),
        'total_patients', (SELECT COUNT(*) FROM public.patients),
        'orphaned_users', (
            SELECT COUNT(*) FROM auth.users u
            LEFT JOIN public.profiles p ON u.id = p.id
            WHERE p.id IS NULL
        ),
        'doctor_profiles_without_records', (
            SELECT COUNT(*) FROM public.profiles p
            LEFT JOIN public.doctors d ON p.id = d.profile_id
            WHERE p.role = 'doctor' AND d.doctor_id IS NULL
        ),
        'patient_profiles_without_records', (
            SELECT COUNT(*) FROM public.profiles p
            LEFT JOIN public.patients pt ON p.id = pt.profile_id
            WHERE p.role = 'patient' AND pt.patient_id IS NULL
        )
    ) as statistics;

-- 6. CHECK RECENT REGISTRATIONS (Last 24 hours)
SELECT 
    'RECENT REGISTRATIONS' as info,
    u.email,
    u.created_at as registered_at,
    u.raw_user_meta_data->>'role' as intended_role,
    p.role as profile_role,
    CASE 
        WHEN p.role = 'doctor' AND EXISTS(SELECT 1 FROM public.doctors WHERE profile_id = p.id) 
        THEN '✅ Doctor record created'
        WHEN p.role = 'patient' AND EXISTS(SELECT 1 FROM public.patients WHERE profile_id = p.id) 
        THEN '✅ Patient record created'
        WHEN p.role = 'admin' AND EXISTS(SELECT 1 FROM public.admins WHERE profile_id = p.id) 
        THEN '✅ Admin record created'
        WHEN p.role = 'doctor' THEN '❌ Missing doctor record'
        WHEN p.role = 'patient' THEN '❌ Missing patient record'
        WHEN p.role = 'admin' THEN '❌ Missing admin record'
        ELSE '⚠️ Unknown role'
    END as role_record_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.created_at > NOW() - INTERVAL '24 hours'
ORDER BY u.created_at DESC;

-- 7. CHECK SEQUENCE STATUS
SELECT 
    'SEQUENCE STATUS' as info,
    sequence_name,
    last_value,
    increment_by,
    is_called
FROM information_schema.sequences 
WHERE sequence_name LIKE '%doctor%' OR sequence_name LIKE '%patient%';

-- 8. CHECK TABLE STRUCTURES
SELECT 
    'DOCTORS TABLE STRUCTURE' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'doctors' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
    'PATIENTS TABLE STRUCTURE' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'patients' AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- MANUAL FIXES FOR MISSING RECORDS
-- =====================================================

-- Fix missing doctor records for existing doctor profiles:
/*
INSERT INTO public.doctors (
    doctor_id,
    profile_id,
    full_name,
    specialty,
    license_number,
    qualification,
    department_id,
    gender,
    phone_number,
    email,
    status,
    schedule,
    created_at,
    updated_at
)
SELECT 
    'DOC' || LPAD(NEXTVAL('doctor_id_seq')::TEXT, 6, '0'),
    p.id,
    p.full_name,
    'General Medicine',
    'PENDING',
    'MD',
    'DEPT001',
    'other',
    p.phone_number,
    p.email,
    'active',
    '{}',
    NOW(),
    NOW()
FROM public.profiles p
LEFT JOIN public.doctors d ON p.id = d.profile_id
WHERE p.role = 'doctor' AND d.doctor_id IS NULL;
*/

-- Fix missing patient records for existing patient profiles:
/*
INSERT INTO public.patients (
    patient_id,
    profile_id,
    full_name,
    date_of_birth,
    gender,
    phone_number,
    email,
    address,
    registration_date,
    status,
    created_at,
    updated_at
)
SELECT 
    'PAT' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT || ROW_NUMBER() OVER(),
    p.id,
    p.full_name,
    CURRENT_DATE - INTERVAL '30 years',
    'other',
    p.phone_number,
    p.email,
    '{}',
    CURRENT_DATE,
    'active',
    NOW(),
    NOW()
FROM public.profiles p
LEFT JOIN public.patients pt ON p.id = pt.profile_id
WHERE p.role = 'patient' AND pt.patient_id IS NULL;
*/

-- =====================================================
-- TEST NEW TRIGGER
-- =====================================================

-- Test the enhanced RPC function:
/*
SELECT public.create_user_profile(
    gen_random_uuid(),
    'test-enhanced@example.com',
    'Test Enhanced User',
    '0123456789',
    'doctor',
    'male',
    'Cardiology',
    'VN-BS-123456',
    'MD, PhD',
    'DEPT001',
    '1990-01-01',
    '123 Test Street'
);
*/
