/**
 * Test Script for Invite-Only Authentication System
 * Tests the complete invitation flow from creation to acceptance
 *
 * 🚨 SECURITY WARNING:
 * - This script is for DEVELOPMENT/TESTING ONLY
 * - NEVER use these credentials in production
 * - NEVER commit real passwords or sensitive data
 * - See docs/SECURITY_WARNINGS.md for guidelines
 */

const { createClient } = require('@supabase/supabase-js')
const fetch = require('node-fetch')
require('dotenv').config({ path: '../.env.local' })

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

// ⚠️ SECURITY WARNING: NEVER USE THESE VALUES IN PRODUCTION!
// These are test-only values for development/testing purposes only

// Generate random test data to avoid hardcoded values
const generateTestEmail = (prefix) => `${prefix}-${Date.now()}@test-hospital-local.com`
const generateTestPassword = () => `Test${Math.random().toString(36).slice(2)}!`

// Test data - DEVELOPMENT ONLY
const TEST_INVITATION = {
  email: process.env.TEST_STAFF_EMAIL || generateTestEmail('doctor'),
  role: 'doctor',
  department_id: 1,
  expires_in_days: 7,
  message: 'Welcome to our test hospital management system!'
}

const TEST_ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL || generateTestEmail('admin'),
  password: process.env.TEST_ADMIN_PASSWORD || generateTestPassword(),
  role: 'admin'
}

class InvitationSystemTester {
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

  async setupTestAdmin() {
    this.log('Setting up test admin user...')
    
    try {
      // Check if admin already exists
      const { data: existingUser } = await this.supabase.auth.admin.getUserByEmail(TEST_ADMIN.email)
      
      if (existingUser.user) {
        this.log('Test admin already exists, using existing user')
      } else {
        // Create admin user
        const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
          email: TEST_ADMIN.email,
          password: TEST_ADMIN.password,
          email_confirm: true,
          user_metadata: {
            role: TEST_ADMIN.role
          },
          app_metadata: {
            role: TEST_ADMIN.role
          }
        })

        if (authError) {
          throw new Error(`Failed to create admin user: ${authError.message}`)
        }

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

        if (profileError) {
          throw new Error(`Failed to create admin profile: ${profileError.message}`)
        }

        this.log('Test admin user created successfully')
      }

      // Sign in as admin to get token
      const { data: signInData, error: signInError } = await this.supabase.auth.signInWithPassword({
        email: TEST_ADMIN.email,
        password: TEST_ADMIN.password
      })

      if (signInError) {
        throw new Error(`Failed to sign in as admin: ${signInError.message}`)
      }

      this.adminToken = signInData.session.access_token
      this.log('Admin authentication successful')
      
    } catch (error) {
      this.log(`Setup admin failed: ${error.message}`, 'error')
      throw error
    }
  }

  async testCreateInvitation() {
    this.log('Testing invitation creation...')
    
    try {
      const response = await fetch(`${BASE_URL}/api/admin/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.adminToken}`
        },
        body: JSON.stringify(TEST_INVITATION)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${result.error || 'Unknown error'}`)
      }

      if (!result.success) {
        throw new Error(result.error || 'Invitation creation failed')
      }

      this.invitationData = result.data
      this.log(`Invitation created successfully: ${result.data.id}`)
      this.log(`Invitation URL: ${result.data.invite_url}`)
      
      return result.data
      
    } catch (error) {
      this.log(`Create invitation failed: ${error.message}`, 'error')
      throw error
    }
  }

  async testVerifyInvitation(token) {
    this.log('Testing invitation token verification...')
    
    try {
      const response = await fetch(`${BASE_URL}/api/auth/verify-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${result.error || 'Unknown error'}`)
      }

      if (!result.success) {
        throw new Error(result.error || 'Token verification failed')
      }

      this.log('Token verification successful')
      this.log(`Verified email: ${result.data.email}`)
      this.log(`Verified role: ${result.data.role}`)
      
      return result.data
      
    } catch (error) {
      this.log(`Verify invitation failed: ${error.message}`, 'error')
      throw error
    }
  }

  async testAcceptInvitation(token) {
    this.log('Testing invitation acceptance...')
    
    const acceptData = {
      token,
      password: 'TestDoctor123!',
      accept_tos: true,
      accept_privacy: true,
      mfa_opt_in: false
    }
    
    try {
      const response = await fetch(`${BASE_URL}/api/auth/accept-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(acceptData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${result.error || 'Unknown error'}`)
      }

      if (!result.success) {
        throw new Error(result.error || 'Invitation acceptance failed')
      }

      this.log('Invitation acceptance successful')
      this.log(`New user ID: ${result.data.user.id}`)
      this.log(`User email: ${result.data.user.email}`)
      this.log(`User role: ${result.data.user.role}`)
      
      return result.data
      
    } catch (error) {
      this.log(`Accept invitation failed: ${error.message}`, 'error')
      throw error
    }
  }

  async testListInvitations() {
    this.log('Testing invitation listing...')
    
    try {
      const response = await fetch(`${BASE_URL}/api/admin/invitations`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.adminToken}`
        }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${result.error || 'Unknown error'}`)
      }

      if (!result.success) {
        throw new Error(result.error || 'List invitations failed')
      }

      this.log(`Found ${result.data.length} invitations`)
      this.log(`Pagination: ${JSON.stringify(result.pagination)}`)
      
      return result.data
      
    } catch (error) {
      this.log(`List invitations failed: ${error.message}`, 'error')
      throw error
    }
  }

  async testRevokeInvitation(invitationId) {
    this.log('Testing invitation revocation...')
    
    try {
      const response = await fetch(`${BASE_URL}/api/admin/invitations?id=${invitationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.adminToken}`
        }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${result.error || 'Unknown error'}`)
      }

      if (!result.success) {
        throw new Error(result.error || 'Invitation revocation failed')
      }

      this.log('Invitation revocation successful')
      
      return result
      
    } catch (error) {
      this.log(`Revoke invitation failed: ${error.message}`, 'error')
      throw error
    }
  }

  async cleanup() {
    this.log('Cleaning up test data...')
    
    try {
      // Delete test users
      const testEmails = [TEST_INVITATION.email, TEST_ADMIN.email]
      
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
        .eq('email', TEST_INVITATION.email)

      if (deleteInvitationsError) {
        this.log(`Failed to delete test invitations: ${deleteInvitationsError.message}`, 'warn')
      } else {
        this.log('Test invitations deleted')
      }

      this.log('Cleanup completed')
      
    } catch (error) {
      this.log(`Cleanup failed: ${error.message}`, 'error')
    }
  }

  async runFullTest() {
    this.log('Starting full invitation system test...')
    
    try {
      // Setup
      await this.setupTestAdmin()
      
      // Test invitation creation
      const invitation = await this.testCreateInvitation()
      
      // Extract token from invite URL (this is a simplified extraction)
      const urlParams = new URL(invitation.invite_url).searchParams
      const token = urlParams.get('token')
      
      if (!token) {
        throw new Error('No token found in invitation URL')
      }
      
      // Test token verification
      await this.testVerifyInvitation(token)
      
      // Test invitation acceptance
      await this.testAcceptInvitation(token)
      
      // Test listing invitations
      await this.testListInvitations()
      
      this.log('All tests passed successfully!', 'success')
      
    } catch (error) {
      this.log(`Test failed: ${error.message}`, 'error')
      throw error
    } finally {
      // Cleanup
      await this.cleanup()
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

    console.log('\n=== TEST REPORT ===')
    console.log(`Total logs: ${summary.total}`)
    console.log(`Success: ${summary.success}`)
    console.log(`Errors: ${summary.errors}`)
    console.log(`Warnings: ${summary.warnings}`)
    console.log(`Info: ${summary.info}`)
    console.log('==================\n')

    return summary
  }
}

// Run the test
async function main() {
  const tester = new InvitationSystemTester()
  
  try {
    await tester.runFullTest()
    console.log('✅ All tests completed successfully!')
  } catch (error) {
    console.error('❌ Test suite failed:', error.message)
    process.exit(1)
  } finally {
    tester.generateReport()
  }
}

if (require.main === module) {
  main()
}

module.exports = InvitationSystemTester
