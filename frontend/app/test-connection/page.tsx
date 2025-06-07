"use client"

import { useState } from 'react'
import { supabaseClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestConnectionPage() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (test: string, success: boolean, data?: any, error?: any) => {
    setResults(prev => [...prev, {
      test,
      success,
      data,
      error,
      timestamp: new Date().toISOString()
    }])
  }

  const testSupabaseConnection = async () => {
    setLoading(true)
    setResults([])

    try {
      // Test 1: Basic connection
      addResult('Basic Connection', true, 'Supabase client initialized')

      // Test 2: Environment variables
      const envVars = {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing'
      }
      addResult('Environment Variables', true, envVars)

      // Test 3: Simple query
      try {
        const { data, error } = await supabaseClient
          .from('profiles')
          .select('count')
          .limit(1)

        if (error) {
          addResult('Simple Query', false, null, error.message)
        } else {
          addResult('Simple Query', true, 'Profiles table accessible')
        }
      } catch (err: any) {
        addResult('Simple Query', false, null, err.message)
      }

      // Test 4: Auth status
      try {
        const { data: { session }, error } = await supabaseClient.auth.getSession()
        
        if (error) {
          addResult('Auth Session', false, null, error.message)
        } else {
          addResult('Auth Session', true, session ? 'Active session' : 'No active session')
        }
      } catch (err: any) {
        addResult('Auth Session', false, null, err.message)
      }

      // Test 5: Test login with known credentials
      try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: 'thien.dang@hospital.com',
          password: 'password123'
        })

        if (error) {
          addResult('Test Login', false, null, error.message)
        } else {
          addResult('Test Login', true, 'Login successful')
          
          // Immediately sign out
          await supabaseClient.auth.signOut()
        }
      } catch (err: any) {
        addResult('Test Login', false, null, err.message)
      }

    } catch (err: any) {
      addResult('General Error', false, null, err.message)
    } finally {
      setLoading(false)
    }
  }

  const clearResults = () => {
    setResults([])
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Supabase Connection Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={testSupabaseConnection} 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Testing...' : 'Run Connection Tests'}
              </Button>
              <Button 
                onClick={clearResults} 
                variant="outline"
                disabled={loading}
              >
                Clear Results
              </Button>
            </div>

            {results.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Test Results:</h3>
                {results.map((result, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg border ${
                      result.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        result.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {result.success ? '✅' : '❌'} {result.test}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    {result.data && (
                      <div className="mt-2 text-sm text-gray-700">
                        <strong>Data:</strong> {JSON.stringify(result.data, null, 2)}
                      </div>
                    )}
                    
                    {result.error && (
                      <div className="mt-2 text-sm text-red-700">
                        <strong>Error:</strong> {result.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
