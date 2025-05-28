-- Hospital Management System - Optimized Database Schema
-- This script creates the complete database structure for 3 roles: admin, doctor, patient
-- Using Supabase Auth + Custom Tables

-- =====================================================
-- CLEANUP EXISTING TABLES (OPTIONAL - UNCOMMENT IF NEEDED)
-- =====================================================
-- DROP TABLE IF EXISTS user_details CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;

-- =====================================================
-- CORE USER MANAGEMENT TABLES
-- =====================================================

-- Profiles table - Central user information linked to Supabase Auth
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'patient')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- ROLE-SPECIFIC TABLES
-- =====================================================

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  admin_id TEXT PRIMARY KEY DEFAULT ('ADM' || EXTRACT(EPOCH FROM NOW())::BIGINT),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE,
  department TEXT,
  position TEXT NOT NULL DEFAULT 'Administrator',
  permissions JSONB DEFAULT '{}',
  hire_date DATE,
  salary DECIMAL(10,2),
  is_super_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for admins
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Allow admins to view their own data
CREATE POLICY "Admins can view own data" ON admins
  FOR SELECT USING (profile_id = auth.uid());

-- Allow admins to update their own data
CREATE POLICY "Admins can update own data" ON admins
  FOR UPDATE USING (profile_id = auth.uid());

-- Allow INSERT for admin creation (no recursion)
CREATE POLICY "Allow admin creation" ON admins
  FOR INSERT WITH CHECK (true);

-- Allow super admins to view all admins (avoid recursion by checking profiles table directly)
CREATE POLICY "Super admins can view all admins" ON admins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Allow super admins to manage all admins
CREATE POLICY "Super admins can manage all admins" ON admins
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Doctors table (Enhanced)
DROP TABLE IF EXISTS doctors CASCADE;
CREATE TABLE doctors (
  doctor_id TEXT PRIMARY KEY DEFAULT ('DOC' || EXTRACT(EPOCH FROM NOW())::BIGINT),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  license_number TEXT UNIQUE NOT NULL,
  specialization TEXT NOT NULL,
  qualification TEXT NOT NULL,
  experience_years INTEGER DEFAULT 0,
  consultation_fee DECIMAL(8,2),
  department_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
  bio TEXT,
  languages_spoken TEXT[],
  working_hours JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for doctors
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can view own data" ON doctors
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Doctors can update own data" ON doctors
  FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Patients can view doctors" ON doctors
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'patient'
    )
  );

CREATE POLICY "Admins can manage doctors" ON doctors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Patients table (Enhanced)
DROP TABLE IF EXISTS patients CASCADE;
CREATE TABLE patients (
  patient_id TEXT PRIMARY KEY DEFAULT ('PAT' || EXTRACT(EPOCH FROM NOW())::BIGINT),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date_of_birth DATE NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  blood_type TEXT CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  address JSONB DEFAULT '{}',
  emergency_contact JSONB DEFAULT '{}',
  insurance_info JSONB DEFAULT '{}',
  allergies TEXT[],
  chronic_conditions TEXT[],
  medical_notes TEXT,
  registration_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deceased')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for patients
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own data" ON patients
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Patients can update own data" ON patients
  FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Doctors can view their patients" ON patients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'doctor'
    )
  );

CREATE POLICY "Admins can manage patients" ON patients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- SUPPORTING TABLES
-- =====================================================

-- Departments table (Enhanced)
DROP TABLE IF EXISTS departments CASCADE;
CREATE TABLE departments (
  department_id TEXT PRIMARY KEY DEFAULT ('DEPT' || EXTRACT(EPOCH FROM NOW())::BIGINT),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  head_doctor_id TEXT,
  location TEXT,
  phone_number TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for departments
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active departments" ON departments
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage departments" ON departments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
-- Appointments table (Enhanced)
DROP TABLE IF EXISTS appointments CASCADE;
CREATE TABLE appointments (
  appointment_id TEXT PRIMARY KEY DEFAULT ('APT' || EXTRACT(EPOCH FROM NOW())::BIGINT),
  patient_id TEXT NOT NULL REFERENCES patients(patient_id),
  doctor_id TEXT NOT NULL REFERENCES doctors(doctor_id),
  appointment_datetime TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  type TEXT DEFAULT 'consultation' CHECK (type IN ('consultation', 'follow_up', 'emergency', 'surgery')),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  reason TEXT,
  notes TEXT,
  room_id TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own appointments" ON appointments
  FOR SELECT USING (
    patient_id IN (
      SELECT patient_id FROM patients WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can view their appointments" ON appointments
  FOR SELECT USING (
    doctor_id IN (
      SELECT doctor_id FROM doctors WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all appointments" ON appointments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Rooms table (Enhanced)
DROP TABLE IF EXISTS rooms CASCADE;
CREATE TABLE rooms (
  room_id TEXT PRIMARY KEY DEFAULT ('ROOM' || EXTRACT(EPOCH FROM NOW())::BIGINT),
  room_number TEXT NOT NULL,
  room_type TEXT NOT NULL CHECK (room_type IN ('consultation', 'surgery', 'emergency', 'ward', 'icu', 'laboratory', 'Phòng khám', 'Phòng mổ', 'Phòng bệnh', 'Phòng hồi sức')),
  department_id TEXT NOT NULL REFERENCES departments(department_id),
  capacity INTEGER DEFAULT 1 CHECK (capacity > 0),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'out_of_service')),
  equipment JSONB DEFAULT '[]',
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for rooms
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view available rooms" ON rooms
  FOR SELECT USING (status = 'available');

CREATE POLICY "Admins can manage all rooms" ON rooms
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Doctors can view rooms in their department" ON rooms
  FOR SELECT USING (
    department_id IN (
      SELECT department_id FROM doctors WHERE profile_id = auth.uid()
    )
  );

-- Medical Records table (Enhanced)
DROP TABLE IF EXISTS medical_records CASCADE;
CREATE TABLE medical_records (
  record_id TEXT PRIMARY KEY DEFAULT ('MR' || EXTRACT(EPOCH FROM NOW())::BIGINT),
  patient_id TEXT NOT NULL REFERENCES patients(patient_id),
  doctor_id TEXT NOT NULL REFERENCES doctors(doctor_id),
  appointment_id TEXT REFERENCES appointments(appointment_id),
  visit_date TIMESTAMPTZ NOT NULL,
  chief_complaint TEXT,
  present_illness TEXT,
  past_medical_history TEXT,
  physical_examination JSONB DEFAULT '{}',
  vital_signs JSONB DEFAULT '{}',
  diagnosis TEXT,
  treatment_plan TEXT,
  medications JSONB DEFAULT '[]',
  follow_up_instructions TEXT,
  attachments TEXT[],
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for medical_records
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own medical records" ON medical_records
  FOR SELECT USING (
    patient_id IN (
      SELECT patient_id FROM patients WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can view their patients' records" ON medical_records
  FOR SELECT USING (
    doctor_id IN (
      SELECT doctor_id FROM doctors WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can manage their patients' records" ON medical_records
  FOR ALL USING (
    doctor_id IN (
      SELECT doctor_id FROM doctors WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all medical records" ON medical_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Prescriptions table (Enhanced)
DROP TABLE IF EXISTS prescriptions CASCADE;
CREATE TABLE prescriptions (
  prescription_id TEXT PRIMARY KEY DEFAULT ('PRE' || EXTRACT(EPOCH FROM NOW())::BIGINT),
  patient_id TEXT NOT NULL REFERENCES patients(patient_id),
  doctor_id TEXT NOT NULL REFERENCES doctors(doctor_id),
  medical_record_id TEXT REFERENCES medical_records(record_id),
  medications JSONB NOT NULL DEFAULT '[]',
  instructions TEXT,
  issued_date DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dispensed', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for prescriptions
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own prescriptions" ON prescriptions
  FOR SELECT USING (
    patient_id IN (
      SELECT patient_id FROM patients WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can manage their prescriptions" ON prescriptions
  FOR ALL USING (
    doctor_id IN (
      SELECT doctor_id FROM doctors WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all prescriptions" ON prescriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- AUDIT AND TRIGGERS
-- =====================================================

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  log_id TEXT PRIMARY KEY DEFAULT ('LOG' || EXTRACT(EPOCH FROM NOW())::BIGINT),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON medical_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Core table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

-- Role-specific table indexes
CREATE INDEX IF NOT EXISTS idx_admins_profile_id ON admins(profile_id);
CREATE INDEX IF NOT EXISTS idx_doctors_profile_id ON doctors(profile_id);
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization);
CREATE INDEX IF NOT EXISTS idx_doctors_department_id ON doctors(department_id);
CREATE INDEX IF NOT EXISTS idx_doctors_status ON doctors(status);

CREATE INDEX IF NOT EXISTS idx_patients_profile_id ON patients(profile_id);
CREATE INDEX IF NOT EXISTS idx_patients_date_of_birth ON patients(date_of_birth);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);

-- Appointment indexes
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON appointments(appointment_datetime);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Medical record indexes
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_id ON medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_visit_date ON medical_records(visit_date);
CREATE INDEX IF NOT EXISTS idx_medical_records_status ON medical_records(status);

-- Prescription indexes
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_issued_date ON prescriptions(issued_date);

-- Department indexes
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);
CREATE INDEX IF NOT EXISTS idx_departments_is_active ON departments(is_active);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- INITIAL DATA SETUP
-- =====================================================

-- Insert default departments
INSERT INTO departments (department_id, name, description) VALUES
('DEPT001', 'General Medicine', 'General medical consultations and primary care'),
('DEPT002', 'Cardiology', 'Heart and cardiovascular system care'),
('DEPT003', 'Pediatrics', 'Medical care for infants, children, and adolescents'),
('DEPT004', 'Orthopedics', 'Musculoskeletal system care'),
('DEPT005', 'Emergency', 'Emergency medical services')
ON CONFLICT (department_id) DO NOTHING;

-- =====================================================
-- FUNCTIONS FOR PROFILE CREATION
-- =====================================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'patient');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- Script completed successfully
SELECT 'Hospital Management Database Schema Setup Completed Successfully!' as status;
