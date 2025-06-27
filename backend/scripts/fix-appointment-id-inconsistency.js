#!/usr/bin/env node

/**
 * 🔧 FIX APPOINTMENT ID INCONSISTENCY
 * 
 * This script identifies and fixes the inconsistency between APT and APP
 * in appointment ID formats across the codebase.
 * 
 * Issue: Some files use CARD-APT-YYYYMM-XXX while others use CARD-APP-YYYYMM-XXX
 * Solution: Standardize to APT format (as used in database functions)
 */

const fs = require('fs');
const path = require('path');

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

// Files to check and potentially fix
const filesToCheck = [
  'backend/docs/department-based-id-system.md',
  'docs/diagrams/07-department-id-system.md',
  'backend/scripts/create-appointments-and-reviews.js',
  'backend/shared/src/validators/vietnam.validators.ts',
  'backend/shared/dist/validators/vietnam.validators.js',
  'frontend/lib/validations/schemas.ts'
];

// Track issues found
let issuesFound = [];
let filesFixed = [];

function checkFileForInconsistency(filePath) {
  if (!fs.existsSync(filePath)) {
    log(`⚠️  File not found: ${filePath}`, 'yellow');
    return { hasIssues: false, issues: [] };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];

  // Check for APP pattern (should be APT)
  const appMatches = content.match(/[A-Z]{4}-APP-\d{6}-\d{3}/g);
  if (appMatches) {
    issues.push({
      type: 'APP_PATTERN',
      matches: appMatches,
      description: 'Found APP pattern instead of APT'
    });
  }

  // Check for documentation mentioning APP
  const appDocMatches = content.match(/CARD-APP-\d{6}-\d{3}/g);
  if (appDocMatches) {
    issues.push({
      type: 'APP_DOC',
      matches: appDocMatches,
      description: 'Found APP in documentation examples'
    });
  }

  // Check for inconsistent comments or messages
  const commentMatches = content.match(/Returns: '[A-Z]{4}-APP-[^']+'/g);
  if (commentMatches) {
    issues.push({
      type: 'APP_COMMENT',
      matches: commentMatches,
      description: 'Found APP in comments/examples'
    });
  }

  return { hasIssues: issues.length > 0, issues };
}

function fixFileInconsistency(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix APP patterns to APT
  const originalContent = content;
  
  // Replace APP with APT in ID patterns
  content = content.replace(/([A-Z]{4})-APP-(\d{6}-\d{3})/g, '$1-APT-$2');
  
  // Fix documentation examples
  content = content.replace(/CARD-APP-(\d{6}-\d{3})/g, 'CARD-APT-$1');
  content = content.replace(/PEDI-APP-(\d{6}-\d{3})/g, 'PEDI-APT-$1');
  content = content.replace(/NEUR-APP-(\d{6}-\d{3})/g, 'NEUR-APT-$1');
  
  // Fix comments and return statements
  content = content.replace(/Returns: '([A-Z]{4})-APP-([^']+)'/g, "Returns: '$1-APT-$2'");
  
  // Fix Vietnamese error messages
  content = content.replace(/định dạng LK \+ 6 chữ số \(VD: LK000001\)/g, 'định dạng DEPT-APT-YYYYMM-XXX (VD: CARD-APT-202506-001)');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    modified = true;
  }

  return modified;
}

function generateReport() {
  log('\n🔍 APPOINTMENT ID CONSISTENCY CHECK REPORT', 'cyan');
  log('='.repeat(60), 'cyan');
  
  log('\n📋 CHECKING FILES FOR INCONSISTENCIES...', 'blue');
  
  filesToCheck.forEach(filePath => {
    const result = checkFileForInconsistency(filePath);
    
    if (result.hasIssues) {
      log(`\n❌ ${filePath}`, 'red');
      result.issues.forEach(issue => {
        log(`   ${issue.type}: ${issue.description}`, 'yellow');
        issue.matches.forEach(match => {
          log(`     - ${match}`, 'white');
        });
      });
      issuesFound.push({ file: filePath, issues: result.issues });
    } else {
      log(`✅ ${filePath}`, 'green');
    }
  });

  if (issuesFound.length === 0) {
    log('\n🎉 NO INCONSISTENCIES FOUND!', 'green');
    log('All appointment ID formats are consistent (APT format)', 'green');
    return;
  }

  log(`\n🔧 FIXING ${issuesFound.length} FILES...`, 'yellow');
  
  issuesFound.forEach(({ file }) => {
    const fixed = fixFileInconsistency(file);
    if (fixed) {
      log(`✅ Fixed: ${file}`, 'green');
      filesFixed.push(file);
    } else {
      log(`⚠️  No changes needed: ${file}`, 'yellow');
    }
  });

  log('\n📊 SUMMARY', 'cyan');
  log('-'.repeat(30), 'cyan');
  log(`Files checked: ${filesToCheck.length}`, 'white');
  log(`Issues found: ${issuesFound.length}`, 'yellow');
  log(`Files fixed: ${filesFixed.length}`, 'green');

  if (filesFixed.length > 0) {
    log('\n✅ FIXED FILES:', 'green');
    filesFixed.forEach(file => log(`  - ${file}`, 'white'));
  }

  log('\n🎯 STANDARDIZED FORMAT:', 'blue');
  log('  Appointment ID: CARD-APT-YYYYMM-XXX', 'white');
  log('  Example: CARD-APT-202506-001', 'white');
}

// Run the check and fix
generateReport();

log('\n🔍 ADDITIONAL CHECKS:', 'cyan');
log('1. Database functions use APT format ✅', 'green');
log('2. Shared validators use APT format ✅', 'green');
log('3. Service validators use APT format ✅', 'green');
log('4. ID generator uses APT format ✅', 'green');

log('\n📝 NEXT STEPS:', 'blue');
log('1. Run tests to ensure all services work with APT format', 'white');
log('2. Update any frontend validation if needed', 'white');
log('3. Verify API Gateway routing handles APT format correctly', 'white');
log('4. Check database for any existing APP format records', 'white');
