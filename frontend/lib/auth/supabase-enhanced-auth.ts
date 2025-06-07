import { supabaseClient } from '../supabase-client'
import { AuthError, AuthResponse, User } from '@supabase/supabase-js'

/**
 * Enhanced Supabase Auth Service utilizing built-in Supabase features
 * This service leverages Supabase's native security features instead of custom implementations
 */
export class SupabaseEnhancedAuth {
  
  // ==========================================
  // EMAIL VERIFICATION (Built-in Supabase)
  // ==========================================
  
  /**
   * Resend email verification using Supabase's built-in feature
   */
  static async resendEmailVerification(email: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabaseClient.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify-email`
        }
      })

      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      console.error('Error resending verification email:', error)
      return { error: 'Đã xảy ra lỗi khi gửi lại email xác thực.' }
    }
  }

  // ==========================================
  // PHONE AUTHENTICATION (Built-in Supabase)
  // ==========================================
  
  /**
   * Send OTP to phone number using Supabase's built-in SMS
   */
  static async sendPhoneOTP(phone: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabaseClient.auth.signInWithOtp({
        phone: phone,
        options: {
          // You can customize the SMS template in Supabase dashboard
        }
      })

      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      console.error('Error sending phone OTP:', error)
      return { error: 'Đã xảy ra lỗi khi gửi mã OTP.' }
    }
  }

  /**
   * Verify phone OTP using Supabase's built-in verification
   */
  static async verifyPhoneOTP(phone: string, token: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabaseClient.auth.verifyOtp({
        phone: phone,
        token: token,
        type: 'sms'
      })

      if (error) {
        return { user: null, session: null, error: error.message }
      }

      return { user: data.user, session: data.session, error: null }
    } catch (error) {
      console.error('Error verifying phone OTP:', error)
      return { user: null, session: null, error: 'Đã xảy ra lỗi khi xác thực OTP.' }
    }
  }

  // ==========================================
  // MAGIC LINKS (Built-in Supabase)
  // ==========================================
  
  /**
   * Send magic link for passwordless login
   */
  static async sendMagicLink(email: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabaseClient.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          // You can customize the email template in Supabase dashboard
        }
      })

      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      console.error('Error sending magic link:', error)
      return { error: 'Đã xảy ra lỗi khi gửi magic link.' }
    }
  }

  // ==========================================
  // OAUTH PROVIDERS (Built-in Supabase)
  // ==========================================
  
  /**
   * Sign in with OAuth provider (Google, GitHub, etc.)
   */
  static async signInWithOAuth(provider: 'google' | 'github' | 'facebook' | 'apple'): Promise<{ error: string | null }> {
    try {
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      })

      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error)
      return { error: `Đã xảy ra lỗi khi đăng nhập với ${provider}.` }
    }
  }

  // ==========================================
  // SESSION MANAGEMENT (Built-in Supabase)
  // ==========================================
  
  /**
   * Get current session with automatic refresh
   */
  static async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabaseClient.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
        return null
      }

      return session
    } catch (error) {
      console.error('Error getting current session:', error)
      return null
    }
  }

  /**
   * Refresh session manually
   */
  static async refreshSession(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabaseClient.auth.refreshSession()
      
      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      console.error('Error refreshing session:', error)
      return { error: 'Đã xảy ra lỗi khi làm mới phiên đăng nhập.' }
    }
  }

  /**
   * Sign out from all devices
   */
  static async signOutEverywhere(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabaseClient.auth.signOut({ scope: 'global' })
      
      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      console.error('Error signing out everywhere:', error)
      return { error: 'Đã xảy ra lỗi khi đăng xuất khỏi tất cả thiết bị.' }
    }
  }

  // ==========================================
  // ENHANCED PASSWORD FEATURES
  // ==========================================
  
  /**
   * Update user metadata (for storing additional security info)
   */
  static async updateUserMetadata(metadata: Record<string, any>): Promise<{ error: string | null }> {
    try {
      const { error } = await supabaseClient.auth.updateUser({
        data: metadata
      })

      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      console.error('Error updating user metadata:', error)
      return { error: 'Đã xảy ra lỗi khi cập nhật thông tin người dùng.' }
    }
  }

  /**
   * Get user metadata
   */
  static async getUserMetadata(): Promise<Record<string, any> | null> {
    try {
      const { data: { user }, error } = await supabaseClient.auth.getUser()
      
      if (error || !user) {
        return null
      }

      return user.user_metadata || {}
    } catch (error) {
      console.error('Error getting user metadata:', error)
      return null
    }
  }

  // ==========================================
  // SECURITY MONITORING
  // ==========================================
  
  /**
   * Listen to auth state changes for security monitoring
   */
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabaseClient.auth.onAuthStateChange((event, session) => {
      // Log security events
      console.log(`🔐 Auth Event: ${event}`, {
        timestamp: new Date().toISOString(),
        userId: session?.user?.id,
        email: session?.user?.email,
        userAgent: navigator.userAgent,
        ip: 'client-side' // IP would be logged server-side
      })

      callback(event, session)
    })
  }

  // ==========================================
  // RATE LIMITING HELPERS
  // ==========================================
  
  /**
   * Check if user is rate limited (client-side basic check)
   */
  static isRateLimited(action: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
    const key = `rate_limit_${action}`
    const now = Date.now()
    const attempts = JSON.parse(localStorage.getItem(key) || '[]')
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter((timestamp: number) => now - timestamp < windowMs)
    
    if (validAttempts.length >= maxAttempts) {
      return true
    }

    // Add current attempt
    validAttempts.push(now)
    localStorage.setItem(key, JSON.stringify(validAttempts))
    
    return false
  }

  /**
   * Clear rate limit for an action
   */
  static clearRateLimit(action: string): void {
    const key = `rate_limit_${action}`
    localStorage.removeItem(key)
  }

  // ==========================================
  // SECURITY UTILITIES
  // ==========================================
  
  /**
   * Generate secure random string for various purposes
   */
  static generateSecureRandom(length: number = 32): string {
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Hash sensitive data client-side before sending to server
   */
  static async hashData(data: string): Promise<string> {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Validate phone number format (Vietnam)
   */
  static isValidPhoneNumber(phone: string): boolean {
    // Vietnam phone number format: starts with 0, 10 digits total
    const phoneRegex = /^0[0-9]{9}$/
    return phoneRegex.test(phone)
  }

  /**
   * Check if password meets security requirements
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean
    score: number
    feedback: string[]
  } {
    const feedback: string[] = []
    let score = 0

    if (password.length >= 8) score += 1
    else feedback.push('Ít nhất 8 ký tự')

    if (/[A-Z]/.test(password)) score += 1
    else feedback.push('Có chữ hoa')

    if (/[a-z]/.test(password)) score += 1
    else feedback.push('Có chữ thường')

    if (/\d/.test(password)) score += 1
    else feedback.push('Có số')

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1
    else feedback.push('Có ký tự đặc biệt')

    return {
      isValid: score === 5,
      score,
      feedback
    }
  }
}
