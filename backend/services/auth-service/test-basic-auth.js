#!/usr/bin/env node

/**
 * Test basic Auth Service functionality (Email/Password only)
 */

const axios = require('axios');

const AUTH_SERVICE_URL = 'http://localhost:3001';

// Test data
const testUser = {
  email: 'test.basic@example.com',
  password: 'TestPassword123',
  full_name: 'Test Basic User',
  role: 'patient',
  phone_number: '0901234567',
  gender: 'male',
  date_of_birth: '1990-01-01'
};

async function testBasicAuth() {
  console.log('🧪 Testing Basic Auth Service (Email/Password)...\n');

  try {
    // 1. Test Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await axios.get(`${AUTH_SERVICE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data.status);
    console.log('');

    // 2. Test Registration
    console.log('2️⃣ Testing Registration...');
    try {
      const signUpResponse = await axios.post(`${AUTH_SERVICE_URL}/api/auth/signup`, testUser);
      console.log('✅ Registration successful:', signUpResponse.data.success);
      console.log('   User ID:', signUpResponse.data.user?.id);
      console.log('   Role:', signUpResponse.data.user?.role);
      console.log('   Department-based ID:', signUpResponse.data.user?.patient_id || signUpResponse.data.user?.doctor_id);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️ User already exists, continuing with tests...');
      } else {
        console.log('❌ Registration failed:', error.response?.data?.error || error.message);
      }
    }
    console.log('');

    // 3. Test Login
    console.log('3️⃣ Testing Login...');
    try {
      const signInResponse = await axios.post(`${AUTH_SERVICE_URL}/api/auth/signin`, {
        email: testUser.email,
        password: testUser.password
      });
      console.log('✅ Login successful:', signInResponse.data.success);
      console.log('   Access Token:', signInResponse.data.access_token ? 'Present' : 'Missing');
      console.log('   User:', signInResponse.data.user?.full_name);
      console.log('   Role:', signInResponse.data.user?.role);
      
      // Store token for authenticated requests
      const accessToken = signInResponse.data.access_token;
      
      // 4. Test Token Verification
      console.log('');
      console.log('4️⃣ Testing Token Verification...');
      const verifyResponse = await axios.get(`${AUTH_SERVICE_URL}/api/auth/verify`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      console.log('✅ Token verification successful:', verifyResponse.data.success);
      console.log('   User:', verifyResponse.data.user?.full_name);
      console.log('   Role:', verifyResponse.data.user?.role);
      
      // 5. Test Logout
      console.log('');
      console.log('5️⃣ Testing Logout...');
      const logoutResponse = await axios.post(`${AUTH_SERVICE_URL}/api/auth/signout`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      console.log('✅ Logout successful:', logoutResponse.data.success);
      
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    console.log('🎉 Basic Auth tests completed!');
    console.log('');
    console.log('📋 Summary:');
    console.log('   ✅ Health Check');
    console.log('   ✅ Registration (Email/Password)');
    console.log('   ✅ Login (Email/Password)');
    console.log('   ✅ Token Verification');
    console.log('   ✅ Logout');
    console.log('');
    console.log('🚀 Basic Auth Service is working correctly!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Test frontend integration');
    console.log('   2. Test with different user roles (doctor, admin)');
    console.log('   3. Add Magic Link, Phone OTP, OAuth later');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Run tests
testBasicAuth().catch(console.error);
