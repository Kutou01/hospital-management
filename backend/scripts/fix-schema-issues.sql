-- ============================================================================
-- FIX SCHEMA ISSUES FOR SEEDING
-- ============================================================================
-- This script fixes the specific schema issues found during verification

-- 1. FIX DEPARTMENTS TABLE COLUMN NAMES
-- =====================================================
-- Your departments table uses different column names than expected
-- Add aliases/views or rename columns to match seeding expectations

DO $$
BEGIN
    -- Check if dept_id column exists, if not add it as alias or rename
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'departments' AND column_name = 'dept_id') THEN
        
        -- Option 1: Add dept_id as an alias column (recommended)
        ALTER TABLE departments ADD COLUMN dept_id VARCHAR(10);
        
        -- Copy data from department_id to dept_id
        UPDATE departments SET dept_id = department_id WHERE dept_id IS NULL;
        
        -- Make it NOT NULL
        ALTER TABLE departments ALTER COLUMN dept_id SET NOT NULL;
        
        RAISE NOTICE 'Added dept_id column to departments table';
    END IF;

    -- Check if name column exists, if not add it as alias
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'departments' AND column_name = 'name') THEN
        
        -- Add name as alias column
        ALTER TABLE departments ADD COLUMN name VARCHAR(255);
        
        -- Copy data from department_name to name
        UPDATE departments SET name = department_name WHERE name IS NULL;
        
        RAISE NOTICE 'Added name column to departments table';
    END IF;

    -- Check if code column exists, if not add it as alias
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'departments' AND column_name = 'code') THEN
        
        -- Add code as alias column
        ALTER TABLE departments ADD COLUMN code VARCHAR(10);
        
        -- Copy data from department_code to code
        UPDATE departments SET code = department_code WHERE code IS NULL;
        
        RAISE NOTICE 'Added code column to departments table';
    END IF;
END $$;

-- 2. CREATE DOCTOR_REVIEWS TABLE
-- =====================================================
-- Create the missing doctor_reviews table

CREATE TABLE IF NOT EXISTS doctor_reviews (
    review_id VARCHAR(20) PRIMARY KEY DEFAULT ('REV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(NEXTVAL('review_id_seq')::TEXT, 3, '0')),
    doctor_id VARCHAR(20) NOT NULL,
    patient_id VARCHAR(20) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_doctor_reviews_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    CONSTRAINT fk_doctor_reviews_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
);

-- Create sequence for review IDs if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS review_id_seq START 1;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_doctor_reviews_doctor_id ON doctor_reviews(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_reviews_patient_id ON doctor_reviews(patient_id);
CREATE INDEX IF NOT EXISTS idx_doctor_reviews_rating ON doctor_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_doctor_reviews_date ON doctor_reviews(review_date);

-- 3. ADD MISSING COLUMNS TO EXISTING TABLES (if needed)
-- =====================================================

-- Ensure departments has is_active column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'departments' AND column_name = 'is_active') THEN
        ALTER TABLE departments ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_active column to departments table';
    END IF;
END $$;

-- 4. CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to doctor_reviews
DROP TRIGGER IF EXISTS update_doctor_reviews_updated_at ON doctor_reviews;
CREATE TRIGGER update_doctor_reviews_updated_at
    BEFORE UPDATE ON doctor_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. VERIFY FOREIGN KEY RELATIONSHIPS
-- =====================================================

-- Check if foreign keys exist and create them if missing
DO $$
BEGIN
    -- Check doctors -> departments foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_doctors_department' 
        AND table_name = 'doctors'
    ) THEN
        -- Add foreign key constraint
        ALTER TABLE doctors 
        ADD CONSTRAINT fk_doctors_department 
        FOREIGN KEY (department_id) REFERENCES departments(dept_id);
        
        RAISE NOTICE 'Added foreign key constraint: doctors -> departments';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Foreign key constraint may already exist or have different name';
END $$;

-- 6. UPDATE DEPARTMENT DATA TO ENSURE CONSISTENCY
-- =====================================================

-- Ensure dept_id, name, and code are consistent
UPDATE departments 
SET 
    dept_id = COALESCE(dept_id, department_id),
    name = COALESCE(name, department_name),
    code = COALESCE(code, department_code)
WHERE dept_id IS NULL OR name IS NULL OR code IS NULL;

-- 7. GRANT NECESSARY PERMISSIONS
-- =====================================================

-- Grant permissions on doctor_reviews table
GRANT ALL ON doctor_reviews TO authenticated;
GRANT ALL ON doctor_reviews TO service_role;
GRANT USAGE ON review_id_seq TO authenticated;
GRANT USAGE ON review_id_seq TO service_role;

-- 8. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on doctor_reviews
ALTER TABLE doctor_reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for doctor_reviews
CREATE POLICY "Users can view all reviews" ON doctor_reviews
    FOR SELECT USING (true);

CREATE POLICY "Patients can create reviews" ON doctor_reviews
    FOR INSERT WITH CHECK (
        auth.uid()::text = (
            SELECT profile_id FROM patients WHERE patient_id = doctor_reviews.patient_id
        )
    );

CREATE POLICY "Patients can update their own reviews" ON doctor_reviews
    FOR UPDATE USING (
        auth.uid()::text = (
            SELECT profile_id FROM patients WHERE patient_id = doctor_reviews.patient_id
        )
    );

CREATE POLICY "Patients can delete their own reviews" ON doctor_reviews
    FOR DELETE USING (
        auth.uid()::text = (
            SELECT profile_id FROM patients WHERE patient_id = doctor_reviews.patient_id
        )
    );

-- 9. FINAL VERIFICATION
-- =====================================================

-- Show table structure
SELECT 
    'departments' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'departments'
ORDER BY ordinal_position;

-- Show doctor_reviews structure
SELECT 
    'doctor_reviews' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'doctor_reviews'
ORDER BY ordinal_position;

-- Show current departments
SELECT dept_id, name, code, is_active FROM departments ORDER BY dept_id;

-- Success message
SELECT 'Schema fixes completed successfully!' as status;
