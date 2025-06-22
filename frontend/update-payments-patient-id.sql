-- Update existing payments with patient_id
-- Chạy script này sau khi tạo profile và patient record

-- 1. Kiểm tra patient record đã tạo chưa
SELECT patient_id, profile_id, full_name 
FROM patients 
WHERE profile_id = '34111382-07b2-40ca-af28-69af7341e594';

-- 2. Cập nhật tất cả payments hiện có với patient_id
-- (Giả sử tất cả payments hiện tại đều thuộc về user này để test)
UPDATE payments 
SET 
    patient_id = 'PAT-001',
    updated_at = NOW()
WHERE patient_id IS NULL;

-- 3. Kiểm tra kết quả
SELECT 
    order_code,
    amount,
    status,
    patient_id,
    created_at
FROM payments 
WHERE patient_id = 'PAT-001'
ORDER BY created_at DESC
LIMIT 10;

-- 4. Thống kê payments theo patient_id
SELECT 
    patient_id,
    COUNT(*) as total_payments,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_payments,
    SUM(amount) FILTER (WHERE status = 'completed') as total_paid
FROM payments 
GROUP BY patient_id
ORDER BY total_payments DESC;
