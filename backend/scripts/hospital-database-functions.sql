-- ============================================================================
-- HOSPITAL MANAGEMENT SYSTEM - COMPLETE DATABASE FUNCTIONS
-- ============================================================================
-- This file contains all necessary database functions for the hospital management system
-- Including Patient, Doctor, Appointment, and other service functions

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to get department code from department ID
CREATE OR REPLACE FUNCTION get_department_code(dept_id TEXT)
RETURNS TEXT AS $$
DECLARE
    dept_code TEXT;
BEGIN
    SELECT code INTO dept_code 
    FROM departments 
    WHERE department_id = dept_id;
    
    RETURN COALESCE(dept_code, 'GEN');
END;
$$ LANGUAGE plpgsql;

-- Core ID generation function
CREATE OR REPLACE FUNCTION generate_hospital_id(entity_type TEXT, dept_id TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    dept_code TEXT;
    year_month TEXT;
    sequence_num INT;
    formatted_sequence TEXT;
    new_id TEXT;
BEGIN
    -- Get department code if provided
    IF dept_id IS NOT NULL THEN
        dept_code := get_department_code(dept_id);
    ELSE
        dept_code := '';
    END IF;
    
    -- Get current year-month
    year_month := TO_CHAR(NOW(), 'YYYYMM');
    
    -- Generate sequence number (simple counter for demo)
    sequence_num := FLOOR(RANDOM() * 999) + 1;
    formatted_sequence := LPAD(sequence_num::TEXT, 3, '0');
    
    -- Build ID based on whether department is provided
    IF dept_code != '' THEN
        new_id := dept_code || '-' || entity_type || '-' || year_month || '-' || formatted_sequence;
    ELSE
        new_id := entity_type || '-' || year_month || '-' || formatted_sequence;
    END IF;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ID GENERATION FUNCTIONS
-- ============================================================================

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

-- Medical Record ID Generation (Department-based)
CREATE OR REPLACE FUNCTION generate_medical_record_id(dept_id TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN generate_hospital_id('MR', dept_id);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PATIENT SERVICE FUNCTIONS
-- ============================================================================

-- Get all patients with filters and pagination
CREATE OR REPLACE FUNCTION get_all_patients(
    search_filters JSONB DEFAULT '{}',
    limit_count INT DEFAULT 20,
    offset_count INT DEFAULT 0
)
RETURNS TABLE(
    patients JSONB,
    total INT
) AS $$
DECLARE
    total_count INT;
BEGIN
    -- Get total count first
    SELECT COUNT(*) INTO total_count
    FROM patients p
    LEFT JOIN profiles pr ON p.profile_id = pr.id
    WHERE CASE 
        WHEN search_filters ? 'search' AND search_filters->>'search' IS NOT NULL 
        THEN (pr.full_name ILIKE '%' || (search_filters->>'search') || '%' OR pr.email ILIKE '%' || (search_filters->>'search') || '%')
        ELSE TRUE
    END
    AND CASE 
        WHEN search_filters ? 'gender' AND search_filters->>'gender' IS NOT NULL 
        THEN p.gender = (search_filters->>'gender')
        ELSE TRUE
    END
    AND CASE 
        WHEN search_filters ? 'status' AND search_filters->>'status' IS NOT NULL 
        THEN p.status = (search_filters->>'status')
        ELSE TRUE
    END
    AND CASE 
        WHEN search_filters ? 'blood_type' AND search_filters->>'blood_type' IS NOT NULL 
        THEN p.blood_type = (search_filters->>'blood_type')
        ELSE TRUE
    END;
    
    -- Return patients data with total count
    RETURN QUERY
    SELECT 
        jsonb_agg(
            jsonb_build_object(
                'patient_id', p.patient_id,
                'profile_id', p.profile_id,
                'full_name', pr.full_name,
                'date_of_birth', pr.date_of_birth,
                'gender', p.gender,
                'blood_type', p.blood_type,
                'status', p.status,
                'created_at', p.created_at,
                'updated_at', p.updated_at,
                'profile', jsonb_build_object(
                    'id', pr.id,
                    'email', pr.email,
                    'phone_number', pr.phone_number,
                    'role', pr.role,
                    'is_active', pr.is_active
                )
            )
        ) as patients,
        total_count as total
    FROM patients p
    LEFT JOIN profiles pr ON p.profile_id = pr.id
    WHERE CASE 
        WHEN search_filters ? 'search' AND search_filters->>'search' IS NOT NULL 
        THEN (pr.full_name ILIKE '%' || (search_filters->>'search') || '%' OR pr.email ILIKE '%' || (search_filters->>'search') || '%')
        ELSE TRUE
    END
    AND CASE 
        WHEN search_filters ? 'gender' AND search_filters->>'gender' IS NOT NULL 
        THEN p.gender = (search_filters->>'gender')
        ELSE TRUE
    END
    AND CASE 
        WHEN search_filters ? 'status' AND search_filters->>'status' IS NOT NULL 
        THEN p.status = (search_filters->>'status')
        ELSE TRUE
    END
    AND CASE 
        WHEN search_filters ? 'blood_type' AND search_filters->>'blood_type' IS NOT NULL 
        THEN p.blood_type = (search_filters->>'blood_type')
        ELSE TRUE
    END
    ORDER BY p.created_at DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Get patient by ID
CREATE OR REPLACE FUNCTION get_patient_by_id(input_patient_id TEXT)
RETURNS TABLE(
    patient_id TEXT,
    profile_id TEXT,
    full_name TEXT,
    date_of_birth DATE,
    gender TEXT,
    blood_type TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    profile JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.patient_id,
        p.profile_id,
        pr.full_name,
        pr.date_of_birth,
        p.gender,
        p.blood_type,
        p.status,
        p.created_at,
        p.updated_at,
        jsonb_build_object(
            'id', pr.id,
            'email', pr.email,
            'phone_number', pr.phone_number,
            'role', pr.role,
            'is_active', pr.is_active,
            'email_verified', pr.email_verified,
            'phone_verified', pr.phone_verified
        ) as profile
    FROM patients p
    LEFT JOIN profiles pr ON p.profile_id = pr.id
    WHERE p.patient_id = input_patient_id;
END;
$$ LANGUAGE plpgsql;

-- Get patient by profile ID
CREATE OR REPLACE FUNCTION get_patient_by_profile_id(input_profile_id TEXT)
RETURNS TABLE(
    patient_id TEXT,
    profile_id TEXT,
    full_name TEXT,
    date_of_birth DATE,
    gender TEXT,
    blood_type TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    profile JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.patient_id,
        p.profile_id,
        pr.full_name,
        pr.date_of_birth,
        p.gender,
        p.blood_type,
        p.status,
        p.created_at,
        p.updated_at,
        jsonb_build_object(
            'id', pr.id,
            'email', pr.email,
            'phone_number', pr.phone_number,
            'role', pr.role,
            'is_active', pr.is_active,
            'email_verified', pr.email_verified,
            'phone_verified', pr.phone_verified
        ) as profile
    FROM patients p
    LEFT JOIN profiles pr ON p.profile_id = pr.id
    WHERE p.profile_id = input_profile_id;
END;
$$ LANGUAGE plpgsql;

-- Create patient
CREATE OR REPLACE FUNCTION create_patient(patient_data JSONB)
RETURNS TABLE(
    patient_id TEXT,
    profile_id TEXT,
    full_name TEXT,
    date_of_birth DATE,
    gender TEXT,
    blood_type TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
DECLARE
    new_patient_id TEXT;
    new_profile_id TEXT;
BEGIN
    -- Generate new patient ID
    new_patient_id := generate_patient_id();

    -- Create profile first if email is provided
    IF patient_data ? 'email' THEN
        INSERT INTO profiles (email, full_name, date_of_birth, phone_number, role, is_active, email_verified, phone_verified)
        VALUES (
            patient_data->>'email',
            patient_data->>'full_name',
            (patient_data->>'date_of_birth')::DATE,
            patient_data->>'phone_number',
            'patient',
            true,
            false,
            false
        )
        RETURNING id INTO new_profile_id;
    END IF;

    -- Insert patient
    INSERT INTO patients (
        patient_id,
        profile_id,
        gender,
        blood_type,
        status,
        created_at,
        updated_at
    )
    VALUES (
        new_patient_id,
        new_profile_id,
        patient_data->>'gender',
        patient_data->>'blood_type',
        COALESCE(patient_data->>'status', 'active'),
        NOW(),
        NOW()
    );

    -- Return created patient
    RETURN QUERY
    SELECT
        p.patient_id,
        p.profile_id,
        pr.full_name,
        pr.date_of_birth,
        p.gender,
        p.blood_type,
        p.status,
        p.created_at,
        p.updated_at
    FROM patients p
    LEFT JOIN profiles pr ON p.profile_id = pr.id
    WHERE p.patient_id = new_patient_id;
END;
$$ LANGUAGE plpgsql;

-- Update patient
CREATE OR REPLACE FUNCTION update_patient(input_patient_id TEXT, patient_data JSONB)
RETURNS TABLE(
    patient_id TEXT,
    profile_id TEXT,
    full_name TEXT,
    date_of_birth DATE,
    gender TEXT,
    blood_type TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    -- Update patient
    UPDATE patients
    SET
        gender = COALESCE(patient_data->>'gender', gender),
        blood_type = COALESCE(patient_data->>'blood_type', blood_type),
        status = COALESCE(patient_data->>'status', status),
        updated_at = NOW()
    WHERE patients.patient_id = input_patient_id;

    -- Update profile if exists and data provided
    IF patient_data ? 'email' OR patient_data ? 'phone_number' OR patient_data ? 'full_name' OR patient_data ? 'date_of_birth' THEN
        UPDATE profiles
        SET
            email = COALESCE(patient_data->>'email', email),
            full_name = COALESCE(patient_data->>'full_name', full_name),
            date_of_birth = COALESCE((patient_data->>'date_of_birth')::DATE, date_of_birth),
            phone_number = COALESCE(patient_data->>'phone_number', phone_number),
            updated_at = NOW()
        WHERE id = (SELECT profile_id FROM patients WHERE patients.patient_id = input_patient_id);
    END IF;

    -- Return updated patient
    RETURN QUERY
    SELECT
        p.patient_id,
        p.profile_id,
        pr.full_name,
        pr.date_of_birth,
        p.gender,
        p.blood_type,
        p.status,
        p.created_at,
        p.updated_at
    FROM patients p
    LEFT JOIN profiles pr ON p.profile_id = pr.id
    WHERE p.patient_id = input_patient_id;
END;
$$ LANGUAGE plpgsql;

-- Delete patient (soft delete)
CREATE OR REPLACE FUNCTION delete_patient(input_patient_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    rows_affected INT;
BEGIN
    UPDATE patients
    SET
        status = 'inactive',
        updated_at = NOW()
    WHERE patients.patient_id = input_patient_id;

    GET DIAGNOSTICS rows_affected = ROW_COUNT;

    RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DOCTOR SERVICE FUNCTIONS
-- ============================================================================

-- Get all doctors
CREATE OR REPLACE FUNCTION get_all_doctors(
    limit_count INT DEFAULT 50,
    offset_count INT DEFAULT 0
)
RETURNS TABLE(
    doctor_id TEXT,
    profile_id TEXT,
    full_name TEXT,
    specialty TEXT,
    qualification TEXT,
    department_id TEXT,
    license_number TEXT,
    gender TEXT,
    bio TEXT,
    experience_years INT,
    consultation_fee DECIMAL,
    address JSONB,
    languages_spoken TEXT[],
    availability_status TEXT,
    rating DECIMAL,
    total_reviews INT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.doctor_id,
        d.profile_id,
        d.full_name,
        d.specialty,
        d.qualification,
        d.department_id,
        d.license_number,
        d.gender,
        d.bio,
        d.experience_years,
        d.consultation_fee,
        d.address,
        d.languages_spoken,
        d.availability_status,
        d.rating,
        d.total_reviews,
        d.created_at,
        d.updated_at
    FROM doctors d
    ORDER BY d.created_at DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Get doctor by ID
CREATE OR REPLACE FUNCTION get_doctor_by_id(input_doctor_id TEXT)
RETURNS TABLE(
    doctor_id TEXT,
    profile_id TEXT,
    full_name TEXT,
    specialty TEXT,
    qualification TEXT,
    department_id TEXT,
    license_number TEXT,
    gender TEXT,
    bio TEXT,
    experience_years INT,
    consultation_fee DECIMAL,
    address JSONB,
    languages_spoken TEXT[],
    availability_status TEXT,
    rating DECIMAL,
    total_reviews INT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.doctor_id,
        d.profile_id,
        d.full_name,
        d.specialty,
        d.qualification,
        d.department_id,
        d.license_number,
        d.gender,
        d.bio,
        d.experience_years,
        d.consultation_fee,
        d.address,
        d.languages_spoken,
        d.availability_status,
        d.rating,
        d.total_reviews,
        d.created_at,
        d.updated_at
    FROM doctors d
    WHERE d.doctor_id = input_doctor_id;
END;
$$ LANGUAGE plpgsql;

-- Get doctor by profile ID
CREATE OR REPLACE FUNCTION get_doctor_by_profile_id(input_profile_id TEXT)
RETURNS TABLE(
    doctor_id TEXT,
    profile_id TEXT,
    full_name TEXT,
    specialty TEXT,
    qualification TEXT,
    department_id TEXT,
    license_number TEXT,
    gender TEXT,
    bio TEXT,
    experience_years INT,
    consultation_fee DECIMAL,
    address JSONB,
    languages_spoken TEXT[],
    availability_status TEXT,
    rating DECIMAL,
    total_reviews INT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.doctor_id,
        d.profile_id,
        d.full_name,
        d.specialty,
        d.qualification,
        d.department_id,
        d.license_number,
        d.gender,
        d.bio,
        d.experience_years,
        d.consultation_fee,
        d.address,
        d.languages_spoken,
        d.availability_status,
        d.rating,
        d.total_reviews,
        d.created_at,
        d.updated_at
    FROM doctors d
    WHERE d.profile_id = input_profile_id;
END;
$$ LANGUAGE plpgsql;

-- Get doctor by email
CREATE OR REPLACE FUNCTION get_doctor_by_email(doctor_email TEXT)
RETURNS TABLE(
    doctor_id TEXT,
    profile_id TEXT,
    full_name TEXT,
    specialty TEXT,
    qualification TEXT,
    department_id TEXT,
    license_number TEXT,
    gender TEXT,
    bio TEXT,
    experience_years INT,
    consultation_fee DECIMAL,
    address JSONB,
    languages_spoken TEXT[],
    availability_status TEXT,
    rating DECIMAL,
    total_reviews INT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.doctor_id,
        d.profile_id,
        d.full_name,
        d.specialty,
        d.qualification,
        d.department_id,
        d.license_number,
        d.gender,
        d.bio,
        d.experience_years,
        d.consultation_fee,
        d.address,
        d.languages_spoken,
        d.availability_status,
        d.rating,
        d.total_reviews,
        d.created_at,
        d.updated_at
    FROM doctors d
    LEFT JOIN profiles pr ON d.profile_id = pr.id
    WHERE pr.email = doctor_email;
END;
$$ LANGUAGE plpgsql;

-- Create doctor
CREATE OR REPLACE FUNCTION create_doctor(doctor_data JSONB)
RETURNS TABLE(
    doctor_id TEXT,
    profile_id TEXT,
    full_name TEXT,
    specialty TEXT,
    qualification TEXT,
    department_id TEXT,
    license_number TEXT,
    gender TEXT,
    bio TEXT,
    experience_years INT,
    consultation_fee DECIMAL,
    address JSONB,
    languages_spoken TEXT[],
    availability_status TEXT,
    rating DECIMAL,
    total_reviews INT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
DECLARE
    new_doctor_id TEXT;
    new_profile_id TEXT;
    dept_id TEXT;
BEGIN
    -- Get department ID
    dept_id := doctor_data->>'department_id';

    -- Generate new doctor ID
    new_doctor_id := generate_doctor_id(dept_id);

    -- Create profile first if email is provided
    IF doctor_data ? 'email' THEN
        INSERT INTO profiles (email, phone_number, role, is_active, email_verified, phone_verified)
        VALUES (
            doctor_data->>'email',
            doctor_data->>'phone_number',
            'doctor',
            true,
            false,
            false
        )
        RETURNING id INTO new_profile_id;
    END IF;

    -- Insert doctor
    INSERT INTO doctors (
        doctor_id,
        profile_id,
        full_name,
        specialty,
        qualification,
        department_id,
        license_number,
        gender,
        bio,
        experience_years,
        consultation_fee,
        address,
        languages_spoken,
        availability_status,
        rating,
        total_reviews,
        created_at,
        updated_at
    )
    VALUES (
        new_doctor_id,
        new_profile_id,
        doctor_data->>'full_name',
        doctor_data->>'specialty',
        doctor_data->>'qualification',
        dept_id,
        doctor_data->>'license_number',
        doctor_data->>'gender',
        doctor_data->>'bio',
        COALESCE((doctor_data->>'experience_years')::INT, 0),
        COALESCE((doctor_data->>'consultation_fee')::DECIMAL, 0),
        COALESCE(doctor_data->'address', '{}'::JSONB),
        COALESCE(ARRAY(SELECT jsonb_array_elements_text(doctor_data->'languages_spoken')), ARRAY['Vietnamese']),
        COALESCE(doctor_data->>'availability_status', 'available'),
        0.00,
        0,
        NOW(),
        NOW()
    );

    -- Return created doctor
    RETURN QUERY
    SELECT
        d.doctor_id,
        d.profile_id,
        d.full_name,
        d.specialty,
        d.qualification,
        d.department_id,
        d.license_number,
        d.gender,
        d.bio,
        d.experience_years,
        d.consultation_fee,
        d.address,
        d.languages_spoken,
        d.availability_status,
        d.rating,
        d.total_reviews,
        d.created_at,
        d.updated_at
    FROM doctors d
    WHERE d.doctor_id = new_doctor_id;
END;
$$ LANGUAGE plpgsql;

-- Update doctor
CREATE OR REPLACE FUNCTION update_doctor(input_doctor_id TEXT, doctor_data JSONB)
RETURNS TABLE(
    doctor_id TEXT,
    profile_id TEXT,
    full_name TEXT,
    specialty TEXT,
    qualification TEXT,
    department_id TEXT,
    license_number TEXT,
    gender TEXT,
    bio TEXT,
    experience_years INT,
    consultation_fee DECIMAL,
    address JSONB,
    languages_spoken TEXT[],
    availability_status TEXT,
    rating DECIMAL,
    total_reviews INT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    -- Update doctor
    UPDATE doctors
    SET
        full_name = COALESCE(doctor_data->>'full_name', full_name),
        specialty = COALESCE(doctor_data->>'specialty', specialty),
        qualification = COALESCE(doctor_data->>'qualification', qualification),
        department_id = COALESCE(doctor_data->>'department_id', department_id),
        license_number = COALESCE(doctor_data->>'license_number', license_number),
        gender = COALESCE(doctor_data->>'gender', gender),
        bio = COALESCE(doctor_data->>'bio', bio),
        experience_years = COALESCE((doctor_data->>'experience_years')::INT, experience_years),
        consultation_fee = COALESCE((doctor_data->>'consultation_fee')::DECIMAL, consultation_fee),
        address = COALESCE(doctor_data->'address', address),
        languages_spoken = COALESCE(ARRAY(SELECT jsonb_array_elements_text(doctor_data->'languages_spoken')), languages_spoken),
        availability_status = COALESCE(doctor_data->>'availability_status', availability_status),
        updated_at = NOW()
    WHERE doctors.doctor_id = input_doctor_id;

    -- Update profile if exists and data provided
    IF doctor_data ? 'email' OR doctor_data ? 'phone_number' THEN
        UPDATE profiles
        SET
            email = COALESCE(doctor_data->>'email', email),
            phone_number = COALESCE(doctor_data->>'phone_number', phone_number),
            updated_at = NOW()
        WHERE id = (SELECT profile_id FROM doctors WHERE doctors.doctor_id = input_doctor_id);
    END IF;

    -- Return updated doctor
    RETURN QUERY
    SELECT
        d.doctor_id,
        d.profile_id,
        d.full_name,
        d.specialty,
        d.qualification,
        d.department_id,
        d.license_number,
        d.gender,
        d.bio,
        d.experience_years,
        d.consultation_fee,
        d.address,
        d.languages_spoken,
        d.availability_status,
        d.rating,
        d.total_reviews,
        d.created_at,
        d.updated_at
    FROM doctors d
    WHERE d.doctor_id = input_doctor_id;
END;
$$ LANGUAGE plpgsql;

-- Delete doctor (soft delete)
CREATE OR REPLACE FUNCTION delete_doctor(input_doctor_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    rows_affected INT;
BEGIN
    UPDATE doctors
    SET
        availability_status = 'inactive',
        updated_at = NOW()
    WHERE doctors.doctor_id = input_doctor_id;

    GET DIAGNOSTICS rows_affected = ROW_COUNT;

    RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql;

-- Count doctors
CREATE OR REPLACE FUNCTION count_doctors()
RETURNS INT AS $$
DECLARE
    total_count INT;
BEGIN
    SELECT COUNT(*) INTO total_count FROM doctors;
    RETURN total_count;
END;
$$ LANGUAGE plpgsql;

-- Get doctors by department
CREATE OR REPLACE FUNCTION get_doctors_by_department(
    dept_id TEXT,
    limit_count INT DEFAULT 50,
    offset_count INT DEFAULT 0
)
RETURNS TABLE(
    doctor_id TEXT,
    profile_id TEXT,
    full_name TEXT,
    specialty TEXT,
    qualification TEXT,
    department_id TEXT,
    license_number TEXT,
    gender TEXT,
    bio TEXT,
    experience_years INT,
    consultation_fee DECIMAL,
    address JSONB,
    languages_spoken TEXT[],
    availability_status TEXT,
    rating DECIMAL,
    total_reviews INT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.doctor_id,
        d.profile_id,
        d.full_name,
        d.specialty,
        d.qualification,
        d.department_id,
        d.license_number,
        d.gender,
        d.bio,
        d.experience_years,
        d.consultation_fee,
        d.address,
        d.languages_spoken,
        d.availability_status,
        d.rating,
        d.total_reviews,
        d.created_at,
        d.updated_at
    FROM doctors d
    WHERE d.department_id = dept_id
    ORDER BY d.created_at DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Get doctors by specialty
CREATE OR REPLACE FUNCTION get_doctors_by_specialty(
    doctor_specialty TEXT,
    limit_count INT DEFAULT 50,
    offset_count INT DEFAULT 0
)
RETURNS TABLE(
    doctor_id TEXT,
    profile_id TEXT,
    full_name TEXT,
    specialty TEXT,
    qualification TEXT,
    department_id TEXT,
    license_number TEXT,
    gender TEXT,
    bio TEXT,
    experience_years INT,
    consultation_fee DECIMAL,
    address JSONB,
    languages_spoken TEXT[],
    availability_status TEXT,
    rating DECIMAL,
    total_reviews INT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.doctor_id,
        d.profile_id,
        d.full_name,
        d.specialty,
        d.qualification,
        d.department_id,
        d.license_number,
        d.gender,
        d.bio,
        d.experience_years,
        d.consultation_fee,
        d.address,
        d.languages_spoken,
        d.availability_status,
        d.rating,
        d.total_reviews,
        d.created_at,
        d.updated_at
    FROM doctors d
    WHERE d.specialty = doctor_specialty
    ORDER BY d.created_at DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- APPOINTMENT SERVICE FUNCTIONS
-- ============================================================================

-- Create appointment
CREATE OR REPLACE FUNCTION create_appointment(appointment_data JSONB)
RETURNS TABLE(
    appointment_id TEXT,
    doctor_id TEXT,
    patient_id TEXT,
    appointment_date DATE,
    appointment_time TIME,
    status TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
DECLARE
    new_appointment_id TEXT;
    dept_id TEXT;
BEGIN
    -- Get department ID from doctor
    SELECT department_id INTO dept_id
    FROM doctors
    WHERE doctor_id = appointment_data->>'doctor_id';

    -- Generate new appointment ID
    new_appointment_id := generate_appointment_id(dept_id);

    -- Insert appointment
    INSERT INTO appointments (
        appointment_id,
        doctor_id,
        patient_id,
        appointment_date,
        appointment_time,
        status,
        notes,
        created_at,
        updated_at
    )
    VALUES (
        new_appointment_id,
        appointment_data->>'doctor_id',
        appointment_data->>'patient_id',
        (appointment_data->>'appointment_date')::DATE,
        (appointment_data->>'appointment_time')::TIME,
        COALESCE(appointment_data->>'status', 'scheduled'),
        appointment_data->>'notes',
        NOW(),
        NOW()
    );

    -- Return created appointment
    RETURN QUERY
    SELECT
        a.appointment_id,
        a.doctor_id,
        a.patient_id,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.notes,
        a.created_at,
        a.updated_at
    FROM appointments a
    WHERE a.appointment_id = new_appointment_id;
END;
$$ LANGUAGE plpgsql;

-- Update appointment
CREATE OR REPLACE FUNCTION update_appointment(input_appointment_id TEXT, appointment_data JSONB)
RETURNS TABLE(
    appointment_id TEXT,
    doctor_id TEXT,
    patient_id TEXT,
    appointment_date DATE,
    appointment_time TIME,
    status TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    -- Update appointment
    UPDATE appointments
    SET
        doctor_id = COALESCE(appointment_data->>'doctor_id', doctor_id),
        patient_id = COALESCE(appointment_data->>'patient_id', patient_id),
        appointment_date = COALESCE((appointment_data->>'appointment_date')::DATE, appointment_date),
        appointment_time = COALESCE((appointment_data->>'appointment_time')::TIME, appointment_time),
        status = COALESCE(appointment_data->>'status', status),
        notes = COALESCE(appointment_data->>'notes', notes),
        updated_at = NOW()
    WHERE appointments.appointment_id = input_appointment_id;

    -- Return updated appointment
    RETURN QUERY
    SELECT
        a.appointment_id,
        a.doctor_id,
        a.patient_id,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.notes,
        a.created_at,
        a.updated_at
    FROM appointments a
    WHERE a.appointment_id = input_appointment_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION AND COMPLETION
-- ============================================================================

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
        ('generate_patient_id'),
        ('generate_doctor_id'),
        ('generate_admin_id'),
        ('generate_appointment_id'),
        ('generate_medical_record_id'),
        ('get_all_patients'),
        ('get_patient_by_id'),
        ('get_patient_by_profile_id'),
        ('create_patient'),
        ('update_patient'),
        ('delete_patient'),
        ('get_all_doctors'),
        ('get_doctor_by_id'),
        ('get_doctor_by_profile_id'),
        ('get_doctor_by_email'),
        ('create_doctor'),
        ('update_doctor'),
        ('delete_doctor'),
        ('count_doctors'),
        ('get_doctors_by_department'),
        ('get_doctors_by_specialty'),
        ('create_appointment'),
        ('update_appointment')
    ) AS f(function_name);
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'Hospital Management Database Functions Created Successfully!' as status;
