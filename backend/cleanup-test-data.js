const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function cleanupTestData() {
  log('\n🧹 CLEANING UP TEST DATA', 'cyan');
  log('=' .repeat(50), 'cyan');
  
  try {
    // Step 1: Delete payments
    log('\n💰 Step 1: Cleaning payments...', 'blue');
    const { error: paymentsError } = await supabase
      .from('payments')
      .delete()
      .like('patient_id', 'PAT-%');
    
    if (paymentsError) {
      log(`⚠️ Payments cleanup: ${paymentsError.message}`, 'yellow');
    } else {
      log('✅ Payments cleaned', 'green');
    }

    // Step 2: Delete medical records
    log('\n📋 Step 2: Cleaning medical records...', 'blue');
    const { error: recordsError } = await supabase
      .from('medical_records')
      .delete()
      .like('patient_id', 'PAT-%');
    
    if (recordsError) {
      log(`⚠️ Medical records cleanup: ${recordsError.message}`, 'yellow');
    } else {
      log('✅ Medical records cleaned', 'green');
    }

    // Step 3: Delete appointments
    log('\n📅 Step 3: Cleaning appointments...', 'blue');
    const { error: appointmentsError } = await supabase
      .from('appointments')
      .delete()
      .like('patient_id', 'PAT-%');
    
    if (appointmentsError) {
      log(`⚠️ Appointments cleanup: ${appointmentsError.message}`, 'yellow');
    } else {
      log('✅ Appointments cleaned', 'green');
    }

    // Step 4: Delete patients
    log('\n👥 Step 4: Cleaning patients...', 'blue');
    const { error: patientsError } = await supabase
      .from('patients')
      .delete()
      .neq('patient_id', 'KEEP_THIS'); // Delete all
    
    if (patientsError) {
      log(`⚠️ Patients cleanup: ${patientsError.message}`, 'yellow');
    } else {
      log('✅ Patients cleaned', 'green');
    }

    // Step 5: Delete doctors
    log('\n👨‍⚕️ Step 5: Cleaning doctors...', 'blue');
    const { error: doctorsError } = await supabase
      .from('doctors')
      .delete()
      .neq('doctor_id', 'KEEP_THIS'); // Delete all
    
    if (doctorsError) {
      log(`⚠️ Doctors cleanup: ${doctorsError.message}`, 'yellow');
    } else {
      log('✅ Doctors cleaned', 'green');
    }

    // Step 6: Delete admins
    log('\n👑 Step 6: Cleaning admins...', 'blue');
    const { error: adminsError } = await supabase
      .from('admins')
      .delete()
      .neq('admin_id', 'KEEP_THIS'); // Delete all
    
    if (adminsError) {
      log(`⚠️ Admins cleanup: ${adminsError.message}`, 'yellow');
    } else {
      log('✅ Admins cleaned', 'green');
    }

    // Step 7: Delete profiles
    log('\n👤 Step 7: Cleaning profiles...', 'blue');
    const { error: profilesError } = await supabase
      .from('profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (profilesError) {
      log(`⚠️ Profiles cleanup: ${profilesError.message}`, 'yellow');
    } else {
      log('✅ Profiles cleaned', 'green');
    }

    // Step 8: Delete auth users
    log('\n🔐 Step 8: Cleaning auth users...', 'blue');
    
    // Get all users first
    const { data: users, error: getUsersError } = await supabase.auth.admin.listUsers();
    
    if (getUsersError) {
      log(`❌ Failed to get users: ${getUsersError.message}`, 'red');
    } else {
      log(`Found ${users.users.length} users to delete`, 'yellow');
      
      for (const user of users.users) {
        const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id);
        if (deleteUserError) {
          log(`⚠️ Failed to delete user ${user.email}: ${deleteUserError.message}`, 'yellow');
        } else {
          log(`✅ Deleted user: ${user.email}`, 'green');
        }
      }
    }

    log('\n🎉 CLEANUP COMPLETED SUCCESSFULLY!', 'green');
    log('Database is now clean and ready for fresh test data.', 'green');

  } catch (error) {
    log(`❌ Cleanup failed: ${error.message}`, 'red');
    console.error(error);
  }
}

// Main execution
async function main() {
  log('🚀 HOSPITAL MANAGEMENT SYSTEM - CLEANUP TEST DATA', 'cyan');
  log('Time: ' + new Date().toISOString(), 'cyan');
  log('⚠️  WARNING: This will delete ALL data in the database!', 'red');
  
  await cleanupTestData();
}

// Run the cleanup
main().catch(console.error);
