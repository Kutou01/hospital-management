#!/usr/bin/env node

// Hospital Management System - Run Backup Script
// Usage: node run-backup.js

const fs = require('fs');
const path = require('path');

console.log('🏥 Hospital Management System - Database Backup');
console.log('===============================================');

// Supabase configuration
const SUPABASE_URL = 'https://ciasxktujslgsdgylimv.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpYXN4a3R1anNsZ3NkZ3lsaW12Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzU1NTU2NSwiZXhwIjoyMDYzMTMxNTY1fQ.R2IieQgCFPQ5sgEqPSJmF9uB1hZasJHg5enl2alJpn4';

// Create backup directory
const backupDir = path.join(__dirname, 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Generate timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

// Tables to backup (in order of importance)
const tables = [
  'profiles',      // User accounts
  'doctors',       // Doctor records  
  'patients',      // Patient records
  'departments',   // Hospital departments
  'appointments',  // Appointments
  'medical_records', // Medical records
  'doctor_work_schedules',
  'doctor_work_experiences', 
  'doctor_reviews',
  'doctor_emergency_contacts',
  'doctor_settings',
  'doctor_statistics'
];

async function fetchTableData(tableName) {
  try {
    console.log(`📊 Fetching ${tableName}...`);
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=*`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`⚠️  Table ${tableName} not found (404) - skipping`);
        return null;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ ${tableName}: ${data.length} records fetched`);
    
    return data;
  } catch (error) {
    console.log(`❌ Error fetching ${tableName}: ${error.message}`);
    return null;
  }
}

async function saveTableBackup(tableName, data) {
  if (!data || data.length === 0) {
    console.log(`⚠️  No data to save for ${tableName}`);
    return null;
  }
  
  const filename = path.join(backupDir, `${tableName}_${timestamp}.json`);
  
  try {
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    const fileSize = (fs.statSync(filename).size / 1024).toFixed(2);
    console.log(`💾 ${tableName} saved: ${filename} (${fileSize} KB)`);
    return filename;
  } catch (error) {
    console.log(`❌ Error saving ${tableName}: ${error.message}`);
    return null;
  }
}

async function createFullBackup() {
  console.log('🚀 Starting database backup...\n');
  
  const backupSummary = {
    timestamp: new Date().toISOString(),
    supabase_url: SUPABASE_URL,
    tables: {},
    files: [],
    total_records: 0
  };
  
  // Backup each table
  for (const tableName of tables) {
    const data = await fetchTableData(tableName);
    
    if (data) {
      const filename = await saveTableBackup(tableName, data);
      
      backupSummary.tables[tableName] = {
        records: data.length,
        file: filename ? path.basename(filename) : null,
        status: filename ? 'success' : 'failed'
      };
      
      if (filename) {
        backupSummary.files.push(filename);
        backupSummary.total_records += data.length;
      }
    } else {
      backupSummary.tables[tableName] = {
        records: 0,
        file: null,
        status: 'not_found'
      };
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Save backup summary
  const summaryFile = path.join(backupDir, `backup_summary_${timestamp}.json`);
  fs.writeFileSync(summaryFile, JSON.stringify(backupSummary, null, 2));
  
  // Create combined backup file
  const combinedBackup = {
    metadata: backupSummary,
    data: {}
  };
  
  // Read all individual backup files and combine
  for (const [tableName, info] of Object.entries(backupSummary.tables)) {
    if (info.status === 'success' && info.file) {
      const filePath = path.join(backupDir, info.file);
      try {
        const tableData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        combinedBackup.data[tableName] = tableData;
      } catch (error) {
        console.log(`⚠️  Could not read ${tableName} backup file`);
      }
    }
  }
  
  const combinedFile = path.join(backupDir, `hospital_full_backup_${timestamp}.json`);
  fs.writeFileSync(combinedFile, JSON.stringify(combinedBackup, null, 2));
  
  // Print results
  console.log('\n🎉 Backup completed!');
  console.log('==================');
  console.log(`📁 Backup directory: ${backupDir}`);
  console.log(`📊 Total records backed up: ${backupSummary.total_records}`);
  console.log(`📋 Summary file: ${path.basename(summaryFile)}`);
  console.log(`📦 Combined backup: ${path.basename(combinedFile)}`);
  
  const combinedSize = (fs.statSync(combinedFile).size / 1024).toFixed(2);
  console.log(`💾 Combined backup size: ${combinedSize} KB`);
  
  console.log('\n📋 Table Summary:');
  Object.entries(backupSummary.tables).forEach(([table, info]) => {
    const status = info.status === 'success' ? '✅' : 
                   info.status === 'not_found' ? '⚠️' : '❌';
    console.log(`   ${status} ${table}: ${info.records} records`);
  });
  
  console.log('\n💡 To restore from backup, use the restore script or import the JSON files.');
  
  return combinedFile;
}

// Run the backup
if (require.main === module) {
  createFullBackup()
    .then((backupFile) => {
      console.log(`\n✅ Backup process completed successfully!`);
      console.log(`📁 Main backup file: ${backupFile}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Backup process failed:', error);
      process.exit(1);
    });
}

module.exports = { createFullBackup, fetchTableData, saveTableBackup };
