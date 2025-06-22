-- Script liên kết payments với patients thông qua medical_records
-- Chạy trên Supabase SQL Editor

-- 1. Tạo foreign key từ payments.patient_id đến patients.patient_id (nếu chưa có)
DO $
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_payments_patient_id'
        AND table_name = 'payments'
    ) THEN
        ALTER TABLE payments 
        ADD CONSTRAINT fk_payments_patient_id 
        FOREIGN KEY (patient_id) 
        REFERENCES patients(patient_id) 
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Đã tạo foreign key constraint fk_payments_patient_id';
    ELSE
        RAISE NOTICE 'Foreign key constraint fk_payments_patient_id đã tồn tại';
    END IF;
END $;

-- 2. Kiểm tra sample data từ medical_records với record_id
SELECT 
    'Sample medical_records data' as info,
    record_id,
    patient_id,
    doctor_id,
    visit_date,
    created_at
FROM medical_records 
ORDER BY created_at DESC
LIMIT 5;

-- 3. Cập nhật patient_id cho payments chưa có, thông qua medical_records
UPDATE payments p
SET 
    patient_id = mr.patient_id,
    updated_at = NOW()
FROM 
    medical_records mr
WHERE 
    p.record_id = mr.record_id
    AND (p.patient_id IS NULL OR p.patient_id = '');

-- 4. Tạo các index quan trọng (nếu chưa có)
DO $
BEGIN
    -- Index cho payments.patient_id
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_patient_id') THEN
        CREATE INDEX idx_payments_patient_id ON payments(patient_id);
        RAISE NOTICE 'Đã tạo index idx_payments_patient_id';
    ELSE
        RAISE NOTICE 'Index idx_payments_patient_id đã tồn tại';
    END IF;

    -- Index cho payments.record_id
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_record_id') THEN
        CREATE INDEX idx_payments_record_id ON payments(record_id);
        RAISE NOTICE 'Đã tạo index idx_payments_record_id';
    ELSE
        RAISE NOTICE 'Index idx_payments_record_id đã tồn tại';
    END IF;

    -- Index cho payments.doctor_id
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_doctor_id') THEN
        CREATE INDEX idx_payments_doctor_id ON payments(doctor_id);
        RAISE NOTICE 'Đã tạo index idx_payments_doctor_id';
    ELSE
        RAISE NOTICE 'Index idx_payments_doctor_id đã tồn tại';
    END IF;

    -- Index cho medical_records.record_id
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_medical_records_record_id') THEN
        CREATE INDEX idx_medical_records_record_id ON medical_records(record_id);
        RAISE NOTICE 'Đã tạo index idx_medical_records_record_id';
    ELSE
        RAISE NOTICE 'Index idx_medical_records_record_id đã tồn tại';
    END IF;
END $;

-- 5. Kiểm tra tính nhất quán dữ liệu
SELECT 
    'Data consistency check' as info,
    p.record_id,
    p.patient_id as payment_patient_id,
    mr.patient_id as medical_record_patient_id,
    p.doctor_id as payment_doctor_id,
    mr.doctor_id as medical_record_doctor_id,
    CASE 
        WHEN p.patient_id = mr.patient_id AND p.doctor_id = mr.doctor_id THEN 'Fully Consistent'
        WHEN p.patient_id = mr.patient_id THEN 'Patient ID Consistent'
        WHEN p.patient_id != mr.patient_id THEN 'Inconsistent'
        ELSE 'No medical record found'
    END as consistency_status
FROM payments p
LEFT JOIN medical_records mr ON p.record_id = mr.record_id
WHERE p.patient_id IS NOT NULL
LIMIT 10;

-- 6. Thống kê kết quả liên kết
SELECT 
    'Payment linking summary' as summary,
    COUNT(*) as total_payments,
    COUNT(*) FILTER (WHERE patient_id IS NOT NULL AND patient_id != '') as payments_with_patient_id,
    COUNT(*) FILTER (WHERE record_id IS NOT NULL AND record_id != '') as payments_with_record_id,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE patient_id IS NOT NULL AND patient_id != '') / COUNT(*), 
        2
    ) as percentage_linked_to_patients,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE record_id IS NOT NULL AND record_id != '') / COUNT(*), 
        2
    ) as percentage_with_medical_records
FROM payments;

-- 7. Chi tiết theo trạng thái thanh toán và liên kết
SELECT 
    CASE 
        WHEN patient_id IS NOT NULL AND patient_id != '' THEN 'Có patient_id'
        ELSE 'Không có patient_id'
    END as linking_status,
    status,
    COUNT(*) as count,
    SUM(amount) as total_amount,
    ROUND(AVG(amount), 2) as avg_amount
FROM payments 
GROUP BY 
    CASE 
        WHEN patient_id IS NOT NULL AND patient_id != '' THEN 'Có patient_id'
        ELSE 'Không có patient_id'
    END,
    status
ORDER BY linking_status, status;

-- 8. Kiểm tra payments có record_id nhưng không tìm thấy trong medical_records
SELECT 
    'Orphaned payments (có record_id nhưng không có medical_record)' as info,
    COUNT(*) as count,
    string_agg(DISTINCT p.record_id, ', ') as sample_orphaned_record_ids
FROM payments p
LEFT JOIN medical_records mr ON p.record_id = mr.record_id
WHERE p.record_id IS NOT NULL 
AND p.record_id != ''
AND mr.record_id IS NULL;

-- 9. Payments thành công theo bệnh nhân
SELECT 
    p.patient_id,
    pt.full_name,
    COUNT(*) as total_payments,
    COUNT(*) FILTER (WHERE p.status = 'completed') as completed_payments,
    SUM(p.amount) FILTER (WHERE p.status = 'completed') as total_paid,
    MAX(p.created_at) as last_payment_date
FROM payments p
LEFT JOIN patients pt ON p.patient_id = pt.patient_id
WHERE p.patient_id IS NOT NULL AND p.patient_id != ''
GROUP BY p.patient_id, pt.full_name
ORDER BY total_paid DESC; 