-- =====================================================
-- CHECK ALL ID GENERATION FUNCTIONS
-- =====================================================

-- 1. LIST ALL CUSTOM FUNCTIONS
-- =====================================================
SELECT 'All custom functions in database:' as info;

SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name LIKE '%generate%' OR routine_name LIKE '%id%'
ORDER BY routine_name;

-- 2. TEST DOCTOR ID GENERATION
-- =====================================================
SELECT 'Testing generate_doctor_id:' as info;

SELECT 
    'DEPT001' as dept_id,
    generate_doctor_id('DEPT001') as generated_id
UNION ALL
SELECT 
    'DEPT003' as dept_id,
    generate_doctor_id('DEPT003') as generated_id
UNION ALL
SELECT 
    'DEPT008' as dept_id,
    generate_doctor_id('DEPT008') as generated_id;

-- 3. TEST PATIENT ID GENERATION (if exists)
-- =====================================================
SELECT 'Testing generate_patient_id (if exists):' as info;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'generate_patient_id') THEN
        RAISE NOTICE 'generate_patient_id function exists';
        -- Test it
        PERFORM generate_patient_id();
    ELSE
        RAISE NOTICE 'generate_patient_id function does NOT exist';
    END IF;
END $$;

-- Try to call it anyway
SELECT generate_patient_id() as patient_id;

-- 4. TEST APPOINTMENT ID GENERATION (if exists)
-- =====================================================
SELECT 'Testing generate_appointment_id (if exists):' as info;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'generate_appointment_id') THEN
        RAISE NOTICE 'generate_appointment_id function exists';
    ELSE
        RAISE NOTICE 'generate_appointment_id function does NOT exist';
    END IF;
END $$;

-- Try to call it anyway
SELECT generate_appointment_id('DEPT001') as appointment_id;

-- 5. TEST ADMIN ID GENERATION (if exists)
-- =====================================================
SELECT 'Testing generate_admin_id (if exists):' as info;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'generate_admin_id') THEN
        RAISE NOTICE 'generate_admin_id function exists';
    ELSE
        RAISE NOTICE 'generate_admin_id function does NOT exist';
    END IF;
END $$;

-- Try to call it anyway
SELECT generate_admin_id() as admin_id;

-- 6. CHECK DEPARTMENT CODE MAPPING FUNCTION
-- =====================================================
SELECT 'Testing get_department_code (if exists):' as info;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_department_code') THEN
        RAISE NOTICE 'get_department_code function exists';
    ELSE
        RAISE NOTICE 'get_department_code function does NOT exist';
    END IF;
END $$;

-- Try to call it anyway
SELECT get_department_code('DEPT001') as dept_code_001;
SELECT get_department_code('DEPT003') as dept_code_003;

-- 7. CHECK CORE ID GENERATION FUNCTION
-- =====================================================
SELECT 'Testing generate_hospital_id (if exists):' as info;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'generate_hospital_id') THEN
        RAISE NOTICE 'generate_hospital_id function exists';
    ELSE
        RAISE NOTICE 'generate_hospital_id function does NOT exist';
    END IF;
END $$;

-- Try to call it anyway
SELECT generate_hospital_id('DOC', 'DEPT001') as hospital_id_doc;
SELECT generate_hospital_id('PAT') as hospital_id_pat;

-- 8. SUMMARY
-- =====================================================
SELECT 'SUMMARY: Function availability check completed!' as result;
