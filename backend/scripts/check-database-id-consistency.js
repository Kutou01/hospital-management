#!/usr/bin/env node

/**
 * Database ID Consistency Checker
 * Verifies actual database records follow the standardized ID patterns
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Standardized patterns
const PATTERNS = {
  DOCTOR_ID: /^[A-Z]{4}-DOC-\d{6}-\d{3}$/,
  PATIENT_ID: /^PAT-\d{6}-\d{3}$/,
  APPOINTMENT_ID: /^[A-Z]{4}-APT-\d{6}-\d{3}$/,
  DEPARTMENT_ID: /^DEPT\d{3}$/
};

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

async function checkTableIds(tableName, idColumn, pattern, patternName) {
  log(`\n📋 Checking ${tableName}.${idColumn}:`, 'blue');
  
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select(idColumn)
      .limit(100);
    
    if (error) {
      log(`  ❌ Error querying ${tableName}: ${error.message}`, 'red');
      return { valid: 0, invalid: 0, total: 0 };
    }
    
    if (!data || data.length === 0) {
      log(`  ⚠️  No records found in ${tableName}`, 'yellow');
      return { valid: 0, invalid: 0, total: 0 };
    }
    
    let validCount = 0;
    let invalidCount = 0;
    const invalidIds = [];
    
    for (const record of data) {
      const id = record[idColumn];
      if (pattern.test(id)) {
        validCount++;
      } else {
        invalidCount++;
        invalidIds.push(id);
      }
    }
    
    const total = data.length;
    log(`  📊 Total records: ${total}`, 'white');
    log(`  ✅ Valid IDs: ${validCount}`, 'green');
    log(`  ❌ Invalid IDs: ${invalidCount}`, invalidCount > 0 ? 'red' : 'green');
    
    if (invalidIds.length > 0) {
      log(`  🔍 Invalid ID examples:`, 'yellow');
      invalidIds.slice(0, 5).forEach(id => {
        log(`     - ${id}`, 'white');
      });
      if (invalidIds.length > 5) {
        log(`     ... and ${invalidIds.length - 5} more`, 'white');
      }
    }
    
    return { valid: validCount, invalid: invalidCount, total };
    
  } catch (error) {
    log(`  ❌ Exception checking ${tableName}: ${error.message}`, 'red');
    return { valid: 0, invalid: 0, total: 0 };
  }
}

async function checkDatabaseConsistency() {
  log('\n🔍 DATABASE ID CONSISTENCY CHECK', 'cyan');
  log('='.repeat(50), 'cyan');
  
  const results = {};
  let totalRecords = 0;
  let totalValid = 0;
  let totalInvalid = 0;
  
  // Check each table
  const checks = [
    { table: 'doctors', column: 'doctor_id', pattern: PATTERNS.DOCTOR_ID, name: 'DOCTOR_ID' },
    { table: 'patients', column: 'patient_id', pattern: PATTERNS.PATIENT_ID, name: 'PATIENT_ID' },
    { table: 'appointments', column: 'appointment_id', pattern: PATTERNS.APPOINTMENT_ID, name: 'APPOINTMENT_ID' },
    { table: 'departments', column: 'department_id', pattern: PATTERNS.DEPARTMENT_ID, name: 'DEPARTMENT_ID' }
  ];
  
  for (const check of checks) {
    const result = await checkTableIds(check.table, check.column, check.pattern, check.name);
    results[check.table] = result;
    totalRecords += result.total;
    totalValid += result.valid;
    totalInvalid += result.invalid;
  }
  
  // Summary
  log('\n📊 OVERALL SUMMARY', 'cyan');
  log('='.repeat(30), 'cyan');
  log(`Total Records Checked: ${totalRecords}`, 'white');
  log(`Valid IDs: ${totalValid}`, 'green');
  log(`Invalid IDs: ${totalInvalid}`, totalInvalid > 0 ? 'red' : 'green');
  
  if (totalInvalid === 0) {
    log('\n🎉 ALL DATABASE IDs ARE CONSISTENT!', 'green');
    log('✅ No format violations found', 'green');
  } else {
    log('\n⚠️  INCONSISTENCIES FOUND!', 'yellow');
    log('🔧 Some IDs do not follow the standardized format', 'yellow');
    log('💡 Consider running ID migration scripts if needed', 'blue');
  }
  
  // Detailed breakdown
  log('\n📋 DETAILED BREAKDOWN:', 'cyan');
  for (const [table, result] of Object.entries(results)) {
    if (result.total > 0) {
      const percentage = ((result.valid / result.total) * 100).toFixed(1);
      log(`  ${table}: ${result.valid}/${result.total} (${percentage}%) valid`, 
          result.invalid === 0 ? 'green' : 'yellow');
    }
  }
  
  return totalInvalid === 0;
}

// Run check
if (require.main === module) {
  checkDatabaseConsistency()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`❌ Check failed: ${error.message}`, 'red');
      console.error(error);
      process.exit(1);
    });
}

module.exports = { checkDatabaseConsistency };
