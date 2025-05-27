-- Insert additional departments to match specialization mapping
-- This script adds departments that may be missing from the current database

-- Insert departments if they don't exist
INSERT INTO departments (department_id, name, description, is_active) VALUES
('DEPT001', 'Khoa Nội', 'Khoa Nội tổng hợp - điều trị các bệnh lý nội khoa', true),
('DEPT002', 'Khoa Ngoại', 'Khoa Phẫu thuật tổng hợp', true),
('DEPT003', 'Khoa Sản', 'Khoa Sản phụ khoa', true),
('DEPT004', 'Khoa Nhi', 'Khoa Nhi - điều trị trẻ em', true),
('DEPT005', 'Khoa Tim mạch', 'Khoa Tim mạch can thiệp', true),
('DEPT006', 'Khoa Thần kinh', 'Khoa Thần kinh học', true),
('DEPT007', 'Khoa Chấn thương chỉnh hình', 'Khoa Chấn thương và chỉnh hình', true),
('DEPT008', 'Khoa Cấp cứu', 'Khoa Cấp cứu và hồi sức', true),
('DEPT009', 'Khoa Da liễu', 'Khoa Da liễu', true),
('DEPT010', 'Khoa Mắt', 'Khoa Mắt', true),
('DEPT011', 'Khoa Tai mũi họng', 'Khoa Tai mũi họng', true),
('DEPT012', 'Khoa Răng hàm mặt', 'Khoa Răng hàm mặt', true)
ON CONFLICT (department_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- Verify the departments were inserted
SELECT department_id, name, description, is_active 
FROM departments 
WHERE department_id IN ('DEPT001', 'DEPT002', 'DEPT003', 'DEPT004', 'DEPT005', 'DEPT006', 'DEPT007', 'DEPT008', 'DEPT009', 'DEPT010', 'DEPT011', 'DEPT012')
ORDER BY department_id;
