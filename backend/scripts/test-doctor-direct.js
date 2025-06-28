const axios = require('axios');

async function testDoctorDirect() {
  console.log('🧪 TESTING DOCTOR SERVICE DIRECTLY');
  console.log('='.repeat(50));

  try {
    // Step 1: Login to get token
    console.log('🔐 Step 1: Login...');
    const loginResponse = await axios.post('http://localhost:3100/api/auth/signin', {
      email: 'doctor@hospital.com',
      password: 'Doctor123.'
    });

    const token = loginResponse.data.access_token;
    console.log('✅ Login successful');

    // Step 2: Test Doctor Service directly (port 3002)
    console.log('\n👨‍⚕️ Step 2: Test Doctor Service directly...');
    
    // Test profile endpoint
    console.log('   Testing /api/doctors/profile...');
    try {
      const profileResponse = await axios.get('http://localhost:3002/api/doctors/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('   ✅ Direct profile response:');
      console.log('      Status:', profileResponse.status);
      console.log('      Data:', JSON.stringify(profileResponse.data, null, 2));
    } catch (error) {
      console.log('   ❌ Direct profile error:', error.response?.status, '-', error.response?.data?.message || error.message);
    }

    // Test dashboard stats endpoint
    console.log('\n   Testing /api/doctors/dashboard/stats...');
    try {
      const statsResponse = await axios.get('http://localhost:3002/api/doctors/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('   ✅ Direct stats response:');
      console.log('      Status:', statsResponse.status);
      console.log('      Data:', JSON.stringify(statsResponse.data, null, 2));
    } catch (error) {
      console.log('   ❌ Direct stats error:', error.response?.status, '-', error.response?.data?.message || error.message);
    }

    // Step 3: Test via API Gateway (port 3100)
    console.log('\n🌐 Step 3: Test via API Gateway...');
    
    // Test profile via gateway
    console.log('   Testing /api/doctors/profile via gateway...');
    try {
      const gatewayProfileResponse = await axios.get('http://localhost:3100/api/doctors/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('   ✅ Gateway profile response:');
      console.log('      Status:', gatewayProfileResponse.status);
      console.log('      Data:', JSON.stringify(gatewayProfileResponse.data, null, 2));
    } catch (error) {
      console.log('   ❌ Gateway profile error:', error.response?.status, '-', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDoctorDirect().catch(console.error);
