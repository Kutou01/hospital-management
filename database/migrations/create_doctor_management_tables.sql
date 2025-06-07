-- =====================================================
-- DOCTOR MANAGEMENT MICROSERVICE - DATABASE SCHEMA
-- Hospital Management System - Enhanced Doctor Features
-- =====================================================

-- This script creates tables for enhanced doctor management features:
-- 1. Doctor Schedules - Lịch làm việc của bác sĩ
-- 2. Doctor Reviews - Đánh giá và nhận xét từ bệnh nhân  
-- 3. Doctor Shifts - Quản lý ca trực
-- 4. Doctor Experiences - Kinh nghiệm và học vấn chi tiết

-- =====================================================
-- 1. DOCTOR SCHEDULES TABLE - Lịch làm việc bác sĩ
-- =====================================================

CREATE TABLE IF NOT EXISTS doctor_schedules (
    schedule_id VARCHAR(20) PRIMARY KEY DEFAULT ('SCH' || LPAD(nextval('doctor_id_seq')::TEXT, 6, '0')),
    doctor_id VARCHAR(20) NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    break_start TIME,
    break_end TIME,
    max_appointments INTEGER DEFAULT 10,
    slot_duration INTEGER DEFAULT 30, -- Duration in minutes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT valid_time_range CHECK (start_time < end_time),
    CONSTRAINT valid_break_time CHECK (
        (break_start IS NULL AND break_end IS NULL) OR 
        (break_start IS NOT NULL AND break_end IS NOT NULL AND break_start < break_end)
    ),
    CONSTRAINT valid_slot_duration CHECK (slot_duration > 0 AND slot_duration <= 120),
    CONSTRAINT valid_max_appointments CHECK (max_appointments > 0 AND max_appointments <= 50)
);

-- Unique constraint: One schedule per doctor per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_doctor_schedule_unique 
ON doctor_schedules(doctor_id, day_of_week);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_doctor_id ON doctor_schedules(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_day ON doctor_schedules(day_of_week);

-- =====================================================
-- 2. DOCTOR REVIEWS TABLE - Đánh giá từ bệnh nhân
-- =====================================================

CREATE TABLE IF NOT EXISTS doctor_reviews (
    review_id VARCHAR(20) PRIMARY KEY DEFAULT ('REV' || LPAD(nextval('doctor_id_seq')::TEXT, 6, '0')),
    doctor_id VARCHAR(20) NOT NULL,
    patient_id VARCHAR(20) NOT NULL,
    appointment_id VARCHAR(20), -- Optional: link to specific appointment
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    review_date DATE DEFAULT CURRENT_DATE,
    is_anonymous BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE, -- TRUE if from actual appointment
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT valid_helpful_count CHECK (helpful_count >= 0)
);

-- Unique constraint: One review per patient per appointment (if appointment_id exists)
CREATE UNIQUE INDEX IF NOT EXISTS idx_patient_appointment_review 
ON doctor_reviews(patient_id, appointment_id) 
WHERE appointment_id IS NOT NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_doctor_reviews_doctor_id ON doctor_reviews(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_reviews_patient_id ON doctor_reviews(patient_id);
CREATE INDEX IF NOT EXISTS idx_doctor_reviews_rating ON doctor_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_doctor_reviews_date ON doctor_reviews(review_date);

-- =====================================================
-- 3. DOCTOR SHIFTS TABLE - Quản lý ca trực
-- =====================================================

CREATE TABLE IF NOT EXISTS doctor_shifts (
    shift_id VARCHAR(20) PRIMARY KEY DEFAULT ('SHF' || LPAD(nextval('doctor_id_seq')::TEXT, 6, '0')),
    doctor_id VARCHAR(20) NOT NULL,
    shift_type VARCHAR(20) NOT NULL CHECK (shift_type IN ('morning', 'afternoon', 'night', 'emergency')),
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    department_id VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
    is_emergency_shift BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE RESTRICT,
    
    -- Constraints
    CONSTRAINT valid_shift_time CHECK (start_time < end_time),
    CONSTRAINT valid_shift_date CHECK (shift_date >= CURRENT_DATE - INTERVAL '1 year')
);

-- Unique constraint: One shift per doctor per time slot
CREATE UNIQUE INDEX IF NOT EXISTS idx_doctor_shift_unique 
ON doctor_shifts(doctor_id, shift_date, start_time, end_time);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_doctor_shifts_doctor_id ON doctor_shifts(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_shifts_date ON doctor_shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_doctor_shifts_department ON doctor_shifts(department_id);
CREATE INDEX IF NOT EXISTS idx_doctor_shifts_type ON doctor_shifts(shift_type);
CREATE INDEX IF NOT EXISTS idx_doctor_shifts_status ON doctor_shifts(status);

-- =====================================================
-- 4. DOCTOR EXPERIENCES TABLE - Kinh nghiệm và học vấn
-- =====================================================

CREATE TABLE IF NOT EXISTS doctor_experiences (
    experience_id VARCHAR(20) PRIMARY KEY DEFAULT ('EXP' || LPAD(nextval('doctor_id_seq')::TEXT, 6, '0')),
    doctor_id VARCHAR(20) NOT NULL,
    institution_name VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT,
    experience_type VARCHAR(20) NOT NULL CHECK (experience_type IN ('work', 'education', 'certification', 'research')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT valid_date_range CHECK (
        (end_date IS NULL AND is_current = TRUE) OR 
        (end_date IS NOT NULL AND start_date <= end_date)
    ),
    CONSTRAINT valid_start_date CHECK (start_date >= '1950-01-01'),
    CONSTRAINT valid_end_date CHECK (end_date IS NULL OR end_date <= CURRENT_DATE + INTERVAL '1 year')
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_doctor_experiences_doctor_id ON doctor_experiences(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_experiences_type ON doctor_experiences(experience_type);
CREATE INDEX IF NOT EXISTS idx_doctor_experiences_current ON doctor_experiences(is_current);
CREATE INDEX IF NOT EXISTS idx_doctor_experiences_dates ON doctor_experiences(start_date, end_date);

-- =====================================================
-- 5. UPDATE EXISTING DOCTORS TABLE
-- =====================================================

-- Add new columns to doctors table for enhanced profile
DO $$
BEGIN
    -- Add bio column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'doctors' AND column_name = 'bio') THEN
        ALTER TABLE doctors ADD COLUMN bio TEXT;
    END IF;

    -- Add experience_years if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'doctors' AND column_name = 'experience_years') THEN
        ALTER TABLE doctors ADD COLUMN experience_years INTEGER CHECK (experience_years >= 0 AND experience_years <= 50);
    END IF;

    -- Add consultation_fee if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'doctors' AND column_name = 'consultation_fee') THEN
        ALTER TABLE doctors ADD COLUMN consultation_fee DECIMAL(8,2) CHECK (consultation_fee >= 0);
    END IF;

    -- Add languages_spoken if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'doctors' AND column_name = 'languages_spoken') THEN
        ALTER TABLE doctors ADD COLUMN languages_spoken TEXT[]; -- Array of languages
    END IF;

    -- Add certifications if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'doctors' AND column_name = 'certifications') THEN
        ALTER TABLE doctors ADD COLUMN certifications TEXT[]; -- Array of certifications
    END IF;

    -- Add awards if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'doctors' AND column_name = 'awards') THEN
        ALTER TABLE doctors ADD COLUMN awards TEXT[]; -- Array of awards
    END IF;

    -- Add research_interests if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'doctors' AND column_name = 'research_interests') THEN
        ALTER TABLE doctors ADD COLUMN research_interests TEXT[]; -- Array of research interests
    END IF;

    -- Add status if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'doctors' AND column_name = 'status') THEN
        ALTER TABLE doctors ADD COLUMN status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave'));
    END IF;
END $$;

-- =====================================================
-- 6. CREATE FUNCTIONS FOR STATISTICS
-- =====================================================

-- Function to calculate doctor review statistics
CREATE OR REPLACE FUNCTION get_doctor_review_stats(doctor_id_param VARCHAR(20))
RETURNS TABLE (
    total_reviews BIGINT,
    average_rating NUMERIC(3,2),
    five_star BIGINT,
    four_star BIGINT,
    three_star BIGINT,
    two_star BIGINT,
    one_star BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_reviews,
        ROUND(AVG(rating), 2) as average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END)::BIGINT as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END)::BIGINT as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END)::BIGINT as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END)::BIGINT as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END)::BIGINT as one_star
    FROM doctor_reviews 
    WHERE doctor_reviews.doctor_id = doctor_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to get doctor availability for a specific date
CREATE OR REPLACE FUNCTION get_doctor_availability(doctor_id_param VARCHAR(20), check_date DATE)
RETURNS TABLE (
    is_available BOOLEAN,
    start_time TIME,
    end_time TIME,
    break_start TIME,
    break_end TIME,
    max_appointments INTEGER,
    slot_duration INTEGER
) AS $$
DECLARE
    day_of_week_num INTEGER;
BEGIN
    -- Get day of week (0=Sunday, 6=Saturday)
    day_of_week_num := EXTRACT(DOW FROM check_date);
    
    RETURN QUERY
    SELECT 
        ds.is_available,
        ds.start_time,
        ds.end_time,
        ds.break_start,
        ds.break_end,
        ds.max_appointments,
        ds.slot_duration
    FROM doctor_schedules ds
    WHERE ds.doctor_id = doctor_id_param 
    AND ds.day_of_week = day_of_week_num;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all new tables
CREATE TRIGGER update_doctor_schedules_updated_at
    BEFORE UPDATE ON doctor_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctor_reviews_updated_at
    BEFORE UPDATE ON doctor_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctor_shifts_updated_at
    BEFORE UPDATE ON doctor_shifts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctor_experiences_updated_at
    BEFORE UPDATE ON doctor_experiences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. INSERT SAMPLE DATA (Optional)
-- =====================================================

-- Sample doctor schedules (uncomment to use)
/*
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, is_available, break_start, break_end, max_appointments, slot_duration) VALUES
('DOC000001', 1, '08:00', '17:00', TRUE, '12:00', '13:00', 16, 30), -- Monday
('DOC000001', 2, '08:00', '17:00', TRUE, '12:00', '13:00', 16, 30), -- Tuesday
('DOC000001', 3, '08:00', '17:00', TRUE, '12:00', '13:00', 16, 30), -- Wednesday
('DOC000001', 4, '08:00', '17:00', TRUE, '12:00', '13:00', 16, 30), -- Thursday
('DOC000001', 5, '08:00', '12:00', TRUE, NULL, NULL, 8, 30); -- Friday (half day)
*/

-- =====================================================
-- SCRIPT COMPLETED
-- =====================================================

-- Verify tables were created
SELECT 
    'DOCTOR MANAGEMENT TABLES CREATED' as status,
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE t.table_schema = 'public' 
AND t.table_name IN ('doctor_schedules', 'doctor_reviews', 'doctor_shifts', 'doctor_experiences')
ORDER BY t.table_name;
