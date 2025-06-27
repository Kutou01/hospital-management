const axios = require('axios');

async function testSimpleAPI() {
  console.log('🧪 SIMPLE API TEST');
  console.log('='.repeat(40));

  try {
    // Step 1: Login
    console.log('🔐 Step 1: Login...');
    const loginResponse = await axios.post('http://localhost:3100/api/auth/signin', {
      email: 'doctor@hospital.com',
      password: 'Doctor123.'
    });

    const token = loginResponse.data.access_token;
    console.log('✅ Login successful');

    // Step 2: Test doctor profile
    console.log('\n👨‍⚕️ Step 2: Test doctor profile...');
    try {
      const profileResponse = await axios.get('http://localhost:3100/api/doctors/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Profile response:');
      console.log('   Status:', profileResponse.status);
      console.log('   Data:', JSON.stringify(profileResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Profile error:', error.response?.status, '-', error.response?.data?.message || error.message);
    }

    // Step 3: Test dashboard stats
    console.log('\n📊 Step 3: Test dashboard stats...');
    try {
      const statsResponse = await axios.get('http://localhost:3100/api/doctors/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Stats response:');
      console.log('   Status:', statsResponse.status);
      console.log('   Data:', JSON.stringify(statsResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Stats error:', error.response?.status, '-', error.response?.data?.message || error.message);
    }

    // Step 4: Test today's appointments
    console.log('\n📅 Step 4: Test today appointments...');
    try {
      const todayResponse = await axios.get('http://localhost:3100/api/doctors/appointments/today', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Today response:');
      console.log('   Status:', todayResponse.status);
      console.log('   Data:', JSON.stringify(todayResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Today error:', error.response?.status, '-', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSimpleAPI().catch(console.error);
