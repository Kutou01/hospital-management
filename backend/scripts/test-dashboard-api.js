const axios = require('axios');

const API_BASE = 'http://localhost:3100/api'; // API Gateway
const DOCTOR_API = 'http://localhost:3002/api'; // Direct Doctor Service

async function testDashboardAPI() {
  console.log('🧪 TESTING DASHBOARD API ENDPOINTS');
  console.log('='.repeat(60));

  try {
    // Step 1: Login to get token
    console.log('🔐 Step 1: Getting auth token...');
    
    const loginResponse = await axios.post(`${API_BASE}/auth/signin`, {
      email: 'doctor@hospital.com',
      password: 'Doctor123.'
    });

    const token = loginResponse.data.token || loginResponse.data.access_token || loginResponse.data.session?.access_token;
    console.log(`✅ Login successful`);
    console.log(`   Response:`, JSON.stringify(loginResponse.data, null, 2));

    if (!token) {
      console.log('❌ No token found in response');
      return;
    }

    console.log(`   Token: ${token.substring(0, 20)}...`);

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Step 2: Test doctor profile endpoint
    console.log('\n👨‍⚕️ Step 2: Testing doctor profile...');
    
    try {
      const profileResponse = await axios.get(`${API_BASE}/doctors/profile`, { headers });
      console.log('✅ Doctor profile via Gateway:');
      console.log(`   Name: ${profileResponse.data.full_name}`);
      console.log(`   ID: ${profileResponse.data.doctor_id}`);
      console.log(`   Rating: ${profileResponse.data.rating}/5`);
    } catch (error) {
      console.log(`❌ Gateway profile error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      
      // Try direct service
      try {
        const directResponse = await axios.get(`${DOCTOR_API}/doctors/profile`, { headers });
        console.log('✅ Doctor profile via Direct Service:');
        console.log(`   Name: ${directResponse.data.full_name}`);
        console.log(`   ID: ${directResponse.data.doctor_id}`);
        console.log(`   Rating: ${directResponse.data.rating}/5`);
      } catch (directError) {
        console.log(`❌ Direct service error: ${directError.response?.status} - ${directError.response?.data?.message || directError.message}`);
      }
    }

    // Step 3: Test dashboard stats
    console.log('\n📊 Step 3: Testing dashboard statistics...');
    
    try {
      const statsResponse = await axios.get(`${API_BASE}/doctors/dashboard/stats`, { headers });
      console.log('✅ Dashboard stats via Gateway:');
      console.log(`   Today's appointments: ${statsResponse.data.todayAppointments}`);
      console.log(`   Total appointments: ${statsResponse.data.totalAppointments}`);
      console.log(`   Total patients: ${statsResponse.data.totalPatients}`);
      console.log(`   Average rating: ${statsResponse.data.averageRating}`);
    } catch (error) {
      console.log(`❌ Gateway stats error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      
      // Try direct service
      try {
        const directStatsResponse = await axios.get(`${DOCTOR_API}/doctors/dashboard/stats`, { headers });
        console.log('✅ Dashboard stats via Direct Service:');
        console.log(`   Today's appointments: ${directStatsResponse.data.todayAppointments}`);
        console.log(`   Total appointments: ${directStatsResponse.data.totalAppointments}`);
        console.log(`   Total patients: ${directStatsResponse.data.totalPatients}`);
        console.log(`   Average rating: ${directStatsResponse.data.averageRating}`);
      } catch (directError) {
        console.log(`❌ Direct service stats error: ${directError.response?.status} - ${directError.response?.data?.message || directError.message}`);
      }
    }

    // Step 4: Test today's appointments
    console.log('\n📅 Step 4: Testing today\'s appointments...');
    
    try {
      const todayResponse = await axios.get(`${API_BASE}/doctors/appointments/today`, { headers });
      console.log('✅ Today\'s appointments via Gateway:');
      console.log(`   Count: ${todayResponse.data.length}`);
      todayResponse.data.forEach((apt, index) => {
        console.log(`   ${index + 1}. ${apt.start_time} - ${apt.patient_name || apt.patient_id}`);
      });
    } catch (error) {
      console.log(`❌ Gateway today error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      
      // Try direct service
      try {
        const directTodayResponse = await axios.get(`${DOCTOR_API}/doctors/appointments/today`, { headers });
        console.log('✅ Today\'s appointments via Direct Service:');
        console.log(`   Count: ${directTodayResponse.data.length}`);
        directTodayResponse.data.forEach((apt, index) => {
          console.log(`   ${index + 1}. ${apt.start_time} - ${apt.patient_name || apt.patient_id}`);
        });
      } catch (directError) {
        console.log(`❌ Direct service today error: ${directError.response?.status} - ${directError.response?.data?.message || directError.message}`);
      }
    }

    // Step 5: Test upcoming appointments
    console.log('\n📅 Step 5: Testing upcoming appointments...');
    
    try {
      const upcomingResponse = await axios.get(`${API_BASE}/doctors/appointments/upcoming`, { headers });
      console.log('✅ Upcoming appointments via Gateway:');
      console.log(`   Count: ${upcomingResponse.data.length}`);
      upcomingResponse.data.slice(0, 3).forEach((apt, index) => {
        console.log(`   ${index + 1}. ${apt.appointment_date} ${apt.start_time} - ${apt.patient_name || apt.patient_id}`);
      });
    } catch (error) {
      console.log(`❌ Gateway upcoming error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      
      // Try direct service
      try {
        const directUpcomingResponse = await axios.get(`${DOCTOR_API}/doctors/appointments/upcoming`, { headers });
        console.log('✅ Upcoming appointments via Direct Service:');
        console.log(`   Count: ${directUpcomingResponse.data.length}`);
        directUpcomingResponse.data.slice(0, 3).forEach((apt, index) => {
          console.log(`   ${index + 1}. ${apt.appointment_date} ${apt.start_time} - ${apt.patient_name || apt.patient_id}`);
        });
      } catch (directError) {
        console.log(`❌ Direct service upcoming error: ${directError.response?.status} - ${directError.response?.data?.message || directError.message}`);
      }
    }

    // Step 6: Test recent activity
    console.log('\n🔄 Step 6: Testing recent activity...');
    
    try {
      const activityResponse = await axios.get(`${API_BASE}/doctors/activity/recent`, { headers });
      console.log('✅ Recent activity via Gateway:');
      console.log(`   Count: ${activityResponse.data.length}`);
      activityResponse.data.slice(0, 3).forEach((activity, index) => {
        console.log(`   ${index + 1}. ${activity.type} - ${activity.description}`);
      });
    } catch (error) {
      console.log(`❌ Gateway activity error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      
      // Try direct service
      try {
        const directActivityResponse = await axios.get(`${DOCTOR_API}/doctors/activity/recent`, { headers });
        console.log('✅ Recent activity via Direct Service:');
        console.log(`   Count: ${directActivityResponse.data.length}`);
        directActivityResponse.data.slice(0, 3).forEach((activity, index) => {
          console.log(`   ${index + 1}. ${activity.type} - ${activity.description}`);
        });
      } catch (directError) {
        console.log(`❌ Direct service activity error: ${directError.response?.status} - ${directError.response?.data?.message || directError.message}`);
      }
    }

    console.log('\n📋 SUMMARY FOR FRONTEND INTEGRATION:');
    console.log('='.repeat(50));
    console.log('🎯 Frontend should call these endpoints:');
    console.log(`   1. POST ${API_BASE}/auth/signin - Get auth token`);
    console.log(`   2. GET ${API_BASE}/doctors/profile - Doctor info`);
    console.log(`   3. GET ${API_BASE}/doctors/dashboard/stats - Dashboard stats`);
    console.log(`   4. GET ${API_BASE}/doctors/appointments/today - Today's appointments`);
    console.log(`   5. GET ${API_BASE}/doctors/appointments/upcoming - Upcoming appointments`);
    console.log(`   6. GET ${API_BASE}/doctors/activity/recent - Recent activity`);
    console.log('');
    console.log('🔧 Headers required:');
    console.log(`   Authorization: Bearer <token>`);
    console.log(`   Content-Type: application/json`);

  } catch (error) {
    console.error('❌ Error testing dashboard API:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

async function main() {
  await testDashboardAPI();
}

main().catch(console.error);
