#!/usr/bin/env node

/**
 * Script để cleanup các file và reference cũ của auth system
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning up old auth system references...\n');

// Files và directories cần xóa hoặc cập nhật
const filesToCheck = [
  // Test scripts có thể có reference cũ
  'frontend/scripts/simple-test.js',
  'frontend/test-auth.js',

  // Documentation files
  'AUTH_SERVICE_COMPLETE_GUIDE.md',
  'MICROSERVICES_INTEGRATION.md',

  // Migration helper (có thể cần cập nhật)
  'frontend/lib/migration-helper.ts',

  // API Gateway (có thể cần cập nhật)
  'backend/api-gateway/src/app.ts',
];

// Directories có thể cần xóa
const directoriesToCheck = [
  'backend/services/auth-service',
];

function checkFileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

function checkDirectoryExists(dirPath) {
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  } catch (error) {
    return false;
  }
}

function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];

    // Check for old auth references
    if (content.includes("from('users')") && !content.includes("from('auth.users')") && !content.includes("from('profiles')")) {
      issues.push("References old 'users' table instead of 'profiles'");
    }

    if ((content.includes('AUTH_SERVICE_URL') || content.includes('auth-service')) &&
        !content.includes('DEPRECATED') && !content.includes('Historical')) {
      issues.push("References auth-service");
    }

    if (content.includes('NEXT_PUBLIC_USE_MICROSERVICES_AUTH=true')) {
      issues.push("Microservices auth flag is enabled");
    }

    if (content.includes('/api/auth') && !content.includes('supabase') &&
        !content.includes('DEPRECATED') && !content.includes('//')) {
      issues.push("Uses custom auth API endpoints");
    }

    return issues;
  } catch (error) {
    return [`Error reading file: ${error.message}`];
  }
}

console.log('📋 Checking files for old auth references...\n');

let totalIssues = 0;

// Check files
filesToCheck.forEach(filePath => {
  if (checkFileExists(filePath)) {
    console.log(`📄 Checking: ${filePath}`);
    const issues = analyzeFile(filePath);

    if (issues.length > 0) {
      console.log(`  ⚠️  Issues found:`);
      issues.forEach(issue => {
        console.log(`    - ${issue}`);
      });
      totalIssues += issues.length;
    } else {
      console.log(`  ✅ No issues found`);
    }
    console.log();
  } else {
    console.log(`📄 ${filePath} - File not found (OK)`);
  }
});

// Check directories
console.log('📁 Checking directories...\n');

directoriesToCheck.forEach(dirPath => {
  if (checkDirectoryExists(dirPath)) {
    console.log(`📁 ${dirPath} - Directory still exists`);
    console.log(`  ⚠️  This directory should be removed if auth-service is no longer needed`);
    totalIssues++;
  } else {
    console.log(`📁 ${dirPath} - Directory not found (OK)`);
  }
});

console.log('\n' + '='.repeat(50));
console.log('📊 CLEANUP SUMMARY');
console.log('='.repeat(50));

if (totalIssues === 0) {
  console.log('✅ No issues found! Old auth system has been properly cleaned up.');
} else {
  console.log(`⚠️  Found ${totalIssues} issues that need attention.`);
  console.log('\n🔧 Recommended actions:');
  console.log('1. Update files with old auth references');
  console.log('2. Remove auth-service directory if not needed');
  console.log('3. Update API Gateway to remove auth-service proxy');
  console.log('4. Update documentation');
}

console.log('\n💡 Current auth setup:');
console.log('- Frontend: Uses Supabase Auth directly');
console.log('- Database: Uses auth.users + profiles tables');
console.log('- API: Direct Supabase client calls');
console.log('- Microservices: Disabled (NEXT_PUBLIC_USE_MICROSERVICES_AUTH=false)');

console.log('\n🎯 Next steps:');
console.log('1. Test login/signup functionality');
console.log('2. Test role-based routing');
console.log('3. Test dashboard access for different roles');
console.log('4. Remove any remaining old auth files if needed');
