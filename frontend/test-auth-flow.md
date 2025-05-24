# 🧪 Test Auth Flow với Supabase Auth

## **Checklist kiểm tra sau khi cập nhật**

### ✅ **1. Database Migration**
- [x] Đã migrate users từ custom tables sang `auth.users` + `profiles`
- [x] Đã xóa các bảng auth cũ
- [x] Đã cập nhật RLS policies
- [x] Đã cập nhật middleware để query từ `profiles` table

### ✅ **2. Frontend Updates**
- [x] Đã cập nhật `supabase-auth.ts` để sử dụng `profiles` table
- [x] Đã tạo wrapper hook `useAuthProvider` cho backward compatibility
- [x] Đã cập nhật `RoleBasedLayout` để sử dụng Supabase Auth hooks

### 🔄 **3. Test Cases cần kiểm tra**

#### **Test 1: User Registration**
1. Truy cập `/auth/register`
2. Chọn role: Doctor hoặc Patient
3. Điền thông tin và submit
4. Kiểm tra:
   - User được tạo trong `auth.users`
   - Profile được tạo trong `profiles` table
   - Doctor/Patient record được tạo trong business tables
   - Redirect về login page

#### **Test 2: User Login**
1. Truy cập `/auth/login`
2. Login với credentials
3. Kiểm tra:
   - Session được tạo
   - User data được load từ `profiles`
   - Redirect đúng role:
     - Admin → `/admin/dashboard`
     - Doctor → `/doctor/dashboard`
     - Patient → `/patient/dashboard`

#### **Test 3: Role-based Access Control**
1. Login với role A
2. Thử truy cập route của role B
3. Kiểm tra:
   - Middleware redirect về dashboard đúng role
   - RLS policies hoạt động đúng

#### **Test 4: Middleware Protection**
1. Truy cập protected route khi chưa login
2. Kiểm tra redirect về `/auth/login`
3. Login và kiểm tra redirect về route ban đầu

## **Demo Accounts để test**

### **Existing Users (đã migrate)**
```
Admin: admin@hospital.com / [cần reset password]
Doctor: doctor@hospital.com / [cần reset password]  
Patient: patient@hospital.com / [cần reset password]
```

### **New Registration Test**
1. Tạo doctor mới với specialty
2. Tạo patient mới với thông tin y tế
3. Kiểm tra data trong database

## **Database Queries để verify**

```sql
-- Check auth users
SELECT id, email, created_at FROM auth.users;

-- Check profiles
SELECT id, full_name, role, is_active FROM public.profiles;

-- Check doctors linked to auth
SELECT d.doctor_id, d.full_name, d.specialty, p.role 
FROM public.doctors d
JOIN public.profiles p ON d.auth_user_id = p.id;

-- Check patients linked to auth  
SELECT pt.patient_id, pt.full_name, pt.gender, p.role
FROM public.patients pt
JOIN public.profiles p ON pt.auth_user_id = p.id;
```

## **Troubleshooting**

### **Issue 1: User không redirect đúng role**
- Kiểm tra `profiles.role` có đúng không
- Kiểm tra middleware logic
- Check browser console cho errors

### **Issue 2: Registration fails**
- Kiểm tra trigger `handle_new_user()` có hoạt động không
- Check RLS policies cho `profiles` table
- Verify business table structure

### **Issue 3: Login fails**
- Check `convertToHospitalUser()` function
- Verify `profiles` table có data không
- Check Supabase Auth settings

## **Next Steps sau khi test**

1. **Performance optimization**: Add indexes nếu cần
2. **Security review**: Verify RLS policies
3. **User experience**: Add loading states, error handling
4. **Documentation**: Update API docs và user guides
