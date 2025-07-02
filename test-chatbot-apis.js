// Test script for chatbot APIs
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/chatbot';

async function testSpecialtiesAPI() {
  console.log('🧪 Testing Specialties API...');
  try {
    const response = await axios.get(`${BASE_URL}/specialties`);
    const data = response.data;

    console.log('✅ Status:', response.status);
    console.log('✅ Success:', data.success);
    console.log('✅ Data count:', data.data?.length || 0);

    if (data.data && data.data.length > 0) {
      console.log('✅ Sample specialty:', JSON.stringify(data.data[0], null, 2));
    }

    return data;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

async function testDoctorsAPI(specialtyId = 'SPEC040') {
  console.log('\n🧪 Testing Doctors API...');
  try {
    // Test without specialty filter first
    console.log('Testing without specialty filter...');
    const responseAll = await axios.get(`${BASE_URL}/doctors`);
    const dataAll = responseAll.data;
    console.log('✅ All doctors count:', dataAll.data?.length || 0);

    // Test with specialty filter
    console.log(`Testing with specialty filter: ${specialtyId}...`);
    const response = await axios.get(`${BASE_URL}/doctors?specialty_id=${specialtyId}`);
    const data = response.data;

    console.log('✅ Status:', response.status);
    console.log('✅ Success:', data.success);
    console.log('✅ Filtered data count:', data.data?.length || 0);

    if (data.data && data.data.length > 0) {
      console.log('✅ Sample doctor:', JSON.stringify(data.data[0], null, 2));
    } else if (dataAll.data && dataAll.data.length > 0) {
      console.log('✅ Sample doctor (unfiltered):', JSON.stringify(dataAll.data[0], null, 2));
    }

    return data;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

async function testSlotsAPI(doctorId = 'DOC-TEST-001', date = '2025-07-01') {
  console.log('\n🧪 Testing Slots API...');
  try {
    const response = await axios.get(`${BASE_URL}/slots/${doctorId}?date=${date}`);
    const data = response.data;

    console.log('✅ Status:', response.status);
    console.log('✅ Success:', data.success);

    if (data.data && typeof data.data === 'object') {
      const morningCount = data.data.morning?.length || 0;
      const afternoonCount = data.data.afternoon?.length || 0;
      console.log('✅ Morning slots:', morningCount);
      console.log('✅ Afternoon slots:', afternoonCount);
      console.log('✅ Total slots:', morningCount + afternoonCount);

      if (morningCount > 0) {
        console.log('✅ Sample morning slot:', JSON.stringify(data.data.morning[0], null, 2));
      } else if (afternoonCount > 0) {
        console.log('✅ Sample afternoon slot:', JSON.stringify(data.data.afternoon[0], null, 2));
      }
    } else {
      console.log('✅ Data count:', data.data?.length || 0);
      if (data.data && data.data.length > 0) {
        console.log('✅ Sample slot:', JSON.stringify(data.data[0], null, 2));
      }
    }

    return data;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

async function testSessionAPI() {
  console.log('\n🧪 Testing Session API...');
  try {
    const response = await axios.post(`${BASE_URL}/session`, {
      patient_id: 'PAT-TEST-001'
    });
    const data = response.data;

    console.log('✅ Status:', response.status);
    console.log('✅ Success:', data.success);
    console.log('✅ Session ID:', data.data?.session_id);

    return data;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

async function testAppointmentAPI(sessionId = 'CHAT-APPT-TEST-123') {
  console.log('\n🧪 Testing Appointment API...');
  try {
    const response = await axios.post(`${BASE_URL}/appointment/${sessionId}`);
    const data = response.data;

    console.log('✅ Status:', response.status);
    console.log('✅ Success:', data.success);
    console.log('✅ Appointment ID:', data.data?.appointment_id);

    return data;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Chatbot API Tests...\n');
  
  const specialties = await testSpecialtiesAPI();
  const doctors = await testDoctorsAPI();
  const slots = await testSlotsAPI();
  const session = await testSessionAPI();
  const appointment = await testAppointmentAPI();
  
  console.log('\n📊 Test Summary:');
  console.log('- Specialties API:', specialties ? '✅ PASS' : '❌ FAIL');
  console.log('- Doctors API:', doctors ? '✅ PASS' : '❌ FAIL');
  console.log('- Slots API:', slots ? '✅ PASS' : '❌ FAIL');
  console.log('- Session API:', session ? '✅ PASS' : '❌ FAIL');
  console.log('- Appointment API:', appointment ? '✅ PASS' : '❌ FAIL');
}

// Run tests
runAllTests().catch(console.error);
