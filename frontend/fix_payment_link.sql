-- Script cập nhật liên kết giữa thanh toán và bệnh nhân
-- Chạy trên Supabase SQL Editor

-- 1. Tạo foreign key từ payments.patient_id đến patients.patient_id nếu chưa có
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'payments' 
        AND ccu.column_name = 'patient_id'
    ) THEN
        -- Thêm foreign key constraint
        ALTER TABLE payments 
        ADD CONSTRAINT fk_payments_patient_id 
        FOREIGN KEY (patient_id) 
        REFERENCES patients(patient_id) 
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Đã tạo foreign key constraint từ payments.patient_id đến patients.patient_id.';
    ELSE
        RAISE NOTICE 'Foreign key constraint từ payments đến patients đã tồn tại.';
    END IF;
END
$$;

-- 2. Tạo bảng tạm để lưu thông tin liên kết email và patient_id
CREATE TEMP TABLE temp_patient_emails AS
SELECT 
    p.patient_id,
    pr.email
FROM 
    patients p
JOIN 
    profiles pr ON p.profile_id = pr.id;

-- 3. Cập nhật patient_id cho các payment dựa trên email
UPDATE payments pm
SET 
    patient_id = tpe.patient_id,
    updated_at = NOW()
FROM 
    temp_patient_emails tpe
WHERE 
    pm.payment_email = tpe.email
    AND (pm.patient_id IS NULL OR pm.patient_id = '');

-- 4. Thêm index cho patient_id và payment_email trong bảng payments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'payments' 
        AND indexname = 'idx_payments_patient_id'
    ) THEN
        CREATE INDEX idx_payments_patient_id ON payments(patient_id);
        RAISE NOTICE 'Đã tạo index cho cột patient_id trong bảng payments.';
    ELSE
        RAISE NOTICE 'Index cho patient_id đã tồn tại.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'payments' 
        AND indexname = 'idx_payments_payment_email'
    ) THEN
        CREATE INDEX idx_payments_payment_email ON payments(payment_email);
        RAISE NOTICE 'Đã tạo index cho cột payment_email trong bảng payments.';
    ELSE
        RAISE NOTICE 'Index cho payment_email đã tồn tại.';
    END IF;
END
$$;

-- 5. Thống kê kết quả sau khi cập nhật
SELECT 
    CASE 
        WHEN patient_id IS NOT NULL THEN 'Có patient_id'
        ELSE 'Không có patient_id'
    END as payment_status,
    COUNT(*) as total_payments,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_payments,
    SUM(amount) FILTER (WHERE status = 'completed') as total_paid
FROM 
    payments 
GROUP BY 
    CASE 
        WHEN patient_id IS NOT NULL THEN 'Có patient_id'
        ELSE 'Không có patient_id'
    END
ORDER BY 
    payment_status; 