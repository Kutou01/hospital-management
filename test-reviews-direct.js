const axios = require('axios');

async function testReviewsAPI() {
  try {
    console.log('🧪 Testing Reviews API via API Gateway...');
    
    // Use the token from browser console
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZG9jdG9yQGhvc3BpdGFsLmNvbSIsInJvbGUiOiJkb2N0b3IiLCJkb2N0b3JfaWQiOiJHRU5FLURPQy0yMDI1MDYtMDA2IiwiaWF0IjoxNzM1MTI5NzE5LCJleHAiOjE3MzUxMzMzMTl9.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';
    
    const response = await axios.get('http://localhost:3100/api/doctors/GENE-DOC-202506-006/reviews?page=1&limit=4', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API Gateway Response Status:', response.status);
    console.log('📊 Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data && response.data.data.reviews) {
      console.log('\n🎯 Reviews found:', response.data.data.reviews.length);
      response.data.data.reviews.forEach((review, index) => {
        console.log(`Review ${index + 1}:`, {
          patient: review.patients?.full_name || 'Unknown',
          rating: review.rating,
          comment: review.comment?.substring(0, 50) + '...'
        });
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.status, error.response?.data || error.message);
  }
}

testReviewsAPI();
