-- =============================================
-- HOSPITAL MANAGEMENT SYSTEM - SIMPLE RECREATION SCRIPT
-- =============================================
-- Script đơn giản để tái tạo database dựa trên cấu trúc thực tế
-- Tránh các lỗi syntax phức tạp
-- Version: SIMPLE-1.0
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 1. CORE TABLES CREATION
-- =============================================

-- 1.1 PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'doctor', 'patient', 'staff')),
    phone_number VARCHAR(15),
    date_of_birth DATE,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    two_factor_enabled BOOLEAN DEFAULT false,
    last_2fa_verification TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- 1.2 DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS departments (
    department_id VARCHAR(20) PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL,
    department_code VARCHAR(10) UNIQUE NOT NULL,
    description TEXT,
    head_doctor_id VARCHAR(20),
    location TEXT,
    phone_number VARCHAR(15),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    code VARCHAR(10),
    name VARCHAR(100),
    color_code VARCHAR(7),
    icon_name VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    parent_department_id VARCHAR(20),
    level INTEGER DEFAULT 1,
    path TEXT
);

-- 1.3 SPECIALTIES TABLE
CREATE TABLE IF NOT EXISTS specialties (
    specialty_id VARCHAR(20) PRIMARY KEY,
    specialty_name VARCHAR(100) NOT NULL,
    specialty_code VARCHAR(10) UNIQUE NOT NULL,
    description TEXT,
    department_id VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    average_consultation_time INTEGER DEFAULT 30,
    consultation_fee_min DECIMAL(10,2),
    consultation_fee_max DECIMAL(10,2),
    consultation_fee_range JSONB,
    required_certifications JSONB,
    equipment_required JSONB,
    requirements JSONB,
    code VARCHAR(10),
    name VARCHAR(100),
    color_code VARCHAR(7),
    icon_name VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    parent_department_id VARCHAR(20)
);

-- 1.4 DOCTORS TABLE
CREATE TABLE IF NOT EXISTS doctors (
    doctor_id VARCHAR(20) PRIMARY KEY,
    profile_id UUID NOT NULL,
    department_id VARCHAR(20) NOT NULL,
    specialty VARCHAR(20) NOT NULL,
    specialty_id VARCHAR(20),
    qualification TEXT NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    bio TEXT,
    experience_years INTEGER DEFAULT 0 CHECK (experience_years >= 0),
    consultation_fee DECIMAL(10,2) CHECK (consultation_fee >= 0),
    address JSONB DEFAULT '{}',
    languages_spoken TEXT[] DEFAULT ARRAY['Vietnamese'],
    availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'offline', 'on_leave')),
    rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
    total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    is_active BOOLEAN DEFAULT true,
    success_rate DECIMAL(5,2) DEFAULT 0 CHECK (success_rate >= 0 AND success_rate <= 100),
    total_revenue DECIMAL(12,2) DEFAULT 0 CHECK (total_revenue >= 0),
    average_consultation_time INTEGER DEFAULT 30 CHECK (average_consultation_time > 0),
    certifications JSONB DEFAULT '[]',
    specializations JSONB DEFAULT '[]',
    awards JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- 1.5 PATIENTS TABLE
CREATE TABLE IF NOT EXISTS patients (
    patient_id VARCHAR(20) PRIMARY KEY,
    profile_id UUID NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    blood_type VARCHAR(5) CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    address JSONB DEFAULT '{}',
    emergency_contact JSONB DEFAULT '{}',
    insurance_info JSONB DEFAULT '{}',
    medical_history TEXT,
    allergies TEXT[],
    chronic_conditions TEXT[],
    current_medications JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- 1.6 APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS appointments (
    appointment_id VARCHAR(20) PRIMARY KEY,
    patient_id VARCHAR(20) NOT NULL,
    doctor_id VARCHAR(20) NOT NULL,
    room_id VARCHAR(20),
    department_id VARCHAR(20),
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    appointment_type VARCHAR(50) DEFAULT 'consultation' CHECK (appointment_type IN ('consultation', 'follow_up', 'emergency', 'routine_checkup')),
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    reason TEXT,
    notes TEXT,
    diagnosis TEXT,
    prescription TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- 1.7 MEDICAL RECORDS TABLE
CREATE TABLE IF NOT EXISTS medical_records (
    record_id VARCHAR(20) PRIMARY KEY,
    patient_id VARCHAR(20) NOT NULL,
    doctor_id VARCHAR(20) NOT NULL,
    appointment_id VARCHAR(20),
    visit_date TIMESTAMP WITH TIME ZONE NOT NULL,
    chief_complaint TEXT,
    present_illness TEXT,
    past_medical_history TEXT,
    physical_examination TEXT,
    vital_signs JSONB DEFAULT '{}',
    diagnosis TEXT,
    treatment_plan TEXT,
    medications TEXT,
    follow_up_instructions TEXT,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- 1.8 DOCTOR REVIEWS TABLE
CREATE TABLE IF NOT EXISTS doctor_reviews (
    review_id VARCHAR(20) PRIMARY KEY,
    doctor_id VARCHAR(20) NOT NULL,
    patient_id VARCHAR(20) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    review_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_verified BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1.9 ROOMS TABLE
CREATE TABLE IF NOT EXISTS rooms (
    room_id VARCHAR(20) PRIMARY KEY,
    room_number VARCHAR(10) NOT NULL,
    room_type_id VARCHAR(20),
    room_type VARCHAR(50) NOT NULL,
    department_id VARCHAR(20) NOT NULL,
    floor_number INTEGER,
    capacity INTEGER DEFAULT 1,
    current_occupancy INTEGER DEFAULT 0,
    amenities JSONB,
    equipment_ids TEXT[],
    location JSONB DEFAULT '{}',
    daily_rate DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'reserved')),
    description TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 2. INDEXES
-- =============================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

-- Departments indexes
CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(department_code);
CREATE INDEX IF NOT EXISTS idx_departments_is_active ON departments(is_active);

-- Specialties indexes
CREATE INDEX IF NOT EXISTS idx_specialties_code ON specialties(specialty_code);
CREATE INDEX IF NOT EXISTS idx_specialties_department ON specialties(department_id);

-- Doctors indexes
CREATE INDEX IF NOT EXISTS idx_doctors_profile_id ON doctors(profile_id);
CREATE INDEX IF NOT EXISTS idx_doctors_department_id ON doctors(department_id);
CREATE INDEX IF NOT EXISTS idx_doctors_specialty ON doctors(specialty);
CREATE INDEX IF NOT EXISTS idx_doctors_license_number ON doctors(license_number);
CREATE INDEX IF NOT EXISTS idx_doctors_is_active ON doctors(is_active);

-- Patients indexes
CREATE INDEX IF NOT EXISTS idx_patients_profile_id ON patients(profile_id);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);

-- Appointments indexes
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Medical records indexes
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_id ON medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_appointment_id ON medical_records(appointment_id);

-- Doctor reviews indexes
CREATE INDEX IF NOT EXISTS idx_doctor_reviews_doctor_id ON doctor_reviews(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_reviews_patient_id ON doctor_reviews(patient_id);

-- Rooms indexes
CREATE INDEX IF NOT EXISTS idx_rooms_department_id ON rooms(department_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);

-- =============================================
-- 3. FOREIGN KEY CONSTRAINTS
-- =============================================

-- Doctors foreign keys
ALTER TABLE doctors ADD CONSTRAINT IF NOT EXISTS fk_doctors_profile
FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE doctors ADD CONSTRAINT IF NOT EXISTS fk_doctors_department
FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE RESTRICT;

-- Patients foreign keys
ALTER TABLE patients ADD CONSTRAINT IF NOT EXISTS fk_patients_profile
FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Appointments foreign keys
ALTER TABLE appointments ADD CONSTRAINT IF NOT EXISTS fk_appointments_patient
FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE;

ALTER TABLE appointments ADD CONSTRAINT IF NOT EXISTS fk_appointments_doctor
FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE RESTRICT;

-- Medical records foreign keys
ALTER TABLE medical_records ADD CONSTRAINT IF NOT EXISTS fk_medical_records_patient
FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE;

ALTER TABLE medical_records ADD CONSTRAINT IF NOT EXISTS fk_medical_records_doctor
FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE RESTRICT;

-- Doctor reviews foreign keys
ALTER TABLE doctor_reviews ADD CONSTRAINT IF NOT EXISTS fk_doctor_reviews_doctor
FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE;

ALTER TABLE doctor_reviews ADD CONSTRAINT IF NOT EXISTS fk_doctor_reviews_patient
FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE;

-- Rooms foreign keys
ALTER TABLE rooms ADD CONSTRAINT IF NOT EXISTS fk_rooms_department
FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE RESTRICT;

-- =============================================
-- 4. ID GENERATION FUNCTIONS
-- =============================================

-- Patient ID Generation Function
CREATE OR REPLACE FUNCTION generate_patient_id()
RETURNS TEXT AS $$
BEGIN
    RETURN 'PAT-' || TO_CHAR(NOW(), 'YYYYMM') || '-' ||
           LPAD((EXTRACT(EPOCH FROM NOW())::BIGINT % 1000)::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Doctor ID Generation Function
CREATE OR REPLACE FUNCTION generate_doctor_id(dept_code TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN dept_code || '-DOC-' || TO_CHAR(NOW(), 'YYYYMM') || '-' ||
           LPAD((EXTRACT(EPOCH FROM NOW())::BIGINT % 1000)::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Appointment ID Generation Function
CREATE OR REPLACE FUNCTION generate_appointment_id()
RETURNS TEXT AS $$
BEGIN
    RETURN 'APT-' || TO_CHAR(NOW(), 'YYYYMM') || '-' ||
           LPAD((EXTRACT(EPOCH FROM NOW())::BIGINT % 100000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Medical Record ID Generation Function
CREATE OR REPLACE FUNCTION generate_medical_record_id()
RETURNS TEXT AS $$
BEGIN
    RETURN 'MED-' || TO_CHAR(NOW(), 'YYYYMM') || '-' ||
           LPAD((EXTRACT(EPOCH FROM NOW())::BIGINT % 1000)::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Review ID Generation Function
CREATE OR REPLACE FUNCTION generate_review_id()
RETURNS TEXT AS $$
BEGIN
    RETURN 'REV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' ||
           LPAD((EXTRACT(EPOCH FROM NOW())::BIGINT % 1000)::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 5. SAMPLE DATA INSERTION
-- =============================================

-- Insert sample departments
INSERT INTO departments (department_id, department_name, department_code, description, is_active) VALUES
('CARD', 'Cardiology', 'CARD', 'Heart and cardiovascular system', true),
('NEUR', 'Neurology', 'NEUR', 'Brain and nervous system', true),
('ORTH', 'Orthopedics', 'ORTH', 'Bones and joints', true),
('PEDI', 'Pediatrics', 'PEDI', 'Children healthcare', true),
('GYNE', 'Gynecology', 'GYNE', 'Women healthcare', true)
ON CONFLICT (department_id) DO NOTHING;

-- Insert sample specialties
INSERT INTO specialties (specialty_id, specialty_name, specialty_code, department_id, description, is_active) VALUES
('CARD-001', 'Interventional Cardiology', 'INTCARD', 'CARD', 'Heart procedures and interventions', true),
('NEUR-001', 'Neurosurgery', 'NEUSURG', 'NEUR', 'Brain and spine surgery', true),
('ORTH-001', 'Joint Replacement', 'JOINTREP', 'ORTH', 'Hip and knee replacements', true),
('PEDI-001', 'Pediatric Emergency', 'PEDEMERG', 'PEDI', 'Emergency care for children', true),
('GYNE-001', 'Obstetrics', 'OBSTET', 'GYNE', 'Pregnancy and childbirth', true)
ON CONFLICT (specialty_id) DO NOTHING;

-- Insert sample rooms
INSERT INTO rooms (room_id, room_number, room_type, department_id, floor_number, capacity, status) VALUES
('ROOM-001', '101', 'Consultation', 'CARD', 1, 1, 'available'),
('ROOM-002', '102', 'Consultation', 'NEUR', 1, 1, 'available'),
('ROOM-003', '201', 'Surgery', 'ORTH', 2, 1, 'available'),
('ROOM-004', '301', 'Emergency', 'PEDI', 3, 2, 'available'),
('ROOM-005', '401', 'Delivery', 'GYNE', 4, 1, 'available')
ON CONFLICT (room_id) DO NOTHING;

-- =============================================
-- SCRIPT COMPLETED SUCCESSFULLY
-- =============================================
