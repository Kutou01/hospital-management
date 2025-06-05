#!/usr/bin/env node

/**
 * Table Columns Checker
 * Checks specific column structure of each table
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableColumns() {
  console.log('🔍 Checking Table Column Structures...\n');

  // Check each table by trying to insert a test record (will fail but show column errors)
  await checkProfilesColumns();
  await checkDoctorsColumns();
  await checkPatientsColumns();
  await checkAdminsColumns();
}

async function checkProfilesColumns() {
  console.log('📋 PROFILES TABLE COLUMNS:');
  try {
    // Try to insert with common column names to see what's expected
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: '00000000-0000-0000-0000-000000000000', // Test UUID
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'patient'
      })
      .select();

    if (error) {
      console.log('Error (shows expected columns):', error.message);
      
      // Try to get one record to see structure
      const { data: sample, error: selectError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      
      if (!selectError && sample && sample.length > 0) {
        console.log('✅ Columns found:', Object.keys(sample[0]));
      } else {
        console.log('📝 Table is empty, cannot determine columns from data');
      }
    } else {
      console.log('✅ Test insert successful (will clean up)');
      // Clean up test record
      await supabase.from('profiles').delete().eq('email', 'test@example.com');
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
  console.log('');
}

async function checkDoctorsColumns() {
  console.log('📋 DOCTORS TABLE COLUMNS:');
  try {
    const { data, error } = await supabase
      .from('doctors')
      .insert({
        doctor_id: 'DOC000001',
        profile_id: '00000000-0000-0000-0000-000000000000',
        full_name: 'Test Doctor',
        specialty: 'General Medicine', // or specialization?
        license_number: 'TEST123',
        qualification: 'MD',
        department_id: 'DEPT001',
        gender: 'other',
        phone_number: '0123456789',
        email: 'testdoctor@example.com',
        status: 'active'
      })
      .select();

    if (error) {
      console.log('Error (shows expected columns):', error.message);
      
      // Check if it's specialty vs specialization
      if (error.message.includes('specialty')) {
        console.log('🔍 Trying with "specialization" instead of "specialty"...');
        const { data: data2, error: error2 } = await supabase
          .from('doctors')
          .insert({
            doctor_id: 'DOC000001',
            profile_id: '00000000-0000-0000-0000-000000000000',
            full_name: 'Test Doctor',
            specialization: 'General Medicine', // Try specialization
            license_number: 'TEST123',
            qualification: 'MD',
            department_id: 'DEPT001'
          })
          .select();
        
        if (error2) {
          console.log('Error with specialization:', error2.message);
        } else {
          console.log('✅ "specialization" column works');
        }
      }
    } else {
      console.log('✅ Test insert successful');
      await supabase.from('doctors').delete().eq('email', 'testdoctor@example.com');
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
  console.log('');
}

async function checkPatientsColumns() {
  console.log('📋 PATIENTS TABLE COLUMNS:');
  try {
    const { data, error } = await supabase
      .from('patients')
      .insert({
        patient_id: 'PAT000001',
        profile_id: '00000000-0000-0000-0000-000000000000',
        full_name: 'Test Patient',
        date_of_birth: '1990-01-01',
        gender: 'other',
        phone_number: '0123456789',
        email: 'testpatient@example.com',
        registration_date: '2024-01-01',
        status: 'active'
      })
      .select();

    if (error) {
      console.log('Error (shows expected columns):', error.message);
      
      // Try alternative column names
      if (error.message.includes('date_of_birth')) {
        console.log('🔍 Trying with "dateofbirth" instead...');
        const { data: data2, error: error2 } = await supabase
          .from('patients')
          .insert({
            patient_id: 'PAT000001',
            profile_id: '00000000-0000-0000-0000-000000000000',
            full_name: 'Test Patient',
            dateofbirth: '1990-01-01', // Try dateofbirth
            gender: 'other'
          })
          .select();
        
        if (error2) {
          console.log('Error with dateofbirth:', error2.message);
        } else {
          console.log('✅ "dateofbirth" column works');
        }
      }
    } else {
      console.log('✅ Test insert successful');
      await supabase.from('patients').delete().eq('email', 'testpatient@example.com');
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
  console.log('');
}

async function checkAdminsColumns() {
  console.log('📋 ADMINS TABLE COLUMNS:');
  try {
    const { data, error } = await supabase
      .from('admins')
      .insert({
        admin_id: 'ADM000001',
        profile_id: '00000000-0000-0000-0000-000000000000',
        full_name: 'Test Admin',
        phone_number: '0123456789',
        email: 'testadmin@example.com',
        role_level: 'standard',
        status: 'active'
      })
      .select();

    if (error) {
      console.log('Error (shows expected columns):', error.message);
    } else {
      console.log('✅ Test insert successful');
      await supabase.from('admins').delete().eq('email', 'testadmin@example.com');
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
  console.log('');
}

// Run the check
if (require.main === module) {
  checkTableColumns()
    .then(() => {
      console.log('✅ Table columns check completed');
    })
    .catch((error) => {
      console.error('❌ Table columns check failed:', error);
      process.exit(1);
    });
}
