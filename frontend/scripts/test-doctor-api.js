#!/usr/bin/env node

/**
 * Doctor API Integration Test Script
 * Tests Doctor Service APIs from Node.js environment
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

// Test doctor data
const TEST_DOCTOR_DATA = {
  profile_id: '', // Will be set after authentication
  full_name: 'BS. Nguyễn Văn Test Doctor',
  date_of_birth: '1985-01-01',
  specialty: 'Tim mạch',
  qualification: 'Thạc sĩ Y khoa',
  department_id: 'CARD',
  license_number: 'VN-TM-2024',
  gender: 'male',
  bio: 'Bác sĩ chuyên khoa tim mạch với 10 năm kinh nghiệm',
  experience_years: 10,
  consultation_fee: 500000,
  languages_spoken: ['Vietnamese', 'English'],
  phone_number: '0987654321',
  email: 'doctor.test@hospital.com'
};

let authToken = null;
let createdDoctorId = null;

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
      TEST_DOCTOR_DATA.profile_id = response.data.data.user.id;
      
      console.log('✅ Authentication successful');
      console.log(`   Token: ${authToken.substring(0, 20)}...`);
      console.log(`   User ID: ${TEST_DOCTOR_DATA.profile_id}`);
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

async function testGetAllDoctors() {
  console.log('\n👨‍⚕️ Testing GET /api/doctors...');
  
  const result = await makeRequest('GET', '/doctors?page=1&limit=10');
  
  if (result.success) {
    const data = result.data.data || result.data;
    const count = Array.isArray(data) ? data.length : (data.data ? data.data.length : 0);
    const total = data.pagination?.total || count;
    
    console.log(`✅ Retrieved ${count} doctors (Total: ${total})`);
    console.log(`   Response time: ${result.status === 200 ? 'OK' : result.status}`);
  } else {
    console.log('❌ Failed to get doctors:', result.error);
  }
  
  return result.success;
}

async function testCreateDoctor() {
  console.log('\n➕ Testing POST /api/doctors...');
  
  const result = await makeRequest('POST', '/doctors', TEST_DOCTOR_DATA);
  
  if (result.success) {
    const doctor = result.data.data || result.data;
    createdDoctorId = doctor.doctor_id;
    
    console.log(`✅ Created doctor with ID: ${createdDoctorId}`);
    console.log(`   Full name: ${TEST_DOCTOR_DATA.full_name}`);
    console.log(`   Specialty: ${TEST_DOCTOR_DATA.specialty}`);
    console.log(`   Department: ${TEST_DOCTOR_DATA.department_id}`);
  } else {
    console.log('❌ Failed to create doctor:', result.error);
  }
  
  return result.success;
}

async function testGetDoctorById() {
  if (!createdDoctorId) {
    console.log('\n❌ Cannot test GET doctor by ID - no doctor created');
    return false;
  }
  
  console.log('\n🔍 Testing GET /api/doctors/:id...');
  
  const result = await makeRequest('GET', `/doctors/${createdDoctorId}`);
  
  if (result.success) {
    const doctor = result.data.data || result.data;
    console.log(`✅ Retrieved doctor: ${doctor.doctor_id}`);
    console.log(`   Full name: ${doctor.profile?.full_name || 'N/A'}`);
    console.log(`   Specialty: ${doctor.specialty}`);
    console.log(`   Rating: ${doctor.rating || 0}/5`);
  } else {
    console.log('❌ Failed to get doctor by ID:', result.error);
  }
  
  return result.success;
}

async function testGetDoctorProfile() {
  if (!createdDoctorId) {
    console.log('\n❌ Cannot test GET doctor profile - no doctor created');
    return false;
  }
  
  console.log('\n📋 Testing GET /api/doctors/:id/profile...');
  
  const result = await makeRequest('GET', `/doctors/${createdDoctorId}/profile`);
  
  if (result.success) {
    const profile = result.data.data || result.data;
    console.log(`✅ Retrieved doctor profile: ${profile.doctor_id}`);
    console.log(`   Bio: ${profile.bio || 'N/A'}`);
    console.log(`   Experience: ${profile.experience_years || 0} years`);
    console.log(`   Consultation fee: ${profile.consultation_fee || 'N/A'} VND`);
  } else {
    console.log('❌ Failed to get doctor profile:', result.error);
  }
  
  return result.success;
}

async function testUpdateDoctor() {
  if (!createdDoctorId) {
    console.log('\n❌ Cannot test UPDATE doctor - no doctor created');
    return false;
  }
  
  console.log('\n✏️ Testing PUT /api/doctors/:id...');
  
  const updateData = {
    bio: `Updated at ${new Date().toISOString()} by Node.js test`
  };
  
  const result = await makeRequest('PUT', `/doctors/${createdDoctorId}`, updateData);
  
  if (result.success) {
    const doctor = result.data.data || result.data;
    console.log(`✅ Updated doctor: ${doctor.doctor_id}`);
    console.log(`   New bio: ${doctor.bio}`);
  } else {
    console.log('❌ Failed to update doctor:', result.error);
  }
  
  return result.success;
}

async function testSearchDoctors() {
  console.log('\n🔍 Testing GET /api/doctors/search...');
  
  const result = await makeRequest('GET', '/doctors/search?q=Test');
  
  if (result.success) {
    const doctors = result.data.data || result.data;
    const count = Array.isArray(doctors) ? doctors.length : 0;
    
    console.log(`✅ Found ${count} doctors matching "Test"`);
    if (count > 0) {
      console.log(`   First result: ${doctors[0].profile?.full_name || doctors[0].doctor_id}`);
    }
  } else {
    console.log('❌ Failed to search doctors:', result.error);
  }
  
  return result.success;
}

async function testDoctorStats() {
  if (!createdDoctorId) {
    console.log('\n❌ Cannot test doctor stats - no doctor created');
    return false;
  }
  
  console.log('\n📊 Testing GET /api/doctors/:id/stats...');
  
  const result = await makeRequest('GET', `/doctors/${createdDoctorId}/stats`);
  
  if (result.success) {
    const stats = result.data.data || result.data;
    console.log('✅ Retrieved doctor statistics');
    console.log(`   Stats: ${JSON.stringify(stats, null, 2)}`);
  } else {
    console.log('❌ Failed to get doctor stats:', result.error);
  }
  
  return result.success;
}

// Main test runner
async function runAllTests() {
  console.log('🧪 Starting Doctor API Integration Tests');
  console.log('==========================================');
  
  const results = [];
  
  // Test authentication first
  const authSuccess = await testAuthentication();
  if (!authSuccess) {
    console.log('\n❌ Authentication failed - cannot continue with API tests');
    process.exit(1);
  }
  
  // Run API tests
  results.push(await testGetAllDoctors());
  results.push(await testCreateDoctor());
  results.push(await testGetDoctorById());
  results.push(await testGetDoctorProfile());
  results.push(await testUpdateDoctor());
  results.push(await testSearchDoctors());
  results.push(await testDoctorStats());
  
  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Doctor API integration is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the logs above for details.');
  }
  
  console.log('\n💡 Next steps:');
  console.log('   1. Test the frontend integration at: http://localhost:3000/test/doctor-api');
  console.log('   2. Check API Gateway logs for any issues');
  console.log('   3. Verify Doctor Service is running on port 3002');
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
  testGetAllDoctors,
  testCreateDoctor,
  testGetDoctorById,
  testGetDoctorProfile,
  testUpdateDoctor,
  testSearchDoctors,
  testDoctorStats
};
