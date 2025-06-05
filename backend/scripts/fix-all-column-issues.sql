-- =====================================================
-- FIX ALL COLUMN ISSUES
-- Hospital Management System - Complete fix for all column mismatches
-- =====================================================

-- Step 1: Check current table structure
SELECT 
    'CURRENT DOCTORS TABLE STRUCTURE' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'doctors' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Add missing columns to doctors table
-- Add phone_number column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'doctors' AND column_name = 'phone_number' AND table_schema = 'public') THEN
        ALTER TABLE public.doctors ADD COLUMN phone_number VARCHAR(20);
        RAISE NOTICE 'Added phone_number column to doctors table';
    ELSE
        RAISE NOTICE 'phone_number column already exists in doctors table';
    END IF;
END $$;

-- Add working_hours column if it doesn't exist (should replace schedule)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'doctors' AND column_name = 'working_hours' AND table_schema = 'public') THEN
        ALTER TABLE public.doctors ADD COLUMN working_hours JSONB DEFAULT '{}';
        RAISE NOTICE 'Added working_hours column to doctors table';
    ELSE
        RAISE NOTICE 'working_hours column already exists in doctors table';
    END IF;
END $$;

-- Add other potentially missing columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'doctors' AND column_name = 'full_name' AND table_schema = 'public') THEN
        ALTER TABLE public.doctors ADD COLUMN full_name VARCHAR(255);
        RAISE NOTICE 'Added full_name column to doctors table';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'doctors' AND column_name = 'gender' AND table_schema = 'public') THEN
        ALTER TABLE public.doctors ADD COLUMN gender VARCHAR(20) DEFAULT 'other';
        RAISE NOTICE 'Added gender column to doctors table';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'doctors' AND column_name = 'status' AND table_schema = 'public') THEN
        ALTER TABLE public.doctors ADD COLUMN status VARCHAR(20) DEFAULT 'active';
        RAISE NOTICE 'Added status column to doctors table';
    END IF;
END $$;

-- Step 3: Create sequences if they don't exist
CREATE SEQUENCE IF NOT EXISTS doctor_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS patient_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS admin_id_seq START 1;

-- Step 4: Drop existing functions and triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.create_user_profile(UUID, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_user_profile(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

-- Step 5: Create the RPC function for manual profile creation
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

-- Step 6: Grant permissions
GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated, anon;

-- Step 7: Show final table structure
SELECT 
    'FINAL DOCTORS TABLE STRUCTURE' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'doctors' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'SETUP COMPLETED SUCCESSFULLY' as status, NOW() as timestamp;
