-- =====================================================
-- RECREATE DOCTORS TABLE WITH ORIGINAL STRUCTURE
-- =====================================================
-- This script will drop and recreate the doctors table
-- with the original working structure

-- 1. DROP EXISTING CONSTRAINTS AND TABLE
-- =====================================================

-- Drop foreign key constraints first (if they exist)
DO $$
BEGIN
    -- Drop doctors table foreign keys
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_doctors_profile_id') THEN
        ALTER TABLE doctors DROP CONSTRAINT fk_doctors_profile_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_doctors_department_id') THEN
        ALTER TABLE doctors DROP CONSTRAINT fk_doctors_department_id;
    END IF;
    
    -- Drop other related table constraints that reference doctors
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_doctor_work_schedules_doctor_id') THEN
        ALTER TABLE doctor_work_schedules DROP CONSTRAINT fk_doctor_work_schedules_doctor_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_doctor_work_experiences_doctor_id') THEN
        ALTER TABLE doctor_work_experiences DROP CONSTRAINT fk_doctor_work_experiences_doctor_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_doctor_reviews_doctor_id') THEN
        ALTER TABLE doctor_reviews DROP CONSTRAINT fk_doctor_reviews_doctor_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_doctor_emergency_contacts_doctor_id') THEN
        ALTER TABLE doctor_emergency_contacts DROP CONSTRAINT fk_doctor_emergency_contacts_doctor_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_doctor_settings_doctor_id') THEN
        ALTER TABLE doctor_settings DROP CONSTRAINT fk_doctor_settings_doctor_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_doctor_statistics_doctor_id') THEN
        ALTER TABLE doctor_statistics DROP CONSTRAINT fk_doctor_statistics_doctor_id;
    END IF;
END $$;

-- Drop the doctors table if it exists
DROP TABLE IF EXISTS doctors CASCADE;

-- 2. CREATE DOCTORS TABLE WITH ORIGINAL STRUCTURE
-- =====================================================

CREATE TABLE doctors (
    -- Primary Key
    doctor_id VARCHAR(20) PRIMARY KEY,
    
    -- Foreign Key to profiles table (CRITICAL!)
    profile_id UUID NOT NULL,
    
    -- Basic Information
    full_name TEXT NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    qualification TEXT NOT NULL,
    department_id VARCHAR(20) NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    
    -- Professional Information
    bio TEXT,
    experience_years INTEGER DEFAULT 0 CHECK (experience_years >= 0),
    consultation_fee DECIMAL(10,2) CHECK (consultation_fee >= 0),
    address JSONB DEFAULT '{}'::jsonb,
    languages_spoken TEXT[] DEFAULT ARRAY['Vietnamese'],
    
    -- Status and Rating
    availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'offline', 'on_leave')),
    rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
    total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    is_active BOOLEAN DEFAULT true,
    
    -- Enhanced fields (from recent migrations)
    success_rate DECIMAL(5,2) DEFAULT 0 CHECK (success_rate >= 0 AND success_rate <= 100),
    total_revenue DECIMAL(12,2) DEFAULT 0 CHECK (total_revenue >= 0),
    average_consultation_time INTEGER DEFAULT 30 CHECK (average_consultation_time > 0),
    certifications JSONB DEFAULT '[]'::jsonb,
    specializations JSONB DEFAULT '[]'::jsonb,
    awards JSONB DEFAULT '[]'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- 3. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Primary indexes
CREATE INDEX idx_doctors_profile_id ON doctors(profile_id);
CREATE INDEX idx_doctors_department_id ON doctors(department_id);
CREATE INDEX idx_doctors_specialty ON doctors(specialty);
CREATE INDEX idx_doctors_license_number ON doctors(license_number);
CREATE INDEX idx_doctors_availability_status ON doctors(availability_status);
CREATE INDEX idx_doctors_is_active ON doctors(is_active);
CREATE INDEX idx_doctors_rating ON doctors(rating);

-- Composite indexes
CREATE INDEX idx_doctors_active_available ON doctors(is_active, availability_status);
CREATE INDEX idx_doctors_specialty_active ON doctors(specialty, is_active);

-- 4. CREATE FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Link to profiles table (MOST IMPORTANT!)
ALTER TABLE doctors 
ADD CONSTRAINT fk_doctors_profile_id 
FOREIGN KEY (profile_id) REFERENCES profiles(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Link to departments table (if departments table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'departments') THEN
        ALTER TABLE doctors 
        ADD CONSTRAINT fk_doctors_department_id 
        FOREIGN KEY (department_id) REFERENCES departments(department_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- 5. CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for doctors table
CREATE TRIGGER update_doctors_updated_at 
    BEFORE UPDATE ON doctors 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 6. CLEAN UP ORPHANED DATA IN RELATED TABLES
-- =====================================================

-- Clean up orphaned records in related tables before creating constraints
DO $$
BEGIN
    -- Clean doctor_work_schedules
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_work_schedules') THEN
        DELETE FROM doctor_work_schedules
        WHERE doctor_id NOT IN (SELECT doctor_id FROM doctors);
        RAISE NOTICE 'Cleaned orphaned records from doctor_work_schedules';
    END IF;

    -- Clean doctor_work_experiences
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_work_experiences') THEN
        DELETE FROM doctor_work_experiences
        WHERE doctor_id NOT IN (SELECT doctor_id FROM doctors);
        RAISE NOTICE 'Cleaned orphaned records from doctor_work_experiences';
    END IF;

    -- Clean doctor_reviews
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_reviews') THEN
        DELETE FROM doctor_reviews
        WHERE doctor_id NOT IN (SELECT doctor_id FROM doctors);
        RAISE NOTICE 'Cleaned orphaned records from doctor_reviews';
    END IF;

    -- Clean doctor_emergency_contacts
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_emergency_contacts') THEN
        DELETE FROM doctor_emergency_contacts
        WHERE doctor_id NOT IN (SELECT doctor_id FROM doctors);
        RAISE NOTICE 'Cleaned orphaned records from doctor_emergency_contacts';
    END IF;

    -- Clean doctor_settings
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_settings') THEN
        DELETE FROM doctor_settings
        WHERE doctor_id NOT IN (SELECT doctor_id FROM doctors);
        RAISE NOTICE 'Cleaned orphaned records from doctor_settings';
    END IF;

    -- Clean doctor_statistics
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_statistics') THEN
        DELETE FROM doctor_statistics
        WHERE doctor_id NOT IN (SELECT doctor_id FROM doctors);
        RAISE NOTICE 'Cleaned orphaned records from doctor_statistics';
    END IF;
END $$;

-- 7. RECREATE RELATED TABLE CONSTRAINTS
-- =====================================================

-- Recreate foreign keys for related tables (if they exist)
DO $$
BEGIN
    -- Doctor work schedules
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_work_schedules') THEN
        ALTER TABLE doctor_work_schedules
        ADD CONSTRAINT fk_doctor_work_schedules_doctor_id
        FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint for doctor_work_schedules';
    END IF;

    -- Doctor work experiences
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_work_experiences') THEN
        ALTER TABLE doctor_work_experiences
        ADD CONSTRAINT fk_doctor_work_experiences_doctor_id
        FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint for doctor_work_experiences';
    END IF;

    -- Doctor reviews
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_reviews') THEN
        ALTER TABLE doctor_reviews
        ADD CONSTRAINT fk_doctor_reviews_doctor_id
        FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint for doctor_reviews';
    END IF;

    -- Doctor emergency contacts
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_emergency_contacts') THEN
        ALTER TABLE doctor_emergency_contacts
        ADD CONSTRAINT fk_doctor_emergency_contacts_doctor_id
        FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint for doctor_emergency_contacts';
    END IF;

    -- Doctor settings
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_settings') THEN
        ALTER TABLE doctor_settings
        ADD CONSTRAINT fk_doctor_settings_doctor_id
        FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint for doctor_settings';
    END IF;

    -- Doctor statistics
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_statistics') THEN
        ALTER TABLE doctor_statistics
        ADD CONSTRAINT fk_doctor_statistics_doctor_id
        FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint for doctor_statistics';
    END IF;
END $$;

-- 8. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions for service role
GRANT ALL ON doctors TO service_role;
GRANT ALL ON doctors TO authenticated;
GRANT SELECT ON doctors TO anon;

-- 9. ENABLE ROW LEVEL SECURITY (Optional)
-- =====================================================

-- Enable RLS
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can manage doctors" ON doctors;
DROP POLICY IF EXISTS "Authenticated users can view active doctors" ON doctors;

-- Policy for service role (full access)
CREATE POLICY "Service role can manage doctors" ON doctors
    FOR ALL USING (auth.role() = 'service_role');

-- Policy for authenticated users (read access)
CREATE POLICY "Authenticated users can view active doctors" ON doctors
    FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'doctors'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check constraints
SELECT
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'doctors';

-- Check foreign keys
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'doctors';

-- Check for orphaned data in related tables
DO $$
BEGIN
    RAISE NOTICE 'Checking for orphaned data...';

    -- Check doctor_work_experiences
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_work_experiences') THEN
        PERFORM COUNT(*) FROM doctor_work_experiences WHERE doctor_id NOT IN (SELECT doctor_id FROM doctors);
        RAISE NOTICE 'Orphaned doctor_work_experiences: %', (SELECT COUNT(*) FROM doctor_work_experiences WHERE doctor_id NOT IN (SELECT doctor_id FROM doctors));
    END IF;

    -- Check doctor_work_schedules
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_work_schedules') THEN
        RAISE NOTICE 'Orphaned doctor_work_schedules: %', (SELECT COUNT(*) FROM doctor_work_schedules WHERE doctor_id NOT IN (SELECT doctor_id FROM doctors));
    END IF;
END $$;

-- Success message
SELECT 'Doctors table recreated successfully with original structure!' as result;
