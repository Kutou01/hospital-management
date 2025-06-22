#!/usr/bin/env node

/**
 * 🧪 QUICK DOCTOR TEST
 * 
 * Quick test to verify doctor creation with correct data format
 */

const axios = require('axios');
const crypto = require('crypto');

// Configuration
const API_GATEWAY_URL = 'http://localhost:3100';
const AUTH_SERVICE_URL = 'http://localhost:3001';

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function makeRequest(method, url, data = null, headers = {}) {
  const startTime = Date.now();
  
  try {
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      ...(data && { data }),
      timeout: 10000
    };
    
    const response = await axios(config);
    const duration = Date.now() - startTime;
    
    return {
      success: true,
      data: response.data,
      status: response.status,
      duration
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status || 0,
      duration,
      fullError: error.response?.data
    };
  }
}

async function quickTest() {
  log('🧪 Quick Doctor Service Test', 'cyan');
  log('=' .repeat(50), 'cyan');
  
  let authToken = null;
  
  try {
    // 1. Get auth token
    log('\n1️⃣ Getting auth token...', 'yellow');
    
    const testUser = {
      email: `admin.quick.${crypto.randomBytes(4).toString('hex')}@hospital.com`,
      password: 'TestPassword123!',
      full_name: 'Quick Test Admin',
      role: 'admin'
    };
    
    // Register
    const registerResult = await makeRequest('POST', `${API_GATEWAY_URL}/api/auth/signup`, testUser);
    if (!registerResult.success) {
      log(`❌ Registration failed: ${registerResult.error}`, 'red');
      return;
    }
    log(`✅ Registration successful`, 'green');
    
    // Login
    const loginResult = await makeRequest('POST', `${API_GATEWAY_URL}/api/auth/signin`, {
      email: testUser.email,
      password: testUser.password
    });
    
    if (loginResult.success && (loginResult.data.token || loginResult.data.access_token)) {
      authToken = loginResult.data.token || loginResult.data.access_token;
      log(`✅ Login successful`, 'green');
    } else {
      log(`❌ Login failed: ${loginResult.error}`, 'red');
      return;
    }
    
    // 2. Test get doctors
    log('\n2️⃣ Testing get doctors...', 'yellow');
    const getDoctorsResult = await makeRequest('GET', `${API_GATEWAY_URL}/api/doctors`, null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    if (getDoctorsResult.success) {
      log(`✅ Get doctors successful: ${getDoctorsResult.data.data?.length || 0} doctors`, 'green');
    } else {
      log(`❌ Get doctors failed: ${getDoctorsResult.error}`, 'red');
    }
    
    // 3. Test create doctor with correct format
    log('\n3️⃣ Testing create doctor...', 'yellow');
    
    const testDoctor = {
      full_name: `Dr. Quick Test ${crypto.randomBytes(2).toString('hex')}`,
      specialty: 'Tim mạch',
      qualification: 'Thạc sĩ Y khoa',
      department_id: 'DEPT001',
      license_number: `VN-CARD-${Math.floor(Math.random() * 9000) + 1000}`,
      gender: 'male',
      bio: 'Bác sĩ tim mạch test',
      experience_years: 5,
      consultation_fee: 500000,
      languages_spoken: ['Vietnamese', 'English']
    };
    
    log(`Test doctor data:`, 'white');
    console.log(JSON.stringify(testDoctor, null, 2));
    
    const createResult = await makeRequest('POST', `${API_GATEWAY_URL}/api/doctors`, testDoctor, {
      'Authorization': `Bearer ${authToken}`
    });
    
    if (createResult.success) {
      log(`✅ Create doctor successful!`, 'green');
      log(`Doctor ID: ${createResult.data.doctor_id}`, 'white');
      
      // 4. Test get created doctor
      log('\n4️⃣ Testing get created doctor...', 'yellow');
      const getCreatedResult = await makeRequest('GET', `${API_GATEWAY_URL}/api/doctors/${createResult.data.doctor_id}`, null, {
        'Authorization': `Bearer ${authToken}`
      });
      
      if (getCreatedResult.success) {
        log(`✅ Get created doctor successful!`, 'green');
        log(`Doctor name: ${getCreatedResult.data.full_name}`, 'white');
      } else {
        log(`❌ Get created doctor failed: ${getCreatedResult.error}`, 'red');
      }
      
    } else {
      log(`❌ Create doctor failed: ${createResult.error}`, 'red');
      log(`Status: ${createResult.status}`, 'red');
      if (createResult.fullError) {
        log(`Full error:`, 'red');
        console.log(JSON.stringify(createResult.fullError, null, 2));
      }
    }
    
  } catch (error) {
    log(`💥 Unexpected error: ${error.message}`, 'red');
  }
  
  log('\n📊 Quick test completed!', 'cyan');
}

// Run test
if (require.main === module) {
  quickTest().catch(error => {
    console.error('❌ Quick test error:', error);
    process.exit(1);
  });
}

module.exports = { quickTest };
