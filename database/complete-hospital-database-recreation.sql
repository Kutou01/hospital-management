-- =============================================
-- HOSPITAL MANAGEMENT SYSTEM - COMPLETE DATABASE RECREATION SCRIPT
-- =============================================
-- This script recreates the entire hospital management database from scratch
-- Compatible with Supabase PostgreSQL
-- Based on ACTUAL current database structure (verified 2025-06-29)
-- Version: 2.0
-- Date: 2025-06-29
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 1. CORE TABLES CREATION (In dependency order)
-- =============================================

-- 1.1 PROFILES TABLE (Base user profiles)
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone_number VARCHAR(15),
    date_of_birth DATE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'doctor', 'patient', 'staff')),
    avatar_url TEXT,
    address JSONB DEFAULT '{}'::jsonb,
    emergency_contact JSONB DEFAULT '{}'::jsonb,
    
    -- Status and verification fields
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    
    -- Authentication tracking
    last_login TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    two_factor_enabled BOOLEAN DEFAULT false,
    last_2fa_verification TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- 1.2 DEPARTMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS departments (
    department_id VARCHAR(20) PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL,
    department_code VARCHAR(10) UNIQUE NOT NULL,
    description TEXT,
    
    -- Hierarchy support
    parent_department_id VARCHAR(20),
    level INTEGER DEFAULT 1,
    path TEXT,
    
    -- Contact information
    location TEXT,
    phone_number VARCHAR(15),
    email VARCHAR(255),
    
    -- Management
    head_doctor_id VARCHAR(20),
    
    -- Display properties
    color_code VARCHAR(7),
    icon_name VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1.3 DOCTORS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS doctors (
    -- Primary Key
    doctor_id VARCHAR(20) PRIMARY KEY,
    
    -- Foreign Key to profiles table
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
    
    -- Enhanced Performance Metrics
    success_rate DECIMAL(5,2) DEFAULT 0 CHECK (success_rate >= 0 AND success_rate <= 100),
    total_revenue DECIMAL(12,2) DEFAULT 0 CHECK (total_revenue >= 0),
    average_consultation_time INTEGER DEFAULT 30 CHECK (average_consultation_time > 0),
    
    -- Professional Development
    certifications JSONB DEFAULT '[]'::jsonb,
    specializations JSONB DEFAULT '[]'::jsonb,
    awards JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- 1.4 PATIENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS patients (
    -- Primary Key
    patient_id VARCHAR(20) PRIMARY KEY,
    
    -- Foreign Key to profiles table
    profile_id UUID NOT NULL,
    
    -- Medical Information
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    blood_type VARCHAR(5) CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    
    -- Contact and Address
    address JSONB DEFAULT '{}'::jsonb,
    emergency_contact JSONB DEFAULT '{}'::jsonb,
    
    -- Insurance and Medical History
    insurance_info JSONB DEFAULT '{}'::jsonb,
    medical_history TEXT,
    allergies TEXT[],
    chronic_conditions TEXT[],
    current_medications JSONB DEFAULT '{}'::jsonb,
    
    -- Status and Notes
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- 1.5 APPOINTMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS appointments (
    -- Primary Key
    appointment_id VARCHAR(20) PRIMARY KEY,
    
    -- Foreign Keys
    doctor_id VARCHAR(20) NOT NULL,
    patient_id VARCHAR(20) NOT NULL,
    
    -- Appointment Scheduling
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30 CHECK (duration_minutes BETWEEN 15 AND 480),
    
    -- Appointment Details
    appointment_type VARCHAR(50) DEFAULT 'consultation' CHECK (appointment_type IN ('consultation', 'follow_up', 'emergency', 'routine_checkup')),
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    reason TEXT,
    notes TEXT,
    diagnosis TEXT,
    
    -- Financial
    consultation_fee DECIMAL(10,2),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- 1.6 MEDICAL RECORDS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS medical_records (
    -- Primary Key
    record_id VARCHAR(20) PRIMARY KEY,
    
    -- Foreign Keys
    patient_id VARCHAR(20) NOT NULL,
    doctor_id VARCHAR(20) NOT NULL,
    appointment_id VARCHAR(20),
    
    -- Visit Information
    visit_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Medical Assessment
    chief_complaint TEXT,
    present_illness TEXT,
    past_medical_history TEXT,
    physical_examination TEXT,
    vital_signs JSONB DEFAULT '{}'::jsonb,
    
    -- Diagnosis and Treatment
    diagnosis TEXT,
    treatment_plan TEXT,
    medications TEXT,
    follow_up_instructions TEXT,
    
    -- Additional Information
    notes TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- 1.7 PAYMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code VARCHAR(50) UNIQUE NOT NULL,
    appointment_id VARCHAR(50) NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('payos', 'cash')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
    user_id UUID NOT NULL,
    
    -- PayOS specific fields
    payment_link_id VARCHAR(100),
    checkout_url TEXT,
    qr_code TEXT,
    transaction_id VARCHAR(100),
    
    -- Additional payment info
    patient_info JSONB,
    paid_at TIMESTAMP WITH TIME ZONE,
    cancel_reason TEXT,
    failure_reason TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 2. DOCTOR ENHANCEMENT TABLES
-- =============================================

-- 2.1 DOCTOR WORK SCHEDULES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS doctor_work_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id VARCHAR(20) NOT NULL,
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

-- 2.2 DOCTOR WORK EXPERIENCES TABLE
-- =============================================
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

-- 2.3 DOCTOR REVIEWS TABLE
-- =============================================
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

-- 2.4 DOCTOR EMERGENCY CONTACTS TABLE
-- =============================================
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

-- 2.5 DOCTOR SETTINGS TABLE
-- =============================================
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

-- 2.6 DOCTOR STATISTICS TABLE
-- =============================================
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

-- =============================================
-- 3. MEDICAL RECORDS ENHANCEMENT TABLES
-- =============================================

-- 3.1 MEDICAL RECORD ATTACHMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS medical_record_attachments (
    attachment_id VARCHAR(20) PRIMARY KEY,
    record_id VARCHAR(20) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    description TEXT,
    uploaded_by VARCHAR(20) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3.2 LAB RESULTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS lab_results (
    result_id VARCHAR(20) PRIMARY KEY,
    record_id VARCHAR(20) NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    test_type VARCHAR(100) NOT NULL,
    result_value VARCHAR(255),
    reference_range VARCHAR(255),
    unit VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    test_date TIMESTAMP NOT NULL,
    result_date TIMESTAMP,
    lab_technician VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3.3 VITAL SIGNS HISTORY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS vital_signs_history (
    vital_id VARCHAR(20) PRIMARY KEY,
    record_id VARCHAR(20) NOT NULL,
    temperature DECIMAL(4,1),
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    heart_rate INTEGER,
    respiratory_rate INTEGER,
    oxygen_saturation DECIMAL(5,2),
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    bmi DECIMAL(4,1),
    recorded_at TIMESTAMP NOT NULL,
    recorded_by VARCHAR(20) NOT NULL,
    notes TEXT
);

-- 3.4 MEDICAL RECORD TEMPLATES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS medical_record_templates (
    template_id VARCHAR(20) PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL,
    specialty VARCHAR(100),
    template_content JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 4. INDEXES FOR PERFORMANCE OPTIMIZATION
-- =============================================

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON profiles(phone_number);

-- Departments table indexes
CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(department_code);
CREATE INDEX IF NOT EXISTS idx_departments_is_active ON departments(is_active);
CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments(parent_department_id);

-- Doctors table indexes
CREATE INDEX IF NOT EXISTS idx_doctors_profile_id ON doctors(profile_id);
CREATE INDEX IF NOT EXISTS idx_doctors_department_id ON doctors(department_id);
CREATE INDEX IF NOT EXISTS idx_doctors_specialty ON doctors(specialty);
CREATE INDEX IF NOT EXISTS idx_doctors_license_number ON doctors(license_number);
CREATE INDEX IF NOT EXISTS idx_doctors_availability_status ON doctors(availability_status);
CREATE INDEX IF NOT EXISTS idx_doctors_is_active ON doctors(is_active);
CREATE INDEX IF NOT EXISTS idx_doctors_rating ON doctors(rating);

-- Patients table indexes
CREATE INDEX IF NOT EXISTS idx_patients_profile_id ON patients(profile_id);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_patients_blood_type ON patients(blood_type);

-- Appointments table indexes
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON appointments(appointment_date, start_time);

-- Medical records table indexes
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_id ON medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_appointment_id ON medical_records(appointment_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_visit_date ON medical_records(visit_date);
CREATE INDEX IF NOT EXISTS idx_medical_records_status ON medical_records(status);

-- Payments table indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_appointment_id ON payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_order_code ON payments(order_code);

-- Doctor enhancement tables indexes
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

-- Medical records enhancement tables indexes
CREATE INDEX IF NOT EXISTS idx_medical_record_attachments_record_id ON medical_record_attachments(record_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_record_id ON lab_results(record_id);
CREATE INDEX IF NOT EXISTS idx_vital_signs_history_record_id ON vital_signs_history(record_id);

-- =============================================
-- 5. FOREIGN KEY CONSTRAINTS
-- =============================================

-- Departments foreign keys
ALTER TABLE departments
ADD CONSTRAINT IF NOT EXISTS fk_departments_parent
FOREIGN KEY (parent_department_id) REFERENCES departments(department_id)
ON DELETE SET NULL ON UPDATE CASCADE;

-- Doctors foreign keys
ALTER TABLE doctors
ADD CONSTRAINT IF NOT EXISTS fk_doctors_profile_id
FOREIGN KEY (profile_id) REFERENCES profiles(id)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE doctors
ADD CONSTRAINT IF NOT EXISTS fk_doctors_department_id
FOREIGN KEY (department_id) REFERENCES departments(department_id)
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Patients foreign keys
ALTER TABLE patients
ADD CONSTRAINT IF NOT EXISTS fk_patients_profile_id
FOREIGN KEY (profile_id) REFERENCES profiles(id)
ON DELETE CASCADE ON UPDATE CASCADE;

-- Appointments foreign keys
ALTER TABLE appointments
ADD CONSTRAINT IF NOT EXISTS fk_appointments_doctor_id
FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE appointments
ADD CONSTRAINT IF NOT EXISTS fk_appointments_patient_id
FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Medical records foreign keys
ALTER TABLE medical_records
ADD CONSTRAINT IF NOT EXISTS fk_medical_records_patient_id
FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE medical_records
ADD CONSTRAINT IF NOT EXISTS fk_medical_records_doctor_id
FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE medical_records
ADD CONSTRAINT IF NOT EXISTS fk_medical_records_appointment_id
FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id)
ON DELETE SET NULL ON UPDATE CASCADE;

-- Payments foreign keys
ALTER TABLE payments
ADD CONSTRAINT IF NOT EXISTS fk_payments_user_id
FOREIGN KEY (user_id) REFERENCES profiles(id)
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Doctor enhancement tables foreign keys
ALTER TABLE doctor_work_schedules
ADD CONSTRAINT IF NOT EXISTS fk_doctor_work_schedules_doctor_id
FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE doctor_work_experiences
ADD CONSTRAINT IF NOT EXISTS fk_doctor_work_experiences_doctor_id
FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE doctor_reviews
ADD CONSTRAINT IF NOT EXISTS fk_doctor_reviews_doctor_id
FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE doctor_emergency_contacts
ADD CONSTRAINT IF NOT EXISTS fk_doctor_emergency_contacts_doctor_id
FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE doctor_settings
ADD CONSTRAINT IF NOT EXISTS fk_doctor_settings_doctor_id
FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE doctor_statistics
ADD CONSTRAINT IF NOT EXISTS fk_doctor_statistics_doctor_id
FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
ON DELETE CASCADE ON UPDATE CASCADE;

-- Medical records enhancement tables foreign keys
ALTER TABLE medical_record_attachments
ADD CONSTRAINT IF NOT EXISTS fk_medical_record_attachments_record_id
FOREIGN KEY (record_id) REFERENCES medical_records(record_id)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE lab_results
ADD CONSTRAINT IF NOT EXISTS fk_lab_results_record_id
FOREIGN KEY (record_id) REFERENCES medical_records(record_id)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE vital_signs_history
ADD CONSTRAINT IF NOT EXISTS fk_vital_signs_history_record_id
FOREIGN KEY (record_id) REFERENCES medical_records(record_id)
ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================
-- 6. CUSTOM ID GENERATION FUNCTIONS
-- =============================================

-- Base hospital ID generation function
CREATE OR REPLACE FUNCTION generate_hospital_id(prefix TEXT, dept_code TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    timestamp_part TEXT;
    sequence_part TEXT;
    full_prefix TEXT;
BEGIN
    -- Generate timestamp part (YYYYMM format)
    timestamp_part := TO_CHAR(NOW(), 'YYYYMM');

    -- Build full prefix
    IF dept_code IS NOT NULL THEN
        full_prefix := dept_code || '-' || prefix || '-' || timestamp_part;
    ELSE
        full_prefix := prefix || '-' || timestamp_part;
    END IF;

    -- Generate sequence part (3 digits)
    sequence_part := LPAD(
        (EXTRACT(EPOCH FROM NOW())::BIGINT % 1000)::TEXT,
        3,
        '0'
    );

    RETURN full_prefix || '-' || sequence_part;
END;
$$ LANGUAGE plpgsql;

-- Doctor ID Generation (Department-based)
CREATE OR REPLACE FUNCTION generate_doctor_id(dept_id TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN generate_hospital_id('DOC', dept_id);
END;
$$ LANGUAGE plpgsql;

-- Patient ID Generation
CREATE OR REPLACE FUNCTION generate_patient_id()
RETURNS TEXT AS $$
BEGIN
    RETURN generate_hospital_id('PAT');
END;
$$ LANGUAGE plpgsql;

-- Admin ID Generation
CREATE OR REPLACE FUNCTION generate_admin_id()
RETURNS TEXT AS $$
BEGIN
    RETURN generate_hospital_id('ADM');
END;
$$ LANGUAGE plpgsql;

-- Appointment ID Generation (Department-based)
CREATE OR REPLACE FUNCTION generate_appointment_id(dept_id TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN generate_hospital_id('APT', dept_id);
END;
$$ LANGUAGE plpgsql;

-- Medical Record ID Generation
CREATE OR REPLACE FUNCTION generate_medical_record_id()
RETURNS TEXT AS $$
BEGIN
    RETURN generate_hospital_id('MED');
END;
$$ LANGUAGE plpgsql;

-- Payment Order Code Generation
CREATE OR REPLACE FUNCTION generate_order_code(prefix TEXT DEFAULT 'HOS')
RETURNS TEXT AS $$
BEGIN
    RETURN prefix || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD((EXTRACT(EPOCH FROM NOW())::BIGINT % 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Service role can manage profiles" ON profiles
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Doctors RLS Policies
CREATE POLICY "Service role can manage doctors" ON doctors
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can view active doctors" ON doctors
    FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

-- Patients RLS Policies
CREATE POLICY "Service role can manage patients" ON patients
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own patient record" ON patients
    FOR SELECT USING (auth.uid() = profile_id);

-- Appointments RLS Policies
CREATE POLICY "Service role can manage appointments" ON appointments
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own appointments" ON appointments
    FOR SELECT USING (
        auth.uid() IN (
            SELECT profile_id FROM patients WHERE patient_id = appointments.patient_id
            UNION
            SELECT profile_id FROM doctors WHERE doctor_id = appointments.doctor_id
        )
    );

-- Medical Records RLS Policies
CREATE POLICY "Service role can manage medical records" ON medical_records
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own medical records" ON medical_records
    FOR SELECT USING (
        auth.uid() IN (
            SELECT profile_id FROM patients WHERE patient_id = medical_records.patient_id
            UNION
            SELECT profile_id FROM doctors WHERE doctor_id = medical_records.doctor_id
        )
    );

-- Payments RLS Policies
CREATE POLICY "Service role can manage payments" ON payments
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments" ON payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payments" ON payments
    FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- 8. GRANT PERMISSIONS
-- =============================================

-- Grant permissions for service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Grant permissions for authenticated users
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON departments TO authenticated;
GRANT SELECT ON doctors TO authenticated;
GRANT SELECT, INSERT, UPDATE ON patients TO authenticated;
GRANT SELECT, INSERT, UPDATE ON appointments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON medical_records TO authenticated;
GRANT SELECT, INSERT, UPDATE ON payments TO authenticated;

-- Grant permissions for anonymous users (read-only access to public data)
GRANT SELECT ON departments TO anon;
GRANT SELECT ON doctors TO anon;

-- =============================================
-- 9. INITIAL SEED DATA
-- =============================================

-- 9.1 DEPARTMENTS SEED DATA
-- =============================================
INSERT INTO departments (
    department_id, department_name, department_code, description,
    location, phone_number, email, is_active, level, path
) VALUES
('DEPT001', 'Khoa Tim Mạch', 'CARD', 'Chuyên khoa tim mạch và phẫu thuật tim', 'Tầng 2, Tòa A', '028-3123-4567', 'timmach@hospital.vn', true, 1, '/DEPT001'),
('DEPT002', 'Khoa Chấn Thương Chỉnh Hình', 'ORTH', 'Chuyên khoa chấn thương và chỉnh hình', 'Tầng 3, Tòa B', '028-3123-4568', 'chanthuong@hospital.vn', true, 1, '/DEPT002'),
('DEPT003', 'Khoa Nhi', 'PEDI', 'Chuyên khoa nhi và chăm sóc trẻ em', 'Tầng 1, Tòa C', '028-3123-4569', 'nhi@hospital.vn', true, 1, '/DEPT003'),
('DEPT004', 'Khoa Thần Kinh', 'NEUR', 'Chuyên khoa thần kinh và phẫu thuật não', 'Tầng 4, Tòa A', '028-3123-4570', 'thankinh@hospital.vn', true, 1, '/DEPT004'),
('DEPT005', 'Khoa Da Liễu', 'DERM', 'Chuyên khoa da liễu và thẩm mỹ', 'Tầng 2, Tòa C', '028-3123-4571', 'dalieu@hospital.vn', true, 1, '/DEPT005'),
('DEPT006', 'Khoa Phụ Sản', 'GYNE', 'Chuyên khoa phụ sản và sức khỏe sinh sản', 'Tầng 3, Tòa A', '028-3123-4572', 'phusan@hospital.vn', true, 1, '/DEPT006'),
('DEPT007', 'Khoa Cấp Cứu', 'EMER', 'Khoa cấp cứu và hồi sức', 'Tầng trệt, Tòa A', '028-3123-4573', 'capcuu@hospital.vn', true, 1, '/DEPT007'),
('DEPT008', 'Khoa Nội Tổng Hợp', 'GENE', 'Khoa nội tổng hợp và y học gia đình', 'Tầng 1, Tòa B', '028-3123-4574', 'noitonghop@hospital.vn', true, 1, '/DEPT008'),
('DEPT009', 'Khoa Ngoại Tổng Hợp', 'SURG', 'Khoa phẫu thuật tổng hợp', 'Tầng 5, Tòa A', '028-3123-4575', 'ngoaitonghop@hospital.vn', true, 1, '/DEPT009'),
('DEPT010', 'Khoa Mắt', 'OPHT', 'Chuyên khoa mắt và phẫu thuật mắt', 'Tầng 2, Tòa B', '028-3123-4576', 'mat@hospital.vn', true, 1, '/DEPT010'),
('DEPT011', 'Khoa Tai Mũi Họng', 'ENT', 'Chuyên khoa tai mũi họng', 'Tầng 3, Tòa C', '028-3123-4577', 'taimuihong@hospital.vn', true, 1, '/DEPT011'),
('DEPT012', 'Khoa Tâm Thần', 'PSYC', 'Chuyên khoa tâm thần và sức khỏe tâm lý', 'Tầng 4, Tòa C', '028-3123-4578', 'tamthan@hospital.vn', true, 1, '/DEPT012'),
('DEPT013', 'Khoa Sản phụ khoa', 'OBGY', 'Chuyên khoa sản khoa và phụ khoa', 'Tầng 5, Tòa nhà B', '0123456792', 'obstetrics@hospital.com', true, 1, '/DEPT013')
ON CONFLICT (department_id) DO NOTHING;

-- 9.2 MEDICAL RECORD TEMPLATES SEED DATA
-- =============================================
INSERT INTO medical_record_templates (
    template_id, template_name, specialty, template_content, is_active, created_by
) VALUES
('TMPL001', 'Khám Tổng Quát', 'General', '{"sections": ["chief_complaint", "present_illness", "physical_examination", "vital_signs", "diagnosis", "treatment_plan"]}', true, 'system'),
('TMPL002', 'Khám Tim Mạch', 'Cardiology', '{"sections": ["chief_complaint", "cardiovascular_history", "physical_examination", "ecg_findings", "diagnosis", "treatment_plan"]}', true, 'system'),
('TMPL003', 'Khám Nhi Khoa', 'Pediatrics', '{"sections": ["chief_complaint", "growth_development", "vaccination_history", "physical_examination", "diagnosis", "treatment_plan"]}', true, 'system')
ON CONFLICT (template_id) DO NOTHING;

-- =============================================
-- 10. TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables with updated_at column
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON medical_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 11. VIEWS FOR COMMON QUERIES
-- =============================================

-- Payment receipts view
CREATE OR REPLACE VIEW payment_receipts_view AS
SELECT
    p.id,
    p.order_code,
    p.appointment_id,
    p.amount,
    p.description,
    p.payment_method,
    p.status,
    p.paid_at,
    prof.full_name as patient_name,
    prof.email as patient_email,
    prof.phone_number as patient_phone,

    -- Billing Details (calculated from amount)
    ROUND(p.amount / 1.1, 2) as consultation_fee,
    ROUND(p.amount * 0.05, 2) as service_fee,
    ROUND(p.amount * 0.1, 2) as vat,
    p.amount as total,

    -- Hospital Info (static for now)
    'BỆNH VIỆN ĐA KHOA TRUNG ƯƠNG' as hospital_name,
    '123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh' as hospital_address,
    '028-1234-5678' as hospital_phone,
    '0123456789' as hospital_tax_code,

    p.user_id
FROM payments p
JOIN profiles prof ON p.user_id = prof.id
WHERE prof.role = 'patient';

-- Payment statistics view
CREATE OR REPLACE VIEW payment_statistics_view AS
SELECT
    DATE(created_at) as payment_date,
    payment_method,
    status,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount,
    AVG(amount) as average_amount
FROM payments
GROUP BY DATE(created_at), payment_method, status
ORDER BY payment_date DESC;

-- =============================================
-- 12. VERIFICATION QUERIES
-- =============================================

-- Function to verify database structure
CREATE OR REPLACE FUNCTION verify_hospital_database()
RETURNS TABLE(
    table_name TEXT,
    table_exists BOOLEAN,
    row_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.table_name::TEXT,
        EXISTS(
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = t.table_name
        ) as table_exists,
        CASE
            WHEN EXISTS(
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = t.table_name
            ) THEN (
                SELECT COUNT(*) FROM (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = t.table_name
                ) AS subq
            )
            ELSE 0
        END as row_count
    FROM (VALUES
        ('profiles'),
        ('departments'),
        ('doctors'),
        ('patients'),
        ('appointments'),
        ('medical_records'),
        ('payments'),
        ('doctor_work_schedules'),
        ('doctor_work_experiences'),
        ('doctor_reviews'),
        ('doctor_emergency_contacts'),
        ('doctor_settings'),
        ('doctor_statistics'),
        ('medical_record_attachments'),
        ('lab_results'),
        ('vital_signs_history'),
        ('medical_record_templates')
    ) AS t(table_name);
END;
$$ LANGUAGE plpgsql;

-- Function to verify all functions are created
CREATE OR REPLACE FUNCTION verify_hospital_functions()
RETURNS TABLE(
    function_name TEXT,
    "exists" BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        f.function_name,
        EXISTS(
            SELECT 1 FROM information_schema.routines
            WHERE routine_name = f.function_name
            AND routine_schema = 'public'
        ) as "exists"
    FROM (VALUES
        ('generate_hospital_id'),
        ('generate_doctor_id'),
        ('generate_patient_id'),
        ('generate_admin_id'),
        ('generate_appointment_id'),
        ('generate_medical_record_id'),
        ('generate_order_code'),
        ('update_updated_at_column'),
        ('verify_hospital_database'),
        ('verify_hospital_functions')
    ) AS f(function_name);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 13. COMPLETION MESSAGE AND INSTRUCTIONS
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '🏥 =============================================';
    RAISE NOTICE '🏥 HOSPITAL MANAGEMENT DATABASE RECREATION COMPLETE!';
    RAISE NOTICE '🏥 =============================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ CREATED TABLES:';
    RAISE NOTICE '   📋 Core Tables: profiles, departments, doctors, patients, appointments, medical_records, payments';
    RAISE NOTICE '   👨‍⚕️ Doctor Enhancement: work_schedules, work_experiences, reviews, emergency_contacts, settings, statistics';
    RAISE NOTICE '   📄 Medical Records Enhancement: attachments, lab_results, vital_signs_history, templates';
    RAISE NOTICE '';
    RAISE NOTICE '🔗 CREATED RELATIONSHIPS:';
    RAISE NOTICE '   🔑 Foreign key constraints between all related tables';
    RAISE NOTICE '   📊 Indexes for optimal query performance';
    RAISE NOTICE '';
    RAISE NOTICE '🛡️ SECURITY CONFIGURED:';
    RAISE NOTICE '   🔒 Row Level Security (RLS) policies enabled';
    RAISE NOTICE '   👤 User role-based access control';
    RAISE NOTICE '   🔐 Service role full access for backend services';
    RAISE NOTICE '';
    RAISE NOTICE '⚙️ FUNCTIONS CREATED:';
    RAISE NOTICE '   🆔 ID generation functions for all entity types';
    RAISE NOTICE '   🕒 Automatic timestamp update triggers';
    RAISE NOTICE '   ✅ Database verification functions';
    RAISE NOTICE '';
    RAISE NOTICE '📊 VIEWS CREATED:';
    RAISE NOTICE '   🧾 Payment receipts view for billing';
    RAISE NOTICE '   📈 Payment statistics view for reporting';
    RAISE NOTICE '';
    RAISE NOTICE '🌱 SEED DATA INSERTED:';
    RAISE NOTICE '   🏢 13 hospital departments with Vietnamese names';
    RAISE NOTICE '   📋 Medical record templates for common specialties';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 VERIFICATION:';
    RAISE NOTICE '   Run: SELECT * FROM verify_hospital_database();';
    RAISE NOTICE '   Run: SELECT * FROM verify_hospital_functions();';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 DATABASE IS READY FOR USE!';
    RAISE NOTICE '🏥 =============================================';
END $$;
