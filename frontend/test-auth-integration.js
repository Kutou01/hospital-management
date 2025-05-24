// Test script for Auth Service Integration
// Run this with: node test-auth-integration.js

const API_BASE_URL = 'http://localhost:3001/api';

// Test data
const testUser = {
  email: 'test@hospital.com',
  password: 'test123456',
  full_name: 'Test User',
  role: 'patient',
  phone_number: '+84123456789',
  profile_data: {
    date_of_birth: '1990-01-01',
    gender: 'male'
  }
};

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();
    
    console.log(`${method} ${endpoint}:`, {
      status: response.status,
      success: data.success,
      data: data.data,
      error: data.error
    });

    return { response, data };
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error.message);
    return { error };
  }
}

// Test functions
async function testHealthCheck() {
  console.log('\n=== Testing Health Check ===');
  await apiCall('/health');
}

async function testRegister() {
  console.log('\n=== Testing User Registration ===');
  const { data } = await apiCall('/auth/register', 'POST', testUser);
  return data;
}

async function testLogin() {
  console.log('\n=== Testing User Login ===');
  const { data } = await apiCall('/auth/login', 'POST', {
    email: testUser.email,
    password: testUser.password
  });
  return data;
}

async function testGetProfile(token) {
  console.log('\n=== Testing Get Profile ===');
  await apiCall('/auth/me', 'GET', null, token);
}

async function testRefreshToken(refreshToken) {
  console.log('\n=== Testing Refresh Token ===');
  const { data } = await apiCall('/auth/refresh', 'POST', {
    refresh_token: refreshToken
  });
  return data;
}

async function testLogout(token) {
  console.log('\n=== Testing Logout ===');
  await apiCall('/auth/logout', 'POST', null, token);
}

async function testChangePassword(token) {
  console.log('\n=== Testing Change Password ===');
  await apiCall('/auth/change-password', 'POST', {
    current_password: testUser.password,
    new_password: 'newpassword123'
  }, token);
}

async function testPasswordReset() {
  console.log('\n=== Testing Password Reset Request ===');
  await apiCall('/auth/reset-password', 'POST', {
    email: testUser.email
  });
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Auth Service Integration Tests...');
  console.log(`Testing against: ${API_BASE_URL}`);

  try {
    // Test health check
    await testHealthCheck();

    // Test registration
    const registerResult = await testRegister();
    if (!registerResult?.success) {
      console.log('Registration failed or user already exists, continuing with login...');
    }

    // Test login
    const loginResult = await testLogin();
    if (!loginResult?.success) {
      console.error('❌ Login failed, cannot continue tests');
      return;
    }

    const { access_token, refresh_token } = loginResult.data;
    console.log('\n✅ Login successful, got tokens');

    // Test authenticated endpoints
    await testGetProfile(access_token);
    
    // Test refresh token
    const refreshResult = await testRefreshToken(refresh_token);
    if (refreshResult?.success) {
      console.log('✅ Token refresh successful');
    }

    // Test password reset request
    await testPasswordReset();

    // Test change password (this will invalidate the session)
    await testChangePassword(access_token);

    // Test logout
    await testLogout(access_token);

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Check if auth service is running
async function checkAuthService() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (response.ok) {
      console.log('✅ Auth service is running');
      return true;
    } else {
      console.log('❌ Auth service health check failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Auth service is not running or not accessible');
    console.log('Please make sure the auth service is running on http://localhost:3001');
    return false;
  }
}

// Run the tests
async function main() {
  const isRunning = await checkAuthService();
  if (isRunning) {
    await runTests();
  } else {
    console.log('\n📝 To start the auth service:');
    console.log('cd backend/services/auth-service');
    console.log('npm run dev');
  }
}

main().catch(console.error);
