#!/usr/bin/env node

/**
 * 🔍 CHECK ALL CONSTRAINTS SYSTEMATICALLY
 * 
 * Kiểm tra tất cả constraints và dependencies trước khi test
 */

const axios = require('axios');
const crypto = require('crypto');

// Configuration
const API_GATEWAY_URL = 'http://localhost:3100';
const DOCTOR_SERVICE_URL = 'http://localhost:3002';

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
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status || 0,
      fullError: error.response?.data
    };
  }
}

async function checkAllConstraints() {
  log('🔍 COMPREHENSIVE CONSTRAINT CHECK', 'cyan');
  log('=' .repeat(60), 'cyan');
  
  let authToken = null;
  let constraintIssues = [];
  
  try {
    // 1. Get authentication
    log('\n1️⃣ Getting authentication...', 'yellow');
    
    const testUser = {
      email: `doctor.check.${crypto.randomBytes(4).toString('hex')}@hospital.com`,
      password: 'TestPassword123!',
      full_name: 'Nguyễn Văn Check',  // ✅ FIX: No "Dr." prefix
      role: 'doctor',
      phone_number: '0987654321',
      gender: 'male',
      date_of_birth: '1985-05-15',  // ✅ ADD: Required field
      specialty: 'Tim mạch',
      license_number: `VN-CK-${Date.now().toString().slice(-4)}`,
      qualification: 'Thạc sĩ Y khoa',
      department_id: 'DEPT001'
    };
    
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
      log(`✅ Authentication successful`, 'green');
    } else {
      log(`❌ Login failed: ${loginResult.error}`, 'red');
      return;
    }
    
    // 2. Check existing data structure
    log('\n2️⃣ Analyzing existing data structure...', 'yellow');
    
    const doctorsResult = await makeRequest('GET', `${API_GATEWAY_URL}/api/doctors`, null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    if (doctorsResult.success) {
      const doctors = doctorsResult.data.data || doctorsResult.data;
      log(`✅ Found ${doctors.length} existing doctors`, 'green');
      
      if (doctors.length > 0) {
        const sampleDoctor = doctors[0];
        log(`\n📋 Sample doctor structure:`, 'cyan');
        
        // Analyze required fields
        const requiredFields = [
          'doctor_id', 'profile_id', 'full_name', 'specialty', 
          'qualification', 'department_id', 'license_number', 'gender'
        ];
        
        requiredFields.forEach(field => {
          const exists = sampleDoctor.hasOwnProperty(field);
          const value = sampleDoctor[field];
          log(`  ${exists ? '✅' : '❌'} ${field}: ${value || 'NULL'}`, exists ? 'green' : 'red');
          
          if (!exists || value === null || value === undefined) {
            constraintIssues.push(`Missing required field: ${field}`);
          }
        });
        
        // Analyze ID patterns
        log(`\n🔍 ID Pattern Analysis:`, 'cyan');
        log(`  Doctor ID: ${sampleDoctor.doctor_id} (Pattern: ${/^[A-Z0-9-]+$/.test(sampleDoctor.doctor_id) ? 'Valid' : 'Invalid'})`, 'white');
        log(`  Department ID: ${sampleDoctor.department_id} (Pattern: ${/^DEPT\d+$/.test(sampleDoctor.department_id) ? 'Valid' : 'Invalid'})`, 'white');
        log(`  License: ${sampleDoctor.license_number} (Pattern: ${/^VN-/.test(sampleDoctor.license_number) ? 'Valid' : 'Invalid'})`, 'white');
        log(`  Profile ID: ${sampleDoctor.profile_id} (UUID: ${/^[0-9a-f-]{36}$/i.test(sampleDoctor.profile_id) ? 'Valid' : 'Invalid'})`, 'white');
        
        // Check for unique constraints
        log(`\n🔒 Unique Constraint Analysis:`, 'cyan');
        const licenseNumbers = doctors.map(d => d.license_number);
        const uniqueLicenses = new Set(licenseNumbers);
        log(`  License uniqueness: ${licenseNumbers.length === uniqueLicenses.size ? '✅ All unique' : '❌ Duplicates found'}`, 
            licenseNumbers.length === uniqueLicenses.size ? 'green' : 'red');
        
        if (licenseNumbers.length !== uniqueLicenses.size) {
          constraintIssues.push('License number duplicates detected');
        }
      }
    } else {
      log(`❌ Cannot access doctors: ${doctorsResult.error}`, 'red');
      constraintIssues.push('Cannot access existing doctors data');
    }
    
    // 3. Check department constraints
    log('\n3️⃣ Checking department constraints...', 'yellow');
    
    // Extract unique department IDs from existing doctors
    if (doctorsResult.success) {
      const doctors = doctorsResult.data.data || doctorsResult.data;
      const departmentIds = [...new Set(doctors.map(d => d.department_id))];
      
      log(`📋 Found departments in use:`, 'cyan');
      departmentIds.forEach(deptId => {
        const count = doctors.filter(d => d.department_id === deptId).length;
        log(`  ${deptId}: ${count} doctors`, 'white');
      });
      
      // Check if DEPT001 exists (our test department)
      const hasDept001 = departmentIds.includes('DEPT001');
      log(`\n🎯 DEPT001 availability: ${hasDept001 ? '✅ Available' : '❌ Not found'}`, hasDept001 ? 'green' : 'red');
      
      if (!hasDept001) {
        constraintIssues.push('DEPT001 not found - may cause foreign key constraint violation');
        log(`  💡 Available departments: ${departmentIds.join(', ')}`, 'yellow');
      }
    }
    
    // 4. Test minimal doctor creation
    log('\n4️⃣ Testing minimal doctor creation...', 'yellow');
    
    // Use data that matches existing patterns
    const testDoctor = {
      full_name: `Nguyễn Văn Test ${crypto.randomBytes(2).toString('hex')}`,  // ✅ FIX: No "Dr." prefix
      specialty: 'Tim mạch', // Match existing specialty
      qualification: 'Thạc sĩ Y khoa', // Match existing qualification
      department_id: 'DEPT002', // Use existing department (from sample)
      license_number: `VN-CT-${Date.now().toString().slice(-4)}`, // Unique license
      gender: 'male'
    };
    
    log(`📤 Test data:`, 'white');
    console.log(JSON.stringify(testDoctor, null, 2));
    
    const createResult = await makeRequest('POST', `${API_GATEWAY_URL}/api/doctors`, testDoctor, {
      'Authorization': `Bearer ${authToken}`
    });
    
    if (createResult.success) {
      log(`✅ Doctor creation successful!`, 'green');
      log(`Created doctor ID: ${createResult.data.doctor_id}`, 'white');
      
      // Verify the created doctor
      const verifyResult = await makeRequest('GET', `${API_GATEWAY_URL}/api/doctors/${createResult.data.doctor_id}`, null, {
        'Authorization': `Bearer ${authToken}`
      });
      
      if (verifyResult.success) {
        log(`✅ Doctor verification successful`, 'green');
      } else {
        log(`❌ Doctor verification failed: ${verifyResult.error}`, 'red');
        constraintIssues.push('Created doctor cannot be retrieved');
      }
      
    } else {
      log(`❌ Doctor creation failed: ${createResult.error}`, 'red');
      constraintIssues.push(`Doctor creation failed: ${createResult.error}`);
      
      if (createResult.fullError) {
        log(`\n🔍 Detailed error analysis:`, 'cyan');
        console.log(JSON.stringify(createResult.fullError, null, 2));
        
        // Analyze specific errors
        const errorMsg = (createResult.error || '').toLowerCase();
        
        if (errorMsg.includes('foreign key') || errorMsg.includes('department')) {
          constraintIssues.push('Department foreign key constraint violation');
        }
        if (errorMsg.includes('unique') || errorMsg.includes('license')) {
          constraintIssues.push('License number uniqueness constraint violation');
        }
        if (errorMsg.includes('profile') || errorMsg.includes('uuid')) {
          constraintIssues.push('Profile UUID constraint violation');
        }
        if (errorMsg.includes('null') || errorMsg.includes('not-null')) {
          constraintIssues.push('NOT NULL constraint violation');
        }
      }
    }
    
  } catch (error) {
    log(`💥 Unexpected error: ${error.message}`, 'red');
    constraintIssues.push(`Unexpected error: ${error.message}`);
  }
  
  // 5. Summary and recommendations
  log('\n📊 CONSTRAINT CHECK SUMMARY', 'cyan');
  log('=' .repeat(60), 'cyan');
  
  if (constraintIssues.length === 0) {
    log('🎉 ALL CONSTRAINTS PASSED!', 'green');
    log('✅ Ready for comprehensive testing', 'green');
  } else {
    log(`⚠️  Found ${constraintIssues.length} constraint issues:`, 'yellow');
    constraintIssues.forEach((issue, index) => {
      log(`  ${index + 1}. ${issue}`, 'red');
    });
    
    log('\n💡 RECOMMENDATIONS:', 'cyan');
    log('1. Fix constraint issues before running comprehensive tests', 'yellow');
    log('2. Use existing department IDs from the analysis above', 'yellow');
    log('3. Ensure unique license numbers for each test', 'yellow');
    log('4. Verify database functions are working correctly', 'yellow');
  }
  
  log('\n🎯 NEXT STEPS:', 'cyan');
  if (constraintIssues.length === 0) {
    log('Run comprehensive tests: node test-doctor-api-comprehensive.js', 'green');
  } else {
    log('Fix constraints first, then run: node check-all-constraints.js', 'yellow');
  }
}

// Run constraint check
if (require.main === module) {
  checkAllConstraints().catch(error => {
    console.error('❌ Constraint check error:', error);
    process.exit(1);
  });
}

module.exports = { checkAllConstraints };
