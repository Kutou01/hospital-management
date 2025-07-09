const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Hospital Management System - API Backup Script
console.log("🏥 Hospital Management System - API Backup");
console.log("==========================================");

// Supabase configuration - Load from environment variables
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing required environment variables:");
  console.error("   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  console.error("   Please check your .env file");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Create backup directory
const backupDir = "./backups";
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Generate timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

// Tables to backup
const tables = [
  "profiles",
  "doctors",
  "patients",
  "departments",
  "appointments",
  "medical_records",
  "doctor_work_schedules",
  "doctor_work_experiences",
  "doctor_reviews",
  "doctor_emergency_contacts",
  "doctor_settings",
  "doctor_statistics",
];

async function backupTable(tableName) {
  try {
    console.log(`📊 Backing up table: ${tableName}`);

    const { data, error } = await supabase.from(tableName).select("*");

    if (error) {
      console.log(`⚠️  Warning: Could not backup ${tableName}:`, error.message);
      return null;
    }

    const filename = path.join(backupDir, `${tableName}_${timestamp}.json`);
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));

    console.log(
      `✅ ${tableName}: ${data?.length || 0} records saved to ${filename}`
    );
    return data;
  } catch (error) {
    console.log(`❌ Error backing up ${tableName}:`, error.message);
    return null;
  }
}

async function createFullBackup() {
  console.log("🚀 Starting full database backup...\n");

  const backupData = {};

  for (const table of tables) {
    const data = await backupTable(table);
    if (data) {
      backupData[table] = data;
    }
  }

  // Save combined backup
  const fullBackupFile = path.join(backupDir, `full_backup_${timestamp}.json`);
  fs.writeFileSync(fullBackupFile, JSON.stringify(backupData, null, 2));

  console.log(`\n🎉 Full backup completed!`);
  console.log(`📁 Combined backup saved to: ${fullBackupFile}`);

  // Create restore script
  const restoreScript = `
// Hospital Management System - Restore Script
// Generated: ${new Date().toISOString()}

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = '${supabaseUrl}';
const supabaseServiceKey = 'YOUR_SERVICE_KEY_HERE';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const backupData = JSON.parse(fs.readFileSync('${fullBackupFile}', 'utf8'));

async function restoreData() {
  for (const [tableName, records] of Object.entries(backupData)) {
    if (records && records.length > 0) {
      console.log(\`Restoring \${tableName}: \${records.length} records\`);
      
      const { error } = await supabase
        .from(tableName)
        .upsert(records);
      
      if (error) {
        console.error(\`Error restoring \${tableName}:\`, error);
      } else {
        console.log(\`✅ \${tableName} restored successfully\`);
      }
    }
  }
}

restoreData().catch(console.error);
`;

  const restoreFile = path.join(backupDir, `restore_${timestamp}.js`);
  fs.writeFileSync(restoreFile, restoreScript);

  console.log(`🔄 Restore script created: ${restoreFile}`);

  // Show summary
  console.log("\n📋 Backup Summary:");
  Object.entries(backupData).forEach(([table, data]) => {
    console.log(`   ${table}: ${data?.length || 0} records`);
  });
}

// Run backup
createFullBackup().catch(console.error);

module.exports = { createFullBackup, backupTable };
