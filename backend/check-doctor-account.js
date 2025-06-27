const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkDoctorAccount() {
  console.log('🔍 Checking doctor@hospital.com account...');
  
  try {
    // 1. Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'doctor@hospital.com')
      .single();
      
    if (profileError) {
      console.log('❌ Profile not found:', profileError.message);
      return;
    }
    
    console.log('✅ Profile found:');
    console.log('   ID:', profile.id);
    console.log('   Name:', profile.full_name);
    console.log('   Role:', profile.role);
    console.log('   Active:', profile.is_active);
    
    // 2. Check if doctor record exists
    const { data: doctor, error: doctorError } = await supabase
      .from('doctors')
      .select('*')
      .eq('profile_id', profile.id)
      .single();
      
    if (doctorError) {
      console.log('❌ Doctor record not found:', doctorError.message);
      console.log('   This explains why the profile page shows no data!');
      
      // Check if there are any doctors with similar email pattern
      const { data: similarDoctors, error: similarError } = await supabase
        .from('doctors')
        .select('doctor_id, full_name, profile_id')
        .limit(5);
        
      if (similarDoctors && similarDoctors.length > 0) {
        console.log('\n📋 Available doctors in database:');
        for (const doc of similarDoctors) {
          // Get profile for each doctor
          const { data: docProfile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', doc.profile_id)
            .single();
            
          console.log(`   - ${doc.doctor_id}: ${doc.full_name} (${docProfile?.email || 'no email'})`);
        }
      }
      
      return;
    }
    
    console.log('\n✅ Doctor record found:');
    console.log('   Doctor ID:', doctor.doctor_id);
    console.log('   Specialty:', doctor.specialty);
    console.log('   Department:', doctor.department_id);
    console.log('   License:', doctor.license_number);
    
    // 3. Check related data
    console.log('\n🔍 Checking related data...');
    
    // Check reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from('doctor_reviews')
      .select('*')
      .eq('doctor_id', doctor.doctor_id);
      
    console.log(`   Reviews: ${reviews?.length || 0} records`);
    
    // Check experiences
    const { data: experiences, error: expError } = await supabase
      .from('doctor_experiences')
      .select('*')
      .eq('doctor_id', doctor.doctor_id);
      
    console.log(`   Experiences: ${experiences?.length || 0} records`);
    
    // Check schedules
    const { data: schedules, error: schedError } = await supabase
      .from('doctor_schedules')
      .select('*')
      .eq('doctor_id', doctor.doctor_id);
      
    console.log(`   Schedules: ${schedules?.length || 0} records`);
    
    console.log('\n🎯 DIAGNOSIS:');
    if (reviews?.length === 0 && experiences?.length === 0 && schedules?.length === 0) {
      console.log('   ⚠️ Doctor record exists but has no related data (reviews, experiences, schedules)');
      console.log('   📝 This is why the profile page appears empty after removing mock data');
    } else {
      console.log('   ✅ Doctor has sufficient data for profile display');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDoctorAccount().catch(console.error);
