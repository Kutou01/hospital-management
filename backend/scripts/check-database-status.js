#!/usr/bin/env node

/**
 * =====================================================
 * DATABASE STATUS CHECKER
 * =====================================================
 * Script để kiểm tra tình trạng database hiện tại
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkDatabaseStatus() {
  console.log('🔍 CHECKING DATABASE STATUS...\n');

  try {
    // Test basic connection by trying to access a known table
    console.log('Testing database connection...');

    // Try to check if profiles table exists
    const { data: profilesTest, error: profilesError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    console.log('✅ Database connection successful\n');

    // List of expected tables to check
    const expectedTables = [
      'profiles',
      'doctors',
      'patients',
      'admins',
      'departments',
      'appointments',
      'medical_records',
      'rooms',
      'doctor_schedules',
      'doctor_reviews',
      'doctor_shifts',
      'doctor_experiences',
      'specialties',
      'room_types',
      'diagnosis',
      'medications',
      'status_values',
      'payment_methods'
    ];

    console.log('📋 CHECKING TABLES:');
    console.log('==================');

    // Check each table individually
    for (const tableName of expectedTables) {
      await checkTableExists(tableName);
    }

    console.log('\n📈 DATA COUNTS:');
    console.log('===============');

    // Check data counts for core tables
    const coreTables = ['profiles', 'doctors', 'patients', 'admins', 'departments'];

    for (const tableName of coreTables) {
      await checkTableCount(tableName);
    }

    console.log('\n🎯 SUMMARY:');
    console.log('===========');
    console.log('Database status check completed. See details above.');

  } catch (error) {
    console.error('❌ Error checking database status:', error.message);
  }
}

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.log(`❌ ${tableName}: Table does not exist or not accessible`);
      return false;
    } else {
      console.log(`✅ ${tableName}: Table exists (${data || 0} records)`);
      return true;
    }
  } catch (error) {
    console.log(`❌ ${tableName}: Error - ${error.message}`);
    return false;
  }
}

async function checkTableStructure(tableName) {
  try {
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', tableName)
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (error) {
      console.log(`❌ ${tableName}: Error getting structure - ${error.message}`);
      return;
    }

    console.log(`\n📋 ${tableName.toUpperCase()} TABLE:`);
    console.log(`   Columns: ${columns.length}`);
    
    // Check for key columns
    const columnNames = columns.map(c => c.column_name);
    
    if (tableName === 'profiles') {
      const hasId = columnNames.includes('id');
      const hasEmail = columnNames.includes('email');
      const hasFullName = columnNames.includes('full_name');
      const hasRole = columnNames.includes('role');
      const hasDateOfBirth = columnNames.includes('date_of_birth');
      
      console.log(`   ✅ Core fields: id(${hasId}), email(${hasEmail}), full_name(${hasFullName}), role(${hasRole})`);
      console.log(`   ${hasDateOfBirth ? '✅' : '❌'} date_of_birth: ${hasDateOfBirth}`);
    }
    
    if (tableName === 'doctors') {
      const hasDoctorId = columnNames.includes('doctor_id');
      const hasProfileId = columnNames.includes('profile_id');
      const hasSpecialization = columnNames.includes('specialization');
      const hasLicenseNumber = columnNames.includes('license_number');
      const hasDepartmentId = columnNames.includes('department_id');
      
      console.log(`   ✅ Core fields: doctor_id(${hasDoctorId}), profile_id(${hasProfileId}), specialization(${hasSpecialization})`);
      console.log(`   ✅ Business fields: license_number(${hasLicenseNumber}), department_id(${hasDepartmentId})`);
    }
    
    if (tableName === 'patients') {
      const hasPatientId = columnNames.includes('patient_id');
      const hasProfileId = columnNames.includes('profile_id');
      const hasDateOfBirth = columnNames.includes('date_of_birth');
      const hasGender = columnNames.includes('gender');
      const hasBloodType = columnNames.includes('blood_type');
      
      console.log(`   ✅ Core fields: patient_id(${hasPatientId}), profile_id(${hasProfileId})`);
      console.log(`   ✅ Medical fields: date_of_birth(${hasDateOfBirth}), gender(${hasGender}), blood_type(${hasBloodType})`);
    }

  } catch (error) {
    console.log(`❌ ${tableName}: Error - ${error.message}`);
  }
}

async function checkTableCount(tableName) {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`❌ ${tableName}: Table not accessible`);
      return;
    }

    console.log(`   ${tableName}: ${count || 0} records`);
  } catch (error) {
    console.log(`❌ ${tableName}: Error accessing table`);
  }
}

async function checkFunctions() {
  const functions = [
    'generate_doctor_id',
    'generate_patient_id', 
    'generate_admin_id',
    'generate_appointment_id',
    'generate_medical_record_id'
  ];

  for (const funcName of functions) {
    try {
      const { data, error } = await supabase
        .from('information_schema.routines')
        .select('routine_name')
        .eq('routine_name', funcName)
        .eq('routine_schema', 'public');

      const exists = data && data.length > 0;
      console.log(`   ${exists ? '✅' : '❌'} ${funcName}()`);
    } catch (error) {
      console.log(`   ❌ ${funcName}(): Error checking`);
    }
  }
}

async function checkSequences() {
  const sequences = [
    'doctor_id_seq',
    'patient_id_seq',
    'admin_id_seq'
  ];

  for (const seqName of sequences) {
    try {
      const { data, error } = await supabase
        .from('information_schema.sequences')
        .select('sequence_name')
        .eq('sequence_name', seqName)
        .eq('sequence_schema', 'public');

      const exists = data && data.length > 0;
      console.log(`   ${exists ? '✅' : '❌'} ${seqName}`);
    } catch (error) {
      console.log(`   ❌ ${seqName}: Error checking`);
    }
  }
}

// Run the check
checkDatabaseStatus()
  .then(() => {
    console.log('\n🎯 DATABASE STATUS CHECK COMPLETED');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ DATABASE STATUS CHECK FAILED:', error);
    process.exit(1);
  });
