#!/usr/bin/env node

/**
 * 🧪 TEST SPECIALTY FINAL
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3005';

async function testSpecialtyFinal() {
  console.log('🧪 TEST SPECIALTY FINAL');
  console.log('=' .repeat(50));
  
  try {
    // Test with valid name
    console.log('\n1️⃣ Testing with valid specialty name...');
    
    const newSpecialty = {
      specialty_name: 'Tim Mạch Can Thiệp Mới',
      department_id: 'DEPT001',
      description: 'Chuyên khoa tim mạch can thiệp mới'
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
testSpecialtyFinal().catch(console.error);
