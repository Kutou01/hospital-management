/**
 * Direct Login Test
 * Test login API directly with proper headers
 */

async function testLoginDirect() {
  console.log('🧪 Testing Login API Directly...')
  
  const loginData = {
    email: 'doctor@hospital.com',
    password: 'Doctor123!'
  }
  
  try {
    console.log('📤 Sending login request...')
    
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Test-Client/1.0'
      },
      body: JSON.stringify(loginData)
    })
    
    console.log(`📊 Response Status: ${response.status}`)
    console.log(`📊 Response Headers:`, Object.fromEntries(response.headers.entries()))
    
    const responseText = await response.text()
    console.log(`📊 Response Body (first 200 chars):`, responseText.substring(0, 200))
    
    // Try to parse as JSON
    try {
      const result = JSON.parse(responseText)
      console.log('✅ Valid JSON Response:')
      console.log(JSON.stringify(result, null, 2))
      
      if (result.success) {
        console.log('🎉 Login successful!')
        console.log(`👤 User: ${result.user?.email} (${result.user?.role})`)
        console.log(`🔄 Redirect: ${result.redirectTo}`)
      } else {
        console.log('❌ Login failed:', result.error)
      }
      
    } catch (parseError) {
      console.log('❌ Response is not valid JSON')
      console.log('📄 Full response:', responseText)
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message)
  }
}

// Test patient registration
async function testRegistrationDirect() {
  console.log('\n🧪 Testing Registration API Directly...')
  
  const registrationData = {
    email: `test.patient.${Date.now()}@hospital.com`,
    password: 'TestPassword123!',
    full_name: 'Test Patient Direct',
    phone_number: '0987654321',
    gender: 'male',
    date_of_birth: '1990-01-01',
    accept_tos: true,
    accept_privacy: true
  }
  
  try {
    console.log('📤 Sending registration request...')
    
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Test-Client/1.0'
      },
      body: JSON.stringify(registrationData)
    })
    
    console.log(`📊 Response Status: ${response.status}`)
    
    const responseText = await response.text()
    console.log(`📊 Response Body (first 200 chars):`, responseText.substring(0, 200))
    
    // Try to parse as JSON
    try {
      const result = JSON.parse(responseText)
      console.log('✅ Valid JSON Response:')
      console.log(JSON.stringify(result, null, 2))
      
      if (result.success) {
        console.log('🎉 Registration successful!')
        console.log(`👤 User: ${result.user?.email} (${result.user?.role})`)
      } else {
        console.log('❌ Registration failed:', result.error)
      }
      
    } catch (parseError) {
      console.log('❌ Response is not valid JSON')
      console.log('📄 Full response:', responseText)
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message)
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Direct API Tests')
  console.log('=' .repeat(50))
  
  await testLoginDirect()
  await testRegistrationDirect()
  
  console.log('\n' + '=' .repeat(50))
  console.log('✅ Direct API Tests Completed')
}

runTests().catch(console.error)
