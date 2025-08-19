#!/usr/bin/env node

/**
 * 🧪 COMPREHENSIVE LOGIN & REGISTER TEST SCRIPT
 * 
 * Tests all authentication flows for Hospital Management System
 * - Doctor Registration & Login
 * - Patient Registration & Login  
 * - Admin Registration & Login
 * - Error handling & Edge cases
 * - Token validation & Session management
 * - Performance testing
 * 
 * Usage: node test-login-register-comprehensive.js
 */

const axios = require('axios');
const crypto = require('crypto');

// Configuration
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const TEST_TIMEOUT = 10000; // 10 seconds
const PERFORMANCE_ITERATIONS = 5;

// Test Statistics
let testStats = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  startTime: Date.now(),
  endTime: null
};

// Color logging utility
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function logTest(testName, status, details = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'SKIP' ? '⏭️' : '🔄';
  const color = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : status === 'SKIP' ? 'yellow' : 'blue';
  log(`${icon} ${testName} - ${status}${details ? ': ' + details : ''}`, color);
}

// Generate unique test data
function generateTestData(role = 'patient') {
  const timestamp = Date.now();
  const randomId = crypto.randomBytes(4).toString('hex');

  // Generate valid Vietnamese names without numbers
  const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng'];
  const lastNames = ['Văn An', 'Thị Bình', 'Minh Châu', 'Hoàng Dung', 'Quốc Hùng', 'Thị Lan', 'Văn Nam', 'Thị Oanh'];
  const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];

  const baseData = {
    email: `test.${role}.${timestamp}.${randomId}@hospital.com`,
    password: 'TestPassword123!',
    full_name: `${randomFirstName} ${randomLastName}`,
    phone_number: `09${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    role: role,
    gender: Math.random() > 0.5 ? 'male' : 'female'
  };

  // Add role-specific data
  if (role === 'doctor') {
    return {
      ...baseData,
      specialty: 'Cardiology',  // Required field for doctors
      license_number: `VN-CD-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      qualification: 'MD PhD',
      department_id: 'DEPT001'
    };
  } else if (role === 'patient') {
    return {
      ...baseData,
      date_of_birth: '1990-01-01',
      blood_type: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'][Math.floor(Math.random() * 8)]
    };
  } else if (role === 'admin') {
    return {
      ...baseData
    };
  }

  return baseData;
}

// HTTP request wrapper with timeout and error handling
async function makeRequest(method, url, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${AUTH_SERVICE_URL}${url}`,
      timeout: TEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

// Test Functions
async function testHealthCheck() {
  testStats.total++;
  log('\n🏥 Testing Health Check...', 'blue');
  
  const result = await makeRequest('GET', '/health');
  
  if (result.success && result.data.status === 'healthy') {
    testStats.passed++;
    logTest('Health Check', 'PASS', 'Service is healthy');
    return true;
  } else {
    testStats.failed++;
    logTest('Health Check', 'FAIL', result.error?.message || 'Service unhealthy');
    return false;
  }
}

async function testDoctorRegistration() {
  testStats.total++;
  log('\n👨‍⚕️ Testing Doctor Registration...', 'blue');
  
  const doctorData = generateTestData('doctor');
  log(`📧 Email: ${doctorData.email}`, 'cyan');
  log(`👨‍⚕️ Name: ${doctorData.full_name}`, 'cyan');
  log(`🏥 Department: ${doctorData.department_id}`, 'cyan');
  log(`📋 License: ${doctorData.license_number}`, 'cyan');
  
  const result = await makeRequest('POST', '/api/auth/signup', doctorData);
  
  if (result.success && result.data.success) {
    testStats.passed++;
    logTest('Doctor Registration', 'PASS', `User ID: ${result.data.user?.id}`);
    return { success: true, data: doctorData, response: result.data };
  } else {
    testStats.failed++;
    logTest('Doctor Registration', 'FAIL', result.error?.error || 'Registration failed');
    return { success: false, error: result.error };
  }
}

async function testPatientRegistration() {
  testStats.total++;
  log('\n🏥 Testing Patient Registration...', 'blue');
  
  const patientData = generateTestData('patient');
  log(`📧 Email: ${patientData.email}`, 'cyan');
  log(`👤 Name: ${patientData.full_name}`, 'cyan');
  log(`🩸 Blood Type: ${patientData.blood_type}`, 'cyan');
  
  const result = await makeRequest('POST', '/api/auth/signup', patientData);
  
  if (result.success && result.data.success) {
    testStats.passed++;
    logTest('Patient Registration', 'PASS', `User ID: ${result.data.user?.id}`);
    return { success: true, data: patientData, response: result.data };
  } else {
    testStats.failed++;
    logTest('Patient Registration', 'FAIL', result.error?.error || 'Registration failed');
    return { success: false, error: result.error };
  }
}

async function testAdminRegistration() {
  testStats.total++;
  log('\n👑 Testing Admin Registration...', 'blue');
  
  const adminData = generateTestData('admin');
  log(`📧 Email: ${adminData.email}`, 'cyan');
  log(`👤 Name: ${adminData.full_name}`, 'cyan');
  
  const result = await makeRequest('POST', '/api/auth/signup', adminData);
  
  if (result.success && result.data.success) {
    testStats.passed++;
    logTest('Admin Registration', 'PASS', `User ID: ${result.data.user?.id}`);
    return { success: true, data: adminData, response: result.data };
  } else {
    testStats.failed++;
    logTest('Admin Registration', 'FAIL', result.error?.error || 'Registration failed');
    return { success: false, error: result.error };
  }
}

async function testLogin(userData, userType) {
  testStats.total++;
  log(`\n🔐 Testing ${userType} Login...`, 'blue');
  
  const loginData = {
    email: userData.email,
    password: userData.password
  };
  
  const result = await makeRequest('POST', '/api/auth/signin', loginData);
  
  if (result.success && result.data.success) {
    testStats.passed++;
    logTest(`${userType} Login`, 'PASS', `Token: ${result.data.session?.access_token ? 'Present' : 'Missing'}`);
    return { success: true, response: result.data };
  } else {
    testStats.failed++;
    logTest(`${userType} Login`, 'FAIL', result.error?.error || 'Login failed');
    return { success: false, error: result.error };
  }
}

async function testInvalidLogin() {
  testStats.total++;
  log('\n❌ Testing Invalid Login...', 'blue');
  
  const invalidData = {
    email: 'nonexistent@hospital.com',
    password: 'wrongpassword'
  };
  
  const result = await makeRequest('POST', '/api/auth/signin', invalidData);
  
  // This should fail - we expect a 401 or 400 status
  if (!result.success && (result.status === 401 || result.status === 400)) {
    testStats.passed++;
    logTest('Invalid Login', 'PASS', 'Correctly rejected invalid credentials');
    return true;
  } else {
    testStats.failed++;
    logTest('Invalid Login', 'FAIL', 'Should have rejected invalid credentials');
    return false;
  }
}

async function testDuplicateRegistration(userData) {
  testStats.total++;
  log('\n🔄 Testing Duplicate Registration...', 'blue');
  
  const result = await makeRequest('POST', '/api/auth/signup', userData);
  
  // This should fail - we expect a 409 or 400 status for duplicate email
  if (!result.success && (result.status === 409 || result.status === 400)) {
    testStats.passed++;
    logTest('Duplicate Registration', 'PASS', 'Correctly rejected duplicate email');
    return true;
  } else {
    testStats.failed++;
    logTest('Duplicate Registration', 'FAIL', 'Should have rejected duplicate email');
    return false;
  }
}

async function testTokenValidation(token) {
  testStats.total++;
  log('\n🔑 Testing Token Validation...', 'blue');
  
  const result = await makeRequest('POST', '/api/auth/verify-token', null, {
    'Authorization': `Bearer ${token}`
  });
  
  if (result.success && result.data.success) {
    testStats.passed++;
    logTest('Token Validation', 'PASS', 'Token is valid');
    return true;
  } else {
    testStats.failed++;
    logTest('Token Validation', 'FAIL', 'Token validation failed');
    return false;
  }
}

async function testLogout(token) {
  testStats.total++;
  log('\n🚪 Testing Logout...', 'blue');
  
  const result = await makeRequest('POST', '/api/auth/signout', null, {
    'Authorization': `Bearer ${token}`
  });
  
  if (result.success && result.data.success) {
    testStats.passed++;
    logTest('Logout', 'PASS', 'Successfully logged out');
    return true;
  } else {
    testStats.failed++;
    logTest('Logout', 'FAIL', 'Logout failed');
    return false;
  }
}

// Performance testing
async function testPerformance() {
  log('\n⚡ Running Performance Tests...', 'yellow');
  
  const performanceResults = {
    registration: [],
    login: []
  };
  
  for (let i = 0; i < PERFORMANCE_ITERATIONS; i++) {
    // Test registration performance
    const regStart = Date.now();
    const userData = generateTestData('patient');
    await makeRequest('POST', '/api/auth/signup', userData);
    const regEnd = Date.now();
    performanceResults.registration.push(regEnd - regStart);
    
    // Test login performance
    const loginStart = Date.now();
    await makeRequest('POST', '/api/auth/signin', {
      email: userData.email,
      password: userData.password
    });
    const loginEnd = Date.now();
    performanceResults.login.push(loginEnd - loginStart);
  }
  
  const avgRegTime = performanceResults.registration.reduce((a, b) => a + b, 0) / PERFORMANCE_ITERATIONS;
  const avgLoginTime = performanceResults.login.reduce((a, b) => a + b, 0) / PERFORMANCE_ITERATIONS;
  
  log(`📊 Average Registration Time: ${avgRegTime.toFixed(2)}ms`, 'cyan');
  log(`📊 Average Login Time: ${avgLoginTime.toFixed(2)}ms`, 'cyan');
  
  return { avgRegTime, avgLoginTime };
}

// Main test runner
async function runComprehensiveTests() {
  log('🚀 Starting Comprehensive Login & Register Tests', 'yellow');
  log('=' .repeat(60), 'yellow');
  
  let doctorData = null;
  let patientData = null;
  let adminData = null;
  let doctorToken = null;
  let patientToken = null;
  
  try {
    // 1. Health Check
    const healthOk = await testHealthCheck();
    if (!healthOk) {
      log('❌ Service is not healthy. Aborting tests.', 'red');
      return;
    }
    
    // 2. Registration Tests
    log('\n📝 REGISTRATION TESTS', 'yellow');
    log('-'.repeat(30), 'yellow');
    
    const doctorReg = await testDoctorRegistration();
    if (doctorReg.success) doctorData = doctorReg.data;
    
    const patientReg = await testPatientRegistration();
    if (patientReg.success) patientData = patientReg.data;
    
    const adminReg = await testAdminRegistration();
    if (adminReg.success) adminData = adminReg.data;
    
    // 3. Login Tests
    log('\n🔐 LOGIN TESTS', 'yellow');
    log('-'.repeat(30), 'yellow');
    
    if (doctorData) {
      const doctorLogin = await testLogin(doctorData, 'Doctor');
      if (doctorLogin.success) doctorToken = doctorLogin.response.session?.access_token;
    }
    
    if (patientData) {
      const patientLogin = await testLogin(patientData, 'Patient');
      if (patientLogin.success) patientToken = patientLogin.response.session?.access_token;
    }
    
    if (adminData) {
      await testLogin(adminData, 'Admin');
    }
    
    // 4. Error Handling Tests
    log('\n❌ ERROR HANDLING TESTS', 'yellow');
    log('-'.repeat(30), 'yellow');
    
    await testInvalidLogin();
    
    if (doctorData) {
      await testDuplicateRegistration(doctorData);
    }
    
    // 5. Token & Session Tests
    log('\n🔑 TOKEN & SESSION TESTS', 'yellow');
    log('-'.repeat(30), 'yellow');
    
    if (doctorToken) {
      await testTokenValidation(doctorToken);
      await testLogout(doctorToken);
    }
    
    // 6. Performance Tests
    log('\n⚡ PERFORMANCE TESTS', 'yellow');
    log('-'.repeat(30), 'yellow');
    
    await testPerformance();
    
  } catch (error) {
    log(`💥 Unexpected error: ${error.message}`, 'red');
    testStats.failed++;
  }
  
  // Final Results
  testStats.endTime = Date.now();
  const duration = ((testStats.endTime - testStats.startTime) / 1000).toFixed(2);
  
  log('\n📊 TEST RESULTS SUMMARY', 'yellow');
  log('=' .repeat(60), 'yellow');
  log(`⏱️  Total Duration: ${duration}s`, 'white');
  log(`📈 Total Tests: ${testStats.total}`, 'white');
  log(`✅ Passed: ${testStats.passed}`, 'green');
  log(`❌ Failed: ${testStats.failed}`, 'red');
  log(`⏭️  Skipped: ${testStats.skipped}`, 'yellow');
  log(`📊 Success Rate: ${((testStats.passed / testStats.total) * 100).toFixed(1)}%`, 
      testStats.passed === testStats.total ? 'green' : testStats.passed > testStats.failed ? 'yellow' : 'red');
  
  if (testStats.failed === 0) {
    log('\n🎉 All tests passed! Authentication system is working correctly.', 'green');
  } else {
    log(`\n⚠️  ${testStats.failed} test(s) failed. Please check the logs above.`, 'red');
  }
  
  return testStats;
}

// Run tests if called directly
if (require.main === module) {
  runComprehensiveTests()
    .then((stats) => {
      process.exit(stats.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      log(`💥 Fatal error: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = {
  runComprehensiveTests,
  generateTestData,
  makeRequest,
  testStats
};
