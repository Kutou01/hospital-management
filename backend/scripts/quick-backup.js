const fs = require('fs');

// Quick Backup for Free Plan - Hospital Management System
console.log('🏥 Quick Backup for Supabase Free Plan');
console.log('=====================================');

const SUPABASE_URL = 'https://ciasxktujslgsdgylimv.supabase.co';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpYXN4a3R1anNsZ3NkZ3lsaW12Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzU1NTU2NSwiZXhwIjoyMDYzMTMxNTY1fQ.R2IieQgCFPQ5sgEqPSJmF9uB1hZasJHg5enl2alJpn4';

async function fetchTable(tableName) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=*`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (!response.ok) {
      console.log(`⚠️  ${tableName}: ${response.status} - ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    console.log(`✅ ${tableName}: ${data.length} records`);
    return data;
  } catch (error) {
    console.log(`❌ ${tableName}: ${error.message}`);
    return null;
  }
}

async function quickBackup() {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
  const backupDir = './backups';
  
  // Create backup directory
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Essential tables to backup
  const tables = [
    'profiles',
    'doctors', 
    'patients',
    'departments',
    'appointments'
  ];
  
  const backup = {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    tables: {}
  };
  
  console.log('🚀 Starting quick backup...\n');
  
  for (const table of tables) {
    const data = await fetchTable(table);
    if (data) {
      backup.tables[table] = data;
    }
  }
  
  // Save backup
  const filename = `${backupDir}/quick_backup_${timestamp}.json`;
  fs.writeFileSync(filename, JSON.stringify(backup, null, 2));
  
  console.log(`\n🎉 Quick backup completed!`);
  console.log(`📁 Saved to: ${filename}`);
  console.log(`📊 File size: ${(fs.statSync(filename).size / 1024).toFixed(2)} KB`);
  
  // Create summary
  console.log('\n📋 Backup Summary:');
  Object.entries(backup.tables).forEach(([table, data]) => {
    console.log(`   ${table}: ${data.length} records`);
  });
  
  return filename;
}

// Run backup
quickBackup().catch(console.error);
