const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableRelationships() {
  console.log('🔍 CHECKING TABLE RELATIONSHIPS AND ID GENERATION');
  console.log('='.repeat(60));

  try {
    // Check profiles table structure and constraints
    console.log('📋 PROFILES TABLE ANALYSIS');
    console.log('='.repeat(40));
    
    // Try to insert a minimal profile to see what's required
    console.log('🧪 Testing profile creation...');
    
    const testProfile = {
      email: 'test-temp@hospital.com',
      role: 'patient',
      full_name: 'Test User'
    };

    const { data: profileResult, error: profileError } = await supabase
      .from('profiles')
      .insert(testProfile)
      .select();

    if (profileError) {
      console.log('❌ Profile creation failed:', profileError.message);
      console.log('   This tells us about required fields and constraints');
    } else {
      console.log('✅ Profile created successfully:', profileResult[0]);
      
      // Clean up test data
      await supabase
        .from('profiles')
        .delete()
        .eq('email', 'test-temp@hospital.com');
      console.log('🧹 Test profile cleaned up');
    }

    // Check existing profiles to understand ID pattern
    console.log('\n📊 EXISTING PROFILES ANALYSIS');
    console.log('='.repeat(40));
    
    const { data: existingProfiles, error: existingError } = await supabase
      .from('profiles')
      .select('id, email, role, full_name, created_at')
      .limit(5);

    if (existingError) {
      console.log('❌ Error fetching existing profiles:', existingError.message);
    } else {
      console.log('📋 Sample existing profiles:');
      existingProfiles.forEach((profile, index) => {
        console.log(`   ${index + 1}. ID: ${profile.id}`);
        console.log(`      Email: ${profile.email}`);
        console.log(`      Role: ${profile.role}`);
        console.log(`      Name: ${profile.full_name}`);
        console.log(`      Created: ${profile.created_at}`);
        console.log('');
      });
    }

    // Check doctors table and its relationship to profiles
    console.log('👨‍⚕️ DOCTORS TABLE ANALYSIS');
    console.log('='.repeat(40));
    
    const { data: existingDoctors, error: doctorError } = await supabase
      .from('doctors')
      .select(`
        doctor_id,
        profile_id,
        full_name,
        specialty,
        department_id,
        license_number,
        status
      `)
      .limit(3);

    if (doctorError) {
      console.log('❌ Error fetching doctors:', doctorError.message);
    } else {
      console.log('📋 Existing doctors:');
      existingDoctors.forEach((doctor, index) => {
        console.log(`   ${index + 1}. Doctor ID: ${doctor.doctor_id}`);
        console.log(`      Profile ID: ${doctor.profile_id}`);
        console.log(`      Name: ${doctor.full_name}`);
        console.log(`      Specialty: ${doctor.specialty}`);
        console.log(`      Department: ${doctor.department_id}`);
        console.log(`      License: ${doctor.license_number}`);
        console.log('');
      });
    }

    // Check patients table
    console.log('🤒 PATIENTS TABLE ANALYSIS');
    console.log('='.repeat(40));
    
    const { data: existingPatients, error: patientError } = await supabase
      .from('patients')
      .select(`
        patient_id,
        profile_id,
        full_name,
        gender,
        status
      `)
      .limit(3);

    if (patientError) {
      console.log('❌ Error fetching patients:', patientError.message);
    } else {
      console.log('📋 Existing patients:');
      existingPatients.forEach((patient, index) => {
        console.log(`   ${index + 1}. Patient ID: ${patient.patient_id}`);
        console.log(`      Profile ID: ${patient.profile_id}`);
        console.log(`      Name: ${patient.full_name}`);
        console.log(`      Gender: ${patient.gender}`);
        console.log('');
      });
    }

    // Test ID generation patterns
    console.log('🔧 ID GENERATION TESTING');
    console.log('='.repeat(40));
    
    // Check if there are any database functions for ID generation
    console.log('🧪 Testing UUID generation...');
    
    const { data: uuidTest, error: uuidError } = await supabase
      .rpc('gen_random_uuid')
      .single();

    if (uuidError) {
      console.log('❌ UUID generation failed:', uuidError.message);
    } else {
      console.log('✅ UUID generation works:', uuidTest);
    }

    // Check if profiles table has auto-generated IDs
    console.log('\n🧪 Testing profile creation with UUID...');
    
    const testProfileWithUUID = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'test-uuid-' + Date.now(),
      email: 'test-uuid@hospital.com',
      role: 'patient',
      full_name: 'Test UUID User',
      phone_number: '0900000000',
      date_of_birth: '1990-01-01',
      is_active: true,
      email_verified: false,
      phone_verified: false,
      login_count: 0,
      two_factor_enabled: false
    };

    const { data: uuidProfileResult, error: uuidProfileError } = await supabase
      .from('profiles')
      .insert(testProfileWithUUID)
      .select();

    if (uuidProfileError) {
      console.log('❌ Profile with UUID creation failed:', uuidProfileError.message);
    } else {
      console.log('✅ Profile with UUID created:', uuidProfileResult[0]);
      
      // Clean up
      await supabase
        .from('profiles')
        .delete()
        .eq('email', 'test-uuid@hospital.com');
      console.log('🧹 Test UUID profile cleaned up');
    }

    // Check appointments table structure
    console.log('\n📅 APPOINTMENTS TABLE ANALYSIS');
    console.log('='.repeat(40));
    
    const { data: appointmentSample, error: appointmentError } = await supabase
      .from('appointments')
      .select('*')
      .limit(1);

    if (appointmentError) {
      console.log('❌ Error checking appointments:', appointmentError.message);
    } else if (appointmentSample && appointmentSample.length > 0) {
      console.log('📋 Appointment structure:');
      console.log(JSON.stringify(appointmentSample[0], null, 2));
    } else {
      console.log('📋 Appointments table is empty');
      
      // Try to understand appointment structure by attempting insert
      const { error: appointmentInsertError } = await supabase
        .from('appointments')
        .insert({})
        .select();
      
      if (appointmentInsertError) {
        console.log('📝 Appointment requirements:', appointmentInsertError.message);
      }
    }

    console.log('\n✅ RELATIONSHIP ANALYSIS COMPLETED');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error during analysis:', error.message);
  }
}

async function main() {
  await checkTableRelationships();
}

main().catch(console.error);
