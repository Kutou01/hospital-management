const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://ciasxktujslgsdgylimv.supabase.co';
// Get service key from environment or use the one from backend services
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpYXN4a3R1anNsZ3NkZ3lsaW12Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzU1NTU2NSwiZXhwIjoyMDYzMTMxNTY1fQ.R2IieQgCFPQ5sgEqPSJmF9uB1hZasJHg5enl2alJpn4';

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabaseStructure() {
  console.log('🔍 Checking Database Structure...\n');

  try {
    // 1. Check doctors table structure
    console.log('📋 DOCTORS TABLE STRUCTURE:');
    console.log('=' .repeat(50));
    
    const { data: doctorsColumns, error: doctorsError } = await supabase
      .rpc('get_table_columns', { table_name: 'doctors' });
    
    if (doctorsError) {
      console.log('❌ Error getting doctors columns:', doctorsError.message);
      
      // Fallback: Try to get sample data to see structure
      const { data: doctorsSample, error: doctorsSampleError } = await supabase
        .from('doctors')
        .select('*')
        .limit(1);
      
      if (doctorsSampleError) {
        console.log('❌ Error getting doctors sample:', doctorsSampleError.message);
      } else {
        console.log('📊 Doctors sample data structure:');
        if (doctorsSample && doctorsSample.length > 0) {
          console.log('Columns:', Object.keys(doctorsSample[0]));
          console.log('Sample:', doctorsSample[0]);
        } else {
          console.log('No doctors data found');
        }
      }
    } else {
      console.log('Doctors columns:', doctorsColumns);
    }

    console.log('\n');

    // 2. Check patients table structure
    console.log('📋 PATIENTS TABLE STRUCTURE:');
    console.log('=' .repeat(50));
    
    const { data: patientsColumns, error: patientsError } = await supabase
      .rpc('get_table_columns', { table_name: 'patients' });
    
    if (patientsError) {
      console.log('❌ Error getting patients columns:', patientsError.message);
      
      // Fallback: Try to get sample data
      const { data: patientsSample, error: patientsSampleError } = await supabase
        .from('patients')
        .select('*')
        .limit(1);
      
      if (patientsSampleError) {
        console.log('❌ Error getting patients sample:', patientsSampleError.message);
      } else {
        console.log('📊 Patients sample data structure:');
        if (patientsSample && patientsSample.length > 0) {
          console.log('Columns:', Object.keys(patientsSample[0]));
          console.log('Sample:', patientsSample[0]);
        } else {
          console.log('No patients data found');
        }
      }
    } else {
      console.log('Patients columns:', patientsColumns);
    }

    console.log('\n');

    // 3. Check profiles table structure
    console.log('📋 PROFILES TABLE STRUCTURE:');
    console.log('=' .repeat(50));
    
    const { data: profilesSample, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.log('❌ Error getting profiles sample:', profilesError.message);
    } else {
      console.log('📊 Profiles sample data structure:');
      if (profilesSample && profilesSample.length > 0) {
        console.log('Columns:', Object.keys(profilesSample[0]));
        console.log('Sample:', profilesSample[0]);
      } else {
        console.log('No profiles data found');
      }
    }

    console.log('\n');

    // 4. Test appointment query that's failing
    console.log('🧪 TESTING APPOINTMENT QUERY:');
    console.log('=' .repeat(50));
    
    // Test the exact query that's failing in appointment service
    const { data: appointmentTest, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        doctors!doctor_id (
          doctor_id,
          specialty,
          profile:profiles!profile_id (
            full_name
          )
        ),
        patients!patient_id (
          patient_id,
          profile:profiles!profile_id (
            full_name
          )
        )
      `)
      .limit(1);
    
    if (appointmentError) {
      console.log('❌ Appointment query error:', appointmentError.message);
      console.log('Error details:', appointmentError);
    } else {
      console.log('✅ Appointment query successful');
      if (appointmentTest && appointmentTest.length > 0) {
        console.log('Sample appointment data:', JSON.stringify(appointmentTest[0], null, 2));
      } else {
        console.log('No appointment data found');
      }
    }

    console.log('\n');

    // 5. Check if doctors have full_name column directly
    console.log('🔍 CHECKING DOCTORS FULL_NAME:');
    console.log('=' .repeat(50));
    
    const { data: doctorsFullName, error: doctorsFullNameError } = await supabase
      .from('doctors')
      .select('doctor_id, full_name, specialty')
      .limit(3);
    
    if (doctorsFullNameError) {
      console.log('❌ Error checking doctors full_name:', doctorsFullNameError.message);
    } else {
      console.log('✅ Doctors with full_name:');
      console.log(doctorsFullName);
    }

    console.log('\n');

    // 6. Check if patients have full_name column directly
    console.log('🔍 CHECKING PATIENTS FULL_NAME:');
    console.log('=' .repeat(50));
    
    const { data: patientsFullName, error: patientsFullNameError } = await supabase
      .from('patients')
      .select('patient_id, full_name')
      .limit(3);
    
    if (patientsFullNameError) {
      console.log('❌ Error checking patients full_name:', patientsFullNameError.message);
      console.log('This confirms patients table does NOT have full_name column');
    } else {
      console.log('✅ Patients with full_name:');
      console.log(patientsFullName);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkDatabaseStructure();
