"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authApi } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { User, LogOut, Loader2 } from "lucide-react"

export default function PatientLayout({
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
      const { data } = await authApi.getCurrentUser()

      if (!data?.user || !data?.profile) {
        router.push("/auth/login")
        return
      }

      if (data.profile.role !== "patient") {
        router.push(`/${data.profile.role}/dashboard`)
        return
      }

      setUser(data)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple clicks

    try {
      console.log('🚪 [PatientLayout] Button clicked - Starting logout...');
      setIsLoggingOut(true);

      const { error } = await authApi.signOut();

      if (error) {
        console.error('🚪 [PatientLayout] Logout error:', error);
        // Still redirect even if there's an error
      } else {
        console.log('🚪 [PatientLayout] Logout successful');
      }

      // Force redirect to login page
      console.log('🚪 [PatientLayout] Redirecting to login...');

      // Try multiple redirect methods
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      } else {
        router.push("/auth/login");
      }
    } catch (error) {
      console.error('🚪 [PatientLayout] Logout exception:', error);
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
              <div className="bg-purple-600 p-2 rounded-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Bệnh nhân
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
