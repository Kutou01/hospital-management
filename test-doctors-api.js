// Test script for doctors API
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testDoctorsAPI() {
  console.log('🧪 Testing Doctors API...');
  
  try {
    console.log('Making request to:', `${BASE_URL}/doctors`);
    const response = await axios.get(`${BASE_URL}/doctors`);
    
    console.log('✅ Status:', response.status);
    console.log('✅ Success:', response.data.success);
    console.log('✅ Data count:', response.data.data?.length || 0);
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('✅ Sample doctor:', JSON.stringify(response.data.data[0], null, 2));
    } else {
      console.log('⚠️ No doctors found in response');
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.status, error.response?.statusText);
    console.error('❌ Error message:', error.message);
    if (error.response?.data) {
      console.error('❌ Error data:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

// Run test
testDoctorsAPI().then(() => {
  console.log('\n🏁 Test completed');
}).catch(console.error);
