-- Thêm unique constraint cho order_code để tránh trùng lặp
-- Chạy script này trên Supabase SQL Editor

-- 1. Xóa các bản ghi trùng lặp (giữ lại bản ghi mới nhất)
WITH duplicates AS (
    SELECT 
        id,
        order_code,
        ROW_NUMBER() OVER (
            PARTITION BY order_code 
            ORDER BY created_at DESC, id DESC
        ) as rn
    FROM payments 
    WHERE order_code IS NOT NULL
)
DELETE FROM payments 
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- 2. Thêm unique constraint cho order_code
ALTER TABLE payments 
ADD CONSTRAINT payments_order_code_unique 
UNIQUE (order_code);

-- 3. Tạo index để tăng tốc độ query
CREATE INDEX IF NOT EXISTS idx_payments_order_code 
ON payments (order_code);

-- 4. Tạo index cho status để tăng tốc độ filter
CREATE INDEX IF NOT EXISTS idx_payments_status 
ON payments (status);

-- 5. Tạo index composite cho các query thường dùng
CREATE INDEX IF NOT EXISTS idx_payments_status_created_at 
ON payments (status, created_at DESC);

-- Kiểm tra kết quả
SELECT 
    COUNT(*) as total_payments,
    COUNT(DISTINCT order_code) as unique_order_codes,
    COUNT(*) - COUNT(DISTINCT order_code) as duplicates_removed
FROM payments;
