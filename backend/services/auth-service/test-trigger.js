#!/usr/bin/env node

/**
 * Test script to verify database trigger functionality
 */

const axios = require('axios');

const AUTH_SERVICE_URL = 'http://localhost:3001';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testTriggerFunctionality() {
  const timestamp = Date.now();
  const testUser = {
    email: `trigger.test.${timestamp}@hospital.com`,
    password: 'TestPassword123!',
    full_name: 'Trigger Test User',
    role: 'patient',
    phone_number: '0987654321',
    gender: 'female'
  };

  log('🔍 TESTING DATABASE TRIGGER FUNCTIONALITY', 'blue');
  log('==========================================', 'blue');

  try {
    // Step 1: Register new user
    log('\n📝 Step 1: Registering new user...', 'yellow');
    const signUpResponse = await axios.post(`${AUTH_SERVICE_URL}/api/auth/signup`, testUser);
    
    log('✅ Registration successful!', 'green');
    log(`   User ID: ${signUpResponse.data.user.id}`);
    log(`   Email: ${signUpResponse.data.user.email}`);

    // Step 2: Wait for trigger to execute
    log('\n⏳ Step 2: Waiting for database trigger...', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

    // Step 3: Test immediate sign-in
    log('\n🔐 Step 3: Testing immediate sign-in...', 'yellow');
    try {
      const signInResponse = await axios.post(`${AUTH_SERVICE_URL}/api/auth/signin`, {
        email: testUser.email,
        password: testUser.password
      });

      log('✅ Sign-in successful! Trigger is working!', 'green');
      log(`   User ID: ${signInResponse.data.user.id}`);
      log(`   Role: ${signInResponse.data.user.role}`);
      log(`   Full Name: ${signInResponse.data.user.full_name}`);
      
      // Test token verification
      if (signInResponse.data.session?.access_token) {
        log('\n🔍 Step 4: Testing token verification...', 'yellow');
        const verifyResponse = await axios.get(`${AUTH_SERVICE_URL}/api/auth/verify`, {
          headers: {
            'Authorization': `Bearer ${signInResponse.data.session.access_token}`
          }
        });

        log('✅ Token verification successful!', 'green');
        log(`   Verified User: ${verifyResponse.data.user.full_name}`);
      }

      log('\n🎉 DATABASE TRIGGER IS WORKING CORRECTLY!', 'green');
      log('✅ User registration creates profile automatically', 'green');
      log('✅ Sign-in works immediately after registration', 'green');
      log('✅ Token verification works', 'green');

    } catch (signInError) {
      log('❌ Sign-in failed - Trigger is NOT working', 'red');
      if (signInError.response) {
        log(`   Status: ${signInError.response.status}`, 'red');
        log(`   Error: ${signInError.response.data.error}`, 'red');
      }
      
      log('\n🔧 TRIGGER DIAGNOSIS:', 'yellow');
      log('   The database trigger is not automatically creating profiles', 'yellow');
      log('   This means users can register but cannot sign in', 'yellow');
      log('   Manual profile creation is required', 'yellow');
    }

  } catch (error) {
    log('\n❌ Registration failed:', 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Error: ${error.response.data.error}`, 'red');
      if (error.response.data.details) {
        log(`   Details:`, 'yellow');
        console.log(JSON.stringify(error.response.data.details, null, 2));
      }
    } else {
      log(`   ${error.message}`, 'red');
    }
  }
}

// Run test
testTriggerFunctionality().catch(error => {
  log('❌ Test script error:', 'red');
  log(error.message);
  process.exit(1);
});
