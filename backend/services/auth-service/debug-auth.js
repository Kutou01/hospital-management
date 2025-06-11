#!/usr/bin/env node

/**
 * Debug script for Auth Service
 * Tests specific issues with registration and sign-in
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

async function debugRegistrationAndSignIn() {
  // Test with existing user that has profile
  const testUser = {
    email: 'debug.test.1749339380052@hospital.com',
    password: 'TestPassword123!',
    full_name: 'Debug Test User',
    role: 'patient',
    phone_number: '0123456789',
    gender: 'male'
  };

  log('🔍 DEBUG: Auth Service Registration & Sign-In', 'blue');
  log('==============================================', 'blue');

  try {
    // Skip registration, test sign-in directly with existing user
    log('\n🔐 Step 1: Testing Sign-In with existing user...', 'yellow');

    const signInResponse = await axios.post(`${AUTH_SERVICE_URL}/api/auth/signin`, {
      email: testUser.email,
      password: testUser.password
    });

    log('✅ Sign-in successful!', 'green');
    log(`   User ID: ${signInResponse.data.user.id}`);
    log(`   Role: ${signInResponse.data.user.role}`);
    log(`   Has Session: ${!!signInResponse.data.session}`);
    log(`   Full Response:`, 'blue');
    console.log(JSON.stringify(signInResponse.data, null, 2));

    // Step 2: Test Token Verification
    if (signInResponse.data.session?.access_token) {
      log('\n🔍 Step 2: Testing Token Verification...', 'yellow');
      const verifyResponse = await axios.get(`${AUTH_SERVICE_URL}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${signInResponse.data.session.access_token}`
        }
      });

      log('✅ Token verification successful!', 'green');
      log(`   Verified User: ${verifyResponse.data.user.full_name}`);
    }

    log('\n🎉 All tests passed! Auth service is working correctly.', 'green');

  } catch (error) {
    log('\n❌ Error occurred:', 'red');
    
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Error: ${error.response.data.error}`, 'red');
      
      if (error.response.data.details) {
        log(`   Details:`, 'yellow');
        console.log(JSON.stringify(error.response.data.details, null, 2));
      }
      
      log(`   Full Response:`, 'blue');
      console.log(JSON.stringify(error.response.data, null, 2));
    } else {
      log(`   ${error.message}`, 'red');
    }
  }
}

// Run debug
debugRegistrationAndSignIn().catch(error => {
  log('❌ Debug script error:', 'red');
  log(error.message);
  process.exit(1);
});
