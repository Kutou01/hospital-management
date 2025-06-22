#!/usr/bin/env node

/**
 * 🔍 CHECK SUPABASE CONSTRAINTS
 * 
 * Kiểm tra các constraints và điều kiện cần thiết trước khi tạo doctor
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

async function checkConstraints() {
  log('🔍 Checking Supabase Constraints for Doctor Creation', 'cyan');
  log('=' .repeat(60), 'cyan');
  
  let authToken = null;
  
  try {
    // 1. Get auth token
    log('\n1️⃣ Getting auth token...', 'yellow');
    
    const testUser = {
      email: `admin.constraint.${crypto.randomBytes(4).toString('hex')}@hospital.com`,
      password: 'TestPassword123!',
      full_name: 'Constraint Test Admin',
      role: 'admin'
    };
    
    // Register and login
    const registerResult = await makeRequest('POST', `${API_GATEWAY_URL}/api/auth/signup`, testUser);
    if (!registerResult.success) {
      log(`❌ Registration failed: ${registerResult.error}`, 'red');
      return;
    }
    
    const loginResult = await makeRequest('POST', `${API_GATEWAY_URL}/api/auth/signin`, {
      email: testUser.email,
      password: testUser.password
    });
    
    if (loginResult.success && (loginResult.data.token || loginResult.data.access_token)) {
      authToken = loginResult.data.token || loginResult.data.access_token;
      log(`✅ Auth token obtained`, 'green');
    } else {
      log(`❌ Login failed: ${loginResult.error}`, 'red');
      return;
    }
    
    // 2. Check departments exist
    log('\n2️⃣ Checking departments...', 'yellow');
    
    // Try to get departments (this might not be exposed via API)
    const deptResult = await makeRequest('GET', `${API_GATEWAY_URL}/api/departments`, null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    if (deptResult.success) {
      log(`✅ Departments API accessible: ${deptResult.data.length || 0} departments`, 'green');
      if (deptResult.data.length > 0) {
        log(`First department: ${JSON.stringify(deptResult.data[0], null, 2)}`, 'white');
      }
    } else {
      log(`⚠️  Departments API not accessible: ${deptResult.error}`, 'yellow');
      log(`This is normal if departments endpoint is not implemented`, 'white');
    }
    
    // 3. Check existing doctors to understand data structure
    log('\n3️⃣ Checking existing doctors...', 'yellow');
    
    const doctorsResult = await makeRequest('GET', `${API_GATEWAY_URL}/api/doctors`, null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    if (doctorsResult.success) {
      const doctors = doctorsResult.data.data || doctorsResult.data;
      log(`✅ Found ${doctors.length} existing doctors`, 'green');
      
      if (doctors.length > 0) {
        const firstDoctor = doctors[0];
        log(`Sample doctor structure:`, 'white');
        console.log(JSON.stringify(firstDoctor, null, 2));
        
        // Analyze patterns
        log(`\nAnalyzing ID patterns:`, 'cyan');
        log(`Doctor ID: ${firstDoctor.doctor_id} (Pattern: ${firstDoctor.doctor_id ? 'Valid' : 'Invalid'})`, 'white');
        log(`Department ID: ${firstDoctor.department_id}`, 'white');
        log(`License: ${firstDoctor.license_number}`, 'white');
        log(`Profile ID: ${firstDoctor.profile_id}`, 'white');
      } else {
        log(`⚠️  No existing doctors found`, 'yellow');
      }
    } else {
      log(`❌ Cannot access doctors: ${doctorsResult.error}`, 'red');
      return;
    }
    
    // 4. Test doctor creation with minimal data
    log('\n4️⃣ Testing doctor creation constraints...', 'yellow');
    
    const testDoctor = {
      full_name: `Dr. Constraint Test ${crypto.randomBytes(2).toString('hex')}`,
      specialty: 'Tim mạch',
      qualification: 'Thạc sĩ Y khoa',
      department_id: 'DEPT001',
      license_number: `VN-TEST-${Date.now().toString().slice(-6)}`, // Unique license
      gender: 'male',
      bio: 'Test doctor for constraint checking',
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
      log(`✅ Doctor creation successful!`, 'green');
      log(`Created doctor ID: ${createResult.data.doctor_id}`, 'white');
      
      // 5. Verify the created doctor
      log('\n5️⃣ Verifying created doctor...', 'yellow');
      const verifyResult = await makeRequest('GET', `${API_GATEWAY_URL}/api/doctors/${createResult.data.doctor_id}`, null, {
        'Authorization': `Bearer ${authToken}`
      });
      
      if (verifyResult.success) {
        log(`✅ Doctor verification successful`, 'green');
        log(`Verified doctor: ${verifyResult.data.full_name}`, 'white');
      } else {
        log(`❌ Doctor verification failed: ${verifyResult.error}`, 'red');
      }
      
    } else {
      log(`❌ Doctor creation failed: ${createResult.error}`, 'red');
      log(`Status: ${createResult.status}`, 'red');
      
      if (createResult.fullError) {
        log(`\nDetailed error analysis:`, 'cyan');
        console.log(JSON.stringify(createResult.fullError, null, 2));
        
        // Analyze specific constraint violations
        const errorMsg = createResult.error.toLowerCase();
        
        if (errorMsg.includes('foreign key') || errorMsg.includes('department')) {
          log(`\n🔍 CONSTRAINT ISSUE: Department constraint`, 'red');
          log(`- department_id 'DEPT001' may not exist in departments table`, 'white');
          log(`- Check if departments are properly seeded`, 'white');
        }
        
        if (errorMsg.includes('profile') || errorMsg.includes('uuid')) {
          log(`\n🔍 CONSTRAINT ISSUE: Profile constraint`, 'red');
          log(`- profile_id is required but not provided`, 'white');
          log(`- Need to create profile first or use existing profile_id`, 'white');
        }
        
        if (errorMsg.includes('license') || errorMsg.includes('unique')) {
          log(`\n🔍 CONSTRAINT ISSUE: License uniqueness`, 'red');
          log(`- license_number may already exist`, 'white');
          log(`- Try with different license number`, 'white');
        }
        
        if (errorMsg.includes('pattern') || errorMsg.includes('format')) {
          log(`\n🔍 CONSTRAINT ISSUE: Format validation`, 'red');
          log(`- Some field doesn't match required pattern`, 'white');
          log(`- Check ID formats and field validations`, 'white');
        }
      }
    }
    
  } catch (error) {
    log(`💥 Unexpected error: ${error.message}`, 'red');
  }
  
  log('\n📊 Constraint Check Summary', 'cyan');
  log('=' .repeat(60), 'cyan');
  log('Key findings:', 'white');
  log('1. Check if DEPT001 exists in departments table', 'yellow');
  log('2. profile_id may be required - need to create profile first', 'yellow');
  log('3. license_number must be unique across all doctors', 'yellow');
  log('4. All required fields must be provided with correct formats', 'yellow');
}

// Run constraint check
if (require.main === module) {
  checkConstraints().catch(error => {
    console.error('❌ Constraint check error:', error);
    process.exit(1);
  });
}

module.exports = { checkConstraints };
