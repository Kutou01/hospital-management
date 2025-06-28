#!/usr/bin/env node

/**
 * ID Format Consistency Verification Script
 * Checks all services use consistent ID patterns
 */

const fs = require('fs');
const path = require('path');

// Expected patterns (from shared validators)
const EXPECTED_PATTERNS = {
  DOCTOR_ID: /^[A-Z]{4}-DOC-\d{6}-\d{3}$/,
  PATIENT_ID: /^PAT-\d{6}-\d{3}$/,
  APPOINTMENT_ID: /^[A-Z]{4}-APT-\d{6}-\d{3}$/,
  ADMIN_ID: /^ADM-\d{6}-\d{3}$/,
  MEDICAL_RECORD_ID: /^[A-Z]{4}-MR-\d{6}-\d{3}$/,
  PRESCRIPTION_ID: /^[A-Z]{4}-RX-\d{6}-\d{3}$/,
  DEPARTMENT_ID: /^DEPT\d{3}$/,
  ROOM_ID: /^ROOM\d+$/
};

// Files to check (relative to project root)
const FILES_TO_CHECK = [
  '../shared/src/validators/all-tables.validators.ts',
  '../shared/src/validators/vietnam.validators.ts',
  '../shared/src/utils/id-generator.ts',
  '../services/doctor-service/src/validators/doctor.validators.ts',
  '../services/patient-service/src/validators/patient.validators.ts',
  '../services/appointment-service/src/validators/appointment.validators.ts',
  '../services/department-service/src/validators/department.validators.ts'
];

function log(message, color = 'white') {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function extractPatterns(content, filename) {
  const patterns = {};
  
  // Extract DOCTOR_ID patterns
  const doctorMatches = content.match(/DOCTOR_ID[:\s]*\/\^([^$]+)\$\//g);
  if (doctorMatches) {
    doctorMatches.forEach(match => {
      const pattern = match.match(/\/\^([^$]+)\$\//)[1];
      patterns.DOCTOR_ID = new RegExp(`^${pattern}$`);
    });
  }
  
  // Extract PATIENT_ID patterns
  const patientMatches = content.match(/PATIENT_ID[:\s]*\/\^([^$]+)\$\//g);
  if (patientMatches) {
    patientMatches.forEach(match => {
      const pattern = match.match(/\/\^([^$]+)\$\//)[1];
      patterns.PATIENT_ID = new RegExp(`^${pattern}$`);
    });
  }
  
  // Extract APPOINTMENT_ID patterns
  const appointmentMatches = content.match(/APPOINTMENT_ID[:\s]*\/\^([^$]+)\$\//g);
  if (appointmentMatches) {
    appointmentMatches.forEach(match => {
      const pattern = match.match(/\/\^([^$]+)\$\//)[1];
      patterns.APPOINTMENT_ID = new RegExp(`^${pattern}$`);
    });
  }
  
  // Extract DEPARTMENT_ID patterns
  const departmentMatches = content.match(/DEPARTMENT_ID[:\s]*\/\^([^$]+)\$\//g);
  if (departmentMatches) {
    departmentMatches.forEach(match => {
      const pattern = match.match(/\/\^([^$]+)\$\//)[1];
      patterns.DEPARTMENT_ID = new RegExp(`^${pattern}$`);
    });
  }
  
  // Extract inline patterns
  const inlinePatterns = content.match(/\/\^[A-Z\[\]\\d\{\}\-\+\*\?\|\(\)]+\$\//g);
  if (inlinePatterns) {
    inlinePatterns.forEach(pattern => {
      const patternStr = pattern.slice(2, -2); // Remove /^ and $/
      
      if (patternStr.includes('DOC')) {
        patterns.DOCTOR_ID_INLINE = new RegExp(`^${patternStr}$`);
      }
      if (patternStr.includes('PAT')) {
        patterns.PATIENT_ID_INLINE = new RegExp(`^${patternStr}$`);
      }
      if (patternStr.includes('APT')) {
        patterns.APPOINTMENT_ID_INLINE = new RegExp(`^${patternStr}$`);
      }
      if (patternStr.includes('DEPT')) {
        patterns.DEPARTMENT_ID_INLINE = new RegExp(`^${patternStr}$`);
      }
    });
  }
  
  return patterns;
}

function comparePatterns(expected, actual, patternName) {
  if (!actual) return { match: false, reason: 'Pattern not found' };
  
  const expectedStr = expected.source;
  const actualStr = actual.source;
  
  if (expectedStr === actualStr) {
    return { match: true };
  } else {
    return { 
      match: false, 
      reason: `Pattern mismatch`,
      expected: expectedStr,
      actual: actualStr
    };
  }
}

async function verifyConsistency() {
  log('\n🔍 ID FORMAT CONSISTENCY VERIFICATION', 'cyan');
  log('='.repeat(50), 'cyan');
  
  let totalIssues = 0;
  const results = {};
  
  for (const filePath of FILES_TO_CHECK) {
    const fullPath = path.resolve(filePath);
    
    if (!fs.existsSync(fullPath)) {
      log(`⚠️  File not found: ${filePath}`, 'yellow');
      continue;
    }
    
    log(`\n📁 Checking: ${filePath}`, 'blue');
    
    const content = fs.readFileSync(fullPath, 'utf8');
    const patterns = extractPatterns(content, filePath);
    
    results[filePath] = { patterns, issues: [] };
    
    // Check each pattern type
    for (const [patternType, expectedPattern] of Object.entries(EXPECTED_PATTERNS)) {
      const actualPattern = patterns[patternType] || patterns[`${patternType}_INLINE`];
      const comparison = comparePatterns(expectedPattern, actualPattern, patternType);
      
      if (!comparison.match) {
        const issue = `${patternType}: ${comparison.reason}`;
        results[filePath].issues.push(issue);
        totalIssues++;
        
        log(`  ❌ ${issue}`, 'red');
        if (comparison.expected && comparison.actual) {
          log(`     Expected: ${comparison.expected}`, 'yellow');
          log(`     Actual:   ${comparison.actual}`, 'yellow');
        }
      } else if (actualPattern) {
        log(`  ✅ ${patternType}: Consistent`, 'green');
      }
    }
    
    if (results[filePath].issues.length === 0) {
      log(`  🎉 All patterns consistent!`, 'green');
    }
  }
  
  // Summary
  log('\n📊 SUMMARY', 'cyan');
  log('='.repeat(20), 'cyan');
  
  if (totalIssues === 0) {
    log('🎉 ALL ID PATTERNS ARE CONSISTENT!', 'green');
    log('✅ No issues found across all services', 'green');
  } else {
    log(`❌ Found ${totalIssues} consistency issues`, 'red');
    log('🔧 Please review and fix the patterns above', 'yellow');
  }
  
  return totalIssues === 0;
}

// Run verification
if (require.main === module) {
  verifyConsistency()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`❌ Verification failed: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = { verifyConsistency };
