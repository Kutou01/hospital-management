"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, Zap } from 'lucide-react'

export default function SimpleApiTest() {
  const [testResults, setTestResults] = useState<any[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const addResult = (test: string, status: 'success' | 'error', message: string, data?: any) => {
    setTestResults(prev => [...prev, { test, status, message, data, timestamp: new Date().toISOString() }])
  }

  const clearResults = () => {
    setTestResults([])
  }

  // Test 1: Direct Patient Service (bypass API Gateway)
  const testPatientServiceDirect = async () => {
    try {
      addResult('Direct Patient Service', 'success', 'Testing http://localhost:3003/api/patients')
      
      const response = await fetch('http://localhost:3003/api/patients', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const responseText = await response.text()
      addResult('Patient Service Response', response.ok ? 'success' : 'error', 
        `HTTP ${response.status}: ${response.statusText}`, responseText)

      if (response.ok) {
        try {
          const data = JSON.parse(responseText)
          addResult('Patient Service Data', 'success', 'Response parsed successfully', data)
        } catch (parseError) {
          addResult('Patient Service Parse', 'error', 'Failed to parse JSON', responseText)
        }
      }

      return response.ok
    } catch (error) {
      addResult('Patient Service Error', 'error', error instanceof Error ? error.message : 'Unknown error')
      return false
    }
  }

  // Test 2: API Gateway without auth
  const testApiGatewayNoAuth = async () => {
    try {
      addResult('API Gateway No Auth', 'success', 'Testing http://localhost:3100/api/patients (no auth)')
      
      const response = await fetch('http://localhost:3100/api/patients', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const responseText = await response.text()
      addResult('API Gateway Response (No Auth)', response.ok ? 'success' : 'error', 
        `HTTP ${response.status}: ${response.statusText}`, responseText)

      return response.ok
    } catch (error) {
      addResult('API Gateway Error (No Auth)', 'error', error instanceof Error ? error.message : 'Unknown error')
      return false
    }
  }

  // Test 3: API Gateway with fake token
  const testApiGatewayFakeToken = async () => {
    try {
      addResult('API Gateway Fake Token', 'success', 'Testing with fake Bearer token')
      
      const response = await fetch('http://localhost:3100/api/patients', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer fake-token-for-testing'
        }
      })

      const responseText = await response.text()
      addResult('API Gateway Response (Fake Token)', response.ok ? 'success' : 'error', 
        `HTTP ${response.status}: ${response.statusText}`, responseText)

      return response.ok
    } catch (error) {
      addResult('API Gateway Error (Fake Token)', 'error', error instanceof Error ? error.message : 'Unknown error')
      return false
    }
  }

  // Test 4: Auth Service verify endpoint
  const testAuthVerifyEndpoint = async () => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
      
      if (!token) {
        addResult('Auth Verify', 'error', 'No token found in localStorage')
        return false
      }

      addResult('Auth Verify', 'success', `Testing auth verify with real token: ${token.substring(0, 20)}...`)
      
      const response = await fetch('http://localhost:3001/api/auth/verify', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      const responseText = await response.text()
      addResult('Auth Verify Response', response.ok ? 'success' : 'error', 
        `HTTP ${response.status}: ${response.statusText}`, responseText)

      if (response.ok) {
        try {
          const data = JSON.parse(responseText)
          addResult('Auth Verify Data', 'success', 'Auth verification successful', data)
        } catch (parseError) {
          addResult('Auth Verify Parse', 'error', 'Failed to parse auth response', responseText)
        }
      }

      return response.ok
    } catch (error) {
      addResult('Auth Verify Error', 'error', error instanceof Error ? error.message : 'Unknown error')
      return false
    }
  }

  // Test 5: API Gateway with real token
  const testApiGatewayRealToken = async () => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
      
      if (!token) {
        addResult('API Gateway Real Token', 'error', 'No token found in localStorage')
        return false
      }

      addResult('API Gateway Real Token', 'success', `Testing with real token: ${token.substring(0, 20)}...`)
      
      const response = await fetch('http://localhost:3100/api/patients?page=1&limit=5', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      const responseText = await response.text()
      addResult('API Gateway Response (Real Token)', response.ok ? 'success' : 'error', 
        `HTTP ${response.status}: ${response.statusText}`, responseText)

      if (response.ok) {
        try {
          const data = JSON.parse(responseText)
          addResult('API Gateway Data (Real Token)', 'success', 'Response parsed successfully', data)
        } catch (parseError) {
          addResult('API Gateway Parse (Real Token)', 'error', 'Failed to parse JSON', responseText)
        }
      }

      return response.ok
    } catch (error) {
      addResult('API Gateway Error (Real Token)', 'error', error instanceof Error ? error.message : 'Unknown error')
      return false
    }
  }

  // Run all simple tests
  const runSimpleTests = async () => {
    setIsRunning(true)
    clearResults()

    addResult('Simple Test Session', 'success', 'Starting simple API tests...')

    // Test direct Patient Service (should work)
    await testPatientServiceDirect()
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Test API Gateway without auth (should fail with 401)
    await testApiGatewayNoAuth()
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Test API Gateway with fake token (should fail with 401)
    await testApiGatewayFakeToken()
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Test auth verify endpoint
    await testAuthVerifyEndpoint()
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Test API Gateway with real token (this is where the 500 error happens)
    await testApiGatewayRealToken()

    setIsRunning(false)
    addResult('Simple Test Session', 'success', 'Simple tests completed!')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Simple API Tests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={runSimpleTests} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Run Simple Tests
            </Button>
            
            <Button 
              variant="outline" 
              onClick={clearResults}
              disabled={isRunning}
            >
              Clear Results
            </Button>
          </div>

          <div className="text-sm text-gray-600">
            <p>This will test:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Direct Patient Service call (bypass API Gateway)</li>
              <li>API Gateway without authentication</li>
              <li>API Gateway with fake token</li>
              <li>Auth Service token verification</li>
              <li>API Gateway with real token</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Simple Test Results ({testResults.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border ${
                  result.status === 'success' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {result.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-medium">{result.test}</span>
                  </div>
                  <Badge 
                    variant={result.status === 'success' ? 'default' : 'destructive'}
                  >
                    {result.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                {result.data && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 cursor-pointer">
                      View Response Data
                    </summary>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-40">
                      {typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
            
            {testResults.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                No test results yet. Click "Run Simple Tests" to start.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
