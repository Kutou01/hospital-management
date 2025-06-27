const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeIdPatterns() {
  console.log('🔍 ANALYZING ID PATTERNS IN DATABASE');
  console.log('='.repeat(50));

  try {
    // Check departments
    console.log('\n📋 DEPARTMENT IDs:');
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('department_id, name')
      .limit(10);

    if (deptError) {
      console.log(`❌ Error: ${deptError.message}`);
    } else {
      departments.forEach(dept => {
        console.log(`   ${dept.department_id} - ${dept.name}`);
      });
    }

    // Check specialties
    console.log('\n🏥 SPECIALTY IDs:');
    const { data: specialties, error: specError } = await supabase
      .from('specialties')
      .select('specialty_id, name')
      .limit(10);

    if (specError) {
      console.log(`❌ Error: ${specError.message}`);
    } else {
      specialties.forEach(spec => {
        console.log(`   ${spec.specialty_id} - ${spec.name}`);
      });
    }

    // Check doctors
    console.log('\n👨‍⚕️ DOCTOR IDs:');
    const { data: doctors, error: docError } = await supabase
      .from('doctors')
      .select('doctor_id, full_name, department_id')
      .limit(10);

    if (docError) {
      console.log(`❌ Error: ${docError.message}`);
    } else {
      doctors.forEach(doc => {
        console.log(`   ${doc.doctor_id} - ${doc.full_name} (dept: ${doc.department_id || 'N/A'})`);
      });
    }

    // Check patients
    console.log('\n🤒 PATIENT IDs:');
    const { data: patients, error: patError } = await supabase
      .from('patients')
      .select('patient_id, full_name')
      .limit(10);

    if (patError) {
      console.log(`❌ Error: ${patError.message}`);
    } else {
      patients.forEach(pat => {
        console.log(`   ${pat.patient_id} - ${pat.full_name}`);
      });
    }

    // Check rooms
    console.log('\n🏠 ROOM IDs:');
    const { data: rooms, error: roomError } = await supabase
      .from('rooms')
      .select('room_id, room_number, department_id')
      .limit(10);

    if (roomError) {
      console.log(`❌ Error: ${roomError.message}`);
    } else {
      rooms.forEach(room => {
        console.log(`   ${room.room_id} - ${room.room_number} (dept: ${room.department_id || 'N/A'})`);
      });
    }

    // Check appointments to see existing patterns
    console.log('\n📅 APPOINTMENT STRUCTURE:');
    const { data: appointments, error: appError } = await supabase
      .from('appointments')
      .select('*')
      .limit(3);

    if (appError) {
      console.log(`❌ Error: ${appError.message}`);
    } else {
      if (appointments.length > 0) {
        console.log('   Columns:', Object.keys(appointments[0]));
        appointments.forEach(app => {
          console.log(`   Appointment ${app.appointment_id}:`);
          console.log(`     Doctor: ${app.doctor_id || 'N/A'}`);
          console.log(`     Patient: ${app.patient_id || 'N/A'}`);
          console.log(`     Room: ${app.room_id || 'N/A'}`);
          console.log(`     Department: ${app.department_id || 'N/A'}`);
        });
      }
    }

    // Analyze patterns
    console.log('\n🔍 PATTERN ANALYSIS:');
    console.log('='.repeat(30));

    if (departments && departments.length > 0) {
      const deptPattern = departments[0].department_id;
      console.log(`📋 Department pattern example: ${deptPattern}`);
    }

    if (specialties && specialties.length > 0) {
      const specPattern = specialties[0].specialty_id;
      console.log(`🏥 Specialty pattern example: ${specPattern}`);
    }

    if (doctors && doctors.length > 0) {
      const docPattern = doctors[0].doctor_id;
      console.log(`👨‍⚕️ Doctor pattern example: ${docPattern}`);
    }

    if (patients && patients.length > 0) {
      const patPattern = patients[0].patient_id;
      console.log(`🤒 Patient pattern example: ${patPattern}`);
    }

    if (rooms && rooms.length > 0) {
      const roomPattern = rooms[0].room_id;
      console.log(`🏠 Room pattern example: ${roomPattern}`);
    }

  } catch (error) {
    console.error('❌ Error analyzing patterns:', error.message);
  }
}

analyzeIdPatterns().catch(console.error);
