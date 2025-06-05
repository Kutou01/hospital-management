-- =====================================================
-- SIMPLE RLS POLICIES FIX FOR PATIENT REGISTRATION
-- =====================================================
-- Copy and paste this SQL into Supabase SQL Editor
-- This fixes the "new row violates row-level security policy" error
-- =====================================================

-- Step 1: Create basic RLS policies for PATIENTS table
CREATE POLICY "Enable insert for all users" ON public.patients
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Users can view own patient record" ON public.patients
    FOR SELECT 
    USING (profile_id = auth.uid());

CREATE POLICY "Users can update own patient record" ON public.patients
    FOR UPDATE 
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());

-- Step 2: Create basic RLS policies for DOCTORS table
CREATE POLICY "Enable insert for all users" ON public.doctors
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Users can view own doctor record" ON public.doctors
    FOR SELECT 
    USING (profile_id = auth.uid());

CREATE POLICY "Public can view active doctors" ON public.doctors
    FOR SELECT 
    USING (status = 'active');

-- Step 3: Create basic RLS policies for ADMINS table
CREATE POLICY "Enable insert for all users" ON public.admins
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Users can view own admin record" ON public.admins
    FOR SELECT 
    USING (profile_id = auth.uid());

-- Step 4: Grant necessary permissions
GRANT INSERT, SELECT, UPDATE ON public.patients TO authenticated, anon;
GRANT INSERT, SELECT, UPDATE ON public.doctors TO authenticated, anon;
GRANT INSERT, SELECT, UPDATE ON public.admins TO authenticated, anon;

-- Step 5: Ensure RLS is enabled (should already be enabled)
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Step 6: Verify policies were created
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('patients', 'doctors', 'admins')
ORDER BY tablename, policyname;
