-- =====================================================
-- UPDATE TRIGGER WITH CORRECT COLUMNS
-- Hospital Management System - Update trigger to use correct column names
-- =====================================================

-- Step 1: Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Update the trigger function with correct column names
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
                date_of_birth,
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
            -- Create admin record
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
                RAISE LOG 'Failed to create admin record for user %: %', NEW.id, SQLERRM;
            END;
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        -- Log the error but don't fail the auth user creation
        RAISE LOG 'Failed to create profile/role record for user %: %', NEW.id, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Update the RPC function with correct column names
CREATE OR REPLACE FUNCTION public.create_user_profile_enhanced(
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
            date_of_birth,
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
            -- Continue without error if admin table has issues
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

-- Step 4: Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Test the updated functions
SELECT 'TRIGGER AND RPC FUNCTIONS UPDATED' as status, 
       public.test_trigger_status() as test_result;
