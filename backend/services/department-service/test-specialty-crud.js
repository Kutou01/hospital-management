#!/usr/bin/env node

/**
 * 🏥 TEST SPECIALTY CRUD OPERATIONS
 * 
 * This script tests all Specialty CRUD operations including:
 * - Create specialty
 * - Read all specialties
 * - Read specialty by ID
 * - Update specialty
 * - Delete specialty
 * - Get specialty statistics
 */

const axios = require('axios');

// Configuration
const DEPARTMENT_SERVICE_URL = 'http://localhost:3005';

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

async function makeRequest(method, url, data = null) {
  try {
    const config = {
      method,
      url,
      headers: { 'Content-Type': 'application/json' },
      ...(data && { data }),
      timeout: 10000
    };
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      fullError: error.response?.data
    };
  }
}

// Sample specialty data for testing
const sampleSpecialties = [
  {
    specialty_name: 'Tim mạch can thiệp',
    department_id: 'DEPT001',
    description: 'Chuyên khoa can thiệp tim mạch qua da, điều trị các bệnh lý mạch vành',
    average_consultation_time: 45,
    consultation_fee_range: { min: 500000, max: 1000000 }
  },
  {
    specialty_name: 'Siêu âm tim',
    department_id: 'DEPT001', 
    description: 'Chẩn đoán hình ảnh tim mạch bằng siêu âm',
    average_consultation_time: 30,
    consultation_fee_range: { min: 300000, max: 500000 }
  },
  {
    specialty_name: 'Thần kinh cột sống',
    department_id: 'DEPT002',
    description: 'Điều trị các bệnh lý cột sống và hệ thần kinh',
    average_consultation_time: 40,
    consultation_fee_range: { min: 400000, max: 800000 }
  }
];

async function testSpecialtyCRUD() {
  log('🧪 TESTING SPECIALTY CRUD OPERATIONS', 'cyan');
  log('=' .repeat(60), 'cyan');

  let createdSpecialtyIds = [];
  let testResults = {
    create: 0,
    read: 0,
    update: 0,
    delete: 0,
    stats: 0,
    total: 0
  };

  try {
    // Test 1: Create Specialties
    log('\n1️⃣ Testing CREATE operations...', 'yellow');
    
    for (const specialty of sampleSpecialties) {
      const result = await makeRequest('POST', `${DEPARTMENT_SERVICE_URL}/api/specialties`, specialty);
      
      if (result.success) {
        createdSpecialtyIds.push(result.data.data.specialty_id);
        log(`✅ Created specialty: ${specialty.specialty_name} (${result.data.data.specialty_id})`, 'green');
        testResults.create++;
      } else {
        log(`❌ Failed to create specialty ${specialty.specialty_name}: ${result.error}`, 'red');
      }
      testResults.total++;
    }

    // Test 2: Read All Specialties
    log('\n2️⃣ Testing READ ALL operations...', 'yellow');
    
    const getAllResult = await makeRequest('GET', `${DEPARTMENT_SERVICE_URL}/api/specialties`);
    if (getAllResult.success) {
      const specialties = getAllResult.data.data;
      log(`✅ Retrieved ${specialties.length} specialties`, 'green');
      testResults.read++;
    } else {
      log(`❌ Failed to get all specialties: ${getAllResult.error}`, 'red');
    }
    testResults.total++;

    // Test 3: Read Specialty by ID
    log('\n3️⃣ Testing READ BY ID operations...', 'yellow');
    
    if (createdSpecialtyIds.length > 0) {
      const specialtyId = createdSpecialtyIds[0];
      const getByIdResult = await makeRequest('GET', `${DEPARTMENT_SERVICE_URL}/api/specialties/${specialtyId}`);
      
      if (getByIdResult.success) {
        log(`✅ Retrieved specialty by ID: ${getByIdResult.data.data.specialty_name}`, 'green');
        testResults.read++;
      } else {
        log(`❌ Failed to get specialty by ID: ${getByIdResult.error}`, 'red');
      }
    } else {
      log(`⚠️ No specialties created, skipping read by ID test`, 'yellow');
    }
    testResults.total++;

    // Test 4: Update Specialty
    log('\n4️⃣ Testing UPDATE operations...', 'yellow');
    
    if (createdSpecialtyIds.length > 0) {
      const specialtyId = createdSpecialtyIds[0];
      const updateData = {
        description: 'Updated description for testing purposes',
        average_consultation_time: 50
      };
      
      const updateResult = await makeRequest('PUT', `${DEPARTMENT_SERVICE_URL}/api/specialties/${specialtyId}`, updateData);
      
      if (updateResult.success) {
        log(`✅ Updated specialty: ${updateResult.data.data.specialty_name}`, 'green');
        testResults.update++;
      } else {
        log(`❌ Failed to update specialty: ${updateResult.error}`, 'red');
      }
    } else {
      log(`⚠️ No specialties created, skipping update test`, 'yellow');
    }
    testResults.total++;

    // Test 5: Get Specialty Statistics
    log('\n5️⃣ Testing STATISTICS operations...', 'yellow');
    
    const statsResult = await makeRequest('GET', `${DEPARTMENT_SERVICE_URL}/api/specialties/stats`);
    if (statsResult.success) {
      const stats = statsResult.data.data;
      log(`✅ Retrieved specialty statistics:`, 'green');
      log(`   Total specialties: ${stats.total_specialties}`, 'white');
      log(`   Active specialties: ${stats.active_specialties}`, 'white');
      log(`   Average consultation time: ${stats.average_consultation_time} minutes`, 'white');
      testResults.stats++;
    } else {
      log(`❌ Failed to get specialty statistics: ${statsResult.error}`, 'red');
    }
    testResults.total++;

    // Test 6: Get Specialties by Department
    log('\n6️⃣ Testing GET BY DEPARTMENT operations...', 'yellow');
    
    const deptResult = await makeRequest('GET', `${DEPARTMENT_SERVICE_URL}/api/specialties/department/DEPT001`);
    if (deptResult.success) {
      log(`✅ Retrieved ${deptResult.data.data.length} specialties for DEPT001`, 'green');
      testResults.read++;
    } else {
      log(`❌ Failed to get specialties by department: ${deptResult.error}`, 'red');
    }
    testResults.total++;

    // Test 7: Delete Specialty (Soft Delete)
    log('\n7️⃣ Testing DELETE operations...', 'yellow');
    
    if (createdSpecialtyIds.length > 0) {
      const specialtyId = createdSpecialtyIds[createdSpecialtyIds.length - 1]; // Delete last created
      const deleteResult = await makeRequest('DELETE', `${DEPARTMENT_SERVICE_URL}/api/specialties/${specialtyId}`);
      
      if (deleteResult.success) {
        log(`✅ Deleted specialty: ${specialtyId}`, 'green');
        testResults.delete++;
      } else {
        log(`❌ Failed to delete specialty: ${deleteResult.error}`, 'red');
      }
    } else {
      log(`⚠️ No specialties created, skipping delete test`, 'yellow');
    }
    testResults.total++;

    // Test 8: Verify Soft Delete
    log('\n8️⃣ Testing SOFT DELETE verification...', 'yellow');
    
    if (createdSpecialtyIds.length > 0) {
      const deletedId = createdSpecialtyIds[createdSpecialtyIds.length - 1];
      const verifyResult = await makeRequest('GET', `${DEPARTMENT_SERVICE_URL}/api/specialties/${deletedId}`);
      
      if (!verifyResult.success || (verifyResult.data.data && !verifyResult.data.data.is_active)) {
        log(`✅ Soft delete verified - specialty is inactive or not found`, 'green');
        testResults.read++;
      } else {
        log(`❌ Soft delete failed - specialty is still active`, 'red');
      }
    }
    testResults.total++;

    // Final Results
    log('\n📊 TEST RESULTS SUMMARY', 'cyan');
    log('=' .repeat(40), 'cyan');
    
    const successRate = Math.round((
      testResults.create + testResults.read + testResults.update + 
      testResults.delete + testResults.stats
    ) / testResults.total * 100);
    
    log(`✅ CREATE operations: ${testResults.create}/${sampleSpecialties.length}`, 'green');
    log(`✅ READ operations: ${testResults.read}/4`, 'green');
    log(`✅ UPDATE operations: ${testResults.update}/1`, 'green');
    log(`✅ DELETE operations: ${testResults.delete}/1`, 'green');
    log(`✅ STATS operations: ${testResults.stats}/1`, 'green');
    log(`📈 Overall success rate: ${successRate}%`, successRate >= 80 ? 'green' : 'red');

    if (successRate >= 80) {
      log('\n🎉 SPECIALTY CRUD OPERATIONS TEST PASSED!', 'green');
    } else {
      log('\n❌ SPECIALTY CRUD OPERATIONS TEST FAILED!', 'red');
    }

    // Cleanup info
    if (createdSpecialtyIds.length > 1) {
      log(`\n🧹 Note: ${createdSpecialtyIds.length - 1} test specialties remain in database`, 'yellow');
      log(`   IDs: ${createdSpecialtyIds.slice(0, -1).join(', ')}`, 'yellow');
    }

  } catch (error) {
    log(`💥 Unexpected error during testing: ${error.message}`, 'red');
  }
}

// Run the test
if (require.main === module) {
  testSpecialtyCRUD().catch(error => {
    console.error('❌ Test script error:', error);
    process.exit(1);
  });
}

module.exports = { testSpecialtyCRUD };
