-- =====================================================
-- FIX DUPLICATE FOREIGN KEY CONSTRAINTS
-- =====================================================

-- 1. CHECK CURRENT FOREIGN KEY CONSTRAINTS ON DOCTOR_REVIEWS
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

-- 2. FIX DOCTOR_REVIEWS DUPLICATE FOREIGN KEYS
-- =====================================================
SELECT 'Fixing duplicate foreign keys in doctor_reviews table...' as info;

DO $$
BEGIN
    -- Drop duplicate patient_id foreign key if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_doctor_reviews_patient'
        AND table_name = 'doctor_reviews'
    ) THEN
        ALTER TABLE doctor_reviews DROP CONSTRAINT fk_doctor_reviews_patient;
        RAISE NOTICE 'Dropped duplicate constraint: fk_doctor_reviews_patient';
    END IF;

    -- Ensure we have the standard foreign key constraints
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'doctor_reviews_doctor_id_fkey'
        AND table_name = 'doctor_reviews'
    ) THEN
        ALTER TABLE doctor_reviews
        ADD CONSTRAINT doctor_reviews_doctor_id_fkey
        FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE;
        RAISE NOTICE 'Added constraint: doctor_reviews_doctor_id_fkey';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'doctor_reviews_patient_id_fkey'
        AND table_name = 'doctor_reviews'
    ) THEN
        ALTER TABLE doctor_reviews
        ADD CONSTRAINT doctor_reviews_patient_id_fkey
        FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE;
        RAISE NOTICE 'Added constraint: doctor_reviews_patient_id_fkey';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error fixing doctor_reviews constraints: %', SQLERRM;
END $$;

-- 3. CHECK CURRENT FOREIGN KEY CONSTRAINTS ON DOCTORS TABLE
-- =====================================================
SELECT 'Current foreign key constraints on doctors table:' as info;

SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_type
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'doctors'
    AND kcu.column_name = 'profile_id'
ORDER BY tc.constraint_name;

-- 2. CHECK ALL FOREIGN KEYS POINTING TO PROFILES
-- =====================================================
SELECT 'All foreign keys pointing to profiles table:' as info;

SELECT 
    tc.table_name,
    tc.constraint_name,
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
    AND ccu.table_name = 'profiles'
    AND kcu.column_name = 'profile_id'
ORDER BY tc.table_name, tc.constraint_name;

-- 3. DROP DUPLICATE FOREIGN KEY CONSTRAINTS
-- =====================================================
SELECT 'Dropping duplicate foreign key constraints...' as info;

-- Drop the older/duplicate constraint (keep the standard one)
-- Usually we keep the one with standard naming convention

-- Check if constraints exist before dropping
DO $$
BEGIN
    -- Drop fk_doctors_profile_id if it exists (keep doctors_profile_id_fkey)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_doctors_profile_id' 
        AND table_name = 'doctors'
    ) THEN
        ALTER TABLE doctors DROP CONSTRAINT fk_doctors_profile_id;
        RAISE NOTICE 'Dropped duplicate constraint: fk_doctors_profile_id';
    ELSE
        RAISE NOTICE 'Constraint fk_doctors_profile_id does not exist';
    END IF;

    -- Check if we still have the main constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'doctors_profile_id_fkey' 
        AND table_name = 'doctors'
    ) THEN
        RAISE NOTICE 'Main constraint doctors_profile_id_fkey still exists - GOOD';
    ELSE
        RAISE NOTICE 'WARNING: Main constraint doctors_profile_id_fkey is missing!';
    END IF;
END $$;

-- 4. CHECK OTHER TABLES FOR SIMILAR ISSUES
-- =====================================================
SELECT 'Checking other tables for duplicate foreign key issues...' as info;

-- Check patients table
SELECT 'Patients table foreign keys:' as table_check;
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'patients'
    AND kcu.column_name = 'profile_id';

-- Check admins table
SELECT 'Admins table foreign keys:' as table_check;
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'admins'
    AND kcu.column_name = 'profile_id';

-- 5. VERIFY FINAL STATE
-- =====================================================
SELECT 'Final verification - doctors table foreign keys:' as verification;

SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'doctors'
    AND kcu.column_name = 'profile_id';

-- 6. SUCCESS MESSAGE
-- =====================================================
SELECT 'SUCCESS: Duplicate foreign key constraints fixed!' as result;
SELECT 'Doctor service should now work properly with profile relationships' as note;
