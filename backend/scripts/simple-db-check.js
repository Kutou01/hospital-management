const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  try {
    console.log('🔍 Checking database structure...\n');
    
    // Check if tables exist and have data
    console.log('📋 Checking table existence and data...');
    
    const { data: appointments, error: aptError } = await supabase
      .from('appointments')
      .select('appointment_id, doctor_id, patient_id')
      .limit(3);
    
    console.log('Appointments table:', aptError ? `Error: ${aptError.message}` : `Found ${appointments?.length || 0} records`);
    if (appointments && appointments.length > 0) {
      console.log('Sample appointment:', appointments[0]);
    }
    
    const { data: doctors, error: docError } = await supabase
      .from('doctors')
      .select('doctor_id, full_name, specialization')
      .limit(3);
    
    console.log('Doctors table:', docError ? `Error: ${docError.message}` : `Found ${doctors?.length || 0} records`);
    if (doctors && doctors.length > 0) {
      console.log('Sample doctor:', doctors[0]);
    }
    
    const { data: patients, error: patError } = await supabase
      .from('patients')
      .select('patient_id, full_name')
      .limit(3);
    
    console.log('Patients table:', patError ? `Error: ${patError.message}` : `Found ${patients?.length || 0} records`);
    if (patients && patients.length > 0) {
      console.log('Sample patient:', patients[0]);
    }
    
    console.log('\n📋 Testing the problematic query...');
    
    // Test the exact query that's failing
    const { data: joinData, error: joinError } = await supabase
      .from('appointments')
      .select(`
        appointment_id,
        patient_id,
        doctor_id,
        appointment_datetime,
        status,
        doctors!appointments_doctor_id_fkey (
          doctor_id,
          full_name,
          specialization
        ),
        patients!appointments_patient_id_fkey (
          patient_id,
          full_name
        )
      `)
      .limit(1);
    
    if (joinError) {
      console.log('❌ Join query failed:', joinError.message);
      console.log('Error details:', joinError);
      
      // Try alternative query without explicit foreign key names
      console.log('\n📋 Trying alternative query...');
      
      const { data: altData, error: altError } = await supabase
        .from('appointments')
        .select(`
          appointment_id,
          patient_id,
          doctor_id,
          appointment_datetime,
          status,
          doctors (
            doctor_id,
            full_name,
            specialization
          ),
          patients (
            patient_id,
            full_name
          )
        `)
        .limit(1);
      
      if (altError) {
        console.log('❌ Alternative query also failed:', altError.message);
      } else {
        console.log('✅ Alternative query succeeded!');
        console.log('Result:', altData);
      }
    } else {
      console.log('✅ Join query succeeded!');
      console.log('Result:', joinData);
    }
    
  } catch (error) {
    console.error('❌ Exception:', error.message);
  }
}

checkDatabase();
