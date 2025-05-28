"use client"

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseAuth, HospitalUser } from './supabase-auth'

interface AuthContextType {
  user: HospitalUser | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<HospitalUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()
  const initRef = useRef(false)

  // Initialize auth state
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    const initializeAuth = async () => {
      try {
        console.log('🔄 [AuthProvider] Initializing auth state...')
        const result = await supabaseAuth.getCurrentUser()
        
        console.log('🔄 [AuthProvider] Initial auth result:', {
          hasError: !!result.error,
          hasUser: !!result.user,
          role: result.user?.role
        })

        if (result.user && !result.error) {
          setUser(result.user)
        } else if (result.error) {
          setError(result.error)
        }
      } catch (err) {
        console.error('❌ [AuthProvider] Failed to initialize auth:', err)
        setError('Failed to initialize authentication')
      } finally {
        setLoading(false)
        setIsInitialized(true)
      }
    }

    initializeAuth()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await supabaseAuth.signIn({ email, password })
      
      if (result.error) {
        setError(result.error)
        throw new Error(result.error)
      }
      
      if (result.user) {
        setUser(result.user)
        
        // Navigate to appropriate dashboard
        const redirectPath = `/${result.user.role}/dashboard`
        router.replace(redirectPath)
      }
    } catch (err) {
      console.error('❌ [AuthProvider] Sign in failed:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      await supabaseAuth.signOut()
      setUser(null)
      setError(null)
      router.replace('/auth/login')
    } catch (err) {
      console.error('❌ [AuthProvider] Sign out failed:', err)
      setError('Failed to sign out')
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async () => {
    try {
      const result = await supabaseAuth.getCurrentUser()
      
      if (result.user && !result.error) {
        setUser(result.user)
        setError(null)
      } else {
        setUser(null)
        if (result.error) {
          setError(result.error)
        }
      }
    } catch (err) {
      console.error('❌ [AuthProvider] Failed to refresh user:', err)
      setUser(null)
      setError('Failed to refresh user data')
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signOut,
    refreshUser
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
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
