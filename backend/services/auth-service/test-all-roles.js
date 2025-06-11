#!/usr/bin/env node

/**
 * Test all roles (patient, doctor, admin) in Auth Service
 */

const axios = require('axios');

const AUTH_SERVICE_URL = 'http://localhost:3001';

// Test data for different roles
const testUsers = {
  patient: {
    email: 'test.patient.all@example.com',
    password: 'TestPassword123',
    full_name: 'Test Patient All',
    role: 'patient',
    phone_number: '0901234567',
    gender: 'male',
    date_of_birth: '1990-01-01',
    address: '123 Patient Street, Test City',
    blood_type: 'A+',
    emergency_contact: {
      name: 'Emergency Contact',
      phone: '0987654321',
      relationship: 'Family'
    }
  },
  doctor: {
    email: 'test.doctor.all@example.com',
    password: 'TestPassword123',
    full_name: 'Test Doctor All',
    role: 'doctor',
    phone_number: '0901234568',
    gender: 'female',
    specialty: 'Cardiology',
    license_number: 'VN-HN-1234',
    qualification: 'Tiến sĩ',
    department_id: 'DEPT-202506-001'
  },
  admin: {
    email: 'test.admin.all@example.com',
    password: 'TestPassword123',
    full_name: 'Test Admin All',
    role: 'admin',
    phone_number: '0901234569',
    gender: 'other'
  }
};

async function testRole(role, userData) {
  console.log(`\n🧪 Testing ${role.toUpperCase()} role...\n`);

  try {
    // 1. Register
    console.log(`1️⃣ Registering ${role}...`);
    try {
      const signUpResponse = await axios.post(`${AUTH_SERVICE_URL}/api/auth/signup`, userData);
      console.log(`✅ ${role} registration successful`);
      console.log(`   User ID: ${signUpResponse.data.user.id}`);
      console.log(`   Role: ${signUpResponse.data.user.role}`);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log(`ℹ️ ${role} already exists, continuing with login test...`);
      } else {
        console.log(`❌ ${role} registration failed:`, error.response?.data?.error || error.message);
        return false;
      }
    }

    // 2. Login
    console.log(`2️⃣ Testing ${role} login...`);
    const signInResponse = await axios.post(`${AUTH_SERVICE_URL}/api/auth/signin`, {
      email: userData.email,
      password: userData.password
    });
    
    console.log(`✅ ${role} login successful`);
    const user = signInResponse.data.user;
    console.log(`   User: ${user.full_name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Phone: ${user.phone_number}`);
    
    // Check role-specific ID
    if (role === 'patient' && user.patient_id) {
      console.log(`   Patient ID: ${user.patient_id}`);
    } else if (role === 'doctor' && user.doctor_id) {
      console.log(`   Doctor ID: ${user.doctor_id}`);
    } else if (role === 'admin' && user.admin_id) {
      console.log(`   Admin ID: ${user.admin_id}`);
    } else {
      console.log(`   ⚠️ ${role}_id not found in response`);
    }

    // 3. Token verification
    const accessToken = signInResponse.data.access_token;
    console.log(`3️⃣ Testing ${role} token verification...`);
    const verifyResponse = await axios.get(`${AUTH_SERVICE_URL}/api/auth/verify`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    console.log(`✅ ${role} token verification successful`);
    const verifiedUser = verifyResponse.data.user;
    
    // Check role-specific ID in verification
    if (role === 'patient' && verifiedUser.patient_id) {
      console.log(`   Verified Patient ID: ${verifiedUser.patient_id}`);
    } else if (role === 'doctor' && verifiedUser.doctor_id) {
      console.log(`   Verified Doctor ID: ${verifiedUser.doctor_id}`);
    } else if (role === 'admin' && verifiedUser.admin_id) {
      console.log(`   Verified Admin ID: ${verifiedUser.admin_id}`);
    } else {
      console.log(`   ⚠️ ${role}_id not found in verification response`);
    }

    // 4. Logout
    console.log(`4️⃣ Testing ${role} logout...`);
    const logoutResponse = await axios.post(`${AUTH_SERVICE_URL}/api/auth/signout`, {}, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log(`✅ ${role} logout successful`);

    return true;

  } catch (error) {
    console.error(`❌ ${role} test failed:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    return false;
  }
}

async function testAllRoles() {
  console.log('🧪 Testing All Roles in Auth Service...\n');
  console.log('=' * 60);

  const results = {};

  // Test each role
  for (const [role, userData] of Object.entries(testUsers)) {
    results[role] = await testRole(role, userData);
    console.log('\n' + '─'.repeat(60));
  }

  // Summary
  console.log('\n🎉 ALL ROLES TEST SUMMARY');
  console.log('=' * 60);
  
  for (const [role, success] of Object.entries(results)) {
    const status = success ? '✅ PASSED' : '❌ FAILED';
    console.log(`   ${role.toUpperCase()}: ${status}`);
  }

  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🚀 ALL TESTS PASSED! Auth Service supports all roles correctly.');
    console.log('\n📝 Next steps:');
    console.log('   1. Test frontend integration for all roles');
    console.log('   2. Test role-specific dashboards');
    console.log('   3. Test role-based access control');
  } else {
    console.log('\n❌ Some tests failed. Please check the errors above.');
  }
}

// Run tests
testAllRoles().catch(console.error);
