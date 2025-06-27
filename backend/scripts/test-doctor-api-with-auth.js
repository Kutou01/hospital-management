const axios = require('axios');
require('dotenv').config();

// Configuration
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3100';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

// Test credentials
const TEST_CREDENTIALS = {
  email: 'doctor@hospital.com',
  password: 'Doctor123.'
};

let authToken = null;

async function authenticateUser() {
  console.log('🔐 Authenticating user...');
  console.log(`   Email: ${TEST_CREDENTIALS.email}`);

  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/signin`, TEST_CREDENTIALS);

    // Check for both possible response formats
    if (response.data.success && (response.data.session?.access_token || response.data.access_token)) {
      authToken = response.data.session?.access_token || response.data.access_token;
      const userId = response.data.user?.id || response.data.session?.user?.id;

      console.log('✅ Authentication successful');
      console.log(`   Token: ${authToken.substring(0, 20)}...`);
      console.log(`   User ID: ${userId}`);
      return userId;
    } else {
      console.log('❌ Authentication failed:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Authentication error:', error.response?.data || error.message);
    return null;
  }
}

async function testDoctorAPI(userId) {
  console.log('\n🧪 Testing Doctor API call...');
  console.log(`   User ID: ${userId}`);
  
  try {
    const response = await axios.get(`${API_GATEWAY_URL}/api/doctors/by-profile/${userId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   Status:', response.status);
    console.log('   Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('   Status:', error.response?.status || 'No response');
    console.log('   Response:', JSON.stringify(error.response?.data || error.message, null, 2));
  }
}

async function main() {
  console.log('🏥 HOSPITAL MANAGEMENT SYSTEM - Doctor API Test');
  console.log('='.repeat(50));
  
  // Step 1: Authenticate
  const userId = await authenticateUser();
  if (!userId) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  // Step 2: Test Doctor API
  await testDoctorAPI(userId);
  
  console.log('\n🎉 Test completed!');
}

main().catch(console.error);
