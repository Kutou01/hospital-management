-- Script sửa lỗi infinite recursion trong RLS policies cho bảng profiles
-- Chạy script này trong Supabase SQL Editor

-- 1. Tắt RLS tạm thời để xóa các policies cũ
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Xóa tất cả policies cũ có thể gây lỗi recursion
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authentication users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role has full access" ON profiles;
DROP POLICY IF EXISTS "Anon users can read profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile only" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- 3. Tạo policies mới KHÔNG có recursion
-- Policy cho phép đọc profile của chính mình (dùng auth.uid() thay vì subquery)
CREATE POLICY "Users can read own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Policy cho phép cập nhật profile của chính mình
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Policy cho phép service role truy cập đầy đủ (cho backend)
CREATE POLICY "Service role full access" 
ON profiles FOR ALL 
USING (auth.jwt()->>'role' = 'service_role');

-- Policy cho phép tạo profile khi đăng ký (chỉ cho authenticated users)
CREATE POLICY "Enable insert for authenticated users" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Policy cho phép anon users đọc một số thông tin cơ bản (optional)
-- Tạm thời comment để tránh lỗi
-- CREATE POLICY "Public profiles are viewable by everyone" 
-- ON profiles FOR SELECT 
-- USING (true);

-- 4. Bật lại RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. Test query đơn giản
SELECT COUNT(*) FROM profiles;

-- Nếu vẫn lỗi, chạy lệnh sau để tắt RLS hoàn toàn (CHỈ CHO DEVELOPMENT):
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
