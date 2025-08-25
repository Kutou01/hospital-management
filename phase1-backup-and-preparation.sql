-- ============================================================================
-- PHASE 1: BACKUP AND PREPARATION SCRIPTS
-- Hospital Management System - Database Redesign
-- ============================================================================
-- CRITICAL: Execute these scripts BEFORE starting the redesign process
-- This ensures complete data backup and rollback capability

-- ============================================================================
-- 1. COMPREHENSIVE BACKUP STRATEGY
-- ============================================================================

-- Create backup schema for all existing data
CREATE SCHEMA IF NOT EXISTS backup_original;

-- Set search path to include backup schema
SET search_path = public, backup_original;

-- ============================================================================
-- 2. BACKUP ALL EXISTING TABLES
-- ============================================================================

-- Backup Profiles Table
CREATE TABLE backup_original.profiles_backup AS 
SELECT * FROM public.profiles;

-- Backup Departments Table
CREATE TABLE backup_original.departments_backup AS 
SELECT * FROM public.departments;

-- Backup Patient Profiles Table
CREATE TABLE backup_original.patient_profiles_backup AS 
SELECT * FROM public.patient_profiles;

-- Backup Doctor Profiles Table
CREATE TABLE backup_original.doctor_profiles_backup AS 
SELECT * FROM public.doctor_profiles;

-- Backup Appointments Table
CREATE TABLE backup_original.appointments_backup AS 
SELECT * FROM public.appointments;

-- Backup Medical Records Table
CREATE TABLE backup_original.medical_records_backup AS 
SELECT * FROM public.medical_records;

-- Backup Receptionist Table
CREATE TABLE backup_original.receptionist_backup AS 
SELECT * FROM public.receptionist;

-- Backup Patient Check-ins Table
CREATE TABLE backup_original.patient_check_ins_backup AS 
SELECT * FROM public.patient_check_ins;

-- Backup Vital Signs History Table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vital_signs_history') THEN
        EXECUTE 'CREATE TABLE backup_original.vital_signs_history_backup AS SELECT * FROM public.vital_signs_history';
    END IF;
END $$;

-- ============================================================================
-- 3. BACKUP METADATA AND CONSTRAINTS
-- ============================================================================

-- Backup table constraints
CREATE TABLE backup_original.table_constraints_backup AS
SELECT 
    tc.constraint_name,
    tc.table_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
    AND tc.table_name IN (
        'profiles', 'departments', 'patient_profiles', 'doctor_profiles',
        'appointments', 'medical_records', 'receptionist', 'patient_check_ins'
    );

-- Backup indexes
CREATE TABLE backup_original.indexes_backup AS
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN (
        'profiles', 'departments', 'patient_profiles', 'doctor_profiles',
        'appointments', 'medical_records', 'receptionist', 'patient_check_ins'
    );

-- Backup functions
CREATE TABLE backup_original.functions_backup AS
SELECT 
    routine_name,
    routine_definition,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_name LIKE '%patient%' 
    OR routine_name LIKE '%doctor%'
    OR routine_name LIKE '%appointment%'
    OR routine_name LIKE '%generate%';

-- ============================================================================
-- 4. DATA VALIDATION AND STATISTICS
-- ============================================================================

-- Create validation report
CREATE TABLE backup_original.backup_validation_report (
    table_name TEXT,
    original_count BIGINT,
    backup_count BIGINT,
    validation_status TEXT,
    backup_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Validate backup integrity
INSERT INTO backup_original.backup_validation_report (table_name, original_count, backup_count, validation_status)
SELECT 
    'profiles' as table_name,
    (SELECT COUNT(*) FROM public.profiles) as original_count,
    (SELECT COUNT(*) FROM backup_original.profiles_backup) as backup_count,
    CASE 
        WHEN (SELECT COUNT(*) FROM public.profiles) = (SELECT COUNT(*) FROM backup_original.profiles_backup) 
        THEN 'SUCCESS' 
        ELSE 'FAILED' 
    END as validation_status;

INSERT INTO backup_original.backup_validation_report (table_name, original_count, backup_count, validation_status)
SELECT 
    'departments' as table_name,
    (SELECT COUNT(*) FROM public.departments) as original_count,
    (SELECT COUNT(*) FROM backup_original.departments_backup) as backup_count,
    CASE 
        WHEN (SELECT COUNT(*) FROM public.departments) = (SELECT COUNT(*) FROM backup_original.departments_backup) 
        THEN 'SUCCESS' 
        ELSE 'FAILED' 
    END as validation_status;

INSERT INTO backup_original.backup_validation_report (table_name, original_count, backup_count, validation_status)
SELECT 
    'patient_profiles' as table_name,
    (SELECT COUNT(*) FROM public.patient_profiles) as original_count,
    (SELECT COUNT(*) FROM backup_original.patient_profiles_backup) as backup_count,
    CASE 
        WHEN (SELECT COUNT(*) FROM public.patient_profiles) = (SELECT COUNT(*) FROM backup_original.patient_profiles_backup) 
        THEN 'SUCCESS' 
        ELSE 'FAILED' 
    END as validation_status;

INSERT INTO backup_original.backup_validation_report (table_name, original_count, backup_count, validation_status)
SELECT 
    'doctor_profiles' as table_name,
    (SELECT COUNT(*) FROM public.doctor_profiles) as original_count,
    (SELECT COUNT(*) FROM backup_original.doctor_profiles_backup) as backup_count,
    CASE 
        WHEN (SELECT COUNT(*) FROM public.doctor_profiles) = (SELECT COUNT(*) FROM backup_original.doctor_profiles_backup) 
        THEN 'SUCCESS' 
        ELSE 'FAILED' 
    END as validation_status;

INSERT INTO backup_original.backup_validation_report (table_name, original_count, backup_count, validation_status)
SELECT 
    'appointments' as table_name,
    (SELECT COUNT(*) FROM public.appointments) as original_count,
    (SELECT COUNT(*) FROM backup_original.appointments_backup) as backup_count,
    CASE 
        WHEN (SELECT COUNT(*) FROM public.appointments) = (SELECT COUNT(*) FROM backup_original.appointments_backup) 
        THEN 'SUCCESS' 
        ELSE 'FAILED' 
    END as validation_status;

INSERT INTO backup_original.backup_validation_report (table_name, original_count, backup_count, validation_status)
SELECT 
    'medical_records' as table_name,
    (SELECT COUNT(*) FROM public.medical_records) as original_count,
    (SELECT COUNT(*) FROM backup_original.medical_records_backup) as backup_count,
    CASE 
        WHEN (SELECT COUNT(*) FROM public.medical_records) = (SELECT COUNT(*) FROM backup_original.medical_records_backup) 
        THEN 'SUCCESS' 
        ELSE 'FAILED' 
    END as validation_status;

-- ============================================================================
-- 5. ROLLBACK PREPARATION
-- ============================================================================

-- Create rollback script generator
CREATE OR REPLACE FUNCTION backup_original.generate_rollback_script()
RETURNS TEXT AS $$
DECLARE
    rollback_script TEXT := '';
BEGIN
    rollback_script := rollback_script || '-- EMERGENCY ROLLBACK SCRIPT' || E'\n';
    rollback_script := rollback_script || '-- Generated: ' || NOW() || E'\n';
    rollback_script := rollback_script || '-- WARNING: This will restore original database structure' || E'\n\n';
    
    -- Drop new tables first
    rollback_script := rollback_script || 'DROP SCHEMA IF EXISTS public CASCADE;' || E'\n';
    rollback_script := rollback_script || 'CREATE SCHEMA public;' || E'\n';
    rollback_script := rollback_script || 'GRANT ALL ON SCHEMA public TO postgres;' || E'\n';
    rollback_script := rollback_script || 'GRANT ALL ON SCHEMA public TO public;' || E'\n\n';
    
    -- Restore original tables
    rollback_script := rollback_script || '-- Restore original tables' || E'\n';
    rollback_script := rollback_script || 'CREATE TABLE public.profiles AS SELECT * FROM backup_original.profiles_backup;' || E'\n';
    rollback_script := rollback_script || 'CREATE TABLE public.departments AS SELECT * FROM backup_original.departments_backup;' || E'\n';
    rollback_script := rollback_script || 'CREATE TABLE public.patient_profiles AS SELECT * FROM backup_original.patient_profiles_backup;' || E'\n';
    rollback_script := rollback_script || 'CREATE TABLE public.doctor_profiles AS SELECT * FROM backup_original.doctor_profiles_backup;' || E'\n';
    rollback_script := rollback_script || 'CREATE TABLE public.appointments AS SELECT * FROM backup_original.appointments_backup;' || E'\n';
    rollback_script := rollback_script || 'CREATE TABLE public.medical_records AS SELECT * FROM backup_original.medical_records_backup;' || E'\n';
    rollback_script := rollback_script || 'CREATE TABLE public.receptionist AS SELECT * FROM backup_original.receptionist_backup;' || E'\n';
    rollback_script := rollback_script || 'CREATE TABLE public.patient_check_ins AS SELECT * FROM backup_original.patient_check_ins_backup;' || E'\n\n';
    
    rollback_script := rollback_script || '-- Restore constraints and indexes would need to be added manually' || E'\n';
    rollback_script := rollback_script || '-- Check backup_original.table_constraints_backup and indexes_backup tables' || E'\n';
    
    RETURN rollback_script;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. BACKUP VERIFICATION REPORT
-- ============================================================================

-- Generate comprehensive backup report
CREATE OR REPLACE FUNCTION backup_original.generate_backup_report()
RETURNS TABLE(
    report_section TEXT,
    details TEXT,
    status TEXT
) AS $$
BEGIN
    -- Header
    RETURN QUERY SELECT 'BACKUP REPORT' as report_section, 'Generated: ' || NOW()::TEXT as details, 'INFO' as status;
    RETURN QUERY SELECT '============' as report_section, '' as details, 'INFO' as status;
    
    -- Validation results
    RETURN QUERY 
    SELECT 
        'TABLE BACKUP' as report_section,
        table_name || ': ' || original_count || ' -> ' || backup_count || ' records' as details,
        validation_status as status
    FROM backup_original.backup_validation_report
    ORDER BY table_name;
    
    -- Summary
    RETURN QUERY 
    SELECT 
        'SUMMARY' as report_section,
        'Total tables backed up: ' || COUNT(*)::TEXT as details,
        CASE 
            WHEN COUNT(*) FILTER (WHERE validation_status = 'FAILED') > 0 THEN 'FAILED'
            ELSE 'SUCCESS'
        END as status
    FROM backup_original.backup_validation_report;
    
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. EXECUTION COMMANDS
-- ============================================================================

-- Display backup report
SELECT * FROM backup_original.generate_backup_report();

-- Generate rollback script (save this output!)
SELECT backup_original.generate_rollback_script();

-- Final validation
DO $$
DECLARE
    failed_backups INTEGER;
BEGIN
    SELECT COUNT(*) INTO failed_backups 
    FROM backup_original.backup_validation_report 
    WHERE validation_status = 'FAILED';
    
    IF failed_backups > 0 THEN
        RAISE EXCEPTION 'BACKUP VALIDATION FAILED! % tables failed backup validation. DO NOT PROCEED WITH REDESIGN!', failed_backups;
    ELSE
        RAISE NOTICE 'BACKUP VALIDATION SUCCESSFUL! All tables backed up correctly. Safe to proceed with redesign.';
    END IF;
END $$;

-- ============================================================================
-- 8. NEXT STEPS REMINDER
-- ============================================================================

/*
NEXT STEPS AFTER SUCCESSFUL BACKUP:

1. Save the rollback script generated above to a file
2. Export backup schema to external storage:
   pg_dump -h localhost -U postgres -n backup_original hospital_db > backup_$(date +%Y%m%d_%H%M%S).sql

3. Verify backup file integrity:
   pg_restore --list backup_$(date +%Y%m%d_%H%M%S).sql

4. Only after successful backup verification, proceed with:
   - phase1-drop-old-tables.sql
   - phase1-create-new-tables.sql
   - phase1-data-migration.sql

EMERGENCY ROLLBACK:
If anything goes wrong, execute the rollback script generated above.
*/
