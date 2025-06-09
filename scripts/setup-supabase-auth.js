#!/usr/bin/env node

/**
 * Supabase Auth Setup Script
 * Tự động setup các tính năng authentication cho Hospital Management System
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('🏥 Hospital Management System - Supabase Auth Setup');
  console.log('====================================================\n');

  // Collect Supabase project info
  console.log('📋 Thông tin Supabase Project:');
  const supabaseUrl = await question('Supabase URL (https://xxx.supabase.co): ');
  const supabaseAnonKey = await question('Supabase Anon Key: ');
  const supabaseServiceKey = await question('Supabase Service Role Key: ');

  // Collect OAuth credentials
  console.log('\n🔐 OAuth Credentials (nhấn Enter để bỏ qua):');
  
  const googleClientId = await question('Google Client ID: ');
  const googleClientSecret = await question('Google Client Secret: ');
  
  const githubClientId = await question('GitHub Client ID: ');
  const githubClientSecret = await question('GitHub Client Secret: ');
  
  const facebookAppId = await question('Facebook App ID: ');
  const facebookAppSecret = await question('Facebook App Secret: ');

  // Collect Twilio credentials
  console.log('\n📱 Twilio SMS Credentials (nhấn Enter để bỏ qua):');
  const twilioAccountSid = await question('Twilio Account SID: ');
  const twilioAuthToken = await question('Twilio Auth Token: ');
  const twilioPhoneNumber = await question('Twilio Phone Number: ');

  // Generate environment file
  console.log('\n📝 Tạo file environment...');
  
  const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}
SUPABASE_SERVICE_ROLE_KEY=${supabaseServiceKey}

# OAuth Providers
${googleClientId ? `GOOGLE_CLIENT_ID=${googleClientId}` : '# GOOGLE_CLIENT_ID='}
${googleClientSecret ? `GOOGLE_CLIENT_SECRET=${googleClientSecret}` : '# GOOGLE_CLIENT_SECRET='}

${githubClientId ? `GITHUB_CLIENT_ID=${githubClientId}` : '# GITHUB_CLIENT_ID='}
${githubClientSecret ? `GITHUB_CLIENT_SECRET=${githubClientSecret}` : '# GITHUB_CLIENT_SECRET='}

${facebookAppId ? `FACEBOOK_APP_ID=${facebookAppId}` : '# FACEBOOK_APP_ID='}
${facebookAppSecret ? `FACEBOOK_APP_SECRET=${facebookAppSecret}` : '# FACEBOOK_APP_SECRET='}

# Twilio SMS
${twilioAccountSid ? `TWILIO_ACCOUNT_SID=${twilioAccountSid}` : '# TWILIO_ACCOUNT_SID='}
${twilioAuthToken ? `TWILIO_AUTH_TOKEN=${twilioAuthToken}` : '# TWILIO_AUTH_TOKEN='}
${twilioPhoneNumber ? `TWILIO_PHONE_NUMBER=${twilioPhoneNumber}` : '# TWILIO_PHONE_NUMBER='}

# Security
JWT_SECRET=${generateRandomString(64)}
NEXTAUTH_SECRET=${generateRandomString(32)}
NEXTAUTH_URL=http://localhost:3000

# Development
NODE_ENV=development
`;

  // Write to .env.local
  // Check if we're already in frontend directory or need to navigate to it
  const currentDir = process.cwd();
  const envPath = currentDir.endsWith('frontend')
    ? path.join(currentDir, '.env.local')
    : path.join(currentDir, 'frontend', '.env.local');

  // Ensure the directory exists
  const envDir = path.dirname(envPath);
  if (!fs.existsSync(envDir)) {
    fs.mkdirSync(envDir, { recursive: true });
  }

  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Đã tạo ${envPath}`);

  // Generate Supabase configuration
  console.log('\n🔧 Tạo Supabase configuration...');
  
  const supabaseConfig = `-- Supabase Auth Configuration
-- Run this in Supabase SQL Editor

-- 1. Enable Auth Providers
-- Go to Authentication > Providers in Supabase Dashboard and configure:

${googleClientId ? `-- Google OAuth: Client ID = ${googleClientId}` : '-- Google OAuth: Not configured'}
${githubClientId ? `-- GitHub OAuth: Client ID = ${githubClientId}` : '-- GitHub OAuth: Not configured'}  
${facebookAppId ? `-- Facebook OAuth: App ID = ${facebookAppId}` : '-- Facebook OAuth: Not configured'}
${twilioAccountSid ? `-- Twilio SMS: Account SID = ${twilioAccountSid}` : '-- Twilio SMS: Not configured'}

-- 2. Configure Redirect URLs
-- Add these URLs to Authentication > URL Configuration:
-- Site URL: http://localhost:3000
-- Redirect URLs:
--   - http://localhost:3000/auth/callback
--   - http://localhost:3000/auth/verify-email
--   - http://localhost:3000/auth/reset-password

-- 3. Run 2FA Migration (copy from database/migrations/add_2fa_support.sql)

-- 4. Enable RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles  
    FOR UPDATE USING (auth.uid() = id);
`;

  const configPath = path.join(process.cwd(), 'supabase-auth-config.sql');
  fs.writeFileSync(configPath, supabaseConfig);
  console.log(`✅ Đã tạo ${configPath}`);

  // Generate setup checklist
  console.log('\n📋 Tạo setup checklist...');
  
  const checklist = `# 🔐 Supabase Auth Setup Checklist

## Đã hoàn thành tự động:
- [x] Tạo file .env.local với credentials
- [x] Tạo SQL configuration script

## Cần thực hiện thủ công:

### 1. Supabase Dashboard Setup:
- [ ] Vào Authentication > Providers
- [ ] Enable và configure OAuth providers:
  ${googleClientId ? '- [x] Google OAuth' : '- [ ] Google OAuth (chưa có credentials)'}
  ${githubClientId ? '- [x] GitHub OAuth' : '- [ ] GitHub OAuth (chưa có credentials)'}
  ${facebookAppId ? '- [x] Facebook OAuth' : '- [ ] Facebook OAuth (chưa có credentials)'}
  ${twilioAccountSid ? '- [x] Twilio SMS' : '- [ ] Twilio SMS (chưa có credentials)'}

### 2. Database Migration:
- [ ] Copy nội dung từ database/migrations/add_2fa_support.sql
- [ ] Paste vào Supabase SQL Editor và execute
- [ ] Verify tables created: two_factor_auth, two_factor_attempts

### 3. RLS Policies:
- [ ] Copy nội dung từ supabase-auth-config.sql
- [ ] Execute trong Supabase SQL Editor
- [ ] Test permissions

### 4. Email Templates:
- [ ] Vào Authentication > Email Templates
- [ ] Customize Magic Link template (Vietnamese)
- [ ] Customize Reset Password template (Vietnamese)
- [ ] Test email delivery

### 5. URL Configuration:
- [ ] Vào Authentication > URL Configuration
- [ ] Set Site URL: http://localhost:3000
- [ ] Add Redirect URLs:
  - http://localhost:3000/auth/callback
  - http://localhost:3000/auth/verify-email  
  - http://localhost:3000/auth/reset-password

### 6. Testing:
- [ ] Test email/password login
- [ ] Test magic link login
- [ ] Test phone OTP (if configured)
- [ ] Test OAuth providers (if configured)
- [ ] Test 2FA setup and verification
- [ ] Test password reset flow

## Troubleshooting:
- Check console logs for errors
- Verify all environment variables are set
- Check Supabase project settings
- Test with different browsers/devices

## Next Steps:
1. Start development server: npm run dev
2. Test authentication flows
3. Configure production settings when ready
4. Set up monitoring and logging
`;

  const checklistPath = path.join(process.cwd(), 'SETUP-CHECKLIST.md');
  fs.writeFileSync(checklistPath, checklist);
  console.log(`✅ Đã tạo ${checklistPath}`);

  console.log('\n🎉 Setup hoàn tất!');
  console.log('\nNext steps:');
  console.log('1. Kiểm tra file .env.local đã được tạo');
  console.log('2. Làm theo SETUP-CHECKLIST.md');
  console.log('3. Run: npm run dev để test');
  
  rl.close();
}

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n👋 Setup cancelled by user');
  process.exit(0);
});

// Run the script
main().catch(console.error);
