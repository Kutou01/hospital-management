const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAppointmentConstraints() {
  console.log('🔍 CHECKING APPOINTMENT TABLE CONSTRAINTS');
  console.log('='.repeat(50));

  try {
    // Test different appointment types to see which ones are allowed
    const testAppointmentTypes = [
      'consultation',
      'follow_up', 
      'emergency',
      'routine_checkup',
      'specialist_consultation',
      'Khám tổng quát',
      'Tái khám',
      'Khám chuyên khoa',
      'Cấp cứu',
      'Khám định kỳ'
    ];

    console.log('🧪 Testing appointment types...');
    
    // Get a doctor and patient for testing
    const { data: doctors } = await supabase
      .from('doctors')
      .select('doctor_id, department_id')
      .limit(1);
    
    const { data: patients } = await supabase
      .from('patients')
      .select('patient_id')
      .limit(1);

    if (!doctors || !patients || doctors.length === 0 || patients.length === 0) {
      console.log('❌ Need at least one doctor and patient for testing');
      return;
    }

    const testDoctor = doctors[0];
    const testPatient = patients[0];

    for (const appointmentType of testAppointmentTypes) {
      const testAppointment = {
        appointment_id: `TEST-APT-202506-${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`,
        doctor_id: testDoctor.doctor_id,
        patient_id: testPatient.patient_id,
        appointment_date: '2025-06-25',
        start_time: '10:00:00',
        end_time: '11:00:00',
        appointment_type: appointmentType,
        status: 'pending',
        reason: 'Test appointment'
      };

      const { data, error } = await supabase
        .from('appointments')
        .insert(testAppointment)
        .select();

      if (error) {
        console.log(`   ❌ ${appointmentType}: ${error.message}`);
      } else {
        console.log(`   ✅ ${appointmentType}: ALLOWED`);
        
        // Clean up test data
        await supabase
          .from('appointments')
          .delete()
          .eq('appointment_id', testAppointment.appointment_id);
      }
    }

    // Test status values
    console.log('\n🧪 Testing appointment status values...');
    
    const testStatuses = [
      'pending',
      'confirmed', 
      'completed',
      'cancelled',
      'no_show',
      'rescheduled'
    ];

    for (const status of testStatuses) {
      const testAppointment = {
        appointment_id: `TEST-APT-202506-${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`,
        doctor_id: testDoctor.doctor_id,
        patient_id: testPatient.patient_id,
        appointment_date: '2025-06-25',
        start_time: '10:00:00',
        end_time: '11:00:00',
        appointment_type: 'consultation', // Use a safe type
        status: status,
        reason: 'Test appointment'
      };

      const { data, error } = await supabase
        .from('appointments')
        .insert(testAppointment)
        .select();

      if (error) {
        console.log(`   ❌ Status ${status}: ${error.message}`);
      } else {
        console.log(`   ✅ Status ${status}: ALLOWED`);
        
        // Clean up test data
        await supabase
          .from('appointments')
          .delete()
          .eq('appointment_id', testAppointment.appointment_id);
      }
    }

    // Check what columns are required
    console.log('\n🧪 Testing required columns...');
    
    const minimalAppointment = {
      appointment_id: `TEST-APT-202506-${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`
    };

    const { data, error } = await supabase
      .from('appointments')
      .insert(minimalAppointment)
      .select();

    if (error) {
      console.log(`   Required columns info: ${error.message}`);
    } else {
      console.log(`   ✅ Minimal appointment created`);
      await supabase
        .from('appointments')
        .delete()
        .eq('appointment_id', minimalAppointment.appointment_id);
    }

    console.log('\n✅ CONSTRAINT CHECK COMPLETED');

  } catch (error) {
    console.error('❌ Error checking constraints:', error.message);
  }
}

async function main() {
  await checkAppointmentConstraints();
}

main().catch(console.error);
