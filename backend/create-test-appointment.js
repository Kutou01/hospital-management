const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestAppointment() {
  console.log('🏥 CREATING TEST APPOINTMENT');
  console.log('='.repeat(50));

  try {
    // First, get a doctor and patient
    console.log('👨‍⚕️ Getting doctor...');
    const { data: doctors, error: doctorError } = await supabase
      .from('doctors')
      .select('doctor_id, full_name')
      .limit(1);

    if (doctorError || !doctors.length) {
      console.log('❌ No doctors found:', doctorError?.message);
      return;
    }

    console.log('✅ Found doctor:', doctors[0].full_name);

    console.log('🤒 Getting patient...');
    const { data: patients, error: patientError } = await supabase
      .from('patients')
      .select('patient_id, profile_id')
      .limit(1);

    if (patientError || !patients.length) {
      console.log('❌ No patients found:', patientError?.message);
      return;
    }

    console.log('✅ Found patient:', patients[0].patient_id);

    // Create test appointment
    console.log('📅 Creating test appointment...');
    const testAppointment = {
      appointment_id: 'APT-TEST-001',
      doctor_id: doctors[0].doctor_id,
      patient_id: patients[0].patient_id,
      appointment_date: '2025-06-26',
      start_time: '09:00:00',
      end_time: '09:30:00',
      appointment_type: 'consultation',
      status: 'scheduled',
      reason: 'Test appointment for API testing',
      notes: 'This is a test appointment created for API testing purposes',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert(testAppointment)
      .select();

    if (appointmentError) {
      console.log('❌ Error creating appointment:', appointmentError.message);
      console.log('   Details:', appointmentError);
    } else {
      console.log('✅ Test appointment created successfully!');
      console.log('   Appointment ID:', appointment[0].appointment_id);
    }

    // Now test the relationship query
    console.log('\n🔗 Testing relationship query...');
    const { data: appointmentWithDetails, error: queryError } = await supabase
      .from('appointments')
      .select(`
        *,
        doctors!doctor_id (
          doctor_id,
          full_name,
          specialty
        ),
        patients!patient_id (
          patient_id,
          profile:profiles!profile_id (
            full_name
          )
        )
      `)
      .eq('appointment_id', 'APT-TEST-001');

    if (queryError) {
      console.log('❌ Relationship query failed:', queryError.message);
      
      // Try simpler query
      console.log('\n🧪 Trying simpler query without relationships...');
      const { data: simpleQuery, error: simpleError } = await supabase
        .from('appointments')
        .select('*')
        .eq('appointment_id', 'APT-TEST-001');

      if (simpleError) {
        console.log('❌ Simple query also failed:', simpleError.message);
      } else {
        console.log('✅ Simple query works:', simpleQuery[0]);
      }
    } else {
      console.log('✅ Relationship query successful!');
      console.log('   Data:', JSON.stringify(appointmentWithDetails[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTestAppointment().catch(console.error);
