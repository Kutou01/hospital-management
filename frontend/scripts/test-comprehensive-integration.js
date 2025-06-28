#!/usr/bin/env node

/**
 * Comprehensive Integration Test Script
 * Tests both public and authenticated endpoints
 */

const axios = require('axios');

// Configuration
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3100';
const TEST_CREDENTIALS = {
  email: 'admin@hospital.com',
  password: 'Admin123.'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, status, details = '') {
  const statusColor = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  log(`${statusIcon} ${testName}: ${status}${details ? ` - ${details}` : ''}`, statusColor);
}

async function makeRequest(method, endpoint, data = null, token = null) {
  const startTime = Date.now();
  try {
    const config = {
      method,
      url: `${API_GATEWAY_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    };

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    const duration = Date.now() - startTime;

    return {
      success: true,
      status: response.status,
      data: response.data,
      duration
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      success: false,
      status: error.response?.status || 0,
      error: error.response?.data?.error || error.message,
      duration
    };
  }
}

async function testPublicEndpoints() {
  log('\n🌐 TESTING PUBLIC ENDPOINTS', 'cyan');
  log('='.repeat(40), 'cyan');

  const publicTests = [
    { name: 'API Gateway Health', endpoint: '/health' },
    { name: 'Auth Service Health', endpoint: '/api/auth/health' },
    { name: 'Doctor Service Health', endpoint: '/api/doctors/health' },
    { name: 'Patient Service Health', endpoint: '/api/patients/health' },
    { name: 'Appointment Service Health', endpoint: '/api/appointments/health' },
    { name: 'Department Service Health', endpoint: '/api/departments/health' },
    { name: 'Service Discovery', endpoint: '/services' }
  ];

  let passed = 0;
  let total = publicTests.length;

  for (const test of publicTests) {
    const result = await makeRequest('GET', test.endpoint);
    if (result.success) {
      logTest(test.name, 'PASS', `${result.duration}ms`);
      passed++;
    } else {
      logTest(test.name, 'FAIL', `${result.status} - ${result.error}`);
    }
  }

  log(`\n📊 Public Tests Summary: ${passed}/${total} passed`, passed === total ? 'green' : 'yellow');
  return { passed, total };
}

async function testAuthenticationFlow() {
  log('\n🔐 TESTING AUTHENTICATION FLOW', 'cyan');
  log('='.repeat(40), 'cyan');

  // Test login validation (should fail with 400)
  const validationResult = await makeRequest('POST', '/api/auth/signin', {});
  if (validationResult.status === 400) {
    logTest('Login Validation', 'PASS', 'Correctly rejects empty credentials');
  } else {
    logTest('Login Validation', 'FAIL', `Expected 400, got ${validationResult.status}`);
  }

  // Test actual login
  const loginResult = await makeRequest('POST', '/api/auth/signin', TEST_CREDENTIALS);
  if (loginResult.success && loginResult.data?.session?.access_token) {
    logTest('User Login', 'PASS', `Token received (${loginResult.duration}ms)`);
    return loginResult.data.session.access_token;
  } else {
    logTest('User Login', 'FAIL', loginResult.error || 'No token received');
    return null;
  }
}

async function testAuthenticatedEndpoints(token) {
  log('\n🔒 TESTING AUTHENTICATED ENDPOINTS', 'cyan');
  log('='.repeat(40), 'cyan');

  const authTests = [
    { name: 'Get All Doctors', endpoint: '/api/doctors', method: 'GET' },
    { name: 'Get All Patients', endpoint: '/api/patients', method: 'GET' },
    { name: 'Get All Appointments', endpoint: '/api/appointments', method: 'GET' },
    { name: 'Get All Departments', endpoint: '/api/departments', method: 'GET' },
    { name: 'Doctor Stats', endpoint: '/api/doctors/stats', method: 'GET' },
    { name: 'Patient Stats', endpoint: '/api/patients/stats', method: 'GET' },
    { name: 'Search Doctors', endpoint: '/api/doctors/search?q=test', method: 'GET' }
  ];

  let passed = 0;
  let total = authTests.length;

  for (const test of authTests) {
    const result = await makeRequest(test.method, test.endpoint, null, token);
    if (result.success) {
      const dataCount = Array.isArray(result.data?.data) ? result.data.data.length : 'N/A';
      logTest(test.name, 'PASS', `${result.duration}ms, Records: ${dataCount}`);
      passed++;
    } else {
      logTest(test.name, 'FAIL', `${result.status} - ${result.error}`);
    }
  }

  log(`\n📊 Authenticated Tests Summary: ${passed}/${total} passed`, passed === total ? 'green' : 'yellow');
  return { passed, total };
}

async function testAuthProtection() {
  log('\n🛡️ TESTING AUTH PROTECTION', 'cyan');
  log('='.repeat(40), 'cyan');

  const protectedEndpoints = [
    '/api/doctors',
    '/api/patients', 
    '/api/appointments',
    '/api/departments'
  ];

  let passed = 0;
  let total = protectedEndpoints.length;

  for (const endpoint of protectedEndpoints) {
    const result = await makeRequest('GET', endpoint); // No token
    if (result.status === 401) {
      logTest(`${endpoint} Protection`, 'PASS', 'Correctly returns 401 without auth');
      passed++;
    } else {
      logTest(`${endpoint} Protection`, 'FAIL', `Expected 401, got ${result.status}`);
    }
  }

  log(`\n📊 Auth Protection Summary: ${passed}/${total} passed`, passed === total ? 'green' : 'yellow');
  return { passed, total };
}

async function runComprehensiveTests() {
  log('🚀 COMPREHENSIVE INTEGRATION TEST SUITE', 'blue');
  log('='.repeat(50), 'blue');
  log(`🎯 Target: ${API_GATEWAY_URL}`, 'blue');
  log(`📧 Test User: ${TEST_CREDENTIALS.email}`, 'blue');
  log('');

  const startTime = Date.now();
  let totalPassed = 0;
  let totalTests = 0;

  try {
    // Phase 1: Public endpoints
    const publicResults = await testPublicEndpoints();
    totalPassed += publicResults.passed;
    totalTests += publicResults.total;

    // Phase 2: Authentication flow
    const token = await testAuthenticationFlow();
    if (token) {
      totalPassed += 1; // Login success
    }
    totalTests += 2; // Validation + Login

    // Phase 3: Auth protection
    const protectionResults = await testAuthProtection();
    totalPassed += protectionResults.passed;
    totalTests += protectionResults.total;

    // Phase 4: Authenticated endpoints (only if login succeeded)
    if (token) {
      const authResults = await testAuthenticatedEndpoints(token);
      totalPassed += authResults.passed;
      totalTests += authResults.total;
    } else {
      log('\n⚠️ Skipping authenticated tests due to login failure', 'yellow');
    }

    // Final summary
    const duration = Date.now() - startTime;
    const successRate = Math.round((totalPassed / totalTests) * 100);

    log('\n' + '='.repeat(50), 'blue');
    log('🎉 COMPREHENSIVE TEST RESULTS', 'blue');
    log('='.repeat(50), 'blue');
    log(`📊 Total Tests: ${totalTests}`, 'blue');
    log(`✅ Passed: ${totalPassed}`, totalPassed === totalTests ? 'green' : 'yellow');
    log(`❌ Failed: ${totalTests - totalPassed}`, totalTests - totalPassed === 0 ? 'green' : 'red');
    log(`📈 Success Rate: ${successRate}%`, successRate >= 90 ? 'green' : successRate >= 70 ? 'yellow' : 'red');
    log(`⏱️ Total Duration: ${duration}ms`, 'blue');

    if (successRate >= 90) {
      log('\n🎯 EXCELLENT! Your microservices are working perfectly!', 'green');
      log('✨ Ready for graduation thesis defense!', 'green');
    } else if (successRate >= 70) {
      log('\n👍 GOOD! Most services are working, minor issues to fix.', 'yellow');
    } else {
      log('\n⚠️ NEEDS ATTENTION! Several services have issues.', 'red');
    }

    log('\n💡 Next steps:', 'cyan');
    log('   1. Open frontend test page: http://localhost:3000/test/comprehensive', 'cyan');
    log('   2. Run authenticated tests in browser', 'cyan');
    log('   3. Check individual service logs if any tests failed', 'cyan');

  } catch (error) {
    log(`\n❌ Test suite error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runComprehensiveTests().catch(error => {
    log(`❌ Fatal error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  runComprehensiveTests,
  testPublicEndpoints,
  testAuthenticationFlow,
  testAuthenticatedEndpoints,
  testAuthProtection
};
