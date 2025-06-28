-- =====================================================
-- SIMPLE CHECK OF EXISTING PROFILES
-- =====================================================
-- Basic script to check profiles without complex loops

-- 1. CHECK ALL PROFILES
-- =====================================================

SELECT '=== ALL PROFILES ===' as section;

SELECT 
    id,
    email,
    full_name,
    phone_number,
    role,
    is_active,
    email_verified,
    created_at
FROM profiles 
ORDER BY role, email;

-- 2. DOCTOR PROFILES ONLY
-- =====================================================

SELECT '=== DOCTOR PROFILES ONLY ===' as section;

SELECT 
    id,
    email,
    full_name,
    phone_number,
    is_active,
    email_verified,
    login_count,
    created_at
FROM profiles 
WHERE role = 'doctor'
ORDER BY email;

-- 3. CHECK FOR SPECIFIC TEST ACCOUNTS
-- =====================================================

SELECT '=== KNOWN TEST DOCTOR ACCOUNTS ===' as section;

SELECT 
    id,
    email,
    full_name,
    phone_number,
    is_active,
    'Known test account' as note
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

-- 4. CHECK THE FAILING PROFILE ID
-- =====================================================

SELECT '=== FAILING PROFILE ID CHECK ===' as section;

SELECT 
    id,
    email,
    full_name,
    phone_number,
    role,
    is_active,
    'This is the profile_id that was failing in the API' as note
FROM profiles 
WHERE id = '5bdcbd80-f344-40b7-a46b-3760ca487693';

-- 5. PROFILE STATISTICS
-- =====================================================

SELECT '=== PROFILE STATISTICS ===' as section;

-- Count by role
SELECT 
    'By Role' as stat_type,
    role,
    COUNT(*) as total_count,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_count,
    COUNT(CASE WHEN email_verified = true THEN 1 END) as verified_count
FROM profiles 
GROUP BY role
ORDER BY role;

-- Count doctor profiles by email domain
SELECT 
    'Doctor Email Domains' as stat_type,
    CASE 
        WHEN email LIKE '%@hospital.com' THEN 'hospital.com'
        WHEN email LIKE '%@gmail.com' THEN 'gmail.com'
        WHEN email LIKE '%@yahoo.com' THEN 'yahoo.com'
        ELSE 'other'
    END as email_domain,
    COUNT(*) as count,
    '' as active_count,
    '' as verified_count
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

-- 6. CHECK DOCTORS TABLE STATUS
-- =====================================================

SELECT '=== DOCTORS TABLE STATUS ===' as section;

-- Check if doctors table exists
SELECT 
    'Doctors Table' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctors' AND table_schema = 'public') 
        THEN 'EXISTS'
        ELSE 'NOT EXISTS'
    END as status,
    '' as details,
    '' as note,
    '' as extra
FROM information_schema.tables 
WHERE table_name = 'doctors' AND table_schema = 'public'
UNION ALL
SELECT 
    'Doctors Table' as check_type,
    'NOT EXISTS' as status,
    '' as details,
    '' as note,
    '' as extra
WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctors' AND table_schema = 'public');

-- 7. CHECK DOCTORS TABLE STRUCTURE (if exists)
-- =====================================================

-- Show doctors table columns if it exists
SELECT 
    'Doctors Columns' as check_type,
    column_name as status,
    data_type as details,
    CASE WHEN is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END as note,
    COALESCE(column_default, '') as extra
FROM information_schema.columns 
WHERE table_name = 'doctors' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 8. CHECK DOCTORS TABLE DATA (if exists)
-- =====================================================

-- Count doctors records if table exists
SELECT 
    'Doctors Count' as check_type,
    CAST(COUNT(*) AS TEXT) as status,
    'Total records in doctors table' as details,
    '' as note,
    '' as extra
FROM doctors
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctors' AND table_schema = 'public');

-- Show sample doctors if any exist
SELECT 
    'Sample Doctors' as check_type,
    doctor_id as status,
    full_name as details,
    specialty as note,
    CAST(is_active AS TEXT) as extra
FROM doctors
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctors' AND table_schema = 'public')
ORDER BY doctor_id
LIMIT 10;

-- 9. CHECK FOREIGN KEY RELATIONSHIPS
-- =====================================================

SELECT '=== FOREIGN KEY RELATIONSHIPS ===' as section;

SELECT
    tc.table_name,
    tc.constraint_name,
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

-- 10. SUMMARY AND RECOMMENDATIONS
-- =====================================================

SELECT '=== SUMMARY ===' as section;

-- Simple summary without complex loops
SELECT 
    'Summary' as item,
    'Doctor Profiles Found: ' || COUNT(CASE WHEN role = 'doctor' THEN 1 END) as value
FROM profiles
UNION ALL
SELECT 
    'Summary' as item,
    'Active Doctor Profiles: ' || COUNT(CASE WHEN role = 'doctor' AND is_active = true THEN 1 END) as value
FROM profiles
UNION ALL
SELECT 
    'Summary' as item,
    'Doctors Table Exists: ' || 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctors' AND table_schema = 'public') 
        THEN 'YES'
        ELSE 'NO'
    END as value
FROM profiles
LIMIT 1
UNION ALL
SELECT 
    'Summary' as item,
    'Failing Profile ID Exists: ' || 
    CASE 
        WHEN EXISTS (SELECT 1 FROM profiles WHERE id = '5bdcbd80-f344-40b7-a46b-3760ca487693') 
        THEN 'YES'
        ELSE 'NO'
    END as value
FROM profiles
LIMIT 1;

-- Final message
SELECT 'Profile check completed successfully!' as result;
