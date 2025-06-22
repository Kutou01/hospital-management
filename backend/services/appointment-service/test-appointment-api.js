#!/usr/bin/env node

/**
 * 🔍 TEST APPOINTMENT SERVICE API
 * 
 * Test all Appointment Service endpoints
 */

const axios = require('axios');
const crypto = require('crypto');

// Configuration
const APPOINTMENT_SERVICE_URL = 'http://localhost:3004';
const AUTH_SERVICE_URL = 'http://localhost:3001';

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

async function testAppointmentService() {
  log('🔍 TESTING APPOINTMENT SERVICE API', 'cyan');
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
    
    const healthResult = await makeRequest('GET', `${APPOINTMENT_SERVICE_URL}/health`);
    if (healthResult.success) {
      log('✅ Health check passed', 'green');
      testResults.passed++;
    } else {
      log(`❌ Health check failed: ${healthResult.error}`, 'red');
      testResults.failed++;
    }
    testResults.details.push({ test: 'Health Check', status: healthResult.success ? 'PASS' : 'FAIL' });

    // Test 2: Get all appointments
    log('\n2️⃣ Get all appointments...', 'yellow');
    testResults.total++;
    
    const appointmentsResult = await makeRequest('GET', `${APPOINTMENT_SERVICE_URL}/api/appointments`);
    if (appointmentsResult.success) {
      const appointments = appointmentsResult.data.data || appointmentsResult.data;
      log(`✅ Get appointments passed - Found ${appointments.length} appointments`, 'green');
      testResults.passed++;
      
      if (appointments.length > 0) {
        const sampleAppointment = appointments[0];
        log(`\n📋 Sample appointment:`, 'cyan');
        log(`  ID: ${sampleAppointment.appointment_id}`, 'white');
        log(`  Doctor: ${sampleAppointment.doctor_id}`, 'white');
        log(`  Patient: ${sampleAppointment.patient_id}`, 'white');
        log(`  Date: ${sampleAppointment.appointment_date}`, 'white');
        log(`  Status: ${sampleAppointment.status}`, 'white');
      }
    } else {
      log(`❌ Get appointments failed: ${appointmentsResult.error}`, 'red');
      testResults.failed++;
    }
    testResults.details.push({ test: 'Get All Appointments', status: appointmentsResult.success ? 'PASS' : 'FAIL' });

    // Test 3: Get appointment stats
    log('\n3️⃣ Get appointment statistics...', 'yellow');
    testResults.total++;
    
    const statsResult = await makeRequest('GET', `${APPOINTMENT_SERVICE_URL}/api/appointments/stats`);
    if (statsResult.success) {
      log('✅ Get stats passed', 'green');
      log(`📊 Stats: ${JSON.stringify(statsResult.data, null, 2)}`, 'white');
      testResults.passed++;
    } else {
      log(`❌ Get stats failed: ${statsResult.error}`, 'red');
      testResults.failed++;
    }
    testResults.details.push({ test: 'Get Statistics', status: statsResult.success ? 'PASS' : 'FAIL' });

    // Test 4: Get available slots (requires doctor_id and date)
    log('\n4️⃣ Get available time slots...', 'yellow');
    testResults.total++;
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    
    const slotsResult = await makeRequest('GET', 
      `${APPOINTMENT_SERVICE_URL}/api/appointments/available-slots?doctor_id=GEN-DOC-202506-555&date=${dateStr}&duration=30`
    );
    if (slotsResult.success) {
      log('✅ Get available slots passed', 'green');
      testResults.passed++;
    } else {
      log(`❌ Get available slots failed: ${slotsResult.error}`, 'red');
      testResults.failed++;
    }
    testResults.details.push({ test: 'Get Available Slots', status: slotsResult.success ? 'PASS' : 'FAIL' });

    // Test 5: Create appointment (requires valid doctor and patient IDs)
    log('\n5️⃣ Create appointment...', 'yellow');
    testResults.total++;
    
    const testAppointment = {
      doctor_id: 'GEN-DOC-202506-555', // Use existing doctor ID
      patient_id: 'PAT-202506-318', // Use existing patient ID
      appointment_date: dateStr,
      start_time: '09:00',
      end_time: '09:30',
      appointment_type: 'consultation',
      reason: 'Regular checkup',
      notes: 'Test appointment created by API test'
    };
    
    log('📤 Test appointment data:', 'white');
    console.log(JSON.stringify(testAppointment, null, 2));
    
    const createResult = await makeRequest('POST', `${APPOINTMENT_SERVICE_URL}/api/appointments`, testAppointment);
    if (createResult.success) {
      log(`✅ Create appointment passed - ID: ${createResult.data.appointment_id}`, 'green');
      testResults.passed++;
      
      // Test 6: Get created appointment
      if (createResult.data.appointment_id) {
        log('\n6️⃣ Get created appointment...', 'yellow');
        testResults.total++;
        
        const getResult = await makeRequest('GET', `${APPOINTMENT_SERVICE_URL}/api/appointments/${createResult.data.appointment_id}`);
        if (getResult.success) {
          log('✅ Get appointment by ID passed', 'green');
          testResults.passed++;
        } else {
          log(`❌ Get appointment by ID failed: ${getResult.error}`, 'red');
          testResults.failed++;
        }
        testResults.details.push({ test: 'Get Appointment by ID', status: getResult.success ? 'PASS' : 'FAIL' });
      }
      
    } else {
      log(`❌ Create appointment failed: ${createResult.error}`, 'red');
      testResults.failed++;
      
      if (createResult.fullError) {
        log('\n🔍 Detailed error:', 'cyan');
        console.log(JSON.stringify(createResult.fullError, null, 2));
      }
    }
    testResults.details.push({ test: 'Create Appointment', status: createResult.success ? 'PASS' : 'FAIL' });

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
    log('\n🎉 ALL TESTS PASSED! Appointment Service is working correctly.', 'green');
  } else {
    log(`\n⚠️  ${testResults.failed} tests failed. Check the errors above.`, 'yellow');
  }
}

// Run test
if (require.main === module) {
  testAppointmentService().catch(error => {
    console.error('❌ Test error:', error);
    process.exit(1);
  });
}

module.exports = { testAppointmentService };
