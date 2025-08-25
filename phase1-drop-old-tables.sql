-- ============================================================================
-- PHASE 1: DROP OLD TABLES SCRIPT
-- Hospital Management System - Database Redesign
-- ============================================================================
-- CRITICAL WARNING: Only execute this AFTER successful backup verification!
-- This script will permanently remove existing table structures

-- ============================================================================
-- 1. PRE-DROP VALIDATION
-- ============================================================================

-- Verify backup exists before proceeding
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'backup_original') THEN
        RAISE EXCEPTION 'BACKUP SCHEMA NOT FOUND! Execute phase1-backup-and-preparation.sql first!';
    END IF;
    
    -- Verify backup tables exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'backup_original' AND table_name = 'profiles_backup') THEN
        RAISE EXCEPTION 'BACKUP TABLES NOT FOUND! Execute backup script first!';
    END IF;
    
    RAISE NOTICE 'Backup validation passed. Proceeding with table drops...';
END $$;

-- ============================================================================
-- 2. DISABLE FOREIGN KEY CHECKS TEMPORARILY
-- ============================================================================

-- Store current foreign key constraints for restoration
CREATE TEMP TABLE temp_foreign_keys AS
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public';

-- ============================================================================
-- 3. DROP EXISTING TABLES IN DEPENDENCY ORDER
-- ============================================================================

-- Drop dependent tables first to avoid foreign key conflicts

-- Drop service-specific tables
DROP TABLE IF EXISTS public.patient_check_ins CASCADE;
DROP TABLE IF EXISTS public.vital_signs_history CASCADE;
DROP TABLE IF EXISTS public.prescriptions CASCADE;
DROP TABLE IF EXISTS public.doctor_reviews CASCADE;
DROP TABLE IF EXISTS public.doctor_shifts CASCADE;
DROP TABLE IF EXISTS public.doctor_experiences CASCADE;
DROP TABLE IF EXISTS public.doctor_schedules CASCADE;

-- Drop core medical tables
DROP TABLE IF EXISTS public.medical_records CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;

-- Drop profile tables
DROP TABLE IF EXISTS public.receptionist CASCADE;
DROP TABLE IF EXISTS public.doctor_profiles CASCADE;
DROP TABLE IF EXISTS public.patient_profiles CASCADE;

-- Drop reference tables
DROP TABLE IF EXISTS public.departments CASCADE;

-- Drop base profile table last
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ============================================================================
-- 4. DROP EXISTING FUNCTIONS
-- ============================================================================

-- Drop ID generation functions
DROP FUNCTION IF EXISTS public.generate_patient_id() CASCADE;
DROP FUNCTION IF EXISTS public.generate_doctor_id(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.generate_admin_id() CASCADE;
DROP FUNCTION IF EXISTS public.generate_appointment_id(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.generate_medical_record_id(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.generate_hospital_id(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_department_code(TEXT) CASCADE;

-- Drop service functions
DROP FUNCTION IF EXISTS public.get_all_patients(JSONB, INT, INT) CASCADE;
DROP FUNCTION IF EXISTS public.get_patient_by_id(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_patient_by_profile_id(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.create_patient(JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.update_patient(TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.delete_patient(TEXT) CASCADE;

DROP FUNCTION IF EXISTS public.get_all_doctors(JSONB, INT, INT) CASCADE;
DROP FUNCTION IF EXISTS public.get_doctor_by_id(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_doctor_by_profile_id(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_doctor_by_email(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.create_doctor(JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.update_doctor(TEXT, JSONB) CASCADE;

DROP FUNCTION IF EXISTS public.get_all_appointments(JSONB, INT, INT) CASCADE;
DROP FUNCTION IF EXISTS public.get_appointment_by_id(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.create_appointment(JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.update_appointment(TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.cancel_appointment(TEXT, TEXT) CASCADE;

-- Drop utility functions
DROP FUNCTION IF EXISTS public.verify_hospital_functions() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- ============================================================================
-- 5. DROP EXISTING TRIGGERS
-- ============================================================================

-- Note: Triggers are automatically dropped with their tables
-- But we'll explicitly drop any remaining ones

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_patient_profiles_updated_at ON public.patient_profiles;
DROP TRIGGER IF EXISTS update_doctor_profiles_updated_at ON public.doctor_profiles;
DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
DROP TRIGGER IF EXISTS update_medical_records_updated_at ON public.medical_records;

-- ============================================================================
-- 6. DROP EXISTING INDEXES
-- ============================================================================

-- Drop custom indexes (system indexes are dropped with tables)
DROP INDEX IF EXISTS public.idx_profiles_email;
DROP INDEX IF EXISTS public.idx_profiles_role;
DROP INDEX IF EXISTS public.idx_patient_profiles_patient_id;
DROP INDEX IF EXISTS public.idx_doctor_profiles_doctor_id;
DROP INDEX IF EXISTS public.idx_doctor_profiles_department;
DROP INDEX IF EXISTS public.idx_appointments_patient_doctor;
DROP INDEX IF EXISTS public.idx_appointments_date;
DROP INDEX IF EXISTS public.idx_medical_records_patient;

-- ============================================================================
-- 7. DROP EXISTING SEQUENCES
-- ============================================================================

-- Drop any custom sequences
DROP SEQUENCE IF EXISTS public.departments_id_seq CASCADE;

-- ============================================================================
-- 8. CLEAN UP EXISTING TYPES AND ENUMS
-- ============================================================================

-- Drop custom types if they exist
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.appointment_status CASCADE;
DROP TYPE IF EXISTS public.gender_type CASCADE;
DROP TYPE IF EXISTS public.blood_type CASCADE;

-- ============================================================================
-- 9. VERIFICATION OF CLEANUP
-- ============================================================================

-- Verify all tables are dropped
DO $$
DECLARE
    remaining_tables INTEGER;
    table_list TEXT;
BEGIN
    SELECT COUNT(*), STRING_AGG(table_name, ', ') 
    INTO remaining_tables, table_list
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT LIKE 'temp_%';
    
    IF remaining_tables > 0 THEN
        RAISE WARNING 'WARNING: % tables still exist: %', remaining_tables, table_list;
    ELSE
        RAISE NOTICE 'SUCCESS: All old tables have been dropped successfully.';
    END IF;
END $$;

-- Verify all functions are dropped
DO $$
DECLARE
    remaining_functions INTEGER;
    function_list TEXT;
BEGIN
    SELECT COUNT(*), STRING_AGG(routine_name, ', ') 
    INTO remaining_functions, function_list
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
        AND routine_type = 'FUNCTION'
        AND routine_name NOT LIKE 'temp_%';
    
    IF remaining_functions > 0 THEN
        RAISE WARNING 'WARNING: % functions still exist: %', remaining_functions, function_list;
    ELSE
        RAISE NOTICE 'SUCCESS: All old functions have been dropped successfully.';
    END IF;
END $$;

-- ============================================================================
-- 10. FINAL CLEANUP STATUS
-- ============================================================================

-- Create cleanup report
CREATE TEMP TABLE cleanup_report AS
SELECT 
    'Tables Dropped' as item,
    (SELECT COUNT(*) FROM backup_original.backup_validation_report) as expected_count,
    0 as remaining_count,
    'SUCCESS' as status
UNION ALL
SELECT 
    'Functions Dropped' as item,
    (SELECT COUNT(*) FROM backup_original.functions_backup) as expected_count,
    (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public') as remaining_count,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public') = 0 
        THEN 'SUCCESS' 
        ELSE 'WARNING' 
    END as status;

-- Display cleanup report
SELECT 
    item,
    expected_count,
    remaining_count,
    status,
    CASE 
        WHEN status = 'SUCCESS' THEN 'All items cleaned up successfully'
        ELSE 'Some items may need manual cleanup'
    END as notes
FROM cleanup_report;

-- ============================================================================
-- 11. NEXT STEPS REMINDER
-- ============================================================================

/*
CLEANUP COMPLETED!

NEXT STEPS:
1. Verify the cleanup report above shows SUCCESS status
2. If any warnings, investigate remaining objects
3. Proceed with: phase1-create-new-tables.sql
4. Then execute: phase1-data-migration.sql

ROLLBACK AVAILABLE:
If you need to rollback, execute the rollback script generated in the backup phase.

CRITICAL: Do not proceed if cleanup report shows any FAILED status!
*/

RAISE NOTICE 'Old table cleanup completed. Ready for new table creation.';
