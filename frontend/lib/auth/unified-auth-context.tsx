"use client"

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseAuth, HospitalUser } from './supabase-auth'
import { authServiceApi, AuthUser, RegisterData } from '../api/auth'
import { sessionManager } from './session-manager'
import { getDashboardPath } from './dashboard-routes'
import { supabaseClient } from '../supabase-client'

// Auth types
export type AuthType = 'supabase' | 'service'

// Unified user interface
export interface UnifiedUser {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  email_confirmed_at?: string
  email_verified?: boolean
  phone_verified?: boolean
  created_at: string
  // Additional fields from HospitalUser
  phone_number?: string
  gender?: string
  date_of_birth?: string
  // Role-specific IDs
  doctor_id?: string
  patient_id?: string
  admin_id?: string
  profile_id?: string // For backward compatibility
  // Auth type indicator
  authType: AuthType
}

// Unified auth context interface
interface UnifiedAuthContextType {
  user: UnifiedUser | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  authType: AuthType
  signIn: (email: string, password: string, authType?: AuthType) => Promise<void>
  signUp: (userData: RegisterData, authType?: AuthType) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
  clearError: () => void
  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
  switchAuthType: (type: AuthType) => void
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error: string | null }>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>
  // Access to underlying auth clients for advanced operations
  getSupabaseClient: () => any
}

const UnifiedAuthContext = createContext<UnifiedAuthContextType | undefined>(undefined)

export function UnifiedAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UnifiedUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authType, setAuthType] = useState<AuthType>('service') // Default to Auth Service microservice
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()
  const initRef = useRef(false)

  // Detect auth type from stored session/token
  const detectAuthType = (): AuthType => {
    try {
      // Check for auth service token
      const serviceToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
      if (serviceToken) {
        return 'service'
      }

      // Check for supabase session
      const supabaseSession = sessionManager.getSession()
      if (supabaseSession) {
        return 'supabase'
      }

      // Check URL for auth type hint
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search)
        const authTypeParam = urlParams.get('authType') as AuthType
        if (authTypeParam === 'service' || authTypeParam === 'supabase') {
          return authTypeParam
        }
      }

      return 'service' // Default to Auth Service microservice
    } catch (error) {
      console.error('Error detecting auth type:', error)
      return 'service' // Default to Auth Service microservice
    }
  }

  // Convert HospitalUser to UnifiedUser
  const convertHospitalUser = (hospitalUser: HospitalUser): UnifiedUser => ({
    id: hospitalUser.id,
    email: hospitalUser.email,
    full_name: hospitalUser.full_name,
    role: hospitalUser.role,
    is_active: hospitalUser.is_active,
    email_confirmed_at: hospitalUser.last_login, // Use last_login as fallback
    email_verified: hospitalUser.email_verified,
    phone_verified: hospitalUser.phone_verified,
    created_at: hospitalUser.created_at,
    phone_number: hospitalUser.phone_number,
    // Add role-specific IDs
    doctor_id: hospitalUser.doctor_id,
    patient_id: hospitalUser.patient_id,
    admin_id: hospitalUser.admin_id,
    profile_id: hospitalUser.id, // Use id as profile_id for backward compatibility
    authType: 'supabase'
  })

  // Convert AuthUser to UnifiedUser
  const convertAuthUser = (authUser: AuthUser): UnifiedUser => ({
    id: authUser.id,
    email: authUser.email,
    full_name: authUser.full_name,
    role: authUser.role,
    is_active: authUser.is_active,
    email_confirmed_at: authUser.email_confirmed_at,
    created_at: authUser.created_at,
    authType: 'service'
  })

  // Initialize auth state
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    const initializeAuth = async () => {
      try {
        console.log('🔄 [UnifiedAuth] Initializing auth state...')
        
        // Detect which auth system to use
        const detectedAuthType = detectAuthType()
        setAuthType(detectedAuthType)
        
        console.log('🔍 [UnifiedAuth] Detected auth type:', detectedAuthType)

        if (detectedAuthType === 'service') {
          await initializeAuthService()
        } else {
          await initializeSupabaseAuth()
        }
      } catch (err) {
        console.error('❌ [UnifiedAuth] Failed to initialize auth:', err)
        setError('Failed to initialize authentication')
      } finally {
        setLoading(false)
        setIsInitialized(true)
      }
    }

    initializeAuth()
  }, [])

  // Initialize Auth Service
  const initializeAuthService = async () => {
    try {
      const response = await authServiceApi.getCurrentUser()
      
      if (response.success && response.data) {
        const unifiedUser = convertAuthUser(response.data)
        setUser(unifiedUser)
        console.log('✅ [UnifiedAuth] Auth Service user loaded:', unifiedUser.role)
      } else {
        console.log('ℹ️ [UnifiedAuth] No Auth Service session found')
        setUser(null)
      }
    } catch (err) {
      console.error('❌ [UnifiedAuth] Auth Service initialization failed:', err)
      setUser(null)
    }
  }

  // Initialize Supabase Auth
  const initializeSupabaseAuth = async () => {
    try {
      const result = await supabaseAuth.getCurrentUser()

      if (result.user && !result.error) {
        const unifiedUser = convertHospitalUser(result.user)
        setUser(unifiedUser)
        console.log('✅ [UnifiedAuth] Supabase user loaded:', unifiedUser.role)
      } else {
        console.log('ℹ️ [UnifiedAuth] No Supabase session found')
        setUser(null)
        if (result.error) {
          setError(result.error)
        }
      }
    } catch (err) {
      console.error('❌ [UnifiedAuth] Supabase initialization failed:', err)
      setUser(null)
    }
  }

  // Sign in with unified interface
  const signIn = async (email: string, password: string, preferredAuthType?: AuthType) => {
    try {
      setLoading(true)
      setError(null)

      const targetAuthType = preferredAuthType || authType
      console.log(`🔐 [UnifiedAuth] Signing in with ${targetAuthType}...`)

      if (targetAuthType === 'service') {
        await signInWithAuthService(email, password)
      } else {
        await signInWithSupabase(email, password)
      }
    } catch (err: any) {
      console.error('❌ [UnifiedAuth] Sign in failed:', err)
      setError(err.message || 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  // Sign in with Auth Service
  const signInWithAuthService = async (email: string, password: string) => {
    const response = await authServiceApi.signIn({ email, password })

    if (!response.success || !response.data?.user) {
      throw new Error(response.error?.message || 'Invalid credentials')
    }

    const unifiedUser = convertAuthUser(response.data.user)
    setUser(unifiedUser)
    setAuthType('service')

    // Store token for future requests
    if (response.data.session?.access_token) {
      localStorage.setItem('auth_token', response.data.session.access_token)
      if (response.data.session.refresh_token) {
        localStorage.setItem('refresh_token', response.data.session.refresh_token)
      }
    }

    console.log('✅ [UnifiedAuth] Auth Service sign in successful')

    // Redirect to dashboard
    const dashboardPath = getDashboardPath(unifiedUser.role as any)
    router.replace(dashboardPath)
  }

  // Sign in with Supabase
  const signInWithSupabase = async (email: string, password: string) => {
    const result = await supabaseAuth.signIn({ email, password })

    if (result.error || !result.user) {
      throw new Error(result.error || 'Invalid credentials')
    }

    const unifiedUser = convertHospitalUser(result.user)
    setUser(unifiedUser)
    setAuthType('supabase')

    console.log('✅ [UnifiedAuth] Supabase sign in successful')

    // Redirect to dashboard
    const dashboardPath = getDashboardPath(unifiedUser.role as any)
    router.replace(dashboardPath)
  }

  // Sign up with unified interface
  const signUp = async (userData: RegisterData, preferredAuthType?: AuthType) => {
    try {
      setLoading(true)
      setError(null)

      // Force Auth Service for now to test department-based ID
      const targetAuthType = 'service' // Force Auth Service
      console.log(`📝 [UnifiedAuth] Signing up with ${targetAuthType} (forced)...`)
      console.log('📝 [UnifiedAuth] Current authType state:', authType)
      console.log('📝 [UnifiedAuth] Preferred authType:', preferredAuthType)

      if (targetAuthType === 'service') {
        await signUpWithAuthService(userData)
      } else {
        await signUpWithSupabase(userData)
      }
    } catch (err: any) {
      console.error('❌ [UnifiedAuth] Sign up failed:', err)
      setError(err.message || 'Sign up failed')
      throw err // Re-throw to handle in UI
    } finally {
      setLoading(false)
    }
  }

  // Sign up with Auth Service
  const signUpWithAuthService = async (userData: RegisterData) => {
    console.log('🔄 [UnifiedAuth] Attempting Auth Service signup with data:', userData)

    const response = await authServiceApi.signUp(userData)

    console.log('📝 [UnifiedAuth] Auth Service signup response:', response)

    if (!response.success) {
      console.error('❌ [UnifiedAuth] Auth Service signup failed:', response.error)
      throw new Error(response.error?.message || 'Registration failed')
    }

    console.log('✅ [UnifiedAuth] Auth Service sign up successful')
    // Note: User might need to verify email before signing in
  }

  // Sign up with Supabase
  const signUpWithSupabase = async (userData: RegisterData) => {
    // Convert RegisterData to Supabase format
    const supabaseUserData = {
      ...userData,
      role: userData.role === 'admin' ? 'doctor' : userData.role // Map admin to doctor for Supabase
    } as any
    const result = await supabaseAuth.signUp(supabaseUserData)

    if (result.error) {
      throw new Error(result.error)
    }

    console.log('✅ [UnifiedAuth] Supabase sign up successful')
    // Note: User might need to verify email before signing in
  }

  // Sign out from both systems
  const signOut = async () => {
    try {
      setLoading(true)
      console.log(`🚪 [UnifiedAuth] Signing out from ${authType}...`)

      if (authType === 'service') {
        await authServiceApi.signOut()
        // Clear tokens
        localStorage.removeItem('auth_token')
        localStorage.removeItem('refresh_token')
        sessionStorage.removeItem('auth_token')
        sessionStorage.removeItem('refresh_token')
      } else {
        await supabaseAuth.signOut()
        sessionManager.clearSession()
      }

      setUser(null)
      setError(null)
      console.log('✅ [UnifiedAuth] Sign out successful')
      router.replace('/auth/login')
    } catch (err: any) {
      console.error('❌ [UnifiedAuth] Sign out failed:', err)
      setError(err.message || 'Sign out failed')
    } finally {
      setLoading(false)
    }
  }

  // Refresh user data
  const refreshUser = async () => {
    try {
      if (authType === 'service') {
        await initializeAuthService()
      } else {
        await initializeSupabaseAuth()
      }
    } catch (err: any) {
      console.error('❌ [UnifiedAuth] Failed to refresh user:', err)
      setError(err.message || 'Failed to refresh user data')
    }
  }

  // Switch auth type
  const switchAuthType = (type: AuthType) => {
    console.log(`🔄 [UnifiedAuth] Switching auth type to: ${type}`)
    setAuthType(type)
    setUser(null)
    setError(null)
  }

  // Change password
  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ error: string | null }> => {
    try {
      if (authType === 'service') {
        // TODO: Implement auth service change password
        return { error: 'Change password not implemented for auth service yet' }
      } else {
        return await supabaseAuth.changePassword(currentPassword, newPassword)
      }
    } catch (err: any) {
      console.error('❌ [UnifiedAuth] Change password failed:', err)
      return { error: err.message || 'Failed to change password' }
    }
  }

  // Reset password
  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    try {
      if (authType === 'service') {
        // TODO: Implement auth service reset password
        return { error: 'Reset password not implemented for auth service yet' }
      } else {
        return await supabaseAuth.resetPassword(email)
      }
    } catch (err: any) {
      console.error('❌ [UnifiedAuth] Reset password failed:', err)
      return { error: err.message || 'Failed to reset password' }
    }
  }

  // Update password (for reset password flow)
  const updatePassword = async (newPassword: string): Promise<{ error: string | null }> => {
    try {
      if (authType === 'service') {
        // TODO: Implement auth service update password
        return { error: 'Update password not implemented for auth service yet' }
      } else {
        return await supabaseAuth.updatePassword(newPassword)
      }
    } catch (err: any) {
      console.error('❌ [UnifiedAuth] Update password failed:', err)
      return { error: err.message || 'Failed to update password' }
    }
  }

  // Get Supabase client for advanced operations
  const getSupabaseClient = () => {
    return supabaseClient
  }

  // Role checking methods
  const hasRole = (role: string): boolean => {
    return user?.role === role
  }

  const hasAnyRole = (roles: string[]): boolean => {
    return user ? roles.includes(user.role) : false
  }

  const clearError = () => {
    setError(null)
  }

  const isAuthenticated = !!user

  const value: UnifiedAuthContextType = {
    user,
    loading,
    error,
    isAuthenticated,
    authType,
    signIn,
    signUp,
    signOut,
    refreshUser,
    clearError,
    hasRole,
    hasAnyRole,
    switchAuthType,
    changePassword,
    resetPassword,
    updatePassword,
    getSupabaseClient
  }

  // Don't render children until auth is initialized
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang khởi tạo hệ thống xác thực...</p>
        </div>
      </div>
    )
  }

  return (
    <UnifiedAuthContext.Provider value={value}>
      {children}
    </UnifiedAuthContext.Provider>
  )
}

export function useUnifiedAuth() {
  const context = useContext(UnifiedAuthContext)
  if (context === undefined) {
    throw new Error('useUnifiedAuth must be used within a UnifiedAuthProvider')
  }
  return context
}

// Export for convenience
export default UnifiedAuthProvider
