// Test Doctor Profile API với authentication thật
// Sử dụng tài khoản: doctor@hospital.com / Doctor123.

const API_BASE_URL = 'http://localhost:3100';

async function loginAndGetToken() {
  console.log('🔐 Logging in with doctor account...');

  try {
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'doctor@hospital.com',
        password: 'Doctor123.'
      })
    });

    console.log(`   Login response status: ${loginResponse.status}`);

    const loginData = await loginResponse.json();
    console.log(`   Login response data:`, JSON.stringify(loginData, null, 2));

    // Check different possible response formats
    if (loginData.success && loginData.data && loginData.data.access_token) {
      console.log('✅ Login successful (format 1)');
      console.log(`   User: ${loginData.data.user.email}`);
      console.log(`   Role: ${loginData.data.user.role}`);
      return {
        token: loginData.data.access_token,
        user: loginData.data.user
      };
    } else if (loginData.access_token) {
      console.log('✅ Login successful (format 2)');
      console.log(`   User: ${loginData.user?.email || 'N/A'}`);
      console.log(`   Role: ${loginData.user?.role || 'N/A'}`);
      return {
        token: loginData.access_token,
        user: loginData.user
      };
    } else if (loginData.token) {
      console.log('✅ Login successful (format 3)');
      console.log(`   User: ${loginData.user?.email || 'N/A'}`);
      return {
        token: loginData.token,
        user: loginData.user
      };
    } else {
      console.log('❌ Login failed:', loginData.message || 'Unknown error');
      console.log('   Full response:', JSON.stringify(loginData, null, 2));
      return null;
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return null;
  }
}

async function testDoctorAPIsWithAuth(token, user) {
  console.log('\n🧪 Testing Doctor APIs with Authentication...\n');
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  try {
    // Test 1: Get doctor by profile ID
    console.log('1️⃣ Testing getByProfileId...');
    const profileId = user.id; // Use logged in user's profile ID
    
    const doctorResponse = await fetch(`${API_BASE_URL}/api/doctors/by-profile/${profileId}`, {
      method: 'GET',
      headers
    });
    
    console.log(`   Response status: ${doctorResponse.status}`);
    const doctorData = await doctorResponse.json();
    
    if (doctorData.success && doctorData.data) {
      console.log('✅ Doctor profile loaded successfully');
      console.log(`   Doctor ID: ${doctorData.data.doctor_id}`);
      console.log(`   Name: ${doctorData.data.full_name}`);
      console.log(`   Specialty: ${doctorData.data.specialty}`);
      console.log(`   License: ${doctorData.data.license_number}`);
      console.log(`   Experience: ${doctorData.data.experience_years} years`);
      
      const doctorId = doctorData.data.doctor_id;
      
      // Test 2: Get appointment stats
      console.log('\n2️⃣ Testing getAppointmentStats...');
      const statsResponse = await fetch(`${API_BASE_URL}/api/doctors/${doctorId}/appointments/stats?period=week`, {
        method: 'GET',
        headers
      });
      
      console.log(`   Stats response status: ${statsResponse.status}`);
      const statsData = await statsResponse.json();
      
      if (statsData.success) {
        console.log('✅ Appointment stats loaded');
        console.log(`   Total appointments: ${statsData.data?.total_appointments || 0}`);
        console.log(`   New patients: ${statsData.data?.new_patients || 0}`);
        console.log(`   Follow-up patients: ${statsData.data?.follow_up_patients || 0}`);
      } else {
        console.log('⚠️ Appointment stats not available:', statsData.message);
      }
      
      // Test 3: Get today's schedule
      console.log('\n3️⃣ Testing getTodaySchedule...');
      const scheduleResponse = await fetch(`${API_BASE_URL}/api/doctors/${doctorId}/schedule/today`, {
        method: 'GET',
        headers
      });
      
      console.log(`   Schedule response status: ${scheduleResponse.status}`);
      const scheduleData = await scheduleResponse.json();
      
      if (scheduleData.success) {
        console.log('✅ Today\'s schedule loaded');
        console.log(`   Schedule items: ${scheduleData.data?.length || 0}`);
        if (scheduleData.data?.length > 0) {
          scheduleData.data.forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.patient_name || 'Patient'} - ${item.time} (${item.appointment_type || 'Appointment'})`);
          });
        } else {
          console.log('   No appointments scheduled for today');
        }
      } else {
        console.log('⚠️ Today\'s schedule not available:', scheduleData.message);
      }
      
      // Test 4: Get reviews
      console.log('\n4️⃣ Testing getReviews...');
      const reviewsResponse = await fetch(`${API_BASE_URL}/api/doctors/${doctorId}/reviews?page=1&limit=4`, {
        method: 'GET',
        headers
      });
      
      console.log(`   Reviews response status: ${reviewsResponse.status}`);
      const reviewsData = await reviewsResponse.json();
      
      if (reviewsData.success) {
        console.log('✅ Reviews loaded');
        console.log(`   Reviews count: ${reviewsData.data?.length || 0}`);
        if (reviewsData.data?.length > 0) {
          reviewsData.data.forEach((review, index) => {
            console.log(`   ${index + 1}. ${review.patient_name} - Rating: ${review.rating}/5`);
            console.log(`      "${review.comment?.substring(0, 50)}..."`);
          });
        } else {
          console.log('   No reviews available yet');
        }
      } else {
        console.log('⚠️ Reviews not available:', reviewsData.message);
      }
      
      // Test 5: Get experiences
      console.log('\n5️⃣ Testing getExperiences...');
      const expResponse = await fetch(`${API_BASE_URL}/api/experiences/doctor/${doctorId}`, {
        method: 'GET',
        headers
      });
      
      console.log(`   Experiences response status: ${expResponse.status}`);
      const expData = await expResponse.json();
      
      if (expData.success) {
        console.log('✅ Experiences loaded');
        console.log(`   Experience records: ${expData.data?.length || 0}`);
        if (expData.data?.length > 0) {
          expData.data.forEach((exp, index) => {
            console.log(`   ${index + 1}. ${exp.position} at ${exp.organization} (${exp.experience_type})`);
          });
        }
      } else {
        console.log('⚠️ Experiences not available:', expData.message);
      }
      
    } else {
      console.log('❌ Failed to load doctor profile:', doctorData.message);
    }
    
  } catch (error) {
    console.error('❌ API Test Error:', error.message);
  }
}

async function testServiceHealth() {
  console.log('\n🏥 Testing Service Health...\n');

  try {
    // Test API Gateway
    console.log('1️⃣ Testing API Gateway...');
    const gatewayResponse = await fetch(`${API_BASE_URL}/health`);
    console.log(`   Gateway status: ${gatewayResponse.status}`);

    // Test Auth Service
    console.log('2️⃣ Testing Auth Service...');
    const authServiceResponse = await fetch(`${API_BASE_URL}/api/auth/health`);
    console.log(`   Auth Service status: ${authServiceResponse.status}`);

    // Test Doctor Service via Gateway (expect 401 without auth)
    console.log('3️⃣ Testing Doctor Service...');
    const doctorServiceResponse = await fetch(`${API_BASE_URL}/api/doctors`);
    console.log(`   Doctor Service status: ${doctorServiceResponse.status}`);

    // Test alternative auth endpoints
    console.log('4️⃣ Testing alternative auth endpoints...');

    const authEndpoints = [
      '/api/auth/login',
      '/auth/login',
      '/login'
    ];

    for (const endpoint of authEndpoints) {
      try {
        const testResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: true })
        });
        console.log(`   ${endpoint}: ${testResponse.status}`);
      } catch (error) {
        console.log(`   ${endpoint}: Error - ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Service Health Check Error:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure API Gateway is running: npm run dev (port 3100)');
    console.log('   2. Make sure Auth Service is running');
    console.log('   3. Make sure Doctor Service is running');
    console.log('   4. Check database connection');
  }
}

async function runTests() {
  console.log('🚀 Starting Doctor Profile API Tests\n');
  
  // Test service health first
  await testServiceHealth();
  
  // Login and get token
  const authData = await loginAndGetToken();
  
  if (authData) {
    // Test APIs with authentication
    await testDoctorAPIsWithAuth(authData.token, authData.user);
  } else {
    console.log('\n❌ Cannot proceed with API tests - login failed');
    console.log('🔧 Check:');
    console.log('   1. Auth Service is running');
    console.log('   2. Database has doctor@hospital.com account');
    console.log('   3. Password is correct: Doctor123.');
  }
  
  console.log('\n🏁 Tests Complete');
}

runTests();
