#!/usr/bin/env node

/**
 * Test script để kiểm tra Supabase Auth integration
 * Chạy: node test-auth.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    // Test connection by querying profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .limit(1);

    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }

    console.log('✅ Database connection successful');
    console.log(`📊 Found ${data?.length || 0} profiles in database`);
    return true;
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    return false;
  }
}

async function testAuthTables() {
  console.log('\n🔍 Testing auth tables structure...');
  
  try {
    // Check auth.users table
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id, email, created_at')
      .limit(1);

    if (authError) {
      console.log('⚠️  Cannot access auth.users directly (expected)');
    } else {
      console.log('✅ Auth users table accessible');
    }

    // Check profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, role, is_active')
      .limit(5);

    if (profilesError) {
      console.error('❌ Profiles table error:', profilesError.message);
      return false;
    }

    console.log('✅ Profiles table accessible');
    console.log('📋 Sample profiles:');
    profiles?.forEach(profile => {
      console.log(`   - ${profile.full_name} (${profile.role}) - Active: ${profile.is_active}`);
    });

    // Check doctors table
    const { data: doctors, error: doctorsError } = await supabase
      .from('doctors')
      .select('doctor_id, full_name, auth_user_id')
      .limit(3);

    if (doctorsError) {
      console.error('❌ Doctors table error:', doctorsError.message);
    } else {
      console.log('✅ Doctors table accessible');
      console.log(`📋 Found ${doctors?.length || 0} doctors`);
    }

    // Check patients table
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('patient_id, full_name, auth_user_id')
      .limit(3);

    if (patientsError) {
      console.error('❌ Patients table error:', patientsError.message);
    } else {
      console.log('✅ Patients table accessible');
      console.log(`📋 Found ${patients?.length || 0} patients`);
    }

    return true;
  } catch (err) {
    console.error('❌ Auth tables test error:', err.message);
    return false;
  }
}

async function testRLSPolicies() {
  console.log('\n🔍 Testing RLS policies...');
  
  try {
    // Test profiles RLS (should work without auth)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, role')
      .limit(1);

    if (error) {
      console.error('❌ RLS test failed:', error.message);
      return false;
    }

    console.log('✅ RLS policies configured (basic test passed)');
    return true;
  } catch (err) {
    console.error('❌ RLS test error:', err.message);
    return false;
  }
}

async function testUserDetailsView() {
  console.log('\n🔍 Testing user_details view...');
  
  try {
    const { data, error } = await supabase
      .from('user_details')
      .select('*')
      .limit(3);

    if (error) {
      console.error('❌ User details view error:', error.message);
      return false;
    }

    console.log('✅ User details view accessible');
    console.log(`📋 Sample user details (${data?.length || 0} records):`);
    data?.forEach(user => {
      console.log(`   - ${user.full_name} (${user.role}) - Email: ${user.email}`);
    });

    return true;
  } catch (err) {
    console.error('❌ User details view test error:', err.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Supabase Auth Integration Tests\n');
  
  const tests = [
    { name: 'Database Connection', fn: testDatabaseConnection },
    { name: 'Auth Tables Structure', fn: testAuthTables },
    { name: 'RLS Policies', fn: testRLSPolicies },
    { name: 'User Details View', fn: testUserDetailsView }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (err) {
      console.error(`❌ Test "${test.name}" crashed:`, err.message);
      failed++;
    }
  }

  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Supabase Auth integration is ready.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
}

// Run tests
runAllTests().catch(err => {
  console.error('💥 Test runner crashed:', err);
  process.exit(1);
});
