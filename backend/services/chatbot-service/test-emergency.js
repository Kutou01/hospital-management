const axios = require('axios');

async function testEmergencyDetection() {
  console.log('🚨 Testing Emergency Detection...\n');

  const emergencyTests = [
    'tôi bị nôn và đau ở hông phải',
    'nôn mửa và đau bụng bên phải', 
    'đau ngực và khó thở',
    'đau đầu bình thường'  // Không phải cấp cứu
  ];

  for (const message of emergencyTests) {
    console.log(`\n🔍 Testing: "${message}"`);
    
    try {
      const response = await axios.post('http://localhost:3020/api/health/chat', {
        message: message,
        conversation_history: []
      }, {
        timeout: 10000
      });

      console.log('✅ Response received:');
      console.log('🔍 Source:', response.data.data?.response_source || 'unknown');
      
      if (response.data.data?.response_source === 'emergency_detection') {
        console.log('🚨 EMERGENCY DETECTED! ✅');
        console.log('💬 Response:', response.data.data?.ai_response?.substring(0, 100) + '...');
      } else {
        console.log('⚪ Normal response');
        console.log('💬 Response:', response.data.data?.ai_response?.substring(0, 80) + '...');
      }
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

testEmergencyDetection();
