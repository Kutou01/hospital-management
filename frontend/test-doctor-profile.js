const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://ciasxktujslgsdgylimv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpYXN4a3R1anNsZ3NkZ3lsaW12Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzU1NTU2NSwiZXhwIjoyMDYzMTMxNTY1fQ.R2IieQgCFPQ5sgEqPSJmF9uB1hZasJHg5enl2alJpn4';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testDoctorProfile() {
  try {
    console.log('🔍 Testing doctor profile API...');
    
    // Test 1: Get all doctors
    console.log('\n1. Getting all doctors...');
    const { data: doctors, error: doctorsError } = await supabase
      .from('doctors')
      .select('doctor_id, full_name, specialization')
      .limit(5);
    
    if (doctorsError) {
      console.error('❌ Error fetching doctors:', doctorsError);
      return;
    }
    
    console.log('✅ Found doctors:', doctors);
    
    if (doctors && doctors.length > 0) {
      const testDoctorId = doctors[0].doctor_id;
      console.log(`\n2. Testing profile for doctor: ${testDoctorId}`);
      
      // Test 2: Get doctor profile
      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select(`
          *,
          departments (
            department_id,
            department_name,
            description,
            location
          )
        `)
        .eq('doctor_id', testDoctorId)
        .single();
      
      if (doctorError) {
        console.error('❌ Error fetching doctor profile:', doctorError);
        return;
      }
      
      console.log('✅ Doctor profile:', doctor);
      
      // Test 3: Get doctor schedules
      console.log('\n3. Getting doctor schedules...');
      const { data: schedules, error: schedulesError } = await supabase
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', testDoctorId);
      
      console.log('📅 Schedules:', schedules || 'No schedules found');
      if (schedulesError) console.log('⚠️ Schedules error:', schedulesError);
      
      // Test 4: Get doctor experiences
      console.log('\n4. Getting doctor experiences...');
      const { data: experiences, error: experiencesError } = await supabase
        .from('doctor_experiences')
        .select('*')
        .eq('doctor_id', testDoctorId);
      
      console.log('💼 Experiences:', experiences || 'No experiences found');
      if (experiencesError) console.log('⚠️ Experiences error:', experiencesError);
      
      // Test 5: Get doctor reviews
      console.log('\n5. Getting doctor reviews...');
      const { data: reviews, error: reviewsError } = await supabase
        .from('doctor_reviews')
        .select('*')
        .eq('doctor_id', testDoctorId);
      
      console.log('⭐ Reviews:', reviews || 'No reviews found');
      if (reviewsError) console.log('⚠️ Reviews error:', reviewsError);
      
      // Test 6: Test frontend API endpoint
      console.log('\n6. Testing frontend API endpoint...');
      try {
        const response = await fetch(`http://localhost:3000/api/doctors/${testDoctorId}/profile`);
        const result = await response.json();
        
        if (response.ok) {
          console.log('✅ Frontend API response:', result);
        } else {
          console.log('❌ Frontend API error:', result);
        }
      } catch (fetchError) {
        console.error('❌ Frontend API fetch error:', fetchError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDoctorProfile();
