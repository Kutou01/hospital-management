#!/usr/bin/env node

/**
 * 🔍 TEST DEPARTMENT SERVICE API
 * 
 * Test all Department Service endpoints
 */

const axios = require('axios');

// Configuration
const DEPARTMENT_SERVICE_URL = 'http://localhost:3005';

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function makeRequest(method, url, data = null, headers = {}) {
  try {
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      ...(data && { data }),
      timeout: 10000
    };
    
    const response = await axios(config);
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status || 0,
      fullError: error.response?.data
    };
  }
}

async function testDepartmentService() {
  log('🔍 TESTING DEPARTMENT SERVICE API', 'cyan');
  log('=' .repeat(60), 'cyan');
  
  let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
  };

  try {
    // Test 1: Health check
    log('\n1️⃣ Health check...', 'yellow');
    testResults.total++;
    
    const healthResult = await makeRequest('GET', `${DEPARTMENT_SERVICE_URL}/health`);
    if (healthResult.success) {
      log('✅ Health check passed', 'green');
      log(`   Database: ${healthResult.data.database}`, 'white');
      log(`   Uptime: ${healthResult.data.uptime.toFixed(2)}s`, 'white');
      testResults.passed++;
    } else {
      log(`❌ Health check failed: ${healthResult.error}`, 'red');
      testResults.failed++;
    }
    testResults.details.push({ test: 'Health Check', status: healthResult.success ? 'PASS' : 'FAIL' });

    // Test 2: Root endpoint
    log('\n2️⃣ Root endpoint...', 'yellow');
    testResults.total++;
    
    const rootResult = await makeRequest('GET', `${DEPARTMENT_SERVICE_URL}/`);
    if (rootResult.success) {
      log('✅ Root endpoint passed', 'green');
      log(`   Service: ${rootResult.data.service}`, 'white');
      log(`   Version: ${rootResult.data.version}`, 'white');
      testResults.passed++;
    } else {
      log(`❌ Root endpoint failed: ${rootResult.error}`, 'red');
      testResults.failed++;
    }
    testResults.details.push({ test: 'Root Endpoint', status: rootResult.success ? 'PASS' : 'FAIL' });

    // Test 3: Get all departments
    log('\n3️⃣ Get all departments...', 'yellow');
    testResults.total++;
    
    const departmentsResult = await makeRequest('GET', `${DEPARTMENT_SERVICE_URL}/api/departments`);
    if (departmentsResult.success) {
      const departments = departmentsResult.data.data || departmentsResult.data;
      log(`✅ Get departments passed - Found ${departments.length} departments`, 'green');
      testResults.passed++;
    } else {
      log(`❌ Get departments failed: ${departmentsResult.error}`, 'red');
      testResults.failed++;
    }
    testResults.details.push({ test: 'Get All Departments', status: departmentsResult.success ? 'PASS' : 'FAIL' });

    // Test 4: Get department statistics
    log('\n4️⃣ Get department statistics...', 'yellow');
    testResults.total++;
    
    const statsResult = await makeRequest('GET', `${DEPARTMENT_SERVICE_URL}/api/departments/stats`);
    if (statsResult.success) {
      log('✅ Get stats passed', 'green');
      log(`📊 Stats: ${JSON.stringify(statsResult.data.data, null, 2)}`, 'white');
      testResults.passed++;
    } else {
      log(`❌ Get stats failed: ${statsResult.error}`, 'red');
      testResults.failed++;
    }
    testResults.details.push({ test: 'Get Statistics', status: statsResult.success ? 'PASS' : 'FAIL' });

    // Test 5: Get all specialties
    log('\n5️⃣ Get all specialties...', 'yellow');
    testResults.total++;
    
    const specialtiesResult = await makeRequest('GET', `${DEPARTMENT_SERVICE_URL}/api/specialties`);
    if (specialtiesResult.success) {
      const specialties = specialtiesResult.data.data || specialtiesResult.data;
      log(`✅ Get specialties passed - Found ${specialties.length} specialties`, 'green');
      testResults.passed++;
    } else {
      log(`❌ Get specialties failed: ${specialtiesResult.error}`, 'red');
      testResults.failed++;
    }
    testResults.details.push({ test: 'Get All Specialties', status: specialtiesResult.success ? 'PASS' : 'FAIL' });

    // Test 6: Get all rooms
    log('\n6️⃣ Get all rooms...', 'yellow');
    testResults.total++;
    
    const roomsResult = await makeRequest('GET', `${DEPARTMENT_SERVICE_URL}/api/rooms`);
    if (roomsResult.success) {
      const rooms = roomsResult.data.data || roomsResult.data;
      log(`✅ Get rooms passed - Found ${rooms.length} rooms`, 'green');
      testResults.passed++;
    } else {
      log(`❌ Get rooms failed: ${roomsResult.error}`, 'red');
      testResults.failed++;
    }
    testResults.details.push({ test: 'Get All Rooms', status: roomsResult.success ? 'PASS' : 'FAIL' });

    // Test 7: Get room availability
    log('\n7️⃣ Get room availability...', 'yellow');
    testResults.total++;
    
    const availabilityResult = await makeRequest('GET', `${DEPARTMENT_SERVICE_URL}/api/rooms/availability`);
    if (availabilityResult.success) {
      log('✅ Get room availability passed', 'green');
      testResults.passed++;
    } else {
      log(`❌ Get room availability failed: ${availabilityResult.error}`, 'red');
      testResults.failed++;
    }
    testResults.details.push({ test: 'Get Room Availability', status: availabilityResult.success ? 'PASS' : 'FAIL' });

    // Test 8: Test invalid department ID (should fail validation)
    log('\n8️⃣ Test invalid department ID validation...', 'yellow');
    testResults.total++;
    
    const invalidResult = await makeRequest('GET', `${DEPARTMENT_SERVICE_URL}/api/departments/INVALID123`);
    if (!invalidResult.success && invalidResult.status === 400) {
      log('✅ Invalid ID validation passed (correctly rejected)', 'green');
      testResults.passed++;
    } else {
      log(`❌ Invalid ID validation failed: Should reject invalid IDs`, 'red');
      testResults.failed++;
    }
    testResults.details.push({ test: 'Invalid ID Validation', status: (!invalidResult.success && invalidResult.status === 400) ? 'PASS' : 'FAIL' });

  } catch (error) {
    log(`💥 Unexpected error: ${error.message}`, 'red');
  }

  // Summary
  log('\n📊 TEST SUMMARY', 'cyan');
  log('=' .repeat(60), 'cyan');
  log(`Total Tests: ${testResults.total}`, 'white');
  log(`Passed: ${testResults.passed}`, 'green');
  log(`Failed: ${testResults.failed}`, 'red');
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`, 'cyan');
  
  log('\n📋 Test Details:', 'cyan');
  testResults.details.forEach((detail, index) => {
    const status = detail.status === 'PASS' ? '✅' : '❌';
    const color = detail.status === 'PASS' ? 'green' : 'red';
    log(`  ${index + 1}. ${status} ${detail.test}`, color);
  });

  if (testResults.failed === 0) {
    log('\n🎉 ALL TESTS PASSED! Department Service is working correctly.', 'green');
  } else {
    log(`\n⚠️  ${testResults.failed} tests failed. Check the errors above.`, 'yellow');
  }
}

// Run test
if (require.main === module) {
  testDepartmentService().catch(error => {
    console.error('❌ Test error:', error);
    process.exit(1);
  });
}

module.exports = { testDepartmentService };
