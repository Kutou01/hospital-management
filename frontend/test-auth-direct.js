// Using built-in fetch (Node.js 18+)

async function testAuthService() {
  console.log('🔍 Testing Auth Service Direct Connection...\n');

  // Test 1: Health check
  try {
    console.log('1. Testing Health Check...');
    const healthResponse = await fetch('http://localhost:3001/api/health');
    console.log('Health Status:', healthResponse.status);
    console.log('Health Headers:', Object.fromEntries(healthResponse.headers.entries()));

    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health Check:', healthData);
    } else {
      console.log('❌ Health Check Failed');
    }
  } catch (error) {
    console.log('❌ Health Check Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Registration
  try {
    console.log('2. Testing Registration...');
    const registrationData = {
      email: 'test123@gmail.com',
      password: 'password123',
      full_name: 'Test User',
      role: 'patient',
      phone_number: '0123456789',
      profile_data: {
        date_of_birth: '1990-01-01',
        gender: 'male'
      }
    };

    console.log('Registration URL: http://localhost:3001/api/auth/register');
    console.log('Registration Data:', registrationData);

    const regResponse = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registrationData)
    });

    console.log('Registration Status:', regResponse.status);
    console.log('Registration Headers:', Object.fromEntries(regResponse.headers.entries()));

    const regData = await regResponse.json();
    console.log('Registration Response:', regData);

    if (regResponse.ok) {
      console.log('✅ Registration Success');
    } else {
      console.log('❌ Registration Failed');
    }

  } catch (error) {
    console.log('❌ Registration Error:', error.message);
  }
}

testAuthService().catch(console.error);
