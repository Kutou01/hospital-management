# 🔧 Hướng dẫn khắc phục vấn đề Role Records

## 📋 Vấn đề hiện tại

Trigger hiện tại chỉ tạo record trong bảng `profiles`, nhưng **không tạo record tương ứng trong bảng role-specific** (doctors, patients, admins). Điều này dẫn đến:

- ✅ User được tạo trong `auth.users`
- ✅ Profile được tạo trong `profiles` 
- ❌ **Không có record trong `doctors` table** (cho doctor)
- ❌ **Không có record trong `patients` table** (cho patient)
- ❌ **Không có record trong `admins` table** (cho admin)

## 🛠️ Giải pháp đã tạo

### 1. **Enhanced Trigger Function**
Trigger mới sẽ:
- Tạo profile trong `profiles` table
- **Tự động tạo record trong bảng role tương ứng**
- Xử lý metadata từ registration form
- Generate ID tự động cho từng role

### 2. **Enhanced RPC Function** 
RPC function mới sẽ:
- Nhận đầy đủ metadata từ frontend
- Tạo cả profile và role record
- Fallback khi trigger không hoạt động

## 🚀 Cách khắc phục

### **Bước 1: Chạy script kiểm tra hiện tại**
```sql
-- Trong Supabase SQL Editor
\i backend/scripts/check-role-records.sql
```

Xem kết quả để biết:
- Có bao nhiêu users thiếu role records
- Trigger có hoạt động không
- Cấu trúc bảng có đúng không

### **Bước 2: Chạy script khắc phục hoàn chỉnh**
```sql
-- Trong Supabase SQL Editor
\i backend/scripts/complete-trigger-solution.sql
```

Script này sẽ:
- ✅ Tạo sequence cho doctor IDs
- ✅ Cập nhật trigger function với role record creation
- ✅ Tạo enhanced RPC function
- ✅ Cập nhật permissions

### **Bước 3: Fix dữ liệu hiện tại (nếu cần)**

**Nếu có doctor profiles thiếu doctor records:**
```sql
INSERT INTO public.doctors (
    doctor_id,
    profile_id,
    full_name,
    specialty,
    license_number,
    qualification,
    department_id,
    gender,
    phone_number,
    email,
    status,
    schedule,
    created_at,
    updated_at
)
SELECT 
    'DOC' || LPAD(NEXTVAL('doctor_id_seq')::TEXT, 6, '0'),
    p.id,
    p.full_name,
    'General Medicine',
    'PENDING',
    'MD',
    'DEPT001',
    'other',
    p.phone_number,
    p.email,
    'active',
    '{}',
    NOW(),
    NOW()
FROM public.profiles p
LEFT JOIN public.doctors d ON p.id = d.profile_id
WHERE p.role = 'doctor' AND d.doctor_id IS NULL;
```

**Nếu có patient profiles thiếu patient records:**
```sql
INSERT INTO public.patients (
    patient_id,
    profile_id,
    full_name,
    date_of_birth,
    gender,
    phone_number,
    email,
    address,
    registration_date,
    status,
    created_at,
    updated_at
)
SELECT 
    'PAT' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT || ROW_NUMBER() OVER(),
    p.id,
    p.full_name,
    CURRENT_DATE - INTERVAL '30 years',
    'other',
    p.phone_number,
    p.email,
    '{}',
    CURRENT_DATE,
    'active',
    NOW(),
    NOW()
FROM public.profiles p
LEFT JOIN public.patients pt ON p.id = pt.profile_id
WHERE p.role = 'patient' AND pt.patient_id IS NULL;
```

### **Bước 4: Test trigger mới**

**Test RPC function:**
```sql
SELECT public.create_user_profile(
    gen_random_uuid(),
    'test-doctor@example.com',
    'Test Doctor',
    '0123456789',
    'doctor',
    'male',
    'Cardiology',
    'VN-BS-123456',
    'MD, PhD',
    'DEPT001',
    '1990-01-01',
    '123 Test Street'
);
```

**Test registration từ frontend:**
```javascript
// Test đăng ký doctor mới
const result = await supabaseAuth.signUp({
  email: 'newdoctor@example.com',
  password: 'password123',
  full_name: 'New Doctor',
  phone_number: '0987654321',
  role: 'doctor',
  specialty: 'Cardiology',
  license_number: 'VN-BS-789012',
  qualification: 'MD',
  department_id: 'DEPT001',
  gender: 'male'
});
```

### **Bước 5: Verify kết quả**

```sql
-- Kiểm tra user mới có đầy đủ records không
SELECT 
    u.email,
    p.role,
    CASE 
        WHEN p.role = 'doctor' AND d.doctor_id IS NOT NULL THEN '✅ Doctor record exists'
        WHEN p.role = 'patient' AND pt.patient_id IS NOT NULL THEN '✅ Patient record exists'
        WHEN p.role = 'admin' AND a.admin_id IS NOT NULL THEN '✅ Admin record exists'
        ELSE '❌ Missing role record'
    END as status
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.doctors d ON p.id = d.profile_id AND p.role = 'doctor'
LEFT JOIN public.patients pt ON p.id = pt.profile_id AND p.role = 'patient'
LEFT JOIN public.admins a ON p.id = a.profile_id AND p.role = 'admin'
WHERE u.email = 'newdoctor@example.com';
```

## 📊 Monitoring

### **Kiểm tra định kỳ:**
```sql
-- Chạy script này hàng ngày để monitor
\i backend/scripts/check-role-records.sql
```

### **Metrics quan trọng:**
- `orphaned_users`: Users không có profile
- `doctor_profiles_without_records`: Doctor profiles thiếu doctor records
- `patient_profiles_without_records`: Patient profiles thiếu patient records

## 🎯 Kết quả mong đợi

Sau khi fix:
- ✅ **Trigger tự động tạo cả profile và role record**
- ✅ **RPC function backup hoạt động đầy đủ**
- ✅ **Manual insert vẫn tạo profile (fallback cuối)**
- ✅ **Tất cả users mới đều có đầy đủ records**
- ✅ **Dữ liệu cũ được fix retroactively**

## ⚠️ Lưu ý quan trọng

1. **Backup database** trước khi chạy scripts
2. **Test trên staging** trước khi deploy production
3. **Monitor logs** sau khi deploy
4. **Kiểm tra permissions** của các bảng role-specific
5. **Verify foreign key constraints** hoạt động đúng

## 🔄 Rollback Plan

Nếu có vấn đề:
```sql
-- Disable trigger tạm thời
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Revert về trigger cũ
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_old();
```

Hệ thống vẫn sẽ hoạt động với manual profile creation như hiện tại.
