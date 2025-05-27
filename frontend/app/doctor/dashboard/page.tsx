"use client"

import { useState, useEffect } from "react"
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
  Award
} from "lucide-react"
import { DoctorLayout } from "@/components/layout/DoctorLayout"
import { StatCard } from "@/components/dashboard/StatCard"
import { ChartCard, BarChartGroup } from "@/components/dashboard/ChartCard"
import { RecentActivity } from "@/components/dashboard/RecentActivity"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useSupabaseAuth } from "@/lib/hooks/useSupabaseAuth"

export default function DoctorDashboard() {
  const { user, loading } = useSupabaseAuth()
  const [currentDate, setCurrentDate] = useState("")

  // Debug logs
  console.log('🏥 [DoctorDashboard] Render state:', {
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
      <DoctorLayout title="Doctor Dashboard" activePage="dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </DoctorLayout>
    )
  }

  // Redirect if not authenticated or not a doctor
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

  // Mock data cho doctor dashboard
  const todayAppointments = [
    {
      id: "1",
      time: "09:00",
      patient: "Nguyễn Văn A",
      type: "Khám tổng quát",
      status: "confirmed"
    },
    {
      id: "2",
      time: "10:30",
      patient: "Trần Thị B",
      type: "Tái khám",
      status: "confirmed"
    },
    {
      id: "3",
      time: "14:00",
      patient: "Lê Văn C",
      type: "Khám chuyên khoa",
      status: "pending"
    },
    {
      id: "4",
      time: "15:30",
      patient: "Phạm Thị D",
      type: "Khám tổng quát",
      status: "confirmed"
    }
  ]

  const recentActivities = [
    {
      id: "1",
      type: "appointment" as const,
      title: "Completed appointment",
      description: "Khám tổng quát cho bệnh nhân Nguyễn Văn A",
      time: "2 hours ago",
      status: "completed" as const,
      initials: "NVA"
    },
    {
      id: "2",
      type: "patient" as const,
      title: "New patient registered",
      description: "Trần Thị B đã đăng ký khám",
      time: "4 hours ago",
      status: "pending" as const,
      initials: "TTB"
    },
    {
      id: "3",
      type: "report" as const,
      title: "Lab results available",
      description: "Kết quả xét nghiệm cho Lê Văn C",
      time: "1 day ago",
      status: "completed" as const,
      initials: "LVC"
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
    <DoctorLayout title="Doctor Dashboard" activePage="dashboard">
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
                  You have 4 appointments scheduled for today. Ready to provide excellent care!
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
                  <p className="text-3xl font-bold text-blue-900">{todayAppointments.length}</p>
                  <p className="text-xs text-blue-700 mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +12% from yesterday
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
                  <p className="text-3xl font-bold text-green-900">156</p>
                  <p className="text-xs text-green-700 mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +8% this month
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
                  <p className="text-sm font-medium text-orange-600">Pending Reports</p>
                  <p className="text-3xl font-bold text-orange-900">8</p>
                  <p className="text-xs text-orange-700 mt-1">Need review</p>
                </div>
                <div className="p-3 bg-orange-200 rounded-full">
                  <FileText className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">This Week</p>
                  <p className="text-3xl font-bold text-purple-900">32</p>
                  <p className="text-xs text-purple-700 mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +5% completed
                  </p>
                </div>
                <div className="p-3 bg-purple-200 rounded-full">
                  <Activity className="h-6 w-6 text-purple-600" />
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
              <div className="space-y-4">
                {todayAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="text-center bg-white p-3 rounded-lg shadow-sm">
                        <div className="text-sm font-semibold text-gray-900">{appointment.time}</div>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{appointment.patient}</p>
                        <p className="text-sm text-green-600">{appointment.type}</p>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(appointment.status)} font-medium`}>
                      {appointment.status}
                    </Badge>
                  </div>
                ))}
              </div>
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
