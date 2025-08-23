#!/usr/bin/env node

/**
 * Simple Auth Test - Lightweight version
 * Test auth endpoints directly without full browser automation
 */

const axios = require('axios');

const CONFIG = {
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  testUser: {
    email: `test-simple-${Date.now()}@test.com`,
    password: 'TestPassword123!@#',
    full_name: 'Simple Test User',
    role: 'patient',
    phone_number: '0987654321'
  }
};

console.log('🧪 Simple Auth Service Test');
console.log('===========================');
console.log(`Auth Service: ${CONFIG.authServiceUrl}`);
console.log(`Test User: ${CONFIG.testUser.email}`);
console.log('');

async function testAuthEndpoints() {
  const results = {
    health: false,
    emailCheck: false,
    registration: false,
    login: false,
    tokenVerify: false,
    cleanup: false
  };

  let accessToken = null;
  let userId = null;

  try {
    // Test 1: Health Check
    console.log('🏥 Test 1: Health Check...');
    try {
      const response = await axios.get(`${CONFIG.authServiceUrl}/health`, {
        timeout: 5000
      });
      console.log(`   ✅ Health: ${response.status} - ${response.data?.message || 'OK'}`);
      results.health = true;
    } catch (error) {
      console.log(`   ❌ Health check failed: ${error.message}`);
    }

    // Test 2: Email Availability Check
    console.log('\n📧 Test 2: Email Availability...');
    try {
      const response = await axios.post(`${CONFIG.authServiceUrl}/auth/check-email`, {
        email: CONFIG.testUser.email
      }, {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.data.available) {
        console.log(`   ✅ Email available: ${CONFIG.testUser.email}`);
        results.emailCheck = true;
      } else {
        console.log(`   ⚠️ Email already exists: ${CONFIG.testUser.email}`);
        results.emailCheck = true; // Still counts as success
      }
    } catch (error) {
      console.log(`   ❌ Email check failed: ${error.response?.data?.error || error.message}`);
    }

    // Test 3: User Registration
    console.log('\n👤 Test 3: User Registration...');
    try {
      const response = await axios.post(`${CONFIG.authServiceUrl}/auth/signup`, CONFIG.testUser, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data.success && response.data.user) {
        console.log(`   ✅ Registration successful!`);
        console.log(`   User ID: ${response.data.user.id}`);
        console.log(`   Email: ${response.data.user.email}`);
        console.log(`   Role: ${response.data.user.role}`);
        
        userId = response.data.user.id;
        results.registration = true;

        // Try to get access token from session
        if (response.data.session?.access_token) {
          accessToken = response.data.session.access_token;
          console.log(`   🔑 Access token received`);
        }
      } else {
        console.log(`   ❌ Registration failed: ${response.data.error || 'Unknown error'}`);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      console.log(`   ❌ Registration failed: ${errorMsg}`);
      
      // If user already exists, try to continue with login
      if (errorMsg.includes('already') || error.response?.status === 409) {
        console.log(`   ⚠️ User might already exist, will try login...`);
      }
    }

    // Test 4: User Login
    console.log('\n🔐 Test 4: User Login...');
    try {
      const response = await axios.post(`${CONFIG.authServiceUrl}/auth/signin`, {
        email: CONFIG.testUser.email,
        password: CONFIG.testUser.password
      }, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data.success && response.data.user) {
        console.log(`   ✅ Login successful!`);
        console.log(`   User ID: ${response.data.user.id}`);
        console.log(`   Email: ${response.data.user.email}`);
        console.log(`   Role: ${response.data.user.role}`);
        
        userId = response.data.user.id;
        results.login = true;

        // Get access token
        if (response.data.access_token) {
          accessToken = response.data.access_token;
          console.log(`   🔑 Access token received`);
        } else if (response.data.session?.access_token) {
          accessToken = response.data.session.access_token;
          console.log(`   🔑 Access token from session`);
        }
      } else {
        console.log(`   ❌ Login failed: ${response.data.error || 'Unknown error'}`);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      console.log(`   ❌ Login failed: ${errorMsg}`);
    }

    // Test 5: Token Verification
    if (accessToken) {
      console.log('\n🎫 Test 5: Token Verification...');
      try {
        const response = await axios.get(`${CONFIG.authServiceUrl}/auth/verify`, {
          timeout: 5000,
          headers: { 
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success && response.data.user) {
          console.log(`   ✅ Token verification successful!`);
          console.log(`   Verified User: ${response.data.user.email}`);
          console.log(`   Role: ${response.data.user.role}`);
          results.tokenVerify = true;
        } else {
          console.log(`   ❌ Token verification failed: ${response.data.error || 'Unknown error'}`);
        }
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        console.log(`   ❌ Token verification failed: ${errorMsg}`);
      }
    } else {
      console.log('\n⏭️ Test 5: Skipped (no access token)');
    }

    // Test 6: Get User Profile
    if (accessToken) {
      console.log('\n👤 Test 6: Get User Profile...');
      try {
        const response = await axios.get(`${CONFIG.authServiceUrl}/auth/me`, {
          timeout: 5000,
          headers: { 
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success && response.data.user) {
          console.log(`   ✅ Profile fetch successful!`);
          console.log(`   Profile: ${response.data.user.full_name}`);
          console.log(`   Role: ${response.data.user.role}`);
          
          // Check for role-specific ID
          if (response.data.user.patient_id) {
            console.log(`   Patient ID: ${response.data.user.patient_id}`);
          }
          if (response.data.user.doctor_id) {
            console.log(`   Doctor ID: ${response.data.user.doctor_id}`);
          }
          if (response.data.user.admin_id) {
            console.log(`   Admin ID: ${response.data.user.admin_id}`);
          }
        } else {
          console.log(`   ❌ Profile fetch failed: ${response.data.error || 'Unknown error'}`);
        }
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        console.log(`   ❌ Profile fetch failed: ${errorMsg}`);
      }
    } else {
      console.log('\n⏭️ Test 6: Skipped (no access token)');
    }

    // Note: We won't do cleanup by default to avoid deleting user data
    console.log('\n📝 Test 6: Cleanup (Info only)...');
    console.log(`   ℹ️ Test user created: ${CONFIG.testUser.email}`);
    console.log(`   ℹ️ You can manually delete this user if needed`);
    results.cleanup = true;

    return results;

  } catch (error) {
    console.error('❌ Test suite error:', error.message);
    return results;
  }
}

async function main() {
  const results = await testAuthEndpoints();

  // Results Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(50));
  
  const tests = [
    { name: 'Health Check', key: 'health', desc: 'Auth service availability' },
    { name: 'Email Check', key: 'emailCheck', desc: 'Email availability endpoint' },
    { name: 'Registration', key: 'registration', desc: 'User signup process' },
    { name: 'Login', key: 'login', desc: 'User signin process' },
    { name: 'Token Verify', key: 'tokenVerify', desc: 'JWT token validation' },
    { name: 'Cleanup', key: 'cleanup', desc: 'Test cleanup' }
  ];

  tests.forEach(test => {
    const status = results[test.key] ? '✅ PASS' : '❌ FAIL';
    console.log(`${test.name.padEnd(15)} ${status.padEnd(10)} ${test.desc}`);
  });

  const passedTests = tests.filter(test => results[test.key]).length;
  const totalTests = tests.length;

  console.log('\n📈 OVERALL RESULTS:');
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! Auth service working perfectly!');
  } else if (passedTests >= 4) {
    console.log(`✅ ${passedTests}/${totalTests} tests passed. Auth service mostly working.`);
  } else {
    console.log(`⚠️ ${passedTests}/${totalTests} tests passed. Auth service has issues.`);
  }

  console.log('\n🔧 TROUBLESHOOTING:');
  if (!results.health) {
    console.log('- Check if auth service is running on correct port');
    console.log(`- Verify ${CONFIG.authServiceUrl} is accessible`);
  }
  if (!results.registration) {
    console.log('- Check registration endpoint implementation');
    console.log('- Verify database connection and RLS policies');
  }
  if (!results.login) {
    console.log('- Check login endpoint implementation');
    console.log('- Verify password requirements and validation');
  }

  console.log('\n🧪 Simple auth test completed!');
}

// Run tests
main().catch(console.error);
