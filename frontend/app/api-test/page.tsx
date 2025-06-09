"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { doctorsApi } from "@/lib/api/doctors"
import { appointmentsApi } from "@/lib/api/appointments"
import { patientsApi } from "@/lib/api/patients"

interface TestResult {
  name: string
  status: 'pending' | 'success' | 'error'
  data?: any
  error?: string
  duration?: number
}

export default function ApiTestPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const updateTestResult = (name: string, result: Partial<TestResult>) => {
    setTestResults(prev => {
      const index = prev.findIndex(r => r.name === name)
      if (index >= 0) {
        const updated = [...prev]
        updated[index] = { ...updated[index], ...result }
        return updated
      } else {
        return [...prev, { name, status: 'pending', ...result }]
      }
    })
  }

  const runTest = async (name: string, testFn: () => Promise<any>) => {
    const startTime = Date.now()
    updateTestResult(name, { status: 'pending' })
    
    try {
      const result = await testFn()
      const duration = Date.now() - startTime
      updateTestResult(name, { 
        status: 'success', 
        data: result, 
        duration 
      })
    } catch (error) {
      const duration = Date.now() - startTime
      updateTestResult(name, { 
        status: 'error', 
        error: error instanceof Error ? error.message : String(error),
        duration 
      })
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setTestResults([])

    // Test API Gateway Health
    await runTest('API Gateway Health', async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/health`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.json()
    })

    // Test Doctor Service Health
    await runTest('Doctor Service Health', async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/doctors`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.json()
    })

    // Test Doctors API
    await runTest('Get All Doctors', async () => {
      const result = await doctorsApi.getAll()
      return result
    })

    // Test Patients API
    await runTest('Get All Patients', async () => {
      const result = await patientsApi.getAll()
      return result
    })

    // Test Appointments API
    await runTest('Get All Appointments', async () => {
      const result = await appointmentsApi.getAll()
      return result
    })

    setIsRunning(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">API Connection Test</h1>
        <p className="text-gray-600">Test connectivity to backend services and APIs</p>
      </div>

      <div className="mb-6">
        <Button 
          onClick={runAllTests} 
          disabled={isRunning}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isRunning ? 'Running Tests...' : 'Run All Tests'}
        </Button>
      </div>

      <div className="space-y-4">
        {testResults.map((result, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">{result.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(result.status)}>
                    {result.status}
                  </Badge>
                  {result.duration && (
                    <span className="text-sm text-gray-500">{result.duration}ms</span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {result.status === 'pending' && (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-600">Running...</span>
                </div>
              )}
              
              {result.status === 'success' && result.data && (
                <div>
                  <p className="text-sm text-green-600 mb-2">✅ Success</p>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}
              
              {result.status === 'error' && (
                <div>
                  <p className="text-sm text-red-600 mb-2">❌ Error</p>
                  <p className="text-sm text-red-800 bg-red-50 p-2 rounded">
                    {result.error}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {testResults.length === 0 && !isRunning && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">Click "Run All Tests" to start testing API connectivity</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
