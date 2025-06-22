-- Script kiểm tra chi tiết các thanh toán chưa được liên kết
-- Chạy trên Supabase SQL Editor

-- 1. Xem chi tiết các thanh toán chưa liên kết
SELECT 
    'Unlinked payments details' as info,
    id,
    order_code,
    amount,
    description,
    status,
    payment_method,
    record_id,
    created_at,
    updated_at,
    paid_at
FROM 
    payments
WHERE 
    (patient_id IS NULL OR patient_id = '')
    AND status = 'completed'
ORDER BY 
    created_at DESC;

-- 2. Kiểm tra xem có thể liên kết qua medical_records không
SELECT 
    'Potential links through medical_records' as info,
    p.id as payment_id,
    p.order_code,
    p.record_id,
    mr.patient_id as potential_patient_id,
    mr.visit_date
FROM 
    payments p
JOIN 
    medical_records mr ON p.record_id = mr.record_id
WHERE 
    (p.patient_id IS NULL OR p.patient_id = '')
    AND p.status = 'completed';

-- 3. Kiểm tra xem có thể liên kết qua email trong description không
WITH unlinked_payments AS (
    SELECT 
        id,
        order_code,
        description
    FROM 
        payments
    WHERE 
        (patient_id IS NULL OR patient_id = '')
        AND status = 'completed'
),
potential_matches AS (
    SELECT 
        up.id as payment_id,
        up.order_code,
        up.description,
        pr.email,
        p.patient_id,
        p.full_name
    FROM 
        unlinked_payments up
    CROSS JOIN 
        profiles pr
    JOIN 
        patients p ON pr.id = p.profile_id
    WHERE 
        pr.email IS NOT NULL
        AND pr.email != ''
        AND up.description ILIKE '%' || pr.email || '%'
)
SELECT 
    'Potential links through email in description' as info,
    *
FROM 
    potential_matches;

-- 4. Kiểm tra xem có thể liên kết qua số điện thoại trong description không
WITH unlinked_payments AS (
    SELECT 
        id,
        order_code,
        description
    FROM 
        payments
    WHERE 
        (patient_id IS NULL OR patient_id = '')
        AND status = 'completed'
),
potential_matches AS (
    SELECT 
        up.id as payment_id,
        up.order_code,
        up.description,
        pr.phone_number,
        p.patient_id,
        p.full_name
    FROM 
        unlinked_payments up
    CROSS JOIN 
        profiles pr
    JOIN 
        patients p ON pr.id = p.profile_id
    WHERE 
        pr.phone_number IS NOT NULL
        AND pr.phone_number != ''
        AND up.description ILIKE '%' || pr.phone_number || '%'
)
SELECT 
    'Potential links through phone number in description' as info,
    *
FROM 
    potential_matches;

-- 5. Liên kết thủ công các thanh toán còn lại (cần điều chỉnh patient_id tùy theo kết quả kiểm tra)
/*
UPDATE payments
SET 
    patient_id = 'PATIENT_ID_HERE',  -- Thay thế bằng patient_id thực tế
    updated_at = NOW()
WHERE 
    id = 'PAYMENT_ID_HERE';  -- Thay thế bằng payment_id thực tế
*/ 