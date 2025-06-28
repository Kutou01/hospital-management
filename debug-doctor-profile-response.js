// Debug Doctor Profile API Response
// Check the actual structure of the API response

const CONFIG = {
  API_GATEWAY: 'http://localhost:3100',
  DOCTOR_CREDENTIALS: {
    email: 'doctor@hospital.com',
    password: 'Doctor123.'
  }
};

async function debugDoctorProfile() {
  console.log('🔍 Debugging Doctor Profile API Response\n');
  
  try {
    // Step 1: Login
    console.log('1️⃣ Logging in...');
    const loginResponse = await fetch(`${CONFIG.API_GATEWAY}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(CONFIG.DOCTOR_CREDENTIALS)
    });
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    console.log('Login response structure:');
    console.log(JSON.stringify(loginData, null, 2));
    
    const token = loginData.access_token;
    const profileId = loginData.user?.id;
    
    // Step 2: Get doctor profile
    console.log('\n2️⃣ Getting doctor profile...');
    const profileResponse = await fetch(`${CONFIG.API_GATEWAY}/api/doctors/by-profile/${profileId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const profileData = await profileResponse.json();
    console.log('✅ Profile response received');
    console.log('Profile response structure:');
    console.log(JSON.stringify(profileData, null, 2));
    
    // Step 3: Test other endpoints with the doctor ID
    if (profileData.success && profileData.data) {
      const doctorId = profileData.data.doctor_id;
      console.log(`\n3️⃣ Testing other endpoints with doctor ID: ${doctorId}`);
      
      // Test appointment stats
      console.log('\n📊 Appointment Stats:');
      const statsResponse = await fetch(`${CONFIG.API_GATEWAY}/api/doctors/${doctorId}/appointment-stats?period=week`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsResponse.json();
      console.log(JSON.stringify(statsData, null, 2));
      
      // Test today's schedule
      console.log('\n📅 Today\'s Schedule:');
      const scheduleResponse = await fetch(`${CONFIG.API_GATEWAY}/api/doctors/${doctorId}/schedule/today`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const scheduleData = await scheduleResponse.json();
      console.log(JSON.stringify(scheduleData, null, 2));
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

debugDoctorProfile();
