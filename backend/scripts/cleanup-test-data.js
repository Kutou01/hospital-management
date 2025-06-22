#!/usr/bin/env node

/**
 * Cleanup Test Data Script
 * Removes all test data while preserving schema
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupTestData() {
  console.log('🧹 Starting test data cleanup...\n');

  try {
    // Step 1: Delete in correct order (respecting foreign keys)
    await cleanupDoctorReviews();
    await cleanupMedicalRecords();
    await cleanupAppointments();
    await cleanupDoctorSchedules();
    await cleanupDoctors();
    await cleanupPatients();
    await cleanupProfiles();
    await cleanupAuthUsers();
    
    console.log('\n🎉 Test data cleanup completed successfully!');
    console.log('\n📊 All test data has been removed while preserving:');
    console.log('   ✅ Database schema');
    console.log('   ✅ Functions and triggers');
    console.log('   ✅ Lookup tables (departments, specialties, etc.)');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

async function cleanupDoctorReviews() {
  console.log('⭐ Cleaning up doctor reviews...');
  
  const { error } = await supabase
    .from('doctor_reviews')
    .delete()
    .neq('review_id', 'KEEP_THIS'); // Delete all

  if (error) {
    console.log(`   ⚠️ Error: ${error.message}`);
  } else {
    console.log('   ✅ Doctor reviews cleaned up');
  }
}

async function cleanupMedicalRecords() {
  console.log('📋 Cleaning up medical records...');
  
  const { error } = await supabase
    .from('medical_records')
    .delete()
    .neq('record_id', 'KEEP_THIS'); // Delete all

  if (error) {
    console.log(`   ⚠️ Error: ${error.message}`);
  } else {
    console.log('   ✅ Medical records cleaned up');
  }
}

async function cleanupAppointments() {
  console.log('📅 Cleaning up appointments...');
  
  const { error } = await supabase
    .from('appointments')
    .delete()
    .neq('appointment_id', 'KEEP_THIS'); // Delete all

  if (error) {
    console.log(`   ⚠️ Error: ${error.message}`);
  } else {
    console.log('   ✅ Appointments cleaned up');
  }
}

async function cleanupDoctorSchedules() {
  console.log('📅 Cleaning up doctor schedules...');
  
  const { error } = await supabase
    .from('doctor_schedules')
    .delete()
    .neq('schedule_id', 'KEEP_THIS'); // Delete all

  if (error) {
    console.log(`   ⚠️ Error: ${error.message}`);
  } else {
    console.log('   ✅ Doctor schedules cleaned up');
  }
}

async function cleanupDoctors() {
  console.log('👨‍⚕️ Cleaning up doctors...');
  
  const { error } = await supabase
    .from('doctors')
    .delete()
    .neq('doctor_id', 'KEEP_THIS'); // Delete all

  if (error) {
    console.log(`   ⚠️ Error: ${error.message}`);
  } else {
    console.log('   ✅ Doctors cleaned up');
  }
}

async function cleanupPatients() {
  console.log('👤 Cleaning up patients...');
  
  const { error } = await supabase
    .from('patients')
    .delete()
    .neq('patient_id', 'KEEP_THIS'); // Delete all

  if (error) {
    console.log(`   ⚠️ Error: ${error.message}`);
  } else {
    console.log('   ✅ Patients cleaned up');
  }
}

async function cleanupProfiles() {
  console.log('👥 Cleaning up profiles...');
  
  // Only delete test profiles (not system profiles)
  const testEmails = [
    'bs.nguyen.tim@hospital.com',
    'bs.tran.thuy@hospital.com',
    'bs.le.duc@hospital.com',
    'nguyen.van.a@gmail.com',
    'tran.thi.c@gmail.com',
    'le.van.e@gmail.com'
  ];

  for (const email of testEmails) {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('email', email);

    if (error) {
      console.log(`   ⚠️ Profile ${email}: ${error.message}`);
    } else {
      console.log(`   ✅ Profile cleaned: ${email}`);
    }
  }
}

async function cleanupAuthUsers() {
  console.log('🔐 Cleaning up auth users...');
  
  // Get all test users
  const testEmails = [
    'bs.nguyen.tim@hospital.com',
    'bs.tran.thuy@hospital.com',
    'bs.le.duc@hospital.com',
    'nguyen.van.a@gmail.com',
    'tran.thi.c@gmail.com',
    'le.van.e@gmail.com'
  ];

  for (const email of testEmails) {
    try {
      // Get user by email
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        console.log(`   ⚠️ Error listing users: ${listError.message}`);
        continue;
      }

      const user = users.users.find(u => u.email === email);
      
      if (user) {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        
        if (deleteError) {
          console.log(`   ⚠️ Auth user ${email}: ${deleteError.message}`);
        } else {
          console.log(`   ✅ Auth user cleaned: ${email}`);
        }
      } else {
        console.log(`   ℹ️ Auth user not found: ${email}`);
      }
    } catch (error) {
      console.log(`   ⚠️ Error cleaning auth user ${email}: ${error.message}`);
    }
  }
}

// Interactive cleanup with confirmation
async function interactiveCleanup() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('⚠️  WARNING: This will delete ALL test data!');
  console.log('📋 This includes:');
  console.log('   - All test doctor and patient accounts');
  console.log('   - All appointments and medical records');
  console.log('   - All doctor schedules and reviews');
  console.log('   - All test profiles and auth users');
  console.log('');
  console.log('✅ This will preserve:');
  console.log('   - Database schema and structure');
  console.log('   - Functions and triggers');
  console.log('   - Lookup tables (departments, specialties, etc.)');
  console.log('');

  rl.question('Are you sure you want to proceed? (yes/no): ', (answer) => {
    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      rl.close();
      cleanupTestData();
    } else {
      console.log('❌ Cleanup cancelled');
      rl.close();
    }
  });
}

// Run cleanup
if (require.main === module) {
  // Check if --force flag is provided
  if (process.argv.includes('--force')) {
    cleanupTestData().catch(error => {
      console.error('❌ Cleanup failed:', error);
      process.exit(1);
    });
  } else {
    interactiveCleanup();
  }
}

module.exports = { cleanupTestData };
