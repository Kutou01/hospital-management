"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, User, Plus } from 'lucide-react'
import { patientsApi, CreatePatientDto } from '@/lib/api/patients'
import { useAuth } from '@/lib/auth/auth-wrapper'
import { useToast } from '@/components/ui/toast-provider'

interface TestResult {
  test: string
  status: 'pending' | 'success' | 'error'
  message: string
  data?: any
  duration?: number
}

export default function PatientApiTest() {
  const { user, isAuthenticated } = useAuth()
  const { showToast } = useToast()
  
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState<string>('')
  
  // Test data for creating patient
  const testPatientData: CreatePatientDto = {
    profile_id: user?.id || '',
    full_name: 'Nguyễn Văn Test',
    date_of_birth: '1990-01-01',
    gender: 'male',
    blood_type: 'O+',
    address: {
      street: '123 Test Street',
      district: 'Test District',
      city: 'Ho Chi Minh City'
    },
    emergency_contact: {
      name: 'Nguyễn Thị Emergency',
      phone: '0987654321',
      relationship: 'spouse'
    },
    medical_history: 'No significant medical history',
    allergies: ['penicillin'],
    notes: 'Test patient created by API integration test'
  }

  const addTestResult = (test: string, status: 'success' | 'error', message: string, data?: any, duration?: number) => {
    setTestResults(prev => [...prev, { test, status, message, data, duration }])
  }

  const clearResults = () => {
    setTestResults([])
  }

  // Test 1: Get All Patients
  const testGetAllPatients = async () => {
    const startTime = Date.now()
    try {
      const response = await patientsApi.getAll({ page: 1, limit: 10 })
      const duration = Date.now() - startTime
      
      if (response.success && response.data) {
        // Handle paginated response
        const paginatedData = response.data as any
        const patientList = paginatedData.data || paginatedData
        
        const count = Array.isArray(patientList) ? patientList.length : 0
        const total = paginatedData.pagination?.total || count
        
        addTestResult(
          'GET /api/patients',
          'success',
          `Retrieved ${count} patients (Total: ${total})`,
          response.data,
          duration
        )
      } else {
        addTestResult(
          'GET /api/patients',
          'error',
          response.error?.message || 'Failed to get patients',
          response,
          duration
        )
      }
    } catch (error) {
      const duration = Date.now() - startTime
      addTestResult(
        'GET /api/patients',
        'error',
        error instanceof Error ? error.message : 'Unknown error',
        error,
        duration
      )
    }
  }

  // Test 2: Create Patient
  const testCreatePatient = async () => {
    const startTime = Date.now()
    try {
      const response = await patientsApi.create(testPatientData)
      const duration = Date.now() - startTime
      
      if (response.success && response.data) {
        setSelectedPatientId(response.data.patient_id)
        addTestResult(
          'POST /api/patients',
          'success',
          `Created patient with ID: ${response.data.patient_id}`,
          response.data,
          duration
        )
      } else {
        addTestResult(
          'POST /api/patients',
          'error',
          response.error?.message || 'Failed to create patient',
          response,
          duration
        )
      }
    } catch (error) {
      const duration = Date.now() - startTime
      addTestResult(
        'POST /api/patients',
        'error',
        error instanceof Error ? error.message : 'Unknown error',
        error,
        duration
      )
    }
  }

  // Test 3: Get Patient by ID
  const testGetPatientById = async () => {
    if (!selectedPatientId) {
      addTestResult('GET /api/patients/:id', 'error', 'No patient ID selected', null)
      return
    }

    const startTime = Date.now()
    try {
      const response = await patientsApi.getById(selectedPatientId)
      const duration = Date.now() - startTime
      
      if (response.success && response.data) {
        addTestResult(
          'GET /api/patients/:id',
          'success',
          `Retrieved patient: ${response.data.patient_id}`,
          response.data,
          duration
        )
      } else {
        addTestResult(
          'GET /api/patients/:id',
          'error',
          response.error?.message || 'Failed to get patient',
          response,
          duration
        )
      }
    } catch (error) {
      const duration = Date.now() - startTime
      addTestResult(
        'GET /api/patients/:id',
        'error',
        error instanceof Error ? error.message : 'Unknown error',
        error,
        duration
      )
    }
  }

  // Test 4: Update Patient
  const testUpdatePatient = async () => {
    if (!selectedPatientId) {
      addTestResult('PUT /api/patients/:id', 'error', 'No patient ID selected', null)
      return
    }

    const startTime = Date.now()
    const updateData = {
      notes: `Updated at ${new Date().toISOString()}`
    }

    try {
      const response = await patientsApi.update(selectedPatientId, updateData)
      const duration = Date.now() - startTime
      
      if (response.success && response.data) {
        addTestResult(
          'PUT /api/patients/:id',
          'success',
          `Updated patient: ${response.data.patient_id}`,
          response.data,
          duration
        )
      } else {
        addTestResult(
          'PUT /api/patients/:id',
          'error',
          response.error?.message || 'Failed to update patient',
          response,
          duration
        )
      }
    } catch (error) {
      const duration = Date.now() - startTime
      addTestResult(
        'PUT /api/patients/:id',
        'error',
        error instanceof Error ? error.message : 'Unknown error',
        error,
        duration
      )
    }
  }

  // Test 5: Search Patients
  const testSearchPatients = async () => {
    const startTime = Date.now()
    try {
      const response = await patientsApi.search('Test')
      const duration = Date.now() - startTime
      
      if (response.success && response.data) {
        const results = Array.isArray(response.data) ? response.data : []
        addTestResult(
          'GET /api/patients/search',
          'success',
          `Found ${results.length} patients matching "Test"`,
          response.data,
          duration
        )
      } else {
        addTestResult(
          'GET /api/patients/search',
          'error',
          response.error?.message || 'Failed to search patients',
          response,
          duration
        )
      }
    } catch (error) {
      const duration = Date.now() - startTime
      addTestResult(
        'GET /api/patients/search',
        'error',
        error instanceof Error ? error.message : 'Unknown error',
        error,
        duration
      )
    }
  }

  // Run all tests
  const runAllTests = async () => {
    setIsRunning(true)
    clearResults()
    
    showToast("🧪 Testing", "Starting Patient API integration tests...", "info")
    
    await testGetAllPatients()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await testCreatePatient()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await testGetPatientById()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await testUpdatePatient()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await testSearchPatients()
    
    setIsRunning(false)
    showToast("✅ Complete", "Patient API tests completed!", "success")
  }

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              You must be logged in to test Patient APIs
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Patient Service API Integration Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Run All Tests
            </Button>
            
            <Button 
              variant="outline" 
              onClick={clearResults}
              disabled={isRunning}
            >
              Clear Results
            </Button>
            
            <Badge variant="outline">
              User: {user?.role} | {user?.full_name}
            </Badge>
          </div>

          {selectedPatientId && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Selected Patient ID: <code>{selectedPatientId}</code>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results ({testResults.length})</CardTitle>
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
                    <code className="font-mono text-sm">{result.test}</code>
                    {result.duration && (
                      <Badge variant="outline" className="text-xs">
                        {result.duration}ms
                      </Badge>
                    )}
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
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
            
            {testResults.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                No test results yet. Click "Run All Tests" to start.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
