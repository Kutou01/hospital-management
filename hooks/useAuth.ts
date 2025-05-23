"use client"

import { useState, useEffect } from 'react'

export type UserRole = 'admin' | 'doctor' | 'patient'

export interface User {
  user_id: string
  email: string
  role: UserRole
  full_name: string
  phone_number?: string
  is_active: boolean
  profile_id?: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Kiểm tra authentication từ cookies
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        const authToken = getCookie('auth_token')
        const userRole = getCookie('user_role') as UserRole
        const userEmail = getCookie('user_email')
        const userId = getCookie('user_id')
        const userName = getCookie('user_name')

        if (authToken && userRole && userEmail && userId && userName) {
          setUser({
            user_id: userId,
            email: userEmail,
            role: userRole,
            full_name: decodeURIComponent(userName),
            is_active: true
          })
        } else {
          setUser(null)
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const logout = () => {
    // Xóa cookies
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    document.cookie = 'user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    document.cookie = 'user_email=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    document.cookie = 'user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    document.cookie = 'user_name=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'

    setUser(null)

    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login'
    }
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout
  }
}

// Helper function để lấy cookie
function getCookie(name: string): string | null {
  if (typeof window === 'undefined') return null

  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null
  }
  return null
}
