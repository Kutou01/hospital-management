-- ============================================================================
-- HOSPITAL MANAGEMENT SYSTEM - DEPARTMENT-BASED ID FUNCTIONS
-- ============================================================================
-- This script creates all necessary database functions for department-based ID generation
-- Format: DEPT_CODE-ENTITY-YYYYMM-XXX
-- Example: CARD-DOC-202506-001

-- STEP 1: DROP EXISTING FUNCTIONS
-- =====================================================
DROP FUNCTION IF EXISTS generate_doctor_id();
DROP FUNCTION IF EXISTS generate_doctor_id(TEXT);
DROP FUNCTION IF EXISTS generate_patient_id();
DROP FUNCTION IF EXISTS generate_admin_id();
DROP FUNCTION IF EXISTS generate_appointment_id(TEXT);
DROP FUNCTION IF EXISTS generate_medical_record_id(TEXT);
DROP FUNCTION IF EXISTS generate_prescription_id(TEXT);
DROP FUNCTION IF EXISTS get_department_code(TEXT);
DROP FUNCTION IF EXISTS generate_hospital_id(TEXT, TEXT);

-- STEP 2: CREATE DEPARTMENT CODE MAPPING FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION get_department_code(dept_id TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN CASE dept_id
        WHEN 'DEPT001' THEN 'CARD'  -- Cardiology
        WHEN 'DEPT002' THEN 'ORTH'  -- Orthopedics
        WHEN 'DEPT003' THEN 'PEDI'  -- Pediatrics
        WHEN 'DEPT004' THEN 'NEUR'  -- Neurology
        WHEN 'DEPT005' THEN 'DERM'  -- Dermatology
        WHEN 'DEPT006' THEN 'OBGY'  -- Obstetrics & Gynecology
        WHEN 'DEPT007' THEN 'EMER'  -- Emergency
        WHEN 'DEPT008' THEN 'INTE'  -- Internal Medicine
        WHEN 'DEPT009' THEN 'SURG'  -- Surgery
        WHEN 'DEPT010' THEN 'OPHT'  -- Ophthalmology
        WHEN 'DEPT011' THEN 'OTOL'  -- Otolaryngology
        WHEN 'DEPT012' THEN 'PSYC'  -- Psychiatry
        ELSE 'GEN'  -- General/Unknown
    END;
END;
$$ LANGUAGE plpgsql;

-- STEP 3: CREATE UNIVERSAL ID GENERATION FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION generate_hospital_id(entity_type TEXT, dept_id TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    dept_code TEXT;
    year_month TEXT;
    sequence_name TEXT;
    next_val INTEGER;
    formatted_seq TEXT;
BEGIN
    -- Get current year-month
    year_month := TO_CHAR(NOW(), 'YYYYMM');
    
    -- Generate sequence based on entity type and department
    IF dept_id IS NOT NULL THEN
        dept_code := get_department_code(dept_id);
        sequence_name := LOWER(dept_code || '_' || entity_type || '_seq');
    ELSE
        sequence_name := LOWER(entity_type || '_seq');
    END IF;
    
    -- Create sequence if it doesn't exist
    EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I START 1', sequence_name);
    
    -- Get next value
    EXECUTE format('SELECT nextval(%L)', sequence_name) INTO next_val;
    
    -- Format sequence number (3 digits)
    formatted_seq := LPAD(next_val::TEXT, 3, '0');
    
    -- Return formatted ID
    IF dept_id IS NOT NULL THEN
        RETURN dept_code || '-' || entity_type || '-' || year_month || '-' || formatted_seq;
    ELSE
        RETURN entity_type || '-' || year_month || '-' || formatted_seq;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- STEP 4: CREATE ENTITY-SPECIFIC FUNCTIONS
-- =====================================================

-- Doctor ID Generation (Department-based)
CREATE OR REPLACE FUNCTION generate_doctor_id(dept_id TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN generate_hospital_id('DOC', dept_id);
END;
$$ LANGUAGE plpgsql;

-- Patient ID Generation (Standard)
CREATE OR REPLACE FUNCTION generate_patient_id()
RETURNS TEXT AS $$
BEGIN
    RETURN generate_hospital_id('PAT');
END;
$$ LANGUAGE plpgsql;

-- Admin ID Generation (Standard)
CREATE OR REPLACE FUNCTION generate_admin_id()
RETURNS TEXT AS $$
BEGIN
    RETURN generate_hospital_id('ADM');
END;
$$ LANGUAGE plpgsql;

-- Appointment ID Generation (Department-based)
CREATE OR REPLACE FUNCTION generate_appointment_id(dept_id TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN generate_hospital_id('APT', dept_id);
END;
$$ LANGUAGE plpgsql;

-- Medical Record ID Generation (Department-based)
CREATE OR REPLACE FUNCTION generate_medical_record_id(dept_id TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN generate_hospital_id('MR', dept_id);
END;
$$ LANGUAGE plpgsql;

-- Prescription ID Generation (Department-based)
CREATE OR REPLACE FUNCTION generate_prescription_id(dept_id TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN generate_hospital_id('RX', dept_id);
END;
$$ LANGUAGE plpgsql;

-- STEP 5: VERIFICATION
-- =====================================================
SELECT 'Department-Based ID Functions Created Successfully' as status;

-- Test functions
SELECT 'Testing ID Generation Functions:' as test_header;
SELECT generate_doctor_id('DEPT001') as sample_doctor_id;
SELECT generate_patient_id() as sample_patient_id;
SELECT generate_admin_id() as sample_admin_id;
SELECT generate_appointment_id('DEPT001') as sample_appointment_id;
SELECT generate_medical_record_id('DEPT001') as sample_medical_record_id;
SELECT generate_prescription_id('DEPT001') as sample_prescription_id;
