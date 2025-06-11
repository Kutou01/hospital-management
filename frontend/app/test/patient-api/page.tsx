"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, TestTube, Database, Server } from 'lucide-react'
import PatientApiTest from '@/components/test/PatientApiTest'
import { useAuth } from '@/lib/auth/auth-wrapper'

export default function PatientApiTestPage() {
  const { user, isAuthenticated } = useAuth()

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Patient API Integration Test</h1>
          <p className="text-gray-600 mt-2">
            Test Patient Service APIs and verify frontend-backend integration
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <TestTube className="h-4 w-4" />
          Integration Testing
        </Badge>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium">Frontend</p>
                <p className="text-sm text-gray-600">Next.js App Running</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div>
                <p className="font-medium">API Gateway</p>
                <p className="text-sm text-gray-600">Port 3100</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div>
                <p className="font-medium">Patient Service</p>
                <p className="text-sm text-gray-600">Port 3003</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authentication Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Authentication Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isAuthenticated ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium">Authenticated</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">User ID:</span>
                  <code className="ml-2 bg-gray-100 px-2 py-1 rounded">{user?.id}</code>
                </div>
                <div>
                  <span className="text-gray-600">Role:</span>
                  <Badge variant="outline" className="ml-2">{user?.role}</Badge>
                </div>
                <div>
                  <span className="text-gray-600">Name:</span>
                  <span className="ml-2">{user?.full_name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <span className="ml-2">{user?.email}</span>
                </div>
              </div>
            </div>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Please log in to test Patient APIs. Authentication is required for all Patient Service endpoints.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Test Coverage Info */}
      <Card>
        <CardHeader>
          <CardTitle>Test Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">API Endpoints Tested:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">GET</Badge>
                  <code>/api/patients</code>
                  <span className="text-gray-600">- Get all patients</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">POST</Badge>
                  <code>/api/patients</code>
                  <span className="text-gray-600">- Create patient</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">GET</Badge>
                  <code>/api/patients/:id</code>
                  <span className="text-gray-600">- Get patient by ID</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">PUT</Badge>
                  <code>/api/patients/:id</code>
                  <span className="text-gray-600">- Update patient</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">GET</Badge>
                  <code>/api/patients/search</code>
                  <span className="text-gray-600">- Search patients</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Features Tested:</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Authentication flow via API Gateway</li>
                <li>• Department-based ID generation</li>
                <li>• CRUD operations with validation</li>
                <li>• Search and filtering functionality</li>
                <li>• Error handling and responses</li>
                <li>• Response time measurement</li>
                <li>• Data structure validation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Test Component */}
      <PatientApiTest />

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use This Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium">Prerequisites:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
                <li>Make sure you are logged in with a valid account</li>
                <li>Ensure API Gateway is running on port 3100</li>
                <li>Ensure Patient Service is running on port 3003</li>
                <li>Database should be accessible and properly configured</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium">Running Tests:</h4>
              <ol className="list-decimal list-inside space-y-1 text-gray-600 ml-4">
                <li>Click "Run All Tests" to execute all Patient API tests</li>
                <li>Monitor the test results in real-time</li>
                <li>Check response times and data structures</li>
                <li>Verify that department-based IDs are generated correctly</li>
                <li>Review any error messages for debugging</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium">Expected Results:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
                <li>All tests should pass with green status</li>
                <li>Response times should be under 500ms</li>
                <li>Patient IDs should follow format: PAT-YYYYMM-XXX</li>
                <li>Created patient should be retrievable by ID</li>
                <li>Search should return relevant results</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
