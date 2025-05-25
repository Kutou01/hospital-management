-- Hospital Management System - Database Cleanup and Setup
-- This script cleans up existing tables and creates optimized structure

-- =====================================================
-- CLEANUP EXISTING TABLES AND POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Patients can view doctors" ON doctors;
DROP POLICY IF EXISTS "Doctors can view own data" ON doctors;
DROP POLICY IF EXISTS "Doctors can update own data" ON doctors;
DROP POLICY IF EXISTS "Admins can manage doctors" ON doctors;
DROP POLICY IF EXISTS "Patients can view own data" ON patients;
DROP POLICY IF EXISTS "Patients can update own data" ON patients;
DROP POLICY IF EXISTS "Doctors can view their patients" ON patients;
DROP POLICY IF EXISTS "Admins can manage patients" ON patients;

-- Drop existing tables
DROP TABLE IF EXISTS user_details CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS medical_records CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- =====================================================
-- RECREATE CORE TABLES
-- =====================================================

-- Profiles table - Central user information linked to Supabase Auth
DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE profiles (
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

-- Departments table
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

-- Admins table
CREATE TABLE admins (
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

CREATE POLICY "Admins can view own data" ON admins
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Super admins can view all admins" ON admins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins a
      JOIN profiles p ON a.profile_id = p.id
      WHERE p.id = auth.uid() AND a.is_super_admin = true
    )
  );

-- Doctors table
CREATE TABLE doctors (
  doctor_id TEXT PRIMARY KEY DEFAULT ('DOC' || EXTRACT(EPOCH FROM NOW())::BIGINT),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  license_number TEXT UNIQUE NOT NULL,
  specialization TEXT NOT NULL,
  qualification TEXT NOT NULL,
  experience_years INTEGER DEFAULT 0,
  consultation_fee DECIMAL(8,2),
  department_id TEXT REFERENCES departments(department_id),
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

-- Patients table
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

SELECT 'Database cleanup and core tables setup completed!' as status;
