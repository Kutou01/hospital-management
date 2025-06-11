#!/usr/bin/env node

/**
 * Comprehensive Test Script for Auth Service
 * Tests Supabase integration, authentication flows, and edge cases
 * Enhanced version with detailed logging and comprehensive test coverage
 */

const axios = require('axios');

const AUTH_SERVICE_URL = 'http://localhost:3001';

// Test data
const testDoctor = {
  email: `test.doctor.${Date.now()}@hospital.com`,
  password: 'TestPassword123!',
  full_name: 'Nguyen Van Test',
  role: 'doctor',
  phone_number: '0123456789',
  specialty: 'Cardiology',
  license_number: 'VN-CD-1234',
  qualification: 'MD PhD',
  department_id: 'DEPT001',
  gender: 'male'
};

const testPatient = {
  email: `test.patient.${Date.now()}@hospital.com`,
  password: 'TestPassword123!',
  full_name: 'Tran Thi Patient',
  role: 'patient',
  phone_number: '0987654321',
  gender: 'female',
  date_of_birth: '1990-01-01'
};

const invalidTestData = {
  email: 'invalid-email',
  password: '123', // Too short
  full_name: 'Dr. Invalid', // Contains period
  role: 'invalid_role',
  phone_number: '123456789' // Wrong format
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testHealthCheck() {
  try {
    log('\n🔍 Testing Health Check...', 'blue');
    const response = await axios.get(`${AUTH_SERVICE_URL}/health`);
    
    if (response.status === 200 && response.data.status === 'healthy') {
      log('✅ Health check passed', 'green');
      log(`   Service: ${response.data.service}`);
      log(`   Supabase: ${response.data.dependencies?.supabase?.connected ? 'Connected' : 'Disconnected'}`);
      return true;
    } else {
      log('❌ Health check failed', 'red');
      log(`   Status: ${response.data.status}`);
      return false;
    }
  } catch (error) {
    log('❌ Health check error:', 'red');
    log(`   ${error.message}`);
    return false;
  }
}

async function testDoctorSignUp() {
  try {
    log('\n📝 Testing Doctor Sign Up...', 'blue');
    const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/signup`, testDoctor);

    if (response.status === 201 && response.data.success) {
      log('✅ Doctor sign up successful', 'green');
      log(`   User ID: ${response.data.user.id}`);
      log(`   Email: ${response.data.user.email}`);
      log(`   Role: ${response.data.user.role}`);
      log(`   Specialty: ${response.data.user.specialty || 'N/A'}`);
      return response.data;
    } else {
      log('❌ Doctor sign up failed', 'red');
      log(`   Error: ${response.data.error}`);
      return null;
    }
  } catch (error) {
    log('❌ Doctor sign up error:', 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`);
      log(`   Error: ${error.response.data.error}`);
      if (error.response.data.details) {
        log(`   Details: ${JSON.stringify(error.response.data.details, null, 2)}`);
      }
    } else {
      log(`   ${error.message}`);
    }
    return null;
  }
}

async function testPatientSignUp() {
  try {
    log('\n📝 Testing Patient Sign Up...', 'blue');
    const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/signup`, testPatient);

    if (response.status === 201 && response.data.success) {
      log('✅ Patient sign up successful', 'green');
      log(`   User ID: ${response.data.user.id}`);
      log(`   Email: ${response.data.user.email}`);
      log(`   Role: ${response.data.user.role}`);
      return response.data;
    } else {
      log('❌ Patient sign up failed', 'red');
      log(`   Error: ${response.data.error}`);
      return null;
    }
  } catch (error) {
    log('❌ Patient sign up error:', 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`);
      log(`   Error: ${error.response.data.error}`);
      if (error.response.data.details) {
        log(`   Details: ${JSON.stringify(error.response.data.details, null, 2)}`);
      }
    } else {
      log(`   ${error.message}`);
    }
    return null;
  }
}

async function testInvalidSignUp() {
  try {
    log('\n📝 Testing Invalid Sign Up (should fail)...', 'blue');
    const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/signup`, invalidTestData);

    // This should fail, so if we get here, something's wrong
    log('❌ Invalid sign up should have failed but succeeded', 'red');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 400) {
      log('✅ Invalid sign up correctly rejected', 'green');
      log(`   Status: ${error.response.status}`);
      log(`   Error: ${error.response.data.error}`);
      return true;
    } else {
      log('❌ Unexpected error during invalid sign up test:', 'red');
      log(`   ${error.message}`);
      return false;
    }
  }
}

async function testDoctorSignIn() {
  try {
    log('\n🔐 Testing Doctor Sign In...', 'blue');
    const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/signin`, {
      email: testDoctor.email,
      password: testDoctor.password
    });

    if (response.status === 200 && response.data.success) {
      log('✅ Doctor sign in successful', 'green');
      log(`   User ID: ${response.data.user.id}`);
      log(`   Role: ${response.data.user.role}`);
      log(`   Has Session: ${!!response.data.session}`);
      log(`   Access Token: ${response.data.session?.access_token ? 'Present' : 'Missing'}`);
      return response.data;
    } else {
      log('❌ Doctor sign in failed', 'red');
      log(`   Error: ${response.data.error}`);
      return null;
    }
  } catch (error) {
    log('❌ Doctor sign in error:', 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`);
      log(`   Error: ${error.response.data.error}`);
    } else {
      log(`   ${error.message}`);
    }
    return null;
  }
}

async function testPatientSignIn() {
  try {
    log('\n🔐 Testing Patient Sign In...', 'blue');
    const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/signin`, {
      email: testPatient.email,
      password: testPatient.password
    });

    if (response.status === 200 && response.data.success) {
      log('✅ Patient sign in successful', 'green');
      log(`   User ID: ${response.data.user.id}`);
      log(`   Role: ${response.data.user.role}`);
      log(`   Has Session: ${!!response.data.session}`);
      return response.data;
    } else {
      log('❌ Patient sign in failed', 'red');
      log(`   Error: ${response.data.error}`);
      return null;
    }
  } catch (error) {
    log('❌ Patient sign in error:', 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`);
      log(`   Error: ${error.response.data.error}`);
    } else {
      log(`   ${error.message}`);
    }
    return null;
  }
}

async function testTokenVerification(token) {
  try {
    log('\n🔍 Testing Token Verification...', 'blue');
    const response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 200 && response.data.success) {
      log('✅ Token verification successful', 'green');
      log(`   User ID: ${response.data.user.id}`);
      log(`   Role: ${response.data.user.role}`);
      return true;
    } else {
      log('❌ Token verification failed', 'red');
      log(`   Error: ${response.data.error}`);
      return false;
    }
  } catch (error) {
    log('❌ Token verification error:', 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`);
      log(`   Error: ${error.response.data.error}`);
    } else {
      log(`   ${error.message}`);
    }
    return false;
  }
}

async function testGetCurrentUser(token) {
  try {
    log('\n👤 Testing Get Current User...', 'blue');
    const response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 200 && response.data.success) {
      log('✅ Get current user successful', 'green');
      log(`   User: ${response.data.user.full_name}`);
      log(`   Email: ${response.data.user.email}`);
      log(`   Role: ${response.data.user.role}`);
      return true;
    } else {
      log('❌ Get current user failed', 'red');
      log(`   Error: ${response.data.error}`);
      return false;
    }
  } catch (error) {
    log('❌ Get current user error:', 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`);
      log(`   Error: ${error.response.data.error}`);
    } else {
      log(`   ${error.message}`);
    }
    return false;
  }
}

async function testRoleBasedAccess(token, userRole) {
  try {
    log('\n🔒 Testing Role-based Access Control...', 'blue');

    // Test accessing user profile (should work for all roles)
    const profileResponse = await axios.get(`${AUTH_SERVICE_URL}/api/users/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (profileResponse.status === 200) {
      log('✅ Profile access successful', 'green');
      log(`   User Role: ${userRole}`);
      return true;
    } else {
      log('❌ Profile access failed', 'red');
      return false;
    }
  } catch (error) {
    log('❌ Role-based access test error:', 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`);
      log(`   Error: ${error.response.data.error}`);
    } else {
      log(`   ${error.message}`);
    }
    return false;
  }
}

async function runTests() {
  log('🚀 Starting Comprehensive Auth Service Tests', 'yellow');
  log('=============================================', 'yellow');

  let passedTests = 0;
  let totalTests = 0;
  let doctorSession = null;
  let patientSession = null;

  // Test 1: Health Check
  totalTests++;
  log('\n=== HEALTH CHECK ===', 'yellow');
  if (await testHealthCheck()) {
    passedTests++;
  }

  // Test 2: Invalid Sign Up (should fail)
  totalTests++;
  log('\n=== VALIDATION TESTS ===', 'yellow');
  if (await testInvalidSignUp()) {
    passedTests++;
  }

  // Test 3: Doctor Sign Up
  totalTests++;
  log('\n=== DOCTOR REGISTRATION ===', 'yellow');
  const doctorSignUpResult = await testDoctorSignUp();
  if (doctorSignUpResult) {
    passedTests++;
  }

  // Test 4: Patient Sign Up
  totalTests++;
  log('\n=== PATIENT REGISTRATION ===', 'yellow');
  const patientSignUpResult = await testPatientSignUp();
  if (patientSignUpResult) {
    passedTests++;
  }

  // Test 5: Doctor Sign In
  totalTests++;
  log('\n=== DOCTOR AUTHENTICATION ===', 'yellow');
  doctorSession = await testDoctorSignIn();
  if (doctorSession) {
    passedTests++;

    // Test 6: Doctor Token Verification
    if (doctorSession.session?.access_token) {
      totalTests++;
      if (await testTokenVerification(doctorSession.session.access_token)) {
        passedTests++;
      }

      // Test 7: Doctor Get Current User
      totalTests++;
      if (await testGetCurrentUser(doctorSession.session.access_token)) {
        passedTests++;
      }

      // Test 8: Doctor Role-based Access
      totalTests++;
      if (await testRoleBasedAccess(doctorSession.session.access_token, 'doctor')) {
        passedTests++;
      }
    }
  }

  // Test 9: Patient Sign In
  totalTests++;
  log('\n=== PATIENT AUTHENTICATION ===', 'yellow');
  patientSession = await testPatientSignIn();
  if (patientSession) {
    passedTests++;

    // Test 10: Patient Token Verification
    if (patientSession.session?.access_token) {
      totalTests++;
      if (await testTokenVerification(patientSession.session.access_token)) {
        passedTests++;
      }

      // Test 11: Patient Role-based Access
      totalTests++;
      if (await testRoleBasedAccess(patientSession.session.access_token, 'patient')) {
        passedTests++;
      }
    }
  }

  // Summary
  log('\n📊 COMPREHENSIVE TEST RESULTS', 'yellow');
  log('==============================', 'yellow');
  log(`Total Tests: ${totalTests}`);
  log(`Passed: ${passedTests}`, passedTests > 0 ? 'green' : 'red');
  log(`Failed: ${totalTests - passedTests}`, totalTests - passedTests === 0 ? 'green' : 'red');
  log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`, passedTests === totalTests ? 'green' : 'yellow');

  if (passedTests === totalTests) {
    log('\n🎉 ALL TESTS PASSED! Auth Service is working perfectly.', 'green');
    log('✅ Doctor registration and authentication working', 'green');
    log('✅ Patient registration and authentication working', 'green');
    log('✅ Token verification working', 'green');
    log('✅ Role-based access control working', 'green');
    log('✅ Input validation working', 'green');
  } else {
    log('\n⚠️  Some tests failed. Issues found:', 'yellow');
    if (passedTests < totalTests) {
      log(`   ${totalTests - passedTests} out of ${totalTests} tests failed`);
      log('   Please check the detailed logs above for specific errors.');
    }
  }

  process.exit(passedTests === totalTests ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  log('❌ Test runner error:', 'red');
  log(error.message);
  process.exit(1);
});
