-- =====================================================
-- COMPLETE TRIGGER SOLUTION FOR SUPABASE
-- Hospital Management System - Profile Creation Trigger
-- =====================================================

-- Step 1: Create or replace the trigger function with role-specific table creation
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
    -- Log the trigger execution
    RAISE LOG 'Trigger handle_new_user executed for user: %', NEW.id;

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

    -- Insert into profiles table with error handling
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

        RAISE LOG 'Profile created successfully for user: %', NEW.id;

        -- Create role-specific record based on user role
        IF user_role = 'doctor' THEN
            -- Generate doctor ID
            generated_doctor_id := 'DOC' || LPAD(NEXTVAL('doctor_id_seq')::TEXT, 6, '0');

            INSERT INTO public.doctors (
                doctor_id,
                profile_id,
                full_name,
                specialization,
                license_number,
                qualification,
                department_id,
                gender,
                phone_number,
                status,
                schedule,
                created_at,
                updated_at
            )
            VALUES (
                generated_doctor_id,
                NEW.id,
                user_name,
                COALESCE(user_specialty, 'General Medicine'),
                COALESCE(user_license, 'PENDING'),
                COALESCE(user_qualification, 'MD'),
                COALESCE(user_department_id, 'DEPT001'),
                user_gender,
                user_phone,
                'active',
                '{}',
                NOW(),
                NOW()
            );

            RAISE LOG 'Doctor record created for user: %', NEW.id;

        ELSIF user_role = 'patient' THEN
            -- Generate patient ID
            generated_patient_id := 'PAT' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT;

            INSERT INTO public.patients (
                patient_id,
                profile_id,
                full_name,
                dateofbirth,
                gender,
                phone_number,
                address,
                registration_date,
                status,
                created_at,
                updated_at
            )
            VALUES (
                generated_patient_id,
                NEW.id,
                user_name,
                COALESCE(user_dob::DATE, CURRENT_DATE - INTERVAL '30 years'),
                user_gender,
                user_phone,
                COALESCE(user_address, '{}'),
                CURRENT_DATE,
                'active',
                NOW(),
                NOW()
            );

            RAISE LOG 'Patient record created for user: %', NEW.id;

        ELSIF user_role = 'admin' THEN
            -- Create admin record if admins table exists
            BEGIN
                INSERT INTO public.admins (
                    admin_id,
                    profile_id,
                    full_name,
                    phone_number,
                    role_level,
                    permissions,
                    status,
                    created_at,
                    updated_at
                )
                VALUES (
                    'ADM' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT,
                    NEW.id,
                    user_name,
                    user_phone,
                    'standard',
                    '{}',
                    'active',
                    NOW(),
                    NOW()
                );

                RAISE LOG 'Admin record created for user: %', NEW.id;

            EXCEPTION WHEN OTHERS THEN
                RAISE LOG 'Admin table might not exist, skipping admin record creation for user: %', NEW.id;
            END;
        END IF;

    EXCEPTION WHEN OTHERS THEN
        -- Log the error but don't fail the auth user creation
        RAISE LOG 'Failed to create profile/role record for user %: %', NEW.id, SQLERRM;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create sequence for doctor IDs if not exists
CREATE SEQUENCE IF NOT EXISTS doctor_id_seq START 1;

-- Step 3: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 4: Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Create enhanced RPC function for manual profile creation with role tables
CREATE OR REPLACE FUNCTION public.create_user_profile(
    user_id UUID,
    user_email TEXT,
    user_name TEXT,
    user_phone TEXT DEFAULT NULL,
    user_role TEXT DEFAULT 'patient',
    user_gender TEXT DEFAULT 'other',
    user_specialty TEXT DEFAULT NULL,
    user_license TEXT DEFAULT NULL,
    user_qualification TEXT DEFAULT NULL,
    user_department_id TEXT DEFAULT NULL,
    user_dob TEXT DEFAULT NULL,
    user_address TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    new_profile RECORD;
    generated_doctor_id TEXT;
    generated_patient_id TEXT;
    result JSON;
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

    -- Create role-specific record
    IF user_role = 'doctor' THEN
        generated_doctor_id := 'DOC' || LPAD(NEXTVAL('doctor_id_seq')::TEXT, 6, '0');

        INSERT INTO public.doctors (
            doctor_id,
            profile_id,
            full_name,
            specialization,
            license_number,
            qualification,
            department_id,
            gender,
            phone_number,
            status,
            schedule,
            created_at,
            updated_at
        )
        VALUES (
            generated_doctor_id,
            user_id,
            user_name,
            COALESCE(user_specialty, 'General Medicine'),
            COALESCE(user_license, 'PENDING'),
            COALESCE(user_qualification, 'MD'),
            COALESCE(user_department_id, 'DEPT001'),
            user_gender,
            user_phone,
            'active',
            '{}',
            NOW(),
            NOW()
        );

    ELSIF user_role = 'patient' THEN
        generated_patient_id := 'PAT' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT;

        INSERT INTO public.patients (
            patient_id,
            profile_id,
            full_name,
            dateofbirth,
            gender,
            phone_number,
            address,
            registration_date,
            status,
            created_at,
            updated_at
        )
        VALUES (
            generated_patient_id,
            user_id,
            user_name,
            COALESCE(user_dob::DATE, CURRENT_DATE - INTERVAL '30 years'),
            user_gender,
            user_phone,
            COALESCE(user_address, '{}'),
            CURRENT_DATE,
            'active',
            NOW(),
            NOW()
        );

    ELSIF user_role = 'admin' THEN
        BEGIN
            INSERT INTO public.admins (
                admin_id,
                profile_id,
                full_name,
                phone_number,
                role_level,
                permissions,
                status,
                created_at,
                updated_at
            )
            VALUES (
                'ADM' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT,
                user_id,
                user_name,
                user_phone,
                'standard',
                '{}',
                'active',
                NOW(),
                NOW()
            );
        EXCEPTION WHEN OTHERS THEN
            -- Admin table might not exist, continue without error
            NULL;
        END;
    END IF;

    -- Return success result
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

-- Step 5: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT INSERT, SELECT, UPDATE ON public.profiles TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated, anon;

-- Step 6: Update RLS policies for profiles table
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;

-- Create new RLS policies
CREATE POLICY "Enable insert for authenticated users only" ON public.profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 7: Create a test function to verify trigger
CREATE OR REPLACE FUNCTION public.test_trigger_status()
RETURNS JSON AS $$
DECLARE
    trigger_exists BOOLEAN;
    function_exists BOOLEAN;
    rls_enabled BOOLEAN;
    result JSON;
BEGIN
    -- Check if trigger exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created'
    ) INTO trigger_exists;
    
    -- Check if function exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'handle_new_user'
    ) INTO function_exists;
    
    -- Check if RLS is enabled
    SELECT row_security FROM information_schema.tables 
    WHERE table_name = 'profiles' AND table_schema = 'public'
    INTO rls_enabled;
    
    RETURN json_build_object(
        'trigger_exists', trigger_exists,
        'function_exists', function_exists,
        'rls_enabled', rls_enabled,
        'timestamp', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission for test function
GRANT EXECUTE ON FUNCTION public.test_trigger_status TO authenticated, anon;

-- Step 8: Create logging table for debugging (optional)
CREATE TABLE IF NOT EXISTS public.trigger_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID,
    event_type TEXT,
    message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Grant permissions for logging
GRANT INSERT, SELECT ON public.trigger_logs TO authenticated, anon;
GRANT USAGE, SELECT ON SEQUENCE public.trigger_logs_id_seq TO authenticated, anon;

-- =====================================================
-- VERIFICATION QUERIES
-- Run these to verify the setup:
-- =====================================================

-- 1. Check if trigger exists:
-- SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';

-- 2. Check if function exists:
-- SELECT * FROM information_schema.routines WHERE routine_name = 'handle_new_user';

-- 3. Test the setup:
-- SELECT public.test_trigger_status();

-- 4. Check RLS policies:
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- =====================================================
-- TROUBLESHOOTING NOTES:
-- =====================================================

-- If trigger still doesn't work:
-- 1. Check Supabase logs in Dashboard > Logs
-- 2. Verify auth.users table structure
-- 3. Check if profiles table has all required columns
-- 4. Ensure RLS policies don't block the trigger function
-- 5. Use the RPC function as fallback: SELECT public.create_user_profile(...)

-- Common issues:
-- - Missing columns in profiles table
-- - RLS policies blocking trigger function
-- - Insufficient permissions
-- - Trigger function errors (check logs)
