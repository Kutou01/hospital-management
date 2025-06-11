#!/usr/bin/env node

/**
 * Patient API Integration Test Script
 * Tests Patient Service APIs from Node.js environment
 */

const axios = require('axios');

// Configuration
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3100';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

// Test credentials
const TEST_CREDENTIALS = {
  email: 'test@hospital.com',
  password: 'test123456'
};

// Test patient data
const TEST_PATIENT_DATA = {
  profile_id: '', // Will be set after authentication
  full_name: 'Nguyễn Văn Test API',
  date_of_birth: '1990-01-01',
  gender: 'male',
  blood_type: 'O+',
  address: {
    street: '123 API Test Street',
    district: 'Test District',
    city: 'Ho Chi Minh City'
  },
  emergency_contact: {
    name: 'Nguyễn Thị Emergency',
    phone: '0987654321',
    relationship: 'spouse'
  },
  medical_history: 'No significant medical history',
  allergies: ['penicillin'],
  notes: 'Test patient created by Node.js API integration test'
};

let authToken = null;
let createdPatientId = null;

// Helper function to make authenticated requests
async function makeRequest(method, endpoint, data = null) {
  const config = {
    method,
    url: `${API_GATEWAY_URL}/api${endpoint}`,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (authToken) {
    config.headers['Authorization'] = `Bearer ${authToken}`;
  }

  if (data) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return {
      success: true,
      data: response.data,
      status: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500,
    };
  }
}

// Test functions
async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...');
  
  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/signin`, TEST_CREDENTIALS);
    
    if (response.data.success && response.data.data?.session?.access_token) {
      authToken = response.data.data.session.access_token;
      TEST_PATIENT_DATA.profile_id = response.data.data.user.id;
      
      console.log('✅ Authentication successful');
      console.log(`   Token: ${authToken.substring(0, 20)}...`);
      console.log(`   User ID: ${TEST_PATIENT_DATA.profile_id}`);
      return true;
    } else {
      console.log('❌ Authentication failed:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Authentication error:', error.response?.data || error.message);
    return false;
  }
}

async function testGetAllPatients() {
  console.log('\n📋 Testing GET /api/patients...');
  
  const result = await makeRequest('GET', '/patients?page=1&limit=10');
  
  if (result.success) {
    const data = result.data.data || result.data;
    const count = Array.isArray(data) ? data.length : (data.data ? data.data.length : 0);
    const total = data.pagination?.total || count;
    
    console.log(`✅ Retrieved ${count} patients (Total: ${total})`);
    console.log(`   Response time: ${result.status === 200 ? 'OK' : result.status}`);
  } else {
    console.log('❌ Failed to get patients:', result.error);
  }
  
  return result.success;
}

async function testCreatePatient() {
  console.log('\n➕ Testing POST /api/patients...');
  
  const result = await makeRequest('POST', '/patients', TEST_PATIENT_DATA);
  
  if (result.success) {
    const patient = result.data.data || result.data;
    createdPatientId = patient.patient_id;
    
    console.log(`✅ Created patient with ID: ${createdPatientId}`);
    console.log(`   Full name: ${TEST_PATIENT_DATA.full_name}`);
    console.log(`   Gender: ${TEST_PATIENT_DATA.gender}`);
  } else {
    console.log('❌ Failed to create patient:', result.error);
  }
  
  return result.success;
}

async function testGetPatientById() {
  if (!createdPatientId) {
    console.log('\n❌ Cannot test GET patient by ID - no patient created');
    return false;
  }
  
  console.log('\n🔍 Testing GET /api/patients/:id...');
  
  const result = await makeRequest('GET', `/patients/${createdPatientId}`);
  
  if (result.success) {
    const patient = result.data.data || result.data;
    console.log(`✅ Retrieved patient: ${patient.patient_id}`);
    console.log(`   Full name: ${patient.profile?.full_name || 'N/A'}`);
    console.log(`   Status: ${patient.status}`);
  } else {
    console.log('❌ Failed to get patient by ID:', result.error);
  }
  
  return result.success;
}

async function testUpdatePatient() {
  if (!createdPatientId) {
    console.log('\n❌ Cannot test UPDATE patient - no patient created');
    return false;
  }
  
  console.log('\n✏️ Testing PUT /api/patients/:id...');
  
  const updateData = {
    notes: `Updated at ${new Date().toISOString()} by Node.js test`
  };
  
  const result = await makeRequest('PUT', `/patients/${createdPatientId}`, updateData);
  
  if (result.success) {
    const patient = result.data.data || result.data;
    console.log(`✅ Updated patient: ${patient.patient_id}`);
    console.log(`   New notes: ${patient.notes}`);
  } else {
    console.log('❌ Failed to update patient:', result.error);
  }
  
  return result.success;
}

async function testSearchPatients() {
  console.log('\n🔍 Testing GET /api/patients/search...');
  
  const result = await makeRequest('GET', '/patients/search?q=Test');
  
  if (result.success) {
    const patients = result.data.data || result.data;
    const count = Array.isArray(patients) ? patients.length : 0;
    
    console.log(`✅ Found ${count} patients matching "Test"`);
    if (count > 0) {
      console.log(`   First result: ${patients[0].profile?.full_name || patients[0].patient_id}`);
    }
  } else {
    console.log('❌ Failed to search patients:', result.error);
  }
  
  return result.success;
}

// Main test runner
async function runAllTests() {
  console.log('🧪 Starting Patient API Integration Tests');
  console.log('==========================================');
  
  const results = [];
  
  // Test authentication first
  const authSuccess = await testAuthentication();
  if (!authSuccess) {
    console.log('\n❌ Authentication failed - cannot continue with API tests');
    process.exit(1);
  }
  
  // Run API tests
  results.push(await testGetAllPatients());
  results.push(await testCreatePatient());
  results.push(await testGetPatientById());
  results.push(await testUpdatePatient());
  results.push(await testSearchPatients());
  
  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Patient API integration is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the logs above for details.');
  }
  
  console.log('\n💡 Next steps:');
  console.log('   1. Test the frontend integration at: http://localhost:3000/test/patient-api');
  console.log('   2. Check API Gateway logs for any issues');
  console.log('   3. Verify Patient Service is running on port 3003');
}

// Run tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ Test runner error:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testAuthentication,
  testGetAllPatients,
  testCreatePatient,
  testGetPatientById,
  testUpdatePatient,
  testSearchPatients
};
