/**
 * 🧪 TEST DATABASE INTEGRATION
 * Test xem chatbot có sử dụng database Supabase không
 */

const axios = require('axios');

const CHATBOT_API_URL = 'http://localhost:3020';

async function testDatabaseIntegration() {
  console.log('🧪 TESTING DATABASE INTEGRATION...\n');

  try {
    // Test với các câu hỏi có trong training data
    const testQuestions = [
      'tiểu đường',      // Có trong training data
      'tuyến giáp',      // Có trong training data  
      'khám tim mạch',   // Có trong training data
      'khó thở',         // Có trong training data
      'đau đầu',         // Không có trong training data
      'đau bụng'         // Không có trong training data
    ];

    for (const question of testQuestions) {
      console.log(`\n🔍 Testing: "${question}"`);
      
      try {
        const response = await axios.post(`${CHATBOT_API_URL}/api/health/chat`, {
          message: question,
          conversation_history: []
        });

        if (response.data.success) {
          const source = response.data.data.response_source || 'unknown';
          const responseText = response.data.data.ai_response || 'No response';
          
          console.log(`   ✅ Success! Source: ${source}`);
          console.log(`   📝 Response: ${responseText.substring(0, 80)}...`);
          
          if (source === 'training_database' || source === 'database') {
            console.log(`   🎯 USING DATABASE! ✅`);
          } else if (source === 'doctors_database') {
            console.log(`   👨‍⚕️ USING DOCTORS DATABASE! ✅`);
          } else {
            console.log(`   🤖 Using Gemini AI (no database match)`);
          }
        } else {
          console.log(`   ❌ Failed: ${response.data.message}`);
        }
      } catch (error) {
        console.log(`   💥 Error: ${error.message}`);
      }
      
      // Delay để không spam
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n📊 SUMMARY:');
    console.log('✅ If you see "USING DATABASE!" - chatbot is working with Supabase');
    console.log('⚠️  If all responses are "Using Gemini AI" - database integration failed');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Chạy test
testDatabaseIntegration();
