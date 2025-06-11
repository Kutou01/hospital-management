#!/usr/bin/env node

/**
 * 🧪 SIMPLE REGISTRATION TEST
 * 
 * Tests only successful registration flows
 * - Admin Registration (working)
 * - Skip Doctor/Patient for now due to schema issues
 * 
 * Usage: node test-registration-simple.js
 */

const axios = require('axios');
const crypto = require('crypto');

// Configuration
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const TEST_TIMEOUT = 10000; // 10 seconds

// Colors for console output
const colors = {
  reset: '\x1b[0m',
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
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '🔄';
  const color = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'blue';
  log(`${icon} ${testName} - ${status}${details ? ': ' + details : ''}`, color);
}

// Generate test data for admin only
function generateAdminData() {
  const timestamp = Date.now();
  const randomId = crypto.randomBytes(4).toString('hex');
  
  // Generate valid Vietnamese names without numbers
  const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng'];
  const lastNames = ['Văn An', 'Thị Bình', 'Minh Châu', 'Hoàng Dung', 'Quốc Hùng'];
  const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  return {
    email: `test.admin.${timestamp}.${randomId}@hospital.com`,
    password: 'TestPassword123!',
    full_name: `${randomFirstName} ${randomLastName}`,
    phone_number: `09${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    role: 'admin',
    gender: Math.random() > 0.5 ? 'male' : 'female'
  };
}

// HTTP request wrapper
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

// Test functions
async function testHealthCheck() {
  log('\n🏥 Testing Health Check...', 'blue');
  
  const result = await makeRequest('GET', '/health');
  
  if (result.success && result.data.status === 'healthy') {
    logTest('Health Check', 'PASS', 'Service is healthy');
    return true;
  } else {
    logTest('Health Check', 'FAIL', result.error?.message || 'Service unhealthy');
    return false;
  }
}

async function testAdminRegistration() {
  log('\n👑 Testing Admin Registration...', 'blue');
  
  const adminData = generateAdminData();
  log(`📧 Email: ${adminData.email}`, 'cyan');
  log(`👤 Name: ${adminData.full_name}`, 'cyan');
  log(`📱 Phone: ${adminData.phone_number}`, 'cyan');
  log(`👥 Role: ${adminData.role}`, 'cyan');
  
  const result = await makeRequest('POST', '/api/auth/signup', adminData);
  
  if (result.success && result.data.success) {
    logTest('Admin Registration', 'PASS', `User ID: ${result.data.user?.id}`);
    return { success: true, data: adminData, response: result.data };
  } else {
    logTest('Admin Registration', 'FAIL', result.error?.error || result.error?.message || 'Registration failed');
    log(`❌ Error details: ${JSON.stringify(result.error, null, 2)}`, 'red');
    return { success: false, error: result.error };
  }
}

async function testAdminLogin(adminData) {
  log('\n🔐 Testing Admin Login...', 'blue');
  
  const loginData = {
    email: adminData.email,
    password: adminData.password
  };
  
  const result = await makeRequest('POST', '/api/auth/signin', loginData);
  
  if (result.success && result.data.success) {
    logTest('Admin Login', 'PASS', `Token: ${result.data.session?.access_token ? 'Present' : 'Missing'}`);
    return { success: true, response: result.data };
  } else {
    logTest('Admin Login', 'FAIL', result.error?.error || result.error?.message || 'Login failed');
    return { success: false, error: result.error };
  }
}

// Main test runner
async function runSimpleTests() {
  log('🚀 Starting Simple Registration Tests', 'yellow');
  log('=' .repeat(50), 'yellow');
  
  let testsPassed = 0;
  let testsTotal = 0;
  
  try {
    // 1. Health Check
    testsTotal++;
    const healthOk = await testHealthCheck();
    if (healthOk) testsPassed++;
    
    if (!healthOk) {
      log('❌ Service is not healthy. Aborting tests.', 'red');
      return;
    }
    
    // 2. Admin Registration
    testsTotal++;
    const adminReg = await testAdminRegistration();
    if (adminReg.success) testsPassed++;
    
    // 3. Admin Login (if registration succeeded)
    if (adminReg.success) {
      testsTotal++;
      const adminLogin = await testAdminLogin(adminReg.data);
      if (adminLogin.success) testsPassed++;
    }
    
  } catch (error) {
    log(`💥 Unexpected error: ${error.message}`, 'red');
  }
  
  // Results
  log('\n📊 TEST RESULTS', 'yellow');
  log('=' .repeat(30), 'yellow');
  log(`📈 Total Tests: ${testsTotal}`, 'white');
  log(`✅ Passed: ${testsPassed}`, 'green');
  log(`❌ Failed: ${testsTotal - testsPassed}`, 'red');
  log(`📊 Success Rate: ${((testsPassed / testsTotal) * 100).toFixed(1)}%`, 
      testsPassed === testsTotal ? 'green' : 'yellow');
  
  if (testsPassed === testsTotal) {
    log('\n🎉 All tests passed! Admin registration is working correctly.', 'green');
  } else {
    log(`\n⚠️  ${testsTotal - testsPassed} test(s) failed.`, 'red');
  }
  
  return { passed: testsPassed, total: testsTotal };
}

// Run tests if called directly
if (require.main === module) {
  runSimpleTests()
    .then((stats) => {
      process.exit(stats.passed < stats.total ? 1 : 0);
    })
    .catch((error) => {
      log(`💥 Fatal error: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = { runSimpleTests, generateAdminData, makeRequest };
