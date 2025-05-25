#!/usr/bin/env node

/**
 * Selective cleanup script - removes only LOW RISK files
 * These are development/test files that are safe to remove
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Hospital Management System - Selective Cleanup (Low Risk Only)\n');

// Low risk files that are safe to remove
const lowRiskFiles = [
  'frontend/create-test-admin.js',
  'frontend/scripts/create-test-users.js',
  'frontend/scripts/quick-test.js',
  'frontend/REDIRECT_FIX_GUIDE.md'
];

// Low risk directories (test/debug pages for production)
const lowRiskDirectories = [
  'frontend/app/test-auth',
  'frontend/app/debug',
  'frontend/app/demo-roles',
  'frontend/app/role-detection',
  'frontend/components/test',
  'frontend/components/debug',
  'frontend/components/examples'
];

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

function removeFile(filePath) {
  try {
    if (fileExists(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Removed file: ${filePath}`);
      return true;
    } else {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error removing file ${filePath}:`, error.message);
    return false;
  }
}

function removeDirectory(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`✅ Removed directory: ${dirPath}`);
      return true;
    } else {
      console.log(`⚠️  Directory not found: ${dirPath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error removing directory ${dirPath}:`, error.message);
    return false;
  }
}

function performSelectiveCleanup() {
  console.log('🎯 Removing LOW RISK files only...\n');

  let removedFiles = 0;
  let removedDirs = 0;

  // Remove low risk files
  console.log('📄 Removing low risk files:');
  lowRiskFiles.forEach(file => {
    if (removeFile(file)) {
      removedFiles++;
    }
  });

  console.log('\n📁 Removing low risk directories:');
  lowRiskDirectories.forEach(dir => {
    if (removeDirectory(dir)) {
      removedDirs++;
    }
  });

  console.log('\n📊 Selective Cleanup Summary:');
  console.log(`- Files removed: ${removedFiles}/${lowRiskFiles.length}`);
  console.log(`- Directories removed: ${removedDirs}/${lowRiskDirectories.length}`);

  return { removedFiles, removedDirs };
}

function showRemainingFiles() {
  console.log('\n📋 Files NOT removed (require manual review):');

  console.log('\n🟡 MEDIUM RISK - Review before removing:');
  console.log('   • DEPLOYMENT_GUIDE.md');
  console.log('   • DOCKER_SETUP_GUIDE.md');
  console.log('   • TESTING_GUIDE.md');
  console.log('   • PROJECT_SETUP_GUIDE.md');
  console.log('   • backend/test-connection.js');
  console.log('   • backend/scripts/test-supabase-integration.js');

  console.log('\n🔴 HIGH RISK - Careful review required:');
  console.log('   • package.json (root level)');
  console.log('   • package-lock.json (root level)');
  console.log('   • frontend/hooks/useAuthProvider.tsx');
  console.log('   • frontend/create-admin.js');
}

// Main execution
function main() {
  console.log('🎯 This script removes only LOW RISK development/test files.');
  console.log('📋 Files to be removed:');

  lowRiskFiles.forEach(file => {
    const exists = fileExists(file) ? '✅' : '❌';
    console.log(`   ${exists} ${file}`);
  });

  console.log('\n📁 Directories to be removed:');
  lowRiskDirectories.forEach(dir => {
    const exists = fileExists(dir) ? '✅' : '❌';
    console.log(`   ${exists} ${dir}`);
  });

  console.log('');

  const { removedFiles, removedDirs } = performSelectiveCleanup();

  if (removedFiles > 0 || removedDirs > 0) {
    console.log('\n✨ Selective cleanup completed successfully!');
    console.log('🎉 Low risk files have been removed safely.');
  } else {
    console.log('\n💡 No low risk files found to remove.');
  }

  showRemainingFiles();

  console.log('\n📝 Next steps:');
  console.log('1. Review medium and high risk files manually');
  console.log('2. Test your application to ensure everything works');
  console.log('3. Consider removing medium risk files after review');
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Hospital Management System - Selective Cleanup Script');
  console.log('');
  console.log('This script removes only LOW RISK development and test files.');
  console.log('Medium and high risk files require manual review.');
  console.log('');
  console.log('Usage:');
  console.log('  node selective-cleanup.js');
  console.log('');
  process.exit(0);
}

main();
