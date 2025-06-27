-- ============================================================================
-- KIỂM TRA CẤU TRÚC BẢNG APPOINTMENTS
-- ============================================================================

-- Kiểm tra cấu trúc bảng appointments trong schema public
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'appointments'
ORDER BY ordinal_position;

-- Kiểm tra dữ liệu mẫu
SELECT * FROM public.appointments LIMIT 3;
