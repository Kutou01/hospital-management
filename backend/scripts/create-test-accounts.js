#!/usr/bin/env node

/**
 * Create Test Accounts for Hospital Management System
 * This script creates test accounts in Supabase Auth and links them to the profiles table
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Color logging
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test accounts configuration
const testAccounts = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'admin@hospital.com',
    password: 'Admin123!@#',
    full_name: 'Nguyễn Văn Admin',
    phone_number: '0901234567',
    role: 'admin'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'doctor1@hospital.com',
    password: 'Doctor123!@#',
    full_name: 'Bác sĩ Nguyễn Văn A',
    phone_number: '0901234568',
    role: 'doctor'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'doctor2@hospital.com',
    password: 'Doctor123!@#',
    full_name: 'Bác sĩ Trần Thị B',
    phone_number: '0901234569',
    role: 'doctor'
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    email: 'patient1@gmail.com',
    password: 'Patient123!@#',
    full_name: 'Nguyễn Thị Hoa',
    phone_number: '0901234573',
    role: 'patient'
  },
  {
    id: '88888888-8888-8888-8888-888888888888',
    email: 'patient2@gmail.com',
    password: 'Patient123!@#',
    full_name: 'Trần Văn Nam',
    phone_number: '0901234574',
    role: 'patient'
  }
];

async function createTestAccounts() {
  log('cyan', '🏥 Creating Test Accounts for Hospital Management System');
  log('cyan', '='.repeat(60));

  // Validate environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    log('red', '❌ Missing required environment variables:');
    log('red', '   SUPABASE_URL');
    log('red', '   SUPABASE_SERVICE_ROLE_KEY');
    log('yellow', '💡 Make sure your .env file is configured correctly');
    process.exit(1);
  }

  // Initialize Supabase client with service role key
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  log('blue', '🔗 Testing Supabase connection...');
  
  try {
    // Test connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Connection failed: ${error.message}`);
    }

    log('green', '✅ Supabase connection successful');
  } catch (error) {
    log('red', `❌ Connection failed: ${error.message}`);
    process.exit(1);
  }

  // Create accounts
  let successCount = 0;
  let errorCount = 0;

  for (const account of testAccounts) {
    try {
      log('blue', `\n👤 Creating ${account.role} account: ${account.email}`);

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: {
          full_name: account.full_name,
          role: account.role
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          log('yellow', `⚠️  User ${account.email} already exists in Auth`);
          
          // Try to get existing user
          const { data: existingUsers } = await supabase.auth.admin.listUsers();
          const existingUser = existingUsers.users.find(u => u.email === account.email);
          
          if (existingUser) {
            log('blue', `🔄 Using existing user ID: ${existingUser.id}`);
            
            // Update or insert profile
            const { error: profileError } = await supabase
              .from('profiles')
              .upsert({
                id: existingUser.id,
                email: account.email,
                full_name: account.full_name,
                phone_number: account.phone_number,
                role: account.role,
                is_active: true,
                email_verified: true
              });

            if (profileError) {
              log('red', `❌ Profile error: ${profileError.message}`);
              errorCount++;
            } else {
              log('green', `✅ Profile updated for ${account.email}`);
              successCount++;
            }
          }
        } else {
          throw authError;
        }
      } else {
        log('green', `✅ Auth user created: ${authData.user.id}`);

        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: account.email,
            full_name: account.full_name,
            phone_number: account.phone_number,
            role: account.role,
            is_active: true,
            email_verified: true
          });

        if (profileError) {
          log('red', `❌ Profile creation failed: ${profileError.message}`);
          errorCount++;
        } else {
          log('green', `✅ Profile created for ${account.email}`);
          successCount++;
        }
      }

    } catch (error) {
      log('red', `❌ Failed to create ${account.email}: ${error.message}`);
      errorCount++;
    }
  }

  // Summary
  log('cyan', '\n' + '='.repeat(60));
  log('green', `✅ Successfully created/updated: ${successCount} accounts`);
  if (errorCount > 0) {
    log('red', `❌ Failed: ${errorCount} accounts`);
  }

  // Display login credentials
  log('cyan', '\n📋 TEST ACCOUNT CREDENTIALS:');
  log('cyan', '='.repeat(40));
  
  testAccounts.forEach(account => {
    log('white', `\n${account.role.toUpperCase()} ACCOUNT:`);
    log('blue', `  Email: ${account.email}`);
    log('blue', `  Password: ${account.password}`);
    log('blue', `  Name: ${account.full_name}`);
  });

  log('cyan', '\n🌐 LOGIN URLS:');
  log('blue', '  Frontend: http://localhost:3000/auth/login');
  log('blue', '  Admin Dashboard: http://localhost:3000/admin/dashboard');
  log('blue', '  Doctor Dashboard: http://localhost:3000/doctor/dashboard');
  log('blue', '  Patient Dashboard: http://localhost:3000/patient/dashboard');

  log('cyan', '\n💡 NEXT STEPS:');
  log('yellow', '1. Run the sample data script in Supabase SQL Editor:');
  log('white', '   backend/scripts/insert-sample-data.sql');
  log('yellow', '2. Start the frontend development server:');
  log('white', '   cd frontend && npm run dev');
  log('yellow', '3. Test login with the credentials above');

  process.exit(0);
}

// Run the script
if (require.main === module) {
  createTestAccounts().catch(error => {
    log('red', `❌ Script failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
}

module.exports = { createTestAccounts };
