const axios = require('axios');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// API endpoints
const API_BASE = 'http://localhost:3100'; // API Gateway
const DOCTOR_SERVICE = 'http://localhost:3002'; // Direct doctor service

async function testDoctorProfileAPI() {
  log('🧪 Testing Doctor Profile API Integration', 'cyan');
  log('=' .repeat(60), 'cyan');

  // Test data - use real doctor ID from database
  const testDoctorId = 'GEN-DOC-202506-767';
  
  try {
    // 1. Test Doctor Profile Endpoint
    log('\n1. Testing Doctor Profile Endpoint...', 'yellow');
    try {
      const profileResponse = await axios.get(`${DOCTOR_SERVICE}/api/doctors/${testDoctorId}/profile`);
      log(`✅ Profile endpoint: ${profileResponse.status}`, 'green');
      log(`   Doctor: ${profileResponse.data?.full_name || 'N/A'}`, 'white');
    } catch (error) {
      log(`❌ Profile endpoint failed: ${error.response?.status || error.message}`, 'red');
    }

    // 2. Test Appointment Stats Endpoint
    log('\n2. Testing Appointment Stats Endpoint...', 'yellow');
    try {
      const statsResponse = await axios.get(`${DOCTOR_SERVICE}/api/doctors/${testDoctorId}/appointment-stats?period=week`);
      log(`✅ Stats endpoint: ${statsResponse.status}`, 'green');
      log(`   Total appointments: ${statsResponse.data?.total || 'N/A'}`, 'white');
    } catch (error) {
      log(`❌ Stats endpoint failed: ${error.response?.status || error.message}`, 'red');
    }

    // 3. Test Today's Schedule Endpoint
    log('\n3. Testing Today\'s Schedule Endpoint...', 'yellow');
    try {
      const today = new Date().toISOString().split('T')[0];
      const scheduleResponse = await axios.get(`${DOCTOR_SERVICE}/api/doctors/${testDoctorId}/schedule?date=${today}`);
      log(`✅ Schedule endpoint: ${scheduleResponse.status}`, 'green');
      log(`   Today's appointments: ${scheduleResponse.data?.length || 0}`, 'white');
    } catch (error) {
      log(`❌ Schedule endpoint failed: ${error.response?.status || error.message}`, 'red');
    }

    // 4. Test Reviews Endpoint
    log('\n4. Testing Reviews Endpoint...', 'yellow');
    try {
      const reviewsResponse = await axios.get(`${DOCTOR_SERVICE}/api/doctors/${testDoctorId}/reviews?page=1&limit=4`);
      log(`✅ Reviews endpoint: ${reviewsResponse.status}`, 'green');
      log(`   Reviews count: ${reviewsResponse.data?.length || 0}`, 'white');
    } catch (error) {
      log(`❌ Reviews endpoint failed: ${error.response?.status || error.message}`, 'red');
    }

    // 5. Test Work Experiences Endpoint
    log('\n5. Testing Work Experiences Endpoint...', 'yellow');
    try {
      const experiencesResponse = await axios.get(`${DOCTOR_SERVICE}/api/doctors/${testDoctorId}/experiences`);
      log(`✅ Experiences endpoint: ${experiencesResponse.status}`, 'green');
      log(`   Experiences count: ${experiencesResponse.data?.length || 0}`, 'white');
    } catch (error) {
      log(`❌ Experiences endpoint failed: ${error.response?.status || error.message}`, 'red');
    }

    // 6. Test API Gateway Integration
    log('\n6. Testing API Gateway Integration...', 'yellow');
    try {
      const gatewayResponse = await axios.get(`${API_BASE}/api/doctors/${testDoctorId}/profile`);
      log(`✅ Gateway endpoint: ${gatewayResponse.status}`, 'green');
      log(`   Gateway routing works`, 'white');
    } catch (error) {
      log(`❌ Gateway endpoint failed: ${error.response?.status || error.message}`, 'red');
    }

    // 7. Test Doctor List for Demo
    log('\n7. Testing Doctor List for Demo...', 'yellow');
    try {
      const listResponse = await axios.get(`${DOCTOR_SERVICE}/api/doctors?page=1&limit=5`);
      log(`✅ Doctor list endpoint: ${listResponse.status}`, 'green');
      log(`   Available doctors: ${listResponse.data?.length || 0}`, 'white');
      
      if (listResponse.data && listResponse.data.length > 0) {
        log('\n   Available test doctors:', 'cyan');
        listResponse.data.slice(0, 3).forEach(doctor => {
          log(`   • ${doctor.doctor_id}: ${doctor.full_name} (${doctor.specialty})`, 'white');
        });
      }
    } catch (error) {
      log(`❌ Doctor list failed: ${error.response?.status || error.message}`, 'red');
    }

  } catch (error) {
    log(`\n❌ General error: ${error.message}`, 'red');
  }

  // Summary
  log('\n📊 API Integration Summary', 'cyan');
  log('=' .repeat(60), 'cyan');
  log('✅ If all endpoints return 200, the frontend will work with real data', 'green');
  log('⚠️  If endpoints fail, the frontend will use mock data as fallback', 'yellow');
  log('🔧 Make sure all services are running: docker compose up -d', 'blue');
  
  log('\n🚀 Next Steps:', 'cyan');
  log('1. Start frontend: npm run dev', 'white');
  log('2. Visit: http://localhost:3000/demo/doctor-profile', 'white');
  log('3. Test with different doctor IDs from the list above', 'white');
}

// Create test doctor data if needed
async function createTestDoctorData() {
  log('\n🔧 Creating Test Doctor Data...', 'cyan');
  
  const testDoctor = {
    full_name: "Dr. Petra Winsbury",
    email: "petra.winsbury@hospital.com",
    phone_number: "0123456789",
    specialty: "General Medicine",
    qualification: "MD, General Medicine",
    license_number: "VN-BS-1234",
    department_id: "DEPT-GEN-001",
    bio: "Experienced general practitioner with 15+ years of experience",
    experience_years: 15,
    consultation_fee: 150000,
    gender: "male",
    languages_spoken: ["Vietnamese", "English"]
  };

  try {
    const response = await axios.post(`${DOCTOR_SERVICE}/api/doctors`, testDoctor);
    log(`✅ Test doctor created: ${response.data?.doctor_id}`, 'green');
    return response.data?.doctor_id;
  } catch (error) {
    log(`⚠️  Test doctor creation failed: ${error.response?.status || error.message}`, 'yellow');
    log('   This is normal if the doctor already exists', 'white');
    return 'DOC-TIM-001'; // Default test ID
  }
}

// Main execution
async function main() {
  try {
    // First create test data
    await createTestDoctorData();
    
    // Then test the APIs
    await testDoctorProfileAPI();
    
  } catch (error) {
    log(`\n❌ Test execution failed: ${error.message}`, 'red');
  }
}

// Run the tests
main();
