"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Hospital, LogOut, Loader2 } from "lucide-react"
import { EnhancedAdminGuard } from "@/lib/auth/enhanced-role-guard"
import { useEnhancedAuth } from "@/lib/auth/enhanced-auth-context"

export default function EnhancedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, signOut } = useEnhancedAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return

    try {
      console.log('🚪 [EnhancedAdminLayout] Starting logout...')
      setIsLoggingOut(true)
      await signOut()
    } catch (error) {
      console.error('🚪 [EnhancedAdminLayout] Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <EnhancedAdminGuard>
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
                    Chào mừng, {user?.full_name || 'Admin'}
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
    </EnhancedAdminGuard>
  )
}
