-- =====================================================
-- TRIGGER DIAGNOSTIC SCRIPT
-- Hospital Management System - Supabase Trigger Debugging
-- =====================================================

-- This script helps diagnose why triggers are not working

-- 1. CHECK TRIGGER EXISTENCE
SELECT 
    'TRIGGER CHECK' as check_type,
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 2. CHECK FUNCTION EXISTENCE
SELECT 
    'FUNCTION CHECK' as check_type,
    routine_name,
    routine_type,
    security_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- 3. CHECK PROFILES TABLE STRUCTURE
SELECT 
    'TABLE STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. CHECK RLS POLICIES
SELECT 
    'RLS POLICIES' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 5. CHECK TABLE PERMISSIONS
SELECT 
    'TABLE PERMISSIONS' as check_type,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'profiles' 
AND table_schema = 'public';

-- 6. CHECK AUTH.USERS TABLE STRUCTURE
SELECT 
    'AUTH USERS STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'auth'
ORDER BY ordinal_position;

-- 7. CHECK FOR RECENT TRIGGER EXECUTIONS (if logging is enabled)
SELECT 
    'RECENT TRIGGER LOGS' as check_type,
    user_id,
    event_type,
    message,
    created_at
FROM public.trigger_logs 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;

-- 8. TEST RPC FUNCTION AVAILABILITY
SELECT 
    'RPC FUNCTION CHECK' as check_type,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'create_user_profile';

-- 9. CHECK FOR CONFLICTING TRIGGERS
SELECT 
    'ALL TRIGGERS ON AUTH.USERS' as check_type,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';

-- 10. CHECK RLS STATUS (Alternative method)
SELECT
    'RLS STATUS' as check_type,
    schemaname,
    tablename,
    CASE
        WHEN rowsecurity THEN 'ENABLED'
        ELSE 'DISABLED'
    END as rls_status
FROM pg_tables
WHERE tablename = 'profiles' AND schemaname = 'public';

-- 11. COMPREHENSIVE STATUS CHECK (Fixed)
SELECT
    'COMPREHENSIVE STATUS' as check_type,
    json_build_object(
        'trigger_exists', EXISTS(
            SELECT 1 FROM information_schema.triggers
            WHERE trigger_name = 'on_auth_user_created'
        ),
        'function_exists', EXISTS(
            SELECT 1 FROM information_schema.routines
            WHERE routine_name = 'handle_new_user'
        ),
        'rpc_function_exists', EXISTS(
            SELECT 1 FROM information_schema.routines
            WHERE routine_name = 'create_user_profile'
        ),
        'profiles_table_exists', EXISTS(
            SELECT 1 FROM information_schema.tables
            WHERE table_name = 'profiles' AND table_schema = 'public'
        ),
        'rls_enabled', EXISTS(
            SELECT 1 FROM pg_tables
            WHERE tablename = 'profiles' AND schemaname = 'public' AND rowsecurity = true
        ),
        'policies_count', (
            SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles'
        )
    ) as status_summary;

-- =====================================================
-- MANUAL TESTING QUERIES
-- =====================================================

-- Test 1: Try to call the RPC function manually
-- SELECT public.create_user_profile(
--     'test-uuid-here'::uuid,
--     'test@example.com',
--     'Test User',
--     '0123456789',
--     'patient'
-- );

-- Test 2: Check if you can insert into profiles manually
-- INSERT INTO public.profiles (
--     id, email, full_name, role, is_active
-- ) VALUES (
--     gen_random_uuid(), 'manual-test@example.com', 'Manual Test', 'patient', true
-- );

-- Test 3: Check recent auth users
-- SELECT id, email, created_at, raw_user_meta_data 
-- FROM auth.users 
-- ORDER BY created_at DESC 
-- LIMIT 5;

-- Test 4: Check recent profiles
-- SELECT id, email, full_name, role, created_at 
-- FROM public.profiles 
-- ORDER BY created_at DESC 
-- LIMIT 5;

-- =====================================================
-- COMMON ISSUES AND SOLUTIONS
-- =====================================================

/*
ISSUE 1: Trigger exists but doesn't execute
SOLUTION: Check Supabase logs, verify function permissions

ISSUE 2: Function exists but fails
SOLUTION: Check column names match between function and table

ISSUE 3: RLS blocks trigger
SOLUTION: Update RLS policies to allow trigger function

ISSUE 4: Missing permissions
SOLUTION: Grant necessary permissions to authenticated/anon roles

ISSUE 5: Table structure mismatch
SOLUTION: Update function to match actual table structure

ISSUE 6: Metadata extraction fails
SOLUTION: Check raw_user_meta_data structure in auth.users
*/

-- =====================================================
-- QUICK FIX COMMANDS
-- =====================================================

-- If trigger is missing, create it:
-- CREATE TRIGGER on_auth_user_created
--     AFTER INSERT ON auth.users
--     FOR EACH ROW
--     EXECUTE FUNCTION public.handle_new_user();

-- If function has wrong permissions:
-- ALTER FUNCTION public.handle_new_user() SECURITY DEFINER;

-- If RLS is blocking:
-- CREATE POLICY "Allow trigger insert" ON public.profiles
--     FOR INSERT WITH CHECK (true);

-- If table permissions are missing:
-- GRANT INSERT ON public.profiles TO authenticated, anon;
