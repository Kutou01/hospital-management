-- =====================================================
-- CLEANUP ORPHANED DATA BEFORE RECREATING DOCTORS TABLE
-- =====================================================
-- Run this script FIRST before recreate-doctors-table.sql
-- This will clean up any orphaned data that might cause foreign key errors

-- 1. CHECK CURRENT STATE
-- =====================================================

-- Check what doctor_ids exist in related tables but not in doctors
SELECT 'Checking orphaned data in related tables...' as status;

-- Check doctor_work_experiences
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_work_experiences') THEN
        SELECT COUNT(*) INTO orphaned_count 
        FROM doctor_work_experiences 
        WHERE doctor_id NOT IN (SELECT COALESCE(doctor_id, '') FROM doctors WHERE doctor_id IS NOT NULL);
        
        RAISE NOTICE 'Orphaned records in doctor_work_experiences: %', orphaned_count;
        
        IF orphaned_count > 0 THEN
            RAISE NOTICE 'Orphaned doctor_ids in doctor_work_experiences: %', 
                (SELECT string_agg(DISTINCT doctor_id, ', ') 
                 FROM doctor_work_experiences 
                 WHERE doctor_id NOT IN (SELECT COALESCE(doctor_id, '') FROM doctors WHERE doctor_id IS NOT NULL));
        END IF;
    ELSE
        RAISE NOTICE 'Table doctor_work_experiences does not exist';
    END IF;
END $$;

-- Check doctor_work_schedules
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_work_schedules') THEN
        SELECT COUNT(*) INTO orphaned_count 
        FROM doctor_work_schedules 
        WHERE doctor_id NOT IN (SELECT COALESCE(doctor_id, '') FROM doctors WHERE doctor_id IS NOT NULL);
        
        RAISE NOTICE 'Orphaned records in doctor_work_schedules: %', orphaned_count;
        
        IF orphaned_count > 0 THEN
            RAISE NOTICE 'Orphaned doctor_ids in doctor_work_schedules: %', 
                (SELECT string_agg(DISTINCT doctor_id, ', ') 
                 FROM doctor_work_schedules 
                 WHERE doctor_id NOT IN (SELECT COALESCE(doctor_id, '') FROM doctors WHERE doctor_id IS NOT NULL));
        END IF;
    ELSE
        RAISE NOTICE 'Table doctor_work_schedules does not exist';
    END IF;
END $$;

-- Check doctor_reviews
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_reviews') THEN
        SELECT COUNT(*) INTO orphaned_count 
        FROM doctor_reviews 
        WHERE doctor_id NOT IN (SELECT COALESCE(doctor_id, '') FROM doctors WHERE doctor_id IS NOT NULL);
        
        RAISE NOTICE 'Orphaned records in doctor_reviews: %', orphaned_count;
        
        IF orphaned_count > 0 THEN
            RAISE NOTICE 'Orphaned doctor_ids in doctor_reviews: %', 
                (SELECT string_agg(DISTINCT doctor_id, ', ') 
                 FROM doctor_reviews 
                 WHERE doctor_id NOT IN (SELECT COALESCE(doctor_id, '') FROM doctors WHERE doctor_id IS NOT NULL));
        END IF;
    ELSE
        RAISE NOTICE 'Table doctor_reviews does not exist';
    END IF;
END $$;

-- 2. BACKUP ORPHANED DATA (Optional)
-- =====================================================

-- Create backup tables for orphaned data
CREATE TABLE IF NOT EXISTS backup_orphaned_doctor_work_experiences AS
SELECT * FROM doctor_work_experiences WHERE 1=0; -- Empty table with same structure

CREATE TABLE IF NOT EXISTS backup_orphaned_doctor_work_schedules AS
SELECT * FROM doctor_work_schedules WHERE 1=0; -- Empty table with same structure

CREATE TABLE IF NOT EXISTS backup_orphaned_doctor_reviews AS
SELECT * FROM doctor_reviews WHERE 1=0; -- Empty table with same structure

-- Backup orphaned data
DO $$
BEGIN
    -- Backup orphaned doctor_work_experiences
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_work_experiences') THEN
        INSERT INTO backup_orphaned_doctor_work_experiences
        SELECT * FROM doctor_work_experiences 
        WHERE doctor_id NOT IN (SELECT COALESCE(doctor_id, '') FROM doctors WHERE doctor_id IS NOT NULL);
        
        RAISE NOTICE 'Backed up % orphaned doctor_work_experiences records', 
            (SELECT COUNT(*) FROM backup_orphaned_doctor_work_experiences);
    END IF;
    
    -- Backup orphaned doctor_work_schedules
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_work_schedules') THEN
        INSERT INTO backup_orphaned_doctor_work_schedules
        SELECT * FROM doctor_work_schedules 
        WHERE doctor_id NOT IN (SELECT COALESCE(doctor_id, '') FROM doctors WHERE doctor_id IS NOT NULL);
        
        RAISE NOTICE 'Backed up % orphaned doctor_work_schedules records', 
            (SELECT COUNT(*) FROM backup_orphaned_doctor_work_schedules);
    END IF;
    
    -- Backup orphaned doctor_reviews
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_reviews') THEN
        INSERT INTO backup_orphaned_doctor_reviews
        SELECT * FROM doctor_reviews 
        WHERE doctor_id NOT IN (SELECT COALESCE(doctor_id, '') FROM doctors WHERE doctor_id IS NOT NULL);
        
        RAISE NOTICE 'Backed up % orphaned doctor_reviews records', 
            (SELECT COUNT(*) FROM backup_orphaned_doctor_reviews);
    END IF;
END $$;

-- 3. DELETE ORPHANED DATA
-- =====================================================

-- Delete orphaned records
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete from doctor_work_experiences
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_work_experiences') THEN
        DELETE FROM doctor_work_experiences 
        WHERE doctor_id NOT IN (SELECT COALESCE(doctor_id, '') FROM doctors WHERE doctor_id IS NOT NULL);
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deleted % orphaned records from doctor_work_experiences', deleted_count;
    END IF;
    
    -- Delete from doctor_work_schedules
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_work_schedules') THEN
        DELETE FROM doctor_work_schedules 
        WHERE doctor_id NOT IN (SELECT COALESCE(doctor_id, '') FROM doctors WHERE doctor_id IS NOT NULL);
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deleted % orphaned records from doctor_work_schedules', deleted_count;
    END IF;
    
    -- Delete from doctor_reviews
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_reviews') THEN
        DELETE FROM doctor_reviews 
        WHERE doctor_id NOT IN (SELECT COALESCE(doctor_id, '') FROM doctors WHERE doctor_id IS NOT NULL);
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deleted % orphaned records from doctor_reviews', deleted_count;
    END IF;
    
    -- Delete from doctor_emergency_contacts
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_emergency_contacts') THEN
        DELETE FROM doctor_emergency_contacts 
        WHERE doctor_id NOT IN (SELECT COALESCE(doctor_id, '') FROM doctors WHERE doctor_id IS NOT NULL);
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deleted % orphaned records from doctor_emergency_contacts', deleted_count;
    END IF;
    
    -- Delete from doctor_settings
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_settings') THEN
        DELETE FROM doctor_settings 
        WHERE doctor_id NOT IN (SELECT COALESCE(doctor_id, '') FROM doctors WHERE doctor_id IS NOT NULL);
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deleted % orphaned records from doctor_settings', deleted_count;
    END IF;
    
    -- Delete from doctor_statistics
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_statistics') THEN
        DELETE FROM doctor_statistics 
        WHERE doctor_id NOT IN (SELECT COALESCE(doctor_id, '') FROM doctors WHERE doctor_id IS NOT NULL);
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Deleted % orphaned records from doctor_statistics', deleted_count;
    END IF;
END $$;

-- 4. VERIFICATION
-- =====================================================

-- Verify cleanup
DO $$
BEGIN
    RAISE NOTICE 'Verification after cleanup:';
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_work_experiences') THEN
        RAISE NOTICE 'Remaining orphaned doctor_work_experiences: %', 
            (SELECT COUNT(*) FROM doctor_work_experiences 
             WHERE doctor_id NOT IN (SELECT COALESCE(doctor_id, '') FROM doctors WHERE doctor_id IS NOT NULL));
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_work_schedules') THEN
        RAISE NOTICE 'Remaining orphaned doctor_work_schedules: %', 
            (SELECT COUNT(*) FROM doctor_work_schedules 
             WHERE doctor_id NOT IN (SELECT COALESCE(doctor_id, '') FROM doctors WHERE doctor_id IS NOT NULL));
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_reviews') THEN
        RAISE NOTICE 'Remaining orphaned doctor_reviews: %', 
            (SELECT COUNT(*) FROM doctor_reviews 
             WHERE doctor_id NOT IN (SELECT COALESCE(doctor_id, '') FROM doctors WHERE doctor_id IS NOT NULL));
    END IF;
END $$;

-- Success message
SELECT 'Orphaned data cleanup completed! You can now run recreate-doctors-table.sql' as result;
