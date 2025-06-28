-- =====================================================
-- TEST DOCTOR ID GENERATION FUNCTION
-- =====================================================

-- 1. CHECK IF FUNCTION EXISTS
-- =====================================================
SELECT 'Checking if generate_doctor_id function exists...' as info;

SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'generate_doctor_id';

-- 2. TEST FUNCTION CALL
-- =====================================================
SELECT 'Testing generate_doctor_id function...' as info;

-- Test with DEPT001
SELECT generate_doctor_id('DEPT001') as generated_id_dept001;

-- Test with DEPT003  
SELECT generate_doctor_id('DEPT003') as generated_id_dept003;

-- 3. CHECK DEPARTMENTS TABLE
-- =====================================================
SELECT 'Checking departments table...' as info;

SELECT department_id, department_name, department_code 
FROM departments 
WHERE department_id IN ('DEPT001', 'DEPT003', 'DEPT008')
LIMIT 5;

-- 4. CHECK CURRENT DOCTOR IDS
-- =====================================================
SELECT 'Current doctor IDs in database...' as info;

SELECT doctor_id, specialty, department_id 
FROM doctors 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. MANUAL ID GENERATION TEST
-- =====================================================
SELECT 'Manual ID generation test...' as info;

-- Test manual generation logic
SELECT 
    'CARD-DOC-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || 
    LPAD((EXTRACT(EPOCH FROM NOW())::bigint % 1000)::text, 3, '0') as manual_id;

SELECT 'Test completed!' as result;
