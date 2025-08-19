# Deployment Guide - Hospital Management System Authentication

This guide covers deploying the authentication system to production environments, optimized for Supabase Free Tier.

## 🚀 Quick Deployment (Vercel)

### 1. Prerequisites
- Vercel account
- Supabase project (Free Tier)
- Domain name (optional)
- Email service account (Resend recommended)
- CAPTCHA service account (hCaptcha or Turnstile)

### 2. Deploy to Vercel

#### Option A: Deploy Button
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/hospital-management)

#### Option B: Manual Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### 3. Environment Variables
Set these in Vercel Dashboard → Project → Settings → Environment Variables:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# Email (Recommended)
RESEND_API_KEY=your_resend_key
FROM_EMAIL=noreply@yourdomain.com
APP_NAME="Hospital Management System"

# CAPTCHA (Required for production)
CAPTCHA_PROVIDER=HCAPTCHA
NEXT_PUBLIC_CAPTCHA_SITE_KEY=your_site_key
CAPTCHA_SECRET_KEY=your_secret_key

# Security
INVITE_EXPIRES_IN_DAYS=7
NODE_ENV=production
```

## 🗄️ Database Setup (Supabase)

### 1. Create Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose Free Tier
4. Note down your project URL and keys

### 2. Run Database Scripts
Execute these SQL scripts in Supabase SQL Editor:

```sql
-- 1. Core Tables
-- Copy and paste content from schemas/01-core-tables.sql

-- 2. RLS Policies  
-- Copy and paste content from schemas/02-rls-policies.sql

-- 3. Functions
-- Copy and paste content from schemas/03-functions.sql

-- 4. Seed Data (Optional)
-- Copy and paste content from schemas/04-seed-data.sql
```

### 3. Configure Authentication
1. Go to Authentication → Settings
2. Enable Email provider
3. Set Site URL to your domain
4. Configure redirect URLs:
   - `https://yourdomain.com/auth/callback`
   - `https://yourdomain.com/reset-password`

### 4. Configure Storage
1. Go to Storage
2. Create bucket named `documents`
3. Set policies for file uploads
4. Configure file size limits (2MB for Free Tier)

## 📧 Email Configuration

### Option 1: Resend (Recommended)
1. Sign up at [Resend](https://resend.com)
2. Verify your domain
3. Get API key
4. Set environment variables:
   ```env
   RESEND_API_KEY=your_api_key
   FROM_EMAIL=noreply@yourdomain.com
   ```

### Option 2: Supabase SMTP (Free)
1. Use Supabase's built-in SMTP
2. Configure in Supabase Dashboard → Authentication → Settings
3. No additional environment variables needed

## 🛡️ CAPTCHA Configuration

### Option 1: hCaptcha (Recommended)
1. Sign up at [hCaptcha](https://www.hcaptcha.com/)
2. Create a site
3. Get site key and secret key
4. Set environment variables:
   ```env
   CAPTCHA_PROVIDER=HCAPTCHA
   NEXT_PUBLIC_CAPTCHA_SITE_KEY=your_site_key
   CAPTCHA_SECRET_KEY=your_secret_key
   ```

### Option 2: Cloudflare Turnstile
1. Sign up at [Cloudflare](https://developers.cloudflare.com/turnstile/)
2. Create a site
3. Get site key and secret key
4. Set environment variables:
   ```env
   CAPTCHA_PROVIDER=TURNSTILE
   NEXT_PUBLIC_CAPTCHA_SITE_KEY=your_site_key
   CAPTCHA_SECRET_KEY=your_secret_key
   ```

## 🔒 Security Checklist

### Pre-Deployment
- [ ] Change all default passwords
- [ ] Review RLS policies
- [ ] Enable audit logging
- [ ] Configure rate limiting
- [ ] Set up proper CORS
- [ ] Validate all environment variables

### Post-Deployment
- [ ] Test all authentication flows
- [ ] Verify email delivery
- [ ] Test CAPTCHA functionality
- [ ] Check file upload limits
- [ ] Verify role-based access
- [ ] Test invitation system

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure uptime monitoring
- [ ] Set up log aggregation
- [ ] Monitor database performance
- [ ] Track user registration metrics

## 🚨 Troubleshooting

### Common Issues

#### 1. Supabase Connection Errors
```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Verify in browser console
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
```

#### 2. RLS Policy Errors
```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables WHERE schemaname = 'public';

-- Test policies
SELECT * FROM profiles WHERE id = auth.uid();
```

#### 3. Email Not Sending
- Check Resend dashboard for delivery status
- Verify FROM_EMAIL domain is verified
- Check spam folder
- Review email templates

#### 4. CAPTCHA Not Working
- Verify site key matches domain
- Check browser console for errors
- Ensure HTTPS in production
- Test with different browsers

### Performance Optimization

#### 1. Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_token ON staff_invitations(token);
```

#### 2. Caching Strategy
- Enable Vercel Edge Caching
- Use SWR for client-side caching
- Implement Redis for session storage (optional)

#### 3. Bundle Optimization
```bash
# Analyze bundle size
npm run build
npm run analyze

# Optimize images
npm install next-optimized-images
```

## 📊 Monitoring & Analytics

### 1. Error Tracking
```bash
# Install Sentry
npm install @sentry/nextjs

# Configure in next.config.js
const { withSentryConfig } = require('@sentry/nextjs');
```

### 2. Performance Monitoring
- Use Vercel Analytics
- Set up Core Web Vitals tracking
- Monitor API response times

### 3. User Analytics
- Google Analytics 4
- Mixpanel for user events
- Custom dashboard for registration metrics

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🆘 Support & Maintenance

### Regular Maintenance Tasks
- [ ] Update dependencies monthly
- [ ] Review security logs weekly
- [ ] Clean up expired invitations
- [ ] Monitor database storage usage
- [ ] Backup critical data

### Support Channels
- GitHub Issues for bugs
- Documentation for common questions
- Email support for critical issues

### Scaling Considerations
- Monitor Supabase Free Tier limits
- Plan for database scaling
- Consider CDN for static assets
- Implement horizontal scaling for high traffic

---

## 📝 Deployment Checklist

### Pre-Production
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database scripts executed
- [ ] Email service configured
- [ ] CAPTCHA service configured
- [ ] Domain configured
- [ ] SSL certificate active

### Production
- [ ] Application deployed
- [ ] Database accessible
- [ ] Authentication working
- [ ] Email delivery working
- [ ] File uploads working
- [ ] All user flows tested
- [ ] Monitoring active
- [ ] Backup strategy in place

### Post-Production
- [ ] Performance metrics baseline
- [ ] Error tracking active
- [ ] User feedback collection
- [ ] Documentation updated
- [ ] Team training completed
