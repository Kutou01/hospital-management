#!/usr/bin/env node

/**
 * Test if database actually has 'awards' column
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testAwardsColumn() {
  console.log('\n🧪 Testing if doctors table has awards column...');
  
  const testDoctorData = {
    doctor_id: `TEST-${Date.now()}`,
    profile_id: '00000000-0000-0000-0000-000000000000',
    specialty: 'Test',
    department_id: 'DEPT001',
    license_number: `LIC-${Date.now()}`,
    qualification: 'MD',
    gender: 'male',
    awards: ['Test Award'] // Try with awards column
  };

  console.log('📦 Testing with awards column...');

  try {
    const { data, error } = await supabase
      .from('doctors')
      .insert([testDoctorData])
      .select();

    if (error) {
      console.log('❌ Insert with awards failed:', error.message);
      
      // Try without awards
      delete testDoctorData.awards;
      testDoctorData.doctor_id = `TEST2-${Date.now()}`;
      
      console.log('📦 Testing without awards column...');
      const { data: data2, error: error2 } = await supabase
        .from('doctors')
        .insert([testDoctorData])
        .select();
        
      if (error2) {
        console.log('❌ Insert without awards also failed:', error2.message);
      } else {
        console.log('✅ Insert without awards successful!');
        console.log('   This means awards column does NOT exist in database');
        
        // Clean up
        await supabase.from('doctors').delete().eq('doctor_id', testDoctorData.doctor_id);
      }
    } else {
      console.log('✅ Insert with awards successful!');
      console.log('   This means awards column DOES exist in database');
      
      // Clean up
      await supabase.from('doctors').delete().eq('doctor_id', testDoctorData.doctor_id);
    }
  } catch (exception) {
    console.log('❌ Exception:', exception.message);
  }
}

async function testDateOfBirthColumn() {
  console.log('\n🧪 Testing if patients table has date_of_birth column...');
  
  const testPatientData = {
    patient_id: `TEST-${Date.now()}`,
    profile_id: '00000000-0000-0000-0000-000000000000',
    gender: 'female',
    date_of_birth: '1990-01-01' // Try with date_of_birth column
  };

  console.log('📦 Testing with date_of_birth column...');

  try {
    const { data, error } = await supabase
      .from('patients')
      .insert([testPatientData])
      .select();

    if (error) {
      console.log('❌ Insert with date_of_birth failed:', error.message);
      
      // Try without date_of_birth
      delete testPatientData.date_of_birth;
      testPatientData.patient_id = `TEST2-${Date.now()}`;
      
      console.log('📦 Testing without date_of_birth column...');
      const { data: data2, error: error2 } = await supabase
        .from('patients')
        .insert([testPatientData])
        .select();
        
      if (error2) {
        console.log('❌ Insert without date_of_birth also failed:', error2.message);
      } else {
        console.log('✅ Insert without date_of_birth successful!');
        console.log('   This means date_of_birth column does NOT exist in patients table');
        
        // Clean up
        await supabase.from('patients').delete().eq('patient_id', testPatientData.patient_id);
      }
    } else {
      console.log('✅ Insert with date_of_birth successful!');
      console.log('   This means date_of_birth column DOES exist in patients table');
      
      // Clean up
      await supabase.from('patients').delete().eq('patient_id', testPatientData.patient_id);
    }
  } catch (exception) {
    console.log('❌ Exception:', exception.message);
  }
}

async function main() {
  console.log('🔍 TESTING ACTUAL DATABASE COLUMNS');
  console.log('==================================================');
  
  await testAwardsColumn();
  await testDateOfBirthColumn();
  
  console.log('\n🎯 Column tests completed');
}

main().catch(console.error);
