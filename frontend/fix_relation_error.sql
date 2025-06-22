-- Script khắc phục lỗi "relation "patients" already exists"
-- Chạy script này trên Supabase SQL Editor

-- 1. Kiểm tra bảng patients đã tồn tại hay chưa và thực hiện tương ứng
DO $$
BEGIN
    -- Kiểm tra xem bảng patients đã tồn tại chưa
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'patients') THEN
        RAISE NOTICE 'Bảng patients đã tồn tại. Bỏ qua việc tạo bảng.';
    ELSE
        -- Tạo bảng patients nếu chưa tồn tại
        CREATE TABLE patients (
            patient_id VARCHAR(255) PRIMARY KEY,
            profile_id UUID NOT NULL REFERENCES profiles(id),
            full_name VARCHAR(255) NOT NULL,
            date_of_birth DATE NOT NULL,
            gender VARCHAR(50) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
            phone VARCHAR(20),
            blood_type VARCHAR(5) CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
            address JSONB,
            emergency_contact JSONB,
            insurance_info JSONB,
            allergies TEXT[],
            chronic_conditions TEXT[],
            status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            created_by UUID
        );
        
        RAISE NOTICE 'Bảng patients đã được tạo thành công.';
    END IF;
END
$$;

-- 2. Thêm cột patient_id vào bảng payments nếu chưa có
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND column_name = 'patient_id'
    ) THEN
        ALTER TABLE payments ADD COLUMN patient_id VARCHAR(255);
        RAISE NOTICE 'Đã thêm cột patient_id vào bảng payments.';
    ELSE
        RAISE NOTICE 'Cột patient_id đã tồn tại trong bảng payments.';
    END IF;
END
$$;

-- 3. Tạo foreign key từ payments đến patients nếu chưa có
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

-- 4. Thêm index cho patient_id trong bảng payments
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
END
$$;

-- 5. Kiểm tra kết quả
SELECT 
    table_name, 
    column_name, 
    data_type
FROM 
    information_schema.columns
WHERE 
    table_name = 'patients' OR
    (table_name = 'payments' AND column_name = 'patient_id')
ORDER BY 
    table_name, 
    ordinal_position; 