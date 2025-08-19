# 🧪 Manual Testing Guide - Dual Authentication System

Hướng dẫn test thủ công hệ thống dual authentication để xác minh tất cả tính năng hoạt động đúng.

## 🚨 SECURITY WARNING

**⚠️ CRITICAL: This guide is for DEVELOPMENT/TESTING ONLY**

- **NEVER use real credentials** in testing
- **NEVER test with production data**
- **ALWAYS use test emails** (example.com, localhost.test)
- **ALWAYS use strong test passwords** (not real ones)
- **NEVER commit test credentials** to version control
- **See docs/SECURITY_WARNINGS.md** for complete guidelines

**Use test domains like:**
- `test@example.com`
- `user@localhost.test`
- `admin@test-hospital.local`

## 🚀 Chuẩn bị

### 1. Khởi động Server
```bash
cd frontend
npm run dev
```

### 2. Kiểm tra Server
- Truy cập: `http://localhost:3000`
- Đảm bảo không có lỗi 500

## 👥 Test 1: Patient Registration (Public)

### Bước 1: Truy cập trang đăng ký
```
URL: http://localhost:3000/register
```

**Kiểm tra:**
- ✅ Trang load thành công
- ✅ Form hiển thị đầy đủ fields
- ✅ Password strength indicator hoạt động
- ✅ CAPTCHA widget hiển thị

### Bước 2: Điền thông tin
```
⚠️ SECURITY NOTE: Use test data only, never real credentials!

Email: your-test-email@example.com
Password: [Create a strong test password]
Confirm Password: [Same as above]
Full Name: Test Patient User
Date of Birth: 01/01/1990
Gender: Male
☑️ Accept Terms of Service
☑️ Accept Privacy Policy
```

### Bước 3: Submit form
**Kiểm tra:**
- ✅ CAPTCHA validation
- ✅ Form validation
- ✅ Success message
- ✅ Redirect hoặc next step

### Bước 4: Kiểm tra database
```sql
-- Truy cập Supabase Dashboard
-- Replace with your actual test email
SELECT * FROM profiles WHERE email = 'your-test-email@example.com';
SELECT * FROM patient_profiles WHERE user_id IN (
  SELECT id FROM profiles WHERE email = 'your-test-email@example.com'
);
```

**Expected:**
- ✅ Profile record tạo với role = 'patient'
- ✅ Patient profile record tạo
- ✅ Email verification pending

---

## 👨‍⚕️ Test 2: Staff Invitation (Invite-Only)

### Bước 1: Tạo Admin User (nếu chưa có)
```sql
-- ⚠️ SECURITY WARNING: Use test credentials only!
-- Trong Supabase SQL Editor
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'your-test-admin@example.com',  -- Use your test email
  crypt('YourTestPassword123!', gen_salt('bf')),  -- Use your test password
  now(),
  now(),
  now()
);

-- Tạo profile
INSERT INTO profiles (id, email, full_name, role, is_active, email_verified, onboarding_completed)
SELECT id, 'your-test-admin@example.com', 'Test Admin', 'admin', true, true, true
FROM auth.users WHERE email = 'your-test-admin@example.com';
```

### Bước 2: Đăng nhập Admin
```
⚠️ Use your test credentials, not the examples below!

URL: http://localhost:3000/login
Email: [Your test admin email]
Password: [Your test admin password]
```

### Bước 3: Truy cập Admin Panel
```
URL: http://localhost:3000/admin/invitations
```

**Kiểm tra:**
- ✅ Trang load thành công
- ✅ Statistics hiển thị
- ✅ Create invitation form hiển thị
- ✅ Invitations list hiển thị

### Bước 4: Tạo lời mời
```
⚠️ Use test email only!

Email: your-test-doctor@example.com
Role: Doctor
Department: Khoa Tim mạch
Expires in days: 7
Message: Welcome to our test hospital team!
```

**Kiểm tra:**
- ✅ Form validation
- ✅ Success message
- ✅ Invitation xuất hiện trong list
- ✅ Invitation URL được tạo

### Bước 5: Copy invitation URL
**Format:** `http://localhost:3000/accept-invite?token=...`

### Bước 6: Truy cập invitation link (incognito/private window)
```
URL: [Invitation URL từ bước 5]
```

**Kiểm tra:**
- ✅ Token verification thành công
- ✅ Invitation details hiển thị đúng
- ✅ Accept invitation form hiển thị

### Bước 7: Chấp nhận lời mời
```
⚠️ Use strong test password only!

Password: [Your strong test password]
Confirm Password: [Same as above]
☑️ Accept Terms of Service
☑️ Accept Privacy Policy
☐ Enable MFA (optional)
```

**Kiểm tra:**
- ✅ Form validation
- ✅ Success message
- ✅ Redirect to doctor dashboard

### Bước 8: Kiểm tra database
```sql
-- Kiểm tra staff profile
SELECT * FROM profiles WHERE email = 'test-doctor@hospital.com';

-- Kiểm tra invitation consumed
SELECT * FROM staff_invitations WHERE email = 'test-doctor@hospital.com';
```

**Expected:**
- ✅ Profile record với role = 'doctor'
- ✅ Invitation marked as consumed
- ✅ consumed_at timestamp set

---

## 🔍 Test 3: Security & Edge Cases

### Test 3.1: Duplicate Registration
1. Thử đăng ký lại với email đã tồn tại
2. **Expected:** Error message "Email đã được sử dụng"

### Test 3.2: Invalid Invitation Token
1. Truy cập: `http://localhost:3000/accept-invite?token=invalid-token`
2. **Expected:** Error message "Token không hợp lệ"

### Test 3.3: Expired Invitation
1. Tạo invitation với expires_in_days = 0
2. Thử accept sau 1 ngày
3. **Expected:** Error message "Lời mời đã hết hạn"

### Test 3.4: Rate Limiting
1. Thử đăng ký patient nhiều lần liên tiếp
2. **Expected:** Rate limit error sau 5 lần

### Test 3.5: CAPTCHA Validation
1. Thử submit patient registration không CAPTCHA
2. **Expected:** CAPTCHA validation error

---

## 📊 Test 4: Admin Management

### Test 4.1: List Invitations
```
URL: http://localhost:3000/admin/invitations
```

**Kiểm tra:**
- ✅ Filter by status (active, consumed, expired)
- ✅ Pagination works
- ✅ Search functionality
- ✅ Statistics accurate

### Test 4.2: Revoke Invitation
1. Tạo invitation mới
2. Click "Revoke" button
3. **Expected:** Invitation status = expired

### Test 4.3: Bulk Operations
1. Tạo nhiều invitations
2. Test bulk revoke (nếu có)
3. Test export functionality (nếu có)

---

## 🎯 Test 5: User Experience

### Test 5.1: Responsive Design
- Test trên mobile, tablet, desktop
- Kiểm tra form layouts
- Kiểm tra navigation

### Test 5.2: Error Handling
- Test network errors
- Test server errors
- Test validation errors
- Kiểm tra error messages user-friendly

### Test 5.3: Loading States
- Kiểm tra loading spinners
- Kiểm tra disabled states
- Kiểm tra progress indicators

---

## ✅ Checklist Tổng Kết

### Patient Registration Flow:
- [ ] Registration page accessible
- [ ] Form validation works
- [ ] CAPTCHA integration
- [ ] Database records created
- [ ] Email verification sent
- [ ] Onboarding flow works

### Staff Invitation Flow:
- [ ] Admin can create invitations
- [ ] Email notifications sent
- [ ] Token verification works
- [ ] Account creation successful
- [ ] Database records correct
- [ ] Role-based access works

### Security Features:
- [ ] Rate limiting active
- [ ] Input validation working
- [ ] CAPTCHA preventing bots
- [ ] Token security (HMAC)
- [ ] Audit logging functional

### Admin Features:
- [ ] Invitation management
- [ ] Statistics accurate
- [ ] Bulk operations
- [ ] Search and filter
- [ ] Revoke functionality

---

## 🚨 Troubleshooting

### Common Issues:

1. **500 Server Error**
   - Check environment variables
   - Check database connection
   - Check Supabase configuration

2. **CAPTCHA Not Working**
   - Check CAPTCHA keys in .env
   - Verify domain configuration

3. **Email Not Sending**
   - Check SMTP configuration
   - Verify email service setup

4. **Database Errors**
   - Check Supabase connection
   - Verify table schemas
   - Check RLS policies

### Debug Commands:
```bash
# Check server logs
npm run dev

# Check database
# Visit Supabase Dashboard

# Check environment
echo $NEXT_PUBLIC_SUPABASE_URL
```

---

## 📝 Test Results Template

```
Date: ___________
Tester: ___________

Patient Registration:
[ ] Page loads ✅/❌
[ ] Form validation ✅/❌
[ ] Database creation ✅/❌
[ ] Email verification ✅/❌

Staff Invitation:
[ ] Admin panel ✅/❌
[ ] Create invitation ✅/❌
[ ] Accept invitation ✅/❌
[ ] Database updates ✅/❌

Security:
[ ] Rate limiting ✅/❌
[ ] CAPTCHA ✅/❌
[ ] Token security ✅/❌
[ ] Input validation ✅/❌

Notes:
_________________________
_________________________
```

Sử dụng guide này để test thủ công toàn bộ hệ thống dual authentication! 🎯
