#!/usr/bin/env node

/**
 * 🧪 TEST SPECIALTY WITH NEW NAME
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3005';

async function testSpecialtyNewName() {
  console.log('🧪 TEST SPECIALTY WITH NEW NAME');
  console.log('=' .repeat(50));
  
  try {
    // Test with new unique name
    console.log('\n1️⃣ Testing with new unique name...');
    
    const timestamp = Date.now();
    const newSpecialty = {
      specialty_name: `Test Specialty ${timestamp}`,
      department_id: 'DEPT001',
      description: 'Test specialty with unique name'
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
testSpecialtyNewName().catch(console.error);
