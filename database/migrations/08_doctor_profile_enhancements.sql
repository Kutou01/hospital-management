-- =============================================
-- Doctor Profile Enhancements Migration
-- Adds tables and columns for enhanced doctor profile features
-- =============================================

-- 1. Work Schedule Management
CREATE TABLE IF NOT EXISTS doctor_work_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id VARCHAR(20) NOT NULL REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
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
    doctor_id VARCHAR(20) NOT NULL REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    hospital_name VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE, -- NULL means current job
    description TEXT,
    achievements TEXT,
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Patient Reviews and Ratings
CREATE TABLE IF NOT EXISTS doctor_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id VARCHAR(20) NOT NULL REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    patient_id VARCHAR(20) NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    appointment_id UUID, -- Reference to appointment if exists
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    review_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_anonymous BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(doctor_id, patient_id, appointment_id)
);

-- 4. Emergency Contacts
CREATE TABLE IF NOT EXISTS doctor_emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id VARCHAR(20) NOT NULL REFERENCES doctors(doctor_id) ON DELETE CASCADE,
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
    doctor_id VARCHAR(20) NOT NULL REFERENCES doctors(doctor_id) ON DELETE CASCADE,
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
    doctor_id VARCHAR(20) NOT NULL REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    stat_date DATE NOT NULL,
    total_appointments INTEGER DEFAULT 0,
    completed_appointments INTEGER DEFAULT 0,
    cancelled_appointments INTEGER DEFAULT 0,
    no_show_appointments INTEGER DEFAULT 0,
    new_patients INTEGER DEFAULT 0,
    returning_patients INTEGER DEFAULT 0,
    average_consultation_time INTEGER, -- in minutes
    revenue DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(doctor_id, stat_date)
);

-- Add new columns to existing doctors table
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS success_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_consultation_time INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS specializations JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS awards JSONB DEFAULT '[]'::jsonb;

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

-- Create triggers for updated_at (with DROP IF EXISTS to avoid conflicts)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_doctor_work_schedules_updated_at ON doctor_work_schedules;
CREATE TRIGGER update_doctor_work_schedules_updated_at BEFORE UPDATE ON doctor_work_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_doctor_work_experiences_updated_at ON doctor_work_experiences;
CREATE TRIGGER update_doctor_work_experiences_updated_at BEFORE UPDATE ON doctor_work_experiences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_doctor_reviews_updated_at ON doctor_reviews;
CREATE TRIGGER update_doctor_reviews_updated_at BEFORE UPDATE ON doctor_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_doctor_emergency_contacts_updated_at ON doctor_emergency_contacts;
CREATE TRIGGER update_doctor_emergency_contacts_updated_at BEFORE UPDATE ON doctor_emergency_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_doctor_settings_updated_at ON doctor_settings;
CREATE TRIGGER update_doctor_settings_updated_at BEFORE UPDATE ON doctor_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_doctor_statistics_updated_at ON doctor_statistics;
CREATE TRIGGER update_doctor_statistics_updated_at BEFORE UPDATE ON doctor_statistics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default work schedule for existing doctors
INSERT INTO doctor_work_schedules (doctor_id, day_of_week, start_time, end_time, lunch_start_time, lunch_end_time)
SELECT 
    doctor_id,
    generate_series(1, 5) as day_of_week, -- Monday to Friday
    '08:00'::TIME as start_time,
    '17:00'::TIME as end_time,
    '12:00'::TIME as lunch_start_time,
    '13:00'::TIME as lunch_end_time
FROM doctors
WHERE doctor_id NOT IN (SELECT DISTINCT doctor_id FROM doctor_work_schedules);

-- Insert default settings for existing doctors
INSERT INTO doctor_settings (doctor_id)
SELECT doctor_id
FROM doctors
WHERE doctor_id NOT IN (SELECT doctor_id FROM doctor_settings);

-- Comments for documentation
COMMENT ON TABLE doctor_work_schedules IS 'Stores weekly work schedule for each doctor';
COMMENT ON TABLE doctor_work_experiences IS 'Stores work history and experience of doctors';
COMMENT ON TABLE doctor_reviews IS 'Stores patient reviews and ratings for doctors';
COMMENT ON TABLE doctor_emergency_contacts IS 'Stores emergency contact information for doctors';
COMMENT ON TABLE doctor_settings IS 'Stores personal preferences and settings for doctors';
COMMENT ON TABLE doctor_statistics IS 'Stores daily statistics and performance metrics for doctors';
