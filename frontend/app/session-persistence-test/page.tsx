"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth/auth-wrapper"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, User, Clock, CheckCircle, XCircle } from "lucide-react"

export default function SessionPersistenceTest() {
  const { user, loading, isAuthenticated, refreshUser } = useAuth()
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  useEffect(() => {
    checkSessionInfo()
  }, [user])

  const checkSessionInfo = () => {
    const authToken = localStorage.getItem('auth_token')
    const refreshToken = localStorage.getItem('refresh_token')
    const userData = localStorage.getItem('user_data')
    
    setSessionInfo({
      hasAuthToken: !!authToken,
      hasRefreshToken: !!refreshToken,
      hasUserData: !!userData,
      authTokenLength: authToken?.length || 0,
      refreshTokenLength: refreshToken?.length || 0,
      userDataParsed: userData ? JSON.parse(userData) : null
    })
    setLastRefresh(new Date())
  }

  const handleRefreshUser = async () => {
    await refreshUser()
    checkSessionInfo()
  }

  const handleClearSession = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_data')
    checkSessionInfo()
  }

  const handleReload = () => {
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Session Persistence Test
          </h1>
          <p className="text-gray-600">
            Test session persistence across page reloads and tab closes
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Authentication Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Authentication Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Authenticated:</span>
                <Badge variant={isAuthenticated ? "default" : "destructive"}>
                  {isAuthenticated ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <XCircle className="h-3 w-3 mr-1" />
                  )}
                  {isAuthenticated ? "Yes" : "No"}
                </Badge>
              </div>

              {user && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">User ID:</span>
                    <span className="text-sm text-gray-600 font-mono">
                      {user.id?.substring(0, 8)}...
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Email:</span>
                    <span className="text-sm text-gray-600">{user.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Role:</span>
                    <Badge variant="outline">{user.role}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Full Name:</span>
                    <span className="text-sm text-gray-600">{user.full_name}</span>
                  </div>
                </>
              )}

              <div className="pt-4 space-y-2">
                <Button onClick={handleRefreshUser} className="w-full" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh User Data
                </Button>
                <Button onClick={handleReload} variant="outline" className="w-full" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Session Storage Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Session Storage Info
                {lastRefresh && (
                  <span className="text-xs text-gray-500 ml-auto">
                    Last check: {lastRefresh.toLocaleTimeString()}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sessionInfo && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Auth Token:</span>
                    <Badge variant={sessionInfo.hasAuthToken ? "default" : "destructive"}>
                      {sessionInfo.hasAuthToken ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {sessionInfo.hasAuthToken ? `${sessionInfo.authTokenLength} chars` : "Missing"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Refresh Token:</span>
                    <Badge variant={sessionInfo.hasRefreshToken ? "default" : "destructive"}>
                      {sessionInfo.hasRefreshToken ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {sessionInfo.hasRefreshToken ? `${sessionInfo.refreshTokenLength} chars` : "Missing"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">User Data:</span>
                    <Badge variant={sessionInfo.hasUserData ? "default" : "destructive"}>
                      {sessionInfo.hasUserData ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {sessionInfo.hasUserData ? "Stored" : "Missing"}
                    </Badge>
                  </div>

                  {sessionInfo.userDataParsed && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-700 mb-2">Stored User Data:</p>
                      <pre className="text-xs text-gray-600 overflow-auto">
                        {JSON.stringify(sessionInfo.userDataParsed, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              )}

              <div className="pt-4 space-y-2">
                <Button onClick={checkSessionInfo} variant="outline" className="w-full" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check Session Info
                </Button>
                <Button onClick={handleClearSession} variant="destructive" className="w-full" size="sm">
                  <XCircle className="h-4 w-4 mr-2" />
                  Clear Session Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Test Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <p><strong>Test Session Persistence:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Make sure you're logged in and see "Authenticated: Yes" above</li>
                <li>Click "Reload Page" button - you should stay logged in</li>
                <li>Close this tab and open a new tab to the same URL - you should stay logged in</li>
                <li>Close the entire browser and reopen - you should stay logged in</li>
              </ol>
              
              <p className="mt-4"><strong>If session is lost:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Check if Auth Token and Refresh Token are present in storage</li>
                <li>Try clicking "Refresh User Data" to restore session</li>
                <li>If still failing, check browser console for errors</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
