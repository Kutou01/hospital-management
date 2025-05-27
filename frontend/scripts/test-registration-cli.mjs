/**
 * CLI Test script để kiểm tra việc đăng ký user patient và doctor
 * Chạy: node scripts/test-registration-cli.mjs
 */

import { createClient } from '@supabase/supabase-js';

// Supabase config (hardcoded for CLI testing)
const supabaseUrl = 'https://ciasxktujslgsdgylimv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpYXN4a3R1anNsZ3NkZ3lsaW12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NTU1NjUsImV4cCI6MjA2MzEzMTU2NX0.fd7UdZk2mZsV1K0vKM8V9YWKcfyEY1fr4Q9OQvHd8UQ';

const supabase = createClient(supabaseUrl, supabaseKey);

// Test data với timestamp để tránh duplicate
const timestamp = Date.now();
const testDoctorData = {
  email: `test.doctor.${timestamp}@hospital.com`,
  password: 'TestPassword123!',
  full_name: 'Bác sĩ CLI Test',
  phone_number: '0901234567',
  role: 'doctor',
  specialty: 'Nội khoa',
  license_number: `BS${timestamp}`,
  qualification: 'Thạc sĩ Y khoa'
};

const testPatientData = {
  email: `test.patient.${timestamp}@hospital.com`,
  password: 'TestPassword123!',
  full_name: 'Bệnh nhân CLI Test',
  phone_number: '0907654321',
  role: 'patient',
  date_of_birth: '1990-01-15',
  gender: 'female',
  address: '123 Đường Test, Quận 1, TP.HCM'
};

// Utility function để log với timestamp
function log(message) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${message}`);
}

// Test doctor registration
async function testDoctorRegistration() {
  log('\n🧪 === TESTING DOCTOR REGISTRATION ===');
  log(`📝 Doctor data: ${testDoctorData.email}, ${testDoctorData.full_name}, ${testDoctorData.specialty}`);

  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testDoctorData.email,
      password: testDoctorData.password,
      options: {
        data: {
          full_name: testDoctorData.full_name,
          role: testDoctorData.role,
          phone_number: testDoctorData.phone_number
        }
      }
    });

    if (authError) {
      log(`❌ Auth error: ${authError.message}`);
      return false;
    }

    if (!authData.user) {
      log('❌ No user created');
      return false;
    }

    log(`✅ Auth user created: ${authData.user.id}`);

    // 2. Wait for trigger to create profile
    log('⏳ Waiting for profile creation...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Check if profile was created
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profileData) {
      log(`❌ Profile not created: ${profileError?.message}`);
      return false;
    }

    log(`✅ Profile created: ${profileData.id}, role: ${profileData.role}`);

    // 4. Create doctor profile manually (since we're testing CLI)
    const { data: departments } = await supabase
      .from('departments')
      .select('department_id')
      .limit(1)
      .single();

    const doctorData = {
      profile_id: authData.user.id,
      license_number: testDoctorData.license_number,
      specialization: testDoctorData.specialty,
      qualification: testDoctorData.qualification,
      experience_years: 0,
      consultation_fee: null,
      department_id: departments?.department_id || 'DEPT001',
      status: 'active',
      bio: null,
      languages_spoken: null,
      working_hours: {}
    };

    const { data: doctorResult, error: doctorError } = await supabase
      .from('doctors')
      .insert([doctorData])
      .select()
      .single();

    if (doctorError) {
      log(`❌ Doctor profile creation failed: ${doctorError.message}`);
      return false;
    }

    log(`✅ Doctor profile created: ${doctorResult.doctor_id}`);
    return true;

  } catch (error) {
    log(`❌ Exception: ${error.message}`);
    return false;
  }
}

// Test patient registration
async function testPatientRegistration() {
  log('\n🧪 === TESTING PATIENT REGISTRATION ===');
  log(`📝 Patient data: ${testPatientData.email}, ${testPatientData.full_name}`);

  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testPatientData.email,
      password: testPatientData.password,
      options: {
        data: {
          full_name: testPatientData.full_name,
          role: testPatientData.role,
          phone_number: testPatientData.phone_number
        }
      }
    });

    if (authError) {
      log(`❌ Auth error: ${authError.message}`);
      return false;
    }

    if (!authData.user) {
      log('❌ No user created');
      return false;
    }

    log(`✅ Auth user created: ${authData.user.id}`);

    // 2. Wait for trigger to create profile
    log('⏳ Waiting for profile creation...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Check if profile was created
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profileData) {
      log(`❌ Profile not created: ${profileError?.message}`);
      return false;
    }

    log(`✅ Profile created: ${profileData.id}, role: ${profileData.role}`);

    // 4. Create patient profile manually
    const patientData = {
      profile_id: authData.user.id,
      date_of_birth: testPatientData.date_of_birth,
      gender: testPatientData.gender,
      address: { street: testPatientData.address },
      emergency_contact: {},
      insurance_info: {},
      allergies: [],
      chronic_conditions: [],
      medical_notes: 'Test patient created via CLI'
    };

    const { data: patientResult, error: patientError } = await supabase
      .from('patients')
      .insert([patientData])
      .select()
      .single();

    if (patientError) {
      log(`❌ Patient profile creation failed: ${patientError.message}`);
      return false;
    }

    log(`✅ Patient profile created: ${patientResult.patient_id}`);
    return true;

  } catch (error) {
    log(`❌ Exception: ${error.message}`);
    return false;
  }
}

// Test login
async function testLogin(email, password, userType) {
  log(`\n🔐 === TESTING ${userType.toUpperCase()} LOGIN ===`);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      log(`❌ Login failed: ${error.message}`);
      return false;
    }

    if (!data.user || !data.session) {
      log('❌ No user or session');
      return false;
    }

    log(`✅ Login successful: ${data.user.id}`);

    // Sign out immediately
    await supabase.auth.signOut();
    log('🚪 Signed out');

    return true;

  } catch (error) {
    log(`❌ Exception: ${error.message}`);
    return false;
  }
}

// Cleanup function
async function cleanupTestUsers() {
  log('\n🧹 === CLEANUP TEST USERS ===');
  log('⚠️  Manual cleanup required in Supabase dashboard:');
  log(`   - Delete auth user: ${testDoctorData.email}`);
  log(`   - Delete auth user: ${testPatientData.email}`);
  log('   - Check profiles, doctors, and patients tables');
}

// Main test function
async function runAllTests() {
  log('🚀 === HOSPITAL MANAGEMENT CLI REGISTRATION TESTS ===');
  log(`⏰ Started at: ${new Date().toLocaleString()}`);

  const results = {
    doctorRegistration: false,
    patientRegistration: false,
    doctorLogin: false,
    patientLogin: false
  };

  try {
    // Test 1: Doctor Registration
    results.doctorRegistration = await testDoctorRegistration();
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Patient Registration
    results.patientRegistration = await testPatientRegistration();
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 3: Doctor Login
    if (results.doctorRegistration) {
      results.doctorLogin = await testLogin(testDoctorData.email, testDoctorData.password, 'doctor');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Test 4: Patient Login
    if (results.patientRegistration) {
      results.patientLogin = await testLogin(testPatientData.email, testPatientData.password, 'patient');
    }

    // Summary
    log('\n📊 === TEST RESULTS SUMMARY ===');
    log(`Doctor Registration: ${results.doctorRegistration ? '✅ PASS' : '❌ FAIL'}`);
    log(`Patient Registration: ${results.patientRegistration ? '✅ PASS' : '❌ FAIL'}`);
    log(`Doctor Login: ${results.doctorLogin ? '✅ PASS' : '❌ FAIL'}`);
    log(`Patient Login: ${results.patientLogin ? '✅ PASS' : '❌ FAIL'}`);

    const passCount = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;

    log(`\n🎯 Overall: ${passCount}/${totalTests} tests passed`);

    if (passCount === totalTests) {
      log('🎉 All tests passed! Registration system is working correctly.');
    } else {
      log('⚠️  Some tests failed. Please check the errors above.');
    }

    await cleanupTestUsers();

  } catch (error) {
    log(`💥 Test suite failed: ${error.message}`);
  }

  log(`⏰ Completed at: ${new Date().toLocaleString()}`);
}

// Run tests
runAllTests().catch(console.error);
