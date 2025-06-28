"use client"

import { useAuth } from "@/lib/auth/auth-wrapper"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, User, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

export default function AuthTestPage() {
  const { user, loading, isAuthenticated, refreshUser } = useAuth()

  const handleRefresh = async () => {
    console.log('🔄 Refreshing user...')
    await refreshUser()
  }

  const handleReload = () => {
    window.location.reload()
  }

  const checkStoredData = () => {
    const authToken = localStorage.getItem('auth_token')
    const refreshToken = localStorage.getItem('refresh_token')
    const userData = localStorage.getItem('user_data')
    
    console.log('📦 Stored Data:', {
      hasAuthToken: !!authToken,
      hasRefreshToken: !!refreshToken,
      hasUserData: !!userData,
      authTokenLength: authToken?.length || 0,
      refreshTokenLength: refreshToken?.length || 0
    })
    
    if (userData) {
      try {
        const parsed = JSON.parse(userData)
        console.log('👤 Stored User:', parsed)
      } catch (e) {
        console.error('❌ Error parsing user data:', e)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading auth state...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/doctors/dashboard">
              <Button variant="outline" size="sm">
                ← Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              Auth State Test
            </h1>
          </div>
          <p className="text-gray-600">
            Check authentication state and session data
          </p>
        </div>

        <div className="space-y-6">
          {/* Auth Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Authentication Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Loading:</span>
                <Badge variant={loading ? "destructive" : "default"}>
                  {loading ? "Yes" : "No"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">Authenticated:</span>
                <Badge variant={isAuthenticated ? "default" : "destructive"}>
                  {isAuthenticated ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <XCircle className="h-3 w-3 mr-1" />
                  )}
                  {isAuthenticated ? "Yes" : "No"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">Has User:</span>
                <Badge variant={user ? "default" : "destructive"}>
                  {user ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <XCircle className="h-3 w-3 mr-1" />
                  )}
                  {user ? "Yes" : "No"}
                </Badge>
              </div>

              {user && (
                <>
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">User Details:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>ID:</span>
                        <span className="font-mono">{user.id?.substring(0, 8)}...</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Email:</span>
                        <span>{user.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Role:</span>
                        <Badge variant="outline">{user.role}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Full Name:</span>
                        <span>{user.full_name}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {!user && !loading && (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <p className="text-red-800 text-sm">
                      No user data found. You may need to log in again.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleRefresh} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh User
                </Button>
                <Button onClick={handleReload} variant="outline" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
              </div>
              
              <Button onClick={checkStoredData} variant="outline" className="w-full">
                Check Console Logs
              </Button>

              <div className="pt-3 border-t">
                <p className="text-xs text-gray-500 mb-2">Quick Navigation:</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/doctors/profile">Doctor Profile</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/debug-session">Debug Session</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role Check Test */}
          <Card>
            <CardHeader>
              <CardTitle>Role Check Test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Can access doctor profile:</span>
                  <Badge variant={user?.role === 'doctor' ? "default" : "destructive"}>
                    {user?.role === 'doctor' ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {user?.role === 'doctor' ? "Yes" : "No"}
                  </Badge>
                </div>

                {user?.role !== 'doctor' && user && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-sm">
                      Current role is "{user.role}" but doctor profile requires "doctor" role.
                    </p>
                  </div>
                )}

                {!user && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm">
                      No user data available. Please log in first.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
