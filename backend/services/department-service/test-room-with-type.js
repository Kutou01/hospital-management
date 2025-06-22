#!/usr/bin/env node

/**
 * 🧪 TEST ROOM WITH EXPLICIT TYPE
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3005';

async function testRoomWithType() {
  console.log('🧪 TEST ROOM WITH EXPLICIT TYPE');
  console.log('=' .repeat(50));
  
  try {
    // Test with explicit room_type
    console.log('\n1️⃣ Testing with explicit room_type...');
    
    const newRoom = {
      room_number: 'TEST-DEBUG-003',
      department_id: 'DEPT001',
      room_type: 'consultation',
      capacity: 2
    };
    
    console.log('Request data:', JSON.stringify(newRoom, null, 2));
    
    const response = await axios.post(`${BASE_URL}/api/rooms`, newRoom, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    console.log('✅ SUCCESS:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ ERROR:', error.response?.status || 'NO_RESPONSE');
    console.log('Error message:', error.response?.data?.message || error.message);
    console.log('Full error:', JSON.stringify(error.response?.data, null, 2));
    
    if (error.response?.data?.details) {
      console.log('\n📋 Validation Details:');
      error.response.data.details.forEach((detail, index) => {
        console.log(`${index + 1}. ${detail.msg} (${detail.param})`);
      });
    }
  }
}

// Run test
testRoomWithType().catch(console.error);
