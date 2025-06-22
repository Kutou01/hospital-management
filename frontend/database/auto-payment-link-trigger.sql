-- Script tạo trigger tự động liên kết thanh toán với bệnh nhân
-- Chạy trên Supabase SQL Editor

-- 1. Tạo function để tự động cập nhật patient_id
CREATE OR REPLACE FUNCTION auto_link_payment_to_patient()
RETURNS TRIGGER AS $$
BEGIN
    -- Nếu payment đã có patient_id, không làm gì cả
    IF NEW.patient_id IS NOT NULL AND NEW.patient_id != '' THEN
        RETURN NEW;
    END IF;
    
    -- Nếu có record_id, tìm patient_id từ medical_records
    IF NEW.record_id IS NOT NULL AND NEW.record_id != '' THEN
        UPDATE payments
        SET 
            patient_id = mr.patient_id,
            updated_at = NOW()
        FROM 
            medical_records mr
        WHERE 
            payments.id = NEW.id
            AND mr.record_id = NEW.record_id;
            
        RETURN NEW;
    END IF;
    
    -- Nếu không có record_id, thử tìm từ description
    -- Tìm email trong description
    DECLARE
        found_patient_id VARCHAR;
        email_pattern VARCHAR;
        profile_id UUID;
    BEGIN
        -- Tìm email trong description
        SELECT 
            p.patient_id INTO found_patient_id
        FROM 
            profiles pr
        JOIN 
            patients p ON pr.id = p.profile_id
        WHERE 
            NEW.description ILIKE '%' || pr.email || '%'
        LIMIT 1;
        
        -- Nếu tìm thấy, cập nhật patient_id
        IF found_patient_id IS NOT NULL THEN
            UPDATE payments
            SET 
                patient_id = found_patient_id,
                updated_at = NOW()
            WHERE 
                id = NEW.id;
                
            RETURN NEW;
        END IF;
        
        -- Tìm theo số điện thoại trong description
        SELECT 
            p.patient_id INTO found_patient_id
        FROM 
            profiles pr
        JOIN 
            patients p ON pr.id = p.profile_id
        WHERE 
            pr.phone_number IS NOT NULL 
            AND pr.phone_number != ''
            AND NEW.description ILIKE '%' || pr.phone_number || '%'
        LIMIT 1;
        
        -- Nếu tìm thấy, cập nhật patient_id
        IF found_patient_id IS NOT NULL THEN
            UPDATE payments
            SET 
                patient_id = found_patient_id,
                updated_at = NOW()
            WHERE 
                id = NEW.id;
                
            RETURN NEW;
        END IF;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Tạo trigger cho việc thêm mới payment
DROP TRIGGER IF EXISTS auto_link_payment_trigger ON payments;
CREATE TRIGGER auto_link_payment_trigger
AFTER INSERT ON payments
FOR EACH ROW
EXECUTE FUNCTION auto_link_payment_to_patient();

-- 3. Tạo trigger cho việc cập nhật payment
DROP TRIGGER IF EXISTS auto_link_payment_update_trigger ON payments;
CREATE TRIGGER auto_link_payment_update_trigger
AFTER UPDATE OF status ON payments
FOR EACH ROW
WHEN (NEW.status = 'completed' AND (NEW.patient_id IS NULL OR NEW.patient_id = ''))
EXECUTE FUNCTION auto_link_payment_to_patient();

-- 4. Chạy thử nghiệm với một payment mới để kiểm tra trigger
DO $$
DECLARE
    test_payment_id UUID;
BEGIN
    -- Tạo payment thử nghiệm
    INSERT INTO payments (
        order_code, 
        amount, 
        description, 
        status, 
        payment_method
    ) VALUES (
        'TEST-' || NOW()::TEXT, 
        100000, 
        'Test payment for namprophunong006@gmail.com', 
        'completed', 
        'Test'
    ) RETURNING id INTO test_payment_id;
    
    -- Kiểm tra kết quả
    RAISE NOTICE 'Test payment created with ID: %', test_payment_id;
    
    -- Xóa payment thử nghiệm
    DELETE FROM payments WHERE id = test_payment_id;
    RAISE NOTICE 'Test payment deleted';
END $$;

-- 5. Kiểm tra số lượng thanh toán chưa liên kết
SELECT 
    'Unlinked payments' as info,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_count
FROM 
    payments
WHERE 
    patient_id IS NULL OR patient_id = ''; 