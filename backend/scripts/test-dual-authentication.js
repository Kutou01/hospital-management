/**
 * Comprehensive Test Script for Dual Authentication System
 * Tests both Patient Registration and Staff Invitation flows
 *
 * 🚨 SECURITY WARNING:
 * - This script is for DEVELOPMENT/TESTING ONLY
 * - NEVER use these credentials in production
 * - NEVER commit real passwords or sensitive data
 * - Use environment variables for any real credentials
 * - See docs/SECURITY_WARNINGS.md for guidelines
 */

const { createClient } = require('@supabase/supabase-js')
const fetch = require('node-fetch')
const path = require('path')

// Try to load environment variables from multiple locations
require('dotenv').config({ path: path.join(__dirname, '../../frontend/.env.local') })
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') })

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Debug environment variables
console.log('Environment check:')
console.log('SUPABASE_URL:', SUPABASE_URL ? '✅ Found' : '❌ Missing')
console.log('SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY ? '✅ Found' : '❌ Missing')
console.log('BASE_URL:', BASE_URL)

// ⚠️ SECURITY WARNING: NEVER USE THESE VALUES IN PRODUCTION!
// These are test-only values for development/testing purposes only

// Generate random test data to avoid hardcoded values
const generateTestEmail = (prefix) => `${prefix}-${Date.now()}@test-hospital-local.com`
const generateTestPassword = () => `Test${Math.random().toString(36).slice(2)}!`

// Test data - DEVELOPMENT ONLY
const TEST_PATIENT = {
  email: process.env.TEST_PATIENT_EMAIL || generateTestEmail('patient'),
  password: process.env.TEST_PATIENT_PASSWORD || generateTestPassword(),
  full_name: 'Test Patient User',
  date_of_birth: '1990-01-01',
  gender: 'male',
  accept_tos: true,
  accept_privacy: true,
  captcha_token: 'test-captcha-token' // Mock token for testing
}

const TEST_STAFF_INVITATION = {
  email: process.env.TEST_STAFF_EMAIL || generateTestEmail('doctor'),
  role: 'doctor',
  department_id: 1,
  expires_in_days: 7,
  message: 'Welcome to our test hospital team!'
}

const TEST_ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL || generateTestEmail('admin'),
  password: process.env.TEST_ADMIN_PASSWORD || generateTestPassword(),
  role: 'admin'
}

class DualAuthTester {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    this.adminToken = null
    this.testResults = []
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`
    console.log(logMessage)
    
    this.testResults.push({
      timestamp,
      type,
      message
    })
  }

  async setupTestEnvironment() {
    this.log('Setting up test environment...')
    
    try {
      // Ensure admin user exists
      await this.setupTestAdmin()
      
      // Clean up any existing test data
      await this.cleanupTestData()
      
      this.log('Test environment ready')
    } catch (error) {
      this.log(`Setup failed: ${error.message}`, 'error')
      throw error
    }
  }

  async setupTestAdmin() {
    this.log('Setting up test admin user...')
    
    try {
      // Check if admin already exists
      const { data: existingUser } = await this.supabase.auth.admin.getUserByEmail(TEST_ADMIN.email)
      
      if (!existingUser.user) {
        // Create admin user
        const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
          email: TEST_ADMIN.email,
          password: TEST_ADMIN.password,
          email_confirm: true,
          user_metadata: { role: TEST_ADMIN.role },
          app_metadata: { role: TEST_ADMIN.role }
        })

        if (authError) throw new Error(`Failed to create admin: ${authError.message}`)

        // Create profile
        const { error: profileError } = await this.supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: TEST_ADMIN.email,
            full_name: 'Test Admin',
            role: TEST_ADMIN.role,
            is_active: true,
            email_verified: true,
            onboarding_completed: true
          })

        if (profileError) throw new Error(`Failed to create admin profile: ${profileError.message}`)
      }

      // Sign in as admin
      const { data: signInData, error: signInError } = await this.supabase.auth.signInWithPassword({
        email: TEST_ADMIN.email,
        password: TEST_ADMIN.password
      })

      if (signInError) throw new Error(`Admin sign in failed: ${signInError.message}`)

      this.adminToken = signInData.session.access_token
      this.log('Admin setup completed')
      
    } catch (error) {
      this.log(`Admin setup failed: ${error.message}`, 'error')
      throw error
    }
  }

  async testPatientRegistration() {
    this.log('=== Testing Patient Registration Flow ===')
    
    try {
      this.log('Testing patient self-registration...')
      
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(TEST_PATIENT)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${result.error || 'Unknown error'}`)
      }

      if (!result.success) {
        throw new Error(result.error || 'Patient registration failed')
      }

      this.patientData = result.data
      this.log(`✅ Patient registration successful: ${result.data.user_id}`)
      this.log(`Patient email: ${result.data.email}`)
      
      // Verify patient profile was created
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('email', TEST_PATIENT.email)
        .single()

      if (profileError || !profile) {
        throw new Error('Patient profile not found in database')
      }

      this.log(`✅ Patient profile verified: Role=${profile.role}, Active=${profile.is_active}`)
      
      return result.data
      
    } catch (error) {
      this.log(`❌ Patient registration failed: ${error.message}`, 'error')
      throw error
    }
  }

  async testStaffInvitation() {
    this.log('=== Testing Staff Invitation Flow ===')
    
    try {
      // 1. Create invitation
      this.log('Creating staff invitation...')
      
      const createResponse = await fetch(`${BASE_URL}/api/admin/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.adminToken}`
        },
        body: JSON.stringify(TEST_STAFF_INVITATION)
      })

      const createResult = await createResponse.json()

      if (!createResponse.ok) {
        throw new Error(`HTTP ${createResponse.status}: ${createResult.error || 'Unknown error'}`)
      }

      if (!createResult.success) {
        throw new Error(createResult.error || 'Invitation creation failed')
      }

      this.invitationData = createResult.data
      this.log(`✅ Invitation created: ${createResult.data.id}`)
      
      // Extract token from URL
      const urlParams = new URL(createResult.data.invite_url).searchParams
      const token = urlParams.get('token')
      
      if (!token) {
        throw new Error('No token found in invitation URL')
      }

      // 2. Verify invitation token
      this.log('Verifying invitation token...')
      
      const verifyResponse = await fetch(`${BASE_URL}/api/auth/verify-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      })

      const verifyResult = await verifyResponse.json()

      if (!verifyResponse.ok || !verifyResult.success) {
        throw new Error(verifyResult.error || 'Token verification failed')
      }

      this.log(`✅ Token verified: ${verifyResult.data.email} as ${verifyResult.data.role}`)

      // 3. Accept invitation
      this.log('Accepting invitation...')
      
      const acceptData = {
        token,
        password: 'TestDoctor123!',
        accept_tos: true,
        accept_privacy: true,
        mfa_opt_in: false
      }

      const acceptResponse = await fetch(`${BASE_URL}/api/auth/accept-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(acceptData)
      })

      const acceptResult = await acceptResponse.json()

      if (!acceptResponse.ok || !acceptResult.success) {
        throw new Error(acceptResult.error || 'Invitation acceptance failed')
      }

      this.staffData = acceptResult.data
      this.log(`✅ Invitation accepted: ${acceptResult.data.user.id}`)
      this.log(`Staff user: ${acceptResult.data.user.email} as ${acceptResult.data.user.role}`)
      
      return acceptResult.data
      
    } catch (error) {
      this.log(`❌ Staff invitation failed: ${error.message}`, 'error')
      throw error
    }
  }

  async testDatabaseIntegrity() {
    this.log('=== Testing Database Integrity ===')
    
    try {
      // Check patient profile
      const { data: patientProfile, error: patientError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('email', TEST_PATIENT.email)
        .single()

      if (patientError || !patientProfile) {
        throw new Error('Patient profile not found')
      }

      this.log(`✅ Patient profile: ${patientProfile.role}, verified=${patientProfile.email_verified}`)

      // Check staff profile
      const { data: staffProfile, error: staffError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('email', TEST_STAFF_INVITATION.email)
        .single()

      if (staffError || !staffProfile) {
        throw new Error('Staff profile not found')
      }

      this.log(`✅ Staff profile: ${staffProfile.role}, verified=${staffProfile.email_verified}`)

      // Check invitation was marked as consumed
      const { data: invitation, error: invitationError } = await this.supabase
        .from('staff_invitations')
        .select('*')
        .eq('email', TEST_STAFF_INVITATION.email)
        .single()

      if (invitationError || !invitation) {
        throw new Error('Invitation record not found')
      }

      if (!invitation.consumed_at) {
        throw new Error('Invitation not marked as consumed')
      }

      this.log(`✅ Invitation consumed at: ${invitation.consumed_at}`)
      
    } catch (error) {
      this.log(`❌ Database integrity check failed: ${error.message}`, 'error')
      throw error
    }
  }

  async testFrontendPages() {
    this.log('=== Testing Frontend Pages ===')
    
    try {
      // Test patient registration page
      const patientPageResponse = await fetch(`${BASE_URL}/register`)
      if (!patientPageResponse.ok) {
        throw new Error(`Patient registration page failed: ${patientPageResponse.status}`)
      }
      this.log('✅ Patient registration page accessible')

      // Test admin invitations page
      const adminPageResponse = await fetch(`${BASE_URL}/admin/invitations`)
      if (!adminPageResponse.ok) {
        this.log('⚠️ Admin invitations page requires authentication (expected)')
      } else {
        this.log('✅ Admin invitations page accessible')
      }

      // Test accept invite page (without token)
      const acceptPageResponse = await fetch(`${BASE_URL}/accept-invite`)
      if (!acceptPageResponse.ok) {
        this.log('⚠️ Accept invite page requires token (expected)')
      } else {
        this.log('✅ Accept invite page accessible')
      }
      
    } catch (error) {
      this.log(`❌ Frontend pages test failed: ${error.message}`, 'error')
      throw error
    }
  }

  async cleanupTestData() {
    this.log('Cleaning up test data...')
    
    try {
      const testEmails = [TEST_PATIENT.email, TEST_STAFF_INVITATION.email]
      
      for (const email of testEmails) {
        try {
          const { data: user } = await this.supabase.auth.admin.getUserByEmail(email)
          if (user.user) {
            await this.supabase.auth.admin.deleteUser(user.user.id)
            this.log(`Deleted user: ${email}`)
          }
        } catch (error) {
          this.log(`Failed to delete user ${email}: ${error.message}`, 'warn')
        }
      }

      // Delete test invitations
      const { error: deleteInvitationsError } = await this.supabase
        .from('staff_invitations')
        .delete()
        .in('email', testEmails)

      if (deleteInvitationsError) {
        this.log(`Failed to delete test invitations: ${deleteInvitationsError.message}`, 'warn')
      }

      this.log('Cleanup completed')
      
    } catch (error) {
      this.log(`Cleanup failed: ${error.message}`, 'error')
    }
  }

  async runFullTest() {
    this.log('🚀 Starting Dual Authentication System Test...')
    
    try {
      // Setup
      await this.setupTestEnvironment()
      
      // Test patient registration
      await this.testPatientRegistration()
      
      // Test staff invitation
      await this.testStaffInvitation()
      
      // Test database integrity
      await this.testDatabaseIntegrity()
      
      // Test frontend pages
      await this.testFrontendPages()
      
      this.log('🎉 All tests passed successfully!', 'success')
      
    } catch (error) {
      this.log(`💥 Test suite failed: ${error.message}`, 'error')
      throw error
    } finally {
      // Cleanup
      await this.cleanupTestData()
    }
  }

  generateReport() {
    const summary = {
      total: this.testResults.length,
      success: this.testResults.filter(r => r.type === 'success').length,
      errors: this.testResults.filter(r => r.type === 'error').length,
      warnings: this.testResults.filter(r => r.type === 'warn').length,
      info: this.testResults.filter(r => r.type === 'info').length
    }

    console.log('\n' + '='.repeat(50))
    console.log('🧪 DUAL AUTHENTICATION TEST REPORT')
    console.log('='.repeat(50))
    console.log(`📊 Total logs: ${summary.total}`)
    console.log(`✅ Success: ${summary.success}`)
    console.log(`❌ Errors: ${summary.errors}`)
    console.log(`⚠️  Warnings: ${summary.warnings}`)
    console.log(`ℹ️  Info: ${summary.info}`)
    console.log('='.repeat(50) + '\n')

    return summary
  }
}

// Run the test
async function main() {
  const tester = new DualAuthTester()
  
  try {
    await tester.runFullTest()
    console.log('🎯 Dual authentication system is working perfectly!')
  } catch (error) {
    console.error('💥 Test suite failed:', error.message)
    process.exit(1)
  } finally {
    tester.generateReport()
  }
}

if (require.main === module) {
  main()
}

module.exports = DualAuthTester
