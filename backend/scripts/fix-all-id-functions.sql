-- =====================================================
-- FIX ALL ID GENERATION FUNCTIONS
-- =====================================================
-- This script creates/fixes all ID generation functions used by Auth Service

-- 1. DROP EXISTING FUNCTIONS
-- =====================================================
DROP FUNCTION IF EXISTS generate_doctor_id(TEXT);
DROP FUNCTION IF EXISTS generate_patient_id();
DROP FUNCTION IF EXISTS generate_admin_id();
DROP FUNCTION IF EXISTS get_department_code(TEXT);
DROP FUNCTION IF EXISTS generate_hospital_id(TEXT, TEXT);

-- 2. CREATE DEPARTMENT CODE MAPPING FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION get_department_code(dept_id TEXT)
RETURNS TEXT AS $$
DECLARE
    dept_code TEXT;
BEGIN
    -- Map department_id to department_code from departments table
    SELECT department_code INTO dept_code 
    FROM departments 
    WHERE department_id = dept_id;
    
    -- Return the code or default to 'GEN'
    RETURN COALESCE(dept_code, 'GEN');
END;
$$ LANGUAGE plpgsql;

-- 3. CREATE CORE ID GENERATION FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION generate_hospital_id(entity_type TEXT, dept_id TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    dept_code TEXT;
    year_month TEXT;
    sequence_num INTEGER;
    new_id TEXT;
    search_pattern TEXT;
BEGIN
    -- Get current year-month
    year_month := TO_CHAR(NOW(), 'YYYYMM');
    
    -- Handle department-based IDs
    IF dept_id IS NOT NULL THEN
        dept_code := get_department_code(dept_id);
        search_pattern := dept_code || '-' || entity_type || '-' || year_month || '-%';
        
        -- Get next sequence number for this department, entity type, and month
        SELECT COALESCE(MAX(
            CAST(SUBSTRING(
                CASE 
                    WHEN entity_type = 'DOC' THEN doctor_id
                    WHEN entity_type = 'APT' THEN appointment_id
                    ELSE 'UNKNOWN'
                END 
                FROM '[0-9]+$'
            ) AS INTEGER)
        ), 0) + 1
        INTO sequence_num
        FROM (
            SELECT doctor_id, NULL as appointment_id FROM doctors WHERE doctor_id LIKE search_pattern
            UNION ALL
            SELECT NULL as doctor_id, appointment_id FROM appointments WHERE appointment_id LIKE search_pattern
        ) combined_ids;
        
        -- Generate department-based ID: DEPT_CODE-ENTITY-YYYYMM-XXX
        new_id := dept_code || '-' || entity_type || '-' || year_month || '-' || 
                  LPAD(sequence_num::TEXT, 3, '0');
    ELSE
        -- Handle non-department IDs (patients, admins)
        search_pattern := entity_type || '-' || year_month || '-%';
        
        -- Get next sequence number for this entity type and month
        SELECT COALESCE(MAX(
            CAST(SUBSTRING(
                CASE
                    WHEN entity_type = 'PAT' THEN patient_id
                    WHEN entity_type = 'ADM' THEN admin_id
                    ELSE 'UNKNOWN'
                END
                FROM '[0-9]+$'
            ) AS INTEGER)
        ), 0) + 1
        INTO sequence_num
        FROM (
            SELECT patient_id, NULL as admin_id FROM patients WHERE patient_id LIKE search_pattern
            UNION ALL
            SELECT NULL as patient_id, admin_id FROM admins WHERE admin_id LIKE search_pattern
        ) combined_ids;
        
        -- Generate standard ID: ENTITY-YYYYMM-XXX
        new_id := entity_type || '-' || year_month || '-' || 
                  LPAD(sequence_num::TEXT, 3, '0');
    END IF;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- 4. CREATE DOCTOR ID GENERATION FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION generate_doctor_id(dept_id TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN generate_hospital_id('DOC', dept_id);
END;
$$ LANGUAGE plpgsql;

-- 5. CREATE PATIENT ID GENERATION FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION generate_patient_id()
RETURNS TEXT AS $$
BEGIN
    RETURN generate_hospital_id('PAT');
END;
$$ LANGUAGE plpgsql;

-- 6. CREATE ADMIN ID GENERATION FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION generate_admin_id()
RETURNS TEXT AS $$
BEGIN
    RETURN generate_hospital_id('ADM');
END;
$$ LANGUAGE plpgsql;

-- 7. CREATE APPOINTMENT ID GENERATION FUNCTION (bonus)
-- =====================================================
CREATE OR REPLACE FUNCTION generate_appointment_id(dept_id TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN generate_hospital_id('APT', dept_id);
END;
$$ LANGUAGE plpgsql;

-- 8. TEST ALL FUNCTIONS
-- =====================================================
SELECT 'Testing all ID generation functions:' as info;

-- Test doctor IDs
SELECT 'Doctor IDs:' as test_type,
       generate_doctor_id('DEPT001') as dept001,
       generate_doctor_id('DEPT003') as dept003,
       generate_doctor_id('DEPT008') as dept008;

-- Test patient ID
SELECT 'Patient ID:' as test_type,
       generate_patient_id() as patient_id;

-- Test admin ID
SELECT 'Admin ID:' as test_type,
       generate_admin_id() as admin_id;

-- Test appointment ID
SELECT 'Appointment IDs:' as test_type,
       generate_appointment_id('DEPT001') as apt_dept001,
       generate_appointment_id('DEPT003') as apt_dept003;

-- 9. VERIFY DEPARTMENT MAPPING
-- =====================================================
SELECT 'Department code mapping:' as info;

SELECT 
    department_id,
    department_name,
    department_code,
    get_department_code(department_id) as function_result
FROM departments 
WHERE department_id IN ('DEPT001', 'DEPT003', 'DEPT008', 'DEPT009')
ORDER BY department_id;

-- 10. SUCCESS MESSAGE
-- =====================================================
SELECT 'SUCCESS: All ID generation functions created and tested!' as result;
SELECT 'Auth Service should now generate correct IDs for all entities' as note;
