#!/usr/bin/env node

/**
 * Test script to verify Auth Service functionality through API Gateway
 * This script tests the complete authentication flow via the API Gateway
 */

const API_GATEWAY_URL = 'http://localhost:3100';

// Test data
const testDoctor = {
  email: 'doctor.test@hospital.com',
  password: 'SecurePassword123!',
  full_name: 'Dr. Test Doctor',
  role: 'doctor',
  phone_number: '+1234567890',
  profile_data: {
    specialization: 'Cardiology',
    license_number: 'DOC123456',
    years_of_experience: 5
  }
};

const testPatient = {
  email: 'patient.test@hospital.com',
  password: 'SecurePassword123!',
  full_name: 'Test Patient',
  role: 'patient',
  phone_number: '+0987654321',
  profile_data: {
    date_of_birth: '1990-01-01',
    gender: 'male',
    emergency_contact: '+1111111111'
  }
};

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', data = null, token = null) {
  const url = `${API_GATEWAY_URL}/api${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    console.log(`🔄 ${method} ${url}`);
    const response = await fetch(url, options);
    const result = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Response:`, JSON.stringify(result, null, 2));
    
    return { status: response.status, data: result };
  } catch (error) {
    console.error(`❌ Error calling ${endpoint}:`, error.message);
    return { status: 0, error: error.message };
  }
}

// Test functions
async function testHealthCheck() {
  console.log('\n🏥 Testing API Gateway Health Check...');
  const result = await apiCall('/health', 'GET');
  return result.status === 200;
}

async function testAuthServiceHealth() {
  console.log('\n🔐 Testing Auth Service Health via Gateway...');
  // Note: Auth service health is at /health, not /api/health
  const result = await fetch(`${API_GATEWAY_URL}/health`);
  const data = await result.json();
  
  console.log('📊 Gateway Health:', JSON.stringify(data, null, 2));
  
  // Check if auth-service is listed as healthy
  const authService = data.services?.find(s => s.name === 'auth-service');
  if (authService) {
    console.log(`🔐 Auth Service Status: ${authService.status}`);
    return authService.status === 'healthy';
  }
  
  return false;
}

async function testRegistration(userData, userType) {
  console.log(`\n👤 Testing ${userType} Registration via Gateway...`);
  const result = await apiCall('/auth/register', 'POST', userData);
  
  if (result.status === 201 && result.data.success) {
    console.log(`✅ ${userType} registration successful`);
    return result.data.data.user;
  } else {
    console.log(`❌ ${userType} registration failed`);
    return null;
  }
}

async function testLogin(credentials, userType) {
  console.log(`\n🔑 Testing ${userType} Login via Gateway...`);
  const result = await apiCall('/auth/login', 'POST', {
    email: credentials.email,
    password: credentials.password
  });
  
  if (result.status === 200 && result.data.success) {
    console.log(`✅ ${userType} login successful`);
    return result.data.data;
  } else {
    console.log(`❌ ${userType} login failed`);
    return null;
  }
}

async function testGetProfile(token, userType) {
  console.log(`\n👤 Testing Get ${userType} Profile via Gateway...`);
  const result = await apiCall('/auth/me', 'GET', null, token);
  
  if (result.status === 200 && result.data.success) {
    console.log(`✅ ${userType} profile retrieved successfully`);
    return result.data.data.user;
  } else {
    console.log(`❌ ${userType} profile retrieval failed`);
    return null;
  }
}

async function testLogout(token, userType) {
  console.log(`\n🚪 Testing ${userType} Logout via Gateway...`);
  const result = await apiCall('/auth/logout', 'POST', null, token);
  
  if (result.status === 200 && result.data.success) {
    console.log(`✅ ${userType} logout successful`);
    return true;
  } else {
    console.log(`❌ ${userType} logout failed`);
    return false;
  }
}

async function testRefreshToken(refreshToken, userType) {
  console.log(`\n🔄 Testing ${userType} Token Refresh via Gateway...`);
  const result = await apiCall('/auth/refresh', 'POST', {
    refresh_token: refreshToken
  });
  
  if (result.status === 200 && result.data.success) {
    console.log(`✅ ${userType} token refresh successful`);
    return result.data.data;
  } else {
    console.log(`❌ ${userType} token refresh failed`);
    return null;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Auth Service Tests via API Gateway');
  console.log('='.repeat(60));
  
  let passed = 0;
  let total = 0;
  
  // Test 1: API Gateway Health
  total++;
  if (await testHealthCheck()) {
    passed++;
  }
  
  // Test 2: Auth Service Health via Gateway
  total++;
  if (await testAuthServiceHealth()) {
    passed++;
  }
  
  // Test 3: Doctor Registration
  total++;
  const doctorUser = await testRegistration(testDoctor, 'Doctor');
  if (doctorUser) {
    passed++;
  }
  
  // Test 4: Patient Registration
  total++;
  const patientUser = await testRegistration(testPatient, 'Patient');
  if (patientUser) {
    passed++;
  }
  
  // Test 5: Doctor Login
  total++;
  const doctorAuth = await testLogin(testDoctor, 'Doctor');
  if (doctorAuth) {
    passed++;
    
    // Test 6: Doctor Profile
    total++;
    if (await testGetProfile(doctorAuth.access_token, 'Doctor')) {
      passed++;
    }
    
    // Test 7: Doctor Token Refresh
    total++;
    if (await testRefreshToken(doctorAuth.refresh_token, 'Doctor')) {
      passed++;
    }
    
    // Test 8: Doctor Logout
    total++;
    if (await testLogout(doctorAuth.access_token, 'Doctor')) {
      passed++;
    }
  }
  
  // Test 9: Patient Login
  total++;
  const patientAuth = await testLogin(testPatient, 'Patient');
  if (patientAuth) {
    passed++;
    
    // Test 10: Patient Profile
    total++;
    if (await testGetProfile(patientAuth.access_token, 'Patient')) {
      passed++;
    }
    
    // Test 11: Patient Logout
    total++;
    if (await testLogout(patientAuth.access_token, 'Patient')) {
      passed++;
    }
  }
  
  // Results
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Auth Service is working correctly via API Gateway.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the logs above.');
  }
  
  console.log('\n📝 Next Steps:');
  console.log('1. Start API Gateway: cd hospital-management/backend/api-gateway && npm run dev');
  console.log('2. Start Auth Service: cd hospital-management/backend/services/auth-service && npm run dev');
  console.log('3. Start Frontend: cd hospital-management/frontend && npm run dev');
  console.log('4. Test in browser: http://localhost:3000');
}

// Check if services are running
async function checkServices() {
  console.log('🔍 Checking if services are running...');
  
  try {
    const gatewayResponse = await fetch(`${API_GATEWAY_URL}/health`);
    if (gatewayResponse.ok) {
      console.log('✅ API Gateway is running on port 3100');
      await runTests();
    } else {
      console.log('❌ API Gateway is not responding properly');
    }
  } catch (error) {
    console.log('❌ API Gateway is not running on port 3100');
    console.log('\n📝 To start the services:');
    console.log('1. API Gateway: cd hospital-management/backend/api-gateway && npm run dev');
    console.log('2. Auth Service: cd hospital-management/backend/services/auth-service && npm run dev');
  }
}

// Run the tests
checkServices().catch(console.error);
