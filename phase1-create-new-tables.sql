-- ============================================================================
-- PHASE 1: CREATE NEW FHIR-COMPLIANT TABLES
-- Hospital Management System - Database Redesign
-- ============================================================================
-- This script creates the new FHIR-compliant database structure
-- Execute ONLY after successful backup and old table cleanup

-- ============================================================================
-- 1. ENABLE REQUIRED EXTENSIONS
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable JSONB operations
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Enable full-text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- 2. CREATE ENHANCED PROFILES TABLE (Supabase Auth Integration)
-- ============================================================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    full_name TEXT NOT NULL CHECK (length(full_name) >= 2 AND length(full_name) <= 100),
    role TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'admin', 'receptionist')) DEFAULT 'patient',
    
    -- Personal Information
    date_of_birth DATE CHECK (date_of_birth <= CURRENT_DATE),
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'unknown')),
    phone TEXT CHECK (phone ~ '^0\d{9}$'),
    
    -- Preferences & Localization
    preferred_language TEXT DEFAULT 'vi' CHECK (preferred_language IN ('vi', 'en')),
    contact_channel TEXT DEFAULT 'email' CHECK (contact_channel IN ('sms', 'email', 'both')),
    timezone VARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh',
    
    -- Status & Verification
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    onboarding_completed BOOLEAN DEFAULT false,
    
    -- Legal Compliance (HIPAA/GDPR)
    terms_accepted_at TIMESTAMPTZ,
    privacy_accepted_at TIMESTAMPTZ,
    hipaa_consent_at TIMESTAMPTZ,
    gdpr_consent_at TIMESTAMPTZ,
    
    -- Security & Audit
    last_login_at TIMESTAMPTZ,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. CREATE ENHANCED DEPARTMENTS TABLE WITH HIERARCHY
-- ============================================================================

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id TEXT UNIQUE NOT NULL CHECK (department_id ~ '^DEPT\d{3}$'),
    name TEXT NOT NULL UNIQUE,
    name_vi TEXT NOT NULL,
    description TEXT,
    description_vi TEXT,
    
    -- Hierarchy Support
    parent_department_id UUID REFERENCES departments(id),
    department_level INTEGER DEFAULT 1 CHECK (department_level BETWEEN 1 AND 5),
    department_path TEXT, -- Materialized path for hierarchy queries
    
    -- Management
    head_doctor_id UUID REFERENCES profiles(id),
    deputy_head_id UUID REFERENCES profiles(id),
    
    -- Contact Information
    phone TEXT CHECK (phone ~ '^0\d{9}$'),
    email TEXT CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    location JSONB,
    
    -- Operational Configuration
    working_hours JSONB DEFAULT '{
        "monday": {"start": "08:00", "end": "17:00"},
        "tuesday": {"start": "08:00", "end": "17:00"},
        "wednesday": {"start": "08:00", "end": "17:00"},
        "thursday": {"start": "08:00", "end": "17:00"},
        "friday": {"start": "08:00", "end": "17:00"},
        "saturday": {"start": "08:00", "end": "12:00"},
        "sunday": {"closed": true}
    }'::JSONB,
    
    -- Capacity & Resources
    bed_capacity INTEGER DEFAULT 0,
    staff_capacity INTEGER DEFAULT 0,
    equipment_list JSONB DEFAULT '[]'::JSONB,
    
    -- Financial
    budget_allocated DECIMAL(15,2),
    cost_center_code VARCHAR(20),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    accreditation_status VARCHAR(20) DEFAULT 'pending',
    accreditation_expiry DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. CREATE FHIR PATIENT PROFILES TABLE
-- ============================================================================

CREATE TABLE patient_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    patient_id TEXT UNIQUE NOT NULL CHECK (patient_id ~ '^PAT-\d{6}-\d{3}$'),
    
    -- FHIR Patient Demographics
    active BOOLEAN DEFAULT true,
    deceased_boolean BOOLEAN DEFAULT false,
    deceased_datetime TIMESTAMPTZ,
    
    -- Medical Information (FHIR Structured)
    blood_type TEXT CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    allergies JSONB DEFAULT '[]'::JSONB CHECK (jsonb_typeof(allergies) = 'array'),
    chronic_conditions JSONB DEFAULT '[]'::JSONB CHECK (jsonb_typeof(chronic_conditions) = 'array'),
    current_medications JSONB DEFAULT '[]'::JSONB CHECK (jsonb_typeof(current_medications) = 'array'),
    
    -- Physical Measurements
    height DECIMAL(5,2) CHECK (height BETWEEN 30.00 AND 300.00),
    weight DECIMAL(5,2) CHECK (weight BETWEEN 0.50 AND 500.00),
    bmi DECIMAL(4,1) GENERATED ALWAYS AS (
        CASE WHEN height > 0 THEN ROUND((weight / POWER(height/100, 2))::NUMERIC, 1)
        ELSE NULL END
    ) STORED,
    
    -- Emergency Contact (FHIR Contact Structure)
    emergency_contact JSONB CHECK (
        emergency_contact IS NULL OR (
            emergency_contact ? 'name' AND 
            emergency_contact ? 'phone' AND
            emergency_contact ? 'relationship' AND
            (emergency_contact->>'phone') ~ '^0\d{9}$'
        )
    ),
    
    -- Address (Vietnam Structure)
    address JSONB CHECK (
        address IS NULL OR (
            address ? 'street' AND 
            address ? 'ward' AND 
            address ? 'district' AND 
            address ? 'city'
        )
    ),
    
    -- Insurance Information
    insurance_type TEXT CHECK (insurance_type IN ('BHYT', 'BHTN', 'private', 'self_pay')),
    insurance_number TEXT CHECK (length(insurance_number) BETWEEN 5 AND 50),
    insurance_provider TEXT,
    insurance_valid_from DATE,
    insurance_valid_to DATE,
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deceased')),
    onboarding_completed BOOLEAN DEFAULT false,
    
    -- Audit Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Business Logic Constraints
    CONSTRAINT chk_deceased_logic CHECK (
        (deceased_boolean = false AND deceased_datetime IS NULL AND status != 'deceased') OR
        (deceased_boolean = true AND deceased_datetime IS NOT NULL AND status = 'deceased')
    ),
    CONSTRAINT chk_insurance_dates CHECK (
        (insurance_valid_from IS NULL AND insurance_valid_to IS NULL) OR
        (insurance_valid_from IS NOT NULL AND insurance_valid_to IS NOT NULL AND insurance_valid_to > insurance_valid_from)
    )
);

-- ============================================================================
-- 5. CREATE FHIR DOCTOR PROFILES TABLE (Practitioner Resource)
-- ============================================================================

CREATE TABLE doctor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    doctor_id TEXT UNIQUE NOT NULL CHECK (doctor_id ~ '^[A-Z]{4}-DOC-\d{6}-\d{3}$'),
    
    -- Professional Information
    department_id UUID NOT NULL REFERENCES departments(id),
    primary_specialization TEXT NOT NULL,
    sub_specializations TEXT[] DEFAULT '{}',
    license_number TEXT UNIQUE NOT NULL CHECK (license_number ~ '^[A-Z]{2,4}\d{6,10}$'),
    
    -- Qualifications & Experience
    years_of_experience INTEGER DEFAULT 0 CHECK (years_of_experience >= 0 AND years_of_experience <= 60),
    medical_degree TEXT NOT NULL,
    board_certifications JSONB DEFAULT '[]'::JSONB,
    languages_spoken JSONB DEFAULT '["vi"]'::JSONB,
    
    -- Practice Information
    consultation_fee DECIMAL(10,2) CHECK (consultation_fee >= 0),
    bio TEXT,
    bio_vi TEXT,
    photo_url TEXT,
    
    -- Availability & Schedule
    is_available BOOLEAN DEFAULT true,
    working_hours JSONB DEFAULT '{
        "monday": {"start": "08:00", "end": "17:00", "break": {"start": "12:00", "end": "13:00"}},
        "tuesday": {"start": "08:00", "end": "17:00", "break": {"start": "12:00", "end": "13:00"}},
        "wednesday": {"start": "08:00", "end": "17:00", "break": {"start": "12:00", "end": "13:00"}},
        "thursday": {"start": "08:00", "end": "17:00", "break": {"start": "12:00", "end": "13:00"}},
        "friday": {"start": "08:00", "end": "17:00", "break": {"start": "12:00", "end": "13:00"}},
        "saturday": {"start": "08:00", "end": "12:00"},
        "sunday": {"off": true}
    }'::JSONB,
    
    -- Performance Metrics
    average_rating DECIMAL(3,2) DEFAULT 0.00 CHECK (average_rating >= 0 AND average_rating <= 5),
    total_reviews INTEGER DEFAULT 0,
    total_patients INTEGER DEFAULT 0,
    total_appointments INTEGER DEFAULT 0,
    
    -- Professional Development
    continuing_education_hours INTEGER DEFAULT 0,
    last_training_date DATE,
    research_interests TEXT[],
    publications_count INTEGER DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'suspended', 'retired')),
    employment_type VARCHAR(20) DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'locum')),
    
    -- Contract Information
    contract_start_date DATE,
    contract_end_date DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. VERIFICATION OF TABLE CREATION
-- ============================================================================

-- Verify all tables are created successfully
DO $$
DECLARE
    expected_tables TEXT[] := ARRAY['profiles', 'departments', 'patient_profiles', 'doctor_profiles'];
    created_tables INTEGER;
    missing_tables TEXT;
BEGIN
    SELECT COUNT(*) INTO created_tables
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
        AND table_name = ANY(expected_tables);
    
    IF created_tables != array_length(expected_tables, 1) THEN
        SELECT STRING_AGG(t, ', ') INTO missing_tables
        FROM unnest(expected_tables) AS t
        WHERE t NOT IN (
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        );
        
        RAISE EXCEPTION 'TABLE CREATION FAILED! Missing tables: %', missing_tables;
    ELSE
        RAISE NOTICE 'SUCCESS: All % core tables created successfully.', created_tables;
    END IF;
END $$;

-- ============================================================================
-- 7. CREATE FHIR APPOINTMENTS TABLE (Appointment Resource)
-- ============================================================================

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id TEXT UNIQUE NOT NULL CHECK (appointment_id ~ '^[A-Z]{4}-APT-\d{6}-\d{3}$'),

    -- FHIR References
    patient_id UUID NOT NULL REFERENCES patient_profiles(user_id) ON DELETE RESTRICT,
    doctor_id UUID NOT NULL REFERENCES doctor_profiles(user_id) ON DELETE RESTRICT,

    -- Scheduling Information
    appointment_date DATE NOT NULL CHECK (appointment_date >= CURRENT_DATE - INTERVAL '1 day'),
    appointment_time TIME NOT NULL,
    appointment_datetime TIMESTAMPTZ GENERATED ALWAYS AS (
        (appointment_date + appointment_time)::TIMESTAMPTZ
    ) STORED,
    duration_minutes INTEGER DEFAULT 30 CHECK (duration_minutes BETWEEN 15 AND 240),
    end_datetime TIMESTAMPTZ GENERATED ALWAYS AS (
        (appointment_date + appointment_time + (duration_minutes || ' minutes')::INTERVAL)::TIMESTAMPTZ
    ) STORED,

    -- Appointment Classification
    type TEXT DEFAULT 'consultation' CHECK (type IN ('consultation', 'follow_up', 'emergency', 'telemedicine', 'surgery', 'procedure')),
    priority TEXT DEFAULT 'routine' CHECK (priority IN ('routine', 'urgent', 'emergency', 'stat')),
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'arrived', 'in_progress', 'completed', 'cancelled', 'no_show')),

    -- Clinical Information
    reason TEXT,
    chief_complaint TEXT,
    symptoms JSONB DEFAULT '[]'::JSONB,
    notes TEXT,
    special_instructions TEXT,

    -- Location & Resources
    room_id UUID,
    department_id UUID REFERENCES departments(id),
    required_equipment JSONB DEFAULT '[]'::JSONB,

    -- Payment Information
    consultation_fee DECIMAL(10,2) NOT NULL CHECK (consultation_fee >= 0),
    additional_fees DECIMAL(10,2) DEFAULT 0 CHECK (additional_fees >= 0),
    total_amount DECIMAL(10,2) GENERATED ALWAYS AS (consultation_fee + additional_fees) STORED,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partially_paid', 'refunded', 'waived')),
    payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'insurance', 'payos', 'bank_transfer')),

    -- Status Tracking
    checked_in_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    cancelled_by UUID REFERENCES profiles(id),

    -- Follow-up & Relationships
    follow_up_appointment_id UUID REFERENCES appointments(id),
    parent_appointment_id UUID REFERENCES appointments(id),
    series_id UUID, -- For recurring appointments

    -- Reminders & Notifications
    reminder_sent BOOLEAN DEFAULT false,
    reminder_sent_at TIMESTAMPTZ,
    confirmation_required BOOLEAN DEFAULT true,
    confirmed_at TIMESTAMPTZ,
    confirmed_by UUID REFERENCES profiles(id),

    -- Audit Fields
    created_by UUID REFERENCES profiles(id),
    last_modified_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Business Logic Constraints
    UNIQUE(doctor_id, appointment_date, appointment_time), -- Prevent double booking
    CONSTRAINT chk_status_timestamps CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR
        (status = 'cancelled' AND cancelled_at IS NOT NULL) OR
        (status NOT IN ('completed', 'cancelled'))
    ),
    CONSTRAINT chk_confirmation_logic CHECK (
        (confirmation_required = false) OR
        (confirmation_required = true AND confirmed_at IS NOT NULL) OR
        (status IN ('scheduled', 'confirmed'))
    )
);

-- ============================================================================
-- 8. NEXT STEPS REMINDER
-- ============================================================================

/*
CORE TABLES CREATED SUCCESSFULLY!

NEXT STEPS:
1. Execute: phase1-create-medical-records.sql (for medical records table)
2. Execute: phase1-create-id-functions.sql (for ID generation system)
3. Execute: phase1-create-basic-indexes.sql (for performance)
4. Execute: phase1-data-migration.sql (to migrate existing data)

TABLES CREATED IN THIS SCRIPT:
- profiles (Enhanced with FHIR compliance)
- departments (With hierarchy support)
- patient_profiles (FHIR Patient resource)
- doctor_profiles (FHIR Practitioner resource)
- appointments (FHIR Appointment resource)

REMAINING TABLES TO CREATE:
- medical_records (FHIR Encounter/Condition/Observation)
- Medical terminology tables
- FHIR resources storage
*/

RAISE NOTICE 'Phase 1 core table creation completed successfully!';
