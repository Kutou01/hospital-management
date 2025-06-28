#!/usr/bin/env node

/**
 * DOCTOR PROFILE DATABASE VALIDATION TESTING
 * Tests database constraints, data integrity, and edge cases
 * Based on actual Supabase schema analysis
 */

const axios = require('axios');

const CONFIG = {
  API_GATEWAY: 'http://localhost:3100',
  DOCTOR_CREDENTIALS: {
    email: 'doctor@hospital.com',
    password: 'Doctor123.'
  },
  KNOWN_DOCTOR: {
    profile_id: '5bdcbd80-f344-40b7-a46b-3760ca487693',
    doctor_id: 'GENE-DOC-202506-006'
  }
};

let authToken = null;
let testResults = { passed: 0, failed: 0, total: 0, details: [] };

function logTest(testName, status, details = '') {
  const symbol = status === 'PASS' ? '✅' : '❌';
  console.log(`${symbol} ${testName}: ${status}`);
  if (details) console.log(`   ${details}`);
  
  testResults.total++;
  if (status === 'PASS') testResults.passed++;
  else testResults.failed++;
}

function logSection(title) {
  console.log(`\n🔍 ${title}`);
  console.log('='.repeat(60));
}

async function makeRequest(method, url, data = null) {
  try {
    const config = {
      method,
      url,
      headers: { 'Content-Type': 'application/json' },
      ...(data && { data })
    };
    
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

async function authenticate() {
  const result = await makeRequest('POST', `${CONFIG.API_GATEWAY}/api/auth/login`, {
    email: CONFIG.DOCTOR_CREDENTIALS.email,
    password: CONFIG.DOCTOR_CREDENTIALS.password
  });
  
  if (result.success && result.data.access_token) {
    authToken = result.data.access_token;
    return true;
  }
  return false;
}

async function testDatabaseConstraints() {
  logSection('DATABASE CONSTRAINTS & VALIDATION TESTING');
  
  // Test 1: Doctor ID Format Validation
  const invalidDoctorIds = [
    'INVALID-ID',
    '123',
    'DOC-INVALID',
    'GENE-DOC-999999',
    ''
  ];
  
  for (const invalidId of invalidDoctorIds) {
    const result = await makeRequest('GET', `${CONFIG.API_GATEWAY}/api/doctors/${invalidId}/stats`);
    logTest(`Invalid Doctor ID: "${invalidId}"`, 
      result.status === 404 || result.status === 400 ? 'PASS' : 'FAIL',
      `Status: ${result.status}, Expected: 404 or 400`);
  }
  
  // Test 2: Profile ID Format Validation
  const invalidProfileIds = [
    'invalid-uuid',
    '123-456-789',
    'not-a-uuid',
    ''
  ];
  
  for (const invalidId of invalidProfileIds) {
    const result = await makeRequest('GET', `${CONFIG.API_GATEWAY}/api/doctors/by-profile/${invalidId}`);
    logTest(`Invalid Profile ID: "${invalidId}"`, 
      result.status === 404 || result.status === 400 ? 'PASS' : 'FAIL',
      `Status: ${result.status}, Expected: 404 or 400`);
  }
}

async function testDataIntegrity() {
  logSection('DATA INTEGRITY & RELATIONSHIPS TESTING');
  
  // Test 1: Doctor-Profile Relationship
  const doctorResult = await makeRequest('GET', 
    `${CONFIG.API_GATEWAY}/api/doctors/by-profile/${CONFIG.KNOWN_DOCTOR.profile_id}`);
  
  if (doctorResult.success && doctorResult.data.data) {
    const doctor = doctorResult.data.data;
    const hasRequiredFields = doctor.doctor_id && doctor.specialty && doctor.license_number;
    
    logTest('Doctor-Profile Relationship', hasRequiredFields ? 'PASS' : 'FAIL',
      `Doctor ID: ${doctor.doctor_id}, Specialty: ${doctor.specialty}, License: ${doctor.license_number}`);
    
    // Test 2: Department Relationship
    if (doctor.department_id) {
      logTest('Department Relationship', 'PASS',
        `Department ID: ${doctor.department_id}`);
    } else {
      logTest('Department Relationship', 'FAIL', 'No department_id found');
    }
    
    // Test 3: Required Fields Validation
    const requiredFields = ['doctor_id', 'specialty', 'license_number', 'gender'];
    const missingFields = requiredFields.filter(field => !doctor[field]);
    
    logTest('Required Fields Present', missingFields.length === 0 ? 'PASS' : 'FAIL',
      missingFields.length > 0 ? `Missing: ${missingFields.join(', ')}` : 'All required fields present');
    
  } else {
    logTest('Doctor-Profile Relationship', 'FAIL', 'Could not retrieve doctor data');
  }
}

async function testBusinessLogic() {
  logSection('BUSINESS LOGIC & CALCULATIONS TESTING');
  
  // Test 1: Stats Calculation
  const statsResult = await makeRequest('GET', 
    `${CONFIG.API_GATEWAY}/api/doctors/${CONFIG.KNOWN_DOCTOR.doctor_id}/stats`);
  
  if (statsResult.success) {
    const stats = statsResult.data.data || statsResult.data;
    
    // Validate stats structure
    const expectedFields = ['totalAppointments', 'totalPatients', 'averageRating'];
    const hasValidStats = expectedFields.some(field => stats.hasOwnProperty(field));
    
    logTest('Stats Calculation', hasValidStats ? 'PASS' : 'FAIL',
      `Stats fields present: ${Object.keys(stats).join(', ')}`);
    
    // Validate numeric values
    const numericFields = Object.entries(stats).filter(([key, value]) => typeof value === 'number');
    const hasValidNumbers = numericFields.every(([key, value]) => value >= 0);
    
    logTest('Stats Numeric Validation', hasValidNumbers ? 'PASS' : 'FAIL',
      `Numeric values: ${numericFields.map(([k, v]) => `${k}:${v}`).join(', ')}`);
  }
  
  // Test 2: Experience Calculation
  const expResult = await makeRequest('GET', 
    `${CONFIG.API_GATEWAY}/api/doctors/${CONFIG.KNOWN_DOCTOR.doctor_id}/experiences`);
  
  if (expResult.success) {
    const experiences = expResult.data.data || expResult.data;
    
    if (Array.isArray(experiences)) {
      const hasValidExperiences = experiences.every(exp => 
        exp.hasOwnProperty('type') && exp.hasOwnProperty('title')
      );
      
      logTest('Experience Data Structure', hasValidExperiences ? 'PASS' : 'FAIL',
        `Found ${experiences.length} experiences`);
    } else {
      logTest('Experience Data Structure', 'FAIL', 'Experiences is not an array');
    }
  }
}

async function testPerformanceAndLimits() {
  logSection('PERFORMANCE & LIMITS TESTING');
  
  // Test 1: Response Time
  const startTime = Date.now();
  const result = await makeRequest('GET', 
    `${CONFIG.API_GATEWAY}/api/doctors/${CONFIG.KNOWN_DOCTOR.doctor_id}/stats`);
  const responseTime = Date.now() - startTime;
  
  logTest('Response Time Performance', responseTime < 2000 ? 'PASS' : 'FAIL',
    `Response time: ${responseTime}ms (Expected: <2000ms)`);
  
  // Test 2: Concurrent Requests
  const concurrentRequests = Array(5).fill().map(() => 
    makeRequest('GET', `${CONFIG.API_GATEWAY}/api/doctors/by-profile/${CONFIG.KNOWN_DOCTOR.profile_id}`)
  );
  
  const concurrentStart = Date.now();
  const results = await Promise.all(concurrentRequests);
  const concurrentTime = Date.now() - concurrentStart;
  
  const allSuccessful = results.every(r => r.success);
  logTest('Concurrent Requests Handling', allSuccessful ? 'PASS' : 'FAIL',
    `5 concurrent requests in ${concurrentTime}ms, Success: ${results.filter(r => r.success).length}/5`);
}

async function testSecurityAndAuth() {
  logSection('SECURITY & AUTHENTICATION TESTING');
  
  // Test 1: Token Validation
  const originalToken = authToken;
  authToken = 'invalid-token';
  
  const invalidTokenResult = await makeRequest('GET', 
    `${CONFIG.API_GATEWAY}/api/doctors/dashboard/stats`);
  
  logTest('Invalid Token Rejection', invalidTokenResult.status === 401 ? 'PASS' : 'FAIL',
    `Status: ${invalidTokenResult.status}, Expected: 401`);
  
  // Test 2: Expired Token Simulation
  authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  
  const expiredTokenResult = await makeRequest('GET', 
    `${CONFIG.API_GATEWAY}/api/doctors/dashboard/stats`);
  
  logTest('Expired Token Rejection', expiredTokenResult.status === 401 ? 'PASS' : 'FAIL',
    `Status: ${expiredTokenResult.status}, Expected: 401`);
  
  // Restore valid token
  authToken = originalToken;
  
  // Test 3: Role-based Access
  const roleBasedResult = await makeRequest('GET', 
    `${CONFIG.API_GATEWAY}/api/doctors/dashboard/stats`);
  
  logTest('Role-based Access Control', roleBasedResult.success ? 'PASS' : 'FAIL',
    `Doctor role access: ${roleBasedResult.success ? 'Allowed' : 'Denied'}`);
}

async function runDatabaseValidationTests() {
  console.log('🔬 DOCTOR PROFILE DATABASE VALIDATION TESTING');
  console.log('📅 Date:', new Date().toISOString());
  console.log('🏥 Testing Database Constraints, Data Integrity & Business Logic\n');
  
  // Authenticate first
  const authSuccess = await authenticate();
  if (!authSuccess) {
    console.log('❌ Authentication failed. Cannot proceed with tests.');
    return;
  }
  
  console.log('✅ Authentication successful. Starting validation tests...\n');
  
  try {
    await testDatabaseConstraints();
    await testDataIntegrity();
    await testBusinessLogic();
    await testPerformanceAndLimits();
    await testSecurityAndAuth();
    
  } catch (error) {
    console.error('\n💥 Unexpected error during testing:', error.message);
  }
  
  // Final results
  logSection('VALIDATION TEST RESULTS SUMMARY');
  console.log(`📊 Total Validation Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n🔍 Failed Validation Tests:');
    testResults.details
      .filter(test => test.status === 'FAIL')
      .forEach(test => console.log(`   - ${test.testName}`));
  }
  
  console.log('\n🏁 Database Validation Testing Complete!');
}

if (require.main === module) {
  runDatabaseValidationTests().catch(console.error);
}

module.exports = { runDatabaseValidationTests };
