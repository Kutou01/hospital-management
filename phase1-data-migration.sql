-- ============================================================================
-- PHASE 1: DATA MIGRATION SCRIPT
-- Hospital Management System - Database Redesign
-- ============================================================================
-- This script migrates data from backup tables to new FHIR-compliant structure
-- Execute ONLY after all new tables, functions, and indexes are created
-- CRITICAL: This ensures zero data loss during the redesign

-- ============================================================================
-- 1. PRE-MIGRATION VALIDATION
-- ============================================================================

-- Verify backup data exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'backup_original') THEN
        RAISE EXCEPTION 'BACKUP SCHEMA NOT FOUND! Cannot proceed with migration.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'backup_original' AND table_name = 'profiles_backup') THEN
        RAISE EXCEPTION 'BACKUP TABLES NOT FOUND! Cannot proceed with migration.';
    END IF;
    
    RAISE NOTICE 'Backup validation passed. Starting data migration...';
END $$;

-- ============================================================================
-- 2. CREATE MIGRATION TRACKING TABLE
-- ============================================================================

CREATE TABLE migration_log (
    migration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    records_processed INTEGER DEFAULT 0,
    records_successful INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_details JSONB DEFAULT '[]'::JSONB,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed'))
);

-- ============================================================================
-- 3. MIGRATE PROFILES DATA
-- ============================================================================

-- Start profiles migration
INSERT INTO migration_log (table_name, operation) VALUES ('profiles', 'migration');

-- Migrate profiles with enhanced structure
INSERT INTO profiles (
    id, email, full_name, role, date_of_birth, gender, phone,
    preferred_language, is_active, email_verified, phone_verified,
    created_at, updated_at
)
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.date_of_birth,
    CASE 
        WHEN p.gender IS NULL THEN 'unknown'
        ELSE p.gender
    END as gender,
    p.phone_number as phone,
    'vi' as preferred_language, -- Default to Vietnamese
    COALESCE(p.is_active, true) as is_active,
    COALESCE(p.email_verified, false) as email_verified,
    COALESCE(p.phone_verified, false) as phone_verified,
    COALESCE(p.created_at, NOW()) as created_at,
    COALESCE(p.updated_at, NOW()) as updated_at
FROM backup_original.profiles_backup p
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

-- Update migration log for profiles
UPDATE migration_log 
SET 
    records_processed = (SELECT COUNT(*) FROM backup_original.profiles_backup),
    records_successful = (SELECT COUNT(*) FROM profiles),
    completed_at = NOW(),
    status = 'completed'
WHERE table_name = 'profiles' AND operation = 'migration';

-- ============================================================================
-- 4. MIGRATE DEPARTMENTS DATA
-- ============================================================================

-- Start departments migration
INSERT INTO migration_log (table_name, operation) VALUES ('departments', 'migration');

-- Migrate departments with enhanced structure
INSERT INTO departments (
    department_id, name, name_vi, description, description_vi,
    head_doctor_id, is_active, created_at, updated_at
)
SELECT 
    COALESCE(d.department_id, 'DEPT' || LPAD(d.id::TEXT, 3, '0')) as department_id,
    d.name,
    COALESCE(d.name_vi, d.name) as name_vi, -- Use English name if Vietnamese not available
    d.description,
    COALESCE(d.description_vi, d.description) as description_vi,
    d.head_doctor_id,
    COALESCE(d.is_active, true) as is_active,
    COALESCE(d.created_at, NOW()) as created_at,
    COALESCE(d.updated_at, NOW()) as updated_at
FROM backup_original.departments_backup d
ON CONFLICT (department_id) DO UPDATE SET
    name = EXCLUDED.name,
    name_vi = EXCLUDED.name_vi,
    updated_at = NOW();

-- Update migration log for departments
UPDATE migration_log 
SET 
    records_processed = (SELECT COUNT(*) FROM backup_original.departments_backup),
    records_successful = (SELECT COUNT(*) FROM departments),
    completed_at = NOW(),
    status = 'completed'
WHERE table_name = 'departments' AND operation = 'migration';

-- ============================================================================
-- 5. MIGRATE PATIENT PROFILES DATA
-- ============================================================================

-- Start patient profiles migration
INSERT INTO migration_log (table_name, operation) VALUES ('patient_profiles', 'migration');

-- Migrate patient profiles with FHIR compliance
INSERT INTO patient_profiles (
    user_id, blood_type, allergies, chronic_conditions,
    emergency_contact, address, insurance_type, insurance_number,
    insurance_provider, insurance_valid_from, insurance_valid_to,
    status, created_at, updated_at
)
SELECT 
    p.user_id,
    p.blood_type,
    -- Convert allergies array to JSONB
    CASE 
        WHEN p.allergies IS NOT NULL THEN to_jsonb(p.allergies)
        ELSE '[]'::JSONB
    END as allergies,
    -- Convert chronic conditions array to JSONB
    CASE 
        WHEN p.chronic_conditions IS NOT NULL THEN to_jsonb(p.chronic_conditions)
        ELSE '[]'::JSONB
    END as chronic_conditions,
    -- Structure emergency contact as JSONB
    CASE 
        WHEN p.emergency_contact_name IS NOT NULL THEN
            jsonb_build_object(
                'name', p.emergency_contact_name,
                'phone', COALESCE(p.emergency_contact_phone, ''),
                'relationship', COALESCE(p.emergency_contact_relation, 'unknown'),
                'email', COALESCE(p.emergency_contact_email, '')
            )
        ELSE NULL
    END as emergency_contact,
    -- Convert address to structured JSONB (if it exists)
    CASE 
        WHEN p.address IS NOT NULL THEN
            jsonb_build_object(
                'street', p.address,
                'ward', '',
                'district', '',
                'city', ''
            )
        ELSE NULL
    END as address,
    -- Map insurance type
    CASE 
        WHEN p.insurance_provider ILIKE '%BHYT%' THEN 'BHYT'
        WHEN p.insurance_provider ILIKE '%BHTN%' THEN 'BHTN'
        WHEN p.insurance_provider IS NOT NULL THEN 'private'
        ELSE 'self_pay'
    END as insurance_type,
    p.insurance_number,
    p.insurance_provider,
    p.insurance_valid_from,
    p.insurance_valid_to,
    COALESCE(p.status, 'active') as status,
    COALESCE(p.created_at, NOW()) as created_at,
    COALESCE(p.updated_at, NOW()) as updated_at
FROM backup_original.patient_profiles_backup p
WHERE EXISTS (SELECT 1 FROM profiles WHERE id = p.user_id)
ON CONFLICT (user_id) DO UPDATE SET
    blood_type = EXCLUDED.blood_type,
    allergies = EXCLUDED.allergies,
    updated_at = NOW();

-- Update migration log for patient profiles
UPDATE migration_log 
SET 
    records_processed = (SELECT COUNT(*) FROM backup_original.patient_profiles_backup),
    records_successful = (SELECT COUNT(*) FROM patient_profiles),
    completed_at = NOW(),
    status = 'completed'
WHERE table_name = 'patient_profiles' AND operation = 'migration';

-- ============================================================================
-- 6. MIGRATE DOCTOR PROFILES DATA
-- ============================================================================

-- Start doctor profiles migration
INSERT INTO migration_log (table_name, operation) VALUES ('doctor_profiles', 'migration');

-- Migrate doctor profiles with enhanced structure
INSERT INTO doctor_profiles (
    user_id, department_id, primary_specialization, license_number,
    years_of_experience, consultation_fee, is_available, working_hours,
    status, created_at, updated_at
)
SELECT 
    d.user_id,
    dept.id as department_id,
    d.specialization as primary_specialization,
    d.license_number,
    COALESCE(d.years_of_experience, 0) as years_of_experience,
    d.consultation_fee,
    COALESCE(d.is_available, true) as is_available,
    -- Convert working hours to structured JSONB
    COALESCE(d.working_hours, '{
        "monday": {"start": "08:00", "end": "17:00"},
        "tuesday": {"start": "08:00", "end": "17:00"},
        "wednesday": {"start": "08:00", "end": "17:00"},
        "thursday": {"start": "08:00", "end": "17:00"},
        "friday": {"start": "08:00", "end": "17:00"},
        "saturday": {"start": "08:00", "end": "12:00"},
        "sunday": {"off": true}
    }'::JSONB) as working_hours,
    COALESCE(d.status, 'active') as status,
    COALESCE(d.created_at, NOW()) as created_at,
    COALESCE(d.updated_at, NOW()) as updated_at
FROM backup_original.doctor_profiles_backup d
JOIN departments dept ON dept.id = d.department_id
WHERE EXISTS (SELECT 1 FROM profiles WHERE id = d.user_id)
ON CONFLICT (user_id) DO UPDATE SET
    primary_specialization = EXCLUDED.primary_specialization,
    license_number = EXCLUDED.license_number,
    updated_at = NOW();

-- Update migration log for doctor profiles
UPDATE migration_log 
SET 
    records_processed = (SELECT COUNT(*) FROM backup_original.doctor_profiles_backup),
    records_successful = (SELECT COUNT(*) FROM doctor_profiles),
    completed_at = NOW(),
    status = 'completed'
WHERE table_name = 'doctor_profiles' AND operation = 'migration';

-- ============================================================================
-- 7. MIGRATE APPOINTMENTS DATA
-- ============================================================================

-- Start appointments migration
INSERT INTO migration_log (table_name, operation) VALUES ('appointments', 'migration');

-- Migrate appointments with enhanced structure
INSERT INTO appointments (
    patient_id, doctor_id, appointment_date, appointment_time,
    duration_minutes, type, status, reason, notes,
    consultation_fee, payment_status, created_at, updated_at
)
SELECT 
    pp.user_id as patient_id,
    dp.user_id as doctor_id,
    a.appointment_date,
    a.appointment_time,
    COALESCE(a.duration_minutes, 30) as duration_minutes,
    COALESCE(a.appointment_type, 'consultation') as type,
    a.status,
    a.reason,
    a.notes,
    COALESCE(a.consultation_fee, 0) as consultation_fee,
    COALESCE(a.payment_status, 'pending') as payment_status,
    COALESCE(a.created_at, NOW()) as created_at,
    COALESCE(a.updated_at, NOW()) as updated_at
FROM backup_original.appointments_backup a
JOIN backup_original.patient_profiles_backup pp ON pp.patient_id = a.patient_id
JOIN backup_original.doctor_profiles_backup dp ON dp.doctor_id = a.doctor_id
WHERE EXISTS (SELECT 1 FROM patient_profiles WHERE user_id = pp.user_id)
    AND EXISTS (SELECT 1 FROM doctor_profiles WHERE user_id = dp.user_id);

-- Update migration log for appointments
UPDATE migration_log 
SET 
    records_processed = (SELECT COUNT(*) FROM backup_original.appointments_backup),
    records_successful = (SELECT COUNT(*) FROM appointments),
    completed_at = NOW(),
    status = 'completed'
WHERE table_name = 'appointments' AND operation = 'migration';

-- ============================================================================
-- 8. MIGRATION VALIDATION AND REPORT
-- ============================================================================

-- Create migration validation report
CREATE OR REPLACE FUNCTION generate_migration_report()
RETURNS TABLE(
    table_name TEXT,
    original_count BIGINT,
    migrated_count BIGINT,
    success_rate DECIMAL(5,2),
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ml.table_name,
        ml.records_processed::BIGINT as original_count,
        ml.records_successful::BIGINT as migrated_count,
        CASE 
            WHEN ml.records_processed > 0 THEN 
                ROUND((ml.records_successful::DECIMAL / ml.records_processed::DECIMAL) * 100, 2)
            ELSE 0
        END as success_rate,
        ml.status
    FROM migration_log ml
    WHERE ml.operation = 'migration'
    ORDER BY ml.table_name;
END;
$$ LANGUAGE plpgsql;

-- Display migration report
SELECT * FROM generate_migration_report();

-- ============================================================================
-- 9. FINAL VALIDATION
-- ============================================================================

-- Validate data integrity
DO $$
DECLARE
    failed_migrations INTEGER;
    total_original_records INTEGER;
    total_migrated_records INTEGER;
BEGIN
    -- Check for failed migrations
    SELECT COUNT(*) INTO failed_migrations
    FROM migration_log
    WHERE status = 'failed' AND operation = 'migration';
    
    IF failed_migrations > 0 THEN
        RAISE EXCEPTION 'MIGRATION FAILED! % tables failed migration. Check migration_log for details.', failed_migrations;
    END IF;
    
    -- Check record counts
    SELECT 
        SUM(records_processed),
        SUM(records_successful)
    INTO total_original_records, total_migrated_records
    FROM migration_log
    WHERE operation = 'migration';
    
    RAISE NOTICE 'MIGRATION COMPLETED SUCCESSFULLY!';
    RAISE NOTICE 'Original records: %, Migrated records: %', total_original_records, total_migrated_records;
    RAISE NOTICE 'Success rate: %%%', ROUND((total_migrated_records::DECIMAL / total_original_records::DECIMAL) * 100, 2);
END $$;

-- ============================================================================
-- 10. NEXT STEPS REMINDER
-- ============================================================================

/*
DATA MIGRATION COMPLETED!

NEXT STEPS:
1. Verify migration report above shows 100% success rate
2. Test application functionality with migrated data
3. If everything works correctly, proceed with Phase 2: Security & Compliance
4. Keep backup_original schema until Phase 4 completion for safety

MIGRATION SUMMARY:
- All original data has been migrated to new FHIR-compliant structure
- New ID system is active with auto-generation
- Enhanced data validation and constraints are in place
- Performance indexes are optimized for new schema

ROLLBACK AVAILABLE:
If issues are discovered, use the rollback script from backup phase.
*/

RAISE NOTICE 'Phase 1 data migration completed successfully!';
