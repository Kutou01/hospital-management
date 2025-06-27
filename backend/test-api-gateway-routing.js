const axios = require('axios');

const API_GATEWAY_URL = 'http://localhost:3100';

async function testAPIGatewayRouting() {
  console.log('🧪 Testing API Gateway Routing Fix...\n');

  try {
    // Test 1: Health check endpoints
    console.log('1️⃣ Testing Health Check Endpoints:');
    
    try {
      const gatewayHealth = await axios.get(`${API_GATEWAY_URL}/health`);
      console.log('✅ API Gateway Health:', gatewayHealth.data.status);
    } catch (error) {
      console.log('❌ API Gateway Health failed:', error.message);
    }

    try {
      // Test direct auth service health (not through /api/auth/health)
      const authHealth = await axios.get(`http://localhost:3001/health`);
      console.log('✅ Auth Service Health (direct):', authHealth.data.status);
    } catch (error) {
      console.log('❌ Auth Service Health failed:', error.message);
    }

    try {
      const doctorHealth = await axios.get(`${API_GATEWAY_URL}/api/doctors/health`);
      console.log('✅ Doctor Service Health:', doctorHealth.data.status);
    } catch (error) {
      console.log('❌ Doctor Service Health failed:', error.message);
    }

    console.log('\n2️⃣ Testing Authentication:');
    
    // Test 2: Login to get token (using signin endpoint)
    const loginResponse = await axios.post(`${API_GATEWAY_URL}/api/auth/signin`, {
      email: 'doctor@hospital.com',
      password: 'Doctor123.'
    });

    console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));

    const token = loginResponse.data.token || loginResponse.data.access_token;
    if (token) {
      console.log('✅ Login successful, token received');
      console.log('Token type:', typeof token, 'Length:', token.length);

      console.log('\n3️⃣ Testing Doctor API Endpoints with Authentication:');

      // Test 3: Get doctor profile (should work now)
      try {
        const profileResponse = await axios.get(`${API_GATEWAY_URL}/api/doctors/GEN-DOC-202506-480`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('✅ Get Doctor Profile:', profileResponse.status, profileResponse.data.full_name || 'Profile retrieved');
      } catch (error) {
        console.log('❌ Get Doctor Profile failed:', error.response?.status, error.response?.data?.error || error.message);
      }

      // Test 4: Get doctor appointments stats
      try {
        const statsResponse = await axios.get(`${API_GATEWAY_URL}/api/doctors/GEN-DOC-202506-480/appointments/stats?period=week`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('✅ Get Appointment Stats:', statsResponse.status, 'Stats retrieved');
      } catch (error) {
        console.log('❌ Get Appointment Stats failed:', error.response?.status, error.response?.data?.error || error.message);
      }

      // Test 5: Get doctor schedule
      try {
        const scheduleResponse = await axios.get(`${API_GATEWAY_URL}/api/doctors/GEN-DOC-202506-480/schedule`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('✅ Get Doctor Schedule:', scheduleResponse.status, 'Schedule retrieved');
      } catch (error) {
        console.log('❌ Get Doctor Schedule failed:', error.response?.status, error.response?.data?.error || error.message);
      }

      // Test 6: Get doctor reviews
      try {
        const reviewsResponse = await axios.get(`${API_GATEWAY_URL}/api/doctors/GEN-DOC-202506-480/reviews?page=1&limit=4`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('✅ Get Doctor Reviews:', reviewsResponse.status, 'Reviews retrieved');
      } catch (error) {
        console.log('❌ Get Doctor Reviews failed:', error.response?.status, error.response?.data?.error || error.message);
      }

      // Test 7: Test experience endpoint
      try {
        const experienceResponse = await axios.get(`${API_GATEWAY_URL}/api/doctors/GEN-DOC-202506-480/experiences`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('✅ Get Doctor Experience:', experienceResponse.status, 'Experience retrieved');
      } catch (error) {
        console.log('❌ Get Doctor Experience failed:', error.response?.status, error.response?.data?.error || error.message);
      }

    } else {
      console.log('❌ Login failed - no token received');
    }

  } catch (error) {
    console.log('❌ Login failed:', error.response?.status, error.response?.data?.error || error.message);
    if (error.response?.data) {
      console.log('Login error details:', JSON.stringify(error.response.data, null, 2));
    }
  }

  console.log('\n🏁 API Gateway Routing Test Complete!');
}

// Run the test
testAPIGatewayRouting().catch(console.error);
