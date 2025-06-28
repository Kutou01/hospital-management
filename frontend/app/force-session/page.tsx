"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { forceSaveUserData, restoreUserSession, debugSessionState, clearUserSession } from "@/lib/auth/session-persistence"
import { useAuth } from "@/lib/auth/auth-wrapper"
import { Save, RefreshCw, Trash2, User, Eye } from "lucide-react"
import Link from "next/link"

export default function ForceSessionPage() {
  const { user, refreshUser } = useAuth()
  const [formData, setFormData] = useState({
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "doctor@hospital.com",
    role: "doctor",
    full_name: "Dr. Test Doctor",
    is_active: true
  })
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleForceSave = () => {
    const success = forceSaveUserData(formData)
    if (success) {
      alert("✅ Session data force saved! Try reloading the page.")
      handleDebug()
    } else {
      alert("❌ Failed to save session data")
    }
  }

  const handleRestore = () => {
    const restored = restoreUserSession()
    if (restored) {
      setFormData({
        id: restored.id,
        email: restored.email,
        role: restored.role,
        full_name: restored.full_name,
        is_active: restored.is_active
      })
      alert("✅ Session restored from localStorage")
    } else {
      alert("❌ No session data to restore")
    }
  }

  const handleDebug = () => {
    const debug = debugSessionState()
    setDebugInfo(debug)
  }

  const handleClear = () => {
    clearUserSession()
    setDebugInfo(null)
    alert("🗑️ Session data cleared")
  }

  const handleRefreshAuth = async () => {
    await refreshUser()
    alert("🔄 Auth refreshed")
  }

  const handleReload = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/doctors/dashboard">
              <Button variant="outline" size="sm">
                ← Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              Force Session Management
            </h1>
          </div>
          <p className="text-gray-600">
            Force save session data for testing session persistence
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Auth State */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Current Auth State
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {user ? (
                <>
                  <div className="flex justify-between">
                    <span className="font-medium">Email:</span>
                    <span className="text-sm">{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Role:</span>
                    <Badge variant="outline">{user.role}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Name:</span>
                    <span className="text-sm">{user.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Active:</span>
                    <Badge variant={user.is_active ? "default" : "destructive"}>
                      {user.is_active ? "Yes" : "No"}
                    </Badge>
                  </div>
                </>
              ) : (
                <p className="text-gray-500">No user authenticated</p>
              )}
              
              <div className="pt-3 border-t">
                <Button onClick={handleRefreshAuth} variant="outline" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Auth
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Force Save Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="h-5 w-5" />
                Force Save Session
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="doctor">doctor</option>
                  <option value="patient">patient</option>
                  <option value="admin">admin</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                />
                <Label htmlFor="is_active">Is Active</Label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button onClick={handleForceSave} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Force Save
                </Button>
                <Button onClick={handleRestore} variant="outline" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Restore
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Debug Info */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Debug Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={handleDebug} variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Debug Session
                </Button>
                <Button onClick={handleClear} variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Session
                </Button>
                <Button onClick={handleReload} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
              </div>

              {debugInfo && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Session Debug Info:</h4>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </div>
              )}

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">How to test:</h4>
                <ol className="text-sm text-blue-700 space-y-1">
                  <li>1. Fill in the form with doctor role</li>
                  <li>2. Click "Force Save" to save session data</li>
                  <li>3. Click "Reload Page" to test persistence</li>
                  <li>4. Check if role is maintained after reload</li>
                  <li>5. Go to /doctors/profile to test access</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
