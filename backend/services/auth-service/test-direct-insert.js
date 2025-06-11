#!/usr/bin/env node

/**
 * Test direct insert to see what columns are actually required/available
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

async function testDoctorInsert() {
  console.log('\n🧪 Testing Doctor Insert...');
  
  const testDoctorData = {
    doctor_id: `TEST-DOC-${Date.now()}`,
    profile_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
    specialty: 'Test Specialty',
    department_id: 'DEPT001',
    license_number: `TEST-${Date.now()}`,
    qualification: 'Test MD',
    gender: 'male',
    bio: null,
    experience_years: 0,
    consultation_fee: null,
    address: {},
    languages_spoken: ['Vietnamese'],
    availability_status: 'available',
    rating: 0.00,
    total_reviews: 0
  };

  console.log('📦 Attempting to insert:', JSON.stringify(testDoctorData, null, 2));

  try {
    const { data, error } = await supabase
      .from('doctors')
      .insert([testDoctorData])
      .select();

    if (error) {
      console.log('❌ Insert failed:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details);
    } else {
      console.log('✅ Insert successful!');
      console.log('   Data:', data);
      
      // Clean up - delete the test record
      await supabase
        .from('doctors')
        .delete()
        .eq('doctor_id', testDoctorData.doctor_id);
      console.log('🧹 Test record cleaned up');
    }
  } catch (exception) {
    console.log('❌ Exception:', exception.message);
  }
}

async function testPatientInsert() {
  console.log('\n🧪 Testing Patient Insert...');
  
  const testPatientData = {
    patient_id: `TEST-PAT-${Date.now()}`,
    profile_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
    gender: 'female',
    blood_type: null,
    address: {},
    emergency_contact: {},
    insurance_info: {},
    medical_history: 'Test medical history',
    allergies: [],
    chronic_conditions: [],
    current_medications: {},
    status: 'active'
  };

  console.log('📦 Attempting to insert:', JSON.stringify(testPatientData, null, 2));

  try {
    const { data, error } = await supabase
      .from('patients')
      .insert([testPatientData])
      .select();

    if (error) {
      console.log('❌ Insert failed:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details);
    } else {
      console.log('✅ Insert successful!');
      console.log('   Data:', data);
      
      // Clean up - delete the test record
      await supabase
        .from('patients')
        .delete()
        .eq('patient_id', testPatientData.patient_id);
      console.log('🧹 Test record cleaned up');
    }
  } catch (exception) {
    console.log('❌ Exception:', exception.message);
  }
}

async function main() {
  console.log('🔍 TESTING DIRECT DATABASE INSERTS');
  console.log('==================================================');
  
  await testDoctorInsert();
  await testPatientInsert();
  
  console.log('\n🎯 Direct insert tests completed');
}

main().catch(console.error);
