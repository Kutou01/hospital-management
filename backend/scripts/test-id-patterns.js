#!/usr/bin/env node

/**
 * Simple ID Pattern Testing Script
 * Tests sample IDs against all validators
 */

function log(message, color = 'white') {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test ID samples
const TEST_IDS = {
  DOCTOR_ID: [
    'CARD-DOC-202506-001',  // Expected format
    'NEUR-DOC-202506-002',  // Expected format
    'GEN-DOC-202506-003',   // 3-char dept (should fail)
    'CARDIO-DOC-202506-004' // 5-char dept (should fail)
  ],
  PATIENT_ID: [
    'PAT-202506-001',       // Expected format
    'PAT-202506-999',       // Expected format
    'PATIENT-202506-001'    // Wrong prefix (should fail)
  ],
  APPOINTMENT_ID: [
    'CARD-APT-202506-001',  // Expected format (department-based)
    'NEUR-APT-202506-002',  // Expected format (department-based)
    'APT-202506-001'        // Old format (should fail)
  ],
  ADMIN_ID: [
    'ADM-202506-001',       // Expected format
    'ADM-202506-999',       // Expected format
    'ADMIN-202506-001'      // Wrong prefix (should fail)
  ],
  DEPARTMENT_ID: [
    'DEPT001',              // Expected format
    'DEPT999',              // Expected format
    'DEPT1',                // Too short (should fail)
    'DEPT1234'              // Too long (should fail)
  ]
};

// Pattern definitions (from our updated validators)
const PATTERNS = {
  DOCTOR_ID: /^[A-Z]{4}-DOC-\d{6}-\d{3}$/,
  PATIENT_ID: /^PAT-\d{6}-\d{3}$/,
  APPOINTMENT_ID: /^[A-Z]{4}-APT-\d{6}-\d{3}$/,
  ADMIN_ID: /^ADM-\d{6}-\d{3}$/,
  DEPARTMENT_ID: /^DEPT\d{3}$/
};

function testPatterns() {
  log('\n🧪 ID PATTERN TESTING', 'cyan');
  log('='.repeat(40), 'cyan');
  
  let totalTests = 0;
  let passedTests = 0;
  
  for (const [patternType, testIds] of Object.entries(TEST_IDS)) {
    log(`\n📋 Testing ${patternType}:`, 'blue');
    log(`   Pattern: ${PATTERNS[patternType]}`, 'white');
    
    for (const testId of testIds) {
      totalTests++;
      const isValid = PATTERNS[patternType].test(testId);
      
      if (isValid) {
        log(`   ✅ ${testId} - VALID`, 'green');
        passedTests++;
      } else {
        log(`   ❌ ${testId} - INVALID`, 'red');
      }
    }
  }
  
  log('\n📊 TEST SUMMARY', 'cyan');
  log('='.repeat(20), 'cyan');
  log(`Total Tests: ${totalTests}`, 'white');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${totalTests - passedTests}`, 'red');
  
  // Expected results analysis
  log('\n🎯 EXPECTED RESULTS ANALYSIS:', 'yellow');
  log('✅ Should PASS:', 'green');
  log('   - CARD-DOC-202506-001 (4-char dept)', 'white');
  log('   - NEUR-DOC-202506-002 (4-char dept)', 'white');
  log('   - PAT-202506-001 (standard patient)', 'white');
  log('   - PAT-202506-999 (standard patient)', 'white');
  log('   - CARD-APT-202506-001 (dept-based appointment)', 'white');
  log('   - NEUR-APT-202506-002 (dept-based appointment)', 'white');
  log('   - ADM-202506-001 (standard admin)', 'white');
  log('   - ADM-202506-999 (standard admin)', 'white');
  log('   - DEPT001 (3-digit dept)', 'white');
  log('   - DEPT999 (3-digit dept)', 'white');
  
  log('\n❌ Should FAIL:', 'red');
  log('   - GEN-DOC-202506-003 (3-char dept, need 4)', 'white');
  log('   - CARDIO-DOC-202506-004 (5-char dept, need 4)', 'white');
  log('   - PATIENT-202506-001 (wrong prefix)', 'white');
  log('   - APT-202506-001 (old format, need dept-based)', 'white');
  log('   - ADMIN-202506-001 (wrong prefix)', 'white');
  log('   - DEPT1 (too short)', 'white');
  log('   - DEPT1234 (too long)', 'white');
  
  return { totalTests, passedTests };
}

// Run tests
if (require.main === module) {
  const results = testPatterns();
  
  // Expected: 10 pass, 7 fail = 17 total
  const expectedPassed = 10;
  const expectedFailed = 7;
  const expectedTotal = expectedPassed + expectedFailed;
  
  log('\n🔍 VALIDATION CHECK:', 'cyan');
  if (results.totalTests === expectedTotal && 
      results.passedTests === expectedPassed) {
    log('🎉 ALL PATTERNS WORKING AS EXPECTED!', 'green');
    process.exit(0);
  } else {
    log('❌ PATTERN VALIDATION FAILED!', 'red');
    log(`Expected: ${expectedPassed}/${expectedTotal} passed`, 'yellow');
    log(`Actual: ${results.passedTests}/${results.totalTests} passed`, 'yellow');
    process.exit(1);
  }
}

module.exports = { testPatterns };
