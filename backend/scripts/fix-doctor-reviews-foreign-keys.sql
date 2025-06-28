-- =====================================================
-- FIX DUPLICATE FOREIGN KEY CONSTRAINTS IN DOCTOR_REVIEWS TABLE
-- =====================================================
-- This script fixes the Supabase API error: "Could not embed because more than one relationship was found"

-- 1. CHECK CURRENT FOREIGN KEY CONSTRAINTS
-- =====================================================
SELECT 'Current foreign key constraints on doctor_reviews table:' as info;

SELECT 
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
    AND tc.table_name = 'doctor_reviews'
ORDER BY tc.constraint_name;

-- 2. DROP DUPLICATE FOREIGN KEY CONSTRAINTS
-- =====================================================
SELECT 'Dropping duplicate foreign key constraints...' as info;

DO $$
BEGIN
    -- Drop the duplicate patient_id foreign key (fk_doctor_reviews_patient)
    -- Keep the standard PostgreSQL naming convention (doctor_reviews_patient_id_fkey)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_doctor_reviews_patient' 
        AND table_name = 'doctor_reviews'
    ) THEN
        ALTER TABLE doctor_reviews DROP CONSTRAINT fk_doctor_reviews_patient;
        RAISE NOTICE 'Dropped duplicate constraint: fk_doctor_reviews_patient';
    ELSE
        RAISE NOTICE 'Constraint fk_doctor_reviews_patient does not exist';
    END IF;

    -- Also drop the duplicate doctor_id foreign key if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_doctor_reviews_doctor' 
        AND table_name = 'doctor_reviews'
    ) THEN
        ALTER TABLE doctor_reviews DROP CONSTRAINT fk_doctor_reviews_doctor;
        RAISE NOTICE 'Dropped duplicate constraint: fk_doctor_reviews_doctor';
    ELSE
        RAISE NOTICE 'Constraint fk_doctor_reviews_doctor does not exist';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error dropping constraints: %', SQLERRM;
END $$;

-- 3. ENSURE STANDARD FOREIGN KEY CONSTRAINTS EXIST
-- =====================================================
SELECT 'Ensuring standard foreign key constraints exist...' as info;

DO $$
BEGIN
    -- Ensure doctor_reviews -> doctors foreign key exists (standard naming)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'doctor_reviews_doctor_id_fkey' 
        AND table_name = 'doctor_reviews'
    ) THEN
        ALTER TABLE doctor_reviews 
        ADD CONSTRAINT doctor_reviews_doctor_id_fkey 
        FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE;
        RAISE NOTICE 'Added constraint: doctor_reviews_doctor_id_fkey';
    ELSE
        RAISE NOTICE 'Constraint doctor_reviews_doctor_id_fkey already exists';
    END IF;

    -- Ensure doctor_reviews -> patients foreign key exists (standard naming)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'doctor_reviews_patient_id_fkey' 
        AND table_name = 'doctor_reviews'
    ) THEN
        ALTER TABLE doctor_reviews 
        ADD CONSTRAINT doctor_reviews_patient_id_fkey 
        FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE;
        RAISE NOTICE 'Added constraint: doctor_reviews_patient_id_fkey';
    ELSE
        RAISE NOTICE 'Constraint doctor_reviews_patient_id_fkey already exists';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding constraints: %', SQLERRM;
END $$;

-- 4. FINAL VERIFICATION
-- =====================================================
SELECT 'Final verification - doctor_reviews foreign key constraints:' as verification;

SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS references_table,
    ccu.column_name AS references_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'doctor_reviews'
ORDER BY tc.constraint_name;

-- 5. SUCCESS MESSAGE
-- =====================================================
SELECT 'SUCCESS: Fixed duplicate foreign key constraints in doctor_reviews table!' as result;
SELECT 'Doctor reviews API should now work properly without Supabase embedding errors' as note;
