"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, TestTube, Database, Server } from 'lucide-react'
import UnifiedPatientTest from '@/components/test/UnifiedPatientTest'
import { useAuth } from '@/lib/auth/auth-wrapper'

export default function PatientApiTestPage() {
  const { user, isAuthenticated } = useAuth()

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Patient API Complete Test Suite</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive testing for Patient Service - GET, POST, validation, and microservice architecture
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <TestTube className="h-4 w-4" />
          Complete Test Suite
        </Badge>
      </div>

      {/* Microservice Architecture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Microservice Architecture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium">Frontend</p>
                <p className="text-sm text-gray-600">Next.js App (Port 3000)</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <div>
                <p className="font-medium">Auth Service</p>
                <p className="text-sm text-gray-600">Registration (Port 3001)</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div>
                <p className="font-medium">API Gateway</p>
                <p className="text-sm text-gray-600">Routing (Port 3100)</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div>
                <p className="font-medium">Patient Service</p>
                <p className="text-sm text-gray-600">CRUD (Port 3003)</p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Service Responsibilities:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-purple-700">Auth Service:</span>
                <span className="text-gray-600 ml-2">User registration, authentication, patient creation</span>
              </div>
              <div>
                <span className="font-medium text-blue-700">Patient Service:</span>
                <span className="text-gray-600 ml-2">Patient data management, CRUD operations</span>
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
          <CardTitle>Complete Test Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium mb-3">GET Operations:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">GET</Badge>
                  <code>/health</code>
                  <span className="text-gray-600">- Service health check</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">GET</Badge>
                  <code>/api/patients</code>
                  <span className="text-gray-600">- Get all patients</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">GET</Badge>
                  <code>/api/patients/stats</code>
                  <span className="text-gray-600">- Patient statistics</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">GET</Badge>
                  <code>/api/patients/:id</code>
                  <span className="text-gray-600">- Get specific patient</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">POST Operations:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">POST</Badge>
                  <code>/api/patients</code>
                  <span className="text-gray-600">- Should redirect to Auth</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">POST</Badge>
                  <code>/auth/register-patient</code>
                  <span className="text-gray-600">- Proper patient creation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">TEST</Badge>
                  <code>Validation</code>
                  <span className="text-gray-600">- Invalid data rejection</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">TEST</Badge>
                  <code>Direct Call</code>
                  <span className="text-gray-600">- Service boundaries</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Architecture Tests:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">ARCH</Badge>
                  <code>Microservice</code>
                  <span className="text-gray-600">- Service separation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">ARCH</Badge>
                  <code>API Gateway</code>
                  <span className="text-gray-600">- Authentication check</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">ARCH</Badge>
                  <code>Data Flow</code>
                  <span className="text-gray-600">- Service communication</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">ARCH</Badge>
                  <code>Validation</code>
                  <span className="text-gray-600">- Input sanitization</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unified Test Suite - All tests in one place */}
      <UnifiedPatientTest />

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
                <li>Ensure <strong>Auth Service</strong> is running on port 3001</li>
                <li>Ensure <strong>API Gateway</strong> is running on port 3100</li>
                <li>Ensure <strong>Patient Service</strong> is running on port 3003</li>
                <li>Database should be accessible and properly configured</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium">How to Use:</h4>
              <ol className="list-decimal list-inside space-y-1 text-gray-600 ml-4">
                <li>Click <strong>"Run Complete Test Suite"</strong> button</li>
                <li>Watch the progress bar and current test status</li>
                <li>Review results as they appear in real-time</li>
                <li>Check the final integration summary</li>
                <li>Expand response data for detailed debugging</li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium">Expected Results:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
                <li><strong>Health Checks:</strong> ✅ Services should be running</li>
                <li><strong>GET Operations:</strong> ✅ Should retrieve data successfully</li>
                <li><strong>POST Redirect:</strong> ✅ Should redirect to Auth Service</li>
                <li><strong>Validation:</strong> ✅ Should reject invalid data</li>
                <li><strong>Auth Registration:</strong> ✅ Should create patient successfully</li>
                <li><strong>Architecture:</strong> ✅ Microservice boundaries enforced</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
