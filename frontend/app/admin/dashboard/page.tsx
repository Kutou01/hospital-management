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
import { EnhancedStatCard, AppointmentStatCard, PatientStatCard, DoctorStatCard } from "@/components/dashboard/EnhancedStatCard"
import { RealTimeStatsEnhanced } from "@/components/dashboard/RealTimeStatsEnhanced"
import { ChartCard, BarChartGroup, ProgressChart, MetricComparison } from "@/components/dashboard/ChartCard"
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline"
import { NotificationCenter } from "@/components/dashboard/NotificationCenter"
import { InteractiveCalendar } from "@/components/dashboard/InteractiveCalendar"
import { StatCardSkeleton, ChartCardSkeleton, RealTimeStatsSkeleton, PulseWrapper } from "@/components/dashboard/SkeletonLoaders"
import { useDashboardLoading } from "@/hooks/useProgressiveLoading"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useEnhancedAuth } from "@/lib/auth/auth-wrapper"
import { AdminPageWrapper } from "../page-wrapper"
import { dashboardApi, appointmentsApi } from "@/lib/supabase"

export default function AdminDashboard() {
  const { user, loading } = useEnhancedAuth()
  const [currentDate, setCurrentDate] = useState("")
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [recentAppointments, setRecentAppointments] = useState<any[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [notifications, setNotifications] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [calendarEvents, setCalendarEvents] = useState<any[]>([])

  // Progressive loading
  const {
    isStatsLoading,
    isChartsLoading,
    isSystemStatsLoading,
    isActivitiesLoading,
    isNotificationsLoading,
    progress
  } = useDashboardLoading()

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

        console.log('📊 [AdminDashboard] Loading dashboard data...')

        // Load dashboard statistics with better error handling
        try {
          const stats = await dashboardApi.getDashboardStats()
          setDashboardStats(stats)
          console.log('✅ [AdminDashboard] Dashboard stats loaded:', stats)
        } catch (statsError) {
          console.error('❌ [AdminDashboard] Failed to load dashboard stats:', statsError)
          // Set default stats if API fails
          setDashboardStats({
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
          })
        }

        // Load recent appointments with better error handling
        try {
          const appointments = await appointmentsApi.getAllAppointments()
          setRecentAppointments(appointments.slice(0, 5)) // Get latest 5 appointments
          console.log('✅ [AdminDashboard] Recent appointments loaded:', appointments.length)
        } catch (appointmentsError) {
          console.error('❌ [AdminDashboard] Failed to load appointments:', appointmentsError)
          setRecentAppointments([])
        }

        // Load mock notifications
        setNotifications([
          {
            id: '1',
            type: 'system' as const,
            title: 'System Maintenance Scheduled',
            message: 'Scheduled maintenance from 11:00 PM to 1:00 AM tonight',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            isRead: false,
            priority: 'medium' as const,
            sender: { name: 'System Admin', role: 'IT', avatar: '' }
          },
          {
            id: '2',
            type: 'warning' as const,
            title: 'High Server Load',
            message: 'Server load is at 85%. Consider scaling resources.',
            timestamp: new Date(Date.now() - 30 * 60 * 1000),
            isRead: false,
            priority: 'high' as const,
            sender: { name: 'Monitoring System', role: 'System', avatar: '' }
          }
        ])

        // Load mock activities
        setActivities([
          {
            id: '1',
            type: 'appointment' as const,
            title: 'New appointment scheduled',
            description: 'Patient John Doe scheduled for tomorrow',
            timestamp: new Date(Date.now() - 15 * 60 * 1000),
            user: { name: 'Reception', role: 'Staff', avatar: '' },
            patient: { name: 'John Doe', id: 'PAT-001' },
            status: 'completed' as const,
            priority: 'medium' as const
          },
          {
            id: '2',
            type: 'admission' as const,
            title: 'Patient admitted to ICU',
            description: 'Emergency admission for cardiac monitoring',
            timestamp: new Date(Date.now() - 45 * 60 * 1000),
            user: { name: 'Dr. Smith', role: 'Doctor', avatar: '' },
            patient: { name: 'Jane Smith', id: 'PAT-002' },
            status: 'in-progress' as const,
            priority: 'urgent' as const
          }
        ])

        // Load mock calendar events
        setCalendarEvents([
          {
            id: '1',
            title: 'Board Meeting',
            date: new Date(),
            time: '14:00',
            type: 'meeting' as const,
            location: 'Conference Room A',
            status: 'confirmed' as const
          },
          {
            id: '2',
            title: 'Staff Training',
            date: new Date(Date.now() + 24 * 60 * 60 * 1000),
            time: '09:00',
            type: 'meeting' as const,
            location: 'Training Center',
            status: 'pending' as const
          }
        ])

        console.log('🎉 [AdminDashboard] Dashboard data loading completed')
      } catch (error) {
        console.error('❌ [AdminDashboard] Critical error loading dashboard data:', error)
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

  // Generate recent activities from real data
  const recentActivities = [
    {
      id: "1",
      type: "doctor" as const,
      title: "System Status",
      description: `${systemStats.total_patients} bệnh nhân, ${systemStats.total_doctors} bác sĩ đang hoạt động`,
      time: "Real-time",
      status: "completed" as const,
      initials: "SYS"
    },
    {
      id: "2",
      type: "patient" as const,
      title: "Appointments Today",
      description: `${systemStats.appointments_today} cuộc hẹn hôm nay`,
      time: "Today",
      status: "pending" as const,
      initials: "APT"
    },
    {
      id: "3",
      type: "appointment" as const,
      title: "Room Occupancy",
      description: `${occupancyRate}% phòng đang được sử dụng`,
      time: "Current",
      status: "completed" as const,
      initials: "ROM"
    },
    {
      id: "4",
      type: "report" as const,
      title: "System Health",
      description: "Tất cả dịch vụ đang hoạt động bình thường",
      time: "Live",
      status: "completed" as const,
      initials: "SYS"
    }
  ]

  // Generate department stats from real data (simplified version)
  const departmentStats = [
    {
      name: "Tổng quan",
      patients: Number(systemStats.total_patients),
      doctors: Number(systemStats.total_doctors),
      occupancy: occupancyRate
    },
    {
      name: "Phòng khám",
      patients: Number(systemStats.appointments_today),
      doctors: Number(systemStats.total_rooms),
      occupancy: Math.round((Number(systemStats.occupied_rooms) / Math.max(Number(systemStats.total_rooms), 1)) * 100)
    },
    {
      name: "Hẹn khám",
      patients: Number(systemStats.appointments_pending),
      doctors: Number(systemStats.appointments_confirmed),
      occupancy: Math.round((Number(systemStats.appointments_completed) / Math.max(Number(systemStats.appointments_today), 1)) * 100)
    }
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

          {/* Enhanced System Status Alert */}
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Tất cả hệ thống hoạt động bình thường. Quản lý bệnh viện đang chạy ổn định.
                </span>
              </div>
              <SystemHealthBadge />
            </div>
          </div>
        </div>

        {/* Enhanced Key Metrics with Progressive Loading */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <PulseWrapper isLoading={isStatsLoading} fallback={<StatCardSkeleton />}>
            <EnhancedStatCard
              title="Tổng người dùng"
              value={totalUsers}
              change={8}
              changeLabel="tăng trưởng tháng này"
              icon={<Users className="h-6 w-6" />}
              description={`${systemStats.total_doctors} bác sĩ, ${systemStats.total_patients} bệnh nhân`}
              color="blue"
              variant="gradient"
              showTrend={true}
              showActions={true}
              onRefresh={() => window.location.reload()}
              onViewDetails={() => window.location.href = '/admin/doctors'}
            />
          </PulseWrapper>

          <PulseWrapper isLoading={isStatsLoading} fallback={<StatCardSkeleton />}>
            <EnhancedStatCard
              title="Cuộc hẹn hôm nay"
              value={systemStats.appointments_today}
              change={12}
              changeLabel="so với hôm qua"
              icon={<Calendar className="h-6 w-6" />}
              description={`${systemStats.appointments_pending} đang chờ xác nhận`}
              color="green"
              variant="gradient"
              showTrend={true}
              showProgress={true}
              progressValue={systemStats.appointments_confirmed}
              progressMax={systemStats.appointments_today}
              onRefresh={() => window.location.reload()}
              onViewDetails={() => window.location.href = '/admin/appointments'}
            />
          </PulseWrapper>

          <PulseWrapper isLoading={isStatsLoading} fallback={<StatCardSkeleton />}>
            <EnhancedStatCard
              title="Tổng phòng"
              value={systemStats.total_rooms}
              change={0}
              changeLabel="không thay đổi"
              icon={<BedDouble className="h-6 w-6" />}
              description={`${systemStats.available_rooms} phòng trống`}
              color="purple"
              variant="gradient"
              showTrend={true}
              showProgress={true}
              progressValue={systemStats.occupied_rooms}
              progressMax={systemStats.total_rooms}
              onViewDetails={() => window.location.href = '/admin/rooms'}
            />
          </PulseWrapper>

          <PulseWrapper isLoading={isStatsLoading} fallback={<StatCardSkeleton />}>
            <EnhancedStatCard
              title="Tỷ lệ lấp đầy"
              value={`${occupancyRate}%`}
              change={occupancyRate > 70 ? 5 : -3}
              changeLabel="so với tuần trước"
              icon={<Activity className="h-6 w-6" />}
              description={`${systemStats.total_departments} khoa hoạt động`}
              color="orange"
              variant="gradient"
              showTrend={true}
              status={occupancyRate > 90 ? 'critical' : occupancyRate > 70 ? 'warning' : 'normal'}
              onViewDetails={() => window.location.href = '/admin/departments'}
            />
          </PulseWrapper>
        </div>

        {/* Enhanced Real-time System Monitoring */}
        <PulseWrapper isLoading={isSystemStatsLoading} fallback={<RealTimeStatsSkeleton />}>
          <RealTimeStatsEnhanced
            systemHealth="healthy"
            metrics={{
              activeUsers: totalUsers,
              serverLoad: 45,
              databaseConnections: 23,
              responseTime: 120,
              memoryUsage: 68,
              diskUsage: 42,
              networkLatency: 15,
              uptime: '15d 4h 23m'
            }}
            showDetailedMetrics={true}
            autoRefresh={true}
            refreshInterval={30000}
            onRefresh={() => console.log('Refreshing system stats...')}
          />
        </PulseWrapper>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 mt-6">
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
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
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

          {/* Quick Actions Enhanced */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Thao tác nhanh</h3>
              <div className="space-y-3">
                <Button className="w-full justify-start bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 border-blue-200" variant="outline">
                  <UserCog className="h-4 w-4 mr-2" />
                  Quản lý bác sĩ
                </Button>
                <Button className="w-full justify-start bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 text-green-700 border-green-200" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Quản lý bệnh nhân
                </Button>
                <Button className="w-full justify-start bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 text-purple-700 border-purple-200" variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Lịch hẹn
                </Button>
                <Button className="w-full justify-start bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 text-orange-700 border-orange-200" variant="outline">
                  <Building2 className="h-4 w-4 mr-2" />
                  Các khoa
                </Button>
                <Button className="w-full justify-start bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-red-700 border-red-200" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Báo cáo
                </Button>
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

        {/* Enhanced Dashboard Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Activity Timeline */}
          <PulseWrapper isLoading={isActivitiesLoading} fallback={<div className="h-96 bg-gray-100 rounded-lg animate-pulse" />}>
            <ActivityTimeline
              activities={activities}
              onActivityClick={(activity) => console.log('Activity clicked:', activity)}
              onAddActivity={() => console.log('Add new activity')}
              showFilters={false}
              showSearch={true}
              groupByDate={true}
              maxItems={5}
            />
          </PulseWrapper>

          {/* Notification Center */}
          <PulseWrapper isLoading={isNotificationsLoading} fallback={<div className="h-96 bg-gray-100 rounded-lg animate-pulse" />}>
            <NotificationCenter
              notifications={notifications}
              onNotificationClick={(notification) => console.log('Notification clicked:', notification)}
              onMarkAsRead={(id) => console.log('Mark as read:', id)}
              onMarkAllAsRead={() => console.log('Mark all as read')}
              onDeleteNotification={(id) => console.log('Delete notification:', id)}
              showFilters={false}
              showSearch={false}
              maxItems={5}
            />
          </PulseWrapper>
        </div>

        {/* Enhanced Charts and Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Performance Chart */}
          <PulseWrapper isLoading={isChartsLoading} fallback={<ChartCardSkeleton />}>
            <ChartCard
              title="Hiệu suất hệ thống"
              subtitle="7 ngày qua"
              chartType="bar"
              showExport={true}
              onExport={() => console.log('Exporting chart...')}
              onRefresh={() => console.log('Refreshing chart...')}
              trend={{
                value: 12.5,
                label: 'tăng',
                direction: 'up'
              }}
            >
              <ProgressChart data={[
                { label: 'Cuộc hẹn hoàn thành', value: 92, color: 'green', target: 100 },
                { label: 'Tỷ lệ lấp đầy phòng', value: occupancyRate, color: 'blue', target: 100 },
                { label: 'Hài lòng bệnh nhân', value: 88, color: 'purple', target: 100 },
                { label: 'Hiệu suất bác sĩ', value: 95, color: 'orange', target: 100 }
              ]} />
            </ChartCard>
          </PulseWrapper>

          {/* Calendar */}
          <InteractiveCalendar
            events={calendarEvents}
            onDateSelect={(date) => console.log('Date selected:', date)}
            onEventClick={(event) => console.log('Event clicked:', event)}
            onAddEvent={(date) => console.log('Add event for:', date)}
            showMiniCalendar={true}
            showEventList={false}
          />
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card>
            <CardContent className="p-6">
              <MetricComparison
                title="Doanh thu tháng"
                current={2400000}
                previous={2100000}
                format="currency"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <MetricComparison
                title="Tỷ lệ hài lòng"
                current={94.5}
                previous={91.2}
                format="percentage"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <MetricComparison
                title="Thời gian chờ TB"
                current={15}
                previous={18}
                unit=" phút"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminPageWrapper>
  )
}
