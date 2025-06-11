#!/usr/bin/env node

/**
 * =====================================================
 * SAMPLE DATA CHECKER
 * =====================================================
 * Script để kiểm tra dữ liệu mẫu trong database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkSampleData() {
  console.log('🔍 CHECKING SAMPLE DATA...\n');

  // Check departments first (should have data)
  await checkDepartments();
  
  // Check other tables
  await checkProfiles();
  await checkDoctors();
  await checkPatients();
  await checkAdmins();
}

async function checkDepartments() {
  console.log('🏥 DEPARTMENTS:');
  console.log('===============');
  
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .limit(5);

    if (error) {
      console.log(`❌ Error: ${error.message}`);
      return;
    }

    if (!data || data.length === 0) {
      console.log('⚪ No departments found');
      return;
    }

    console.log(`✅ Found ${data.length} departments:`);
    data.forEach((dept, index) => {
      console.log(`  ${index + 1}. ${dept.department_id}: ${dept.name}`);
      if (dept.code) console.log(`     Code: ${dept.code}`);
      if (dept.description) console.log(`     Description: ${dept.description}`);
    });

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  console.log('');
}

async function checkProfiles() {
  console.log('👤 PROFILES:');
  console.log('============');
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(3);

    if (error) {
      console.log(`❌ Error: ${error.message}`);
      return;
    }

    if (!data || data.length === 0) {
      console.log('⚪ No profiles found');
      return;
    }

    console.log(`✅ Found ${data.length} profiles:`);
    data.forEach((profile, index) => {
      console.log(`  ${index + 1}. ${profile.email} (${profile.role})`);
      console.log(`     Name: ${profile.full_name}`);
      console.log(`     Phone: ${profile.phone_number || 'N/A'}`);
      console.log(`     DOB: ${profile.date_of_birth || 'N/A'}`);
    });

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  console.log('');
}

async function checkDoctors() {
  console.log('👨‍⚕️ DOCTORS:');
  console.log('============');
  
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .limit(3);

    if (error) {
      console.log(`❌ Error: ${error.message}`);
      return;
    }

    if (!data || data.length === 0) {
      console.log('⚪ No doctors found');
      return;
    }

    console.log(`✅ Found ${data.length} doctors:`);
    data.forEach((doctor, index) => {
      console.log(`  ${index + 1}. ${doctor.doctor_id}`);
      console.log(`     Specialization: ${doctor.specialization}`);
      console.log(`     License: ${doctor.license_number}`);
      console.log(`     Department: ${doctor.department_id}`);
      console.log(`     Status: ${doctor.status}`);
    });

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  console.log('');
}

async function checkPatients() {
  console.log('🏥 PATIENTS:');
  console.log('============');
  
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .limit(3);

    if (error) {
      console.log(`❌ Error: ${error.message}`);
      return;
    }

    if (!data || data.length === 0) {
      console.log('⚪ No patients found');
      return;
    }

    console.log(`✅ Found ${data.length} patients:`);
    data.forEach((patient, index) => {
      console.log(`  ${index + 1}. ${patient.patient_id}`);
      console.log(`     DOB: ${patient.date_of_birth || 'N/A'}`);
      console.log(`     Gender: ${patient.gender || 'N/A'}`);
      console.log(`     Blood Type: ${patient.blood_type || 'N/A'}`);
      console.log(`     Status: ${patient.status}`);
    });

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  console.log('');
}

async function checkAdmins() {
  console.log('👑 ADMINS:');
  console.log('==========');
  
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .limit(3);

    if (error) {
      console.log(`❌ Error: ${error.message}`);
      return;
    }

    if (!data || data.length === 0) {
      console.log('⚪ No admins found');
      return;
    }

    console.log(`✅ Found ${data.length} admins:`);
    data.forEach((admin, index) => {
      console.log(`  ${index + 1}. ${admin.admin_id}`);
      console.log(`     Department: ${admin.department_id || 'N/A'}`);
      console.log(`     Access Level: ${admin.access_level}`);
      console.log(`     Status: ${admin.status}`);
    });

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  console.log('');
}

// Run the check
checkSampleData()
  .then(() => {
    console.log('🎯 SAMPLE DATA CHECK COMPLETED');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ SAMPLE DATA CHECK FAILED:', error);
    process.exit(1);
  });
