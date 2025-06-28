-- =====================================================
-- CHECK FALLBACK USAGE IN DATABASE
-- =====================================================

-- 1. ANALYZE DOCTOR IDs TO DETECT FALLBACK PATTERNS
-- =====================================================
SELECT 'Analyzing Doctor ID patterns for fallback detection:' as info;

-- Check for fallback patterns in doctor IDs
SELECT 
    'Doctor ID Analysis' as analysis_type,
    COUNT(*) as total_doctors,
    COUNT(CASE WHEN doctor_id LIKE 'GEN-DOC-%' THEN 1 END) as fallback_gen_ids,
    COUNT(CASE WHEN doctor_id LIKE '%-DOC-%-___' AND doctor_id NOT LIKE 'GEN-DOC-%' THEN 1 END) as proper_dept_ids,
    COUNT(CASE WHEN doctor_id NOT LIKE '%-DOC-%' THEN 1 END) as old_format_ids
FROM doctors;

-- Show specific fallback doctor records
SELECT 'Fallback Doctor IDs (GEN-DOC pattern):' as info;
SELECT 
    doctor_id,
    specialty,
    department_id,
    created_at,
    'FALLBACK - Should be: ' || 
    COALESCE((SELECT department_code FROM departments WHERE department_id = doctors.department_id), 'UNKNOWN') ||
    '-DOC-' || TO_CHAR(created_at, 'YYYYMM') || '-XXX' as should_be
FROM doctors 
WHERE doctor_id LIKE 'GEN-DOC-%'
ORDER BY created_at DESC;

-- 2. ANALYZE PATIENT IDs
-- =====================================================
SELECT 'Analyzing Patient ID patterns:' as info;

SELECT 
    'Patient ID Analysis' as analysis_type,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN patient_id LIKE 'PAT-______-___' THEN 1 END) as proper_format,
    COUNT(CASE WHEN patient_id NOT LIKE 'PAT-______-___' THEN 1 END) as irregular_format
FROM patients;

-- Show irregular patient IDs
SELECT 'Irregular Patient IDs:' as info;
SELECT 
    patient_id,
    created_at,
    'Should be: PAT-' || TO_CHAR(created_at, 'YYYYMM') || '-XXX' as should_be
FROM patients 
WHERE patient_id NOT LIKE 'PAT-______-___'
ORDER BY created_at DESC
LIMIT 10;

-- 3. ANALYZE ADMIN IDs (if admins table exists)
-- =====================================================
SELECT 'Analyzing Admin ID patterns:' as info;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admins') THEN
        RAISE NOTICE 'Admins table exists, checking patterns...';
    ELSE
        RAISE NOTICE 'Admins table does not exist';
    END IF;
END $$;

-- Try to analyze admin IDs
SELECT
    'Admin ID Analysis' as analysis_type,
    COUNT(*) as total_admins,
    COUNT(CASE WHEN admin_id LIKE 'ADM-______-___' THEN 1 END) as proper_format,
    COUNT(CASE WHEN admin_id NOT LIKE 'ADM-______-___' THEN 1 END) as irregular_format
FROM admins;

-- 4. CHECK RECENT REGISTRATIONS
-- =====================================================
SELECT 'Recent registrations (last 24 hours):' as info;

-- Recent doctors
SELECT 
    'Recent Doctors' as type,
    doctor_id,
    department_id,
    created_at,
    CASE 
        WHEN doctor_id LIKE 'GEN-DOC-%' THEN 'FALLBACK'
        WHEN doctor_id LIKE '%-DOC-%-___' THEN 'PROPER'
        ELSE 'OLD_FORMAT'
    END as id_type
FROM doctors 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Recent patients
SELECT 
    'Recent Patients' as type,
    patient_id,
    created_at,
    CASE 
        WHEN patient_id LIKE 'PAT-______-___' THEN 'PROPER'
        ELSE 'IRREGULAR'
    END as id_type
FROM patients 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 5. DEPARTMENT MAPPING VERIFICATION
-- =====================================================
SELECT 'Department mapping verification:' as info;

SELECT 
    d.department_id,
    d.department_name,
    d.department_code,
    COUNT(doc.doctor_id) as doctor_count,
    COUNT(CASE WHEN doc.doctor_id LIKE d.department_code || '-DOC-%' THEN 1 END) as correct_prefix_count,
    COUNT(CASE WHEN doc.doctor_id LIKE 'GEN-DOC-%' THEN 1 END) as fallback_count
FROM departments d
LEFT JOIN doctors doc ON doc.department_id = d.department_id
GROUP BY d.department_id, d.department_name, d.department_code
ORDER BY d.department_id;

-- 6. SUMMARY AND RECOMMENDATIONS
-- =====================================================
SELECT 'SUMMARY - Issues found:' as summary;

WITH issue_summary AS (
    SELECT 
        'Doctor IDs using fallback (GEN-DOC)' as issue,
        COUNT(*) as count
    FROM doctors 
    WHERE doctor_id LIKE 'GEN-DOC-%'
    
    UNION ALL
    
    SELECT 
        'Patient IDs with irregular format' as issue,
        COUNT(*) as count
    FROM patients 
    WHERE patient_id NOT LIKE 'PAT-______-___'
    
    UNION ALL
    
    SELECT
        'Admin IDs with irregular format' as issue,
        COUNT(*) as count
    FROM admins
    WHERE admin_id NOT LIKE 'ADM-______-___'
)
SELECT * FROM issue_summary WHERE count > 0;

SELECT 'RECOMMENDATION: Run fix-all-id-functions.sql to fix database functions' as recommendation;
