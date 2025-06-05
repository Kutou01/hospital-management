-- =====================================================
-- SIMPLE TRIGGER CHECK FOR SUPABASE
-- Hospital Management System - Quick Diagnosis
-- =====================================================

-- 1. CHECK IF TRIGGER EXISTS
SELECT 
    'TRIGGER EXISTS' as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = 'on_auth_user_created'
        ) THEN '✅ YES'
        ELSE '❌ NO'
    END as result;

-- 2. CHECK IF FUNCTION EXISTS
SELECT 
    'FUNCTION EXISTS' as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'handle_new_user'
        ) THEN '✅ YES'
        ELSE '❌ NO'
    END as result;

-- 3. CHECK IF RPC FUNCTION EXISTS
SELECT 
    'RPC FUNCTION EXISTS' as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'create_user_profile'
        ) THEN '✅ YES'
        ELSE '❌ NO'
    END as result;

-- 4. CHECK IF PROFILES TABLE EXISTS
SELECT 
    'PROFILES TABLE EXISTS' as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'profiles' AND table_schema = 'public'
        ) THEN '✅ YES'
        ELSE '❌ NO'
    END as result;

-- 5. CHECK PROFILES TABLE STRUCTURE
SELECT 
    'PROFILES TABLE COLUMNS' as info,
    string_agg(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public';

-- 6. CHECK RLS POLICIES COUNT
SELECT 
    'RLS POLICIES COUNT' as info,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'profiles';

-- 7. CHECK RECENT AUTH USERS (Last 5)
SELECT 
    'RECENT AUTH USERS' as info,
    id,
    email,
    created_at,
    CASE 
        WHEN raw_user_meta_data IS NOT NULL THEN 'Has metadata'
        ELSE 'No metadata'
    END as metadata_status
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 8. CHECK RECENT PROFILES (Last 5)
SELECT 
    'RECENT PROFILES' as info,
    id,
    email,
    full_name,
    role,
    created_at
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- 9. CHECK FOR ORPHANED USERS (Users without profiles)
SELECT 
    'ORPHANED USERS' as info,
    COUNT(*) as count
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 10. SIMPLE STATUS SUMMARY
SELECT 
    'OVERALL STATUS' as summary,
    json_build_object(
        'trigger_exists', EXISTS(
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = 'on_auth_user_created'
        ),
        'function_exists', EXISTS(
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'handle_new_user'
        ),
        'rpc_exists', EXISTS(
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'create_user_profile'
        ),
        'profiles_table_exists', EXISTS(
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'profiles' AND table_schema = 'public'
        ),
        'total_users', (SELECT COUNT(*) FROM auth.users),
        'total_profiles', (SELECT COUNT(*) FROM public.profiles),
        'orphaned_users', (
            SELECT COUNT(*) FROM auth.users u
            LEFT JOIN public.profiles p ON u.id = p.id
            WHERE p.id IS NULL
        )
    ) as status_json;

-- =====================================================
-- QUICK TESTS
-- =====================================================

-- Test if you can call the test function (if it exists)
-- SELECT public.test_trigger_status();

-- Test if you can insert into profiles manually
-- INSERT INTO public.profiles (
--     id, email, full_name, role, is_active
-- ) VALUES (
--     gen_random_uuid(), 
--     'manual-test-' || extract(epoch from now()) || '@example.com', 
--     'Manual Test User', 
--     'patient', 
--     true
-- );

-- =====================================================
-- NEXT STEPS BASED ON RESULTS
-- =====================================================

/*
IF TRIGGER EXISTS = NO:
- Run: backend/scripts/complete-trigger-solution.sql

IF FUNCTION EXISTS = NO:
- Run: backend/scripts/complete-trigger-solution.sql

IF ORPHANED USERS > 0:
- Some users don't have profiles
- Trigger is not working properly
- Use RPC function to create missing profiles

IF ALL EXISTS BUT STILL NOT WORKING:
- Check Supabase logs in Dashboard
- Look for runtime errors in function
- Check RLS policies blocking trigger
*/
