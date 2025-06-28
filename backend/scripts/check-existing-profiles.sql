-- =====================================================
-- CHECK EXISTING PROFILES DATA
-- =====================================================
-- Simple script to check what doctor profiles already exist

-- 1. CHECK ALL PROFILES
-- =====================================================

SELECT 'Checking all profiles in database...' as status;

-- Show all profiles
SELECT 
    id,
    email,
    full_name,
    phone_number,
    date_of_birth,
    role,
    is_active,
    email_verified,
    created_at,
    updated_at
FROM profiles 
ORDER BY role, created_at;

-- 2. FOCUS ON DOCTOR PROFILES
-- =====================================================

SELECT 'Checking doctor profiles specifically...' as status;

-- Show only doctor profiles
SELECT 
    id,
    email,
    full_name,
    phone_number,
    date_of_birth,
    is_active,
    email_verified,
    login_count,
    created_at
FROM profiles 
WHERE role = 'doctor'
ORDER BY created_at;

-- 3. CHECK FOR SPECIFIC TEST ACCOUNTS
-- =====================================================

SELECT 'Checking for known test doctor accounts...' as status;

-- Check for specific doctor emails we know about
SELECT 
    id,
    email,
    full_name,
    phone_number,
    role,
    is_active,
    'Found known test account' as note
FROM profiles 
WHERE email IN (
    'doctor@hospital.com',
    'doctor1@hospital.com', 
    'doctor2@hospital.com',
    'doctor3@hospital.com',
    'doctor4@hospital.com',
    'doctor5@hospital.com'
)
ORDER BY email;

-- Check for the specific profile_id that was failing
SELECT 
    id,
    email,
    full_name,
    phone_number,
    role,
    is_active,
    'This is the failing profile_id' as note
FROM profiles 
WHERE id = '5bdcbd80-f344-40b7-a46b-3760ca487693';

-- 4. STATISTICS
-- =====================================================

SELECT 'Profile statistics...' as status;

-- Count profiles by role
SELECT 
    role,
    COUNT(*) as total_count,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_count,
    COUNT(CASE WHEN email_verified = true THEN 1 END) as verified_count
FROM profiles 
GROUP BY role
ORDER BY role;

-- Count doctor profiles by email domain
SELECT 
    CASE 
        WHEN email LIKE '%@hospital.com' THEN 'hospital.com'
        WHEN email LIKE '%@gmail.com' THEN 'gmail.com'
        WHEN email LIKE '%@yahoo.com' THEN 'yahoo.com'
        ELSE 'other'
    END as email_domain,
    COUNT(*) as count
FROM profiles 
WHERE role = 'doctor'
GROUP BY 
    CASE 
        WHEN email LIKE '%@hospital.com' THEN 'hospital.com'
        WHEN email LIKE '%@gmail.com' THEN 'gmail.com'
        WHEN email LIKE '%@yahoo.com' THEN 'yahoo.com'
        ELSE 'other'
    END
ORDER BY count DESC;

-- 5. CHECK CURRENT DOCTORS TABLE STATUS
-- =====================================================

SELECT 'Checking current doctors table...' as status;

-- Check if doctors table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctors' AND table_schema = 'public') 
        THEN 'EXISTS'
        ELSE 'NOT EXISTS'
    END as doctors_table_status;

-- If doctors table exists, show its structure
DO $$
DECLARE
    rec RECORD;
    doctors_count INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctors' AND table_schema = 'public') THEN
        RAISE NOTICE 'Doctors table exists. Checking structure...';

        -- Show column structure
        FOR rec IN (
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'doctors' AND table_schema = 'public'
            ORDER BY ordinal_position
        ) LOOP
            RAISE NOTICE 'Column: % (% - %)', rec.column_name, rec.data_type,
                CASE WHEN rec.is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END;
        END LOOP;

        -- Show record count
        EXECUTE 'SELECT COUNT(*) FROM doctors' INTO doctors_count;
        RAISE NOTICE 'Total doctors records: %', doctors_count;

        -- Show sample data
        FOR rec IN (SELECT doctor_id, full_name, specialty FROM doctors LIMIT 5) LOOP
            RAISE NOTICE 'Sample doctor: % - % (%)', rec.doctor_id, rec.full_name, rec.specialty;
        END LOOP;

    ELSE
        RAISE NOTICE 'Doctors table does not exist';
    END IF;
END $$;

-- 6. CHECK FOREIGN KEY RELATIONSHIPS
-- =====================================================

SELECT 'Checking foreign key relationships...' as status;

-- Check if there are any foreign key constraints involving profiles
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND (ccu.table_name = 'profiles' OR tc.table_name = 'profiles' OR tc.table_name = 'doctors')
ORDER BY tc.table_name, tc.constraint_name;

-- 7. RECOMMENDATIONS
-- =====================================================

SELECT 'Analysis and recommendations...' as status;

DO $$
DECLARE
    doctor_profiles_count INTEGER;
    doctors_table_exists BOOLEAN;
    doctors_count INTEGER := 0;
BEGIN
    -- Count doctor profiles
    SELECT COUNT(*) INTO doctor_profiles_count FROM profiles WHERE role = 'doctor';
    
    -- Check if doctors table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'doctors' AND table_schema = 'public'
    ) INTO doctors_table_exists;
    
    -- Count doctors if table exists
    IF doctors_table_exists THEN
        EXECUTE 'SELECT COUNT(*) FROM doctors' INTO doctors_count;
    END IF;
    
    RAISE NOTICE '=== ANALYSIS RESULTS ===';
    RAISE NOTICE 'Doctor profiles found: %', doctor_profiles_count;
    RAISE NOTICE 'Doctors table exists: %', doctors_table_exists;
    RAISE NOTICE 'Doctors records: %', doctors_count;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== RECOMMENDATIONS ===';
    
    IF doctor_profiles_count > 0 AND NOT doctors_table_exists THEN
        RAISE NOTICE '✅ GOOD: Found % doctor profiles, but no doctors table', doctor_profiles_count;
        RAISE NOTICE '📋 ACTION: Can create doctors table and populate from profiles';
    ELSIF doctor_profiles_count > 0 AND doctors_table_exists AND doctors_count = 0 THEN
        RAISE NOTICE '✅ GOOD: Found % doctor profiles and empty doctors table', doctor_profiles_count;
        RAISE NOTICE '📋 ACTION: Can populate doctors table from existing profiles';
    ELSIF doctor_profiles_count > 0 AND doctors_table_exists AND doctors_count > 0 THEN
        RAISE NOTICE '⚠️  MIXED: Found % doctor profiles and % doctors records', doctor_profiles_count, doctors_count;
        RAISE NOTICE '📋 ACTION: Need to check if data is consistent or needs sync';
    ELSIF doctor_profiles_count = 0 THEN
        RAISE NOTICE '❌ ISSUE: No doctor profiles found';
        RAISE NOTICE '📋 ACTION: Need to create doctor profiles first';
    END IF;
    
    -- Check for the specific failing profile
    IF EXISTS (SELECT 1 FROM profiles WHERE id = '5bdcbd80-f344-40b7-a46b-3760ca487693') THEN
        RAISE NOTICE '✅ GOOD: Found the failing profile_id in profiles table';
    ELSE
        RAISE NOTICE '❌ ISSUE: The failing profile_id is not in profiles table';
        RAISE NOTICE '📋 ACTION: Need to create this specific profile first';
    END IF;
END $$;

-- Success message
SELECT 'Profile check completed! See analysis above for next steps.' as result;
