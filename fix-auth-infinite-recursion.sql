-- Script sửa lỗi infinite recursion trong RLS policies cho Auth Service
-- Kiểm tra và fix lỗi infinite recursion detected in policy for relation profiles
-- Chạy script này trong Supabase SQL Editor

-- =====================================
-- BƯỚC 1: TẮT RLS TẠM THỜI
-- =====================================
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- =====================================
-- BƯỚC 2: XÓA TẤT CẢ POLICIES CŨ
-- =====================================
-- Xóa tất cả policies có thể gây infinite recursion
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authentication users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile only" ON profiles;
DROP POLICY IF EXISTS "Service role has full access" ON profiles;
DROP POLICY IF EXISTS "Service role full access" ON profiles;
DROP POLICY IF EXISTS "Anon users can read profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update user roles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Service role bypass" ON profiles;

-- =====================================
-- BƯỚC 3: TẠO POLICIES MỚI ĐƠN GIẢN
-- =====================================

-- 1. Policy cho Service Role (Auth Service sử dụng)
-- Cho phép service role truy cập đầy đủ mà không cần điều kiện phức tạp
CREATE POLICY "Service role full access" 
ON profiles FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- 2. Policy cho Authenticated Users đọc profile của chính mình
-- Sử dụng auth.uid() trực tiếp, không có subquery
CREATE POLICY "Users can read own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- 3. Policy cho Authenticated Users cập nhật profile của chính mình
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- 4. Policy cho Insert (đăng ký user mới)
CREATE POLICY "Enable insert for authenticated users" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- =====================================
-- BƯỚC 4: BẬT LẠI RLS
-- =====================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- =====================================
-- BƯỚC 5: TEST QUERIES
-- =====================================
-- Test 1: Đếm tổng số profiles (không nên gây infinite recursion)
SELECT COUNT(*) as total_profiles FROM profiles;

-- Test 2: Kiểm tra policies đã tạo
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles' AND schemaname = 'public'
ORDER BY policyname;

-- =====================================
-- THÔNG TIN KIỂM TRA
-- =====================================
-- Nếu script chạy thành công mà không có lỗi:
-- ✅ Infinite recursion đã được fix
-- ✅ Auth Service có thể hoạt động bình thường với service role
-- ✅ Users có thể đăng ký/đăng nhập thông thường

-- Nếu vẫn có lỗi, có thể tắt RLS hoàn toàn cho development:
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
