const axios = require('axios');

const API_BASE = 'http://localhost:3100/api';
const DOCTOR_ID = 'GEN-DOC-202506-488';

// Test credentials
const TEST_EMAIL = 'doctor@hospital.com';
const TEST_PASSWORD = 'Doctor123.';

async function testDoctorEndpoints() {
  try {
    console.log('🔐 Logging in...');
    
    // Login to get token
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data);
      return;
    }

    const token = loginResponse.data.data.access_token;
    console.log('✅ Login successful');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('\n📊 Testing Doctor Endpoints...\n');

    // Test 1: Doctor Profile (should work)
    try {
      console.log('1️⃣ Testing GET /doctors/{id}/profile');
      const profileResponse = await axios.get(`${API_BASE}/doctors/${DOCTOR_ID}/profile`, { headers });
      console.log('✅ Profile:', profileResponse.data.success ? 'SUCCESS' : 'FAILED');
    } catch (error) {
      console.log('❌ Profile:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test 2: Appointments Stats (newly fixed)
    try {
      console.log('2️⃣ Testing GET /doctors/{id}/appointments/stats');
      const statsResponse = await axios.get(`${API_BASE}/doctors/${DOCTOR_ID}/appointments/stats?period=week`, { headers });
      console.log('✅ Appointments Stats:', statsResponse.data.success ? 'SUCCESS' : 'FAILED');
      if (statsResponse.data.success) {
        console.log('   📈 Data:', JSON.stringify(statsResponse.data.data, null, 2));
      }
    } catch (error) {
      console.log('❌ Appointments Stats:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test 3: Today's Schedule (newly fixed)
    try {
      console.log('3️⃣ Testing GET /doctors/{id}/schedule/today');
      const scheduleResponse = await axios.get(`${API_BASE}/doctors/${DOCTOR_ID}/schedule/today`, { headers });
      console.log('✅ Today Schedule:', scheduleResponse.data.success ? 'SUCCESS' : 'FAILED');
      if (scheduleResponse.data.success) {
        console.log('   📅 Data:', JSON.stringify(scheduleResponse.data.data, null, 2));
      }
    } catch (error) {
      console.log('❌ Today Schedule:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test 4: Reviews (newly fixed)
    try {
      console.log('4️⃣ Testing GET /doctors/{id}/reviews');
      const reviewsResponse = await axios.get(`${API_BASE}/doctors/${DOCTOR_ID}/reviews?page=1&limit=4`, { headers });
      console.log('✅ Reviews:', reviewsResponse.data.success ? 'SUCCESS' : 'FAILED');
      if (reviewsResponse.data.success) {
        console.log('   ⭐ Data:', JSON.stringify(reviewsResponse.data.data, null, 2));
      }
    } catch (error) {
      console.log('❌ Reviews:', error.response?.status, error.response?.data?.message || error.message);
    }

    // Test 5: General Stats (should work)
    try {
      console.log('5️⃣ Testing GET /doctors/{id}/stats');
      const generalStatsResponse = await axios.get(`${API_BASE}/doctors/${DOCTOR_ID}/stats`, { headers });
      console.log('✅ General Stats:', generalStatsResponse.data.success ? 'SUCCESS' : 'FAILED');
      if (generalStatsResponse.data.success) {
        console.log('   📊 Data:', JSON.stringify(generalStatsResponse.data.data, null, 2));
      }
    } catch (error) {
      console.log('❌ General Stats:', error.response?.status, error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testDoctorEndpoints();
