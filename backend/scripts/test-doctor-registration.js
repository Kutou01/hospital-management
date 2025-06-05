const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔍 Testing Doctor Registration Fix...');

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment check:');
console.log('- Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('- Service Role Key:', supabaseKey ? '✅ Set' : '❌ Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDoctorTableStructure() {
  console.log('\n📋 Testing doctors table structure...');
  
  try {
    // Test 1: Check if we can query the table structure
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error querying doctors table:', error.message);
      return false;
    }
    
    console.log('✅ Doctors table is accessible');
    
    // Test 2: Try to insert a test doctor record with working_hours
    const testDoctorId = `DOC${Date.now().toString().slice(-6)}`;
    const testProfileId = '00000000-0000-0000-0000-000000000000'; // Dummy UUID
    
    console.log('\n🧪 Testing doctor insertion with working_hours column...');
    
    const { data: insertData, error: insertError } = await supabase
      .from('doctors')
      .insert({
        doctor_id: testDoctorId,
        profile_id: testProfileId,
        full_name: 'Test Doctor',
        specialization: 'General Medicine',
        license_number: 'TEST123',
        qualification: 'MD',
        department_id: 'DEPT001',
        gender: 'other',
        phone_number: '0123456789',
        status: 'active',
        working_hours: '{}', // This should work now
      })
      .select();
    
    if (insertError) {
      console.error('❌ Error inserting test doctor:', insertError.message);
      console.error('Full error:', insertError);
      return false;
    }
    
    console.log('✅ Successfully inserted test doctor with working_hours column');
    console.log('Inserted data:', insertData);
    
    // Clean up: Delete the test record
    const { error: deleteError } = await supabase
      .from('doctors')
      .delete()
      .eq('doctor_id', testDoctorId);
    
    if (deleteError) {
      console.warn('⚠️ Warning: Could not delete test record:', deleteError.message);
    } else {
      console.log('🧹 Test record cleaned up successfully');
    }
    
    return true;
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    return false;
  }
}

async function testTriggerFunction() {
  console.log('\n🔧 Testing trigger function...');
  
  try {
    // Test the RPC function for profile creation
    const { data, error } = await supabase.rpc('create_user_profile', {
      user_id: '11111111-1111-1111-1111-111111111111',
      user_email: 'test@example.com',
      user_name: 'Test Doctor',
      user_phone: '0123456789',
      user_role: 'doctor',
      user_gender: 'other',
      user_specialty: 'General Medicine',
      user_license: 'TEST123',
      user_qualification: 'MD',
      user_department_id: 'DEPT001'
    });
    
    if (error) {
      console.error('❌ RPC function error:', error.message);
      return false;
    }
    
    console.log('✅ RPC function executed successfully');
    console.log('Result:', data);
    
    // Clean up if successful
    if (data && data.success) {
      // Delete the test records
      await supabase.from('doctors').delete().eq('profile_id', '11111111-1111-1111-1111-111111111111');
      await supabase.from('profiles').delete().eq('id', '11111111-1111-1111-1111-111111111111');
      console.log('🧹 Test records cleaned up');
    }
    
    return true;
    
  } catch (err) {
    console.error('❌ Unexpected error in trigger test:', err.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting tests...\n');
  
  const tableTest = await testDoctorTableStructure();
  const triggerTest = await testTriggerFunction();
  
  console.log('\n📊 Test Results:');
  console.log(`- Table Structure Test: ${tableTest ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`- Trigger Function Test: ${triggerTest ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (tableTest && triggerTest) {
    console.log('\n🎉 All tests passed! The schedule column fix is working correctly.');
    console.log('You can now try registering a doctor through the frontend.');
  } else {
    console.log('\n❌ Some tests failed. The issue may not be fully resolved.');
  }
}

runTests().catch(console.error);
