"use client"

import { useState, useEffect } from "react"
import {
  Calendar,
  Heart,
  FileText,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle,
  Pill,
  Thermometer,
  AlertCircle,
  MessageCircle,
  Phone,
  TrendingUp,
  Users,
  Shield,
  Zap
} from "lucide-react"
import { PatientLayout } from "@/components/layout/UniversalLayout"
import { StatCard } from "@/components/dashboard/StatCard"
import { ChartCard, BarChartGroup } from "@/components/dashboard/ChartCard"
import { RecentActivity } from "@/components/dashboard/RecentActivity"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useEnhancedAuth } from "@/lib/auth/enhanced-auth-context"

export default function PatientDashboard() {
  const { user, loading } = useEnhancedAuth()
  const [currentDate, setCurrentDate] = useState("")

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
      <PatientLayout title="Patient Dashboard" activePage="dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PatientLayout>
    )
  }

  // Redirect if not authenticated or not a patient
  if (!user || user.role !== 'patient') {
    return (
      <PatientLayout title="Patient Dashboard" activePage="dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Access denied. Patient role required.</p>
          </div>
        </div>
      </PatientLayout>
    )
  }

  // Mock data cho patient dashboard
  const upcomingAppointments = [
    {
      id: "1",
      date: "2024-01-15",
      time: "10:00",
      doctor: "Dr. Nguyễn Văn A",
      department: "Khoa Nội",
      type: "Khám tổng quát",
      status: "confirmed"
    },
    {
      id: "2",
      date: "2024-01-20",
      time: "14:30",
      doctor: "Dr. Trần Thị B",
      department: "Khoa Tim mạch",
      type: "Tái khám",
      status: "pending"
    }
  ]

  const medications = [
    {
      id: "1",
      name: "Paracetamol 500mg",
      dosage: "2 viên/ngày",
      timeLeft: "5 ngày",
      progress: 60
    },
    {
      id: "2",
      name: "Vitamin D3",
      dosage: "1 viên/ngày",
      timeLeft: "15 ngày",
      progress: 80
    }
  ]

  const recentActivities = [
    {
      id: "1",
      type: "appointment" as const,
      title: "Appointment completed",
      description: "Khám tổng quát với Dr. Nguyễn Văn A",
      time: "2 days ago",
      status: "completed" as const,
      initials: "NVA"
    },
    {
      id: "2",
      type: "report" as const,
      title: "Lab results available",
      description: "Kết quả xét nghiệm máu đã có",
      time: "3 days ago",
      status: "completed" as const,
      initials: "LAB"
    },
    {
      id: "3",
      type: "appointment" as const,
      title: "Appointment scheduled",
      description: "Đã đặt lịch khám với Dr. Trần Thị B",
      time: "1 week ago",
      status: "pending" as const,
      initials: "TTB"
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
    <PatientLayout
      title="Patient Dashboard"
      activePage="dashboard"
      subtitle="Your personal health management portal"
      headerActions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Book Appointment
          </Button>
          <Button size="sm">
            <Heart className="h-4 w-4 mr-2" />
            Health Tracking
          </Button>
        </div>
      }
    >
      <div className="p-6 space-y-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Welcome back, {user.full_name}!
              </h2>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {user.email} • {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </p>
            </div>
          </div>
          <p className="text-gray-600 text-lg">{currentDate}</p>

          {/* Health Status Alert */}
          <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-green-800">Health Status: Excellent</h3>
                <p className="text-sm text-green-700">
                  Your health metrics are looking great. Keep up the good work!
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
                  <p className="text-sm font-medium text-blue-600">Upcoming Appointments</p>
                  <p className="text-3xl font-bold text-blue-900">{upcomingAppointments.length}</p>
                  <p className="text-xs text-blue-700 mt-1">Next: Jan 15, 10:00 AM</p>
                </div>
                <div className="p-3 bg-blue-200 rounded-full">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-pink-100 border-red-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Health Score</p>
                  <p className="text-3xl font-bold text-red-900">85%</p>
                  <p className="text-xs text-red-700 mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +5% from last month
                  </p>
                </div>
                <div className="p-3 bg-red-200 rounded-full">
                  <Heart className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Active Medications</p>
                  <p className="text-3xl font-bold text-green-900">{medications.length}</p>
                  <p className="text-xs text-green-700 mt-1">Currently taking</p>
                </div>
                <div className="p-3 bg-green-200 rounded-full">
                  <Pill className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Last Checkup</p>
                  <p className="text-3xl font-bold text-purple-900">3 days</p>
                  <p className="text-xs text-purple-700 mt-1">ago</p>
                </div>
                <div className="p-3 bg-purple-200 rounded-full">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Upcoming Appointments */}
          <Card className="lg:col-span-2 shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Appointments
                </CardTitle>
                <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                  Book New
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="text-center bg-white p-3 rounded-lg shadow-sm">
                        <div className="text-sm font-semibold text-gray-900">{appointment.date}</div>
                        <div className="text-xs text-gray-500">{appointment.time}</div>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{appointment.doctor}</p>
                        <p className="text-sm text-blue-600">{appointment.department}</p>
                        <p className="text-xs text-gray-500">{appointment.type}</p>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(appointment.status)} font-medium`}>
                      {appointment.status}
                    </Badge>
                  </div>
                ))}
                {upcomingAppointments.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <Calendar className="h-10 w-10 text-gray-400" />
                    </div>
                    <p className="text-lg font-medium mb-2">No upcoming appointments</p>
                    <p className="text-sm text-gray-400 mb-4">Schedule your next visit with your healthcare provider</p>
                    <Button className="bg-blue-600 hover:bg-blue-700">Book Appointment</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Health Summary */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Health Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-full">
                      <Heart className="h-4 w-4 text-red-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Blood Pressure</span>
                  </div>
                  <span className="text-lg font-bold text-red-600">120/80</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Thermometer className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Temperature</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">36.5°C</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <Activity className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Heart Rate</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">72 bpm</span>
                </div>
                <div className="pt-4">
                  <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium">
                    View Full Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Current Medications */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Current Medications
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {medications.map((med) => (
                  <div key={med.id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{med.name}</p>
                        <p className="text-sm text-gray-600">{med.dosage}</p>
                      </div>
                      <span className="text-sm font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                        {med.timeLeft}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium text-gray-900">{med.progress}%</span>
                      </div>
                      <Progress value={med.progress} className="h-3 bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <RecentActivity
                activities={recentActivities}
                title=""
                maxItems={4}
              />
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Button className="h-24 flex-col space-y-2 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 border-blue-200" variant="outline">
                <Calendar className="h-8 w-8" />
                <span className="text-xs font-medium">Book Appointment</span>
              </Button>
              <Button className="h-24 flex-col space-y-2 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 text-green-700 border-green-200" variant="outline">
                <FileText className="h-8 w-8" />
                <span className="text-xs font-medium">Medical Records</span>
              </Button>
              <Button className="h-24 flex-col space-y-2 bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-red-700 border-red-200" variant="outline">
                <Heart className="h-8 w-8" />
                <span className="text-xs font-medium">Health Tracking</span>
              </Button>
              <Button className="h-24 flex-col space-y-2 bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 text-orange-700 border-orange-200" variant="outline">
                <Pill className="h-8 w-8" />
                <span className="text-xs font-medium">Medications</span>
              </Button>
              <Button className="h-24 flex-col space-y-2 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 text-purple-700 border-purple-200" variant="outline">
                <MessageCircle className="h-8 w-8" />
                <span className="text-xs font-medium">Contact Doctor</span>
              </Button>
              <Button className="h-24 flex-col space-y-2 bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-red-700 border-red-200" variant="outline">
                <Phone className="h-8 w-8" />
                <span className="text-xs font-medium">Emergency</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PatientLayout>
  )
}
