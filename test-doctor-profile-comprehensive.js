#!/usr/bin/env node

/**
 * COMPREHENSIVE DOCTOR PROFILE API TESTING SCRIPT
 * Based on actual database schema and real data analysis
 * 
 * Tests all doctor profile related endpoints with real authentication
 * and actual database constraints
 */

const axios = require('axios');

// Configuration based on actual system setup
const CONFIG = {
  API_GATEWAY: 'http://localhost:3100',
  AUTH_SERVICE: 'http://localhost:3001', 
  DOCTOR_SERVICE: 'http://localhost:3002',
  
  // Real doctor account from test results
  DOCTOR_CREDENTIALS: {
    email: 'doctor@hospital.com',
    password: 'Doctor123.' // Including the period as confirmed
  },
  
  // Known doctor data from previous test
  KNOWN_DOCTOR: {
    profile_id: '5bdcbd80-f344-40b7-a46b-3760ca487693',
    doctor_id: 'GENE-DOC-202506-006',
    email: 'doctor@hospital.com',
    full_name: 'BS. Nguyễn Văn Đức',
    specialty: 'Nội Tổng Hợp',
    license: 'VN-TH-GENE-1006',
    experience_years: 14
  }
};

let authToken = null;
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Helper functions
function logTest(testName, status, details = '') {
  const symbol = status === 'PASS' ? '✅' : '❌';
  console.log(`${symbol} ${testName}: ${status}`);
  if (details) console.log(`   ${details}`);
  
  testResults.total++;
  if (status === 'PASS') testResults.passed++;
  else testResults.failed++;
  
  testResults.details.push({ testName, status, details });
}

function logSection(title) {
  console.log(`\n🔍 ${title}`);
  console.log('='.repeat(50));
}

async function makeRequest(method, url, data = null, headers = {}) {
  try {
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) config.data = data;
    if (authToken) config.headers.Authorization = `Bearer ${authToken}`;
    
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
async function testServiceHealth() {
  logSection('SERVICE HEALTH CHECKS');
  
  // Test API Gateway
  const gateway = await makeRequest('GET', `${CONFIG.API_GATEWAY}/health`);
  logTest('API Gateway Health', gateway.success ? 'PASS' : 'FAIL', 
    gateway.success ? `Status: ${gateway.status}` : `Error: ${gateway.error}`);
  
  // Test Auth Service
  const auth = await makeRequest('GET', `${CONFIG.AUTH_SERVICE}/health`);
  logTest('Auth Service Health', auth.success ? 'PASS' : 'FAIL',
    auth.success ? `Status: ${auth.status}` : `Error: ${auth.error}`);
  
  // Test Doctor Service
  const doctor = await makeRequest('GET', `${CONFIG.DOCTOR_SERVICE}/health`);
  logTest('Doctor Service Health', doctor.success ? 'PASS' : 'FAIL',
    doctor.success ? `Status: ${doctor.status}` : `Error: ${doctor.error}`);
}

async function testAuthentication() {
  logSection('AUTHENTICATION TESTING');
  
  // Login with real doctor credentials
  const loginResult = await makeRequest('POST', `${CONFIG.API_GATEWAY}/api/auth/login`, {
    email: CONFIG.DOCTOR_CREDENTIALS.email,
    password: CONFIG.DOCTOR_CREDENTIALS.password
  });
  
  if (loginResult.success && loginResult.data.access_token) {
    authToken = loginResult.data.access_token;
    logTest('Doctor Login', 'PASS', 
      `Token received, User: ${loginResult.data.user?.email}, Role: ${loginResult.data.user?.role}`);
    return true;
  } else {
    logTest('Doctor Login', 'FAIL', 
      `Error: ${loginResult.error?.message || loginResult.error}`);
    return false;
  }
}

async function testDoctorProfileEndpoints() {
  logSection('DOCTOR PROFILE ENDPOINTS');
  
  // Test 1: Get Doctor by Profile ID
  const profileResult = await makeRequest('GET', 
    `${CONFIG.API_GATEWAY}/api/doctors/by-profile/${CONFIG.KNOWN_DOCTOR.profile_id}`);
  
  if (profileResult.success && profileResult.data.data) {
    const doctor = profileResult.data.data;
    logTest('GET /by-profile/:profileId', 'PASS', 
      `Doctor: ${doctor.doctor_id}, Name: ${doctor.full_name || 'N/A'}, Specialty: ${doctor.specialty}`);
  } else {
    logTest('GET /by-profile/:profileId', 'FAIL', 
      `Error: ${profileResult.error?.message || profileResult.error}`);
  }
  
  // Test 2: Get Doctor Stats
  const statsResult = await makeRequest('GET', 
    `${CONFIG.API_GATEWAY}/api/doctors/${CONFIG.KNOWN_DOCTOR.doctor_id}/stats`);
  
  if (statsResult.success) {
    const stats = statsResult.data.data || statsResult.data;
    logTest('GET /:doctorId/stats', 'PASS', 
      `Appointments: ${stats.totalAppointments || 0}, Patients: ${stats.totalPatients || 0}, Rating: ${stats.averageRating || 0}`);
  } else {
    logTest('GET /:doctorId/stats', 'FAIL', 
      `Error: ${statsResult.error?.message || statsResult.error}`);
  }
  
  // Test 3: Get Doctor Experiences
  const expResult = await makeRequest('GET', 
    `${CONFIG.API_GATEWAY}/api/doctors/${CONFIG.KNOWN_DOCTOR.doctor_id}/experiences`);
  
  if (expResult.success) {
    const experiences = expResult.data.data || expResult.data;
    logTest('GET /:doctorId/experiences', 'PASS', 
      `Experiences found: ${Array.isArray(experiences) ? experiences.length : 'N/A'}`);
  } else {
    logTest('GET /:doctorId/experiences', 'FAIL', 
      `Error: ${expResult.error?.message || expResult.error}`);
  }
  
  // Test 4: Get Doctor Reviews
  const reviewsResult = await makeRequest('GET', 
    `${CONFIG.API_GATEWAY}/api/doctors/${CONFIG.KNOWN_DOCTOR.doctor_id}/reviews`);
  
  if (reviewsResult.success) {
    const reviews = reviewsResult.data.data || reviewsResult.data;
    logTest('GET /:doctorId/reviews', 'PASS', 
      `Reviews found: ${Array.isArray(reviews) ? reviews.length : 'N/A'}`);
  } else {
    logTest('GET /:doctorId/reviews', 'FAIL', 
      `Error: ${reviewsResult.error?.message || reviewsResult.error}`);
  }
}

async function testAuthenticatedEndpoints() {
  logSection('AUTHENTICATED DOCTOR ENDPOINTS');
  
  if (!authToken) {
    logTest('Authentication Required', 'FAIL', 'No auth token available');
    return;
  }
  
  // Test 1: Current Doctor Profile
  const currentProfile = await makeRequest('GET', 
    `${CONFIG.API_GATEWAY}/api/doctors/dashboard/profile`);
  
  if (currentProfile.success) {
    const doctor = currentProfile.data.data;
    logTest('GET /dashboard/profile', 'PASS', 
      `Current doctor: ${doctor?.doctor_id}, Name: ${doctor?.full_name || 'N/A'}`);
  } else {
    logTest('GET /dashboard/profile', 'FAIL', 
      `Error: ${currentProfile.error?.message || currentProfile.error}`);
  }
  
  // Test 2: Current Doctor Stats
  const currentStats = await makeRequest('GET', 
    `${CONFIG.API_GATEWAY}/api/doctors/dashboard/stats`);
  
  if (currentStats.success) {
    const stats = currentStats.data.data;
    logTest('GET /dashboard/stats', 'PASS', 
      `Today appointments: ${stats?.todayAppointments || 0}, Total patients: ${stats?.totalPatients || 0}`);
  } else {
    logTest('GET /dashboard/stats', 'FAIL', 
      `Error: ${currentStats.error?.message || currentStats.error}`);
  }
  
  // Test 3: Today's Appointments
  const todayAppts = await makeRequest('GET', 
    `${CONFIG.API_GATEWAY}/api/doctors/appointments/today`);
  
  if (todayAppts.success) {
    const appointments = todayAppts.data.data;
    logTest('GET /appointments/today', 'PASS', 
      `Today's appointments: ${Array.isArray(appointments) ? appointments.length : 'N/A'}`);
  } else {
    logTest('GET /appointments/today', 'FAIL', 
      `Error: ${todayAppts.error?.message || todayAppts.error}`);
  }
}

async function testErrorHandling() {
  logSection('ERROR HANDLING TESTS');
  
  // Test 1: Non-existent doctor
  const notFound = await makeRequest('GET', 
    `${CONFIG.API_GATEWAY}/api/doctors/INVALID-DOC-ID/stats`);
  
  logTest('404 Error Handling', notFound.status === 404 ? 'PASS' : 'FAIL',
    `Status: ${notFound.status}, Expected: 404`);
  
  // Test 2: Unauthorized access (without token)
  const tempToken = authToken;
  authToken = null;
  
  const unauthorized = await makeRequest('GET', 
    `${CONFIG.API_GATEWAY}/api/doctors/dashboard/stats`);
  
  logTest('401 Unauthorized Handling', unauthorized.status === 401 ? 'PASS' : 'FAIL',
    `Status: ${unauthorized.status}, Expected: 401`);
  
  authToken = tempToken; // Restore token
}

// Main test execution
async function runAllTests() {
  console.log('🚀 COMPREHENSIVE DOCTOR PROFILE API TESTING');
  console.log('📅 Date:', new Date().toISOString());
  console.log('🏥 Hospital Management System - Doctor Profile APIs\n');
  
  try {
    await testServiceHealth();
    
    const authSuccess = await testAuthentication();
    if (!authSuccess) {
      console.log('\n❌ Authentication failed. Skipping authenticated tests.');
      return;
    }
    
    await testDoctorProfileEndpoints();
    await testAuthenticatedEndpoints();
    await testErrorHandling();
    
  } catch (error) {
    console.error('\n💥 Unexpected error during testing:', error.message);
  }
  
  // Final results
  logSection('TEST RESULTS SUMMARY');
  console.log(`📊 Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n🔍 Failed Tests:');
    testResults.details
      .filter(test => test.status === 'FAIL')
      .forEach(test => console.log(`   - ${test.testName}: ${test.details}`));
  }
  
  console.log('\n🏁 Testing Complete!');
}

// Run tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, CONFIG };
