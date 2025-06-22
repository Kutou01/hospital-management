-- Script khắc phục lỗi đồng bộ thanh toán cho bệnh nhân cụ thể
-- Chạy trên Supabase SQL Editor

-- 1. Kiểm tra thông tin bệnh nhân theo email
WITH patient_info AS (
    SELECT 
        p.patient_id,
        p.full_name,
        pr.email,
        pr.id as profile_id
    FROM 
        patients p
    JOIN 
        profiles pr ON p.profile_id = pr.id
    WHERE 
        pr.email = 'namprophunong006@gmail.com'
)
SELECT 
    'Patient information' as info,
    *
FROM 
    patient_info;

-- 2. Kiểm tra các thanh toán liên quan đến email này
WITH patient_info AS (
    SELECT 
        p.patient_id,
        p.full_name,
        pr.email,
        pr.id as profile_id
    FROM 
        patients p
    JOIN 
        profiles pr ON p.profile_id = pr.id
    WHERE 
        pr.email = 'namprophunong006@gmail.com'
),
related_payments AS (
    SELECT 
        pay.*,
        CASE 
            WHEN pay.patient_id = pi.patient_id THEN 'Correct patient ID'
            WHEN pay.patient_id = 'PAT-202506-001' THEN 'Old patient ID'
            WHEN pay.patient_id IS NULL THEN 'Missing patient ID'
            ELSE 'Different patient ID'
        END as status
    FROM 
        payments pay
    CROSS JOIN patient_info pi
    WHERE 
        pay.description ILIKE '%namprophunong006@gmail.com%'
        OR pay.patient_id = pi.patient_id
        OR pay.patient_id = 'PAT-202506-001'
)
SELECT 
    'Related payments' as info,
    id,
    order_code,
    amount,
    status,
    patient_id,
    description,
    created_at
FROM 
    related_payments
ORDER BY 
    created_at DESC;

-- 3. Cập nhật tất cả thanh toán liên quan đến email này
WITH patient_info AS (
    SELECT 
        p.patient_id
    FROM 
        patients p
    JOIN 
        profiles pr ON p.profile_id = pr.id
    WHERE 
        pr.email = 'namprophunong006@gmail.com'
)
UPDATE payments pay
SET 
    patient_id = pi.patient_id,
    updated_at = NOW()
FROM 
    patient_info pi
WHERE 
    pay.description ILIKE '%namprophunong006@gmail.com%'
    AND (pay.patient_id IS NULL OR pay.patient_id = 'PAT-202506-001');

-- 4. Kiểm tra các thanh toán có record_id liên quan đến bệnh nhân này
WITH patient_info AS (
    SELECT 
        p.patient_id
    FROM 
        patients p
    JOIN 
        profiles pr ON p.profile_id = pr.id
    WHERE 
        pr.email = 'namprophunong006@gmail.com'
),
medical_records_for_patient AS (
    SELECT 
        record_id
    FROM 
        medical_records mr
    JOIN 
        patient_info pi ON mr.patient_id = pi.patient_id
)
UPDATE payments pay
SET 
    patient_id = pi.patient_id,
    updated_at = NOW()
FROM 
    patient_info pi, medical_records_for_patient mr
WHERE 
    pay.record_id = mr.record_id
    AND (pay.patient_id IS NULL OR pay.patient_id != pi.patient_id);

-- 5. Kiểm tra kết quả sau khi cập nhật
WITH patient_info AS (
    SELECT 
        p.patient_id,
        p.full_name,
        pr.email,
        pr.id as profile_id
    FROM 
        patients p
    JOIN 
        profiles pr ON p.profile_id = pr.id
    WHERE 
        pr.email = 'namprophunong006@gmail.com'
)
SELECT 
    'Payment history after update' as info,
    pay.id,
    pay.order_code,
    pay.amount,
    pay.status,
    pay.patient_id,
    pay.description,
    pay.created_at
FROM 
    payments pay
JOIN 
    patient_info pi ON pay.patient_id = pi.patient_id
ORDER BY 
    pay.created_at DESC;

-- 6. Thống kê số lượng thanh toán đã cập nhật
WITH patient_info AS (
    SELECT 
        p.patient_id
    FROM 
        patients p
    JOIN 
        profiles pr ON p.profile_id = pr.id
    WHERE 
        pr.email = 'namprophunong006@gmail.com'
)
SELECT 
    'Payment statistics' as info,
    COUNT(*) as total_payments,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_payments,
    SUM(amount) FILTER (WHERE status = 'completed') as total_paid_amount,
    MAX(created_at) as latest_payment_date
FROM 
    payments
JOIN 
    patient_info pi ON patient_id = pi.patient_id; 