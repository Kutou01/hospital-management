"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Download, Eye } from "lucide-react"
import { authApi, LoginSession } from "@/lib/supabase"

export default function LoginHistoryPage() {
  const [sessions, setSessions] = useState<LoginSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")

  useEffect(() => {
    fetchLoginHistory()
  }, [])

  const fetchLoginHistory = async () => {
    setIsLoading(true)
    try {
      // Trong thực tế, bạn sẽ cần API để lấy tất cả login sessions
      // Hiện tại tôi sẽ tạo dữ liệu mẫu
      const mockSessions: LoginSession[] = [
        {
          session_id: 1,
          user_id: "USR001",
          login_time: "2024-01-15T10:30:00Z",
          logout_time: "2024-01-15T18:45:00Z",
          ip_address: "192.168.1.100",
          user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          device_info: { platform: "Win32", language: "en-US" },
          session_token: "abc123",
          is_active: false
        },
        {
          session_id: 2,
          user_id: "USR002",
          login_time: "2024-01-15T08:15:00Z",
          logout_time: null,
          ip_address: "192.168.1.101",
          user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          device_info: { platform: "MacIntel", language: "en-US" },
          session_token: "def456",
          is_active: true
        },
        {
          session_id: 3,
          user_id: "USR003",
          login_time: "2024-01-14T14:20:00Z",
          logout_time: "2024-01-14T16:30:00Z",
          ip_address: "192.168.1.102",
          user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
          device_info: { platform: "iPhone", language: "vi-VN" },
          session_token: "ghi789",
          is_active: false
        }
      ]
      setSessions(mockSessions)
    } catch (error) {
      console.error('Error fetching login history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN')
  }

  const getDeviceType = (userAgent: string) => {
    if (userAgent.includes('iPhone') || userAgent.includes('Android')) return 'Mobile'
    if (userAgent.includes('iPad') || userAgent.includes('Tablet')) return 'Tablet'
    return 'Desktop'
  }

  const getBrowser = (userAgent: string) => {
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Unknown'
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
  }

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.ip_address?.includes(searchTerm)
    return matchesSearch
  })

  return (
    <DashboardLayout title="Login History" activePage="login-history">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Search by User ID or IP address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="doctor">Doctor</SelectItem>
              <SelectItem value="patient">Patient</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter size={16} className="mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download size={16} className="mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Login Sessions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left p-4 font-medium text-gray-900">User ID</th>
                  <th className="text-left p-4 font-medium text-gray-900">Login Time</th>
                  <th className="text-left p-4 font-medium text-gray-900">Logout Time</th>
                  <th className="text-left p-4 font-medium text-gray-900">IP Address</th>
                  <th className="text-left p-4 font-medium text-gray-900">Device</th>
                  <th className="text-left p-4 font-medium text-gray-900">Browser</th>
                  <th className="text-left p-4 font-medium text-gray-900">Status</th>
                  <th className="text-left p-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center p-8 text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center p-8 text-gray-500">
                      No login sessions found
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((session) => (
                    <tr key={session.session_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4">
                        <div className="font-medium text-gray-900">{session.user_id}</div>
                      </td>
                      <td className="p-4 text-gray-600">
                        {formatDateTime(session.login_time)}
                      </td>
                      <td className="p-4 text-gray-600">
                        {session.logout_time ? formatDateTime(session.logout_time) : '-'}
                      </td>
                      <td className="p-4 text-gray-600">
                        {session.ip_address || '-'}
                      </td>
                      <td className="p-4 text-gray-600">
                        {session.user_agent ? getDeviceType(session.user_agent) : '-'}
                      </td>
                      <td className="p-4 text-gray-600">
                        {session.user_agent ? getBrowser(session.user_agent) : '-'}
                      </td>
                      <td className="p-4">
                        <Badge className={getStatusColor(session.is_active)}>
                          {session.is_active ? 'Active' : 'Ended'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Button variant="ghost" size="sm">
                          <Eye size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{sessions.length}</div>
            <div className="text-sm text-gray-600">Total Sessions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {sessions.filter(s => s.is_active).length}
            </div>
            <div className="text-sm text-gray-600">Active Sessions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {new Set(sessions.map(s => s.user_id)).size}
            </div>
            <div className="text-sm text-gray-600">Unique Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {sessions.filter(s => s.login_time.includes(new Date().toISOString().split('T')[0])).length}
            </div>
            <div className="text-sm text-gray-600">Today's Logins</div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
