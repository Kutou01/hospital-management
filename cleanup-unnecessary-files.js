#!/usr/bin/env node

/**
 * Script để cleanup các file không cần thiết sau khi migrate sang Supabase Auth
 * Chạy script này để xóa các file cũ, test scripts, và documentation files
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Hospital Management System - File Cleanup Script\n');

// Danh sách các file cần xóa
const filesToRemove = [
  // Documentation & Migration files (có thể archive)
  'AUTH_SERVICE_COMPLETE_GUIDE.md',
  'MICROSERVICES_INTEGRATION.md',
  'SUPABASE_AUTH_MIGRATION.md',
  'SUPABASE_AUTH_MIGRATION_COMPLETE.md',
  'AUTH_MIGRATION_SUMMARY.md',
  'FRONTEND_INTEGRATION_GUIDE.md',

  // Cleanup & Migration scripts
  'remove-auth-service.js',
  'cleanup-old-auth.js',
  'final-cleanup-report.js',
  'start-auth-system.js',
  'test-auth-via-gateway.js',

  // Database/Debug scripts
  'check-database-schema.js',
  'debug-db-connection.js',
  'simple-db-check.js',

  // Frontend test files (old auth testing)
  'frontend/test-auth.js',
  'frontend/test-login.js',
  'frontend/test-registration.js',
  'frontend/test-signup.js',
  'frontend/test-admin-login.js',
  'frontend/test-auth-direct.js',
  'frontend/test-auth-flow.md',
  'frontend/scripts/test-auth.js',

  // Backend migration scripts
  'backend/scripts/migrate-from-monolith.sh',
];

// Danh sách directories có thể cần xóa (nếu empty)
const directoriesToCheck = [
  'backend/services/auth-service-backup',
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
      console.log(`✅ Removed: ${filePath}`);
      return true;
    } else {
      console.log(`⚠️  Not found: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error removing ${filePath}:`, error.message);
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

// Main cleanup function
function performCleanup() {
  console.log('📁 Starting file cleanup...\n');

  let removedCount = 0;
  let totalFiles = filesToRemove.length;

  // Remove individual files
  console.log('🗂️  Removing individual files:');
  filesToRemove.forEach(file => {
    if (removeFile(file)) {
      removedCount++;
    }
  });

  console.log('\n📂 Checking directories:');
  // Check and remove directories
  directoriesToCheck.forEach(dir => {
    removeDirectory(dir);
  });

  console.log('\n📊 Cleanup Summary:');
  console.log(`- Files processed: ${totalFiles}`);
  console.log(`- Files removed: ${removedCount}`);
  console.log(`- Files not found: ${totalFiles - removedCount}`);

  return removedCount;
}

// Backup function (optional)
function createBackup() {
  const backupDir = 'cleanup-backup-' + Date.now();
  console.log(`📦 Creating backup directory: ${backupDir}`);

  try {
    fs.mkdirSync(backupDir);

    filesToRemove.forEach(file => {
      if (fileExists(file)) {
        const backupPath = path.join(backupDir, path.basename(file));
        fs.copyFileSync(file, backupPath);
        console.log(`📋 Backed up: ${file} → ${backupPath}`);
      }
    });

    console.log(`✅ Backup created in: ${backupDir}\n`);
    return backupDir;
  } catch (error) {
    console.error('❌ Error creating backup:', error.message);
    return null;
  }
}

// Interactive mode
function askForConfirmation() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Do you want to create a backup before cleanup? (y/N): ', (answer) => {
      const shouldBackup = answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
      rl.question('Proceed with cleanup? (y/N): ', (answer2) => {
        const shouldProceed = answer2.toLowerCase() === 'y' || answer2.toLowerCase() === 'yes';
        rl.close();
        resolve({ shouldBackup, shouldProceed });
      });
    });
  });
}

// Main execution
async function main() {
  console.log('🎯 This script will remove unnecessary files from your hospital management system.');
  console.log('📋 Files to be removed:');
  filesToRemove.forEach(file => {
    const exists = fileExists(file) ? '✅' : '❌';
    console.log(`   ${exists} ${file}`);
  });
  console.log('');

  // Check if running in interactive mode
  const isInteractive = process.argv.includes('--interactive') || process.argv.includes('-i');

  if (isInteractive) {
    const { shouldBackup, shouldProceed } = await askForConfirmation();

    if (!shouldProceed) {
      console.log('❌ Cleanup cancelled by user.');
      process.exit(0);
    }

    if (shouldBackup) {
      createBackup();
    }
  } else {
    console.log('🔄 Running in automatic mode. Use --interactive for confirmation prompts.');
  }

  const removedCount = performCleanup();

  if (removedCount > 0) {
    console.log('\n✨ Cleanup completed successfully!');
    console.log('🎉 Your hospital management system is now cleaner and more organized.');
  } else {
    console.log('\n💡 No files were removed. Your system is already clean!');
  }

  console.log('\n📝 Next steps:');
  console.log('1. Review remaining files in your project');
  console.log('2. Update any documentation that references removed files');
  console.log('3. Test your application to ensure everything works correctly');
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Hospital Management System - File Cleanup Script');
  console.log('');
  console.log('Usage:');
  console.log('  node cleanup-unnecessary-files.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --interactive, -i    Run in interactive mode with confirmation prompts');
  console.log('  --help, -h          Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  node cleanup-unnecessary-files.js');
  console.log('  node cleanup-unnecessary-files.js --interactive');
  process.exit(0);
}

// Run the main function
main().catch(error => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});
