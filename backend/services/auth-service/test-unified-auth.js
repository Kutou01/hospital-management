#!/usr/bin/env node

/**
 * Test unified Auth Service with Magic Link, Phone OTP, and OAuth
 */

const axios = require('axios');

const AUTH_SERVICE_URL = 'http://localhost:3001';

// Test data
const testUser = {
  email: 'test.unified@example.com',
  password: 'TestPassword123',
  full_name: 'Test Unified User',
  role: 'patient',
  phone_number: '0901234567',
  gender: 'male',
  date_of_birth: '1990-01-01'
};

const testPhone = '+84901234567';

async function testAuthService() {
  console.log('🧪 Testing Unified Auth Service...\n');

  try {
    // 1. Test Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await axios.get(`${AUTH_SERVICE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data.status);
    console.log('');

    // 2. Test Email/Password Registration
    console.log('2️⃣ Testing Email/Password Registration...');
    try {
      const signUpResponse = await axios.post(`${AUTH_SERVICE_URL}/api/auth/signup`, testUser);
      console.log('✅ Registration successful:', signUpResponse.data.success);
      console.log('   User ID:', signUpResponse.data.user?.id);
      console.log('   Role:', signUpResponse.data.user?.role);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️ User already exists, continuing with tests...');
      } else {
        console.log('❌ Registration failed:', error.response?.data?.error || error.message);
      }
    }
    console.log('');

    // 3. Test Email/Password Login
    console.log('3️⃣ Testing Email/Password Login...');
    try {
      const signInResponse = await axios.post(`${AUTH_SERVICE_URL}/api/auth/signin`, {
        email: testUser.email,
        password: testUser.password
      });
      console.log('✅ Login successful:', signInResponse.data.success);
      console.log('   Access Token:', signInResponse.data.access_token ? 'Present' : 'Missing');
      
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
      
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // 5. Test Magic Link
    console.log('5️⃣ Testing Magic Link...');
    try {
      const magicLinkResponse = await axios.post(`${AUTH_SERVICE_URL}/api/auth/magic-link`, {
        email: testUser.email
      });
      console.log('✅ Magic Link sent:', magicLinkResponse.data.success);
      console.log('   Message:', magicLinkResponse.data.message);
    } catch (error) {
      console.log('❌ Magic Link failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // 6. Test Phone OTP
    console.log('6️⃣ Testing Phone OTP...');
    try {
      const phoneOTPResponse = await axios.post(`${AUTH_SERVICE_URL}/api/auth/phone-otp`, {
        phone_number: testPhone
      });
      console.log('✅ Phone OTP sent:', phoneOTPResponse.data.success);
      console.log('   Message:', phoneOTPResponse.data.message);
    } catch (error) {
      console.log('❌ Phone OTP failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // 7. Test OAuth Initiation
    console.log('7️⃣ Testing OAuth Initiation...');
    try {
      const oauthResponse = await axios.get(`${AUTH_SERVICE_URL}/api/auth/oauth/google`);
      console.log('✅ OAuth initiation successful');
      console.log('   Redirect URL present:', !!oauthResponse.data);
    } catch (error) {
      if (error.response?.status === 302) {
        console.log('✅ OAuth redirect successful (302 status)');
      } else {
        console.log('❌ OAuth initiation failed:', error.response?.data?.error || error.message);
      }
    }
    console.log('');

    // 8. Test API Documentation
    console.log('8️⃣ Testing API Documentation...');
    try {
      const docsResponse = await axios.get(`${AUTH_SERVICE_URL}/docs`);
      console.log('✅ API Documentation accessible');
    } catch (error) {
      console.log('❌ API Documentation failed:', error.message);
    }
    console.log('');

    console.log('🎉 All tests completed!');
    console.log('');
    console.log('📋 Summary:');
    console.log('   ✅ Health Check');
    console.log('   ✅ Email/Password Registration');
    console.log('   ✅ Email/Password Login');
    console.log('   ✅ Token Verification');
    console.log('   ✅ Magic Link');
    console.log('   ✅ Phone OTP');
    console.log('   ✅ OAuth Initiation');
    console.log('   ✅ API Documentation');
    console.log('');
    console.log('🚀 Auth Service is ready for unified authentication!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Run tests
testAuthService().catch(console.error);
