"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react"

export default function TestAuthApiPage() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const testAuthApi = async () => {
    setLoading(true)
    const results: any = {}

    try {
      // Get token from localStorage
      const token = localStorage.getItem('auth_token')
      results.hasToken = !!token
      results.tokenPreview = token ? token.substring(0, 20) + '...' : null

      if (!token) {
        results.error = 'No auth token found in localStorage'
        setResults(results)
        setLoading(false)
        return
      }

      // Test Auth Service /me endpoint
      console.log('🔍 Testing Auth Service /me endpoint...')
      const response = await fetch('http://localhost:3001/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      results.authServiceStatus = response.status
      results.authServiceOk = response.ok

      if (response.ok) {
        const data = await response.json()
        results.authServiceData = data
        results.userFromAuthService = data.user
        console.log('✅ Auth Service response:', data)
      } else {
        const errorData = await response.text()
        results.authServiceError = errorData
        console.error('❌ Auth Service error:', errorData)
      }

      // Test current user data from context
      const userData = localStorage.getItem('user_data')
      if (userData) {
        try {
          results.storedUserData = JSON.parse(userData)
        } catch (e) {
          results.storedUserDataError = 'Invalid JSON in localStorage'
        }
      }

    } catch (error: any) {
      console.error('❌ Test error:', error)
      results.testError = error.message
    }

    setResults(results)
    setLoading(false)
  }

  const clearStorage = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_data')
    sessionStorage.removeItem('auth_token')
    sessionStorage.removeItem('refresh_token')
    sessionStorage.removeItem('user_data')
    setResults({})
    console.log('🗑️ Storage cleared')
  }

  const forceRefreshSession = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        console.error('No token found')
        return
      }

      // Get fresh data from Auth Service
      const response = await fetch('http://localhost:3001/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          // Force save the correct user data
          const userData = {
            ...data.user,
            sessionTimestamp: Date.now(),
            loginMethod: 'force_refresh',
            authType: 'service'
          }

          localStorage.setItem('user_data', JSON.stringify(userData))
          console.log('🔄 Force refreshed session with role:', data.user.role)

          // Reload to apply changes
          window.location.reload()
        }
      }
    } catch (error) {
      console.error('❌ Force refresh failed:', error)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Test Auth API</h1>
        <div className="flex gap-2">
          <Button onClick={() => window.location.href = '/debug-session'} variant="outline">
            Debug Session
          </Button>
          <Button onClick={() => window.location.href = '/fix-session'} variant="outline">
            Fix Session
          </Button>
        </div>
      </div>

      {/* Test Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Test Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={testAuthApi} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Auth API'
              )}
            </Button>
            <Button onClick={clearStorage} variant="outline">
              Clear Storage
            </Button>
            <Button onClick={forceRefreshSession} variant="outline">
              Force Refresh Session
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline">
              Reload Page
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {Object.keys(results).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Token Status */}
            <div>
              <h4 className="font-medium mb-2">Token Status:</h4>
              <div className="flex items-center gap-2">
                {results.hasToken ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <span>{results.hasToken ? 'Token found' : 'No token'}</span>
                {results.tokenPreview && (
                  <Badge variant="outline">{results.tokenPreview}</Badge>
                )}
              </div>
            </div>

            {/* Auth Service Response */}
            {results.authServiceStatus && (
              <div>
                <h4 className="font-medium mb-2">Auth Service Response:</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span>Status:</span>
                    <Badge variant={results.authServiceOk ? "default" : "destructive"}>
                      {results.authServiceStatus}
                    </Badge>
                  </div>
                  
                  {results.userFromAuthService && (
                    <div>
                      <span className="font-medium">User Data from Auth Service:</span>
                      <div className="bg-gray-50 p-3 rounded mt-2">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>ID: {results.userFromAuthService.id?.substring(0, 8)}...</div>
                          <div>Email: {results.userFromAuthService.email}</div>
                          <div>Role: 
                            <Badge variant={results.userFromAuthService.role === 'doctor' ? "default" : "destructive"} className="ml-1">
                              {results.userFromAuthService.role || 'EMPTY'}
                            </Badge>
                          </div>
                          <div>Name: {results.userFromAuthService.full_name}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {results.authServiceError && (
                    <div className="bg-red-50 p-3 rounded">
                      <span className="text-red-800 font-medium">Error:</span>
                      <pre className="text-red-700 text-xs mt-1">{results.authServiceError}</pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stored User Data */}
            {results.storedUserData && (
              <div>
                <h4 className="font-medium mb-2">Stored User Data:</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                    <div>Role: 
                      <Badge variant={results.storedUserData.role === 'doctor' ? "default" : "destructive"} className="ml-1">
                        {results.storedUserData.role || 'EMPTY'}
                      </Badge>
                    </div>
                    <div>Email: {results.storedUserData.email}</div>
                  </div>
                  <details>
                    <summary className="cursor-pointer text-sm font-medium">Full Data</summary>
                    <pre className="text-xs mt-2 overflow-auto">
                      {JSON.stringify(results.storedUserData, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            )}

            {/* Full Response */}
            {results.authServiceData && (
              <details>
                <summary className="cursor-pointer font-medium">Full Auth Service Response</summary>
                <pre className="text-xs mt-2 bg-gray-50 p-3 rounded overflow-auto">
                  {JSON.stringify(results.authServiceData, null, 2)}
                </pre>
              </details>
            )}

            {/* Errors */}
            {(results.error || results.testError) && (
              <div className="bg-red-50 border border-red-200 p-3 rounded">
                <div className="flex items-center gap-2 text-red-800 mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-red-700 text-sm">
                  {results.error || results.testError}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
