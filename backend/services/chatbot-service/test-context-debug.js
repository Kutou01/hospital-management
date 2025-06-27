const axios = require('axios');

async function testContextDebug() {
  console.log('🔍 Testing Context Analysis Debug...\n');

  try {
    // Test 1: Đau đầu 2 tuần (trong 1 message)
    console.log('=== TEST 1: Đau đầu 2 tuần trong 1 message ===');
    const response1 = await axios.post('http://localhost:3020/api/health/chat', {
      message: 'tôi bị đau đầu 2 tuần nay',
      conversation_history: []
    }, { timeout: 10000 });

    console.log('Response 1:');
    console.log('- Source:', response1.data.data?.response_source);
    console.log('- Response:', response1.data.data?.ai_response?.substring(0, 100) + '...');
    
    if (response1.data.data?.response_source === 'emergency_detection') {
      console.log('✅ EMERGENCY DETECTED in single message!');
    } else {
      console.log('❌ No emergency detection in single message');
    }

    // Test 2: Context conversation
    console.log('\n=== TEST 2: Context conversation ===');
    const response2 = await axios.post('http://localhost:3020/api/health/chat', {
      message: 'kèm buồn nôn',
      conversation_history: ['tôi bị đau đầu', 'đau đầu kéo dài 2 tuần']
    }, { timeout: 10000 });

    console.log('Response 2:');
    console.log('- Source:', response2.data.data?.response_source);
    console.log('- Response:', response2.data.data?.ai_response?.substring(0, 100) + '...');
    
    if (response2.data.data?.response_source === 'emergency_detection') {
      console.log('✅ EMERGENCY DETECTED with context!');
    } else {
      console.log('❌ No emergency detection with context');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testContextDebug();
