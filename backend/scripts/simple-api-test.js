/**
 * Simple API Test for Dual Authentication System
 * Tests API endpoints directly without complex setup
 *
 * 🚨 SECURITY WARNING:
 * - This script is for DEVELOPMENT/TESTING ONLY
 * - NEVER use these credentials in production
 * - NEVER commit real passwords or sensitive data
 * - See docs/SECURITY_WARNINGS.md for guidelines
 */

const fetch = require('node-fetch')

const BASE_URL = 'http://localhost:3000'

// ⚠️ SECURITY WARNING: NEVER USE THESE VALUES IN PRODUCTION!
// These are test-only values for development/testing purposes only

// Generate random test data to avoid hardcoded values
const generateTestEmail = (prefix) => `${prefix}-${Date.now()}@test-hospital-local.com`
const generateTestPassword = () => `Test${Math.random().toString(36).slice(2)}!`

// Test data - DEVELOPMENT ONLY
const TEST_PATIENT = {
  email: generateTestEmail('patient'),
  password: generateTestPassword(),
  full_name: 'Test Patient User',
  date_of_birth: '1990-01-01',
  gender: 'male',
  accept_tos: true,
  accept_privacy: true,
  captcha_token: 'test-captcha-token'
}

const TEST_INVITATION = {
  email: generateTestEmail('doctor'),
  role: 'doctor',
  department_id: 1,
  expires_in_days: 7,
  message: 'Welcome to our test hospital team!'
}

class SimpleAPITester {
  constructor() {
    this.results = []
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`
    console.log(logMessage)
    
    this.results.push({ timestamp, type, message })
  }

  async testEndpoint(name, url, options = {}) {
    this.log(`Testing ${name}...`)
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        ...options
      })

      const contentType = response.headers.get('content-type')
      let result = null
      
      if (contentType && contentType.includes('application/json')) {
        result = await response.json()
      } else {
        result = await response.text()
      }

      if (response.ok) {
        this.log(`✅ ${name}: ${response.status} ${response.statusText}`)
        if (result && typeof result === 'object' && result.success !== undefined) {
          this.log(`   Response: ${result.success ? 'Success' : 'Failed'} - ${result.message || result.error || ''}`)
        }
      } else {
        this.log(`⚠️ ${name}: ${response.status} ${response.statusText}`)
        if (result && typeof result === 'object' && result.error) {
          this.log(`   Error: ${result.error}`)
        }
      }

      return { response, result }
      
    } catch (error) {
      this.log(`❌ ${name}: ${error.message}`, 'error')
      return { error }
    }
  }

  async testPatientRegistration() {
    this.log('=== Testing Patient Registration ===')
    
    const { response, result, error } = await this.testEndpoint(
      'Patient Registration',
      `${BASE_URL}/api/auth/register`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(TEST_PATIENT)
      }
    )

    if (error) {
      this.log('❌ Patient registration endpoint failed', 'error')
      return false
    }

    if (response && response.ok && result && result.success) {
      this.log('✅ Patient registration working correctly')
      return true
    } else {
      this.log('⚠️ Patient registration has issues')
      return false
    }
  }

  async testInvitationEndpoints() {
    this.log('=== Testing Invitation Endpoints ===')
    
    // Test create invitation (will fail without auth, but endpoint should exist)
    const { response: createResponse } = await this.testEndpoint(
      'Create Invitation',
      `${BASE_URL}/api/admin/invitations`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(TEST_INVITATION)
      }
    )

    // Test verify invitation (will fail without token, but endpoint should exist)
    const { response: verifyResponse } = await this.testEndpoint(
      'Verify Invitation',
      `${BASE_URL}/api/auth/verify-invite`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: 'test-token' })
      }
    )

    // Test accept invitation (will fail without valid token, but endpoint should exist)
    const { response: acceptResponse } = await this.testEndpoint(
      'Accept Invitation',
      `${BASE_URL}/api/auth/accept-invite`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: 'test-token',
          password: 'Test123!',
          accept_tos: true,
          accept_privacy: true
        })
      }
    )

    // Check if endpoints exist (not 404)
    const endpointsExist = [createResponse, verifyResponse, acceptResponse].every(
      response => response && response.status !== 404
    )

    if (endpointsExist) {
      this.log('✅ All invitation endpoints exist')
      return true
    } else {
      this.log('❌ Some invitation endpoints missing')
      return false
    }
  }

  async testFrontendPages() {
    this.log('=== Testing Frontend Pages ===')
    
    // Test patient registration page
    const { response: registerPage } = await this.testEndpoint(
      'Patient Registration Page',
      `${BASE_URL}/register`
    )

    // Test admin invitations page
    const { response: adminPage } = await this.testEndpoint(
      'Admin Invitations Page',
      `${BASE_URL}/admin/invitations`
    )

    // Test accept invite page
    const { response: acceptPage } = await this.testEndpoint(
      'Accept Invite Page',
      `${BASE_URL}/accept-invite`
    )

    const pagesExist = [registerPage, adminPage, acceptPage].every(
      response => response && response.status !== 404
    )

    if (pagesExist) {
      this.log('✅ All frontend pages accessible')
      return true
    } else {
      this.log('❌ Some frontend pages missing')
      return false
    }
  }

  async testServerConnection() {
    this.log('=== Testing Server Connection ===')
    
    const { response, error } = await this.testEndpoint(
      'Server Health Check',
      `${BASE_URL}/api/health`
    )

    if (error) {
      this.log('❌ Cannot connect to server. Is it running?', 'error')
      this.log('   Make sure to run: npm run dev in frontend directory', 'error')
      return false
    }

    if (response && response.ok) {
      this.log('✅ Server is running and accessible')
      return true
    } else {
      this.log('⚠️ Server responding but may have issues')
      return false
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Simple API Tests...')
    
    const results = {
      serverConnection: await this.testServerConnection(),
      frontendPages: await this.testFrontendPages(),
      patientRegistration: await this.testPatientRegistration(),
      invitationEndpoints: await this.testInvitationEndpoints()
    }

    this.log('=== Test Summary ===')
    
    Object.entries(results).forEach(([test, passed]) => {
      this.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`)
    })

    const allPassed = Object.values(results).every(result => result)
    
    if (allPassed) {
      this.log('🎉 All tests passed! Dual authentication system is ready.', 'success')
    } else {
      this.log('⚠️ Some tests failed. Check the logs above for details.', 'warn')
    }

    return results
  }

  generateReport() {
    const summary = {
      total: this.results.length,
      success: this.results.filter(r => r.type === 'success').length,
      errors: this.results.filter(r => r.type === 'error').length,
      warnings: this.results.filter(r => r.type === 'warn').length,
      info: this.results.filter(r => r.type === 'info').length
    }

    console.log('\n' + '='.repeat(40))
    console.log('📊 TEST REPORT')
    console.log('='.repeat(40))
    console.log(`Total: ${summary.total}`)
    console.log(`✅ Success: ${summary.success}`)
    console.log(`❌ Errors: ${summary.errors}`)
    console.log(`⚠️ Warnings: ${summary.warnings}`)
    console.log(`ℹ️ Info: ${summary.info}`)
    console.log('='.repeat(40))

    return summary
  }
}

// Run the test
async function main() {
  const tester = new SimpleAPITester()
  
  try {
    const results = await tester.runAllTests()
    
    if (Object.values(results).every(result => result)) {
      console.log('\n🎯 Dual authentication system is working!')
      console.log('Next steps:')
      console.log('1. Visit http://localhost:3000/register to test patient registration')
      console.log('2. Visit http://localhost:3000/admin/invitations to test staff invitations')
    } else {
      console.log('\n⚠️ Some issues found. Please check the logs above.')
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message)
  } finally {
    tester.generateReport()
  }
}

if (require.main === module) {
  main()
}

module.exports = SimpleAPITester
