-- =====================================================
-- FIX SCHEDULE COLUMN MISMATCH
-- Hospital Management System - Fix schedule vs working_hours column mismatch
-- =====================================================

-- This script fixes the mismatch between:
-- - Database schema using 'working_hours' column
-- - Code using 'schedule' field

-- Step 1: Check current column structure
SELECT 
    'CURRENT DOCTORS TABLE STRUCTURE' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'doctors' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Drop existing triggers and functions that use 'schedule'
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.create_user_profile(UUID, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_user_profile_enhanced(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

-- Step 3: Create updated trigger function using 'working_hours'
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
    generated_doctor_id TEXT;
    generated_patient_id TEXT;
    generated_admin_id TEXT;
BEGIN
    -- Extract metadata from raw_user_meta_data
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
    user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown User');
    user_phone := COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone_number', '0000000000');
    user_gender := COALESCE(NEW.raw_user_meta_data->>'gender', 'other');
    user_specialty := NEW.raw_user_meta_data->>'specialty';
    user_license := NEW.raw_user_meta_data->>'license_number';
    user_qualification := NEW.raw_user_meta_data->>'qualification';
    user_department_id := NEW.raw_user_meta_data->>'department_id';

    RAISE LOG 'Creating profile for user: %, role: %', NEW.id, user_role;

    -- Create profile record
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        phone_number,
        role,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        user_name,
        user_phone,
        user_role,
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
            working_hours,
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
        generated_patient_id := 'PAT' || LPAD(NEXTVAL('patient_id_seq')::TEXT, 6, '0');

        INSERT INTO public.patients (
            patient_id,
            profile_id,
            full_name,
            gender,
            status,
            created_at,
            updated_at
        )
        VALUES (
            generated_patient_id,
            NEW.id,
            user_name,
            user_gender,
            'active',
            NOW(),
            NOW()
        );

        RAISE LOG 'Patient record created for user: %', NEW.id;

    ELSIF user_role = 'admin' THEN
        -- Generate admin ID
        generated_admin_id := 'ADM' || LPAD(NEXTVAL('admin_id_seq')::TEXT, 6, '0');

        INSERT INTO public.admins (
            admin_id,
            profile_id,
            full_name,
            status,
            created_at,
            updated_at
        )
        VALUES (
            generated_admin_id,
            NEW.id,
            user_name,
            'active',
            NOW(),
            NOW()
        );

        RAISE LOG 'Admin record created for user: %', NEW.id;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW; -- Don't fail auth, just log the error
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create updated RPC function using 'working_hours'
CREATE OR REPLACE FUNCTION public.create_user_profile(
    user_id UUID,
    user_email TEXT,
    user_name TEXT,
    user_phone TEXT,
    user_role TEXT DEFAULT 'patient',
    user_gender TEXT DEFAULT 'other',
    user_specialty TEXT DEFAULT NULL,
    user_license TEXT DEFAULT NULL,
    user_qualification TEXT DEFAULT NULL,
    user_department_id TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    new_profile RECORD;
    generated_doctor_id TEXT;
    generated_patient_id TEXT;
    generated_admin_id TEXT;
BEGIN
    -- Create profile
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        phone_number,
        role,
        created_at,
        updated_at
    )
    VALUES (
        user_id,
        user_email,
        user_name,
        user_phone,
        user_role,
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
            working_hours,
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
        generated_patient_id := 'PAT' || LPAD(NEXTVAL('patient_id_seq')::TEXT, 6, '0');

        INSERT INTO public.patients (
            patient_id,
            profile_id,
            full_name,
            gender,
            status,
            created_at,
            updated_at
        )
        VALUES (
            generated_patient_id,
            user_id,
            user_name,
            user_gender,
            'active',
            NOW(),
            NOW()
        );

    ELSIF user_role = 'admin' THEN
        generated_admin_id := 'ADM' || LPAD(NEXTVAL('admin_id_seq')::TEXT, 6, '0');

        INSERT INTO public.admins (
            admin_id,
            profile_id,
            full_name,
            status,
            created_at,
            updated_at
        )
        VALUES (
            generated_admin_id,
            user_id,
            user_name,
            'active',
            NOW(),
            NOW()
        );
    END IF;

    RETURN json_build_object(
        'success', true,
        'profile', row_to_json(new_profile),
        'role_id', CASE 
            WHEN user_role = 'doctor' THEN generated_doctor_id
            WHEN user_role = 'patient' THEN generated_patient_id
            WHEN user_role = 'admin' THEN generated_admin_id
            ELSE NULL
        END
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Grant permissions
GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated, anon;

-- Step 7: Verify the fix
SELECT 'TRIGGER AND FUNCTION UPDATED' as status, NOW() as timestamp;
