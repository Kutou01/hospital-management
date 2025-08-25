-- ============================================================================
-- PHASE 1: TESTING PROCEDURES AND VALIDATION
-- Hospital Management System - Database Redesign
-- ============================================================================
-- This script provides comprehensive testing procedures for Phase 1 validation
-- Execute AFTER Phase 1 implementation to ensure everything works correctly

-- ============================================================================
-- 1. COMPREHENSIVE SYSTEM VALIDATION
-- ============================================================================

-- Create testing schema for validation
CREATE SCHEMA IF NOT EXISTS phase1_testing;

-- ============================================================================
-- 2. TABLE STRUCTURE VALIDATION
-- ============================================================================

-- Validate all expected tables exist
CREATE OR REPLACE FUNCTION phase1_testing.validate_table_structure()
RETURNS TABLE(
    table_name TEXT,
    exists BOOLEAN,
    column_count INTEGER,
    constraint_count INTEGER,
    status TEXT
) AS $$
DECLARE
    expected_tables TEXT[] := ARRAY[
        'profiles', 'departments', 'patient_profiles', 'doctor_profiles',
        'appointments', 'medical_records', 'medical_terminology_systems',
        'medical_codes', 'fhir_resources'
    ];
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY expected_tables
    LOOP
        RETURN QUERY
        SELECT 
            table_name,
            EXISTS(
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' AND information_schema.tables.table_name = validate_table_structure.table_name
            ) as exists,
            (
                SELECT COUNT(*)::INTEGER 
                FROM information_schema.columns 
                WHERE table_schema = 'public' AND information_schema.columns.table_name = validate_table_structure.table_name
            ) as column_count,
            (
                SELECT COUNT(*)::INTEGER 
                FROM information_schema.table_constraints 
                WHERE table_schema = 'public' AND information_schema.table_constraints.table_name = validate_table_structure.table_name
            ) as constraint_count,
            CASE 
                WHEN EXISTS(
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_schema = 'public' AND information_schema.tables.table_name = validate_table_structure.table_name
                ) THEN 'SUCCESS'
                ELSE 'FAILED'
            END as status;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. ID GENERATION SYSTEM TESTING
-- ============================================================================

-- Test ID generation functions
CREATE OR REPLACE FUNCTION phase1_testing.test_id_generation()
RETURNS TABLE(
    test_name TEXT,
    generated_id TEXT,
    format_valid BOOLEAN,
    status TEXT
) AS $$
DECLARE
    test_dept_id UUID;
    test_user_id UUID;
    patient_id_test TEXT;
    doctor_id_test TEXT;
    appointment_id_test TEXT;
    medical_record_id_test TEXT;
BEGIN
    -- Get test department and user IDs
    SELECT id INTO test_dept_id FROM departments LIMIT 1;
    SELECT id INTO test_user_id FROM profiles WHERE role = 'doctor' LIMIT 1;
    
    -- Test patient ID generation
    SELECT generate_patient_id() INTO patient_id_test;
    RETURN QUERY SELECT 
        'Patient ID Generation'::TEXT,
        patient_id_test,
        (patient_id_test ~ '^PAT-\d{6}-\d{3}$'),
        CASE WHEN (patient_id_test ~ '^PAT-\d{6}-\d{3}$') THEN 'SUCCESS' ELSE 'FAILED' END;
    
    -- Test doctor ID generation
    IF test_dept_id IS NOT NULL THEN
        SELECT generate_doctor_id(test_dept_id) INTO doctor_id_test;
        RETURN QUERY SELECT 
            'Doctor ID Generation'::TEXT,
            doctor_id_test,
            (doctor_id_test ~ '^[A-Z]{4}-DOC-\d{6}-\d{3}$'),
            CASE WHEN (doctor_id_test ~ '^[A-Z]{4}-DOC-\d{6}-\d{3}$') THEN 'SUCCESS' ELSE 'FAILED' END;
    END IF;
    
    -- Test appointment ID generation
    IF test_user_id IS NOT NULL THEN
        BEGIN
            SELECT generate_appointment_id(test_user_id) INTO appointment_id_test;
            RETURN QUERY SELECT 
                'Appointment ID Generation'::TEXT,
                appointment_id_test,
                (appointment_id_test ~ '^[A-Z]{4}-APT-\d{6}-\d{3}$'),
                CASE WHEN (appointment_id_test ~ '^[A-Z]{4}-APT-\d{6}-\d{3}$') THEN 'SUCCESS' ELSE 'FAILED' END;
        EXCEPTION WHEN OTHERS THEN
            RETURN QUERY SELECT 
                'Appointment ID Generation'::TEXT,
                'ERROR: ' || SQLERRM,
                false,
                'FAILED'::TEXT;
        END;
    END IF;
    
    -- Test medical record ID generation
    IF test_user_id IS NOT NULL THEN
        BEGIN
            SELECT generate_medical_record_id(test_user_id) INTO medical_record_id_test;
            RETURN QUERY SELECT 
                'Medical Record ID Generation'::TEXT,
                medical_record_id_test,
                (medical_record_id_test ~ '^[A-Z]{4}-MR-\d{6}-\d{3}$'),
                CASE WHEN (medical_record_id_test ~ '^[A-Z]{4}-MR-\d{6}-\d{3}$') THEN 'SUCCESS' ELSE 'FAILED' END;
        EXCEPTION WHEN OTHERS THEN
            RETURN QUERY SELECT 
                'Medical Record ID Generation'::TEXT,
                'ERROR: ' || SQLERRM,
                false,
                'FAILED'::TEXT;
        END;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. DATA INTEGRITY TESTING
-- ============================================================================

-- Test data integrity and constraints
CREATE OR REPLACE FUNCTION phase1_testing.test_data_integrity()
RETURNS TABLE(
    test_name TEXT,
    test_result TEXT,
    status TEXT
) AS $$
BEGIN
    -- Test 1: Profile constraints
    RETURN QUERY SELECT 
        'Profile Email Uniqueness'::TEXT,
        'Profiles: ' || COUNT(*)::TEXT || ', Unique Emails: ' || COUNT(DISTINCT email)::TEXT,
        CASE WHEN COUNT(*) = COUNT(DISTINCT email) THEN 'SUCCESS' ELSE 'FAILED' END
    FROM profiles;
    
    -- Test 2: Patient-Profile relationship
    RETURN QUERY SELECT 
        'Patient-Profile Relationship'::TEXT,
        'Patients: ' || COUNT(pp.*)::TEXT || ', Valid Profiles: ' || COUNT(p.*)::TEXT,
        CASE WHEN COUNT(pp.*) = COUNT(p.*) THEN 'SUCCESS' ELSE 'FAILED' END
    FROM patient_profiles pp
    LEFT JOIN profiles p ON pp.user_id = p.id;
    
    -- Test 3: Doctor-Department relationship
    RETURN QUERY SELECT 
        'Doctor-Department Relationship'::TEXT,
        'Doctors: ' || COUNT(dp.*)::TEXT || ', Valid Departments: ' || COUNT(d.*)::TEXT,
        CASE WHEN COUNT(dp.*) = COUNT(d.*) THEN 'SUCCESS' ELSE 'FAILED' END
    FROM doctor_profiles dp
    LEFT JOIN departments d ON dp.department_id = d.id;
    
    -- Test 4: Appointment relationships
    RETURN QUERY SELECT 
        'Appointment Relationships'::TEXT,
        'Appointments: ' || COUNT(a.*)::TEXT || ', Valid Patients: ' || COUNT(pp.*)::TEXT || ', Valid Doctors: ' || COUNT(dp.*)::TEXT,
        CASE WHEN COUNT(a.*) = COUNT(pp.*) AND COUNT(a.*) = COUNT(dp.*) THEN 'SUCCESS' ELSE 'FAILED' END
    FROM appointments a
    LEFT JOIN patient_profiles pp ON a.patient_id = pp.user_id
    LEFT JOIN doctor_profiles dp ON a.doctor_id = dp.user_id;
    
    -- Test 5: JSONB data validation
    RETURN QUERY SELECT 
        'Patient Allergies JSONB'::TEXT,
        'Valid JSONB: ' || COUNT(*)::TEXT,
        CASE WHEN COUNT(*) > 0 THEN 'SUCCESS' ELSE 'WARNING' END
    FROM patient_profiles 
    WHERE jsonb_typeof(allergies) = 'array';
    
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. PERFORMANCE TESTING
-- ============================================================================

-- Test query performance with indexes
CREATE OR REPLACE FUNCTION phase1_testing.test_query_performance()
RETURNS TABLE(
    query_name TEXT,
    execution_time_ms NUMERIC,
    rows_returned BIGINT,
    status TEXT
) AS $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    row_count BIGINT;
BEGIN
    -- Test 1: Patient lookup by ID
    start_time := clock_timestamp();
    SELECT COUNT(*) INTO row_count FROM patient_profiles WHERE patient_id LIKE 'PAT-%';
    end_time := clock_timestamp();
    
    RETURN QUERY SELECT 
        'Patient Lookup by ID'::TEXT,
        EXTRACT(MILLISECONDS FROM (end_time - start_time)),
        row_count,
        CASE WHEN EXTRACT(MILLISECONDS FROM (end_time - start_time)) < 100 THEN 'SUCCESS' ELSE 'WARNING' END;
    
    -- Test 2: Doctor search by department
    start_time := clock_timestamp();
    SELECT COUNT(*) INTO row_count 
    FROM doctor_profiles dp 
    JOIN departments d ON dp.department_id = d.id 
    WHERE d.is_active = true;
    end_time := clock_timestamp();
    
    RETURN QUERY SELECT 
        'Doctor Search by Department'::TEXT,
        EXTRACT(MILLISECONDS FROM (end_time - start_time)),
        row_count,
        CASE WHEN EXTRACT(MILLISECONDS FROM (end_time - start_time)) < 200 THEN 'SUCCESS' ELSE 'WARNING' END;
    
    -- Test 3: Appointment date range query
    start_time := clock_timestamp();
    SELECT COUNT(*) INTO row_count 
    FROM appointments 
    WHERE appointment_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days';
    end_time := clock_timestamp();
    
    RETURN QUERY SELECT 
        'Appointment Date Range Query'::TEXT,
        EXTRACT(MILLISECONDS FROM (end_time - start_time)),
        row_count,
        CASE WHEN EXTRACT(MILLISECONDS FROM (end_time - start_time)) < 150 THEN 'SUCCESS' ELSE 'WARNING' END;
    
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. FUNCTIONAL TESTING
-- ============================================================================

-- Test CRUD operations
CREATE OR REPLACE FUNCTION phase1_testing.test_crud_operations()
RETURNS TABLE(
    operation TEXT,
    table_name TEXT,
    result TEXT,
    status TEXT
) AS $$
DECLARE
    test_profile_id UUID;
    test_dept_id UUID;
    test_patient_id TEXT;
    test_doctor_id TEXT;
    test_appointment_id TEXT;
BEGIN
    -- Get test data
    SELECT id INTO test_profile_id FROM profiles WHERE role = 'patient' LIMIT 1;
    SELECT id INTO test_dept_id FROM departments LIMIT 1;
    
    -- Test patient creation
    BEGIN
        INSERT INTO patient_profiles (user_id, blood_type, status) 
        VALUES (test_profile_id, 'O+', 'active')
        RETURNING patient_id INTO test_patient_id;
        
        RETURN QUERY SELECT 'CREATE'::TEXT, 'patient_profiles'::TEXT, 'ID: ' || test_patient_id, 'SUCCESS'::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'CREATE'::TEXT, 'patient_profiles'::TEXT, 'ERROR: ' || SQLERRM, 'FAILED'::TEXT;
    END;
    
    -- Test patient update
    BEGIN
        UPDATE patient_profiles 
        SET blood_type = 'A+' 
        WHERE patient_id = test_patient_id;
        
        RETURN QUERY SELECT 'UPDATE'::TEXT, 'patient_profiles'::TEXT, 'Blood type updated', 'SUCCESS'::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'UPDATE'::TEXT, 'patient_profiles'::TEXT, 'ERROR: ' || SQLERRM, 'FAILED'::TEXT;
    END;
    
    -- Test patient read
    BEGIN
        IF EXISTS (SELECT 1 FROM patient_profiles WHERE patient_id = test_patient_id AND blood_type = 'A+') THEN
            RETURN QUERY SELECT 'READ'::TEXT, 'patient_profiles'::TEXT, 'Data retrieved correctly', 'SUCCESS'::TEXT;
        ELSE
            RETURN QUERY SELECT 'READ'::TEXT, 'patient_profiles'::TEXT, 'Data not found or incorrect', 'FAILED'::TEXT;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'READ'::TEXT, 'patient_profiles'::TEXT, 'ERROR: ' || SQLERRM, 'FAILED'::TEXT;
    END;
    
    -- Clean up test data
    DELETE FROM patient_profiles WHERE patient_id = test_patient_id;
    
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. COMPREHENSIVE TEST SUITE EXECUTION
-- ============================================================================

-- Master test function
CREATE OR REPLACE FUNCTION phase1_testing.run_comprehensive_tests()
RETURNS TABLE(
    test_category TEXT,
    test_name TEXT,
    result TEXT,
    status TEXT,
    timestamp TIMESTAMPTZ
) AS $$
BEGIN
    -- Table structure validation
    RETURN QUERY 
    SELECT 
        'Table Structure'::TEXT,
        t.table_name,
        'Columns: ' || t.column_count || ', Constraints: ' || t.constraint_count,
        t.status,
        NOW()
    FROM phase1_testing.validate_table_structure() t;
    
    -- ID generation testing
    RETURN QUERY 
    SELECT 
        'ID Generation'::TEXT,
        t.test_name,
        t.generated_id,
        t.status,
        NOW()
    FROM phase1_testing.test_id_generation() t;
    
    -- Data integrity testing
    RETURN QUERY 
    SELECT 
        'Data Integrity'::TEXT,
        t.test_name,
        t.test_result,
        t.status,
        NOW()
    FROM phase1_testing.test_data_integrity() t;
    
    -- Performance testing
    RETURN QUERY 
    SELECT 
        'Performance'::TEXT,
        t.query_name,
        t.execution_time_ms || 'ms (' || t.rows_returned || ' rows)',
        t.status,
        NOW()
    FROM phase1_testing.test_query_performance() t;
    
    -- CRUD operations testing
    RETURN QUERY 
    SELECT 
        'CRUD Operations'::TEXT,
        t.operation || ' - ' || t.table_name,
        t.result,
        t.status,
        NOW()
    FROM phase1_testing.test_crud_operations() t;
    
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. EXECUTE COMPREHENSIVE TEST SUITE
-- ============================================================================

-- Run all tests and display results
SELECT 
    test_category,
    test_name,
    result,
    status,
    timestamp
FROM phase1_testing.run_comprehensive_tests()
ORDER BY test_category, test_name;

-- ============================================================================
-- 9. TEST SUMMARY REPORT
-- ============================================================================

-- Generate test summary
SELECT 
    test_category,
    COUNT(*) as total_tests,
    COUNT(*) FILTER (WHERE status = 'SUCCESS') as passed,
    COUNT(*) FILTER (WHERE status = 'FAILED') as failed,
    COUNT(*) FILTER (WHERE status = 'WARNING') as warnings,
    ROUND(
        (COUNT(*) FILTER (WHERE status = 'SUCCESS')::DECIMAL / COUNT(*)::DECIMAL) * 100, 
        2
    ) as success_rate
FROM phase1_testing.run_comprehensive_tests()
GROUP BY test_category
ORDER BY test_category;

-- Overall summary
SELECT 
    'OVERALL' as category,
    COUNT(*) as total_tests,
    COUNT(*) FILTER (WHERE status = 'SUCCESS') as passed,
    COUNT(*) FILTER (WHERE status = 'FAILED') as failed,
    COUNT(*) FILTER (WHERE status = 'WARNING') as warnings,
    ROUND(
        (COUNT(*) FILTER (WHERE status = 'SUCCESS')::DECIMAL / COUNT(*)::DECIMAL) * 100, 
        2
    ) as success_rate
FROM phase1_testing.run_comprehensive_tests();

-- ============================================================================
-- 10. FINAL VALIDATION
-- ============================================================================

DO $$
DECLARE
    failed_tests INTEGER;
    total_tests INTEGER;
    success_rate DECIMAL;
BEGIN
    SELECT 
        COUNT(*) FILTER (WHERE status = 'FAILED'),
        COUNT(*),
        ROUND((COUNT(*) FILTER (WHERE status = 'SUCCESS')::DECIMAL / COUNT(*)::DECIMAL) * 100, 2)
    INTO failed_tests, total_tests, success_rate
    FROM phase1_testing.run_comprehensive_tests();
    
    RAISE NOTICE '=== PHASE 1 TESTING SUMMARY ===';
    RAISE NOTICE 'Total Tests: %', total_tests;
    RAISE NOTICE 'Failed Tests: %', failed_tests;
    RAISE NOTICE 'Success Rate: %%%', success_rate;
    
    IF failed_tests > 0 THEN
        RAISE WARNING 'PHASE 1 TESTING FAILED! % tests failed. Review test results above.', failed_tests;
    ELSIF success_rate >= 95 THEN
        RAISE NOTICE 'PHASE 1 TESTING PASSED! Success rate: %%%. Ready for Phase 2.', success_rate;
    ELSE
        RAISE WARNING 'PHASE 1 TESTING PARTIAL! Success rate: %%%. Review warnings before proceeding.', success_rate;
    END IF;
END $$;
