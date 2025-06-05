# 🔧 Hướng dẫn khắc phục Trigger Supabase

## 📋 Tổng quan vấn đề

Trigger trên Supabase không hoạt động có thể do nhiều nguyên nhân khác nhau. Hướng dẫn này sẽ giúp bạn chẩn đoán và khắc phục từng vấn đề cụ thể.

## 🔍 Bước 1: Chẩn đoán vấn đề

### 1.1 Chạy script chẩn đoán
```sql
-- Chạy trong Supabase SQL Editor
\i backend/scripts/diagnose-trigger-issues.sql
```

### 1.2 Kiểm tra kết quả
Xem output để xác định vấn đề cụ thể:
- ✅ Trigger tồn tại
- ✅ Function tồn tại  
- ✅ RLS policies đúng
- ✅ Permissions đầy đủ

## 🛠️ Bước 2: Khắc phục vấn đề

### 2.1 Nếu trigger không tồn tại
```sql
-- Chạy script khắc phục hoàn chỉnh
\i backend/scripts/complete-trigger-solution.sql
```

### 2.2 Nếu trigger tồn tại nhưng không hoạt động

#### Kiểm tra logs Supabase:
1. Vào Supabase Dashboard
2. Chọn project của bạn
3. Vào **Logs** > **Database**
4. Tìm kiếm lỗi liên quan đến trigger

#### Các lỗi thường gặp:

**Lỗi 1: Column không tồn tại**
```sql
-- Kiểm tra cấu trúc bảng profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- Thêm column thiếu nếu cần
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_data JSONB;
```

**Lỗi 2: RLS chặn trigger**
```sql
-- Tạo policy cho phép trigger insert
CREATE POLICY "Allow trigger insert" ON public.profiles
    FOR INSERT WITH CHECK (true);
```

**Lỗi 3: Thiếu permissions**
```sql
-- Cấp quyền cần thiết
GRANT INSERT, SELECT, UPDATE ON public.profiles TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user TO authenticated, anon;
```

## 🧪 Bước 3: Test trigger

### 3.1 Test bằng RPC function
```sql
-- Test RPC function trước
SELECT public.create_user_profile(
    gen_random_uuid(),
    'test@example.com',
    'Test User',
    '0123456789',
    'patient'
);
```

### 3.2 Test trigger thực tế
```javascript
// Trong frontend, test đăng ký user mới
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'password123',
  options: {
    data: {
      full_name: 'Test User',
      phone_number: '0123456789',
      role: 'patient'
    }
  }
});
```

### 3.3 Kiểm tra kết quả
```sql
-- Kiểm tra user được tạo trong auth.users
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'test@example.com';

-- Kiểm tra profile được tạo
SELECT id, email, full_name, role 
FROM public.profiles 
WHERE email = 'test@example.com';
```

## 🔄 Bước 4: Fallback solutions

Nếu trigger vẫn không hoạt động, hệ thống đã có sẵn 3 phương pháp fallback:

### 4.1 Method 1: Trigger (tự động)
- Trigger tự động tạo profile khi user đăng ký
- Ưu tiên cao nhất

### 4.2 Method 2: RPC Function
- Gọi function `create_user_profile` thủ công
- Fallback khi trigger không hoạt động

### 4.3 Method 3: Direct Insert
- Insert trực tiếp vào bảng profiles
- Fallback cuối cùng

## 📊 Bước 5: Monitoring

### 5.1 Kiểm tra status trigger
```sql
-- Chạy function test status
SELECT public.test_trigger_status();
```

### 5.2 Monitor logs
```sql
-- Xem logs trigger (nếu có)
SELECT * FROM public.trigger_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

### 5.3 Kiểm tra thống kê
```sql
-- Thống kê users vs profiles
SELECT 
    'auth.users' as table_name,
    COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
    'public.profiles' as table_name,
    COUNT(*) as count
FROM public.profiles;
```

## ⚠️ Các vấn đề thường gặp

### 1. Trigger không được kích hoạt
**Nguyên nhân**: Trigger bị disable hoặc không tồn tại
**Giải pháp**: Chạy lại script `complete-trigger-solution.sql`

### 2. Function lỗi runtime
**Nguyên nhân**: Column không khớp, RLS chặn
**Giải pháp**: Kiểm tra logs, sửa function

### 3. Permissions không đủ
**Nguyên nhân**: Role không có quyền insert
**Giải pháp**: Grant permissions cho authenticated/anon

### 4. RLS policies quá strict
**Nguyên nhân**: Policies chặn trigger function
**Giải pháp**: Tạo policy đặc biệt cho trigger

## 🎯 Kết luận

Hệ thống đã được thiết kế với multiple fallbacks để đảm bảo registration luôn hoạt động, ngay cả khi trigger không work. Quan trọng nhất là:

1. ✅ User registration luôn thành công
2. ✅ Profile luôn được tạo (bằng 1 trong 3 methods)
3. ✅ User có thể login ngay sau khi đăng ký
4. ✅ Hệ thống có logging để debug

Nếu vẫn gặp vấn đề, hãy kiểm tra:
- Supabase Dashboard > Logs
- Browser Console logs
- Network tab trong DevTools
