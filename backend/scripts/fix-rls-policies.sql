-- =====================================================
-- FIX RLS POLICIES FOR PATIENTS, DOCTORS, AND ADMINS TABLES
-- =====================================================
-- This script fixes the RLS policy issue that's preventing
-- patient profile creation during registration.
-- 
-- Error: "new row violates row-level security policy for table 'patients'"
-- Cause: RLS is enabled but no policies are defined
-- =====================================================

-- Step 1: Check current RLS status
SELECT 
    'CURRENT RLS STATUS' as info,
    schemaname,
    tablename,
    CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables 
WHERE tablename IN ('patients', 'doctors', 'admins', 'profiles') 
AND schemaname = 'public'
ORDER BY tablename;

-- Step 2: Check existing policies
SELECT 
    'EXISTING POLICIES' as info,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('patients', 'doctors', 'admins', 'profiles')
ORDER BY tablename, policyname;

-- Step 3: Drop existing policies for role tables (if any)
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.patients;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.patients;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.patients;
DROP POLICY IF EXISTS "Users can view own patient record" ON public.patients;
DROP POLICY IF EXISTS "Users can update own patient record" ON public.patients;

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.doctors;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.doctors;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.doctors;
DROP POLICY IF EXISTS "Users can view own doctor record" ON public.doctors;
DROP POLICY IF EXISTS "Users can update own doctor record" ON public.doctors;

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.admins;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.admins;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.admins;
DROP POLICY IF EXISTS "Users can view own admin record" ON public.admins;
DROP POLICY IF EXISTS "Users can update own admin record" ON public.admins;

-- Step 4: Create comprehensive RLS policies for PATIENTS table
CREATE POLICY "Enable insert for authenticated users" ON public.patients
    FOR INSERT TO authenticated, anon
    WITH CHECK (true);

CREATE POLICY "Users can view own patient record" ON public.patients
    FOR SELECT TO authenticated
    USING (profile_id = auth.uid());

CREATE POLICY "Users can update own patient record" ON public.patients
    FOR UPDATE TO authenticated
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());

-- Allow admins to view all patient records
CREATE POLICY "Admins can view all patient records" ON public.patients
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Allow doctors to view patient records (for appointments)
CREATE POLICY "Doctors can view patient records" ON public.patients
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'doctor'
        )
    );

-- Step 5: Create comprehensive RLS policies for DOCTORS table
CREATE POLICY "Enable insert for authenticated users" ON public.doctors
    FOR INSERT TO authenticated, anon
    WITH CHECK (true);

CREATE POLICY "Users can view own doctor record" ON public.doctors
    FOR SELECT TO authenticated
    USING (profile_id = auth.uid());

CREATE POLICY "Users can update own doctor record" ON public.doctors
    FOR UPDATE TO authenticated
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());

-- Allow public to view doctor information (for appointments)
CREATE POLICY "Public can view doctor information" ON public.doctors
    FOR SELECT TO authenticated, anon
    USING (status = 'active');

-- Allow admins to view all doctor records
CREATE POLICY "Admins can view all doctor records" ON public.doctors
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Step 6: Create comprehensive RLS policies for ADMINS table
CREATE POLICY "Enable insert for authenticated users" ON public.admins
    FOR INSERT TO authenticated, anon
    WITH CHECK (true);

CREATE POLICY "Users can view own admin record" ON public.admins
    FOR SELECT TO authenticated
    USING (profile_id = auth.uid());

CREATE POLICY "Users can update own admin record" ON public.admins
    FOR UPDATE TO authenticated
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());

-- Allow admins to view other admin records
CREATE POLICY "Admins can view all admin records" ON public.admins
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Step 7: Grant necessary table permissions
GRANT INSERT, SELECT, UPDATE ON public.patients TO authenticated, anon;
GRANT INSERT, SELECT, UPDATE ON public.doctors TO authenticated, anon;
GRANT INSERT, SELECT, UPDATE ON public.admins TO authenticated, anon;

-- Step 8: Ensure RLS is enabled on all tables
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 9: Verify the new policies
SELECT 
    'NEW POLICIES CREATED' as info,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename IN ('patients', 'doctors', 'admins', 'profiles')
ORDER BY tablename, policyname;

-- Step 10: Test patient creation with RPC function
SELECT 'TESTING PATIENT CREATION' as test_status;

-- Test the RPC function for patient creation
SELECT public.create_user_profile_enhanced(
    '99999999-9999-9999-9999-999999999999'::uuid,
    'test-patient-rls@example.com',
    'Test Patient RLS',
    '0123456789',
    'patient',
    'other',
    NULL,
    '1990-01-01'
) as patient_test_result;

SELECT 'RLS POLICIES SETUP COMPLETED' as status, NOW() as timestamp;
