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
import { AdminLayout } from "@/components/layout/AdminLayout"
import { StatCard } from "@/components/dashboard/StatCard"
import { ChartCard, BarChartGroup } from "@/components/dashboard/ChartCard"
import { RecentActivity } from "@/components/dashboard/RecentActivity"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAuthProvider } from "@/hooks/useAuthProvider"

export default function AdminDashboard() {
  const { user, loading } = useAuthProvider()
  const [currentDate, setCurrentDate] = useState("")

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

  // Show loading state while user data is being fetched
  if (loading) {
    return (
      <AdminLayout title="Admin Dashboard" activePage="dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    )
  }

  // Redirect if not authenticated or not an admin
  if (!user || user.role !== 'admin') {
    return (
      <AdminLayout title="Admin Dashboard" activePage="dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Access denied. Admin role required.</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  // Mock data for admin dashboard
  const systemStats = {
    totalUsers: 1247,
    totalDoctors: 45,
    totalPatients: 1156,
    totalStaff: 46,
    activeAppointments: 89,
    completedToday: 34,
    pendingAppointments: 23,
    cancelledToday: 2,
    totalRevenue: 125000,
    monthlyRevenue: 45000,
    occupancyRate: 78,
    availableRooms: 12
  }

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
    <AdminLayout title="Admin Dashboard" activePage="dashboard">
      <div className="p-6">
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
            value={systemStats.totalUsers}
            change={8}
            icon={<Users className="text-blue-500" />}
            description={`${systemStats.totalDoctors} bác sĩ, ${systemStats.totalPatients} bệnh nhân`}
          />
          <StatCard
            title="Lịch hẹn đang hoạt động"
            value={systemStats.activeAppointments}
            change={12}
            icon={<Calendar className="text-green-500" />}
            description={`${systemStats.completedToday} hoàn thành hôm nay`}
          />
          <StatCard
            title="Doanh thu tháng"
            value={`${systemStats.monthlyRevenue.toLocaleString()} VNĐ`}
            change={15}
            icon={<DollarSign className="text-purple-500" />}
            description="Tháng này"
          />
          <StatCard
            title="Tỷ lệ lấp đầy giường"
            value={`${systemStats.occupancyRate}%`}
            change={-3}
            icon={<BedDouble className="text-orange-500" />}
            description={`${systemStats.availableRooms} phòng còn trống`}
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
                  <span className="font-medium text-green-600">{systemStats.completedToday}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Đang chờ</span>
                  <span className="font-medium text-yellow-600">{systemStats.pendingAppointments}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Đã hủy</span>
                  <span className="font-medium text-red-600">{systemStats.cancelledToday}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Tổng quan doanh thu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tổng doanh thu</span>
                  <span className="font-medium">{systemStats.totalRevenue.toLocaleString()} VNĐ</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tháng này</span>
                  <span className="font-medium text-green-600">{systemStats.monthlyRevenue.toLocaleString()} VNĐ</span>
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
    </AdminLayout>
  )
}
