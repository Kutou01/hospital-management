const axios = require('axios');

async function testDangerousSymptoms() {
  console.log('🚨 Testing Dangerous Symptoms Detection...\n');

  const dangerousTests = [
    // Viêm ruột thừa
    'tôi bị nôn và đau ở hông phải',
    'nôn mửa và đau bụng bên phải',
    
    // Tim mạch cấp tính
    'đau ngực và khó thở',
    'thắt ngực và thở dốc',
    
    // Đau đầu kéo dài
    'đau đầu 2 tuần nay',
    'tôi bị đau đầu kéo dài 1 tuần',
    
    // Đau đầu + buồn nôn (tăng áp lực nội sọ)
    'đau đầu 2 tuần và buồn nôn',
    'đau đầu lâu rồi kèm nôn mửa',
    
    // Sốt kéo dài
    'sốt 2 tuần nay',
    'tôi bị sốt lâu rồi',
    
    // Triệu chứng đột quỵ
    'đau đầu dữ dội đột ngột',
    'yếu nửa người và nói khó',
    
    // Ho máu
    'ho ra máu',
    'ho có đờm máu',
    
    // Triệu chứng bình thường (không nguy hiểm)
    'đau đầu nhẹ',
    'ho khan'
  ];

  for (const message of dangerousTests) {
    console.log(`\n🔍 Testing: "${message}"`);
    
    try {
      const response = await axios.post('http://localhost:3020/api/health/chat', {
        message: message,
        conversation_history: []
      }, {
        timeout: 8000
      });

      const source = response.data.data?.response_source || 'unknown';
      const responseText = response.data.data?.ai_response || 'No response';
      
      console.log(`   📊 Source: ${source}`);
      
      if (source === 'emergency_detection') {
        console.log('   🚨 EMERGENCY DETECTED! ✅');
        console.log(`   💬 Response: ${responseText.substring(0, 80)}...`);
      } else {
        console.log('   ⚪ Normal response');
        console.log(`   💬 Response: ${responseText.substring(0, 60)}...`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Delay để không spam
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n📊 SUMMARY:');
  console.log('✅ Emergency detected = Chatbot working correctly');
  console.log('❌ No emergency detected = Need to fix logic');
}

testDangerousSymptoms();
