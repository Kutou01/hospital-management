-- =====================================================
-- REMOVE FULL_NAME CONSTRAINT FROM DOCTORS TABLE
-- =====================================================
-- This script removes the full_name column from doctors table
-- since full_name should be stored in profiles table only

-- 1. CHECK CURRENT STRUCTURE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '🔍 Checking current doctors table structure...';
    
    -- Check if full_name column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'doctors' AND column_name = 'full_name') THEN
        RAISE NOTICE '❌ Found full_name column in doctors table - will remove it';
    ELSE
        RAISE NOTICE '✅ No full_name column found in doctors table';
    END IF;
END $$;

-- 2. BACKUP EXISTING DATA (if any)
-- =====================================================
DO $$
DECLARE
    doctor_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO doctor_count FROM doctors;
    
    IF doctor_count > 0 THEN
        RAISE NOTICE '📊 Found % existing doctor records', doctor_count;
        RAISE NOTICE '💾 Creating backup of existing data...';
        
        -- Create backup table
        DROP TABLE IF EXISTS doctors_backup_before_cleanup;
        CREATE TABLE doctors_backup_before_cleanup AS 
        SELECT * FROM doctors;
        
        RAISE NOTICE '✅ Backup created: doctors_backup_before_cleanup';
    ELSE
        RAISE NOTICE '📊 No existing doctor records found';
    END IF;
END $$;

-- 3. REMOVE FULL_NAME COLUMN
-- =====================================================
DO $$
BEGIN
    -- Drop full_name column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'doctors' AND column_name = 'full_name') THEN
        
        RAISE NOTICE '🗑️ Removing full_name column from doctors table...';
        ALTER TABLE doctors DROP COLUMN full_name;
        RAISE NOTICE '✅ Successfully removed full_name column';
        
    ELSE
        RAISE NOTICE '✅ full_name column does not exist - nothing to remove';
    END IF;
END $$;

-- 4. VERIFY CLEAN STRUCTURE
-- =====================================================
DO $$
DECLARE
    col_record RECORD;
BEGIN
    RAISE NOTICE '🔍 Current doctors table structure after cleanup:';
    
    FOR col_record IN 
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'doctors' 
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  - %: % (nullable: %, default: %)', 
            col_record.column_name, 
            col_record.data_type, 
            col_record.is_nullable,
            COALESCE(col_record.column_default, 'none');
    END LOOP;
END $$;

-- 5. VERIFY FOREIGN KEY TO PROFILES
-- =====================================================
DO $$
BEGIN
    -- Check if foreign key to profiles exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'doctors' 
               AND constraint_name = 'fk_doctors_profile_id') THEN
        RAISE NOTICE '✅ Foreign key to profiles table exists: fk_doctors_profile_id';
    ELSE
        RAISE NOTICE '⚠️ Foreign key to profiles table missing - creating it...';
        
        ALTER TABLE doctors 
        ADD CONSTRAINT fk_doctors_profile_id 
        FOREIGN KEY (profile_id) REFERENCES profiles(id) 
        ON DELETE CASCADE ON UPDATE CASCADE;
        
        RAISE NOTICE '✅ Created foreign key: fk_doctors_profile_id';
    END IF;
END $$;

-- 6. TEST QUERY TO VERIFY DESIGN
-- =====================================================
DO $$
DECLARE
    test_result RECORD;
BEGIN
    RAISE NOTICE '🧪 Testing join query to get doctor with profile data...';
    
    -- Test query to show how to get full_name from profiles
    FOR test_result IN 
        SELECT 
            d.doctor_id,
            p.full_name,  -- ✅ Get full_name from profiles
            d.specialty,
            d.department_id
        FROM doctors d
        JOIN profiles p ON d.profile_id = p.id
        LIMIT 3
    LOOP
        RAISE NOTICE '  Doctor: % - % (%) - Dept: %', 
            test_result.doctor_id,
            test_result.full_name,
            test_result.specialty,
            test_result.department_id;
    END LOOP;
    
    RAISE NOTICE '✅ Join query works correctly - full_name comes from profiles';
END $$;

-- 7. SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ================================';
    RAISE NOTICE '✅ DOCTORS TABLE CLEANUP COMPLETED!';
    RAISE NOTICE '🎉 ================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Summary:';
    RAISE NOTICE '  - Removed full_name column from doctors table';
    RAISE NOTICE '  - full_name is now only stored in profiles table';
    RAISE NOTICE '  - Foreign key to profiles table verified';
    RAISE NOTICE '  - Use JOIN query to get full_name from profiles';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Example query:';
    RAISE NOTICE '   SELECT d.*, p.full_name FROM doctors d JOIN profiles p ON d.profile_id = p.id';
    RAISE NOTICE '';
END $$;
