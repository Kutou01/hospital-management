-- =====================================================
-- FIX DOCTORS TABLE CONSTRAINTS
-- =====================================================
-- This script fixes all constraint issues in doctors table
-- to match the Auth Service implementation

-- 1. CHECK CURRENT CONSTRAINTS
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '🔍 Checking current doctors table constraints...';
    
    -- List all constraints
    FOR constraint_record IN 
        SELECT constraint_name, constraint_type 
        FROM information_schema.table_constraints 
        WHERE table_name = 'doctors'
        ORDER BY constraint_name
    LOOP
        RAISE NOTICE '  - %: %', constraint_record.constraint_name, constraint_record.constraint_type;
    END LOOP;
END $$;

-- 2. REMOVE FULL_NAME COLUMN (not needed - stored in profiles)
-- =====================================================
DO $$
BEGIN
    -- Drop full_name column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'doctors' AND column_name = 'full_name') THEN
        
        RAISE NOTICE '🗑️ Removing full_name column from doctors table...';
        ALTER TABLE doctors DROP COLUMN full_name CASCADE;
        RAISE NOTICE '✅ Successfully removed full_name column';
        
    ELSE
        RAISE NOTICE '✅ full_name column does not exist - nothing to remove';
    END IF;
END $$;

-- 3. FIX GENDER CONSTRAINT (lowercase values)
-- =====================================================
DO $$
BEGIN
    -- Drop existing gender constraint if exists
    IF EXISTS (SELECT 1 FROM information_schema.check_constraints 
               WHERE constraint_name = 'doctors_gender_check') THEN
        RAISE NOTICE '🔧 Dropping old gender constraint...';
        ALTER TABLE doctors DROP CONSTRAINT doctors_gender_check;
    END IF;
    
    -- Add new gender constraint with lowercase values
    RAISE NOTICE '✅ Adding new gender constraint (lowercase)...';
    ALTER TABLE doctors ADD CONSTRAINT doctors_gender_check 
    CHECK (gender IN ('male', 'female', 'other'));
    
    RAISE NOTICE '✅ Gender constraint updated to accept lowercase values';
END $$;

-- 4. MAKE GENDER COLUMN OPTIONAL (can be null)
-- =====================================================
DO $$
BEGIN
    -- Make gender nullable since it might come from profiles
    RAISE NOTICE '🔧 Making gender column nullable...';
    ALTER TABLE doctors ALTER COLUMN gender DROP NOT NULL;
    RAISE NOTICE '✅ Gender column is now nullable';
END $$;

-- 5. MAKE LICENSE_NUMBER OPTIONAL FOR REGISTRATION
-- =====================================================
DO $$
BEGIN
    -- Make license_number nullable for initial registration
    RAISE NOTICE '🔧 Making license_number nullable for registration...';
    ALTER TABLE doctors ALTER COLUMN license_number DROP NOT NULL;
    RAISE NOTICE '✅ License number is now nullable for registration';
END $$;

-- 6. UPDATE AVAILABILITY_STATUS CONSTRAINT
-- =====================================================
DO $$
BEGIN
    -- Drop existing availability_status constraint if exists
    IF EXISTS (SELECT 1 FROM information_schema.check_constraints 
               WHERE constraint_name LIKE '%availability_status%') THEN
        RAISE NOTICE '🔧 Updating availability_status constraint...';
        -- Find and drop the constraint
        FOR constraint_record IN 
            SELECT constraint_name 
            FROM information_schema.check_constraints 
            WHERE constraint_name LIKE '%availability_status%'
        LOOP
            EXECUTE 'ALTER TABLE doctors DROP CONSTRAINT ' || constraint_record.constraint_name;
        END LOOP;
    END IF;
    
    -- Add new availability_status constraint
    ALTER TABLE doctors ADD CONSTRAINT doctors_availability_status_check 
    CHECK (availability_status IN ('available', 'busy', 'offline', 'on_leave'));
    
    RAISE NOTICE '✅ Availability status constraint updated';
END $$;

-- 7. UPDATE STATUS CONSTRAINT
-- =====================================================
DO $$
BEGIN
    -- Drop existing status constraint if exists
    IF EXISTS (SELECT 1 FROM information_schema.check_constraints 
               WHERE constraint_name LIKE '%status%' AND constraint_name NOT LIKE '%availability%') THEN
        RAISE NOTICE '🔧 Updating status constraint...';
        -- Find and drop the constraint
        FOR constraint_record IN 
            SELECT constraint_name 
            FROM information_schema.check_constraints 
            WHERE constraint_name LIKE '%status%' AND constraint_name NOT LIKE '%availability%'
        LOOP
            EXECUTE 'ALTER TABLE doctors DROP CONSTRAINT ' || constraint_record.constraint_name;
        END LOOP;
    END IF;
    
    -- Add new status constraint
    ALTER TABLE doctors ADD CONSTRAINT doctors_status_check 
    CHECK (status IN ('active', 'inactive', 'suspended'));
    
    RAISE NOTICE '✅ Status constraint updated';
END $$;

-- 8. VERIFY FOREIGN KEY TO PROFILES
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

-- 9. VERIFY FINAL STRUCTURE
-- =====================================================
DO $$
DECLARE
    col_record RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Final doctors table structure:';
    
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
    
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Final constraints:';
    
    FOR constraint_record IN 
        SELECT constraint_name, constraint_type 
        FROM information_schema.table_constraints 
        WHERE table_name = 'doctors'
        ORDER BY constraint_name
    LOOP
        RAISE NOTICE '  - %: %', constraint_record.constraint_name, constraint_record.constraint_type;
    END LOOP;
END $$;

-- 10. SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ================================';
    RAISE NOTICE '✅ DOCTORS CONSTRAINTS FIXED!';
    RAISE NOTICE '🎉 ================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Changes made:';
    RAISE NOTICE '  - Removed full_name column (stored in profiles)';
    RAISE NOTICE '  - Fixed gender constraint (lowercase: male, female, other)';
    RAISE NOTICE '  - Made gender nullable';
    RAISE NOTICE '  - Made license_number nullable for registration';
    RAISE NOTICE '  - Updated availability_status constraint';
    RAISE NOTICE '  - Updated status constraint';
    RAISE NOTICE '  - Verified foreign key to profiles';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Ready for doctor registration!';
    RAISE NOTICE '';
END $$;
