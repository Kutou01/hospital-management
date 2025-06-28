-- =====================================================
-- FIX DOCTORS DATA BEFORE UPDATING CONSTRAINTS
-- =====================================================

-- 1. CHECK CURRENT DATA
-- =====================================================
SELECT 'Current doctors count:' as info, COUNT(*) as count FROM doctors;

SELECT 'Current gender values:' as info, gender, COUNT(*) as count 
FROM doctors 
GROUP BY gender;

-- 2. UPDATE EXISTING DATA TO LOWERCASE
-- =====================================================
UPDATE doctors 
SET gender = LOWER(gender) 
WHERE gender IS NOT NULL;

-- 3. VERIFY UPDATED DATA
-- =====================================================
SELECT 'Updated gender values:' as info, gender, COUNT(*) as count 
FROM doctors 
GROUP BY gender;

-- 4. NOW SAFE TO DROP CONSTRAINT
-- =====================================================
ALTER TABLE doctors DROP CONSTRAINT IF EXISTS doctors_gender_check;

-- 5. REMOVE FULL_NAME COLUMN
-- =====================================================
ALTER TABLE doctors DROP COLUMN IF EXISTS full_name CASCADE;

-- 6. MAKE COLUMNS NULLABLE
-- =====================================================
ALTER TABLE doctors ALTER COLUMN gender DROP NOT NULL;
ALTER TABLE doctors ALTER COLUMN license_number DROP NOT NULL;

-- 7. ADD NEW CONSTRAINT WITH LOWERCASE VALUES
-- =====================================================
ALTER TABLE doctors ADD CONSTRAINT doctors_gender_check 
CHECK (gender IN ('male', 'female', 'other'));

-- 8. VERIFY FOREIGN KEY EXISTS
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

-- 9. FINAL VERIFICATION
-- =====================================================
SELECT 'Final verification:' as info;
SELECT 'Doctors count:' as check_type, COUNT(*) as count FROM doctors;
SELECT 'Gender values:' as check_type, gender, COUNT(*) as count 
FROM doctors 
GROUP BY gender;

SELECT 'SUCCESS: Doctors table fixed!' as result;
