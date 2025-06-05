const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAppointmentsTable() {
  try {
    console.log('🔍 Checking appointments table structure...\n');
    
    // Try to get table structure by attempting to select with different column names
    const possibleColumns = [
      'appointment_id',
      'patient_id', 
      'doctor_id',
      'appointment_datetime',
      'appointment_date',
      'appointment_time',
      'duration_minutes',
      'status',
      'type',
      'notes',
      'symptoms',
      'diagnosis',
      'prescription',
      'created_at',
      'updated_at'
    ];
    
    console.log('📋 Testing which columns exist...');
    
    for (const column of possibleColumns) {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select(column)
          .limit(1);
        
        if (error) {
          console.log(`❌ ${column}: ${error.message}`);
        } else {
          console.log(`✅ ${column}: exists`);
        }
      } catch (e) {
        console.log(`❌ ${column}: ${e.message}`);
      }
    }
    
    console.log('\n📋 Testing relationship queries...');
    
    // Test the relationships mentioned in the error
    const relationships = [
      'doctors!fk_appointments_doctor',
      'doctors!fk_appointments_doctor_id',
      'patients!fk_appointments_patient',
      'patients!fk_appointments_patient_id'
    ];
    
    for (const rel of relationships) {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            appointment_id,
            ${rel} (
              doctor_id,
              full_name
            )
          `)
          .limit(1);
        
        if (error) {
          console.log(`❌ ${rel}: ${error.message}`);
        } else {
          console.log(`✅ ${rel}: works`);
        }
      } catch (e) {
        console.log(`❌ ${rel}: ${e.message}`);
      }
    }
    
    console.log('\n📋 Trying to create a simple appointment...');
    
    // Try to insert with minimal data to see what columns are required
    const testAppointment = {
      appointment_id: 'APT_TEST_' + Date.now(),
      patient_id: 'PAT1749103297539', // Use existing patient
      doctor_id: 'DOC825571' // Use existing doctor
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('appointments')
      .insert(testAppointment)
      .select();
    
    if (insertError) {
      console.log('❌ Insert failed:', insertError.message);
      console.log('Error details:', insertError);
    } else {
      console.log('✅ Insert succeeded:', insertData);
      
      // Clean up - delete the test appointment
      await supabase
        .from('appointments')
        .delete()
        .eq('appointment_id', testAppointment.appointment_id);
    }
    
  } catch (error) {
    console.error('❌ Exception:', error.message);
  }
}

checkAppointmentsTable();
