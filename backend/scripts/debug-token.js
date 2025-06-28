const axios = require('axios');
const jwt = require('jsonwebtoken');

async function debugToken() {
  console.log('🔍 DEBUG TOKEN ANALYSIS');
  console.log('='.repeat(50));

  try {
    // Step 1: Login
    console.log('🔐 Step 1: Login...');
    const loginResponse = await axios.post('http://localhost:3100/api/auth/signin', {
      email: 'doctor@hospital.com',
      password: 'Doctor123.'
    });

    const token = loginResponse.data.access_token;
    console.log('✅ Login successful');
    console.log('   Token (first 50 chars):', token.substring(0, 50) + '...');

    // Step 2: Decode JWT token
    console.log('\n🔍 Step 2: Decode JWT token...');
    try {
      const decoded = jwt.decode(token);
      console.log('   Decoded token payload:');
      console.log('   ', JSON.stringify(decoded, null, 4));
    } catch (error) {
      console.log('   ❌ Error decoding token:', error.message);
    }

    // Step 3: Test with manual headers
    console.log('\n🧪 Step 3: Test with manual headers...');
    try {
      const profileResponse = await axios.get('http://localhost:3002/api/doctors/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Test-Client/1.0'
        }
      });

      console.log('   ✅ Profile response:');
      console.log('      Status:', profileResponse.status);
      console.log('      Data:', JSON.stringify(profileResponse.data, null, 2));
    } catch (error) {
      console.log('   ❌ Profile error:');
      console.log('      Status:', error.response?.status);
      console.log('      Message:', error.response?.data?.message || error.message);
      console.log('      Headers sent:', error.config?.headers);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

debugToken().catch(console.error);
