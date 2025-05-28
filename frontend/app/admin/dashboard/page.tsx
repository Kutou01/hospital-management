"use client"

import { useState, useEffect } from "react"
import {
  Users,
  UserCog,
  Calendar,
  Activity,
  AlertCircle,
  CheckCircle,
  Building2,
  BedDouble,
  FileText,
  DollarSign,
  Shield,
  Server,
  BarChart3
} from "lucide-react"

import { StatCard } from "@/components/dashboard/StatCard"
import { ChartCard, BarChartGroup } from "@/components/dashboard/ChartCard"
import { RecentActivity } from "@/components/dashboard/RecentActivity"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useEnhancedAuth } from "@/lib/auth/enhanced-auth-context"
import { AdminPageWrapper } from "../page-wrapper"
import { dashboardApi, appointmentsApi } from "@/lib/supabase"

export default function AdminDashboard() {
  const { user, loading } = useEnhancedAuth()
  const [currentDate, setCurrentDate] = useState("")
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [recentAppointments, setRecentAppointments] = useState<any[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Debug logs
  console.log('🏥 [AdminDashboard] Render state:', {
    user,
    loading,
    userRole: user?.role,
    hasUser: !!user
  })

  useEffect(() => {
    const today = new Date()
    setCurrentDate(today.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }))
  }, [])

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoadingData(true)

        // Load dashboard statistics
        const stats = await dashboardApi.getDashboardStats()
        setDashboardStats(stats)

        // Load recent appointments
        const appointments = await appointmentsApi.getAllAppointments()
        setRecentAppointments(appointments.slice(0, 5)) // Get latest 5 appointments

        console.log('📊 Dashboard data loaded:', { stats, appointmentsCount: appointments.length })
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setIsLoadingData(false)
      }
    }

    if (user && user.role === 'admin') {
      loadDashboardData()
    }
  }, [user])

  // Show loading state while user data is being fetched
  if (loading || isLoadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Enhanced debug and redirect logic
  console.log('🏥 [AdminDashboard] Access check:', {
    hasUser: !!user,
    userRole: user?.role,
    isAdmin: user?.role === 'admin',
    loading
  })

  if (!user || user.role !== 'admin') {
    console.log('🏥 [AdminDashboard] Access denied - redirecting to login')

    // If not loading and no user, redirect to login
    if (!loading && !user) {
      if (typeof window !== 'undefined') {
        console.log('🏥 [AdminDashboard] No user - redirecting to login')
        window.location.href = '/auth/login'
        return null
      }
    }

    // If user exists but wrong role, show access denied
    if (user && user.role !== 'admin') {
      console.log('🏥 [AdminDashboard] Wrong role - showing access denied')
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Access denied. Admin role required.</p>
            <p className="text-sm text-gray-500 mt-2">Current role: {user.role}</p>
          </div>
        </div>
      )
    }

    // Still loading or no user yet
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Use real data from Supabase or fallback to defaults
  const systemStats = dashboardStats || {
    total_patients: 0,
    total_doctors: 0,
    total_departments: 0,
    total_rooms: 0,
    available_rooms: 0,
    occupied_rooms: 0,
    appointments_today: 0,
    appointments_pending: 0,
    appointments_confirmed: 0,
    appointments_completed: 0
  }

  // Calculate additional stats
  const totalUsers = Number(systemStats.total_patients) + Number(systemStats.total_doctors)
  const occupancyRate = systemStats.total_rooms > 0
    ? Math.round((Number(systemStats.occupied_rooms) / Number(systemStats.total_rooms)) * 100)
    : 0

  const recentActivities = [
    {
      id: "1",
      type: "doctor" as const,
      title: "New doctor registered",
      description: "Dr. Nguyễn Văn A đã được thêm vào hệ thống",
      time: "2 hours ago",
      status: "completed" as const,
      initials: "NVA"
    },
    {
      id: "2",
      type: "patient" as const,
      title: "Patient registration spike",
      description: "15 bệnh nhân mới đăng ký trong 1 giờ qua",
      time: "3 hours ago",
      status: "pending" as const,
      initials: "REG"
    },
    {
      id: "3",
      type: "appointment" as const,
      title: "High appointment volume",
      description: "89 lịch hẹn đang hoạt động",
      time: "4 hours ago",
      status: "completed" as const,
      initials: "APT"
    },
    {
      id: "4",
      type: "report" as const,
      title: "System backup completed",
      description: "Sao lưu dữ liệu hệ thống thành công",
      time: "6 hours ago",
      status: "completed" as const,
      initials: "SYS"
    }
  ]

  const departmentStats = [
    { name: "Khoa Nội", patients: 45, doctors: 8, occupancy: 85 },
    { name: "Khoa Ngoại", patients: 32, doctors: 6, occupancy: 70 },
    { name: "Khoa Sản", patients: 28, doctors: 5, occupancy: 90 },
    { name: "Khoa Nhi", patients: 38, doctors: 7, occupancy: 75 },
    { name: "Khoa Tim mạch", patients: 25, doctors: 4, occupancy: 65 }
  ]

  const systemHealth = {
    database: { status: "healthy", uptime: "99.9%" },
    apiGateway: { status: "healthy", uptime: "99.8%" },
    authService: { status: "healthy", uptime: "99.9%" },
    microservices: { status: "warning", uptime: "98.5%" }
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100'
      case 'warning':
        return 'text-yellow-600 bg-yellow-100'
      case 'error':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <AdminPageWrapper
      title="Dashboard"
      activePage="dashboard"
      subtitle="Hospital Management Overview"
      headerActions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Export Report
          </Button>
          <Button size="sm">
            Quick Actions
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Chào mừng trở lại, {user.full_name}!
              </h2>
              <p className="text-sm text-gray-600">
                {user.email} • Quản trị viên
              </p>
            </div>
          </div>
          <p className="text-gray-600">{currentDate}</p>

          {/* System Status Alert */}
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Tất cả hệ thống hoạt động bình thường. Quản lý bệnh viện đang chạy ổn định.
              </span>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Tổng người dùng"
            value={totalUsers}
            change={8}
            icon={<Users className="text-blue-500" />}
            description={`${systemStats.total_doctors} bác sĩ, ${systemStats.total_patients} bệnh nhân`}
          />
          <StatCard
            title="Lịch hẹn đang hoạt động"
            value={Number(systemStats.appointments_confirmed) + Number(systemStats.appointments_pending)}
            change={12}
            icon={<Calendar className="text-green-500" />}
            description={`${systemStats.appointments_completed} hoàn thành`}
          />
          <StatCard
            title="Tổng phòng"
            value={systemStats.total_rooms}
            change={0}
            icon={<BedDouble className="text-purple-500" />}
            description={`${systemStats.available_rooms} phòng trống`}
          />
          <StatCard
            title="Tỷ lệ lấp đầy"
            value={`${occupancyRate}%`}
            change={occupancyRate > 70 ? 5 : -3}
            icon={<Activity className="text-orange-500" />}
            description={`${systemStats.total_departments} khoa hoạt động`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Department Overview */}
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium">Tổng quan các khoa</h3>
                <Button variant="outline" size="sm">
                  Xem tất cả
                </Button>
              </div>
              <div className="space-y-4">
                {departmentStats.map((dept, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{dept.name}</p>
                        <p className="text-sm text-gray-500">
                          {dept.patients} bệnh nhân • {dept.doctors} bác sĩ
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{dept.occupancy}%</p>
                      <Progress value={dept.occupancy} className="w-20 h-2 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Tình trạng hệ thống</h3>
              <div className="space-y-4">
                {Object.entries(systemHealth).map(([service, health]) => (
                  <div key={service} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Server className="h-4 w-4 text-gray-500" />
                      <span className="text-sm capitalize">{service.replace(/([A-Z])/g, ' $1')}</span>
                    </div>
                    <div className="text-right">
                      <Badge className={`text-xs ${getHealthColor(health.status)}`}>
                        {health.status}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">{health.uptime}</p>
                    </div>
                  </div>
                ))}
                <div className="pt-4">
                  <Button className="w-full" variant="outline" size="sm">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Xem phân tích
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Appointment Statistics */}
          <ChartCard title="Thống kê lịch hẹn theo tuần" className="col-span-1">
            <div className="h-64 flex items-end justify-between">
              <BarChartGroup label="T2" value1={65} value2={45} />
              <BarChartGroup label="T3" value1={75} value2={55} />
              <BarChartGroup label="T4" value1={55} value2={35} />
              <BarChartGroup label="T5" value1={85} value2={65} />
              <BarChartGroup label="T6" value1={70} value2={50} />
              <BarChartGroup label="T7" value1={40} value2={25} />
              <BarChartGroup label="CN" value1={30} value2={20} />
            </div>
            <div className="flex justify-center space-x-6 mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-600">Đã đặt lịch</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600">Đã hoàn thành</span>
              </div>
            </div>
          </ChartCard>

          {/* Recent Activity */}
          <RecentActivity
            activities={recentActivities}
            title="Hoạt động gần đây của hệ thống"
            maxItems={5}
          />
        </div>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Thao tác nhanh</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Button className="h-20 flex-col space-y-2" variant="outline">
                <UserCog className="h-6 w-6" />
                <span className="text-xs">Quản lý bác sĩ</span>
              </Button>
              <Button className="h-20 flex-col space-y-2" variant="outline">
                <Users className="h-6 w-6" />
                <span className="text-xs">Quản lý bệnh nhân</span>
              </Button>
              <Button className="h-20 flex-col space-y-2" variant="outline">
                <Calendar className="h-6 w-6" />
                <span className="text-xs">Lịch hẹn</span>
              </Button>
              <Button className="h-20 flex-col space-y-2" variant="outline">
                <Building2 className="h-6 w-6" />
                <span className="text-xs">Các khoa</span>
              </Button>
              <Button className="h-20 flex-col space-y-2" variant="outline">
                <BedDouble className="h-6 w-6" />
                <span className="text-xs">Quản lý phòng</span>
              </Button>
              <Button className="h-20 flex-col space-y-2" variant="outline">
                <FileText className="h-6 w-6" />
                <span className="text-xs">Báo cáo</span>
              </Button>
              <Button className="h-20 flex-col space-y-2" variant="outline">
                <DollarSign className="h-6 w-6" />
                <span className="text-xs">Thanh toán</span>
              </Button>
              <Button className="h-20 flex-col space-y-2" variant="outline">
                <Server className="h-6 w-6" />
                <span className="text-xs">Cài đặt hệ thống</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Today's Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Lịch hẹn hôm nay
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Đã hoàn thành</span>
                  <span className="font-medium text-green-600">{systemStats.appointments_completed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Đã xác nhận</span>
                  <span className="font-medium text-blue-600">{systemStats.appointments_confirmed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Đang chờ</span>
                  <span className="font-medium text-yellow-600">{systemStats.appointments_pending}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Hôm nay</span>
                  <span className="font-medium text-purple-600">{systemStats.appointments_today}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Tổng quan cuộc hẹn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tổng cuộc hẹn</span>
                  <span className="font-medium">{Number(systemStats.appointments_completed) + Number(systemStats.appointments_confirmed) + Number(systemStats.appointments_pending)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Hoàn thành</span>
                  <span className="font-medium text-green-600">{systemStats.appointments_completed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tăng trưởng</span>
                  <span className="font-medium text-green-600">+15%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Hiệu suất hệ thống
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Thời gian hoạt động</span>
                  <span className="font-medium text-green-600">99.9%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Thời gian phản hồi</span>
                  <span className="font-medium">120ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Người dùng đang hoạt động</span>
                  <span className="font-medium">234</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminPageWrapper>
  )
}
