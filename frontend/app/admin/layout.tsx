"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabaseAuth } from "@/lib/auth/supabase-auth"
import { Button } from "@/components/ui/button"
import { Hospital, LogOut, Loader2 } from "lucide-react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 [AdminLayout] Checking auth...')
        const { data } = await supabaseAuth.getCurrentUser()

        console.log('🔍 [AdminLayout] Current user data:', {
          hasData: !!data,
          hasUser: !!data?.user,
          hasProfile: !!data?.profile,
          role: data?.profile?.role,
          email: data?.user?.email
        })

        if (!data?.user || !data?.profile) {
          console.log('❌ [AdminLayout] No user or profile found, redirecting to login')
          router.push("/auth/login")
          return
        }

        if (data.profile.role !== "admin") {
          console.log(`❌ [AdminLayout] User role is ${data.profile.role}, redirecting to their dashboard`)
          router.push(`/${data.profile.role}/dashboard`)
          return
        }

        console.log('✅ [AdminLayout] Admin user authenticated')
        setUser(data)
        setLoading(false)
      } catch (error) {
        console.error('❌ [AdminLayout] Auth check failed:', error)
        router.push("/auth/login")
      }
    }

    checkAuth()
  }, [router])

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple clicks

    try {
      console.log('🚪 [AdminLayout] Button clicked - Starting logout...');
      setIsLoggingOut(true);

      const { error } = await supabaseAuth.signOut();

      if (error) {
        console.error('🚪 [AdminLayout] Logout error:', error);
        // Still redirect even if there's an error
      } else {
        console.log('🚪 [AdminLayout] Logout successful');
      }

      // Force redirect to login page
      console.log('🚪 [AdminLayout] Redirecting to login...');

      // Try multiple redirect methods
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      } else {
        router.push("/auth/login");
      }
    } catch (error) {
      console.error('🚪 [AdminLayout] Logout exception:', error);
      // Force redirect even on exception
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      } else {
        router.push("/auth/login");
      }
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Hospital className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Quản trị viên
                </h1>
                <p className="text-sm text-gray-500">
                  Chào mừng, {user.profile.full_name}
                </p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              disabled={isLoggingOut}
              className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang đăng xuất...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
