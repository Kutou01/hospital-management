#!/usr/bin/env node

/**
 * Test Enhanced Trigger
 * Tests the new trigger and RPC functions with correct column structure
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEnhancedTrigger() {
  console.log('🧪 Testing Enhanced Trigger and RPC Functions...\n');

  // Test 1: Test RPC function for doctor
  console.log('📋 TEST 1: RPC Function - Doctor Creation');
  await testRPCDoctor();

  // Test 2: Test RPC function for patient
  console.log('\n📋 TEST 2: RPC Function - Patient Creation');
  await testRPCPatient();

  // Test 3: Test RPC function for admin
  console.log('\n📋 TEST 3: RPC Function - Admin Creation');
  await testRPCAdmin();

  // Test 4: Check results
  console.log('\n📋 TEST 4: Verify Results');
  await verifyResults();

  // Test 5: Cleanup
  console.log('\n📋 TEST 5: Cleanup Test Data');
  await cleanupTestData();
}

async function testRPCDoctor() {
  try {
    const { data, error } = await supabase.rpc('create_profile_with_role', {
      user_id: '11111111-1111-1111-1111-111111111111',
      user_email: 'test-doctor@example.com',
      user_name: 'Test Doctor',
      user_phone: '0123456789',
      user_role: 'doctor',
      user_gender: 'male',
      user_specialty: 'Cardiology',
      user_dob: '1990-01-01'
    });

    if (error) {
      console.log('❌ RPC Doctor Error:', error.message);
    } else {
      console.log('✅ RPC Doctor Success:', data);
    }
  } catch (err) {
    console.log('❌ RPC Doctor Exception:', err.message);
  }
}

async function testRPCPatient() {
  try {
    const { data, error } = await supabase.rpc('create_profile_with_role', {
      user_id: '22222222-2222-2222-2222-222222222222',
      user_email: 'test-patient@example.com',
      user_name: 'Test Patient',
      user_phone: '0987654321',
      user_role: 'patient',
      user_gender: 'female',
      user_dob: '1990-01-01'
    });

    if (error) {
      console.log('❌ RPC Patient Error:', error.message);
    } else {
      console.log('✅ RPC Patient Success:', data);
    }
  } catch (err) {
    console.log('❌ RPC Patient Exception:', err.message);
  }
}

async function testRPCAdmin() {
  try {
    const { data, error } = await supabase.rpc('create_profile_with_role', {
      user_id: '33333333-3333-3333-3333-333333333333',
      user_email: 'test-admin@example.com',
      user_name: 'Test Admin',
      user_phone: '0555666777',
      user_role: 'admin',
      user_gender: 'other'
    });

    if (error) {
      console.log('❌ RPC Admin Error:', error.message);
    } else {
      console.log('✅ RPC Admin Success:', data);
    }
  } catch (err) {
    console.log('❌ RPC Admin Exception:', err.message);
  }
}

async function verifyResults() {
  try {
    // Check profiles
    console.log('🔍 Checking Profiles:');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('email', ['test-doctor@example.com', 'test-patient@example.com', 'test-admin@example.com']);

    if (profilesError) {
      console.log('❌ Profiles Error:', profilesError.message);
    } else {
      console.log('✅ Profiles Found:', profiles?.length || 0);
      profiles?.forEach(p => console.log(`  - ${p.email} (${p.role})`));
    }

    // Check doctors
    console.log('\n🔍 Checking Doctors:');
    const { data: doctors, error: doctorsError } = await supabase
      .from('doctors')
      .select('*')
      .eq('profile_id', '11111111-1111-1111-1111-111111111111');

    if (doctorsError) {
      console.log('❌ Doctors Error:', doctorsError.message);
    } else {
      console.log('✅ Doctors Found:', doctors?.length || 0);
      doctors?.forEach(d => console.log(`  - ${d.full_name} (${d.specialization})`));
    }

    // Check patients
    console.log('\n🔍 Checking Patients:');
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*')
      .eq('profile_id', '22222222-2222-2222-2222-222222222222');

    if (patientsError) {
      console.log('❌ Patients Error:', patientsError.message);
    } else {
      console.log('✅ Patients Found:', patients?.length || 0);
      patients?.forEach(p => console.log(`  - ${p.full_name} (${p.gender})`));
    }

    // Check admins
    console.log('\n🔍 Checking Admins:');
    const { data: admins, error: adminsError } = await supabase
      .from('admins')
      .select('*')
      .eq('profile_id', '33333333-3333-3333-3333-333333333333');

    if (adminsError) {
      console.log('❌ Admins Error:', adminsError.message);
    } else {
      console.log('✅ Admins Found:', admins?.length || 0);
      admins?.forEach(a => console.log(`  - ${a.full_name} (${a.role_level})`));
    }

  } catch (err) {
    console.log('❌ Verify Exception:', err.message);
  }
}

async function cleanupTestData() {
  try {
    // Delete test profiles (will cascade to role tables if FK constraints exist)
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .in('email', ['test-doctor@example.com', 'test-patient@example.com', 'test-admin@example.com']);

    if (deleteError) {
      console.log('❌ Cleanup Error:', deleteError.message);
    } else {
      console.log('✅ Test data cleaned up successfully');
    }

  } catch (err) {
    console.log('❌ Cleanup Exception:', err.message);
  }
}

// Run the test
if (require.main === module) {
  testEnhancedTrigger()
    .then(() => {
      console.log('\n✅ Enhanced trigger test completed');
    })
    .catch((error) => {
      console.error('\n❌ Enhanced trigger test failed:', error);
      process.exit(1);
    });
}
