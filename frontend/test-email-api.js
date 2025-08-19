// Simple test script to check the email validation API
const testEmailAPI = async () => {
  try {
    console.log('Testing email validation API...');
    
    const response = await fetch('http://localhost:3000/api/auth/check-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Raw response:', text);
    
    try {
      const json = JSON.parse(text);
      console.log('Parsed JSON:', json);
    } catch (e) {
      console.log('Failed to parse as JSON:', e.message);
    }
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
};

testEmailAPI();
