# Hospital Management System - Authentication & Registration

A production-ready authentication and registration system for a Hospital Management System built with **Next.js 15**, **Supabase**, and **TypeScript**. Optimized for **Supabase Free Tier** with enterprise-grade security features.

## 🚀 Features

### 🔐 Authentication & Authorization
- **Public Registration**: Patients can self-register with email verification
- **Invite-Only System**: Staff/Doctor/Admin accounts via secure invitation links
- **Role-Based Access Control**: Patient, Staff, Doctor, Admin, SuperAdmin roles
- **Multi-Factor Authentication**: TOTP support with backup codes
- **Session Management**: Secure JWT tokens with refresh rotation

### 🛡️ Security Features
- **Row Level Security (RLS)**: Database-level access control
- **Rate Limiting**: In-memory rate limiting for Free Tier compatibility
- **CAPTCHA Integration**: Support for hCaptcha, Turnstile, and Mock (dev)
- **File Upload Security**: MIME type validation, virus scanning stubs
- **Audit Logging**: Comprehensive activity tracking
- **Input Validation**: Zod schemas with Vietnamese localization

### 📱 User Experience
- **Progressive Onboarding**: Step-by-step patient registration wizard
- **Responsive Design**: Mobile-first with Tailwind CSS
- **Vietnamese Localization**: Full Vietnamese language support
- **Real-time Validation**: Instant feedback on form inputs
- **Accessibility**: WCAG compliant components

### 🏗️ Architecture
- **Microservice Ready**: Modular API design
- **Free Tier Optimized**: No premium features required
- **Type-Safe**: Full TypeScript coverage
- **Error Handling**: Centralized error management
- **Performance**: Optimized for speed and efficiency

## 📋 Prerequisites

- **Node.js** 18+ 
- **npm/yarn/pnpm**
- **Supabase Account** (Free Tier)
- **Git**

## 🛠️ Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd hospital-management
npm install
```

### 2. Environment Setup
Create `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_NAME="Hospital Management System"

# Email Configuration (Optional - uses console in development)
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com

# CAPTCHA Configuration
CAPTCHA_PROVIDER=MOCK  # MOCK | HCAPTCHA | TURNSTILE
NEXT_PUBLIC_CAPTCHA_SITE_KEY=your_captcha_site_key
CAPTCHA_SECRET_KEY=your_captcha_secret_key

# Security
INVITE_EXPIRES_IN_DAYS=7
```

### 3. Database Setup

#### Run SQL Scripts in Supabase SQL Editor:

1. **Core Tables**: Execute `schemas/01-core-tables.sql`
2. **RLS Policies**: Execute `schemas/02-rls-policies.sql`  
3. **Functions**: Execute `schemas/03-functions.sql`
4. **Seed Data**: Execute `schemas/04-seed-data.sql`

#### Verify Setup:
```sql
-- Check tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Check RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables WHERE schemaname = 'public';

-- Test health check
SELECT health_check();
```

### 4. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🔧 Configuration

### Supabase Configuration

1. **Enable Email Auth** in Supabase Dashboard
2. **Configure Email Templates** (optional)
3. **Set up Storage Bucket** for document uploads
4. **Configure SMTP** (optional, uses Supabase default)

### CAPTCHA Setup

#### For Development (Mock):
```env
CAPTCHA_PROVIDER=MOCK
```

#### For Production (hCaptcha):
```env
CAPTCHA_PROVIDER=HCAPTCHA
NEXT_PUBLIC_CAPTCHA_SITE_KEY=your_hcaptcha_site_key
CAPTCHA_SECRET_KEY=your_hcaptcha_secret_key
```

#### For Production (Cloudflare Turnstile):
```env
CAPTCHA_PROVIDER=TURNSTILE
NEXT_PUBLIC_CAPTCHA_SITE_KEY=your_turnstile_site_key
CAPTCHA_SECRET_KEY=your_turnstile_secret_key
```

## 🚦 Usage

### Patient Registration Flow
1. Visit `/register`
2. Fill registration form with CAPTCHA
3. Verify email address
4. Complete onboarding wizard at `/onboarding`
5. Access patient dashboard

### Staff Invitation Flow
1. Admin creates invitation via `/admin/invitations`
2. Staff receives email with invitation link
3. Staff visits `/accept-invite?token=...`
4. Sets password and optionally enables MFA
5. Access role-specific dashboard

### API Endpoints

#### Public Endpoints
- `POST /api/auth/captcha/verify` - Verify CAPTCHA
- `POST /api/auth/accept-invite` - Accept staff invitation

#### Protected Endpoints
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `POST /api/user/onboarding` - Complete patient onboarding

#### Admin Endpoints
- `GET /api/admin/invitations` - List invitations
- `POST /api/admin/invitations` - Create invitation
- `DELETE /api/admin/invitations` - Revoke invitation

## 🧪 Testing

### Test Accounts
After running seed data:

- **SuperAdmin**: `superadmin@hospital.local`
- **Test Patient**: `patient.test@example.com`
- **Test Invitation**: Token `test-invitation-token-123`

### Run Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Type checking
npm run type-check
```

## 🚀 Deployment

### Vercel Deployment
1. Connect repository to Vercel
2. Set environment variables
3. Deploy

### Environment Variables for Production
```env
# Required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=

# Email (Recommended)
RESEND_API_KEY=
FROM_EMAIL=

# CAPTCHA (Required for production)
CAPTCHA_PROVIDER=HCAPTCHA
NEXT_PUBLIC_CAPTCHA_SITE_KEY=
CAPTCHA_SECRET_KEY=
```

## 📁 Project Structure

```
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth pages group
│   │   ├── login/page.tsx        # Login page
│   │   ├── register/page.tsx     # Patient registration
│   │   └── accept-invite/page.tsx # Staff invitation acceptance
│   └── api/                      # API routes
│       ├── auth/                 # Authentication APIs
│       ├── admin/                # Admin APIs
│       └── user/                 # User APIs
├── components/                   # Reusable components
│   ├── ui/                       # UI components
│   └── auth/                     # Auth-specific components
├── lib/                          # Utility libraries
│   ├── auth/                     # Auth context & hooks
│   ├── supabase/                 # Supabase clients & types
│   ├── validations/              # Zod schemas
│   ├── security/                 # Security utilities
│   ├── captcha/                  # CAPTCHA providers
│   ├── email/                    # Email templates & sender
│   └── utils/                    # Common utilities
├── schemas/                      # Database schemas
│   ├── 01-core-tables.sql        # Table definitions
│   ├── 02-rls-policies.sql       # Security policies
│   ├── 03-functions.sql          # Database functions
│   └── 04-seed-data.sql          # Initial data
└── middleware.ts                 # Route protection
```

## 🔒 Security Considerations

### Database Security
- All tables have RLS enabled
- Service role key never exposed to client
- Audit logging for sensitive operations
- Input validation at database level

### Application Security
- Rate limiting on sensitive endpoints
- CAPTCHA on public forms
- File upload validation
- XSS protection via proper escaping
- CSRF protection via SameSite cookies

### Production Checklist
- [ ] Change default passwords
- [ ] Enable real CAPTCHA provider
- [ ] Configure proper SMTP
- [ ] Set up monitoring
- [ ] Enable audit logging
- [ ] Configure backup strategy

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend as a Service
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Zod](https://zod.dev/) - Schema validation
- [React Hook Form](https://react-hook-form.com/) - Form handling
