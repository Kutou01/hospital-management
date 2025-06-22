'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// Enhanced Auth Types
export interface EnhancedAuthUser extends User {
  profile?: {
    id: string
    full_name: string
    role: 'admin' | 'doctor' | 'patient'
    phone_number?: string
    is_active: boolean
    created_at: string
  }
}

export interface AuthState {
  user: EnhancedAuthUser | null
  loading: boolean
  isAuthenticated: boolean
  userRole: 'admin' | 'doctor' | 'patient' | null
}

export interface AuthMethods {
  // Email/Password Authentication
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUpWithEmail: (email: string, password: string, userData: any) => Promise<{ success: boolean; error?: string }>
  
  // Magic Link Authentication
  signInWithMagicLink: (email: string) => Promise<{ success: boolean; error?: string }>
  
  // Phone/SMS OTP Authentication
  signInWithPhone: (phone: string) => Promise<{ success: boolean; error?: string }>
  verifyOTP: (phone: string, otp: string) => Promise<{ success: boolean; error?: string }>
  
  // OAuth Authentication
  signInWithOAuth: (provider: 'google' | 'facebook' | 'github') => Promise<{ success: boolean; error?: string }>
  
  // Session Management
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  
  // Account Management
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>
  updateProfile: (updates: Partial<EnhancedAuthUser['profile']>) => Promise<{ success: boolean; error?: string }>
}

export interface EnhancedAuthContextType extends AuthState, AuthMethods {
  // Device & Security
  deviceInfo: {
    id: string
    name: string
    lastSeen: Date
    isCurrentDevice: boolean
  }[]
  
  // Session Analytics
  sessionInfo: {
    loginTime: Date
    lastActivity: Date
    ipAddress: string
    userAgent: string
  } | null
}

const EnhancedAuthContext = createContext<EnhancedAuthContextType | undefined>(undefined)

export const EnhancedAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State Management
  const [user, setUser] = useState<EnhancedAuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [deviceInfo, setDeviceInfo] = useState<any[]>([])
  const [sessionInfo, setSessionInfo] = useState<any>(null)

  // Computed Properties
  const isAuthenticated = !!user
  const userRole = user?.profile?.role || null

  // Initialize Auth State
  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Session error:', error)
        setLoading(false)
        return
      }

      if (session?.user) {
        await loadUserProfile(session.user)
        await loadSessionInfo()
        await loadDeviceInfo()
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
    } finally {
      setLoading(false)
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)
        
        if (session?.user) {
          await loadUserProfile(session.user)
          await loadSessionInfo()
        } else {
          setUser(null)
          setSessionInfo(null)
          setDeviceInfo([])
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }

  // Load User Profile with Role Information
  const loadUserProfile = async (authUser: User) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error) {
        console.error('Profile load error:', error)
        return
      }

      const enhancedUser: EnhancedAuthUser = {
        ...authUser,
        profile
      }

      setUser(enhancedUser)
    } catch (error) {
      console.error('Load profile error:', error)
    }
  }

  // Load Session Information
  const loadSessionInfo = async () => {
    try {
      const sessionData = {
        loginTime: new Date(),
        lastActivity: new Date(),
        ipAddress: 'Unknown', // Would need external service
        userAgent: navigator.userAgent
      }
      setSessionInfo(sessionData)
    } catch (error) {
      console.error('Load session info error:', error)
    }
  }

  // Load Device Information
  const loadDeviceInfo = async () => {
    try {
      // Mock device info - in real app would track devices
      const devices = [
        {
          id: 'current-device',
          name: `${navigator.platform} - ${navigator.userAgent.split(' ')[0]}`,
          lastSeen: new Date(),
          isCurrentDevice: true
        }
      ]
      setDeviceInfo(devices)
    } catch (error) {
      console.error('Load device info error:', error)
    }
  }

  // Email/Password Authentication
  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { success: false, error: error.message }
      }

      toast.success('Đăng nhập thành công!')
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const signUpWithEmail = async (email: string, password: string, userData: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      })

      if (error) {
        return { success: false, error: error.message }
      }

      toast.success('Đăng ký thành công! Vui lòng kiểm tra email để xác thực.')
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Magic Link Authentication
  const signInWithMagicLink = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        return { success: false, error: error.message }
      }

      toast.success('Magic link đã được gửi đến email của bạn!')
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Phone/SMS OTP Authentication
  const signInWithPhone = async (phone: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          channel: 'sms'
        }
      })

      if (error) {
        return { success: false, error: error.message }
      }

      toast.success('Mã OTP đã được gửi đến số điện thoại của bạn!')
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const verifyOTP = async (phone: string, otp: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms'
      })

      if (error) {
        return { success: false, error: error.message }
      }

      toast.success('Xác thực OTP thành công!')
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // OAuth Authentication
  const signInWithOAuth = async (provider: 'google' | 'facebook' | 'github') => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Session Management
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      toast.success('Đăng xuất thành công!')
    } catch (error: any) {
      toast.error('Lỗi đăng xuất: ' + error.message)
    }
  }

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) throw error
    } catch (error: any) {
      console.error('Refresh session error:', error)
    }
  }

  // Account Management
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        return { success: false, error: error.message }
      }

      toast.success('Email đặt lại mật khẩu đã được gửi!')
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        return { success: false, error: error.message }
      }

      toast.success('Mật khẩu đã được cập nhật!')
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const updateProfile = async (updates: Partial<EnhancedAuthUser['profile']>) => {
    try {
      if (!user?.id) {
        return { success: false, error: 'User not authenticated' }
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) {
        return { success: false, error: error.message }
      }

      // Reload user profile
      await loadUserProfile(user)
      toast.success('Thông tin đã được cập nhật!')
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Context Value
  const contextValue: EnhancedAuthContextType = {
    // State
    user,
    loading,
    isAuthenticated,
    userRole,
    deviceInfo,
    sessionInfo,
    
    // Methods
    signInWithEmail,
    signUpWithEmail,
    signInWithMagicLink,
    signInWithPhone,
    verifyOTP,
    signInWithOAuth,
    signOut,
    refreshSession,
    resetPassword,
    updatePassword,
    updateProfile
  }

  return (
    <EnhancedAuthContext.Provider value={contextValue}>
      {children}
    </EnhancedAuthContext.Provider>
  )
}

// Custom Hook
export const useEnhancedAuth = () => {
  const context = useContext(EnhancedAuthContext)
  if (context === undefined) {
    throw new Error('useEnhancedAuth must be used within an EnhancedAuthProvider')
  }
  return context
}

export default EnhancedAuthProvider
