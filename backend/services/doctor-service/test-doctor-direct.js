#!/usr/bin/env node

/**
 * 🔍 TEST DOCTOR SERVICE DIRECTLY
 * 
 * Bypass API Gateway và test trực tiếp Doctor Service
 */

const axios = require('axios');
const crypto = require('crypto');

// Configuration
const DOCTOR_SERVICE_URL = 'http://localhost:3002';

async function testDoctorDirect() {
  console.log('🔍 TESTING DOCTOR SERVICE DIRECTLY');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Health check
    console.log('\n1️⃣ Health check...');
    const healthResult = await axios.get(`${DOCTOR_SERVICE_URL}/health`);
    console.log('✅ Doctor service is healthy:', healthResult.data);
    
    // Test 2: Get all doctors
    console.log('\n2️⃣ Getting all doctors...');
    try {
      const doctorsResult = await axios.get(`${DOCTOR_SERVICE_URL}/api/doctors`);
      console.log('✅ Get doctors successful:');
      console.log(`Found ${doctorsResult.data.data?.length || 0} doctors`);
      
      if (doctorsResult.data.data?.length > 0) {
        const sampleDoctor = doctorsResult.data.data[0];
        console.log('\n📋 Sample doctor:');
        console.log(`  ID: ${sampleDoctor.doctor_id}`);
        console.log(`  Name: ${sampleDoctor.full_name}`);
        console.log(`  Department: ${sampleDoctor.department_id}`);
        console.log(`  License: ${sampleDoctor.license_number}`);
      }
    } catch (getError) {
      console.log('❌ Get doctors failed:', getError.response?.data || getError.message);
    }
    
    // Test 3: Create doctor
    console.log('\n3️⃣ Testing doctor creation...');
    const testDoctor = {
      full_name: `Nguyễn Văn Test ${crypto.randomBytes(2).toString('hex')}`,
      specialty: 'Tim mạch',
      qualification: 'Thạc sĩ Y khoa',
      department_id: 'DEPT001',
      license_number: `VN-TS-${Date.now().toString().slice(-4)}`,
      gender: 'male',
      bio: 'Bác sĩ chuyên khoa tim mạch',
      experience_years: 5,
      consultation_fee: 500000,
      address: {
        street: '123 Đường ABC',
        city: 'Hồ Chí Minh',
        country: 'Vietnam'
      },
      languages_spoken: ['Vietnamese', 'English']
    };
    
    console.log('📤 Test doctor data:', JSON.stringify(testDoctor, null, 2));
    
    try {
      const createResult = await axios.post(`${DOCTOR_SERVICE_URL}/api/doctors`, testDoctor);
      console.log('✅ Doctor creation successful:', createResult.data);
      
      // Test 4: Get created doctor
      if (createResult.data.doctor_id) {
        console.log('\n4️⃣ Verifying created doctor...');
        try {
          const getResult = await axios.get(`${DOCTOR_SERVICE_URL}/api/doctors/${createResult.data.doctor_id}`);
          console.log('✅ Doctor verification successful:', getResult.data);
        } catch (getError) {
          console.log('❌ Doctor verification failed:', getError.response?.data || getError.message);
        }
      }
      
    } catch (createError) {
      console.log('❌ Doctor creation failed:');
      console.log('Status:', createError.response?.status);
      console.log('Error:', createError.response?.data);
      
      // Detailed error analysis
      if (createError.response?.data) {
        console.log('\n🔍 Detailed error analysis:');
        console.log(JSON.stringify(createError.response.data, null, 2));
      }
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
  }
}

// Run test
if (require.main === module) {
  testDoctorDirect().catch(error => {
    console.error('❌ Test error:', error);
    process.exit(1);
  });
}

module.exports = { testDoctorDirect };
