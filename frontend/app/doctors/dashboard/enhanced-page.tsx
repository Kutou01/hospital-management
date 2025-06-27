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
  RefreshCw,
  BarChart3,
  Heart,
  Timer,
  DollarSign,
  Target
} from "lucide-react"
import { DoctorLayout } from "@/components/layout/UniversalLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEnhancedAuth } from "@/lib/auth/auth-wrapper"
import { doctorsApi } from "@/lib/api/doctors"
import { toast } from "react-hot-toast"

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
  reason?: string
  appointment_id?: string
}

export default function EnhancedDoctorDashboard() {
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
  console.log('🏥 [Enhanced Dashboard] Render state:', {
    user,
    loading,
    userRole: user?.role,
    hasUser: !!user,
    userEmail: user?.email,
    userFullName: user?.full_name,
    timestamp: new Date().toISOString()
  })

  // Redirect if not authenticated or not a doctor
  useEffect(() => {
    if (!loading) {
      if (!user) {
        console.log('🔄 [Enhanced Dashboard] No user found, redirecting to login')
        router.push('/auth/signin?redirectTo=/doctors/dashboard')
        return
      }

      if (user.role !== 'doctor') {
        console.log('🔄 [Enhanced Dashboard] User is not a doctor, redirecting')
        router.push('/')
        return
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
      fetchDashboardData()
    }
  }, [user])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (user && user.role === 'doctor') {
      const interval = setInterval(() => {
        fetchDashboardData(true) // Silent refresh
      }, 5 * 60 * 1000) // 5 minutes

      return () => clearInterval(interval)
    }
  }, [user])

  const fetchDashboardData = async (silent: boolean = false) => {
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

      console.log('🔄 [Enhanced Dashboard] Fetching complete dashboard data...')

      // Use the new optimized endpoint
      const dashboardResponse = await doctorsApi.getDashboardComplete()

      if (dashboardResponse.success && dashboardResponse.data) {
        const data = dashboardResponse.data

        console.log('✅ [Enhanced Dashboard] Data loaded successfully:', {
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
        console.error('❌ [Enhanced Dashboard] Failed to load data:', dashboardResponse)
        toast.error('Không thể tải dữ liệu dashboard')
      }

    } catch (error) {
      console.error('❌ [Enhanced Dashboard] Error fetching data:', error)
      if (!silent) {
        toast.error('Lỗi khi tải dữ liệu dashboard')
      }
    } finally {
      setIsLoadingStats(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = () => {
    fetchDashboardData()
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

  // Show access denied if not a doctor
  if (!user || user.role !== 'doctor') {
    return (
      <DoctorLayout title="Doctor Dashboard" activePage="dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Access denied. Doctor role required.</p>
          </div>
        </div>
      </DoctorLayout>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
      case 'booked':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'available':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'emergency':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'urgent':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <DoctorLayout
      title="Doctor Dashboard"
      activePage="dashboard"
      subtitle={`Welcome back, Dr. ${user?.full_name || 'Doctor'} - ${currentDate}`}
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
      <div className="space-y-6">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Today's Appointments */}
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
                </div>
                <div className="p-3 bg-blue-200 rounded-full">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Patients */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Total Patients</p>
                  {isLoadingStats ? (
                    <div className="animate-pulse bg-green-200 h-8 w-16 rounded mt-1"></div>
                  ) : (
                    <p className="text-3xl font-bold text-green-900">{dashboardStats.totalPatients}</p>
                  )}
                </div>
                <div className="p-3 bg-green-200 rounded-full">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DoctorLayout>
  )
}
