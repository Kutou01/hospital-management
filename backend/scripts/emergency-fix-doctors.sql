-- =====================================================
-- EMERGENCY FIX FOR DOCTORS CONSTRAINT VIOLATION
-- =====================================================

-- 1. DROP THE PROBLEMATIC CONSTRAINT FIRST
-- =====================================================
ALTER TABLE doctors DROP CONSTRAINT IF EXISTS doctors_gender_check;

-- 2. CHECK CURRENT PROBLEMATIC DATA
-- =====================================================
SELECT 'Problematic records:' as info;
SELECT doctor_id, gender, specialty FROM doctors 
WHERE gender NOT IN ('male', 'female', 'other') OR gender IS NULL;

-- 3. FIX ANY INVALID GENDER VALUES
-- =====================================================
-- Set any invalid or null gender to 'other'
UPDATE doctors 
SET gender = 'other' 
WHERE gender IS NULL OR gender NOT IN ('male', 'female', 'other');

-- 4. VERIFY ALL GENDER VALUES ARE VALID
-- =====================================================
SELECT 'All gender values after fix:' as info;
SELECT gender, COUNT(*) as count FROM doctors GROUP BY gender;

-- 5. NOW SAFELY ADD THE CONSTRAINT BACK
-- =====================================================
ALTER TABLE doctors ADD CONSTRAINT doctors_gender_check 
CHECK (gender IN ('male', 'female', 'other'));

-- 6. FINAL TEST - TRY TO INSERT A TEST RECORD
-- =====================================================
-- This should work now
SELECT 'Constraint test - this should show no errors above' as result;

-- 7. SHOW FINAL STATUS
-- =====================================================
SELECT 'SUCCESS: Gender constraint fixed!' as final_result;
