"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabaseAuth } from "@/lib/hooks/useSupabaseAuth"
import { Button } from "@/components/ui/button"
import { Stethoscope, LogOut, Loader2 } from "lucide-react"

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, loading, signOut } = useSupabaseAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    // Only redirect if not loading and we have a definitive answer
    if (loading) {
      console.log('🏥 [DoctorLayout] Still loading auth state...')
      return
    }

    console.log('🏥 [DoctorLayout] Auth state loaded:', {
      hasUser: !!user,
      userRole: user?.role,
      isActive: user?.is_active
    })

    if (!user) {
      console.log('🏥 [DoctorLayout] No user, redirecting to login')
      router.push("/auth/login")
      return
    }

    if (user.role !== "doctor") {
      console.log('🏥 [DoctorLayout] User is not doctor, redirecting to:', `/${user.role}/dashboard`)
      router.push(`/${user.role}/dashboard`)
      return
    }

    console.log('🏥 [DoctorLayout] Doctor auth check passed')
  }, [user, loading, router])

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple clicks

    try {
      console.log('🚪 [DoctorLayout] Button clicked - Starting logout...');
      setIsLoggingOut(true);

      const { error } = await signOut();

      if (error) {
        console.error('🚪 [DoctorLayout] Logout error:', error);
      } else {
        console.log('🚪 [DoctorLayout] Logout successful');
      }

      // Redirect to login page
      console.log('🚪 [DoctorLayout] Redirecting to login...');
      router.push("/auth/login");
    } catch (error) {
      console.error('🚪 [DoctorLayout] Logout exception:', error);
      router.push("/auth/login");
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
              <div className="bg-green-600 p-2 rounded-lg">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Bác sĩ
                </h1>
                <p className="text-sm text-gray-500">
                  Chào mừng, BS. {user.full_name}
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
