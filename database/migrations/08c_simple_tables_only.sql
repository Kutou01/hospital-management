-- =============================================
-- Simple Tables Creation - Doctor Profile Enhancements
-- Creates only the essential tables without triggers
-- =============================================

-- 1. Work Schedule Management
CREATE TABLE IF NOT EXISTS doctor_work_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id VARCHAR(20) NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    lunch_start_time TIME,
    lunch_end_time TIME,
    max_patients_per_day INTEGER DEFAULT 20,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(doctor_id, day_of_week)
);

-- 2. Work Experience Management
CREATE TABLE IF NOT EXISTS doctor_work_experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id VARCHAR(20) NOT NULL,
    hospital_name VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE,
    description TEXT,
    achievements TEXT,
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Patient Reviews and Ratings
CREATE TABLE IF NOT EXISTS doctor_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id VARCHAR(20) NOT NULL,
    patient_id VARCHAR(20) NOT NULL,
    appointment_id UUID,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    review_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_anonymous BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Emergency Contacts
CREATE TABLE IF NOT EXISTS doctor_emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id VARCHAR(20) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    relationship VARCHAR(100) NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    email VARCHAR(255),
    address JSONB,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Doctor Settings
CREATE TABLE IF NOT EXISTS doctor_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id VARCHAR(20) NOT NULL,
    notification_email BOOLEAN DEFAULT true,
    notification_sms BOOLEAN DEFAULT true,
    notification_appointment_reminder BOOLEAN DEFAULT true,
    notification_patient_review BOOLEAN DEFAULT true,
    privacy_show_phone BOOLEAN DEFAULT true,
    privacy_show_email BOOLEAN DEFAULT true,
    privacy_show_experience BOOLEAN DEFAULT true,
    language_preference VARCHAR(10) DEFAULT 'vi',
    timezone VARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh',
    theme_preference VARCHAR(20) DEFAULT 'light',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(doctor_id)
);

-- 6. Enhanced Statistics Tracking
CREATE TABLE IF NOT EXISTS doctor_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id VARCHAR(20) NOT NULL,
    stat_date DATE NOT NULL,
    total_appointments INTEGER DEFAULT 0,
    completed_appointments INTEGER DEFAULT 0,
    cancelled_appointments INTEGER DEFAULT 0,
    no_show_appointments INTEGER DEFAULT 0,
    new_patients INTEGER DEFAULT 0,
    returning_patients INTEGER DEFAULT 0,
    average_consultation_time INTEGER,
    revenue DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(doctor_id, stat_date)
);

-- Add new columns to existing doctors table (if they don't exist)
DO $$
BEGIN
    -- Add success_rate column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'doctors' AND column_name = 'success_rate') THEN
        ALTER TABLE doctors ADD COLUMN success_rate DECIMAL(5,2) DEFAULT 0;
    END IF;
    
    -- Add total_revenue column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'doctors' AND column_name = 'total_revenue') THEN
        ALTER TABLE doctors ADD COLUMN total_revenue DECIMAL(12,2) DEFAULT 0;
    END IF;
    
    -- Add average_consultation_time column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'doctors' AND column_name = 'average_consultation_time') THEN
        ALTER TABLE doctors ADD COLUMN average_consultation_time INTEGER DEFAULT 30;
    END IF;
    
    -- Add certifications column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'doctors' AND column_name = 'certifications') THEN
        ALTER TABLE doctors ADD COLUMN certifications JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    -- Add specializations column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'doctors' AND column_name = 'specializations') THEN
        ALTER TABLE doctors ADD COLUMN specializations JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    -- Add awards column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'doctors' AND column_name = 'awards') THEN
        ALTER TABLE doctors ADD COLUMN awards JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_doctor_work_schedules_doctor_id ON doctor_work_schedules(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_work_schedules_day ON doctor_work_schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_doctor_work_experiences_doctor_id ON doctor_work_experiences(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_work_experiences_current ON doctor_work_experiences(doctor_id, is_current);
CREATE INDEX IF NOT EXISTS idx_doctor_reviews_doctor_id ON doctor_reviews(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_reviews_rating ON doctor_reviews(doctor_id, rating);
CREATE INDEX IF NOT EXISTS idx_doctor_emergency_contacts_doctor_id ON doctor_emergency_contacts(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_settings_doctor_id ON doctor_settings(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_statistics_doctor_id ON doctor_statistics(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_statistics_date ON doctor_statistics(doctor_id, stat_date);

-- Comments for documentation
COMMENT ON TABLE doctor_work_schedules IS 'Stores weekly work schedule for each doctor';
COMMENT ON TABLE doctor_work_experiences IS 'Stores work history and experience of doctors';
COMMENT ON TABLE doctor_reviews IS 'Stores patient reviews and ratings for doctors';
COMMENT ON TABLE doctor_emergency_contacts IS 'Stores emergency contact information for doctors';
COMMENT ON TABLE doctor_settings IS 'Stores personal preferences and settings for doctors';
COMMENT ON TABLE doctor_statistics IS 'Stores daily statistics and performance metrics for doctors';
