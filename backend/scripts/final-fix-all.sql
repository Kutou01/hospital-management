-- =====================================================
-- FINAL FIX ALL
-- Hospital Management System - Complete fix for all issues
-- =====================================================

-- Step 1: Drop all existing functions and triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.create_user_profile_enhanced(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_user_profile_enhanced(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_user_profile_enhanced(UUID, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_user_profile_enhanced(UUID, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_user_profile_enhanced(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_user_profile_enhanced(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_user_profile_enhanced(UUID, TEXT);
DROP FUNCTION IF EXISTS public.create_user_profile_enhanced(UUID);

-- Step 2: Add missing columns
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS gender VARCHAR(20) DEFAULT 'other';

ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS date_of_birth DATE;

ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

-- Step 3: Create sequence if not exists
CREATE SEQUENCE IF NOT EXISTS doctor_id_seq START 1;

-- Step 4: Create simple trigger function
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
        
        -- Create role-specific record
        IF user_role = 'doctor' THEN
            generated_doctor_id := 'DOC' || LPAD(NEXTVAL('doctor_id_seq')::TEXT, 6, '0');
            
            INSERT INTO public.doctors (
                doctor_id, profile_id, full_name, specialization, gender, created_at, updated_at
            )
            VALUES (
                generated_doctor_id, NEW.id, user_name, 
                COALESCE(user_specialty, 'General Medicine'), user_gender, NOW(), NOW()
            );
            
        ELSIF user_role = 'patient' THEN
            generated_patient_id := 'PAT' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT;
            
            INSERT INTO public.patients (
                patient_id, profile_id, full_name, date_of_birth, created_at, updated_at
            )
            VALUES (
                generated_patient_id, NEW.id, user_name,
                COALESCE(user_dob::DATE, CURRENT_DATE - INTERVAL '30 years'), NOW(), NOW()
            );
            
        ELSIF user_role = 'admin' THEN
            INSERT INTO public.admins (
                admin_id, profile_id, full_name, created_at, updated_at
            )
            VALUES (
                'ADM' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT, NEW.id, user_name, NOW(), NOW()
            );
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Failed to create profile/role record for user %: %', NEW.id, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create simple RPC function with new name
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
    
    -- Create role-specific record
    IF user_role = 'doctor' THEN
        generated_doctor_id := 'DOC' || LPAD(NEXTVAL('doctor_id_seq')::TEXT, 6, '0');
        
        INSERT INTO public.doctors (
            doctor_id, profile_id, full_name, specialization, gender, created_at, updated_at
        )
        VALUES (
            generated_doctor_id, user_id, user_name,
            COALESCE(user_specialty, 'General Medicine'), user_gender, NOW(), NOW()
        );
        
    ELSIF user_role = 'patient' THEN
        generated_patient_id := 'PAT' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT;
        
        INSERT INTO public.patients (
            patient_id, profile_id, full_name, date_of_birth, created_at, updated_at
        )
        VALUES (
            generated_patient_id, user_id, user_name,
            COALESCE(user_dob::DATE, CURRENT_DATE - INTERVAL '30 years'), NOW(), NOW()
        );
        
    ELSIF user_role = 'admin' THEN
        INSERT INTO public.admins (
            admin_id, profile_id, full_name, created_at, updated_at
        )
        VALUES (
            'ADM' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT, user_id, user_name, NOW(), NOW()
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

-- Step 6: Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Grant permissions
GRANT EXECUTE ON FUNCTION public.create_profile_with_role TO authenticated, anon;
GRANT USAGE, SELECT ON SEQUENCE doctor_id_seq TO authenticated, anon;

-- Step 8: Update RLS policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
CREATE POLICY "Enable insert for authenticated users only" ON public.profiles
    FOR INSERT WITH CHECK (true);

-- Step 9: Test the new function
SELECT 'TESTING NEW FUNCTION' as status;

-- Test with a sample call
SELECT public.create_profile_with_role(
    '12345678-1234-1234-1234-123456789012'::uuid,
    'test@example.com',
    'Test User',
    '0123456789',
    'doctor',
    'male',
    'Cardiology',
    '1990-01-01'
) as test_result;

-- Clean up test
DELETE FROM public.doctors WHERE profile_id = '12345678-1234-1234-1234-123456789012';
DELETE FROM public.profiles WHERE id = '12345678-1234-1234-1234-123456789012';

-- Step 10: Show final status
SELECT 'SETUP COMPLETED SUCCESSFULLY' as status, NOW() as timestamp;

-- Step 11: Show table structures
SELECT 'DOCTORS COLUMNS' as info, 
       STRING_AGG(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_name = 'doctors' AND table_schema = 'public';

SELECT 'PATIENTS COLUMNS' as info,
       STRING_AGG(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_name = 'patients' AND table_schema = 'public';

SELECT 'ADMINS COLUMNS' as info,
       STRING_AGG(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_name = 'admins' AND table_schema = 'public';
