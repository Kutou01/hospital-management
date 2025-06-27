"use client"

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/auth-wrapper'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function DebugAuthPage() {
  const { user, authLoading } = useAuth()
  const [tokens, setTokens] = useState<any>({})
  const [apiTest, setApiTest] = useState<any>(null)

  useEffect(() => {
    // Check all stored tokens
    const authToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token')
    const userData = localStorage.getItem('user_data')
    
    setTokens({
      authToken: authToken ? `${authToken.substring(0, 20)}...` : 'None',
      refreshToken: refreshToken ? `${refreshToken.substring(0, 20)}...` : 'None',
      userData: userData ? JSON.parse(userData) : null
    })
  }, [])

  const testApiCall = async () => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
      const response = await fetch('http://localhost:3100/api/doctors/GEN-DOC-202506-480/schedule/today', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      setApiTest({ status: response.status, data, token: token ? `${token.substring(0, 20)}...` : 'None' })
    } catch (error) {
      setApiTest({ error: error.message })
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Authentication Debug</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Auth State</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Loading:</strong> {authLoading ? 'Yes' : 'No'}</p>
            <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'None'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stored Tokens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Auth Token:</strong> {tokens.authToken}</p>
            <p><strong>Refresh Token:</strong> {tokens.refreshToken}</p>
            <p><strong>User Data:</strong> {tokens.userData ? JSON.stringify(tokens.userData, null, 2) : 'None'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Test</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={testApiCall} className="mb-4">
            Test Schedule Today API
          </Button>
          {apiTest && (
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(apiTest, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
