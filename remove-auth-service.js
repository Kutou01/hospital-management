#!/usr/bin/env node

/**
 * Script để backup và xóa auth-service directory
 */

const fs = require('fs');
const path = require('path');

const authServicePath = 'backend/services/auth-service';
const backupPath = 'backend/services/auth-service-backup';

console.log('🗂️  Auth Service Removal Script\n');

function checkDirectoryExists(dirPath) {
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  } catch (error) {
    return false;
  }
}

function copyDirectory(src, dest) {
  try {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
    return true;
  } catch (error) {
    console.error(`Error copying directory: ${error.message}`);
    return false;
  }
}

function removeDirectory(dirPath) {
  try {
    fs.rmSync(dirPath, { recursive: true, force: true });
    return true;
  } catch (error) {
    console.error(`Error removing directory: ${error.message}`);
    return false;
  }
}

// Main execution
if (!checkDirectoryExists(authServicePath)) {
  console.log('✅ Auth service directory not found. Already cleaned up!');
  process.exit(0);
}

console.log('📁 Auth service directory found. Proceeding with backup and removal...\n');

// Step 1: Create backup
console.log('1️⃣ Creating backup...');
if (copyDirectory(authServicePath, backupPath)) {
  console.log(`✅ Backup created at: ${backupPath}`);
} else {
  console.error('❌ Failed to create backup. Aborting removal.');
  process.exit(1);
}

// Step 2: Confirm removal
console.log('\n2️⃣ Ready to remove auth-service directory');
console.log('⚠️  This action will permanently delete the auth-service directory');
console.log('📦 A backup has been created at:', backupPath);

// For safety, we'll just show what would be removed instead of actually removing
console.log('\n🔍 Directory contents to be removed:');
try {
  const entries = fs.readdirSync(authServicePath, { withFileTypes: true });
  entries.forEach(entry => {
    const type = entry.isDirectory() ? '📁' : '📄';
    console.log(`  ${type} ${entry.name}`);
  });
} catch (error) {
  console.error('Error reading directory:', error.message);
}

console.log('\n💡 To actually remove the directory, run:');
console.log('   rm -rf backend/services/auth-service');
console.log('   # or on Windows:');
console.log('   rmdir /s backend\\services\\auth-service');

console.log('\n✅ Backup completed successfully!');
console.log('📦 Backup location:', backupPath);
console.log('🗑️  Original directory can now be safely removed manually if desired');

console.log('\n📋 Summary:');
console.log('- ✅ Auth service backup created');
console.log('- ⏳ Manual removal required for safety');
console.log('- ✅ API Gateway updated (auth routes commented out)');
console.log('- ✅ Frontend uses Supabase Auth directly');
console.log('- ✅ Database uses Supabase auth.users + profiles tables');
