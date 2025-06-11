const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findPatientByProfile(profileId) {
  try {
    console.log(`🔍 Searching for patient with profile_id: ${profileId}`);
    
    // First check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();
    
    if (profileError) {
      console.log('❌ Profile not found:', profileError.message);
      return;
    }
    
    console.log('✅ Profile found:');
    console.log(`   Email: ${profile.email}`);
    console.log(`   Full Name: ${profile.full_name}`);
    console.log(`   Role: ${profile.role}`);
    console.log(`   Created: ${profile.created_at}`);
    
    // Now check for patient record
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('profile_id', profileId)
      .single();
    
    if (patientError) {
      if (patientError.code === 'PGRST116') {
        console.log('❌ Patient record NOT FOUND for this profile');
        console.log('   This explains why dashboard is stuck!');
        
        // Offer to create patient record
        console.log('\n🔧 Would you like to create a patient record for this profile?');
        console.log('   Run: node create-missing-patient.js ' + profileId);
      } else {
        console.log('❌ Error checking patient record:', patientError.message);
      }
      return;
    }
    
    console.log('\n✅ Patient record found:');
    console.log(`   Patient ID: ${patient.patient_id}`);
    console.log(`   Gender: ${patient.gender}`);
    console.log(`   Blood Type: ${patient.blood_type}`);
    console.log(`   Address: ${JSON.stringify(patient.address)}`);
    console.log(`   Status: ${patient.status}`);
    console.log(`   Created: ${patient.created_at}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Get profile ID from command line argument
const profileId = process.argv[2];

if (!profileId) {
  console.log('Usage: node find-patient-by-profile.js <profile_id>');
  console.log('Example: node find-patient-by-profile.js e7680242-7e37-41eb-9502-631efa22d509');
  process.exit(1);
}

findPatientByProfile(profileId);
