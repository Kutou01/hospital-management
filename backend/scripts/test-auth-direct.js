const axios = require('axios');

async function testAuthDirect() {
  console.log('🧪 TESTING AUTH SERVICE DIRECTLY');
  console.log('='.repeat(50));

  try {
    // Test Auth Service directly
    console.log('🔐 Testing Auth Service (port 3001)...');
    const authResponse = await axios.post('http://localhost:3001/api/auth/signin', {
      email: 'doctor@hospital.com',
      password: 'Doctor123.'
    });

    console.log('✅ Auth Service response:');
    console.log('   Status:', authResponse.status);
    console.log('   Data:', JSON.stringify(authResponse.data, null, 2));

    // Test API Gateway
    console.log('\n🌐 Testing API Gateway (port 3100)...');
    const gatewayResponse = await axios.post('http://localhost:3100/api/auth/signin', {
      email: 'doctor@hospital.com',
      password: 'Doctor123.'
    });

    console.log('✅ Gateway response:');
    console.log('   Status:', gatewayResponse.status);
    console.log('   Data:', JSON.stringify(gatewayResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Test failed:');
    console.error('   Status:', error.response?.status);
    console.error('   Message:', error.response?.data?.message || error.message);
    console.error('   URL:', error.config?.url);
  }
}

testAuthDirect().catch(console.error);
