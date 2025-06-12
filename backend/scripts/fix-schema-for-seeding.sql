-- ============================================================================
-- SCHEMA FIXES FOR TEST DATA SEEDING
-- ============================================================================
-- This script ensures all required columns exist for test data seeding

-- PROFILES TABLE FIXES
-- =====================================================
DO $$
BEGIN
    -- Add phone_verified column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'phone_verified') THEN
        ALTER TABLE profiles ADD COLUMN phone_verified BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added phone_verified column to profiles table';
    END IF;

    -- Add email_verified column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'email_verified') THEN
        ALTER TABLE profiles ADD COLUMN email_verified BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added email_verified column to profiles table';
    END IF;

    -- Add is_active column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'is_active') THEN
        ALTER TABLE profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_active column to profiles table';
    END IF;
END $$;

-- DEPARTMENTS TABLE FIXES
-- =====================================================
DO $$
BEGIN
    -- Add code column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'departments' AND column_name = 'code') THEN
        ALTER TABLE departments ADD COLUMN code VARCHAR(10);
        RAISE NOTICE 'Added code column to departments table';
    END IF;

    -- Add description column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'departments' AND column_name = 'description') THEN
        ALTER TABLE departments ADD COLUMN description TEXT;
        RAISE NOTICE 'Added description column to departments table';
    END IF;

    -- Add is_active column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'departments' AND column_name = 'is_active') THEN
        ALTER TABLE departments ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_active column to departments table';
    END IF;
END $$;

-- DOCTORS TABLE FIXES
-- =====================================================
DO $$
BEGIN
    -- Add bio column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'doctors' AND column_name = 'bio') THEN
        ALTER TABLE doctors ADD COLUMN bio TEXT;
        RAISE NOTICE 'Added bio column to doctors table';
    END IF;

    -- Add experience_years column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'doctors' AND column_name = 'experience_years') THEN
        ALTER TABLE doctors ADD COLUMN experience_years INTEGER DEFAULT 0;
        RAISE NOTICE 'Added experience_years column to doctors table';
    END IF;

    -- Add consultation_fee column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'doctors' AND column_name = 'consultation_fee') THEN
        ALTER TABLE doctors ADD COLUMN consultation_fee DECIMAL(10,2);
        RAISE NOTICE 'Added consultation_fee column to doctors table';
    END IF;

    -- Add languages_spoken column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'doctors' AND column_name = 'languages_spoken') THEN
        ALTER TABLE doctors ADD COLUMN languages_spoken TEXT[];
        RAISE NOTICE 'Added languages_spoken column to doctors table';
    END IF;

    -- Add availability_status column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'doctors' AND column_name = 'availability_status') THEN
        ALTER TABLE doctors ADD COLUMN availability_status VARCHAR(20) DEFAULT 'available';
        RAISE NOTICE 'Added availability_status column to doctors table';
    END IF;

    -- Add rating column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'doctors' AND column_name = 'rating') THEN
        ALTER TABLE doctors ADD COLUMN rating DECIMAL(3,2) DEFAULT 0.0;
        RAISE NOTICE 'Added rating column to doctors table';
    END IF;

    -- Add total_reviews column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'doctors' AND column_name = 'total_reviews') THEN
        ALTER TABLE doctors ADD COLUMN total_reviews INTEGER DEFAULT 0;
        RAISE NOTICE 'Added total_reviews column to doctors table';
    END IF;

    -- Add gender column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'doctors' AND column_name = 'gender') THEN
        ALTER TABLE doctors ADD COLUMN gender VARCHAR(10);
        RAISE NOTICE 'Added gender column to doctors table';
    END IF;
END $$;

-- PATIENTS TABLE FIXES
-- =====================================================
DO $$
BEGIN
    -- Add gender column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patients' AND column_name = 'gender') THEN
        ALTER TABLE patients ADD COLUMN gender VARCHAR(10);
        RAISE NOTICE 'Added gender column to patients table';
    END IF;

    -- Add blood_type column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patients' AND column_name = 'blood_type') THEN
        ALTER TABLE patients ADD COLUMN blood_type VARCHAR(5);
        RAISE NOTICE 'Added blood_type column to patients table';
    END IF;

    -- Add address column if not exists (JSON)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patients' AND column_name = 'address') THEN
        ALTER TABLE patients ADD COLUMN address JSONB;
        RAISE NOTICE 'Added address column to patients table';
    END IF;

    -- Add emergency_contact column if not exists (JSON)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patients' AND column_name = 'emergency_contact') THEN
        ALTER TABLE patients ADD COLUMN emergency_contact JSONB;
        RAISE NOTICE 'Added emergency_contact column to patients table';
    END IF;

    -- Add medical_history column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patients' AND column_name = 'medical_history') THEN
        ALTER TABLE patients ADD COLUMN medical_history TEXT;
        RAISE NOTICE 'Added medical_history column to patients table';
    END IF;

    -- Add allergies column if not exists (Array)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patients' AND column_name = 'allergies') THEN
        ALTER TABLE patients ADD COLUMN allergies TEXT[];
        RAISE NOTICE 'Added allergies column to patients table';
    END IF;

    -- Add status column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patients' AND column_name = 'status') THEN
        ALTER TABLE patients ADD COLUMN status VARCHAR(20) DEFAULT 'active';
        RAISE NOTICE 'Added status column to patients table';
    END IF;

    -- Add notes column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patients' AND column_name = 'notes') THEN
        ALTER TABLE patients ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added notes column to patients table';
    END IF;
END $$;

-- DOCTOR_SCHEDULES TABLE FIXES
-- =====================================================
DO $$
BEGIN
    -- Add break_start column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'doctor_schedules' AND column_name = 'break_start') THEN
        ALTER TABLE doctor_schedules ADD COLUMN break_start TIME;
        RAISE NOTICE 'Added break_start column to doctor_schedules table';
    END IF;

    -- Add break_end column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'doctor_schedules' AND column_name = 'break_end') THEN
        ALTER TABLE doctor_schedules ADD COLUMN break_end TIME;
        RAISE NOTICE 'Added break_end column to doctor_schedules table';
    END IF;

    -- Add max_appointments column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'doctor_schedules' AND column_name = 'max_appointments') THEN
        ALTER TABLE doctor_schedules ADD COLUMN max_appointments INTEGER DEFAULT 16;
        RAISE NOTICE 'Added max_appointments column to doctor_schedules table';
    END IF;

    -- Add slot_duration column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'doctor_schedules' AND column_name = 'slot_duration') THEN
        ALTER TABLE doctor_schedules ADD COLUMN slot_duration INTEGER DEFAULT 30;
        RAISE NOTICE 'Added slot_duration column to doctor_schedules table';
    END IF;
END $$;

-- APPOINTMENTS TABLE FIXES
-- =====================================================
DO $$
BEGIN
    -- Add appointment_type column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'appointments' AND column_name = 'appointment_type') THEN
        ALTER TABLE appointments ADD COLUMN appointment_type VARCHAR(50) DEFAULT 'consultation';
        RAISE NOTICE 'Added appointment_type column to appointments table';
    END IF;

    -- Add notes column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'appointments' AND column_name = 'notes') THEN
        ALTER TABLE appointments ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added notes column to appointments table';
    END IF;
END $$;

-- MEDICAL_RECORDS TABLE FIXES
-- =====================================================
DO $$
BEGIN
    -- Add chief_complaint column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'medical_records' AND column_name = 'chief_complaint') THEN
        ALTER TABLE medical_records ADD COLUMN chief_complaint TEXT;
        RAISE NOTICE 'Added chief_complaint column to medical_records table';
    END IF;

    -- Add treatment_plan column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'medical_records' AND column_name = 'treatment_plan') THEN
        ALTER TABLE medical_records ADD COLUMN treatment_plan TEXT;
        RAISE NOTICE 'Added treatment_plan column to medical_records table';
    END IF;

    -- Add status column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'medical_records' AND column_name = 'status') THEN
        ALTER TABLE medical_records ADD COLUMN status VARCHAR(20) DEFAULT 'active';
        RAISE NOTICE 'Added status column to medical_records table';
    END IF;
END $$;

-- DOCTOR_REVIEWS TABLE FIXES
-- =====================================================
DO $$
BEGIN
    -- Add is_verified column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'doctor_reviews' AND column_name = 'is_verified') THEN
        ALTER TABLE doctor_reviews ADD COLUMN is_verified BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_verified column to doctor_reviews table';
    END IF;

    -- Add review_date column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'doctor_reviews' AND column_name = 'review_date') THEN
        ALTER TABLE doctor_reviews ADD COLUMN review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added review_date column to doctor_reviews table';
    END IF;
END $$;

-- ADD CONSTRAINTS AND INDEXES
-- =====================================================

-- Add check constraints for ratings
DO $$
BEGIN
    -- Doctor rating constraint
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_name = 'doctors_rating_check') THEN
        ALTER TABLE doctors ADD CONSTRAINT doctors_rating_check 
        CHECK (rating >= 0 AND rating <= 5);
        RAISE NOTICE 'Added rating check constraint to doctors table';
    END IF;

    -- Review rating constraint
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_name = 'doctor_reviews_rating_check') THEN
        ALTER TABLE doctor_reviews ADD CONSTRAINT doctor_reviews_rating_check 
        CHECK (rating >= 1 AND rating <= 5);
        RAISE NOTICE 'Added rating check constraint to doctor_reviews table';
    END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_doctors_department_id ON doctors(department_id);
CREATE INDEX IF NOT EXISTS idx_doctors_specialty ON doctors(specialty);
CREATE INDEX IF NOT EXISTS idx_doctors_availability_status ON doctors(availability_status);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_id ON medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_doctor_reviews_doctor_id ON doctor_reviews(doctor_id);

-- FINAL VERIFICATION
-- =====================================================
SELECT 'Schema fixes completed successfully!' as status;

-- Show table counts
SELECT 
    'profiles' as table_name,
    COUNT(*) as row_count
FROM profiles
UNION ALL
SELECT 
    'departments' as table_name,
    COUNT(*) as row_count
FROM departments
UNION ALL
SELECT 
    'doctors' as table_name,
    COUNT(*) as row_count
FROM doctors
UNION ALL
SELECT 
    'patients' as table_name,
    COUNT(*) as row_count
FROM patients
ORDER BY table_name;
