"use client"

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseAuth, HospitalUser } from './supabase-auth'
import { sessionManager, SessionState } from './session-manager'

interface EnhancedAuthContextType {
  user: HospitalUser | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
  clearError: () => void
  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
}

const EnhancedAuthContext = createContext<EnhancedAuthContextType | undefined>(undefined)

export function EnhancedAuthProvider({ children }: { children: React.ReactNode }) {
  const [sessionState, setSessionState] = useState<SessionState>(sessionManager.getState())
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()
  const initRef = useRef(false)
  const verificationRef = useRef(false)

  // Subscribe to session changes
  useEffect(() => {
    const unsubscribe = sessionManager.subscribe((state) => {
      console.log('🔄 [EnhancedAuthProvider] Session state changed:', {
        isAuthenticated: state.isAuthenticated,
        hasUser: !!state.user,
        isLoading: state.isLoading,
        userRole: state.user?.role
      })
      setSessionState(state)
    })

    return unsubscribe
  }, [])

  // Initialize and verify session
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    const initializeAuth = async () => {
      try {
        console.log('🔄 [EnhancedAuthProvider] Initializing auth...')
        sessionManager.setLoading(true)

        // Check if we have a valid session
        const existingSession = sessionManager.getSession()

        if (existingSession) {
          console.log('🔄 [EnhancedAuthProvider] Found existing session')

          // Check if we should verify with server
          if (sessionManager.shouldVerifySession()) {
            console.log('🔄 [EnhancedAuthProvider] Verifying session with server...')
            await verifySessionWithServer()
          } else {
            console.log('🔄 [EnhancedAuthProvider] Using cached session')
          }
        } else {
          console.log('🔄 [EnhancedAuthProvider] No existing session found')
        }

        setError(null)
      } catch (err) {
        console.error('❌ [EnhancedAuthProvider] Failed to initialize auth:', err)
        setError('Failed to initialize authentication')
        sessionManager.clearSession()
      } finally {
        sessionManager.setLoading(false)
        setIsInitialized(true)
      }
    }

    initializeAuth()
  }, [])

  // Verify session with server
  const verifySessionWithServer = async () => {
    if (verificationRef.current) return
    verificationRef.current = true

    try {
      const result = await supabaseAuth.getCurrentUser()

      if (result.user && !result.error) {
        // Update session with fresh user data
        const existingSession = sessionManager.getSession()
        if (existingSession) {
          sessionManager.saveSession(
            result.user,
            existingSession.accessToken,
            existingSession.refreshToken,
            Math.floor((existingSession.expiresAt - Date.now()) / 1000)
          )
        }
        sessionManager.updateLastChecked()
      } else {
        console.log('🔄 [EnhancedAuthProvider] Server verification failed, clearing session')
        sessionManager.clearSession()
      }
    } catch (error) {
      console.error('❌ [EnhancedAuthProvider] Server verification error:', error)
      sessionManager.clearSession()
    } finally {
      verificationRef.current = false
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      sessionManager.setLoading(true)
      setError(null)

      console.log('🔐 [EnhancedAuthProvider] Starting sign in...')
      const result = await supabaseAuth.signIn({ email, password })

      if (result.error) {
        // Enhanced error handling with better user messages
        let userFriendlyError = result.error

        // Provide more specific error messages
        if (result.error.includes('Invalid login credentials') ||
          result.error.includes('Email hoặc mật khẩu không đúng')) {
          userFriendlyError = 'Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại thông tin và thử lại.'
        } else if (result.error.includes('Email not confirmed') ||
          result.error.includes('xác thực email')) {
          userFriendlyError = 'Tài khoản chưa được xác thực. Vui lòng kiểm tra email và xác thực tài khoản trước khi đăng nhập.'
        } else if (result.error.includes('Too many requests') ||
          result.error.includes('Quá nhiều lần thử')) {
          userFriendlyError = 'Quá nhiều lần thử đăng nhập. Vui lòng đợi một chút rồi thử lại.'
        } else if (result.error.includes('User not found')) {
          userFriendlyError = 'Không tìm thấy tài khoản với email này. Vui lòng kiểm tra lại email hoặc đăng ký tài khoản mới.'
        } else if (result.error.includes('Account is disabled')) {
          userFriendlyError = 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.'
        }

        setError(userFriendlyError)
        console.error('❌ [EnhancedAuthProvider] Sign in failed:', result.error)
        throw new Error(userFriendlyError)
      }

      if (result.user && result.session) {
        console.log('✅ [EnhancedAuthProvider] Sign in successful')

        // Save session
        sessionManager.saveSession(
          result.user,
          result.session.access_token,
          result.session.refresh_token || '',
          result.session.expires_in || 3600
        )

        // Check if we should redirect to doctor booking
        const isFromBooking = typeof window !== 'undefined' && window.location.search.includes('redirect=booking')
        const selectedDoctorId = typeof window !== 'undefined' ? localStorage.getItem('selectedDoctorId') : null

        if (isFromBooking && selectedDoctorId) {
          console.log('🔄 [EnhancedAuthProvider] Redirecting to doctor booking:', selectedDoctorId)
          router.replace(`/doctors/${selectedDoctorId}`)
        } else {
          // Navigate to appropriate dashboard
          const { getDashboardPath } = await import('./dashboard-routes')
          const redirectPath = getDashboardPath(result.user.role as any)
          console.log('🔄 [EnhancedAuthProvider] Redirecting to dashboard:', redirectPath)
          router.replace(redirectPath)
        }
      }
    } catch (err: any) {
      console.error('❌ [EnhancedAuthProvider] Sign in failed:', err)
      sessionManager.clearSession()

      // Don't override the error if it's already set with a user-friendly message
      if (!error) {
        setError(err.message || 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.')
      }

      throw err
    } finally {
      sessionManager.setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      sessionManager.setLoading(true)
      console.log('🚪 [EnhancedAuthProvider] Starting sign out...')

      await supabaseAuth.signOut()
      sessionManager.clearSession()
      setError(null)

      console.log('✅ [EnhancedAuthProvider] Sign out successful')
      router.replace('/auth/login')
    } catch (err: any) {
      console.error('❌ [EnhancedAuthProvider] Sign out failed:', err)
      setError('Failed to sign out')
      // Still clear session even if server signout fails
      sessionManager.clearSession()
      router.replace('/auth/login')
    } finally {
      sessionManager.setLoading(false)
    }
  }

  const refreshUser = async () => {
    try {
      console.log('🔄 [EnhancedAuthProvider] Refreshing user data...')
      const result = await supabaseAuth.getCurrentUser()

      if (result.user && !result.error) {
        const existingSession = sessionManager.getSession()
        if (existingSession) {
          sessionManager.saveSession(
            result.user,
            existingSession.accessToken,
            existingSession.refreshToken,
            Math.floor((existingSession.expiresAt - Date.now()) / 1000)
          )
        }
        setError(null)
      } else {
        console.log('🔄 [EnhancedAuthProvider] Refresh failed, clearing session')
        sessionManager.clearSession()
        if (result.error) {
          setError(result.error)
        }
      }
    } catch (err: any) {
      console.error('❌ [EnhancedAuthProvider] Failed to refresh user:', err)
      sessionManager.clearSession()
      setError('Failed to refresh user data')
    }
  }

  const hasRole = (role: string): boolean => {
    return sessionManager.hasRole(role)
  }

  const hasAnyRole = (roles: string[]): boolean => {
    return sessionManager.hasAnyRole(roles)
  }

  const clearError = () => {
    setError(null)
  }

  const value: EnhancedAuthContextType = {
    user: sessionState.user,
    loading: sessionState.isLoading,
    error,
    isAuthenticated: sessionState.isAuthenticated,
    signIn,
    signOut,
    refreshUser,
    clearError,
    hasRole,
    hasAnyRole
  }

  // Don't render children until auth is initialized
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang khởi tạo...</p>
        </div>
      </div>
    )
  }

  return (
    <EnhancedAuthContext.Provider value={value}>
      {children}
    </EnhancedAuthContext.Provider>
  )
}

export function useEnhancedAuth() {
  const context = useContext(EnhancedAuthContext)
  if (context === undefined) {
    throw new Error('useEnhancedAuth must be used within an EnhancedAuthProvider')
  }
  return context
}
