const axios = require('axios');

async function testFixes() {
  console.log('🧪 TESTING FIXES FOR 2 ERRORS');
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
    console.log('   Token (first 30 chars):', token.substring(0, 30) + '...');

    // Step 2: Test API Gateway Appointment Routing (with auth)
    console.log('\n📅 Step 2: Test API Gateway Appointment Routing...');
    try {
      const appointmentResponse = await axios.get('http://localhost:3100/api/appointments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('✅ API Gateway Appointment Routing: FIXED');
      console.log('   Status:', appointmentResponse.status);
      console.log('   Appointments count:', appointmentResponse.data.appointments?.length || 0);
    } catch (error) {
      console.log('❌ API Gateway Appointment Routing: STILL FAILING');
      console.log('   Error:', error.response?.data?.error || error.message);
      console.log('   Details:', JSON.stringify(error.response?.data, null, 2));
    }

    // Step 3: Test Internal Service Communication
    console.log('\n🔗 Step 3: Test Internal Service Communication...');
    try {
      const internalResponse = await axios.get('http://localhost:3100/internal/appointments');

      console.log('✅ Internal Service Communication: FIXED');
      console.log('   Status:', internalResponse.status);
    } catch (error) {
      console.log('❌ Internal Service Communication: STILL FAILING');
      console.log('   Error:', error.response?.data?.error || error.message);
      console.log('   Status:', error.response?.status);
    }

    console.log('\n🎯 SUMMARY:');
    console.log('='.repeat(30));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFixes().catch(console.error);
