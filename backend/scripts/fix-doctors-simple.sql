-- =====================================================
-- SIMPLE FIX FOR DOCTORS TABLE CONSTRAINTS
-- =====================================================
-- This script safely fixes the main constraint issues

-- 1. REMOVE FULL_NAME COLUMN (stored in profiles)
-- =====================================================
ALTER TABLE doctors DROP COLUMN IF EXISTS full_name CASCADE;

-- 2. FIX GENDER CONSTRAINT (lowercase values)
-- =====================================================
-- Drop old constraint
ALTER TABLE doctors DROP CONSTRAINT IF EXISTS doctors_gender_check;

-- Make gender nullable and add new constraint
ALTER TABLE doctors ALTER COLUMN gender DROP NOT NULL;
ALTER TABLE doctors ADD CONSTRAINT doctors_gender_check 
CHECK (gender IN ('male', 'female', 'other'));

-- 3. MAKE LICENSE_NUMBER OPTIONAL
-- =====================================================
ALTER TABLE doctors ALTER COLUMN license_number DROP NOT NULL;

-- 4. VERIFY FOREIGN KEY EXISTS
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'doctors' 
                   AND constraint_name = 'fk_doctors_profile_id') THEN
        ALTER TABLE doctors 
        ADD CONSTRAINT fk_doctors_profile_id 
        FOREIGN KEY (profile_id) REFERENCES profiles(id) 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 5. SUCCESS MESSAGE
SELECT 'Doctors table constraints fixed successfully!' as result;
