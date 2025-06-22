#!/usr/bin/env node

/**
 * 🧪 SIMPLE POST TEST
 * 
 * Test POST request to doctor service to see detailed logs
 */

const axios = require('axios');
const crypto = require('crypto');

async function simplePostTest() {
  console.log('🧪 Testing simple POST to doctor service...');
  
  try {
    // Very simple test data
    const testData = {
      full_name: 'Dr. Simple Test',
      specialty: 'Tim mạch',
      qualification: 'Thạc sĩ Y khoa',
      department_id: 'DEPT001',
      license_number: `VN-TEST-${Date.now()}`,
      gender: 'male'
    };
    
    console.log('📤 Sending POST request...');
    console.log('Data:', JSON.stringify(testData, null, 2));
    
    const response = await axios.post('http://localhost:3002/api/doctors', testData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      timeout: 5000
    });
    
    console.log('✅ Success:', response.status);
    console.log('Response:', response.data);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
    if (error.code === 'ECONNABORTED') {
      console.log('🕐 Request timed out');
    }
  }
}

simplePostTest();
