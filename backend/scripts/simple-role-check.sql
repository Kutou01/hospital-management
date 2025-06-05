-- =====================================================
-- SIMPLE ROLE CHECK SCRIPT
-- Hospital Management System - Basic Role Record Check
-- =====================================================

-- 1. CHECK BASIC COUNTS
SELECT 
    'BASIC COUNTS' as info,
    json_build_object(
        'total_users', (SELECT COUNT(*) FROM auth.users),
        'total_profiles', (SELECT COUNT(*) FROM public.profiles),
        'doctors_table_exists', EXISTS(
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'doctors' AND table_schema = 'public'
        ),
        'patients_table_exists', EXISTS(
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'patients' AND table_schema = 'public'
        ),
        'admins_table_exists', EXISTS(
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'admins' AND table_schema = 'public'
        )
    ) as counts;

-- 2. CHECK USERS VS PROFILES
SELECT 
    'USER PROFILE MAPPING' as info,
    COUNT(u.id) as total_users,
    COUNT(p.id) as total_profiles,
    COUNT(u.id) - COUNT(p.id) as orphaned_users
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id;

-- 3. CHECK PROFILE ROLES DISTRIBUTION
SELECT 
    'PROFILE ROLES' as info,
    role,
    COUNT(*) as count
FROM public.profiles 
GROUP BY role
ORDER BY count DESC;

-- 4. CHECK RECENT USERS (Last 10)
SELECT 
    'RECENT USERS' as info,
    u.email,
    u.created_at as user_created,
    u.raw_user_meta_data->>'role' as intended_role,
    p.role as profile_role,
    p.created_at as profile_created,
    CASE 
        WHEN p.id IS NULL THEN '❌ NO PROFILE'
        WHEN u.raw_user_meta_data->>'role' = p.role THEN '✅ ROLE MATCH'
        ELSE '⚠️ ROLE MISMATCH'
    END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 10;

-- 5. CHECK IF DOCTORS TABLE EXISTS AND HAS DATA
DO $$
DECLARE
    doctors_count INTEGER := 0;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctors' AND table_schema = 'public') THEN
        EXECUTE 'SELECT COUNT(*) FROM public.doctors' INTO doctors_count;
        RAISE NOTICE 'DOCTORS TABLE: EXISTS with % records', doctors_count;
    ELSE
        RAISE NOTICE 'DOCTORS TABLE: DOES NOT EXIST';
    END IF;
END $$;

-- 6. CHECK IF PATIENTS TABLE EXISTS AND HAS DATA
DO $$
DECLARE
    patients_count INTEGER := 0;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patients' AND table_schema = 'public') THEN
        EXECUTE 'SELECT COUNT(*) FROM public.patients' INTO patients_count;
        RAISE NOTICE 'PATIENTS TABLE: EXISTS with % records', patients_count;
    ELSE
        RAISE NOTICE 'PATIENTS TABLE: DOES NOT EXIST';
    END IF;
END $$;

-- 7. CHECK DOCTOR PROFILES WITHOUT DOCTOR RECORDS (if doctors table exists)
DO $$
DECLARE
    missing_doctor_records INTEGER := 0;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctors' AND table_schema = 'public') THEN
        EXECUTE '
            SELECT COUNT(*) 
            FROM public.profiles p
            LEFT JOIN public.doctors d ON p.id = d.profile_id
            WHERE p.role = ''doctor'' AND d.profile_id IS NULL
        ' INTO missing_doctor_records;
        RAISE NOTICE 'DOCTOR PROFILES WITHOUT DOCTOR RECORDS: %', missing_doctor_records;
    END IF;
END $$;

-- 8. CHECK PATIENT PROFILES WITHOUT PATIENT RECORDS (if patients table exists)
DO $$
DECLARE
    missing_patient_records INTEGER := 0;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patients' AND table_schema = 'public') THEN
        EXECUTE '
            SELECT COUNT(*) 
            FROM public.profiles p
            LEFT JOIN public.patients pt ON p.id = pt.profile_id
            WHERE p.role = ''patient'' AND pt.profile_id IS NULL
        ' INTO missing_patient_records;
        RAISE NOTICE 'PATIENT PROFILES WITHOUT PATIENT RECORDS: %', missing_patient_records;
    END IF;
END $$;

-- 9. SHOW SAMPLE METADATA FROM RECENT USERS
SELECT 
    'SAMPLE METADATA' as info,
    email,
    raw_user_meta_data,
    created_at
FROM auth.users 
WHERE raw_user_meta_data IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- 10. CHECK TRIGGER STATUS
SELECT 
    'TRIGGER STATUS' as info,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = 'on_auth_user_created'
        ) THEN '✅ TRIGGER EXISTS'
        ELSE '❌ TRIGGER MISSING'
    END as trigger_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'handle_new_user'
        ) THEN '✅ FUNCTION EXISTS'
        ELSE '❌ FUNCTION MISSING'
    END as function_status;

-- =====================================================
-- NEXT STEPS BASED ON RESULTS
-- =====================================================

/*
INTERPRETATION:

1. If "orphaned_users" > 0:
   - Some users don't have profiles
   - Trigger is not working for profile creation

2. If "DOCTOR PROFILES WITHOUT DOCTOR RECORDS" > 0:
   - Doctor profiles exist but no corresponding doctor records
   - Need to create missing doctor records

3. If "PATIENT PROFILES WITHOUT PATIENT RECORDS" > 0:
   - Patient profiles exist but no corresponding patient records
   - Need to create missing patient records

4. If tables don't exist:
   - Need to create the role-specific tables first
   - Check database schema setup

5. If trigger/function missing:
   - Need to run the complete trigger solution script
*/
