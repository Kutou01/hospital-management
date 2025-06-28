#!/usr/bin/env node

/**
 * TEST SCRIPT FOR DASHBOARD PROFILE ENDPOINT FIX
 * Verifies that the /api/doctors/dashboard/profile endpoint now works
 */

const axios = require('axios');

const CONFIG = {
  API_GATEWAY: 'http://localhost:3100',
  DOCTOR_CREDENTIALS: {
    email: 'doctor@hospital.com',
    password: 'Doctor123.'
  }
};

let authToken = null;

async function makeRequest(method, url, data = null) {
  try {
    const config = {
      method,
      url,
      headers: { 'Content-Type': 'application/json' },
      ...(data && { data })
    };
    
    if (authToken) config.headers.Authorization = `Bearer ${authToken}`;
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

async function authenticate() {
  console.log('🔐 Authenticating...');
  const result = await makeRequest('POST', `${CONFIG.API_GATEWAY}/api/auth/login`, {
    email: CONFIG.DOCTOR_CREDENTIALS.email,
    password: CONFIG.DOCTOR_CREDENTIALS.password
  });
  
  if (result.success && result.data.access_token) {
    authToken = result.data.access_token;
    console.log('✅ Authentication successful');
    return true;
  } else {
    console.log('❌ Authentication failed:', result.error);
    return false;
  }
}

async function testDashboardProfileEndpoint() {
  console.log('\n🧪 Testing Dashboard Profile Endpoint...');
  
  const result = await makeRequest('GET', `${CONFIG.API_GATEWAY}/api/doctors/dashboard/profile`);
  
  if (result.success) {
    console.log('✅ /api/doctors/dashboard/profile: SUCCESS');
    console.log('📊 Response data:');
    
    const doctor = result.data.data;
    if (doctor) {
      console.log(`   - Doctor ID: ${doctor.doctor_id || 'N/A'}`);
      console.log(`   - Full Name: ${doctor.full_name || 'N/A'}`);
      console.log(`   - Specialty: ${doctor.specialty || 'N/A'}`);
      console.log(`   - License: ${doctor.license_number || 'N/A'}`);
      console.log(`   - Department: ${doctor.department_id || 'N/A'}`);
      console.log(`   - Status: ${doctor.status || 'N/A'}`);
    } else {
      console.log('   - No doctor data in response');
    }
    
    return true;
  } else {
    console.log('❌ /api/doctors/dashboard/profile: FAILED');
    console.log(`   Status: ${result.status}`);
    console.log(`   Error: ${result.error?.message || result.error}`);
    return false;
  }
}

async function compareDashboardEndpoints() {
  console.log('\n🔍 Comparing Dashboard Endpoints...');
  
  // Test all dashboard endpoints
  const endpoints = [
    { name: 'Profile', url: '/api/doctors/dashboard/profile' },
    { name: 'Stats', url: '/api/doctors/dashboard/stats' },
    { name: 'Complete', url: '/api/doctors/dashboard/complete' }
  ];
  
  const results = {};
  
  for (const endpoint of endpoints) {
    const result = await makeRequest('GET', `${CONFIG.API_GATEWAY}${endpoint.url}`);
    results[endpoint.name] = {
      success: result.success,
      status: result.status,
      hasData: result.success && !!result.data?.data
    };
    
    const symbol = result.success ? '✅' : '❌';
    console.log(`${symbol} ${endpoint.name}: ${result.success ? 'SUCCESS' : 'FAILED'} (${result.status})`);
  }
  
  return results;
}

async function testServiceRestart() {
  console.log('\n🔄 Testing if service restart is needed...');
  
  // Check if the route is available
  const healthCheck = await makeRequest('GET', `${CONFIG.API_GATEWAY}/api/doctors/health`);
  
  if (healthCheck.success) {
    console.log('✅ Doctor service is responding');
    
    // Try the new endpoint
    const profileTest = await testDashboardProfileEndpoint();
    
    if (!profileTest) {
      console.log('⚠️  Endpoint still not working - service restart may be needed');
      console.log('💡 Try restarting the doctor service:');
      console.log('   cd backend/services/doctor-service');
      console.log('   npm run dev');
    }
    
    return profileTest;
  } else {
    console.log('❌ Doctor service is not responding');
    return false;
  }
}

async function runFixVerification() {
  console.log('🔧 DASHBOARD PROFILE ENDPOINT FIX VERIFICATION');
  console.log('================================================');
  console.log('Testing the fix for /api/doctors/dashboard/profile endpoint\n');
  
  // Step 1: Authenticate
  const authSuccess = await authenticate();
  if (!authSuccess) {
    console.log('\n❌ Cannot proceed without authentication');
    return;
  }
  
  // Step 2: Test the fixed endpoint
  const profileSuccess = await testDashboardProfileEndpoint();
  
  // Step 3: Compare with other dashboard endpoints
  const endpointResults = await compareDashboardEndpoints();
  
  // Step 4: Check if service restart is needed
  if (!profileSuccess) {
    await testServiceRestart();
  }
  
  // Final summary
  console.log('\n📋 VERIFICATION SUMMARY');
  console.log('=======================');
  
  if (profileSuccess) {
    console.log('🎉 SUCCESS: Dashboard profile endpoint is now working!');
    console.log('✅ Fix has been successfully applied');
    console.log('✅ Doctor dashboard should now load profile information');
  } else {
    console.log('⚠️  ISSUE: Dashboard profile endpoint still not working');
    console.log('🔧 Possible solutions:');
    console.log('   1. Restart the doctor service');
    console.log('   2. Check if the route was properly added');
    console.log('   3. Verify the build completed successfully');
  }
  
  console.log('\n📊 Dashboard Endpoints Status:');
  Object.entries(endpointResults).forEach(([name, result]) => {
    const symbol = result.success ? '✅' : '❌';
    console.log(`   ${symbol} ${name}: ${result.success ? 'Working' : 'Failed'}`);
  });
  
  console.log('\n🏁 Verification Complete!');
}

// Run the verification
if (require.main === module) {
  runFixVerification().catch(console.error);
}

module.exports = { runFixVerification };
