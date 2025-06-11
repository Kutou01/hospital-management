"use client"

import { useEnhancedAuth } from "@/lib/auth/auth-wrapper"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function AuthDebugPage() {
  const { user, loading, isAuthenticated, hasRole } = useEnhancedAuth()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Debug</h1>
        
        <div className="grid gap-6">
          {/* Auth State */}
          <Card>
            <CardHeader>
              <CardTitle>Authentication State</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
                <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
                <p><strong>Has User:</strong> {user ? 'Yes' : 'No'}</p>
              </div>
            </CardContent>
          </Card>

          {/* User Info */}
          {user && (
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>ID:</strong> {user.id}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Full Name:</strong> {user.full_name}</p>
                  <p><strong>Role:</strong> {user.role}</p>
                  <p><strong>Active:</strong> {user.is_active ? 'Yes' : 'No'}</p>
                  <p><strong>Phone:</strong> {user.phone_number}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Role Checks */}
          <Card>
            <CardHeader>
              <CardTitle>Role Checks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Is Admin:</strong> {hasRole('admin') ? 'Yes' : 'No'}</p>
                <p><strong>Is Doctor:</strong> {hasRole('doctor') ? 'Yes' : 'No'}</p>
                <p><strong>Is Patient:</strong> {hasRole('patient') ? 'Yes' : 'No'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Tests */}
          <Card>
            <CardHeader>
              <CardTitle>Navigation Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={() => router.push('/doctors/dashboard')}>
                    Go to Doctor Dashboard
                  </Button>
                  <Button onClick={() => router.push('/admin/dashboard')}>
                    Go to Admin Dashboard
                  </Button>
                  <Button onClick={() => router.push('/patients/dashboard')}>
                    Go to Patient Dashboard
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => router.push('/doctors/profile')}>
                    Doctor Profile
                  </Button>
                  <Button onClick={() => router.push('/doctors/schedule')}>
                    Doctor Schedule
                  </Button>
                  <Button onClick={() => router.push('/doctors/appointments')}>
                    Doctor Appointments
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Raw User Object */}
          {user && (
            <Card>
              <CardHeader>
                <CardTitle>Raw User Object</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
