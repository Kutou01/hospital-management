#!/usr/bin/env node

/**
 * 🧪 TEST ROOM WITH CURL-LIKE REQUEST
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3005';

async function testRoomWithCurl() {
  console.log('🧪 TEST ROOM WITH CURL-LIKE REQUEST');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Check if endpoint exists
    console.log('\n1️⃣ Testing endpoint availability...');
    
    const response = await axios({
      method: 'POST',
      url: `${BASE_URL}/api/rooms`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: {
        room_number: 'TEST-CURL-001',
        department_id: 'DEPT001',
        room_type: 'consultation',
        capacity: 2
      },
      timeout: 10000,
      validateStatus: function (status) {
        return status < 600; // Accept all status codes
      }
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
  
  try {
    // Test 2: Check routes
    console.log('\n2️⃣ Testing GET /api/rooms (should work)...');
    
    const getResponse = await axios.get(`${BASE_URL}/api/rooms`);
    console.log('GET Status:', getResponse.status);
    console.log('GET works fine');
    
  } catch (error) {
    console.log('❌ GET ERROR:', error.message);
  }
}

// Run test
testRoomWithCurl().catch(console.error);
