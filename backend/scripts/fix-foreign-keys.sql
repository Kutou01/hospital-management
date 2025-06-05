-- =====================================================
-- FIX FOREIGN KEY CONSTRAINTS
-- Hospital Management System - Fix relationship issues
-- =====================================================

-- Step 1: Drop existing foreign key constraints that might be causing conflicts
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Find and drop all foreign key constraints on appointments table
    FOR constraint_record IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'appointments' 
        AND constraint_type = 'FOREIGN KEY'
        AND table_schema = 'public'
    LOOP
        EXECUTE 'ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS ' || constraint_record.constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_record.constraint_name;
    END LOOP;
END $$;

-- Step 2: Add proper foreign key constraints with specific names
-- Add foreign key for doctor_id
ALTER TABLE public.appointments 
ADD CONSTRAINT appointments_doctor_id_fkey 
FOREIGN KEY (doctor_id) 
REFERENCES public.doctors(doctor_id) 
ON DELETE CASCADE;

-- Add foreign key for patient_id  
ALTER TABLE public.appointments 
ADD CONSTRAINT appointments_patient_id_fkey 
FOREIGN KEY (patient_id) 
REFERENCES public.patients(patient_id) 
ON DELETE CASCADE;

-- Step 3: Verify the constraints were created
SELECT 
    'VERIFICATION' as info,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name = 'appointments'
ORDER BY tc.constraint_name;
