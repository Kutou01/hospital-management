const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAppointmentsColumns() {
  try {
    console.log('🔍 Checking all appointments table columns...\n');
    
    // Test all possible column names to see what exists
    const possibleColumns = [
      'appointment_id',
      'patient_id', 
      'doctor_id',
      'appointment_date',
      'appointment_datetime',
      'start_time',
      'end_time',
      'appointment_time',
      'duration_minutes',
      'duration',
      'status',
      'type',
      'appointment_type',
      'notes',
      'symptoms',
      'diagnosis',
      'prescription',
      'reason',
      'description',
      'priority',
      'room_id',
      'created_at',
      'updated_at',
      'created_by',
      'updated_by'
    ];
    
    console.log('📋 Testing which columns exist...');
    const existingColumns = [];
    
    for (const column of possibleColumns) {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select(column)
          .limit(1);
        
        if (!error) {
          console.log(`✅ ${column}: exists`);
          existingColumns.push(column);
        }
      } catch (e) {
        // Column doesn't exist, skip
      }
    }
    
    console.log('\n📋 All existing columns:', existingColumns);
    
    // Try to insert with all required fields
    console.log('\n📋 Testing insert with start_time...');
    
    const testAppointmentId = 'APT' + Date.now().toString().slice(-6);
    
    const appointmentWithStartTime = {
      appointment_id: testAppointmentId,
      patient_id: 'PAT1749103297539',
      doctor_id: 'DOC825571',
      appointment_date: new Date().toISOString().split('T')[0],
      start_time: '09:00:00', // Add start_time
      status: 'scheduled',
      notes: 'Test appointment with start_time'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('appointments')
      .insert(appointmentWithStartTime)
      .select();
    
    if (insertError) {
      console.log('❌ Insert with start_time failed:', insertError.message);
      console.log('Error details:', insertError);
      
      // Try with end_time as well
      console.log('\n📋 Testing insert with start_time and end_time...');
      
      const appointmentWithBothTimes = {
        ...appointmentWithStartTime,
        appointment_id: testAppointmentId + 'B',
        end_time: '09:30:00' // Add end_time
      };
      
      const { data: insertData2, error: insertError2 } = await supabase
        .from('appointments')
        .insert(appointmentWithBothTimes)
        .select();
      
      if (insertError2) {
        console.log('❌ Insert with both times failed:', insertError2.message);
        
        // Try with duration instead
        console.log('\n📋 Testing insert with duration...');
        
        const appointmentWithDuration = {
          appointment_id: testAppointmentId + 'C',
          patient_id: 'PAT1749103297539',
          doctor_id: 'DOC825571',
          appointment_date: new Date().toISOString().split('T')[0],
          start_time: '09:00:00',
          duration: 30, // Try duration field
          status: 'scheduled',
          notes: 'Test appointment with duration'
        };
        
        const { data: insertData3, error: insertError3 } = await supabase
          .from('appointments')
          .insert(appointmentWithDuration)
          .select();
        
        if (insertError3) {
          console.log('❌ Insert with duration failed:', insertError3.message);
        } else {
          console.log('✅ Insert with duration succeeded!');
          console.log('Created appointment:', insertData3[0]);
          
          // Clean up
          await supabase.from('appointments').delete().eq('appointment_id', appointmentWithDuration.appointment_id);
        }
      } else {
        console.log('✅ Insert with both times succeeded!');
        console.log('Created appointment:', insertData2[0]);
        
        // Clean up
        await supabase.from('appointments').delete().eq('appointment_id', appointmentWithBothTimes.appointment_id);
      }
    } else {
      console.log('✅ Insert with start_time succeeded!');
      console.log('Created appointment:', insertData[0]);
      
      // Clean up
      await supabase.from('appointments').delete().eq('appointment_id', appointmentWithStartTime.appointment_id);
    }
    
  } catch (error) {
    console.error('❌ Exception:', error.message);
  }
}

checkAppointmentsColumns();
