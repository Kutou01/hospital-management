// Comprehensive API Test for Doctor Profile Page
// Tests all API endpoints that the frontend doctor profile page uses

const CONFIG = {
  API_GATEWAY: 'http://localhost:3100',
  DOCTOR_CREDENTIALS: {
    email: 'doctor@hospital.com',
    password: 'Doctor123.'
  }
};

let authToken = null;
let doctorId = null;
let profileId = null;

async function makeRequest(method, url, data = null, useAuth = true) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (useAuth && authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  const options = {
    method,
    headers
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, options);
    const result = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function authenticate() {
  console.log('🔐 Authenticating...');
  
  const result = await makeRequest('POST', `${CONFIG.API_GATEWAY}/api/auth/login`, {
    email: CONFIG.DOCTOR_CREDENTIALS.email,
    password: CONFIG.DOCTOR_CREDENTIALS.password
  }, false);
  
  if (result.success && result.data.access_token) {
    authToken = result.data.access_token;
    profileId = result.data.user?.id;
    doctorId = result.data.user?.doctor_id;
    
    console.log('✅ Authentication successful');
    console.log(`   Profile ID: ${profileId}`);
    console.log(`   Doctor ID: ${doctorId}`);
    console.log(`   Token: ${authToken.substring(0, 20)}...`);
    return true;
  } else {
    console.log('❌ Authentication failed:', result.data?.error || result.error);
    return false;
  }
}

async function testDoctorProfileAPI() {
  console.log('\n👨‍⚕️ Testing Doctor Profile API...');
  
  // Test getByProfileId endpoint
  const profileResult = await makeRequest('GET', `${CONFIG.API_GATEWAY}/api/doctors/by-profile/${profileId}`);
  
  if (profileResult.success) {
    console.log('✅ Doctor profile loaded successfully');
    const doctor = profileResult.data;
    console.log(`   Name: ${doctor?.full_name || 'N/A'}`);
    console.log(`   Specialty: ${doctor?.specialty || 'N/A'}`);
    console.log(`   Department: ${doctor?.department_id || 'N/A'}`);
    console.log(`   Experience: ${doctor?.experience_years || 0} years`);
    console.log(`   Rating: ${doctor?.rating || 0}/5 (${doctor?.total_reviews || 0} reviews)`);
    console.log(`   Status: ${doctor?.status || 'N/A'}`);
    console.log(`   License: ${doctor?.license_number || 'N/A'}`);

    // Update doctorId if we got it from the profile
    if (doctor?.doctor_id) {
      doctorId = doctor.doctor_id;
    }

    return true;
  } else {
    console.log('❌ Doctor profile failed:', profileResult.data?.error || profileResult.error);
    return false;
  }
}

async function testAppointmentStatsAPI() {
  console.log('\n📊 Testing Appointment Statistics API...');
  
  if (!doctorId) {
    console.log('❌ No doctor ID available for stats test');
    return false;
  }
  
  // Test appointment stats endpoint
  const statsResult = await makeRequest('GET', `${CONFIG.API_GATEWAY}/api/doctors/${doctorId}/appointment-stats?period=week`);
  
  if (statsResult.success) {
    console.log('✅ Appointment statistics loaded');
    console.log(`   Total appointments: ${statsResult.data.total_appointments || 0}`);
    console.log(`   New patients: ${statsResult.data.new_patients || 0}`);
    console.log(`   Follow-up patients: ${statsResult.data.follow_up_patients || 0}`);
    console.log(`   Completed: ${statsResult.data.completed || 0}`);
    console.log(`   Cancelled: ${statsResult.data.cancelled || 0}`);
    return true;
  } else {
    console.log('❌ Appointment statistics failed:', statsResult.data?.error || statsResult.error);
    return false;
  }
}

async function testTodayScheduleAPI() {
  console.log('\n📅 Testing Today\'s Schedule API...');
  
  if (!doctorId) {
    console.log('❌ No doctor ID available for schedule test');
    return false;
  }
  
  // Test today's schedule endpoint
  const scheduleResult = await makeRequest('GET', `${CONFIG.API_GATEWAY}/api/doctors/${doctorId}/schedule/today`);
  
  if (scheduleResult.success) {
    console.log('✅ Today\'s schedule loaded');
    const scheduleItems = Array.isArray(scheduleResult.data) ? scheduleResult.data : [];
    console.log(`   Schedule items: ${scheduleItems.length}`);

    if (scheduleItems.length > 0) {
      scheduleItems.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.start_time || 'N/A'} - ${item.end_time || 'N/A'}: ${item.type || 'Appointment'}`);
      });
    } else {
      console.log('   No schedule items for today');
    }

    return true;
  } else {
    console.log('❌ Today\'s schedule failed:', scheduleResult.data?.error || scheduleResult.error);
    return false;
  }
}

async function testReviewsAPI() {
  console.log('\n⭐ Testing Reviews API...');
  
  if (!doctorId) {
    console.log('❌ No doctor ID available for reviews test');
    return false;
  }
  
  // Test reviews endpoint
  const reviewsResult = await makeRequest('GET', `${CONFIG.API_GATEWAY}/api/doctors/${doctorId}/reviews?page=1&limit=4`);
  
  if (reviewsResult.success) {
    console.log('✅ Reviews loaded');
    const reviews = Array.isArray(reviewsResult.data) ? reviewsResult.data : [];
    console.log(`   Reviews count: ${reviews.length}`);

    if (reviews.length > 0) {
      reviews.forEach((review, index) => {
        console.log(`   ${index + 1}. Rating: ${review.rating || 0}/5 - ${review.comment || 'No comment'}`);
      });
    } else {
      console.log('   No reviews available yet');
    }

    return true;
  } else {
    console.log('❌ Reviews failed:', reviewsResult.data?.error || reviewsResult.error);
    return false;
  }
}

async function testExperiencesAPI() {
  console.log('\n🎓 Testing Experiences API...');
  
  if (!doctorId) {
    console.log('❌ No doctor ID available for experiences test');
    return false;
  }
  
  // Test experiences endpoint
  const experiencesResult = await makeRequest('GET', `${CONFIG.API_GATEWAY}/api/doctors/${doctorId}/experiences`);
  
  if (experiencesResult.success) {
    console.log('✅ Experiences loaded');
    const experiences = Array.isArray(experiencesResult.data) ? experiencesResult.data : [];
    console.log(`   Experience records: ${experiences.length}`);

    if (experiences.length > 0) {
      experiences.forEach((exp, index) => {
        console.log(`   ${index + 1}. ${exp.title || 'N/A'} at ${exp.organization || 'Unknown'} (${exp.type || 'N/A'})`);
        console.log(`      Duration: ${exp.start_date || 'N/A'} - ${exp.end_date || 'Present'}`);
      });
    } else {
      console.log('   No experience records found');
    }

    return true;
  } else {
    console.log('❌ Experiences failed:', experiencesResult.data?.error || experiencesResult.error);
    return false;
  }
}

async function testDoctorStatsAPI() {
  console.log('\n📈 Testing Doctor Statistics API...');
  
  if (!doctorId) {
    console.log('❌ No doctor ID available for stats test');
    return false;
  }
  
  // Test doctor stats endpoint
  const statsResult = await makeRequest('GET', `${CONFIG.API_GATEWAY}/api/doctors/${doctorId}/stats`);
  
  if (statsResult.success) {
    console.log('✅ Doctor statistics loaded');
    console.log(`   Total patients: ${statsResult.data.total_patients || 0}`);
    console.log(`   Total appointments: ${statsResult.data.total_appointments || 0}`);
    console.log(`   Success rate: ${statsResult.data.success_rate || 0}%`);
    console.log(`   Years experience: ${statsResult.data.years_experience || 0}`);
    return true;
  } else {
    console.log('❌ Doctor statistics failed:', statsResult.data?.error || statsResult.error);
    return false;
  }
}

async function testWeeklyScheduleAPI() {
  console.log('\n📆 Testing Weekly Schedule API...');
  
  if (!doctorId) {
    console.log('❌ No doctor ID available for weekly schedule test');
    return false;
  }
  
  // Test weekly schedule endpoint
  const scheduleResult = await makeRequest('GET', `${CONFIG.API_GATEWAY}/api/doctors/${doctorId}/schedule/weekly`);
  
  if (scheduleResult.success) {
    console.log('✅ Weekly schedule loaded');
    const schedule = Array.isArray(scheduleResult.data) ? scheduleResult.data : [];
    console.log(`   Weekly schedule items: ${schedule.length}`);

    if (schedule.length > 0) {
      schedule.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.day_of_week || 'N/A'}: ${item.start_time || 'N/A'} - ${item.end_time || 'N/A'}`);
      });
    } else {
      console.log('   No weekly schedule items found');
    }

    return true;
  } else {
    console.log('❌ Weekly schedule failed:', scheduleResult.data?.error || scheduleResult.error);
    return false;
  }
}

async function runComprehensiveTests() {
  console.log('🧪 Starting Comprehensive Doctor Profile API Tests\n');
  
  const results = {
    authentication: false,
    doctorProfile: false,
    appointmentStats: false,
    todaySchedule: false,
    reviews: false,
    experiences: false,
    doctorStats: false,
    weeklySchedule: false
  };
  
  try {
    // Step 1: Authenticate
    results.authentication = await authenticate();
    
    if (results.authentication) {
      // Step 2: Test all API endpoints
      results.doctorProfile = await testDoctorProfileAPI();
      results.appointmentStats = await testAppointmentStatsAPI();
      results.todaySchedule = await testTodayScheduleAPI();
      results.reviews = await testReviewsAPI();
      results.experiences = await testExperiencesAPI();
      results.doctorStats = await testDoctorStatsAPI();
      results.weeklySchedule = await testWeeklyScheduleAPI();
    }
    
    // Summary
    console.log('\n📋 Test Results Summary:');
    console.log('='.repeat(40));
    
    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${test.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
    });
    
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log('\n📊 Overall Results:');
    console.log(`   Passed: ${passedTests}/${totalTests} tests`);
    console.log(`   Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    if (passedTests === totalTests) {
      console.log('\n🎉 All tests passed! The doctor profile page APIs are working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Check the API endpoints and authentication.');
    }
    
  } catch (error) {
    console.log(`\n❌ Test execution failed: ${error.message}`);
  }
  
  console.log('\n🏁 Tests Complete');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runComprehensiveTests();
}

module.exports = { runComprehensiveTests };
