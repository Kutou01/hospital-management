-- =====================================================
-- CHECK AND FIX COLUMNS
-- Hospital Management System - Check actual table structure and fix
-- =====================================================

-- Step 1: Check actual structure of all tables
SELECT 'DOCTORS TABLE STRUCTURE' as info, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'doctors' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'PATIENTS TABLE STRUCTURE' as info, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'patients' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'ADMINS TABLE STRUCTURE' as info, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'admins' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Add missing columns based on what we need

-- Add full_name to doctors if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'doctors' AND column_name = 'full_name' AND table_schema = 'public') THEN
        ALTER TABLE public.doctors ADD COLUMN full_name VARCHAR(255);
        RAISE NOTICE 'Added full_name to doctors table';
    END IF;
END $$;

-- Add gender to doctors if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'doctors' AND column_name = 'gender' AND table_schema = 'public') THEN
        ALTER TABLE public.doctors ADD COLUMN gender VARCHAR(20) DEFAULT 'other';
        RAISE NOTICE 'Added gender to doctors table';
    END IF;
END $$;

-- Add full_name to patients if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'patients' AND column_name = 'full_name' AND table_schema = 'public') THEN
        ALTER TABLE public.patients ADD COLUMN full_name VARCHAR(255);
        RAISE NOTICE 'Added full_name to patients table';
    END IF;
END $$;

-- Add date_of_birth to patients if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'patients' AND column_name = 'date_of_birth' AND table_schema = 'public') THEN
        ALTER TABLE public.patients ADD COLUMN date_of_birth DATE;
        RAISE NOTICE 'Added date_of_birth to patients table';
    END IF;
END $$;

-- Add full_name to admins if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'admins' AND column_name = 'full_name' AND table_schema = 'public') THEN
        ALTER TABLE public.admins ADD COLUMN full_name VARCHAR(255);
        RAISE NOTICE 'Added full_name to admins table';
    END IF;
END $$;

-- Step 3: Create minimal trigger function that only uses existing columns
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
    user_name TEXT;
    user_phone TEXT;
    user_gender TEXT;
    user_specialty TEXT;
    user_license TEXT;
    user_qualification TEXT;
    user_department_id TEXT;
    user_dob TEXT;
    user_address TEXT;
    generated_doctor_id TEXT;
    generated_patient_id TEXT;
BEGIN
    -- Extract metadata with safe fallbacks
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
    user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
    user_phone := COALESCE(NEW.raw_user_meta_data->>'phone_number', NEW.phone);
    user_gender := COALESCE(NEW.raw_user_meta_data->>'gender', 'other');
    user_specialty := NEW.raw_user_meta_data->>'specialty';
    user_license := NEW.raw_user_meta_data->>'license_number';
    user_qualification := NEW.raw_user_meta_data->>'qualification';
    user_department_id := NEW.raw_user_meta_data->>'department_id';
    user_dob := NEW.raw_user_meta_data->>'date_of_birth';
    user_address := NEW.raw_user_meta_data->>'address';
    
    -- Insert into profiles table
    BEGIN
        INSERT INTO public.profiles (
            id, 
            email, 
            full_name, 
            role,
            phone_number,
            email_verified,
            phone_verified,
            is_active,
            profile_data,
            created_at,
            updated_at
        )
        VALUES (
            NEW.id,
            NEW.email,
            user_name,
            user_role,
            user_phone,
            CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
            false,
            true,
            NEW.raw_user_meta_data,
            NOW(),
            NOW()
        );
        
        -- Create role-specific record with minimal required columns
        IF user_role = 'doctor' THEN
            generated_doctor_id := 'DOC' || LPAD(NEXTVAL('doctor_id_seq')::TEXT, 6, '0');
            
            -- Insert only required columns for doctors
            INSERT INTO public.doctors (
                doctor_id,
                profile_id,
                full_name,
                specialization,
                gender,
                created_at,
                updated_at
            )
            VALUES (
                generated_doctor_id,
                NEW.id,
                user_name,
                COALESCE(user_specialty, 'General Medicine'),
                user_gender,
                NOW(),
                NOW()
            );
            
        ELSIF user_role = 'patient' THEN
            generated_patient_id := 'PAT' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT;
            
            -- Insert only required columns for patients
            INSERT INTO public.patients (
                patient_id,
                profile_id,
                full_name,
                date_of_birth,
                created_at,
                updated_at
            )
            VALUES (
                generated_patient_id,
                NEW.id,
                user_name,
                COALESCE(user_dob::DATE, CURRENT_DATE - INTERVAL '30 years'),
                NOW(),
                NOW()
            );
            
        ELSIF user_role = 'admin' THEN
            -- Insert only required columns for admins
            INSERT INTO public.admins (
                admin_id,
                profile_id,
                full_name,
                created_at,
                updated_at
            )
            VALUES (
                'ADM' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT,
                NEW.id,
                user_name,
                NOW(),
                NOW()
            );
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        -- Log error but don't fail auth user creation
        RAISE LOG 'Failed to create profile/role record for user %: %', NEW.id, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create minimal RPC function
CREATE OR REPLACE FUNCTION public.create_user_profile_enhanced(
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
        RETURN json_build_object(
            'success', false,
            'error', 'Profile already exists for this user'
        );
    END IF;
    
    -- Insert new profile
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        phone_number,
        role,
        email_verified,
        phone_verified,
        is_active,
        created_at,
        updated_at
    )
    VALUES (
        user_id,
        user_email,
        user_name,
        user_phone,
        user_role,
        false,
        false,
        true,
        NOW(),
        NOW()
    )
    RETURNING * INTO new_profile;
    
    -- Create role-specific record with minimal columns
    IF user_role = 'doctor' THEN
        generated_doctor_id := 'DOC' || LPAD(NEXTVAL('doctor_id_seq')::TEXT, 6, '0');
        
        INSERT INTO public.doctors (
            doctor_id,
            profile_id,
            full_name,
            specialization,
            gender,
            created_at,
            updated_at
        )
        VALUES (
            generated_doctor_id,
            user_id,
            user_name,
            COALESCE(user_specialty, 'General Medicine'),
            user_gender,
            NOW(),
            NOW()
        );
        
    ELSIF user_role = 'patient' THEN
        generated_patient_id := 'PAT' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT;
        
        INSERT INTO public.patients (
            patient_id,
            profile_id,
            full_name,
            date_of_birth,
            created_at,
            updated_at
        )
        VALUES (
            generated_patient_id,
            user_id,
            user_name,
            COALESCE(user_dob::DATE, CURRENT_DATE - INTERVAL '30 years'),
            NOW(),
            NOW()
        );
        
    ELSIF user_role = 'admin' THEN
        INSERT INTO public.admins (
            admin_id,
            profile_id,
            full_name,
            created_at,
            updated_at
        )
        VALUES (
            'ADM' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT,
            user_id,
            user_name,
            NOW(),
            NOW()
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'profile', row_to_json(new_profile),
        'role_record_created', true
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Recreate trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Grant permissions
GRANT EXECUTE ON FUNCTION public.create_user_profile_enhanced TO authenticated, anon;

-- Step 7: Show final table structures
SELECT 'FINAL DOCTORS STRUCTURE' as info, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'doctors' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'FINAL PATIENTS STRUCTURE' as info, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'patients' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'FINAL ADMINS STRUCTURE' as info, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'admins' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'SETUP COMPLETED' as status, NOW() as timestamp;
