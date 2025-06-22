const axios = require('axios');

// Test configuration
const AUTH_SERVICE_URL = 'http://localhost:3001';
const TEST_USER_DATA = {
  email: 'newpatient@hospital.com',
  password: 'Patient123.',
  full_name: 'New Test Patient',
  role: 'patient',
  phone_number: '0901234567',
  date_of_birth: '1990-01-01'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function createTestPatient() {
  log('\n👤 CREATING TEST PATIENT USER', 'cyan');
  log('=' .repeat(50), 'cyan');
  
  try {
    // Step 1: Health Check
    log('\n📋 Step 1: Health Check', 'blue');
    try {
      const healthResponse = await axios.get(`${AUTH_SERVICE_URL}/health`);
      log(`✅ Health Check: ${healthResponse.status} - ${healthResponse.data.status}`, 'green');
    } catch (error) {
      log(`❌ Health Check Failed: ${error.message}`, 'red');
      return;
    }

    // Step 2: Create Patient User
    log('\n👤 Step 2: Creating Patient User', 'blue');
    log(`   Email: ${TEST_USER_DATA.email}`, 'yellow');
    log(`   Name: ${TEST_USER_DATA.full_name}`, 'yellow');
    log(`   Role: ${TEST_USER_DATA.role}`, 'yellow');
    log(`   Phone: ${TEST_USER_DATA.phone_number}`, 'yellow');
    
    const createResponse = await axios.post(`${AUTH_SERVICE_URL}/api/auth/signup`, {
      email: TEST_USER_DATA.email,
      password: TEST_USER_DATA.password,
      full_name: TEST_USER_DATA.full_name,
      role: TEST_USER_DATA.role,
      phone_number: TEST_USER_DATA.phone_number,
      date_of_birth: TEST_USER_DATA.date_of_birth
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    // Success case
    log(`✅ Patient Created Successfully: ${createResponse.status}`, 'green');
    
    if (createResponse.data.user) {
      log('\n👤 Created User Information:', 'green');
      log(`   ID: ${createResponse.data.user.id}`, 'green');
      log(`   Email: ${createResponse.data.user.email}`, 'green');
      log(`   Name: ${createResponse.data.user.full_name}`, 'green');
      log(`   Role: ${createResponse.data.user.role}`, 'green');
      
      if (createResponse.data.user.patient_id) {
        log(`   Patient ID: ${createResponse.data.user.patient_id}`, 'green');
      }
    }

    // Step 3: Test Login with new user
    log('\n🔑 Step 3: Testing Login with New User', 'blue');
    
    const loginResponse = await axios.post(`${AUTH_SERVICE_URL}/api/auth/signin`, {
      email: TEST_USER_DATA.email,
      password: TEST_USER_DATA.password
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    log(`✅ Login Test Successful: ${loginResponse.status}`, 'green');
    
    if (loginResponse.data.user) {
      log('\n🎉 Login User Information:', 'green');
      log(`   ID: ${loginResponse.data.user.id}`, 'green');
      log(`   Email: ${loginResponse.data.user.email}`, 'green');
      log(`   Name: ${loginResponse.data.user.full_name}`, 'green');
      log(`   Role: ${loginResponse.data.user.role}`, 'green');
      log(`   Active: ${loginResponse.data.user.is_active}`, 'green');
      
      if (loginResponse.data.user.patient_id) {
        log(`   Patient ID: ${loginResponse.data.user.patient_id}`, 'green');
      }
    }

    log('\n🎉 TEST PATIENT CREATION AND LOGIN COMPLETED SUCCESSFULLY!', 'green');

  } catch (error) {
    // Error case
    log(`❌ Operation Failed: ${error.response?.status || 'Network Error'}`, 'red');
    
    if (error.response?.data) {
      log('\n📋 Error Details:', 'red');
      log(`   Message: ${error.response.data.error || error.response.data.message}`, 'red');
      
      if (error.response.data.details) {
        log(`   Details: ${JSON.stringify(error.response.data.details, null, 2)}`, 'red');
      }
    } else {
      log(`   Network Error: ${error.message}`, 'red');
    }

    // Specific error handling
    if (error.response?.status === 409) {
      log('\n💡 User already exists. Try deleting first:', 'yellow');
      log('   DELETE FROM auth.users WHERE email = \'patient@hospital.com\';', 'yellow');
    }
  }
}

// Main execution
async function main() {
  log('🚀 HOSPITAL MANAGEMENT SYSTEM - CREATE TEST PATIENT', 'cyan');
  log('Time: ' + new Date().toISOString(), 'cyan');
  
  await createTestPatient();
  
  log('\n📊 SUMMARY', 'cyan');
  log('=' .repeat(50), 'cyan');
  log('If successful, you can now use:', 'yellow');
  log(`Email: ${TEST_USER_DATA.email}`, 'yellow');
  log(`Password: ${TEST_USER_DATA.password}`, 'yellow');
  log('For testing login functionality.', 'yellow');
}

// Run the test
main().catch(console.error);
