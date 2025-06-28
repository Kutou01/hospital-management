-- =============================================
-- Fix Trigger Conflicts - Doctor Profile Enhancements
-- Drops existing triggers before recreating them
-- =============================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_doctor_work_schedules_updated_at ON doctor_work_schedules;
DROP TRIGGER IF EXISTS update_doctor_work_experiences_updated_at ON doctor_work_experiences;
DROP TRIGGER IF EXISTS update_doctor_reviews_updated_at ON doctor_reviews;
DROP TRIGGER IF EXISTS update_doctor_emergency_contacts_updated_at ON doctor_emergency_contacts;
DROP TRIGGER IF EXISTS update_doctor_settings_updated_at ON doctor_settings;
DROP TRIGGER IF EXISTS update_doctor_statistics_updated_at ON doctor_statistics;

-- Ensure the function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Recreate triggers
CREATE TRIGGER update_doctor_work_schedules_updated_at 
    BEFORE UPDATE ON doctor_work_schedules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctor_work_experiences_updated_at 
    BEFORE UPDATE ON doctor_work_experiences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctor_reviews_updated_at 
    BEFORE UPDATE ON doctor_reviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctor_emergency_contacts_updated_at 
    BEFORE UPDATE ON doctor_emergency_contacts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctor_settings_updated_at 
    BEFORE UPDATE ON doctor_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctor_statistics_updated_at 
    BEFORE UPDATE ON doctor_statistics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify tables exist before inserting default data
DO $$
BEGIN
    -- Insert default work schedule for existing doctors (if table exists and has no conflicts)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_work_schedules') THEN
        INSERT INTO doctor_work_schedules (doctor_id, day_of_week, start_time, end_time, lunch_start_time, lunch_end_time)
        SELECT 
            doctor_id,
            generate_series(1, 5) as day_of_week, -- Monday to Friday
            '08:00'::TIME as start_time,
            '17:00'::TIME as end_time,
            '12:00'::TIME as lunch_start_time,
            '13:00'::TIME as lunch_end_time
        FROM doctors
        WHERE doctor_id NOT IN (SELECT DISTINCT doctor_id FROM doctor_work_schedules)
        ON CONFLICT (doctor_id, day_of_week) DO NOTHING;
    END IF;

    -- Insert default settings for existing doctors (if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_settings') THEN
        INSERT INTO doctor_settings (doctor_id)
        SELECT doctor_id
        FROM doctors
        WHERE doctor_id NOT IN (SELECT doctor_id FROM doctor_settings)
        ON CONFLICT (doctor_id) DO NOTHING;
    END IF;
END $$;
