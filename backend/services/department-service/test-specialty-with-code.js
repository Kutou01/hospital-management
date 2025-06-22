#!/usr/bin/env node

/**
 * 🧪 TEST SPECIALTY WITH EXPLICIT CODE
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3005';

async function testSpecialtyWithCode() {
  console.log('🧪 TEST SPECIALTY WITH EXPLICIT CODE');
  console.log('=' .repeat(50));
  
  try {
    // Test with explicit specialty_code
    console.log('\n1️⃣ Testing with explicit specialty_code...');
    
    const newSpecialty = {
      specialty_name: 'Test Debug Specialty',
      specialty_code: 'TEST-DEBUG',
      department_id: 'DEPT001',
      description: 'Debug test specialty'
    };
    
    console.log('Request data:', JSON.stringify(newSpecialty, null, 2));
    
    const response = await axios.post(`${BASE_URL}/api/specialties`, newSpecialty, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    console.log('✅ SUCCESS:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ ERROR:', error.response?.status || 'NO_RESPONSE');
    console.log('Error message:', error.response?.data?.message || error.message);
    console.log('Full error:', JSON.stringify(error.response?.data, null, 2));
  }
}

// Run test
testSpecialtyWithCode().catch(console.error);
