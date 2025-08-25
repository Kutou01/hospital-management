-- ============================================================================
-- PHASE 1: CREATE ID GENERATION FUNCTIONS
-- Hospital Management System - Database Redesign
-- ============================================================================
-- This script creates the department-based ID generation system
-- Execute AFTER all tables are created

-- ============================================================================
-- 1. PATIENT ID GENERATION (Standard Format: PAT-YYYYMM-XXX)
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_patient_id()
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    counter INTEGER;
    month_year TEXT;
BEGIN
    -- Get current month in YYYYMM format
    SELECT TO_CHAR(NOW(), 'YYYYMM') INTO month_year;
    
    -- Get next sequence number for this month
    SELECT COALESCE(MAX(CAST(SUBSTRING(patient_id FROM 12 FOR 3) AS INTEGER)), 0) + 1
    INTO counter
    FROM patient_profiles
    WHERE patient_id LIKE 'PAT-' || month_year || '-%';
    
    -- Format: PAT-YYYYMM-XXX
    new_id := 'PAT-' || month_year || '-' || LPAD(counter::TEXT, 3, '0');
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. DOCTOR ID GENERATION (Department-Based: DEPT-DOC-YYYYMM-XXX)
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_doctor_id(dept_id UUID)
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    dept_code TEXT;
    counter INTEGER;
    month_year TEXT;
BEGIN
    -- Get department code from departments table
    SELECT UPPER(LEFT(REGEXP_REPLACE(name, '[^A-Za-z]', '', 'g'), 4)) 
    INTO dept_code
    FROM departments WHERE id = dept_id;
    
    IF dept_code IS NULL THEN
        RAISE EXCEPTION 'Department not found for ID: %', dept_id;
    END IF;
    
    -- Ensure 4 characters
    dept_code := RPAD(dept_code, 4, 'X');
    
    -- Get current month in YYYYMM format
    SELECT TO_CHAR(NOW(), 'YYYYMM') INTO month_year;
    
    -- Get next sequence number for this department and month
    SELECT COALESCE(MAX(CAST(SUBSTRING(doctor_id FROM 16 FOR 3) AS INTEGER)), 0) + 1
    INTO counter
    FROM doctor_profiles
    WHERE doctor_id LIKE dept_code || '-DOC-' || month_year || '-%';
    
    -- Format: DEPT-DOC-YYYYMM-XXX
    new_id := dept_code || '-DOC-' || month_year || '-' || LPAD(counter::TEXT, 3, '0');
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. APPOINTMENT ID GENERATION (Department-Based from Doctor)
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_appointment_id(doctor_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    dept_code TEXT;
    counter INTEGER;
    month_year TEXT;
BEGIN
    -- Get department code from doctor
    SELECT SUBSTRING(dp.doctor_id FROM 1 FOR 4) INTO dept_code
    FROM doctor_profiles dp 
    WHERE dp.user_id = doctor_user_id;
    
    IF dept_code IS NULL THEN
        RAISE EXCEPTION 'Doctor not found or invalid doctor ID format';
    END IF;
    
    -- Get current month in YYYYMM format
    SELECT TO_CHAR(NOW(), 'YYYYMM') INTO month_year;
    
    -- Get next sequence number
    SELECT COALESCE(MAX(CAST(SUBSTRING(appointment_id FROM 16 FOR 3) AS INTEGER)), 0) + 1
    INTO counter
    FROM appointments
    WHERE appointment_id LIKE dept_code || '-APT-' || month_year || '-%';
    
    -- Format: DEPT-APT-YYYYMM-XXX
    new_id := dept_code || '-APT-' || month_year || '-' || LPAD(counter::TEXT, 3, '0');
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. MEDICAL RECORD ID GENERATION (Department-Based from Doctor)
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_medical_record_id(practitioner_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    dept_code TEXT;
    counter INTEGER;
    month_year TEXT;
BEGIN
    -- Get department code from practitioner
    SELECT SUBSTRING(dp.doctor_id FROM 1 FOR 4) INTO dept_code
    FROM doctor_profiles dp 
    WHERE dp.user_id = practitioner_user_id;
    
    IF dept_code IS NULL THEN
        RAISE EXCEPTION 'Practitioner not found or invalid doctor ID format';
    END IF;
    
    -- Get current month in YYYYMM format
    SELECT TO_CHAR(NOW(), 'YYYYMM') INTO month_year;
    
    -- Get next sequence number
    SELECT COALESCE(MAX(CAST(SUBSTRING(record_id FROM 13 FOR 3) AS INTEGER)), 0) + 1
    INTO counter
    FROM medical_records
    WHERE record_id LIKE dept_code || '-MR-' || month_year || '-%';
    
    -- Format: DEPT-MR-YYYYMM-XXX
    new_id := dept_code || '-MR-' || month_year || '-' || LPAD(counter::TEXT, 3, '0');
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. AUTO-GENERATION TRIGGERS
-- ============================================================================

-- Updated Timestamp Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Patient ID Auto-Generation Trigger
CREATE OR REPLACE FUNCTION auto_generate_patient_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.patient_id IS NULL THEN
        NEW.patient_id := generate_patient_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Doctor ID Auto-Generation Trigger
CREATE OR REPLACE FUNCTION auto_generate_doctor_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.doctor_id IS NULL THEN
        NEW.doctor_id := generate_doctor_id(NEW.department_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appointment ID Auto-Generation Trigger
CREATE OR REPLACE FUNCTION auto_generate_appointment_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.appointment_id IS NULL THEN
        NEW.appointment_id := generate_appointment_id(NEW.doctor_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Medical Record ID Auto-Generation Trigger
CREATE OR REPLACE FUNCTION auto_generate_medical_record_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.record_id IS NULL THEN
        NEW.record_id := generate_medical_record_id(NEW.practitioner_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. APPLY TRIGGERS TO TABLES
-- ============================================================================

-- Updated timestamp triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_profiles_updated_at BEFORE UPDATE ON patient_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctor_profiles_updated_at BEFORE UPDATE ON doctor_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON medical_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ID generation triggers
CREATE TRIGGER trigger_auto_generate_patient_id
    BEFORE INSERT ON patient_profiles
    FOR EACH ROW EXECUTE FUNCTION auto_generate_patient_id();

CREATE TRIGGER trigger_auto_generate_doctor_id
    BEFORE INSERT ON doctor_profiles
    FOR EACH ROW EXECUTE FUNCTION auto_generate_doctor_id();

CREATE TRIGGER trigger_auto_generate_appointment_id
    BEFORE INSERT ON appointments
    FOR EACH ROW EXECUTE FUNCTION auto_generate_appointment_id();

CREATE TRIGGER trigger_auto_generate_medical_record_id
    BEFORE INSERT ON medical_records
    FOR EACH ROW EXECUTE FUNCTION auto_generate_medical_record_id();

-- ============================================================================
-- 7. FUNCTION VERIFICATION
-- ============================================================================

-- Test ID generation functions
DO $$
DECLARE
    test_dept_id UUID;
    test_user_id UUID;
    patient_id_test TEXT;
    doctor_id_test TEXT;
BEGIN
    -- Get a test department ID
    SELECT id INTO test_dept_id FROM departments LIMIT 1;
    
    IF test_dept_id IS NULL THEN
        RAISE EXCEPTION 'No departments found for testing. Please run department seeding first.';
    END IF;
    
    -- Test patient ID generation
    SELECT generate_patient_id() INTO patient_id_test;
    RAISE NOTICE 'Test Patient ID: %', patient_id_test;
    
    -- Test doctor ID generation
    SELECT generate_doctor_id(test_dept_id) INTO doctor_id_test;
    RAISE NOTICE 'Test Doctor ID: %', doctor_id_test;
    
    -- Validate ID formats
    IF patient_id_test !~ '^PAT-\d{6}-\d{3}$' THEN
        RAISE EXCEPTION 'Patient ID format validation failed: %', patient_id_test;
    END IF;
    
    IF doctor_id_test !~ '^[A-Z]{4}-DOC-\d{6}-\d{3}$' THEN
        RAISE EXCEPTION 'Doctor ID format validation failed: %', doctor_id_test;
    END IF;
    
    RAISE NOTICE 'ID generation functions validated successfully!';
END $$;

-- ============================================================================
-- 8. VERIFICATION REPORT
-- ============================================================================

-- Create function verification report
CREATE OR REPLACE FUNCTION verify_id_functions()
RETURNS TABLE(
    function_name TEXT,
    exists BOOLEAN,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        f.function_name,
        EXISTS(
            SELECT 1 FROM information_schema.routines
            WHERE routine_name = f.function_name
            AND routine_schema = 'public'
        ) as exists,
        CASE 
            WHEN EXISTS(
                SELECT 1 FROM information_schema.routines
                WHERE routine_name = f.function_name
                AND routine_schema = 'public'
            ) THEN 'SUCCESS'
            ELSE 'FAILED'
        END as status
    FROM (VALUES
        ('generate_patient_id'),
        ('generate_doctor_id'),
        ('generate_appointment_id'),
        ('generate_medical_record_id'),
        ('auto_generate_patient_id'),
        ('auto_generate_doctor_id'),
        ('auto_generate_appointment_id'),
        ('auto_generate_medical_record_id'),
        ('update_updated_at_column')
    ) AS f(function_name);
END;
$$ LANGUAGE plpgsql;

-- Display verification report
SELECT * FROM verify_id_functions();

RAISE NOTICE 'ID generation system setup completed successfully!';
