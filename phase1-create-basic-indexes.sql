-- ============================================================================
-- PHASE 1: CREATE BASIC INDEXES FOR PERFORMANCE
-- Hospital Management System - Database Redesign
-- ============================================================================
-- This script creates essential indexes for optimal query performance
-- Execute AFTER all tables and functions are created

-- ============================================================================
-- 1. PROFILES TABLE INDEXES
-- ============================================================================

-- Primary lookup indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role_active ON profiles(role) WHERE is_active = true;
CREATE INDEX idx_profiles_phone ON profiles(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_profiles_last_login ON profiles(last_login_at DESC) WHERE last_login_at IS NOT NULL;

-- Full-text search for names
CREATE INDEX idx_profiles_fulltext ON profiles USING gin(to_tsvector('vietnamese', full_name));

-- Composite indexes for common queries
CREATE INDEX idx_profiles_role_email ON profiles(role, email) WHERE is_active = true;

-- ============================================================================
-- 2. DEPARTMENTS TABLE INDEXES
-- ============================================================================

-- Primary lookup indexes
CREATE INDEX idx_departments_department_id ON departments(department_id);
CREATE INDEX idx_departments_active ON departments(is_active) WHERE is_active = true;
CREATE INDEX idx_departments_parent ON departments(parent_department_id) WHERE parent_department_id IS NOT NULL;
CREATE INDEX idx_departments_head_doctor ON departments(head_doctor_id) WHERE head_doctor_id IS NOT NULL;

-- Full-text search for department names
CREATE INDEX idx_departments_fulltext_vi ON departments USING gin(to_tsvector('vietnamese', name_vi));
CREATE INDEX idx_departments_fulltext_en ON departments USING gin(to_tsvector('english', name));

-- ============================================================================
-- 3. PATIENT PROFILES TABLE INDEXES
-- ============================================================================

-- Primary lookup indexes
CREATE INDEX idx_patient_profiles_user_id ON patient_profiles(user_id);
CREATE INDEX idx_patient_profiles_patient_id ON patient_profiles(patient_id);
CREATE INDEX idx_patient_profiles_status_active ON patient_profiles(status) WHERE status = 'active';

-- Medical information indexes
CREATE INDEX idx_patient_profiles_blood_type ON patient_profiles(blood_type) WHERE blood_type IS NOT NULL;
CREATE INDEX idx_patient_profiles_insurance_valid ON patient_profiles(insurance_type, insurance_valid_to) 
    WHERE insurance_valid_to >= CURRENT_DATE;

-- JSONB indexes for structured data
CREATE INDEX idx_patient_profiles_allergies ON patient_profiles USING gin(allergies);
CREATE INDEX idx_patient_profiles_chronic_conditions ON patient_profiles USING gin(chronic_conditions);
CREATE INDEX idx_patient_profiles_emergency_contact ON patient_profiles USING gin(emergency_contact);
CREATE INDEX idx_patient_profiles_address ON patient_profiles USING gin(address);

-- Composite indexes for common queries
CREATE INDEX idx_patient_profiles_status_created ON patient_profiles(status, created_at DESC);

-- ============================================================================
-- 4. DOCTOR PROFILES TABLE INDEXES
-- ============================================================================

-- Primary lookup indexes
CREATE INDEX idx_doctor_profiles_user_id ON doctor_profiles(user_id);
CREATE INDEX idx_doctor_profiles_doctor_id ON doctor_profiles(doctor_id);
CREATE INDEX idx_doctor_profiles_license_number ON doctor_profiles(license_number);

-- Department and specialization indexes
CREATE INDEX idx_doctor_profiles_dept_active ON doctor_profiles(department_id, status) WHERE status = 'active';
CREATE INDEX idx_doctor_profiles_specialization ON doctor_profiles(primary_specialization);
CREATE INDEX idx_doctor_profiles_available ON doctor_profiles(is_available, status) 
    WHERE is_available = true AND status = 'active';

-- Performance metrics indexes
CREATE INDEX idx_doctor_profiles_rating ON doctor_profiles(average_rating DESC) WHERE average_rating > 0;
CREATE INDEX idx_doctor_profiles_experience ON doctor_profiles(years_of_experience DESC);

-- JSONB indexes
CREATE INDEX idx_doctor_profiles_sub_specializations ON doctor_profiles USING gin(sub_specializations);
CREATE INDEX idx_doctor_profiles_board_certifications ON doctor_profiles USING gin(board_certifications);
CREATE INDEX idx_doctor_profiles_languages ON doctor_profiles USING gin(languages_spoken);
CREATE INDEX idx_doctor_profiles_working_hours ON doctor_profiles USING gin(working_hours);

-- Composite indexes for common queries
CREATE INDEX idx_doctor_profiles_dept_specialization ON doctor_profiles(department_id, primary_specialization);
CREATE INDEX idx_doctor_profiles_available_rating ON doctor_profiles(is_available, average_rating DESC) 
    WHERE is_available = true AND status = 'active';

-- ============================================================================
-- 5. APPOINTMENTS TABLE INDEXES
-- ============================================================================

-- Primary lookup indexes
CREATE INDEX idx_appointments_appointment_id ON appointments(appointment_id);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);

-- Date and time indexes
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_datetime ON appointments(appointment_datetime);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Composite indexes for common queries
CREATE INDEX idx_appointments_patient_status_date ON appointments(patient_id, status, appointment_date) 
    WHERE status IN ('scheduled', 'confirmed');
CREATE INDEX idx_appointments_doctor_date_time ON appointments(doctor_id, appointment_date, appointment_time);
CREATE INDEX idx_appointments_upcoming ON appointments(doctor_id, appointment_date, appointment_time) 
    WHERE appointment_date >= CURRENT_DATE AND status IN ('scheduled', 'confirmed');
CREATE INDEX idx_appointments_department_date ON appointments(department_id, appointment_date) 
    WHERE appointment_date >= CURRENT_DATE;

-- Payment and status tracking indexes
CREATE INDEX idx_appointments_payment_status ON appointments(payment_status) WHERE payment_status != 'paid';
CREATE INDEX idx_appointments_reminder_pending ON appointments(reminder_sent, appointment_date) 
    WHERE reminder_sent = false AND appointment_date >= CURRENT_DATE;

-- JSONB indexes
CREATE INDEX idx_appointments_symptoms ON appointments USING gin(symptoms);
CREATE INDEX idx_appointments_required_equipment ON appointments USING gin(required_equipment);

-- ============================================================================
-- 6. MEDICAL RECORDS TABLE INDEXES
-- ============================================================================

-- Primary lookup indexes
CREATE INDEX idx_medical_records_record_id ON medical_records(record_id);
CREATE INDEX idx_medical_records_patient_date ON medical_records(patient_id, encounter_date DESC);
CREATE INDEX idx_medical_records_practitioner_date ON medical_records(practitioner_id, encounter_date DESC);
CREATE INDEX idx_medical_records_encounter_id ON medical_records(encounter_id) WHERE encounter_id IS NOT NULL;

-- Status and type indexes
CREATE INDEX idx_medical_records_status ON medical_records(status) WHERE status IN ('preliminary', 'final');
CREATE INDEX idx_medical_records_encounter_type ON medical_records(encounter_type, encounter_date);

-- JSONB indexes for medical data
CREATE INDEX idx_medical_records_primary_diagnosis ON medical_records USING gin((primary_diagnosis->>'code'));
CREATE INDEX idx_medical_records_secondary_diagnoses ON medical_records USING gin(secondary_diagnoses);
CREATE INDEX idx_medical_records_procedures ON medical_records USING gin(procedures);
CREATE INDEX idx_medical_records_medications ON medical_records USING gin(medications);
CREATE INDEX idx_medical_records_vital_signs ON medical_records USING gin(vital_signs);
CREATE INDEX idx_medical_records_billing_codes ON medical_records USING gin(billing_codes);

-- Composite indexes for common queries
CREATE INDEX idx_medical_records_patient_status_date ON medical_records(patient_id, status, encounter_date DESC);
CREATE INDEX idx_medical_records_practitioner_type_date ON medical_records(practitioner_id, encounter_type, encounter_date DESC);

-- ============================================================================
-- 7. MEDICAL TERMINOLOGY INDEXES
-- ============================================================================

-- Medical terminology systems
CREATE INDEX idx_medical_terminology_systems_code ON medical_terminology_systems(system_code);
CREATE INDEX idx_medical_terminology_systems_active ON medical_terminology_systems(is_active) WHERE is_active = true;

-- Medical codes
CREATE INDEX idx_medical_codes_system_code ON medical_codes(system_id, code);
CREATE INDEX idx_medical_codes_status ON medical_codes(status) WHERE status = 'active';
CREATE INDEX idx_medical_codes_parent ON medical_codes(parent_code) WHERE parent_code IS NOT NULL;

-- Full-text search for medical codes
CREATE INDEX idx_medical_codes_fulltext_vi ON medical_codes USING gin(
    to_tsvector('vietnamese', display_name_vi || ' ' || COALESCE(definition_vi, ''))
);
CREATE INDEX idx_medical_codes_fulltext_en ON medical_codes USING gin(
    to_tsvector('english', display_name || ' ' || COALESCE(definition, ''))
);

-- ============================================================================
-- 8. FHIR RESOURCES INDEXES
-- ============================================================================

-- FHIR resources
CREATE INDEX idx_fhir_resources_type_logical_id ON fhir_resources(resource_type, logical_id);
CREATE INDEX idx_fhir_resources_internal_mapping ON fhir_resources(internal_table, internal_id) 
    WHERE internal_table IS NOT NULL AND internal_id IS NOT NULL;
CREATE INDEX idx_fhir_resources_validation_status ON fhir_resources(validation_status) 
    WHERE validation_status != 'valid';

-- JSONB indexes for FHIR content
CREATE INDEX idx_fhir_resources_content ON fhir_resources USING gin(resource_content);
CREATE INDEX idx_fhir_resources_security_labels ON fhir_resources USING gin(security_labels);

-- ============================================================================
-- 9. INDEX VERIFICATION AND STATISTICS
-- ============================================================================

-- Create index verification function
CREATE OR REPLACE FUNCTION verify_basic_indexes()
RETURNS TABLE(
    table_name TEXT,
    index_count BIGINT,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name,
        COUNT(i.indexname) as index_count,
        CASE 
            WHEN COUNT(i.indexname) >= 3 THEN 'GOOD'
            WHEN COUNT(i.indexname) >= 1 THEN 'BASIC'
            ELSE 'MISSING'
        END as status
    FROM (VALUES
        ('profiles'),
        ('departments'),
        ('patient_profiles'),
        ('doctor_profiles'),
        ('appointments'),
        ('medical_records'),
        ('medical_codes'),
        ('fhir_resources')
    ) AS t(table_name)
    LEFT JOIN pg_indexes i ON i.tablename = t.table_name AND i.schemaname = 'public'
    GROUP BY t.table_name
    ORDER BY t.table_name;
END;
$$ LANGUAGE plpgsql;

-- Display index verification report
SELECT * FROM verify_basic_indexes();

-- ============================================================================
-- 10. INDEX USAGE STATISTICS (for monitoring)
-- ============================================================================

-- Create function to monitor index usage
CREATE OR REPLACE FUNCTION get_index_usage_stats()
RETURNS TABLE(
    schemaname TEXT,
    tablename TEXT,
    indexname TEXT,
    idx_scan BIGINT,
    idx_tup_read BIGINT,
    idx_tup_fetch BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.schemaname,
        s.relname as tablename,
        s.indexrelname as indexname,
        s.idx_scan,
        s.idx_tup_read,
        s.idx_tup_fetch
    FROM pg_stat_user_indexes s
    WHERE s.schemaname = 'public'
    ORDER BY s.idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 11. COMPLETION VERIFICATION
-- ============================================================================

DO $$
DECLARE
    total_indexes INTEGER;
    expected_min_indexes INTEGER := 50; -- Minimum expected indexes
BEGIN
    SELECT COUNT(*) INTO total_indexes
    FROM pg_indexes
    WHERE schemaname = 'public';
    
    IF total_indexes < expected_min_indexes THEN
        RAISE WARNING 'Index count (%) is below expected minimum (%). Some indexes may be missing.', 
            total_indexes, expected_min_indexes;
    ELSE
        RAISE NOTICE 'SUCCESS: % indexes created successfully. Performance optimization complete.', total_indexes;
    END IF;
END $$;

RAISE NOTICE 'Basic indexing strategy implemented successfully!';
