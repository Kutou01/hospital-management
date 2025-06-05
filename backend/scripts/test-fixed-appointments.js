const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFixedAppointments() {
  try {
    console.log('🧪 Testing fixed appointments functionality...\n');
    
    // Step 1: Test the corrected query structure
    console.log('📋 Step 1: Testing corrected appointments query...');
    
    const { data: appointmentsData, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        appointment_id,
        patient_id,
        doctor_id,
        appointment_date,
        start_time,
        end_time,
        appointment_type,
        status,
        reason,
        notes,
        diagnosis,
        created_at,
        updated_at,
        doctors!fk_appointments_doctor (
          doctor_id,
          full_name,
          specialization
        ),
        patients!fk_appointments_patient (
          patient_id,
          full_name
        )
      `)
      .limit(5);
    
    if (appointmentsError) {
      console.log('❌ Appointments query failed:', appointmentsError.message);
      console.log('Error details:', appointmentsError);
    } else {
      console.log('✅ Appointments query succeeded!');
      console.log(`Found ${appointmentsData.length} appointments`);
      if (appointmentsData.length > 0) {
        console.log('Sample appointment:', JSON.stringify(appointmentsData[0], null, 2));
      }
    }
    
    // Step 2: Test creating a new appointment
    console.log('\n📋 Step 2: Testing appointment creation...');
    
    const testAppointmentId = 'APT' + Date.now().toString().slice(-6);
    
    const newAppointment = {
      appointment_id: testAppointmentId,
      patient_id: 'PAT1749103297539', // Use existing patient
      doctor_id: 'DOC825571', // Use existing doctor
      appointment_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
      start_time: '09:00:00',
      end_time: '09:30:00',
      appointment_type: 'consultation',
      status: 'scheduled',
      notes: 'Test appointment created by script'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('appointments')
      .insert(newAppointment)
      .select();
    
    if (insertError) {
      console.log('❌ Appointment creation failed:', insertError.message);
      console.log('Error details:', insertError);
    } else {
      console.log('✅ Appointment created successfully!');
      console.log('Created appointment:', insertData[0]);
      
      // Step 3: Test querying the new appointment with relationships
      console.log('\n📋 Step 3: Testing query with relationships on new appointment...');
      
      const { data: relationshipData, error: relationshipError } = await supabase
        .from('appointments')
        .select(`
          appointment_id,
          patient_id,
          doctor_id,
          appointment_date,
          start_time,
          end_time,
          appointment_type,
          status,
          reason,
          notes,
          diagnosis,
          doctors!fk_appointments_doctor (
            doctor_id,
            full_name,
            specialization
          ),
          patients!fk_appointments_patient (
            patient_id,
            full_name
          )
        `)
        .eq('appointment_id', testAppointmentId);
      
      if (relationshipError) {
        console.log('❌ Relationship query failed:', relationshipError.message);
      } else {
        console.log('✅ Relationship query succeeded!');
        console.log('Appointment with relationships:', JSON.stringify(relationshipData[0], null, 2));
      }
      
      // Step 4: Test updating the appointment
      console.log('\n📋 Step 4: Testing appointment update...');
      
      const { data: updateData, error: updateError } = await supabase
        .from('appointments')
        .update({ 
          status: 'confirmed',
          notes: 'Updated by test script'
        })
        .eq('appointment_id', testAppointmentId)
        .select();
      
      if (updateError) {
        console.log('❌ Appointment update failed:', updateError.message);
      } else {
        console.log('✅ Appointment updated successfully!');
        console.log('Updated appointment:', updateData[0]);
      }
      
      // Step 5: Clean up - delete the test appointment
      console.log('\n📋 Step 5: Cleaning up test appointment...');
      
      const { error: deleteError } = await supabase
        .from('appointments')
        .delete()
        .eq('appointment_id', testAppointmentId);
      
      if (deleteError) {
        console.log('❌ Appointment deletion failed:', deleteError.message);
      } else {
        console.log('✅ Test appointment deleted successfully!');
      }
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Exception:', error.message);
  }
}

testFixedAppointments();
