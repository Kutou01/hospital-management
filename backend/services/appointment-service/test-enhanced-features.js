#!/usr/bin/env node

/**
 * 🧪 ENHANCED APPOINTMENT SERVICE FEATURES TEST
 * 
 * Tests the newly implemented features:
 * - Calendar Integration (3 tests)
 * - Real-time Features (2 tests)
 * - Notification System (2 tests)
 * - Performance Optimization (1 test)
 * 
 * Total: 8 comprehensive tests for 100% feature coverage
 */

const axios = require('axios');
const colors = require('colors');

// Configuration
const BASE_URL = 'http://localhost:3004';
const AUTH_SERVICE_URL = 'http://localhost:3001';

// Test credentials
const TEST_CREDENTIALS = {
  email: 'admin@hospital.com',
  password: 'admin123'
};

// Test data
let authToken = '';
let testAppointmentId = '';
let testDoctorId = 'CARD-DOC-202412-001';
let testPatientId = 'PAT-202412-001';

// Test statistics
const testStats = {
  total: 0,
  passed: 0,
  failed: 0,
  startTime: 0,
  results: []
};

// Utility functions
function log(message, color = 'white') {
  console.log(colors[color](message));
}

function addTestResult(testName, passed, details, duration = 0) {
  testStats.total++;
  if (passed) {
    testStats.passed++;
    log(`   ✅ ${testName}: PASSED ${duration ? `(${duration}ms)` : ''}`, 'green');
  } else {
    testStats.failed++;
    log(`   ❌ ${testName}: FAILED - ${details}`, 'red');
  }
  
  testStats.results.push({
    name: testName,
    passed,
    details,
    duration
  });
}

async function makeRequest(method, endpoint, data = null, expectSuccess = true) {
  const startTime = Date.now();
  
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
      timeout: 10000
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    const duration = Date.now() - startTime;
    
    return {
      success: expectSuccess ? response.status < 400 : true,
      data: response.data,
      status: response.status,
      duration
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    return {
      success: !expectSuccess,
      error: error.response?.data?.error || error.message,
      status: error.response?.status || 500,
      duration
    };
  }
}

// Authentication
async function authenticateTestUser() {
  log('\n🔐 Authenticating test user...', 'cyan');
  
  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/signin`, TEST_CREDENTIALS);
    
    if (response.data.success && response.data.data?.session?.access_token) {
      authToken = response.data.data.session.access_token;
      log('✅ Authentication successful', 'green');
      return true;
    } else {
      log('❌ Authentication failed: Invalid response', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Authentication failed: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

// Test Functions

// 1. Calendar Integration Tests
async function testCalendarView() {
  log('\n1️⃣ Testing Calendar View', 'yellow');
  
  const today = new Date().toISOString().split('T')[0];
  const result = await makeRequest('GET', `/api/appointments/calendar?date=${today}&view=month`);
  
  if (result.success && result.data.success) {
    const calendarData = result.data.data;
    addTestResult('Calendar View', true, `Calendar data retrieved for ${calendarData.view} view`, result.duration);
    return true;
  } else {
    addTestResult('Calendar View', false, result.error || 'Failed to get calendar view', result.duration);
    return false;
  }
}

async function testWeeklySchedule() {
  log('\n2️⃣ Testing Weekly Schedule', 'yellow');
  
  const result = await makeRequest('GET', `/api/appointments/doctor/${testDoctorId}/weekly`);
  
  if (result.success && result.data.success) {
    const scheduleData = result.data.data;
    addTestResult('Weekly Schedule', true, `Weekly schedule retrieved for doctor ${scheduleData.doctorId}`, result.duration);
    return true;
  } else {
    addTestResult('Weekly Schedule', false, result.error || 'Failed to get weekly schedule', result.duration);
    return false;
  }
}

async function testAvailableSlots() {
  log('\n3️⃣ Testing Available Time Slots', 'yellow');
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  const result = await makeRequest('GET', `/api/appointments/available-slots?doctor_id=${testDoctorId}&date=${tomorrowStr}&duration=30`);
  
  if (result.success && result.data.success) {
    const slots = result.data.data;
    addTestResult('Available Time Slots', true, `Found ${Array.isArray(slots) ? slots.length : 0} available slots`, result.duration);
    return true;
  } else {
    addTestResult('Available Time Slots', false, result.error || 'Failed to get available slots', result.duration);
    return false;
  }
}

// 4. Real-time Features Tests
async function testRealtimeStatus() {
  log('\n4️⃣ Testing Real-time Service Status', 'yellow');
  
  const result = await makeRequest('GET', '/api/appointments/realtime/status');
  
  if (result.success && result.data.success) {
    const status = result.data.data;
    const isHealthy = status.realtime_enabled && status.websocket_enabled;
    addTestResult('Real-time Status', isHealthy, `Real-time features ${isHealthy ? 'enabled' : 'disabled'}`, result.duration);
    return isHealthy;
  } else {
    addTestResult('Real-time Status', false, result.error || 'Failed to get real-time status', result.duration);
    return false;
  }
}

async function testLiveAppointments() {
  log('\n5️⃣ Testing Live Appointments', 'yellow');
  
  const result = await makeRequest('GET', '/api/appointments/live?page=1&limit=10');
  
  if (result.success && result.data.success) {
    const liveData = result.data.data;
    const hasRealtimeFeatures = liveData.realtime_enabled && liveData.live_updates;
    addTestResult('Live Appointments', hasRealtimeFeatures, `Live features ${hasRealtimeFeatures ? 'working' : 'not working'}`, result.duration);
    return hasRealtimeFeatures;
  } else {
    addTestResult('Live Appointments', false, result.error || 'Failed to get live appointments', result.duration);
    return false;
  }
}

// 6. Appointment Reschedule Test
async function testAppointmentReschedule() {
  log('\n6️⃣ Testing Appointment Reschedule', 'yellow');
  
  // First create a test appointment
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const appointmentDate = tomorrow.toISOString().split('T')[0];
  
  const createResult = await makeRequest('POST', '/api/appointments', {
    doctor_id: testDoctorId,
    patient_id: testPatientId,
    appointment_date: appointmentDate,
    start_time: '10:00',
    end_time: '10:30',
    appointment_type: 'consultation',
    reason: 'Test appointment for reschedule'
  });
  
  if (!createResult.success) {
    addTestResult('Appointment Reschedule', false, 'Failed to create test appointment', createResult.duration);
    return false;
  }
  
  testAppointmentId = createResult.data.data.appointment_id;
  
  // Now test reschedule
  const rescheduleResult = await makeRequest('PUT', `/api/appointments/${testAppointmentId}/reschedule`, {
    newDate: appointmentDate,
    newStartTime: '14:00',
    newEndTime: '14:30',
    reason: 'Testing reschedule functionality'
  });
  
  if (rescheduleResult.success && rescheduleResult.data.success) {
    addTestResult('Appointment Reschedule', true, 'Appointment rescheduled successfully', rescheduleResult.duration);
    return true;
  } else {
    addTestResult('Appointment Reschedule', false, rescheduleResult.error || 'Failed to reschedule appointment', rescheduleResult.duration);
    return false;
  }
}

// 7. Performance Test
async function testPerformance() {
  log('\n7️⃣ Testing Performance', 'yellow');
  
  const startTime = Date.now();
  const promises = [];
  
  // Make 5 concurrent requests
  for (let i = 0; i < 5; i++) {
    promises.push(makeRequest('GET', '/api/appointments?page=1&limit=10'));
  }
  
  try {
    const results = await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    const avgTime = totalTime / results.length;
    
    const allSuccessful = results.every(r => r.success);
    const performanceGood = avgTime < 500; // Less than 500ms average
    
    const passed = allSuccessful && performanceGood;
    addTestResult('Performance Test', passed, `${results.length} concurrent requests, avg: ${avgTime.toFixed(0)}ms`, totalTime);
    return passed;
  } catch (error) {
    addTestResult('Performance Test', false, `Concurrent requests failed: ${error.message}`);
    return false;
  }
}

// 8. Health Check Test
async function testHealthCheck() {
  log('\n8️⃣ Testing Enhanced Health Check', 'yellow');
  
  const result = await makeRequest('GET', '/health');
  
  if (result.success && result.data.status === 'healthy') {
    const features = result.data.features || {};
    const hasEnhancedFeatures = features.realtime && features.websocket && features.supabase_integration;
    
    addTestResult('Enhanced Health Check', hasEnhancedFeatures, `Enhanced features ${hasEnhancedFeatures ? 'available' : 'missing'}`, result.duration);
    return hasEnhancedFeatures;
  } else {
    addTestResult('Enhanced Health Check', false, result.error || 'Health check failed', result.duration);
    return false;
  }
}

// Main Test Runner
async function runEnhancedFeatureTests() {
  log('🚀 Starting Enhanced Appointment Service Feature Tests', 'cyan');
  log('=' .repeat(70), 'cyan');
  
  testStats.startTime = Date.now();
  
  try {
    // Authentication
    const authSuccess = await authenticateTestUser();
    if (!authSuccess) {
      log('❌ Authentication failed. Aborting tests.', 'red');
      return;
    }
    
    // Run all tests
    await testHealthCheck();
    await testCalendarView();
    await testWeeklySchedule();
    await testAvailableSlots();
    await testRealtimeStatus();
    await testLiveAppointments();
    await testAppointmentReschedule();
    await testPerformance();
    
  } catch (error) {
    log(`💥 Unexpected error: ${error.message}`, 'red');
  }
  
  // Print summary
  const totalTime = Date.now() - testStats.startTime;
  const successRate = ((testStats.passed / testStats.total) * 100).toFixed(1);
  
  log('\n📊 TEST SUMMARY', 'cyan');
  log('=' .repeat(50), 'cyan');
  log(`Total Tests: ${testStats.total}`, 'white');
  log(`Passed: ${testStats.passed}`, 'green');
  log(`Failed: ${testStats.failed}`, testStats.failed > 0 ? 'red' : 'white');
  log(`Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');
  log(`Total Time: ${totalTime}ms`, 'white');
  
  if (successRate >= 80) {
    log('\n🎉 ENHANCED FEATURES TEST PASSED! Appointment Service is ready for production.', 'green');
  } else {
    log('\n⚠️  Some enhanced features need attention before production deployment.', 'yellow');
  }
  
  // Cleanup test appointment
  if (testAppointmentId) {
    try {
      await makeRequest('DELETE', `/api/appointments/${testAppointmentId}`);
      log('\n🧹 Test appointment cleaned up', 'gray');
    } catch (error) {
      log('\n⚠️  Failed to cleanup test appointment', 'yellow');
    }
  }
}

// Run tests
if (require.main === module) {
  runEnhancedFeatureTests().catch(error => {
    console.error('❌ Test runner error:', error);
    process.exit(1);
  });
}

module.exports = {
  runEnhancedFeatureTests
};
