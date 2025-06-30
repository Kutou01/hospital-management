// Test script to check doctor profile API response structure
const axios = require('axios');

const CONFIG = {
  API_GATEWAY: 'http://localhost:3100',
  DOCTOR_CREDENTIALS: {
    email: 'doctor@hospital.com',
    password: 'Doctor123.'
  },
  KNOWN_DOCTOR: {
    profile_id: '5bdcbd80-f344-40b7-a46b-3760ca487693',
    doctor_id: 'GENE-DOC-202506-006'
  }
};

async function testDoctorProfileData() {
  try {
    console.log('🔍 Testing Doctor Profile API Response Structure...\n');

    // Step 1: Login to get token
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${CONFIG.API_GATEWAY}/api/auth/login`, CONFIG.DOCTOR_CREDENTIALS);
    const token = loginResponse.data.access_token;
    console.log('✅ Login successful\n');

    // Step 2: Test getProfile API (used by DoctorProfilePage component)
    console.log('2️⃣ Testing getProfile API...');
    try {
      const profileResponse = await axios.get(
        `${CONFIG.API_GATEWAY}/api/doctors/${CONFIG.KNOWN_DOCTOR.doctor_id}/profile`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      console.log('✅ Profile API Response Structure:');
      console.log(JSON.stringify(profileResponse.data, null, 2));
      
      // Check if data is nested under 'doctor' property
      if (profileResponse.data.data && profileResponse.data.data.doctor) {
        console.log('\n📋 Doctor data is nested under data.doctor:');
        console.log('- Full Name:', profileResponse.data.data.doctor.full_name);
        console.log('- Doctor ID:', profileResponse.data.data.doctor.doctor_id);
        console.log('- Specialty:', profileResponse.data.data.doctor.specialty);
        console.log('- Email:', profileResponse.data.data.doctor.email);
        console.log('- Phone:', profileResponse.data.data.doctor.phone_number);
        console.log('- Bio:', profileResponse.data.data.doctor.bio);
      } else if (profileResponse.data.data) {
        console.log('\n📋 Doctor data is directly under data:');
        console.log('- Full Name:', profileResponse.data.data.full_name);
        console.log('- Doctor ID:', profileResponse.data.data.doctor_id);
        console.log('- Specialty:', profileResponse.data.data.specialty);
      }
      
    } catch (error) {
      console.log('❌ Profile API Error:', error.response?.data || error.message);
    }

    // Step 3: Test getByProfileId API (used by doctors/profile page)
    console.log('\n3️⃣ Testing getByProfileId API...');
    try {
      const byProfileResponse = await axios.get(
        `${CONFIG.API_GATEWAY}/api/doctors/by-profile/${CONFIG.KNOWN_DOCTOR.profile_id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      console.log('✅ ByProfile API Response Structure:');
      console.log(JSON.stringify(byProfileResponse.data, null, 2));
      
    } catch (error) {
      console.log('❌ ByProfile API Error:', error.response?.data || error.message);
    }

    // Step 4: Test appointment stats API
    console.log('\n4️⃣ Testing appointment stats API...');
    try {
      const statsResponse = await axios.get(
        `${CONFIG.API_GATEWAY}/api/doctors/${CONFIG.KNOWN_DOCTOR.doctor_id}/appointment-stats?period=week`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      console.log('✅ Stats API Response:');
      console.log(JSON.stringify(statsResponse.data, null, 2));
      
    } catch (error) {
      console.log('❌ Stats API Error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testDoctorProfileData();
