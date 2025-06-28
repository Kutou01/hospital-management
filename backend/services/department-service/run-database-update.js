#!/usr/bin/env node

/**
 * 🗄️ DATABASE SCHEMA UPDATE RUNNER
 * 
 * This script executes the database schema update to enable full Department Service functionality
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

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

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runDatabaseUpdate() {
  log('🗄️ HOSPITAL MANAGEMENT SYSTEM - DATABASE SCHEMA UPDATE', 'cyan');
  log('=' .repeat(80), 'cyan');
  log(`📅 Update Date: ${new Date().toISOString()}`, 'white');
  
  try {
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'database-schema-update.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error('SQL file not found: database-schema-update.sql');
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    log('\n📖 Reading SQL update script...', 'yellow');
    log(`✅ SQL file loaded: ${sqlContent.length} characters`, 'green');
    
    // Execute the SQL
    log('\n🚀 Executing database schema update...', 'yellow');
    log('⚠️ This may take a few moments...', 'yellow');
    
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: sqlContent 
    }).catch(async () => {
      // If RPC doesn't work, try direct SQL execution
      return await supabase.from('_').select('*').limit(0).then(() => {
        throw new Error('Direct SQL execution not available. Please run the SQL manually in Supabase SQL Editor.');
      });
    });
    
    if (error) {
      log(`❌ Database update failed: ${error.message}`, 'red');
      log('\n📋 MANUAL EXECUTION REQUIRED:', 'yellow');
      log('1. Open Supabase Dashboard', 'white');
      log('2. Go to SQL Editor', 'white');
      log('3. Copy and paste the content from database-schema-update.sql', 'white');
      log('4. Execute the SQL script', 'white');
      log('5. Run the verification script after completion', 'white');
      return false;
    }
    
    log('✅ Database schema update completed successfully!', 'green');
    
    // Verify the update
    await verifyDatabaseUpdate();
    
    return true;
    
  } catch (error) {
    log(`💥 Unexpected error: ${error.message}`, 'red');
    log('\n📋 MANUAL EXECUTION REQUIRED:', 'yellow');
    log('1. Open Supabase Dashboard → SQL Editor', 'white');
    log('2. Copy content from database-schema-update.sql', 'white');
    log('3. Execute the SQL script', 'white');
    log('4. Run: node verify-database-update.js', 'white');
    return false;
  }
}

async function verifyDatabaseUpdate() {
  log('\n🔍 Verifying database update...', 'yellow');
  
  const verifications = [
    {
      name: 'Departments hierarchy columns',
      test: async () => {
        const { data, error } = await supabase
          .from('departments')
          .select('department_id, parent_department_id, level, path')
          .limit(1);
        return !error && data;
      }
    },
    {
      name: 'Specialties enhanced columns',
      test: async () => {
        const { data, error } = await supabase
          .from('specialties')
          .select('specialty_id, average_consultation_time, consultation_fee_min, consultation_fee_max')
          .limit(1);
        return !error && data;
      }
    },
    {
      name: 'Rooms management columns',
      test: async () => {
        const { data, error } = await supabase
          .from('rooms')
          .select('room_id, room_type, equipment_ids, location, notes')
          .limit(1);
        return !error && data;
      }
    },
    {
      name: 'Doctors status columns',
      test: async () => {
        const { data, error } = await supabase
          .from('doctors')
          .select('doctor_id, is_active, availability_status')
          .limit(1);
        return !error && data;
      }
    }
  ];
  
  let passedTests = 0;
  
  for (const verification of verifications) {
    try {
      const result = await verification.test();
      if (result) {
        log(`✅ ${verification.name}`, 'green');
        passedTests++;
      } else {
        log(`❌ ${verification.name}`, 'red');
      }
    } catch (error) {
      log(`❌ ${verification.name}: ${error.message}`, 'red');
    }
  }
  
  const successRate = Math.round((passedTests / verifications.length) * 100);
  
  log(`\n📊 Verification Results: ${passedTests}/${verifications.length} (${successRate}%)`, 
      successRate === 100 ? 'green' : successRate >= 75 ? 'yellow' : 'red');
  
  if (successRate === 100) {
    log('🎉 All database updates verified successfully!', 'green');
    log('🚀 Department Service is ready for full functionality!', 'green');
  } else {
    log('⚠️ Some database updates may not have been applied correctly', 'yellow');
    log('📋 Please check the SQL execution manually', 'yellow');
  }
  
  return successRate === 100;
}

async function showNextSteps() {
  log('\n🎯 NEXT STEPS:', 'cyan');
  log('=' .repeat(40), 'cyan');
  
  log('1. 🔄 Restart Department Service:', 'white');
  log('   docker-compose restart department-service', 'blue');
  
  log('\n2. 🧪 Test the updated service:', 'white');
  log('   node test-complete-department-service.js', 'blue');
  
  log('\n3. 🎉 Expected improvements:', 'white');
  log('   • Hierarchy operations should work', 'green');
  log('   • Specialty creation should work', 'green');
  log('   • Room creation should work', 'green');
  log('   • Integration endpoints should work', 'green');
  log('   • Success rate should be 80%+', 'green');
  
  log('\n4. 📈 Monitor the results:', 'white');
  log('   • Check for any remaining errors', 'yellow');
  log('   • Verify all CRUD operations', 'yellow');
  log('   • Test hierarchy functionality', 'yellow');
}

// Main execution
if (require.main === module) {
  runDatabaseUpdate()
    .then(success => {
      if (success) {
        showNextSteps();
      }
    })
    .catch(error => {
      console.error('❌ Database update script failed:', error);
      process.exit(1);
    });
}

module.exports = { runDatabaseUpdate, verifyDatabaseUpdate };
