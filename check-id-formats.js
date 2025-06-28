const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://ciasxktujslgsdgylimv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpYXN4a3R1anNsZ3NkZ3lsaW12Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzU1NTU2NSwiZXhwIjoyMDYzMTMxNTY1fQ.R2IieQgCFPQ5sgEqPSJmF9uB1hZasJHg5enl2alJpn4';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkIdFormats() {
  console.log('🔍 Checking ID formats in database...\n');

  try {
    // 1. Check doctor IDs
    console.log('👨‍⚕️ DOCTOR IDs:');
    console.log('=' .repeat(50));
    const { data: doctors, error: doctorsError } = await supabase
      .from('doctors')
      .select('doctor_id, profile:profiles!profile_id(full_name)')
      .limit(5);

    if (doctorsError) {
      console.log('❌ Error fetching doctors:', doctorsError.message);
    } else {
      doctors.forEach(doctor => {
        console.log(`${doctor.doctor_id} - ${doctor.profile?.full_name}`);
      });
    }

    // 2. Check patient IDs
    console.log('\n👥 PATIENT IDs:');
    console.log('=' .repeat(50));
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('patient_id, profile:profiles!profile_id(full_name)')
      .limit(5);

    if (patientsError) {
      console.log('❌ Error fetching patients:', patientsError.message);
    } else {
      patients.forEach(patient => {
        console.log(`${patient.patient_id} - ${patient.profile?.full_name}`);
      });
    }

    // 3. Check appointment IDs
    console.log('\n📅 APPOINTMENT IDs:');
    console.log('=' .repeat(50));
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('appointment_id, appointment_date, status')
      .limit(5);

    if (appointmentsError) {
      console.log('❌ Error fetching appointments:', appointmentsError.message);
    } else {
      appointments.forEach(appointment => {
        console.log(`${appointment.appointment_id} - ${appointment.appointment_date} (${appointment.status})`);
      });
    }

    // 4. Check department IDs
    console.log('\n🏥 DEPARTMENT IDs:');
    console.log('=' .repeat(50));
    const { data: departments, error: departmentsError } = await supabase
      .from('departments')
      .select('department_id, department_name')
      .limit(5);

    if (departmentsError) {
      console.log('❌ Error fetching departments:', departmentsError.message);
    } else {
      departments.forEach(dept => {
        console.log(`${dept.department_id} - ${dept.department_name}`);
      });
    }

    // 5. Analyze patterns
    console.log('\n📊 ID PATTERN ANALYSIS:');
    console.log('=' .repeat(50));
    
    if (doctors && doctors.length > 0) {
      const doctorPattern = doctors[0].doctor_id;
      console.log(`Doctor ID Pattern: ${doctorPattern}`);
      console.log(`  Format: [DEPT]-DOC-[YYYYMM]-[XXX]`);
    }

    if (patients && patients.length > 0) {
      const patientPattern = patients[0].patient_id;
      console.log(`Patient ID Pattern: ${patientPattern}`);
      console.log(`  Format: PAT-[YYYYMM]-[XXX]`);
    }

    if (appointments && appointments.length > 0) {
      const appointmentPattern = appointments[0].appointment_id;
      console.log(`Appointment ID Pattern: ${appointmentPattern}`);
      console.log(`  Format: APT-[CUSTOM]`);
    }

    if (departments && departments.length > 0) {
      const deptPattern = departments[0].department_id;
      console.log(`Department ID Pattern: ${deptPattern}`);
      console.log(`  Format: DEPT[XXX]`);
    }

    // 6. Generate sample IDs based on patterns
    console.log('\n🔧 SUGGESTED ID GENERATORS:');
    console.log('=' .repeat(50));
    
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);

    console.log('Appointment ID suggestions:');
    console.log(`  APT-${year}${month}${day}-${timestamp}`);
    console.log(`  APT-TEST-${timestamp}`);
    console.log(`  APT-${year}${month}-${timestamp}`);

    // 7. Check review table structure
    console.log('\n⭐ REVIEW TABLE STRUCTURE:');
    console.log('=' .repeat(50));
    const { data: reviewSample, error: reviewsError } = await supabase
      .from('doctor_reviews')
      .select('*')
      .limit(1);

    if (reviewsError) {
      console.log('❌ Error fetching reviews:', reviewsError.message);
      console.log('Trying to check table structure...');

      // Try to get any existing reviews to see structure
      const { data: anyReviews, error: anyError } = await supabase
        .from('doctor_reviews')
        .select()
        .limit(1);

      if (anyError) {
        console.log('❌ Table access error:', anyError.message);
      } else {
        console.log('✅ Table exists but might be empty');
        if (anyReviews && anyReviews.length > 0) {
          console.log('Sample review structure:', Object.keys(anyReviews[0]));
        }
      }
    } else {
      if (reviewSample && reviewSample.length > 0) {
        console.log('Review table columns:', Object.keys(reviewSample[0]));
        console.log('Sample review:', reviewSample[0]);
      } else {
        console.log('✅ Table exists but is empty');
      }
    }

    // 8. Check for existing appointment with doctor
    console.log('\n🔍 EXISTING APPOINTMENTS FOR DOCTOR:');
    console.log('=' .repeat(50));

    const { data: doctorAppointments, error: doctorApptError } = await supabase
      .from('appointments')
      .select('*')
      .eq('doctor_id', 'GENE-DOC-202506-006')
      .limit(3);

    if (doctorApptError) {
      console.log('❌ Error fetching doctor appointments:', doctorApptError.message);
    } else {
      console.log(`Found ${doctorAppointments.length} appointments for GENE-DOC-202506-006:`);
      doctorAppointments.forEach(appt => {
        console.log(`  ${appt.appointment_id} - ${appt.appointment_date} (${appt.status})`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkIdFormats();
