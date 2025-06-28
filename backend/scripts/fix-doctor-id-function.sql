-- =====================================================
-- FIX DOCTOR ID GENERATION FUNCTION
-- =====================================================

-- 1. CHECK CURRENT FUNCTION
-- =====================================================
SELECT 'Current generate_doctor_id function:' as info;

SELECT routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'generate_doctor_id';

-- 2. DROP AND RECREATE FUNCTION WITH CORRECT MAPPING
-- =====================================================

-- Drop existing function
DROP FUNCTION IF EXISTS generate_doctor_id(TEXT);

-- Create new function with proper department mapping
CREATE OR REPLACE FUNCTION generate_doctor_id(dept_id TEXT)
RETURNS TEXT AS $$
DECLARE
    dept_code TEXT;
    year_month TEXT;
    sequence_num INTEGER;
    new_id TEXT;
BEGIN
    -- Map department_id to department_code
    SELECT department_code INTO dept_code 
    FROM departments 
    WHERE department_id = dept_id;
    
    -- If no mapping found, use default
    IF dept_code IS NULL THEN
        dept_code := 'GEN';
    END IF;
    
    -- Get current year-month
    year_month := TO_CHAR(NOW(), 'YYYYMM');
    
    -- Get next sequence number for this department and month
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(doctor_id FROM '[0-9]+$') AS INTEGER)
    ), 0) + 1
    INTO sequence_num
    FROM doctors 
    WHERE doctor_id LIKE dept_code || '-DOC-' || year_month || '-%';
    
    -- Generate new ID: DEPT_CODE-DOC-YYYYMM-XXX
    new_id := dept_code || '-DOC-' || year_month || '-' || 
              LPAD(sequence_num::TEXT, 3, '0');
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- 3. TEST THE FIXED FUNCTION
-- =====================================================
SELECT 'Testing fixed function:' as info;

-- Test with different departments
SELECT 'DEPT001 (CARD):' as test, generate_doctor_id('DEPT001') as result
UNION ALL
SELECT 'DEPT003 (PEDI):' as test, generate_doctor_id('DEPT003') as result
UNION ALL
SELECT 'DEPT008 (GENE):' as test, generate_doctor_id('DEPT008') as result
UNION ALL
SELECT 'DEPT009 (SURG):' as test, generate_doctor_id('DEPT009') as result;

-- 4. VERIFY DEPARTMENT MAPPING
-- =====================================================
SELECT 'Department mapping verification:' as info;

SELECT 
    department_id,
    department_name,
    department_code,
    generate_doctor_id(department_id) as sample_doctor_id
FROM departments 
WHERE department_id IN ('DEPT001', 'DEPT003', 'DEPT008', 'DEPT009')
ORDER BY department_id;

-- 5. SUCCESS MESSAGE
-- =====================================================
SELECT 'SUCCESS: Doctor ID generation function fixed!' as result;
SELECT 'Now Auth Service should generate correct department-based IDs' as note;
