-- =====================================================
-- FIX NOT NULL CONSTRAINTS
-- Hospital Management System - Fix NOT NULL constraints for optional fields
-- =====================================================

-- Step 1: Check current constraints
SELECT 
    'DOCTORS CONSTRAINTS' as info,
    column_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'doctors' AND table_schema = 'public'
AND is_nullable = 'NO'
ORDER BY column_name;

SELECT 
    'PATIENTS CONSTRAINTS' as info,
    column_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'patients' AND table_schema = 'public'
AND is_nullable = 'NO'
ORDER BY column_name;

-- Step 2: Make license_number nullable in doctors table
ALTER TABLE public.doctors ALTER COLUMN license_number DROP NOT NULL;

-- Step 3: Make gender nullable in patients table  
ALTER TABLE public.patients ALTER COLUMN gender DROP NOT NULL;

-- Step 4: Add default values for commonly required fields
ALTER TABLE public.doctors ALTER COLUMN license_number SET DEFAULT 'PENDING';
ALTER TABLE public.doctors ALTER COLUMN qualification SET DEFAULT 'MD';
ALTER TABLE public.doctors ALTER COLUMN department_id SET DEFAULT 'DEPT001';
ALTER TABLE public.doctors ALTER COLUMN status SET DEFAULT 'active';

ALTER TABLE public.patients ALTER COLUMN gender SET DEFAULT 'other';
ALTER TABLE public.patients ALTER COLUMN status SET DEFAULT 'active';
ALTER TABLE public.patients ALTER COLUMN registration_date SET DEFAULT CURRENT_DATE;

-- Step 5: Update the RPC function to provide default values
CREATE OR REPLACE FUNCTION public.create_profile_with_role(
    user_id UUID,
    user_email TEXT,
    user_name TEXT,
    user_phone TEXT DEFAULT NULL,
    user_role TEXT DEFAULT 'patient',
    user_gender TEXT DEFAULT 'other',
    user_specialty TEXT DEFAULT NULL,
    user_dob TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    new_profile RECORD;
    generated_doctor_id TEXT;
    generated_patient_id TEXT;
BEGIN
    -- Check if profile already exists
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
        RETURN json_build_object('success', false, 'error', 'Profile already exists');
    END IF;
    
    -- Insert new profile
    INSERT INTO public.profiles (
        id, email, full_name, phone_number, role,
        email_verified, phone_verified, is_active, created_at, updated_at
    )
    VALUES (
        user_id, user_email, user_name, user_phone, user_role,
        false, false, true, NOW(), NOW()
    )
    RETURNING * INTO new_profile;
    
    -- Create role-specific record with proper defaults
    IF user_role = 'doctor' THEN
        generated_doctor_id := 'DOC' || LPAD(NEXTVAL('doctor_id_seq')::TEXT, 6, '0');
        
        INSERT INTO public.doctors (
            doctor_id, profile_id, full_name, specialization, 
            license_number, qualification, department_id, gender,
            phone_number, status, schedule, created_at, updated_at
        )
        VALUES (
            generated_doctor_id, user_id, user_name,
            COALESCE(user_specialty, 'General Medicine'),
            'PENDING', -- Default license
            'MD', -- Default qualification
            'DEPT001', -- Default department
            COALESCE(user_gender, 'other'),
            user_phone,
            'active', -- Default status
            '{}', -- Empty schedule
            NOW(), NOW()
        );
        
    ELSIF user_role = 'patient' THEN
        generated_patient_id := 'PAT' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT;
        
        INSERT INTO public.patients (
            patient_id, profile_id, full_name, date_of_birth,
            gender, phone_number, address, registration_date,
            status, created_at, updated_at
        )
        VALUES (
            generated_patient_id, user_id, user_name,
            COALESCE(user_dob::DATE, CURRENT_DATE - INTERVAL '30 years'),
            COALESCE(user_gender, 'other'),
            user_phone,
            '{}', -- Empty address
            CURRENT_DATE,
            'active', -- Default status
            NOW(), NOW()
        );
        
    ELSIF user_role = 'admin' THEN
        INSERT INTO public.admins (
            admin_id, profile_id, full_name, phone_number,
            role_level, permissions, status, created_at, updated_at
        )
        VALUES (
            'ADM' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT, user_id, user_name, user_phone,
            'standard', '{}', 'active', NOW(), NOW()
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'profile', row_to_json(new_profile),
        'role_record_created', true
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Update trigger function with proper defaults
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
    user_name TEXT;
    user_phone TEXT;
    user_gender TEXT;
    user_specialty TEXT;
    user_dob TEXT;
    generated_doctor_id TEXT;
    generated_patient_id TEXT;
BEGIN
    -- Extract metadata
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
    user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
    user_phone := COALESCE(NEW.raw_user_meta_data->>'phone_number', NEW.phone);
    user_gender := COALESCE(NEW.raw_user_meta_data->>'gender', 'other');
    user_specialty := NEW.raw_user_meta_data->>'specialty';
    user_dob := NEW.raw_user_meta_data->>'date_of_birth';
    
    -- Insert into profiles table
    BEGIN
        INSERT INTO public.profiles (
            id, email, full_name, role, phone_number,
            email_verified, phone_verified, is_active,
            profile_data, created_at, updated_at
        )
        VALUES (
            NEW.id, NEW.email, user_name, user_role, user_phone,
            CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
            false, true, NEW.raw_user_meta_data, NOW(), NOW()
        );
        
        -- Create role-specific record with defaults
        IF user_role = 'doctor' THEN
            generated_doctor_id := 'DOC' || LPAD(NEXTVAL('doctor_id_seq')::TEXT, 6, '0');
            
            INSERT INTO public.doctors (
                doctor_id, profile_id, full_name, specialization,
                license_number, qualification, department_id, gender,
                phone_number, status, schedule, created_at, updated_at
            )
            VALUES (
                generated_doctor_id, NEW.id, user_name,
                COALESCE(user_specialty, 'General Medicine'),
                'PENDING', 'MD', 'DEPT001', user_gender,
                user_phone, 'active', '{}', NOW(), NOW()
            );
            
        ELSIF user_role = 'patient' THEN
            generated_patient_id := 'PAT' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT;
            
            INSERT INTO public.patients (
                patient_id, profile_id, full_name, date_of_birth,
                gender, phone_number, address, registration_date,
                status, created_at, updated_at
            )
            VALUES (
                generated_patient_id, NEW.id, user_name,
                COALESCE(user_dob::DATE, CURRENT_DATE - INTERVAL '30 years'),
                user_gender, user_phone, '{}', CURRENT_DATE,
                'active', NOW(), NOW()
            );
            
        ELSIF user_role = 'admin' THEN
            INSERT INTO public.admins (
                admin_id, profile_id, full_name, phone_number,
                role_level, permissions, status, created_at, updated_at
            )
            VALUES (
                'ADM' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT, NEW.id, user_name, user_phone,
                'standard', '{}', 'active', NOW(), NOW()
            );
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Failed to create profile/role record for user %: %', NEW.id, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Test the updated function
SELECT 'TESTING UPDATED FUNCTION' as status;

-- Test doctor creation
SELECT public.create_profile_with_role(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'test-doctor@example.com',
    'Test Doctor',
    '0123456789',
    'doctor',
    'male',
    'Cardiology',
    '1990-01-01'
) as doctor_test;

-- Test patient creation
SELECT public.create_profile_with_role(
    '22222222-2222-2222-2222-222222222222'::uuid,
    'test-patient@example.com',
    'Test Patient',
    '0987654321',
    'patient',
    'female',
    NULL,
    '1995-05-15'
) as patient_test;

-- Clean up test records
DELETE FROM public.doctors WHERE profile_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
DELETE FROM public.patients WHERE profile_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
DELETE FROM public.profiles WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

-- Step 8: Show final status
SELECT 'NOT NULL CONSTRAINTS FIXED' as status, NOW() as timestamp;

-- Step 9: Verify constraints are now nullable
SELECT 
    'DOCTORS NULLABLE FIELDS' as info,
    column_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'doctors' AND table_schema = 'public'
AND column_name IN ('license_number', 'qualification', 'department_id', 'gender')
ORDER BY column_name;

SELECT 
    'PATIENTS NULLABLE FIELDS' as info,
    column_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'patients' AND table_schema = 'public'
AND column_name IN ('gender', 'registration_date')
ORDER BY column_name;
