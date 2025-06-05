const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixForeignKeys() {
  try {
    console.log('🔧 Fixing foreign key constraints step by step...\n');
    
    // Step 1: Check current constraints
    console.log('📋 Step 1: Checking current foreign key constraints...');
    
    const { data: currentConstraints, error: checkError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, table_name, constraint_type')
      .eq('table_name', 'appointments')
      .eq('constraint_type', 'FOREIGN KEY')
      .eq('table_schema', 'public');
    
    if (checkError) {
      console.log('⚠️ Could not check constraints via API, continuing...');
    } else {
      console.log('Current constraints:', currentConstraints);
    }
    
    // Step 2: Try to create sample data to test relationships
    console.log('\n📋 Step 2: Creating sample data for testing...');
    
    // First, ensure we have a patient
    const { data: existingPatient, error: patientCheckError } = await supabase
      .from('patients')
      .select('patient_id')
      .limit(1);
    
    let patientId = null;
    if (!existingPatient || existingPatient.length === 0) {
      console.log('Creating a test patient...');
      const { data: newPatient, error: patientError } = await supabase
        .from('patients')
        .insert({
          patient_id: 'PAT000001',
          profile_id: '00000000-0000-0000-0000-000000000001',
          full_name: 'Test Patient',
          gender: 'other',
          phone_number: '0123456789',
          address: '{}',
          registration_date: new Date().toISOString().split('T')[0],
          status: 'active'
        })
        .select('patient_id')
        .single();
      
      if (patientError) {
        console.log('⚠️ Could not create test patient:', patientError.message);
      } else {
        patientId = newPatient.patient_id;
        console.log('✅ Created test patient:', patientId);
      }
    } else {
      patientId = existingPatient[0].patient_id;
      console.log('✅ Using existing patient:', patientId);
    }
    
    // Get existing doctor
    const { data: existingDoctor, error: doctorError } = await supabase
      .from('doctors')
      .select('doctor_id')
      .limit(1);
    
    let doctorId = null;
    if (existingDoctor && existingDoctor.length > 0) {
      doctorId = existingDoctor[0].doctor_id;
      console.log('✅ Using existing doctor:', doctorId);
    } else {
      console.log('❌ No doctors found in database');
      return;
    }
    
    // Step 3: Try to create a test appointment
    if (patientId && doctorId) {
      console.log('\n📋 Step 3: Creating test appointment...');
      
      const { data: newAppointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          appointment_id: 'APT000001',
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          duration_minutes: 30,
          status: 'scheduled',
          type: 'consultation',
          notes: 'Test appointment'
        })
        .select();
      
      if (appointmentError) {
        console.log('❌ Could not create test appointment:', appointmentError.message);
        console.log('Error details:', appointmentError);
      } else {
        console.log('✅ Created test appointment:', newAppointment[0].appointment_id);
      }
    }
    
    // Step 4: Test the problematic query
    console.log('\n📋 Step 4: Testing the appointments query...');
    
    const { data: testData, error: testError } = await supabase
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
    
    if (testError) {
      console.log('❌ Test query failed:', testError.message);
      console.log('Error details:', testError);
      
      // Try with explicit foreign key names
      console.log('\n📋 Trying with explicit foreign key names...');
      
      const { data: explicitData, error: explicitError } = await supabase
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
      
      if (explicitError) {
        console.log('❌ Explicit foreign key query also failed:', explicitError.message);
      } else {
        console.log('✅ Explicit foreign key query succeeded!');
        console.log('Result:', explicitData);
      }
    } else {
      console.log('✅ Test query succeeded!');
      console.log('Result:', testData);
    }
    
  } catch (error) {
    console.error('❌ Exception:', error.message);
  }
}

fixForeignKeys();
