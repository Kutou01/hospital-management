#!/usr/bin/env node

// Hospital Management System - Restore Backup Script
// Usage: node restore-backup.js <backup-file>

const fs = require('fs');
const path = require('path');

console.log('🏥 Hospital Management System - Database Restore');
console.log('===============================================');

// Supabase configuration
const SUPABASE_URL = 'https://ciasxktujslgsdgylimv.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpYXN4a3R1anNsZ3NkZ3lsaW12Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzU1NTU2NSwiZXhwIjoyMDYzMTMxNTY1fQ.R2IieQgCFPQ5sgEqPSJmF9uB1hZasJHg5enl2alJpn4';

// Get backup file from command line argument
const backupFile = process.argv[2];

if (!backupFile) {
  console.log('❌ Please provide a backup file path');
  console.log('Usage: node restore-backup.js <backup-file>');
  console.log('Example: node restore-backup.js ./backups/hospital_full_backup_2024-01-15T10-30-00.json');
  process.exit(1);
}

if (!fs.existsSync(backupFile)) {
  console.log(`❌ Backup file not found: ${backupFile}`);
  process.exit(1);
}

async function restoreTable(tableName, records) {
  if (!records || records.length === 0) {
    console.log(`⚠️  No records to restore for ${tableName}`);
    return { success: true, count: 0 };
  }
  
  try {
    console.log(`🔄 Restoring ${tableName} (${records.length} records)...`);
    
    // Use upsert to handle existing records
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(records)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    console.log(`✅ ${tableName}: ${records.length} records restored`);
    return { success: true, count: records.length };
    
  } catch (error) {
    console.log(`❌ Error restoring ${tableName}: ${error.message}`);
    return { success: false, error: error.message, count: 0 };
  }
}

async function restoreFromBackup() {
  console.log(`📁 Loading backup file: ${backupFile}`);
  
  let backupData;
  try {
    const fileContent = fs.readFileSync(backupFile, 'utf8');
    backupData = JSON.parse(fileContent);
  } catch (error) {
    console.log(`❌ Error reading backup file: ${error.message}`);
    process.exit(1);
  }
  
  // Check backup file format
  let tableData;
  if (backupData.data && backupData.metadata) {
    // Combined backup format
    console.log('📋 Detected combined backup format');
    console.log(`📅 Backup created: ${backupData.metadata.timestamp}`);
    console.log(`📊 Total records in backup: ${backupData.metadata.total_records}`);
    tableData = backupData.data;
  } else {
    // Simple format (just table data)
    console.log('📋 Detected simple backup format');
    tableData = backupData;
  }
  
  if (!tableData || Object.keys(tableData).length === 0) {
    console.log('❌ No table data found in backup file');
    process.exit(1);
  }
  
  console.log(`\n🚀 Starting restore process...`);
  console.log(`📋 Tables to restore: ${Object.keys(tableData).join(', ')}`);
  
  // Confirm before proceeding
  console.log('\n⚠️  WARNING: This will overwrite existing data!');
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const restoreResults = {
    timestamp: new Date().toISOString(),
    source_file: backupFile,
    tables: {},
    total_restored: 0,
    total_failed: 0
  };
  
  // Restore tables in order (important tables first)
  const tableOrder = [
    'profiles',
    'departments', 
    'doctors',
    'patients',
    'appointments',
    'medical_records',
    'doctor_work_schedules',
    'doctor_work_experiences',
    'doctor_reviews',
    'doctor_emergency_contacts',
    'doctor_settings',
    'doctor_statistics'
  ];
  
  // Restore tables that exist in backup
  for (const tableName of tableOrder) {
    if (tableData[tableName]) {
      const result = await restoreTable(tableName, tableData[tableName]);
      restoreResults.tables[tableName] = result;
      
      if (result.success) {
        restoreResults.total_restored += result.count;
      } else {
        restoreResults.total_failed++;
      }
      
      // Small delay between tables
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Restore any remaining tables not in the ordered list
  for (const [tableName, records] of Object.entries(tableData)) {
    if (!tableOrder.includes(tableName)) {
      const result = await restoreTable(tableName, records);
      restoreResults.tables[tableName] = result;
      
      if (result.success) {
        restoreResults.total_restored += result.count;
      } else {
        restoreResults.total_failed++;
      }
    }
  }
  
  // Save restore log
  const logFile = path.join(path.dirname(backupFile), `restore_log_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`);
  fs.writeFileSync(logFile, JSON.stringify(restoreResults, null, 2));
  
  // Print results
  console.log('\n🎉 Restore completed!');
  console.log('===================');
  console.log(`📊 Total records restored: ${restoreResults.total_restored}`);
  console.log(`❌ Failed tables: ${restoreResults.total_failed}`);
  console.log(`📋 Restore log: ${path.basename(logFile)}`);
  
  console.log('\n📋 Restore Summary:');
  Object.entries(restoreResults.tables).forEach(([table, result]) => {
    const status = result.success ? '✅' : '❌';
    const count = result.success ? `${result.count} records` : result.error;
    console.log(`   ${status} ${table}: ${count}`);
  });
  
  if (restoreResults.total_failed > 0) {
    console.log('\n⚠️  Some tables failed to restore. Check the restore log for details.');
    return false;
  } else {
    console.log('\n✅ All tables restored successfully!');
    return true;
  }
}

// Run the restore
if (require.main === module) {
  restoreFromBackup()
    .then((success) => {
      if (success) {
        console.log('\n✅ Restore process completed successfully!');
        process.exit(0);
      } else {
        console.log('\n⚠️  Restore process completed with errors.');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n❌ Restore process failed:', error);
      process.exit(1);
    });
}

module.exports = { restoreFromBackup, restoreTable };
