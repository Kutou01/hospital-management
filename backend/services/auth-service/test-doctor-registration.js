const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const AUTH_SERVICE_URL = 'http://localhost:3001';
const SUPABASE_URL = 'https://ciasxktujslgsdgylimv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpYXN4a3R1anNsZ3NkZ3lsaW12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NTU1NjUsImV4cCI6MjA2MzEzMTU2NX0.fd7UdZk2mZsV1K0vKM8V9YWKcfyEY1fr4Q9OQvHd8UQ';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test data
const testDoctorData = {
  email: `test.doctor.${Date.now()}@hospital.com`,
  password: 'TestPassword123!',
  full_name: 'Nguyễn Văn Test',
  role: 'doctor',
  phone_number: '0901234567',
  specialty: 'Tim mạch',
  license_number: 'VN-TM-1234',
  qualification: 'Tiến sĩ Y khoa',
  department_id: 'DEPT001',
  gender: 'male'
};

// Utility functions
function log(message, color = 'white') {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkAuthServiceHealth() {
  try {
    log('\n🔍 Checking Auth Service health...', 'blue');
    const response = await axios.get(`${AUTH_SERVICE_URL}/health`, {
      timeout: 5000
    });
    log('✅ Auth Service is running', 'green');
    return true;
  } catch (error) {
    log('❌ Auth Service is not running or not accessible', 'red');
    log(`   Error: ${error.message}`, 'red');
    return false;
  }
}

async function checkDepartmentExists(departmentId) {
  try {
    log(`\n🔍 Checking if department ${departmentId} exists...`, 'blue');
    const { data, error } = await supabase
      .from('departments')
      .select('department_id, name')
      .eq('department_id', departmentId)
      .single();

    if (error) {
      log(`❌ Error checking department: ${error.message}`, 'red');
      return false;
    }

    if (data) {
      log(`✅ Department found: ${data.name}`, 'green');
      return true;
    } else {
      log('❌ Department not found', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Error checking department: ${error.message}`, 'red');
    return false;
  }
}

async function testDoctorRegistration() {
  try {
    log('\n🧪 Testing Doctor Registration...', 'blue');
    log(`📧 Email: ${testDoctorData.email}`, 'cyan');
    log(`👨‍⚕️ Name: ${testDoctorData.full_name}`, 'cyan');
    log(`🏥 Department: ${testDoctorData.department_id}`, 'cyan');

    const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/signup`, testDoctorData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      log('✅ Doctor registration successful!', 'green');
      log(`   User ID: ${response.data.user?.id}`, 'green');
      log(`   Email: ${response.data.user?.email}`, 'green');
      return response.data;
    } else {
      log('❌ Registration failed', 'red');
      log(`   Error: ${response.data.error}`, 'red');
      return null;
    }
  } catch (error) {
    log('❌ Registration request failed', 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Error: ${error.response.data?.error || error.response.data}`, 'red');
      if (error.response.data?.details) {
        log(`   Details: ${JSON.stringify(error.response.data.details, null, 2)}`, 'red');
      }
    } else {
      log(`   Error: ${error.message}`, 'red');
    }
    return null;
  }
}

async function testDoctorLogin(email, password) {
  try {
    log('\n🔐 Testing Doctor Login...', 'blue');
    
    const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/signin`, {
      email,
      password
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      log('✅ Doctor login successful!', 'green');
      log(`   Token received: ${response.data.token ? 'Yes' : 'No'}`, 'green');
      return response.data;
    } else {
      log('❌ Login failed', 'red');
      log(`   Error: ${response.data.error}`, 'red');
      return null;
    }
  } catch (error) {
    log('❌ Login request failed', 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Error: ${error.response.data?.error || error.response.data}`, 'red');
    } else {
      log(`   Error: ${error.message}`, 'red');
    }
    return null;
  }
}

async function checkDoctorRecord(userId) {
  try {
    log('\n🔍 Checking doctor record in database...', 'blue');
    
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('profile_id', userId)
      .single();

    if (error) {
      log(`❌ Error checking doctor record: ${error.message}`, 'red');
      return null;
    }

    if (data) {
      log('✅ Doctor record found in database!', 'green');
      log(`   Doctor ID: ${data.doctor_id}`, 'green');
      log(`   Full Name: ${data.full_name}`, 'green');
      log(`   Department: ${data.department_id}`, 'green');
      log(`   Specialization: ${data.specialization}`, 'green');
      log(`   Status: ${data.status}`, 'green');
      return data;
    } else {
      log('❌ Doctor record not found in database', 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Error checking doctor record: ${error.message}`, 'red');
    return null;
  }
}

async function runFullTest() {
  log('🏥 HOSPITAL MANAGEMENT - DOCTOR REGISTRATION TEST', 'magenta');
  log('=' .repeat(60), 'magenta');

  // Step 1: Check Auth Service
  const authServiceRunning = await checkAuthServiceHealth();
  if (!authServiceRunning) {
    log('\n❌ Cannot proceed - Auth Service is not running', 'red');
    log('💡 Please start the Auth Service first:', 'yellow');
    log('   cd backend/services/auth-service && npm run dev', 'yellow');
    return;
  }

  // Step 2: Check Department
  const departmentExists = await checkDepartmentExists(testDoctorData.department_id);
  if (!departmentExists) {
    log('\n❌ Cannot proceed - Department does not exist', 'red');
    log('💡 Please create the department first or use an existing one', 'yellow');
    return;
  }

  // Step 3: Test Registration
  const registrationResult = await testDoctorRegistration();
  if (!registrationResult) {
    log('\n❌ Registration failed - cannot proceed with login test', 'red');
    return;
  }

  // Step 4: Check Doctor Record
  const doctorRecord = await checkDoctorRecord(registrationResult.user?.id);
  
  // Step 5: Test Login
  const loginResult = await testDoctorLogin(testDoctorData.email, testDoctorData.password);

  // Summary
  log('\n📊 TEST SUMMARY', 'magenta');
  log('=' .repeat(30), 'magenta');
  log(`Auth Service: ${authServiceRunning ? '✅' : '❌'}`, authServiceRunning ? 'green' : 'red');
  log(`Department Check: ${departmentExists ? '✅' : '❌'}`, departmentExists ? 'green' : 'red');
  log(`Registration: ${registrationResult ? '✅' : '❌'}`, registrationResult ? 'green' : 'red');
  log(`Doctor Record: ${doctorRecord ? '✅' : '❌'}`, doctorRecord ? 'green' : 'red');
  log(`Login: ${loginResult ? '✅' : '❌'}`, loginResult ? 'green' : 'red');

  if (registrationResult && doctorRecord && loginResult) {
    log('\n🎉 ALL TESTS PASSED! Doctor registration system is working correctly.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please check the errors above.', 'yellow');
  }
}

// Run the test
if (require.main === module) {
  runFullTest().catch(error => {
    log(`\n💥 Unexpected error: ${error.message}`, 'red');
    console.error(error);
  });
}

module.exports = {
  runFullTest,
  testDoctorRegistration,
  testDoctorLogin,
  checkDoctorRecord,
  checkAuthServiceHealth,
  checkDepartmentExists
};
