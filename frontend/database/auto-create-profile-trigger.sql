-- Script tạo trigger tự động tạo hồ sơ người dùng và bệnh nhân khi đăng nhập
-- Chạy trên Supabase SQL Editor

-- 1. Tạo function để tự động tạo hồ sơ
CREATE OR REPLACE FUNCTION public.auto_create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
    profile_exists BOOLEAN;
    patient_exists BOOLEAN;
    new_patient_id TEXT;
BEGIN
    -- Kiểm tra xem người dùng đã có hồ sơ chưa
    SELECT EXISTS (
        SELECT 1 FROM profiles WHERE id = NEW.id
    ) INTO profile_exists;
    
    -- Nếu chưa có, tạo mới hồ sơ
    IF NOT profile_exists THEN
        INSERT INTO profiles (
            id,
            email,
            full_name,
            role,
            updated_at
        ) VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
            'patient',
            NOW()
        );
        
        RAISE NOTICE 'Created profile for user %', NEW.email;
    END IF;
    
    -- Kiểm tra xem người dùng đã có hồ sơ bệnh nhân chưa
    SELECT EXISTS (
        SELECT 1 FROM patients WHERE profile_id = NEW.id
    ) INTO patient_exists;
    
    -- Nếu chưa có, tạo mới hồ sơ bệnh nhân
    IF NOT patient_exists THEN
        -- Tạo ID bệnh nhân mới
        new_patient_id := 'PAT-' || 
                         to_char(NOW(), 'YYYYMM') || '-' || 
                         lpad(floor(random() * 1000)::text, 3, '0');
        
        INSERT INTO patients (
            patient_id,
            full_name,
            profile_id,
            created_at
        ) VALUES (
            new_patient_id,
            COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
            NEW.id,
            NOW()
        );
        
        RAISE NOTICE 'Created patient record with ID % for user %', new_patient_id, NEW.email;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Tạo trigger cho bảng auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_create_user_profile();

-- 3. Tạo trigger cho bảng auth.users khi login
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
    AFTER UPDATE OF last_sign_in_at ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_create_user_profile();

-- 4. Tạo function để tự động đồng bộ thanh toán
CREATE OR REPLACE FUNCTION public.auto_sync_payments_for_user()
RETURNS TRIGGER AS $$
DECLARE
    user_email TEXT;
    patient_record RECORD;
BEGIN
    -- Lấy email của người dùng
    SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;
    
    -- Lấy thông tin bệnh nhân
    SELECT * INTO patient_record FROM patients WHERE profile_id = NEW.id;
    
    -- Nếu có hồ sơ bệnh nhân, đồng bộ các thanh toán
    IF patient_record.patient_id IS NOT NULL THEN
        -- 1. Cập nhật các thanh toán có email trong description
        UPDATE payments
        SET 
            patient_id = patient_record.patient_id,
            updated_at = NOW()
        WHERE 
            description ILIKE '%' || user_email || '%'
            AND (patient_id IS NULL OR patient_id = '');
            
        -- 2. Cập nhật các thanh toán có tên trong description
        IF patient_record.full_name IS NOT NULL AND patient_record.full_name != '' THEN
            UPDATE payments
            SET 
                patient_id = patient_record.patient_id,
                updated_at = NOW()
            WHERE 
                description ILIKE '%' || patient_record.full_name || '%'
                AND (patient_id IS NULL OR patient_id = '');
        END IF;
        
        -- 3. Cập nhật các thanh toán từ mã bệnh nhân cũ PAT-202506-001
        UPDATE payments
        SET 
            patient_id = patient_record.patient_id,
            updated_at = NOW()
        WHERE 
            patient_id = 'PAT-202506-001'
            AND description ILIKE '%' || user_email || '%';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Tạo trigger để đồng bộ thanh toán khi đăng nhập
DROP TRIGGER IF EXISTS on_auth_user_login_sync_payments ON auth.users;
CREATE TRIGGER on_auth_user_login_sync_payments
    AFTER UPDATE OF last_sign_in_at ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_sync_payments_for_user();

-- 6. Tạo function để tự động tạo hồ sơ khi truy cập API
CREATE OR REPLACE FUNCTION public.auto_create_profile_for_api()
RETURNS TRIGGER AS $$
BEGIN
    -- Gọi function tạo hồ sơ
    PERFORM public.auto_create_user_profile();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Tạo API endpoint để tự động tạo hồ sơ
CREATE OR REPLACE FUNCTION public.auto_create_profile_api()
RETURNS json AS $$
DECLARE
    user_id UUID;
    user_email TEXT;
    profile_record RECORD;
    patient_record RECORD;
    result json;
BEGIN
    -- Lấy thông tin người dùng hiện tại
    user_id := auth.uid();
    
    IF user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Không tìm thấy phiên đăng nhập'
        );
    END IF;
    
    -- Lấy email của người dùng
    SELECT email INTO user_email FROM auth.users WHERE id = user_id;
    
    -- Kiểm tra và tạo hồ sơ người dùng
    SELECT * INTO profile_record FROM profiles WHERE id = user_id;
    
    IF profile_record.id IS NULL THEN
        INSERT INTO profiles (
            id,
            email,
            full_name,
            role,
            updated_at
        ) VALUES (
            user_id,
            user_email,
            COALESCE(split_part(user_email, '@', 1), 'Bệnh nhân'),
            'patient',
            NOW()
        )
        RETURNING * INTO profile_record;
    END IF;
    
    -- Kiểm tra và tạo hồ sơ bệnh nhân
    SELECT * INTO patient_record FROM patients WHERE profile_id = user_id;
    
    IF patient_record.patient_id IS NULL THEN
        INSERT INTO patients (
            patient_id,
            full_name,
            profile_id,
            created_at
        ) VALUES (
            'PAT-' || to_char(NOW(), 'YYYYMM') || '-' || lpad(floor(random() * 1000)::text, 3, '0'),
            COALESCE(profile_record.full_name, split_part(user_email, '@', 1)),
            user_id,
            NOW()
        )
        RETURNING * INTO patient_record;
    END IF;
    
    -- Đồng bộ các thanh toán
    -- 1. Cập nhật các thanh toán có email trong description
    UPDATE payments
    SET 
        patient_id = patient_record.patient_id,
        updated_at = NOW()
    WHERE 
        description ILIKE '%' || user_email || '%'
        AND (patient_id IS NULL OR patient_id = '');
        
    -- 2. Cập nhật các thanh toán có tên trong description
    IF profile_record.full_name IS NOT NULL AND profile_record.full_name != '' THEN
        UPDATE payments
        SET 
            patient_id = patient_record.patient_id,
            updated_at = NOW()
        WHERE 
            description ILIKE '%' || profile_record.full_name || '%'
            AND (patient_id IS NULL OR patient_id = '');
    END IF;
    
    -- 3. Cập nhật các thanh toán từ mã bệnh nhân cũ PAT-202506-001
    UPDATE payments
    SET 
        patient_id = patient_record.patient_id,
        updated_at = NOW()
    WHERE 
        patient_id = 'PAT-202506-001'
        AND description ILIKE '%' || user_email || '%';
    
    -- Trả về kết quả
    result := json_build_object(
        'success', true,
        'message', 'Hồ sơ đã được tự động tạo và đồng bộ thanh toán',
        'data', json_build_object(
            'profile', row_to_json(profile_record),
            'patient', row_to_json(patient_record)
        )
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Tạo API endpoint
CREATE OR REPLACE FUNCTION public.auto_profile_api()
RETURNS json AS $$
BEGIN
    RETURN public.auto_create_profile_api();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Tạo RPC endpoint cho API
DROP FUNCTION IF EXISTS auto_profile_rpc();
CREATE OR REPLACE FUNCTION auto_profile_rpc()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT auto_create_profile_api();
$$;

-- 10. Kiểm tra kết quả
SELECT 'Trigger và API đã được tạo thành công' as result; 