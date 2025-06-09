# 🔐 Hướng dẫn Setup Supabase Security Features

## Bước 1: Enable Auth Providers trong Supabase Dashboard

### 1.1 Truy cập Supabase Dashboard
1. Đăng nhập vào [https://supabase.com](https://supabase.com)
2. Chọn project của bạn
3. Vào **Authentication** → **Providers**

### 1.2 Enable Email Provider
```
✅ Email: Đã enabled mặc định
- Confirm email: Enabled
- Secure email change: Enabled
```

### 1.3 Enable Phone Provider
```
1. Tìm "Phone" trong danh sách providers
2. Toggle ON
3. Chọn SMS provider: Twilio (recommended)
4. Nhập Twilio credentials (sẽ setup ở bước 3)
```

### 1.4 Enable OAuth Providers

#### Google OAuth:
```
1. Toggle ON "Google"
2. Nhập:
   - Client ID: [từ Google Console]
   - Client Secret: [từ Google Console]
3. Redirect URL: https://[your-project].supabase.co/auth/v1/callback
```

#### GitHub OAuth:
```
1. Toggle ON "GitHub"  
2. Nhập:
   - Client ID: [từ GitHub App]
   - Client Secret: [từ GitHub App]
3. Redirect URL: https://[your-project].supabase.co/auth/v1/callback
```

#### Facebook OAuth:
```
1. Toggle ON "Facebook"
2. Nhập:
   - App ID: [từ Facebook App]
   - App Secret: [từ Facebook App]
3. Redirect URL: https://[your-project].supabase.co/auth/v1/callback
```

---

## Bước 2: Configure Email Templates

### 2.1 Truy cập Email Templates
1. Vào **Authentication** → **Email Templates**
2. Sẽ thấy các templates:
   - Confirm signup
   - Magic Link
   - Change Email Address
   - Reset Password

### 2.2 Customize Magic Link Template
```html
<h2>Đăng nhập vào Hệ thống Quản lý Bệnh viện</h2>
<p>Xin chào!</p>
<p>Nhấp vào liên kết bên dưới để đăng nhập vào tài khoản của bạn:</p>
<p><a href="{{ .ConfirmationURL }}">Đăng nhập ngay</a></p>
<p>Hoặc copy và paste URL này vào trình duyệt:</p>
<p>{{ .ConfirmationURL }}</p>
<p>Liên kết này sẽ hết hạn sau 1 giờ.</p>
<p>Nếu bạn không yêu cầu đăng nhập này, vui lòng bỏ qua email này.</p>
<p>Trân trọng,<br>Đội ngũ Hệ thống Quản lý Bệnh viện</p>
```

### 2.3 Customize Reset Password Template
```html
<h2>Đặt lại mật khẩu</h2>
<p>Xin chào!</p>
<p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>
<p>Nhấp vào liên kết bên dưới để đặt lại mật khẩu:</p>
<p><a href="{{ .ConfirmationURL }}">Đặt lại mật khẩu</a></p>
<p>Hoặc copy và paste URL này vào trình duyệt:</p>
<p>{{ .ConfirmationURL }}</p>
<p>Liên kết này sẽ hết hạn sau 1 giờ.</p>
<p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
<p>Trân trọng,<br>Đội ngũ Hệ thống Quản lý Bệnh viện</p>
```

### 2.4 Configure Redirect URLs
```
Site URL: http://localhost:3000 (development)
Additional Redirect URLs:
- http://localhost:3000/auth/callback
- http://localhost:3000/auth/verify-email
- http://localhost:3000/auth/reset-password
- https://yourdomain.com/auth/callback (production)
```

---

## Bước 3: Setup SMS Provider (Twilio)

### 3.1 Tạo Twilio Account
1. Đăng ký tại [https://www.twilio.com](https://www.twilio.com)
2. Verify số điện thoại của bạn
3. Tạo project mới

### 3.2 Lấy Twilio Credentials
```
1. Vào Twilio Console Dashboard
2. Copy:
   - Account SID
   - Auth Token
3. Mua số điện thoại Twilio (cho production)
   - Hoặc dùng trial number (cho development)
```

### 3.3 Configure trong Supabase
```
1. Vào Authentication → Providers → Phone
2. Nhập:
   - Twilio Account SID: [Account SID từ Twilio]
   - Twilio Auth Token: [Auth Token từ Twilio]
   - Twilio Phone Number: [Số điện thoại Twilio]
3. Save configuration
```

### 3.4 Test SMS (Development)
```
- Twilio trial account chỉ gửi SMS đến số đã verify
- Verify số điện thoại test trong Twilio Console
- Test với số điện thoại đã verify
```

---

## Bước 4: Setup OAuth Credentials

### 4.1 Google OAuth Setup

#### Tạo Google Cloud Project:
```
1. Vào Google Cloud Console: https://console.cloud.google.com
2. Tạo project mới hoặc chọn project existing
3. Enable Google+ API và Google Identity API
```

#### Configure OAuth Consent Screen:
```
1. Vào APIs & Services → OAuth consent screen
2. Chọn External (cho public app)
3. Điền thông tin:
   - App name: "Hệ thống Quản lý Bệnh viện"
   - User support email: your-email@domain.com
   - Developer contact: your-email@domain.com
4. Add scopes: email, profile, openid
5. Add test users (cho development)
```

#### Tạo OAuth Credentials:
```
1. Vào APIs & Services → Credentials
2. Create Credentials → OAuth 2.0 Client IDs
3. Application type: Web application
4. Name: "Hospital Management System"
5. Authorized redirect URIs:
   - https://[your-project].supabase.co/auth/v1/callback
6. Copy Client ID và Client Secret
```

### 4.2 GitHub OAuth Setup

#### Tạo GitHub OAuth App:
```
1. Vào GitHub Settings → Developer settings → OAuth Apps
2. New OAuth App
3. Điền thông tin:
   - Application name: "Hospital Management System"
   - Homepage URL: http://localhost:3000
   - Authorization callback URL: 
     https://[your-project].supabase.co/auth/v1/callback
4. Register application
5. Copy Client ID và generate Client Secret
```

### 4.3 Facebook OAuth Setup

#### Tạo Facebook App:
```
1. Vào Facebook Developers: https://developers.facebook.com
2. Create App → Consumer
3. Add Facebook Login product
4. Configure:
   - Valid OAuth Redirect URIs:
     https://[your-project].supabase.co/auth/v1/callback
5. Copy App ID và App Secret từ Settings → Basic
```

---

## Bước 5: Run Database Migrations

### 5.1 Connect to Supabase Database
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref [your-project-ref]
```

### 5.2 Run 2FA Migration
```sql
-- Copy nội dung từ database/migrations/add_2fa_support.sql
-- Paste vào Supabase SQL Editor và execute
```

### 5.3 Verify Tables Created
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('two_factor_auth', 'two_factor_attempts');

-- Check functions exist  
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('generate_backup_codes', 'validate_backup_code');
```

---

## Bước 6: Configure RLS Policies

### 6.1 Enable RLS on Tables
```sql
-- Enable RLS on existing tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;

-- RLS đã enabled cho two_factor_auth và two_factor_attempts
```

### 6.2 Create Security Policies
```sql
-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Doctors policies  
CREATE POLICY "Doctors can view own data" ON doctors
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Doctors can update own data" ON doctors
    FOR UPDATE USING (auth.uid() = id);

-- Patients policies
CREATE POLICY "Patients can view own data" ON patients
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Patients can update own data" ON patients
    FOR UPDATE USING (auth.uid() = id);

-- Admin policies
CREATE POLICY "Admins can view all data" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

---

## Bước 7: Test Configuration

### 7.1 Test Email Auth
```
1. Đăng ký tài khoản mới
2. Check email verification
3. Test password reset
4. Test magic link login
```

### 7.2 Test Phone Auth  
```
1. Test SMS OTP với số đã verify
2. Check OTP delivery time
3. Test invalid OTP handling
```

### 7.3 Test OAuth
```
1. Test Google login
2. Test GitHub login  
3. Test Facebook login
4. Verify user profile creation
```

### 7.4 Test 2FA
```
1. Enable 2FA trong settings
2. Scan QR code với authenticator app
3. Test TOTP verification
4. Test backup codes
5. Test disable 2FA
```

---

## Troubleshooting

### Common Issues:

#### OAuth Redirect Mismatch:
```
Error: redirect_uri_mismatch
Solution: Check redirect URLs trong OAuth provider settings
```

#### SMS Not Delivered:
```
Error: SMS không gửi được
Solution: 
- Check Twilio credentials
- Verify số điện thoại trong Twilio (trial account)
- Check Twilio balance
```

#### Email Not Delivered:
```
Error: Email không nhận được
Solution:
- Check spam folder
- Verify email template configuration
- Check Supabase email limits
```

#### 2FA QR Code Not Working:
```
Error: QR code không scan được
Solution:
- Check QR code URL generation
- Verify secret key format
- Test với different authenticator apps
```

---

## Production Checklist

### Security:
- [ ] Enable email confirmation
- [ ] Configure proper redirect URLs
- [ ] Set up custom SMTP (optional)
- [ ] Enable 2FA for admin accounts
- [ ] Configure rate limiting
- [ ] Set up monitoring

### Performance:
- [ ] Configure CDN for assets
- [ ] Optimize database queries
- [ ] Set up caching
- [ ] Monitor API usage

### Compliance:
- [ ] Add privacy policy
- [ ] Add terms of service  
- [ ] Configure data retention
- [ ] Set up audit logging
