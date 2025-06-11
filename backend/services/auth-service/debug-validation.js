#!/usr/bin/env node

/**
 * 🔍 DEBUG VALIDATION SCRIPT
 * 
 * Test để debug chi tiết lỗi validation
 */

const axios = require('axios');

const AUTH_SERVICE_URL = 'http://localhost:3001';

// Color logging utility
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

// Test data
const testDoctor = {
  email: `debug.doctor.${Date.now()}@hospital.com`,
  password: 'TestPassword123!',
  full_name: 'Debug Doctor Test',
  role: 'doctor',
  phone_number: '0123456789',
  gender: 'male',
  specialty: 'Cardiology',
  license_number: 'VN-CD-1234',
  qualification: 'MD PhD',
  department_id: 'DEPT001'
};

const testPatient = {
  email: `debug.patient.${Date.now()}@hospital.com`,
  password: 'TestPassword123!',
  full_name: 'Debug Patient Test',
  role: 'patient',
  phone_number: '0987654321',
  gender: 'female',
  date_of_birth: '1990-01-01'
};

const testAdmin = {
  email: `debug.admin.${Date.now()}@hospital.com`,
  password: 'TestPassword123!',
  full_name: 'Debug Admin Test',
  role: 'admin',
  phone_number: '0111222333',
  gender: 'male'
};

async function debugRegistration(userData, userType) {
  log(`\n🔍 Testing ${userType} Registration...`, 'blue');
  log(`📧 Email: ${userData.email}`, 'cyan');
  log(`👤 Name: ${userData.full_name}`, 'cyan');
  log(`📱 Phone: ${userData.phone_number}`, 'cyan');
  log(`🎭 Role: ${userData.role}`, 'cyan');
  
  // Log all data being sent
  log('📦 Full payload:', 'yellow');
  console.log(JSON.stringify(userData, null, 2));
  
  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/signup`, userData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      },
      validateStatus: () => true // Don't throw on 4xx/5xx
    });
    
    log(`📊 Response Status: ${response.status}`, 'cyan');
    log('📦 Response Data:', 'yellow');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      log(`✅ ${userType} registration successful!`, 'green');
      return { success: true, data: response.data };
    } else {
      log(`❌ ${userType} registration failed`, 'red');
      
      // Show detailed validation errors
      if (response.data.details && Array.isArray(response.data.details)) {
        log('🔍 Validation Errors:', 'red');
        response.data.details.forEach((error, index) => {
          log(`   ${index + 1}. Field: ${error.path || error.param}`, 'red');
          log(`      Message: ${error.msg}`, 'red');
          log(`      Value: ${error.value}`, 'red');
        });
      }
      
      return { success: false, error: response.data };
    }
    
  } catch (error) {
    log(`💥 Request failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function runDebugTests() {
  log('🔍 Starting Validation Debug Tests', 'yellow');
  log('=' .repeat(50), 'yellow');
  
  // Test health first
  try {
    const healthResponse = await axios.get(`${AUTH_SERVICE_URL}/health`);
    if (healthResponse.status === 200) {
      log('✅ Service is healthy', 'green');
    }
  } catch (error) {
    log('❌ Service is not healthy', 'red');
    return;
  }
  
  // Test each registration type
  await debugRegistration(testDoctor, 'Doctor');
  await debugRegistration(testPatient, 'Patient');
  await debugRegistration(testAdmin, 'Admin');
  
  log('\n🏁 Debug tests completed', 'yellow');
}

// Run if called directly
if (require.main === module) {
  runDebugTests().catch((error) => {
    log(`💥 Fatal error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { debugRegistration, runDebugTests };
