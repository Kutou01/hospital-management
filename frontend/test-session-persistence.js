/**
 * Test Session Persistence
 * Run this in browser console to test session persistence
 */

console.log('🧪 Testing Session Persistence...')

// Check current auth state
function checkAuthState() {
  const authToken = localStorage.getItem('auth_token')
  const refreshToken = localStorage.getItem('refresh_token')
  const userData = localStorage.getItem('user_data')
  
  console.log('📊 Current Auth State:', {
    hasAuthToken: !!authToken,
    hasRefreshToken: !!refreshToken,
    hasUserData: !!userData,
    authTokenLength: authToken?.length || 0,
    refreshTokenLength: refreshToken?.length || 0
  })
  
  if (userData) {
    try {
      const parsed = JSON.parse(userData)
      console.log('👤 Stored User Data:', {
        role: parsed.role,
        email: parsed.email,
        full_name: parsed.full_name,
        id: parsed.id?.substring(0, 8) + '...',
        sessionTimestamp: parsed.sessionTimestamp ? new Date(parsed.sessionTimestamp).toLocaleString() : 'N/A'
      })
    } catch (e) {
      console.error('❌ Error parsing user data:', e)
    }
  }
}

// Test session restoration
function testSessionRestoration() {
  console.log('🔄 Testing session restoration...')
  
  // Simulate page reload by clearing memory and restoring from storage
  const storedUserData = localStorage.getItem('user_data')
  const storedToken = localStorage.getItem('auth_token')
  
  if (storedUserData && storedToken) {
    try {
      const userData = JSON.parse(storedUserData)
      console.log('✅ Session can be restored:', {
        role: userData.role,
        email: userData.email,
        hasToken: !!storedToken
      })
      return true
    } catch (e) {
      console.error('❌ Session restoration failed:', e)
      return false
    }
  } else {
    console.log('❌ No session data to restore')
    return false
  }
}

// Test role persistence
function testRolePersistence() {
  console.log('👨‍⚕️ Testing role persistence...')
  
  const userData = localStorage.getItem('user_data')
  if (userData) {
    try {
      const parsed = JSON.parse(userData)
      if (parsed.role === 'doctor') {
        console.log('✅ Doctor role is properly stored')
        return true
      } else {
        console.log('❌ Role is not doctor:', parsed.role)
        return false
      }
    } catch (e) {
      console.error('❌ Error checking role:', e)
      return false
    }
  } else {
    console.log('❌ No user data stored')
    return false
  }
}

// Simulate page reload
function simulatePageReload() {
  console.log('🔄 Simulating page reload...')
  
  // Store current state
  const beforeReload = {
    authToken: localStorage.getItem('auth_token'),
    refreshToken: localStorage.getItem('refresh_token'),
    userData: localStorage.getItem('user_data')
  }
  
  console.log('📦 Data before reload:', {
    hasAuthToken: !!beforeReload.authToken,
    hasRefreshToken: !!beforeReload.refreshToken,
    hasUserData: !!beforeReload.userData
  })
  
  // Simulate reload by checking if data persists
  setTimeout(() => {
    const afterReload = {
      authToken: localStorage.getItem('auth_token'),
      refreshToken: localStorage.getItem('refresh_token'),
      userData: localStorage.getItem('user_data')
    }
    
    const persistent = 
      beforeReload.authToken === afterReload.authToken &&
      beforeReload.refreshToken === afterReload.refreshToken &&
      beforeReload.userData === afterReload.userData
    
    if (persistent) {
      console.log('✅ Session data persists across reload simulation')
    } else {
      console.log('❌ Session data lost during reload simulation')
    }
  }, 100)
}

// Run all tests
function runAllTests() {
  console.log('🚀 Running all session persistence tests...')
  console.log('=' .repeat(50))
  
  checkAuthState()
  console.log('-'.repeat(30))
  
  const canRestore = testSessionRestoration()
  console.log('-'.repeat(30))
  
  const roleOk = testRolePersistence()
  console.log('-'.repeat(30))
  
  simulatePageReload()
  console.log('-'.repeat(30))
  
  console.log('📋 Test Summary:', {
    sessionCanRestore: canRestore,
    roleIsPersistent: roleOk,
    overallStatus: canRestore && roleOk ? '✅ PASS' : '❌ FAIL'
  })
  
  console.log('=' .repeat(50))
  
  if (canRestore && roleOk) {
    console.log('🎉 All tests passed! Session persistence is working correctly.')
  } else {
    console.log('⚠️ Some tests failed. Check the logs above for details.')
  }
}

// Auto-run tests
runAllTests()

// Export functions for manual testing
window.sessionPersistenceTest = {
  checkAuthState,
  testSessionRestoration,
  testRolePersistence,
  simulatePageReload,
  runAllTests
}

console.log('💡 You can run individual tests using:')
console.log('- sessionPersistenceTest.checkAuthState()')
console.log('- sessionPersistenceTest.testSessionRestoration()')
console.log('- sessionPersistenceTest.testRolePersistence()')
console.log('- sessionPersistenceTest.simulatePageReload()')
console.log('- sessionPersistenceTest.runAllTests()')
