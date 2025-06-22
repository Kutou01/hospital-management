#!/usr/bin/env node

/**
 * 🔍 TEST AUTH SERVICE DIRECTLY
 * 
 * Test auth service directly để xem lỗi cụ thể
 */

const axios = require('axios');
const crypto = require('crypto');

// Configuration
const AUTH_SERVICE_URL = 'http://localhost:3001';

async function testAuthDirect() {
  console.log('🔍 TESTING AUTH SERVICE DIRECTLY');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Health check
    console.log('\n1️⃣ Health check...');
    const healthResult = await axios.get(`${AUTH_SERVICE_URL}/health`);
    console.log('✅ Auth service is healthy:', healthResult.data);
    
    // Test 2: Simple signup
    console.log('\n2️⃣ Testing simple signup...');
    const testUser = {
      email: `test.${crypto.randomBytes(4).toString('hex')}@hospital.com`,
      password: 'TestPassword123!',
      full_name: 'Test User',
      role: 'patient'
    };
    
    console.log('📤 Signup data:', JSON.stringify(testUser, null, 2));
    
    try {
      const signupResult = await axios.post(`${AUTH_SERVICE_URL}/api/auth/signup`, testUser);
      console.log('✅ Signup successful:', signupResult.data);
    } catch (signupError) {
      console.log('❌ Signup failed:');
      console.log('Status:', signupError.response?.status);
      console.log('Error:', signupError.response?.data);
    }
    
    // Test 3: Doctor signup
    console.log('\n3️⃣ Testing doctor signup...');
    const doctorUser = {
      email: `doctor.${crypto.randomBytes(4).toString('hex')}@hospital.com`,
      password: 'TestPassword123!',
      full_name: 'Nguyễn Văn Test',  // ✅ FIX: No "Dr." prefix
      role: 'doctor',
      phone_number: '0987654321',
      gender: 'male',
      date_of_birth: '1985-05-15',  // ✅ ADD: Required field
      specialty: 'Tim mạch',
      license_number: `VN-TS-${Date.now().toString().slice(-4)}`,
      qualification: 'Thạc sĩ Y khoa',
      department_id: 'DEPT001'
    };
    
    console.log('📤 Doctor signup data:', JSON.stringify(doctorUser, null, 2));
    
    try {
      const doctorSignupResult = await axios.post(`${AUTH_SERVICE_URL}/api/auth/register-doctor`, doctorUser);
      console.log('✅ Doctor signup successful:', doctorSignupResult.data);
    } catch (doctorError) {
      console.log('❌ Doctor signup failed:');
      console.log('Status:', doctorError.response?.status);
      console.log('Error:', doctorError.response?.data);
      
      // Detailed error analysis
      if (doctorError.response?.data) {
        console.log('\n🔍 Detailed error analysis:');
        console.log(JSON.stringify(doctorError.response.data, null, 2));
      }
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
  }
}

// Run test
if (require.main === module) {
  testAuthDirect().catch(error => {
    console.error('❌ Test error:', error);
    process.exit(1);
  });
}

module.exports = { testAuthDirect };
