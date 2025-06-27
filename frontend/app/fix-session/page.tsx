"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth/auth-wrapper"
import { saveUserSession, restoreUserSession, clearUserSession } from "@/lib/auth/session-persistence"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, CheckCircle, Save, RefreshCw, User, Settings } from "lucide-react"

export default function FixSessionPage() {
  const { user, loading, refreshUser } = useAuth()
  const [editedUser, setEditedUser] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (user) {
      setEditedUser({ ...user })
    }
  }, [user])

  const handleSaveSession = () => {
    if (!editedUser) return

    // Force save the edited user data
    saveUserSession(editedUser, {
      access_token: localStorage.getItem('auth_token') || 'test-token',
      refresh_token: localStorage.getItem('refresh_token') || 'test-refresh'
    })

    console.log('💾 [FixSession] Saved edited user:', editedUser)
    
    // Refresh the page to reload with new data
    window.location.reload()
  }

  const handleFixDoctorRole = () => {
    if (!user) return

    const fixedUser = {
      ...user,
      role: 'doctor',
      doctor_id: user.doctor_id || 'DOC-001',
      authType: 'service'
    }

    setEditedUser(fixedUser)
    setIsEditing(true)
  }

  const handleInputChange = (field: string, value: string) => {
    setEditedUser((prev: any) => ({
      ...prev,
      [field]: value
    }))
  }

  const getCurrentStoredData = () => {
    try {
      const userData = localStorage.getItem('user_data')
      return userData ? JSON.parse(userData) : null
    } catch (e) {
      return null
    }
  }

  const storedData = getCurrentStoredData()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Fix Session Data</h1>
        <Button onClick={() => window.location.href = '/debug-session'} variant="outline">
          Back to Debug
        </Button>
      </div>

      {/* Current User Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Current User Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium">Role:</span>
                  <Badge variant={user.role === 'doctor' ? "default" : "destructive"} className="ml-2">
                    {user.role}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm font-medium">Email:</span>
                  <span className="ml-2 text-sm">{user.email}</span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Full User Data:</h4>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>

              {user.role !== 'doctor' && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800 mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Role Issue Detected</span>
                  </div>
                  <p className="text-red-700 text-sm mb-3">
                    Current role is "{user.role}" but should be "doctor" for doctor profile access.
                  </p>
                  <Button onClick={handleFixDoctorRole} size="sm" className="bg-red-600 hover:bg-red-700">
                    Fix Role to Doctor
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600">No user data found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stored Data */}
      <Card>
        <CardHeader>
          <CardTitle>Stored Session Data</CardTitle>
        </CardHeader>
        <CardContent>
          {storedData ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium">Stored Role:</span>
                  <Badge variant={storedData.role === 'doctor' ? "default" : "destructive"} className="ml-2">
                    {storedData.role}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm font-medium">Stored Email:</span>
                  <span className="ml-2 text-sm">{storedData.email}</span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Stored Data:</h4>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(storedData, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">No stored session data found</p>
          )}
        </CardContent>
      </Card>

      {/* Edit User Data */}
      {isEditing && editedUser && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Edit User Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={editedUser.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={editedUser.full_name || ''}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={editedUser.role} onValueChange={(value) => handleInputChange('role', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="patient">Patient</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="doctor_id">Doctor ID</Label>
                <Input
                  id="doctor_id"
                  value={editedUser.doctor_id || ''}
                  onChange={(e) => handleInputChange('doctor_id', e.target.value)}
                  placeholder="DOC-001"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSaveSession} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save & Reload
              </Button>
              <Button onClick={() => setIsEditing(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={refreshUser} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh User
            </Button>
            <Button onClick={() => setIsEditing(true)} variant="outline" disabled={!user}>
              <Settings className="h-4 w-4 mr-2" />
              Edit User Data
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline">
              Reload Page
            </Button>
            <Button 
              onClick={() => {
                clearUserSession()
                window.location.href = '/auth/login'
              }} 
              variant="destructive"
            >
              Clear & Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
