#!/usr/bin/env node

/**
 * Check Exact Column Structure
 * Tests insert with minimal data to see exact column requirements
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

async function checkExactColumns() {
  console.log('🔍 Checking Exact Column Requirements...\n');

  // Test doctors table with minimal required columns
  console.log('📋 TESTING DOCTORS TABLE:');
  await testDoctorsMinimal();

  // Test patients table with minimal required columns
  console.log('\n📋 TESTING PATIENTS TABLE:');
  await testPatientsMinimal();

  // Test admins table (we know this works)
  console.log('\n📋 TESTING ADMINS TABLE:');
  await testAdminsMinimal();
}

async function testDoctorsMinimal() {
  const testCombinations = [
    // Test 1: Basic required fields
    {
      doctor_id: 'DOC000001',
      profile_id: '11111111-1111-1111-1111-111111111111'
    },
    // Test 2: Add more fields
    {
      doctor_id: 'DOC000002',
      profile_id: '11111111-1111-1111-1111-111111111112',
      specialization: 'Cardiology'
    },
    // Test 3: Add even more fields
    {
      doctor_id: 'DOC000003',
      profile_id: '11111111-1111-1111-1111-111111111113',
      specialization: 'Cardiology',
      license_number: 'TEST123',
      qualification: 'MD'
    }
  ];

  for (let i = 0; i < testCombinations.length; i++) {
    const testData = testCombinations[i];
    console.log(`Test ${i + 1}:`, Object.keys(testData));
    
    try {
      const { data, error } = await supabase
        .from('doctors')
        .insert(testData)
        .select();

      if (error) {
        console.log(`❌ Error: ${error.message}`);
      } else {
        console.log(`✅ Success! Required columns found.`);
        console.log('Returned data:', data);
        
        // Clean up
        await supabase.from('doctors').delete().eq('doctor_id', testData.doctor_id);
        break; // Stop testing once we find working combination
      }
    } catch (err) {
      console.log(`❌ Exception: ${err.message}`);
    }
  }
}

async function testPatientsMinimal() {
  const testCombinations = [
    // Test 1: Basic required fields
    {
      patient_id: 'PAT000001',
      profile_id: '22222222-2222-2222-2222-222222222221'
    },
    // Test 2: Add more fields
    {
      patient_id: 'PAT000002',
      profile_id: '22222222-2222-2222-2222-222222222222',
      dateofbirth: '1990-01-01'
    },
    // Test 3: Add even more fields
    {
      patient_id: 'PAT000003',
      profile_id: '22222222-2222-2222-2222-222222222223',
      dateofbirth: '1990-01-01',
      gender: 'male',
      registration_date: '2024-01-01'
    }
  ];

  for (let i = 0; i < testCombinations.length; i++) {
    const testData = testCombinations[i];
    console.log(`Test ${i + 1}:`, Object.keys(testData));
    
    try {
      const { data, error } = await supabase
        .from('patients')
        .insert(testData)
        .select();

      if (error) {
        console.log(`❌ Error: ${error.message}`);
      } else {
        console.log(`✅ Success! Required columns found.`);
        console.log('Returned data:', data);
        
        // Clean up
        await supabase.from('patients').delete().eq('patient_id', testData.patient_id);
        break; // Stop testing once we find working combination
      }
    } catch (err) {
      console.log(`❌ Exception: ${err.message}`);
    }
  }
}

async function testAdminsMinimal() {
  const testData = {
    admin_id: 'ADM000001',
    profile_id: '33333333-3333-3333-3333-333333333331'
  };

  console.log('Test 1:', Object.keys(testData));
  
  try {
    const { data, error } = await supabase
      .from('admins')
      .insert(testData)
      .select();

    if (error) {
      console.log(`❌ Error: ${error.message}`);
    } else {
      console.log(`✅ Success! Required columns found.`);
      console.log('Returned data:', data);
      
      // Clean up
      await supabase.from('admins').delete().eq('admin_id', testData.admin_id);
    }
  } catch (err) {
    console.log(`❌ Exception: ${err.message}`);
  }
}

// Run the check
if (require.main === module) {
  checkExactColumns()
    .then(() => {
      console.log('\n✅ Column structure check completed');
    })
    .catch((error) => {
      console.error('\n❌ Column structure check failed:', error);
      process.exit(1);
    });
}
