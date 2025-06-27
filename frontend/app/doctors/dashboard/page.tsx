"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  Users,
  Clock,
  FileText,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Stethoscope,
  ClipboardList,
  TestTube,
  Zap,
  Shield,
  Award,
  RefreshCw,
  BarChart3,
  Heart,
  Timer,
  Target,
  DollarSign
} from "lucide-react"
import { DoctorLayout } from "@/components/layout/UniversalLayout"
import { StatCard } from "@/components/dashboard/StatCard"
import { ChartCard, BarChartGroup } from "@/components/dashboard/ChartCard"
import { RecentActivity } from "@/components/dashboard/RecentActivity"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEnhancedAuth } from "@/lib/auth/auth-wrapper"
import { doctorsApi } from "@/lib/api/doctors"
import { appointmentsApi } from "@/lib/api/appointments"
import { patientsApi } from "@/lib/api/patients"
import { toast } from "sonner"
import "@/lib/auth/debug-auth" // Import debug functions

interface DashboardStats {
  totalPatients: number
  todayAppointments: number
  upcomingAppointments: number
  completedAppointments: number
  averageRating: number
  totalReviews: number
  thisWeekAppointments: number
  thisMonthAppointments: number
  successRate: number
  totalRevenue: number
}

interface RecentAppointment {
  appointment_id: string
  patient_name: string
  patient_phone?: string
  appointment_date: string
  start_time: string
  end_time?: string
  status: string
  appointment_type: string
  reason?: string
  priority?: 'normal' | 'urgent' | 'emergency'
}

interface TodaySchedule {
  time: string
  patient_name?: string
  appointment_type?: string
  status: 'available' | 'booked' | 'completed' | 'cancelled'
  duration: number
}

export default function DoctorDashboard() {
  const { user, loading } = useEnhancedAuth()
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState("")
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalPatients: 0,
    todayAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    averageRating: 0,
    totalReviews: 0,
    thisWeekAppointments: 0,
    thisMonthAppointments: 0,
    successRate: 0,
    totalRevenue: 0
  })
  const [recentAppointments, setRecentAppointments] = useState<RecentAppointment[]>([])
  const [todaySchedule, setTodaySchedule] = useState<TodaySchedule[]>([])
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Debug logs
  console.log('🏥 [DoctorDashboard] Render state:', {
    user,
    loading,
    userRole: user?.role,
    hasUser: !!user,
    userEmail: user?.email,
    userFullName: user?.full_name,
    timestamp: new Date().toISOString()
  })

  // Additional debug for authentication and handle redirect
  useEffect(() => {
    console.log('🏥 [DoctorDashboard] Auth state changed:', {
      loading,
      user,
      isAuthenticated: !!user,
      role: user?.role
    })

    // Handle redirect when auth state is determined
    if (!loading) {
      if (!user) {
        console.log('🏥 [DoctorDashboard] No user found, redirecting to login')
        router.replace('/auth/login')
      } else if (user.role !== 'doctor') {
        console.log(`🏥 [DoctorDashboard] Wrong role (${user.role}), redirecting to appropriate dashboard`)
        // Redirect to appropriate dashboard based on role
        switch (user.role) {
          case 'admin':
            router.replace('/admin/dashboard')
            break
          case 'patient':
            router.replace('/patient/dashboard')
            break
          default:
            router.replace('/auth/login')
        }
      }
    }
  }, [user, loading, router])

  useEffect(() => {
    const today = new Date()
    setCurrentDate(today.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }))
  }, [])

  // Fetch dashboard data when user is available
  useEffect(() => {
    if (user && user.role === 'doctor') {
      fetchDashboardDataOptimized()
    }
  }, [user])

  const fetchDashboardData = async () => {
    if (!user?.doctor_id) {
      console.log('No doctor_id found for user:', user)
      setIsLoadingStats(false)
      return
    }

    try {
      setIsLoadingStats(true)

      // Fetch doctor's appointments
      const appointmentsResponse = await doctorsApi.getAppointments(user.doctor_id)

      // Fetch doctor's patients
      const patientsResponse = await patientsApi.getAll({ doctor_id: user.doctor_id })

      // Fetch doctor's review stats
      const reviewStatsResponse = await doctorsApi.getReviewStats(user.doctor_id)

      if (appointmentsResponse.success && appointmentsResponse.data) {
        const appointments = appointmentsResponse.data
        const today = new Date().toISOString().split('T')[0]

        // Calculate stats from appointments
        const todayAppts = appointments.filter(apt =>
          apt.appointment_date === today
        )
        const upcomingAppts = appointments.filter(apt =>
          new Date(apt.appointment_date) > new Date() && apt.status !== 'cancelled'
        )
        const completedAppts = appointments.filter(apt =>
          apt.status === 'completed'
        )

        // Set recent appointments (today's appointments)
        setRecentAppointments(todayAppts.slice(0, 4).map(apt => ({
          id: apt.appointment_id,
          patient_name: apt.patient_name || 'Unknown Patient',
          appointment_date: apt.appointment_date,
          start_time: apt.start_time,
          appointment_type: apt.appointment_type || 'General',
          status: apt.status
        })))

        setDashboardStats(prev => ({
          ...prev,
          todayAppointments: todayAppts.length,
          upcomingAppointments: upcomingAppts.length,
          completedAppointments: completedAppts.length
        }))
      }

      if (patientsResponse.success && patientsResponse.data) {
        setDashboardStats(prev => ({
          ...prev,
          totalPatients: patientsResponse.data.length
        }))
      }

      if (reviewStatsResponse.success && reviewStatsResponse.data) {
        setDashboardStats(prev => ({
          ...prev,
          averageRating: reviewStatsResponse.data.average_rating || 0,
          totalReviews: reviewStatsResponse.data.total_reviews || 0
        }))
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Không thể tải dữ liệu dashboard')
    } finally {
      setIsLoadingStats(false)
    }
  }

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (user && user.role === 'doctor') {
      const interval = setInterval(() => {
        fetchDashboardDataOptimized(true) // Silent refresh
      }, 5 * 60 * 1000) // 5 minutes

      return () => clearInterval(interval)
    }
  }, [user])

  const fetchDashboardDataOptimized = async (silent: boolean = false) => {
    if (!user || user.role !== 'doctor') {
      console.log('User not available or not a doctor:', user)
      setIsLoadingStats(false)
      return
    }

    try {
      if (!silent) {
        setIsLoadingStats(true)
      } else {
        setIsRefreshing(true)
      }

      console.log('🔄 [Dashboard] Fetching complete dashboard data...')

      // Use the new optimized endpoint
      const dashboardResponse = await doctorsApi.getDashboardComplete()

      if (dashboardResponse.success && dashboardResponse.data) {
        const data = dashboardResponse.data

        console.log('✅ [Dashboard] Data loaded successfully:', {
          responseTime: data.responseTime,
          lastUpdated: data.lastUpdated,
          statsCount: Object.keys(data.stats || {}).length,
          scheduleCount: data.todaySchedule?.length || 0,
          appointmentsCount: data.recentAppointments?.length || 0
        })

        // Update dashboard stats
        setDashboardStats({
          totalPatients: data.stats.totalPatients || 0,
          todayAppointments: data.stats.todayAppointments || 0,
          upcomingAppointments: data.stats.upcomingAppointments || 0,
          completedAppointments: data.stats.completedAppointments || 0,
          averageRating: data.stats.averageRating || 0,
          totalReviews: data.stats.totalReviews || 0,
          thisWeekAppointments: data.stats.thisWeekAppointments || 0,
          thisMonthAppointments: data.stats.thisMonthAppointments || 0,
          successRate: data.stats.successRate || 0,
          totalRevenue: data.stats.totalRevenue || 0
        })

        // Update recent appointments
        setRecentAppointments(data.recentAppointments || [])

        // Update today's schedule
        setTodaySchedule(data.todaySchedule || [])

        // Update last updated time
        setLastUpdated(new Date(data.lastUpdated))

        if (!silent) {
          toast.success(`Dashboard updated successfully (${data.responseTime}ms)`)
        }

      } else {
        console.error('❌ [Dashboard] Failed to load data:', dashboardResponse)
        toast.error('Không thể tải dữ liệu dashboard')
      }

    } catch (error) {
      console.error('❌ [Dashboard] Error fetching data:', error)
      if (!silent) {
        toast.error('Lỗi khi tải dữ liệu dashboard')
      }
    } finally {
      setIsLoadingStats(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = () => {
    fetchDashboardDataOptimized()
  }

  // Show loading state while user data is being fetched
  if (loading) {
    return (
      <DoctorLayout title="Doctor Dashboard" activePage="dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </DoctorLayout>
    )
  }

  // Enhanced debug and redirect logic
  console.log('🏥 [DoctorDashboard] Access check:', {
    hasUser: !!user,
    userRole: user?.role,
    isDoctor: user?.role === 'doctor',
    loading
  })

  // Don't render anything if redirecting or wrong role
  if (!user || user.role !== 'doctor') {
    return (
      <DoctorLayout title="Doctor Dashboard" activePage="dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </DoctorLayout>
    )
  }

  // Mock data for recent activities (can be replaced with real data later)
  const recentActivities = [
    {
      id: "1",
      type: "appointment" as const,
      title: "Completed appointment",
      description: "Khám tổng quát cho bệnh nhân",
      time: "2 hours ago",
      status: "completed" as const,
      initials: "PT"
    },
    {
      id: "2",
      type: "patient" as const,
      title: "New patient registered",
      description: "Bệnh nhân mới đã đăng ký khám",
      time: "4 hours ago",
      status: "pending" as const,
      initials: "NP"
    },
    {
      id: "3",
      type: "report" as const,
      title: "Lab results available",
      description: "Kết quả xét nghiệm đã có",
      time: "1 day ago",
      status: "completed" as const,
      initials: "LR"
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <DoctorLayout
      title="Doctor Dashboard"
      activePage="dashboard"
      subtitle="Welcome to your medical practice portal"
      headerActions={
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/doctors/schedule">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </a>
          </Button>
          <Button size="sm" asChild>
            <a href="/doctors/patients">
              <Users className="h-4 w-4 mr-2" />
              Patients
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/doctors/appointments">
              <Clock className="h-4 w-4 mr-2" />
              Appointments
            </a>
          </Button>
          <div className="text-xs text-gray-500 flex items-center">
            <Timer className="h-3 w-3 mr-1" />
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      }
    >
      <div className="p-6 space-y-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Welcome back, Dr. {user.full_name}!
              </h2>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {user.email} • {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </p>
            </div>
          </div>
          <p className="text-gray-600 text-lg">{currentDate}</p>

          {/* Professional Status */}
          <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Award className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-green-800">Professional Status: Active</h3>
                <p className="text-sm text-green-700">
                  {isLoadingStats ? (
                    "Loading appointment information..."
                  ) : (
                    `You have ${dashboardStats.todayAppointments} appointments scheduled for today. Ready to provide excellent care!`
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Today's Appointments</p>
                  {isLoadingStats ? (
                    <div className="animate-pulse bg-blue-200 h-8 w-16 rounded mt-1"></div>
                  ) : (
                    <p className="text-3xl font-bold text-blue-900">{dashboardStats.todayAppointments}</p>
                  )}
                  <p className="text-xs text-blue-700 mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Scheduled for today
                  </p>
                </div>
                <div className="p-3 bg-blue-200 rounded-full">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Total Patients</p>
                  {isLoadingStats ? (
                    <div className="animate-pulse bg-green-200 h-8 w-16 rounded mt-1"></div>
                  ) : (
                    <p className="text-3xl font-bold text-green-900">{dashboardStats.totalPatients}</p>
                  )}
                  <p className="text-xs text-green-700 mt-1 flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Under your care
                  </p>
                </div>
                <div className="p-3 bg-green-200 rounded-full">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Upcoming Appointments</p>
                  {isLoadingStats ? (
                    <div className="animate-pulse bg-orange-200 h-8 w-16 rounded mt-1"></div>
                  ) : (
                    <p className="text-3xl font-bold text-orange-900">{dashboardStats.upcomingAppointments}</p>
                  )}
                  <p className="text-xs text-orange-700 mt-1">Next appointments</p>
                </div>
                <div className="p-3 bg-orange-200 rounded-full">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Completed</p>
                  {isLoadingStats ? (
                    <div className="animate-pulse bg-purple-200 h-8 w-16 rounded mt-1"></div>
                  ) : (
                    <p className="text-3xl font-bold text-purple-900">{dashboardStats.completedAppointments}</p>
                  )}
                  <p className="text-xs text-purple-700 mt-1 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Total completed
                  </p>
                </div>
                <div className="p-3 bg-purple-200 rounded-full">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-600">Success Rate</p>
                  {isLoadingStats ? (
                    <div className="animate-pulse bg-indigo-200 h-8 w-16 rounded mt-1"></div>
                  ) : (
                    <p className="text-3xl font-bold text-indigo-900">{dashboardStats.successRate.toFixed(1)}%</p>
                  )}
                  <p className="text-xs text-indigo-700 mt-1">This month</p>
                </div>
                <div className="p-3 bg-indigo-200 rounded-full">
                  <Target className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-600">Monthly Revenue</p>
                  {isLoadingStats ? (
                    <div className="animate-pulse bg-emerald-200 h-8 w-16 rounded mt-1"></div>
                  ) : (
                    <p className="text-3xl font-bold text-emerald-900">
                      ${dashboardStats.totalRevenue.toLocaleString()}
                    </p>
                  )}
                  <p className="text-xs text-emerald-700 mt-1">Total earnings</p>
                </div>
                <div className="p-3 bg-emerald-200 rounded-full">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-rose-600">Patient Rating</p>
                  {isLoadingStats ? (
                    <div className="animate-pulse bg-rose-200 h-8 w-16 rounded mt-1"></div>
                  ) : (
                    <div className="flex items-center">
                      <p className="text-3xl font-bold text-rose-900">{dashboardStats.averageRating.toFixed(1)}</p>
                      <div className="ml-2 flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Heart
                            key={star}
                            className={`h-4 w-4 ${
                              star <= dashboardStats.averageRating ? 'text-rose-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-rose-700 mt-1">{dashboardStats.totalReviews} reviews</p>
                </div>
                <div className="p-3 bg-rose-200 rounded-full">
                  <Award className="h-6 w-6 text-rose-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Today's Schedule */}
          <Card className="lg:col-span-2 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Today's Schedule
                </CardTitle>
                <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {isLoadingStats ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-4">
                        <div className="animate-pulse bg-gray-200 h-12 w-16 rounded-lg"></div>
                        <div>
                          <div className="animate-pulse bg-gray-200 h-4 w-32 rounded mb-2"></div>
                          <div className="animate-pulse bg-gray-200 h-3 w-24 rounded"></div>
                        </div>
                      </div>
                      <div className="animate-pulse bg-gray-200 h-6 w-20 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : recentAppointments.length > 0 ? (
                <div className="space-y-4">
                  {recentAppointments.map((appointment, index) => (
                    <div key={appointment.id || `appointment-${index}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="text-center bg-white p-3 rounded-lg shadow-sm">
                          <div className="text-sm font-semibold text-gray-900">{appointment.start_time}</div>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{appointment.patient_name}</p>
                          <p className="text-sm text-green-600">{appointment.appointment_type}</p>
                        </div>
                      </div>
                      <Badge className={`${getStatusColor(appointment.status)} font-medium`}>
                        {appointment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments today</h3>
                  <p className="text-gray-600">You have a free day! Take some time to rest or catch up on other tasks.</p>
                  <Button variant="outline" size="sm" className="mt-4" asChild>
                    <a href="/doctors/schedule">
                      Set up schedule
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <Button className="w-full justify-start bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 border-blue-200" variant="outline">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Appointment
                </Button>
                <Button className="w-full justify-start bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 text-green-700 border-green-200" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  View My Patients
                </Button>
                <Button className="w-full justify-start bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 text-purple-700 border-purple-200" variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Medical Records
                </Button>
                <Button className="w-full justify-start bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 text-orange-700 border-orange-200" variant="outline">
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Prescriptions
                </Button>
                <Button className="w-full justify-start bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-red-700 border-red-200" variant="outline">
                  <TestTube className="mr-2 h-4 w-4" />
                  Lab Results
                </Button>
                <Button className="w-full justify-start bg-gradient-to-r from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 text-indigo-700 border-indigo-200" variant="outline">
                  <Clock className="mr-2 h-4 w-4" />
                  Update Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-lg">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Today's Time Slots
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isLoadingStats ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                        <div className="animate-pulse bg-gray-200 h-4 w-24 rounded"></div>
                      </div>
                      <div className="animate-pulse bg-gray-200 h-6 w-16 rounded-full"></div>
                    </div>
                  ))}
                </div>
              ) : todaySchedule.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {todaySchedule.slice(0, 8).map((slot, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className={`px-2 py-1 rounded text-xs font-medium min-w-[50px] text-center ${
                          slot.status === 'available' ? 'bg-blue-100 text-blue-800' :
                          slot.status === 'booked' ? 'bg-green-100 text-green-800' :
                          slot.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {slot.time}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {slot.patient_name || 'Available'}
                          </p>
                          {slot.appointment_type && (
                            <p className="text-xs text-gray-600">{slot.appointment_type}</p>
                          )}
                          {slot.reason && (
                            <p className="text-xs text-gray-500">• {slot.reason}</p>
                          )}
                        </div>
                      </div>
                      <Badge className={`text-xs ${getStatusColor(slot.status)}`}>
                        {slot.status}
                      </Badge>
                    </div>
                  ))}
                  {todaySchedule.length > 8 && (
                    <div className="text-center pt-3">
                      <Button variant="outline" size="sm" asChild>
                        <a href="/doctors/schedule">
                          View all {todaySchedule.length} slots
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No schedule set for today</p>
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <a href="/doctors/schedule">
                      <Calendar className="h-4 w-4 mr-2" />
                      Set Schedule
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Appointments */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Appointments
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isLoadingStats ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                        <div className="animate-pulse bg-gray-200 h-4 w-24 rounded"></div>
                      </div>
                      <div className="animate-pulse bg-gray-200 h-6 w-16 rounded-full"></div>
                    </div>
                  ))}
                </div>
              ) : recentAppointments.length > 0 ? (
                <div className="space-y-3">
                  {recentAppointments.slice(0, 5).map((appointment, index) => (
                    <div key={appointment.appointment_id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="text-center bg-white p-2 rounded-lg shadow-sm min-w-[50px]">
                          <div className="text-xs font-semibold text-gray-900">{appointment.start_time}</div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{appointment.patient_name}</p>
                          <p className="text-xs text-gray-600">{appointment.appointment_type}</p>
                          {appointment.reason && (
                            <p className="text-xs text-gray-500">• {appointment.reason}</p>
                          )}
                        </div>
                      </div>
                      <Badge className={`text-xs ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No recent appointments</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Appointment Statistics */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Weekly Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ChartCard title="" className="border-0 shadow-none">
                <div className="h-64 flex items-end justify-between">
                  <BarChartGroup label="Mon" value1={45} value2={30} />
                  <BarChartGroup label="Tue" value1={55} value2={40} />
                  <BarChartGroup label="Wed" value1={35} value2={25} />
                  <BarChartGroup label="Thu" value1={65} value2={50} />
                  <BarChartGroup label="Fri" value1={50} value2={35} />
                  <BarChartGroup label="Sat" value1={30} value2={20} />
                  <BarChartGroup label="Sun" value1={20} value2={15} />
                </div>
                <div className="flex justify-center space-x-6 mt-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-gray-600">Scheduled</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-600">Completed</span>
                  </div>
                </div>
              </ChartCard>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-t-lg">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <RecentActivity
                activities={recentActivities}
                title=""
                maxItems={5}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </DoctorLayout>
  )
}