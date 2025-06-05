-- =====================================================
-- FIX APPOINTMENTS RLS POLICIES
-- Hospital Management System - Allow basic appointment operations
-- =====================================================

-- Step 1: Enable RLS on appointments table if not already enabled
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable insert for all users" ON public.appointments;
DROP POLICY IF EXISTS "Enable select for all users" ON public.appointments;
DROP POLICY IF EXISTS "Enable update for all users" ON public.appointments;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.appointments;
DROP POLICY IF EXISTS "Users can view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can manage appointments" ON public.appointments;

-- Step 3: Create basic RLS policies for appointments
-- Allow all authenticated users to insert appointments
CREATE POLICY "Enable insert for authenticated users" ON public.appointments
    FOR INSERT 
    TO authenticated
    WITH CHECK (true);

-- Allow all authenticated users to view appointments
CREATE POLICY "Enable select for authenticated users" ON public.appointments
    FOR SELECT 
    TO authenticated
    USING (true);

-- Allow all authenticated users to update appointments
CREATE POLICY "Enable update for authenticated users" ON public.appointments
    FOR UPDATE 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow all authenticated users to delete appointments
CREATE POLICY "Enable delete for authenticated users" ON public.appointments
    FOR DELETE 
    TO authenticated
    USING (true);

-- Step 4: Also allow anonymous access for testing (can be removed later)
CREATE POLICY "Enable insert for anonymous" ON public.appointments
    FOR INSERT 
    TO anon
    WITH CHECK (true);

CREATE POLICY "Enable select for anonymous" ON public.appointments
    FOR SELECT 
    TO anon
    USING (true);

CREATE POLICY "Enable update for anonymous" ON public.appointments
    FOR UPDATE 
    TO anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete for anonymous" ON public.appointments
    FOR DELETE 
    TO anon
    USING (true);
