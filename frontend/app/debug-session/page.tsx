"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth/auth-wrapper"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SessionDebug } from "@/components/debug/SessionDebug"
import { RefreshCw, User, AlertCircle, CheckCircle, XCircle, Home } from "lucide-react"
import Link from "next/link"

export default function DebugSessionPage() {
  const { user, loading, isAuthenticated, refreshUser } = useAuth()
  const [testResults, setTestResults] = useState<any>(null)
  const [isRunningTests, setIsRunningTests] = useState(false)

  const runSessionTests = async () => {
    setIsRunningTests(true)
    
    // Test 1: Check if user data exists
    const hasUser = !!user
    const hasCorrectRole = user?.role === 'doctor'
    
    // Test 2: Check localStorage
    const authToken = localStorage.getItem('auth_token')
    const refreshToken = localStorage.getItem('refresh_token')
    const userData = localStorage.getItem('user_data')
    
    let storedUserData = null
    try {
      storedUserData = userData ? JSON.parse(userData) : null
    } catch (e) {
      console.error('Error parsing stored user data:', e)
    }
    
    // Test 3: Check if stored data matches current user
    const dataMatches = storedUserData && user && 
      storedUserData.id === user.id && 
      storedUserData.role === user.role
    
    const results = {
      hasUser,
      hasCorrectRole,
      hasAuthToken: !!authToken,
      hasRefreshToken: !!refreshToken,
      hasStoredUserData: !!userData,
      storedUserData,
      dataMatches,
      currentUser: user,
      timestamp: new Date().toISOString()
    }
    
    setTestResults(results)
    setIsRunningTests(false)
    
    console.log('🧪 Session Test Results:', results)
  }

  const handleReload = () => {
    window.location.reload()
  }

  const handleClearAndReload = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_data')
    window.location.reload()
  }

  useEffect(() => {
    if (!loading) {
      runSessionTests()
    }
  }, [user, loading])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session debug...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/doctors/dashboard">
              <Button variant="outline" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              Session Debug & Test
            </h1>
          </div>
          <p className="text-gray-600">
            Debug session persistence and authentication state
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Session Debug Component */}
          <div className="lg:col-span-1">
            <SessionDebug />
          </div>

          {/* Test Results */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Session Test Results
                  </div>
                  <Button 
                    onClick={runSessionTests} 
                    disabled={isRunningTests}
                    size="sm"
                  >
                    {isRunningTests ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Run Tests
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {testResults && (
                  <>
                    {/* Test Status */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Has User:</span>
                        <Badge variant={testResults.hasUser ? "default" : "destructive"}>
                          {testResults.hasUser ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {testResults.hasUser ? "Yes" : "No"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Doctor Role:</span>
                        <Badge variant={testResults.hasCorrectRole ? "default" : "destructive"}>
                          {testResults.hasCorrectRole ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {testResults.hasCorrectRole ? "Yes" : "No"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Auth Token:</span>
                        <Badge variant={testResults.hasAuthToken ? "default" : "destructive"}>
                          {testResults.hasAuthToken ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {testResults.hasAuthToken ? "Stored" : "Missing"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Data Match:</span>
                        <Badge variant={testResults.dataMatches ? "default" : "destructive"}>
                          {testResults.dataMatches ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {testResults.dataMatches ? "Match" : "Mismatch"}
                        </Badge>
                      </div>
                    </div>

                    {/* Current User Info */}
                    {testResults.currentUser && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-sm mb-2">Current User:</h4>
                        <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
                          <div>ID: {testResults.currentUser.id?.substring(0, 8)}...</div>
                          <div>Email: {testResults.currentUser.email}</div>
                          <div>Role: {testResults.currentUser.role}</div>
                          <div>Name: {testResults.currentUser.full_name}</div>
                        </div>
                      </div>
                    )}

                    {/* Stored User Info */}
                    {testResults.storedUserData && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-sm mb-2">Stored User Data:</h4>
                        <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
                          <div>ID: {testResults.storedUserData.id?.substring(0, 8)}...</div>
                          <div>Email: {testResults.storedUserData.email}</div>
                          <div>Role: {testResults.storedUserData.role}</div>
                          <div>Name: {testResults.storedUserData.full_name}</div>
                          {testResults.storedUserData.sessionTimestamp && (
                            <div>Stored: {new Date(testResults.storedUserData.sessionTimestamp).toLocaleString()}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Overall Status */}
                    <div className="border-t pt-4">
                      <div className="flex items-center gap-2">
                        {testResults.hasUser && testResults.hasCorrectRole && testResults.dataMatches ? (
                          <>
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="font-medium text-green-600">Session persistence is working correctly!</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <span className="font-medium text-red-600">Session persistence has issues</span>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Action Buttons */}
                <div className="border-t pt-4 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={handleReload} variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reload Page
                    </Button>
                    <Button onClick={handleClearAndReload} variant="destructive" size="sm">
                      <XCircle className="h-4 w-4 mr-2" />
                      Clear & Reload
                    </Button>
                  </div>
                  
                  <p className="text-xs text-gray-500 text-center">
                    Use "Reload Page" to test persistence, "Clear & Reload" to reset session
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
