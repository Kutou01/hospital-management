const axios = require('axios');

async function testSpecificQuestion() {
  console.log('🧪 Testing specific question: "tôi đau bên hông phải"\n');

  try {
    const response = await axios.post('http://localhost:3020/api/health/chat', {
      message: 'tôi đau bên hông phải',
      conversation_history: []
    }, {
      timeout: 10000
    });

    console.log('✅ Response received:');
    console.log('📊 Success:', response.data.success);
    console.log('🔍 Source:', response.data.data?.response_source || 'unknown');
    console.log('💬 Response:', response.data.data?.ai_response || 'No response');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('💬 Data:', error.response.data);
    }
  }
}

testSpecificQuestion();
