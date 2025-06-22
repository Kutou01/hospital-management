#!/usr/bin/env node

/**
 * 🔍 SIMPLE ENDPOINT TESTING
 * 
 * Test individual endpoints to identify specific issues
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3005';

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

async function testEndpoint(method, endpoint, data = null, description = '') {
  try {
    log(`\n🧪 Testing: ${description || `${method} ${endpoint}`}`, 'yellow');
    
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    
    log(`✅ SUCCESS: ${response.status} - ${JSON.stringify(response.data).substring(0, 100)}...`, 'green');
    return { success: true, data: response.data };
    
  } catch (error) {
    const status = error.response?.status || 'NO_RESPONSE';
    const message = error.response?.data?.message || error.message;
    log(`❌ FAILED: ${status} - ${message}`, 'red');
    return { success: false, error: message, status };
  }
}

async function runSimpleTests() {
  log('🔍 SIMPLE ENDPOINT TESTING', 'cyan');
  log('=' .repeat(50), 'cyan');
  
  // Test basic endpoints that should work
  await testEndpoint('GET', '/api/departments', null, 'Get all departments');
  await testEndpoint('GET', '/api/departments/stats', null, 'Get department stats');
  await testEndpoint('GET', '/api/specialties', null, 'Get all specialties');
  await testEndpoint('GET', '/api/specialties/stats', null, 'Get specialty stats');
  await testEndpoint('GET', '/api/rooms', null, 'Get all rooms');
  await testEndpoint('GET', '/api/rooms/availability', null, 'Get room availability');
  
  // Test specific department
  await testEndpoint('GET', '/api/departments/DEPT001', null, 'Get specific department');
  
  // Test problematic endpoints
  log('\n🚨 Testing problematic endpoints:', 'yellow');
  await testEndpoint('GET', '/api/departments/tree', null, 'Department tree (hierarchy)');
  await testEndpoint('GET', '/api/departments/DEPT001/children', null, 'Department children');
  await testEndpoint('GET', '/api/departments/DEPT001/path', null, 'Department path');
  await testEndpoint('GET', '/api/departments/DEPT001/rooms', null, 'Department rooms');
  await testEndpoint('GET', '/api/departments/DEPT001/doctors', null, 'Department doctors');
  
  // Test CREATE operations
  log('\n🆕 Testing CREATE operations:', 'yellow');
  
  // Test create specialty with minimal data
  const newSpecialty = {
    specialty_name: 'Test Specialty Simple',
    department_id: 'DEPT001',
    description: 'Simple test specialty'
  };
  await testEndpoint('POST', '/api/specialties', newSpecialty, 'Create specialty (minimal)');
  
  // Test create room with minimal data
  const newRoom = {
    room_number: 'TEST-001',
    department_id: 'DEPT001',
    capacity: 2
  };
  await testEndpoint('POST', '/api/rooms', newRoom, 'Create room (minimal)');
  
  log('\n📊 Test completed!', 'cyan');
}

// Run tests
if (require.main === module) {
  runSimpleTests().catch(error => {
    console.error('❌ Test script error:', error);
    process.exit(1);
  });
}

module.exports = { runSimpleTests };
