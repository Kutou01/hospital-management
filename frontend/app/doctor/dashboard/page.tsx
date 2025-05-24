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
  TestTube
} from "lucide-react"
import { DoctorLayout } from "@/components/layout/DoctorLayout"
import { StatCard } from "@/components/dashboard/StatCard"
import { ChartCard, BarChartGroup } from "@/components/dashboard/ChartCard"
import { RecentActivity } from "@/components/dashboard/RecentActivity"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuthProvider } from "@/hooks/useAuthProvider"

export default function DoctorDashboard() {
  const { user, loading } = useAuthProvider()
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
      {/* Welcome Section */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-green-100 rounded-lg">
            <Stethoscope className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome back, Dr. {user.full_name}!
            </h2>
            <p className="text-sm text-gray-600">
              {user.email} • {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </p>
          </div>
        </div>
        <p className="text-gray-600">{currentDate}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Today's Appointments"
          value={todayAppointments.length}
          change={12}
          icon={<Calendar className="text-blue-500" />}
          description="4 scheduled for today"
        />
        <StatCard
          title="Total Patients"
          value="156"
          change={8}
          icon={<Users className="text-green-500" />}
          description="Active patients"
        />
        <StatCard
          title="Pending Reports"
          value="8"
          change={-15}
          icon={<FileText className="text-orange-500" />}
          description="Need review"
        />
        <StatCard
          title="This Week"
          value="32"
          change={5}
          icon={<Activity className="text-purple-500" />}
          description="Appointments completed"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Today's Schedule */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">Today's Schedule</h3>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
            <div className="space-y-4">
              {todayAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-sm font-medium">{appointment.time}</div>
                    </div>
                    <div>
                      <p className="font-medium">{appointment.patient}</p>
                      <p className="text-sm text-gray-500">{appointment.type}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(appointment.status)}>
                    {appointment.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Appointment
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                View My Patients
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Medical Records
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <ClipboardList className="mr-2 h-4 w-4" />
                Prescriptions
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <TestTube className="mr-2 h-4 w-4" />
                Lab Results
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Clock className="mr-2 h-4 w-4" />
                Update Schedule
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Appointment Statistics */}
        <ChartCard title="Weekly Appointment Statistics" className="col-span-1">
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

        {/* Recent Activity */}
        <RecentActivity
          activities={recentActivities}
          title="Recent Activity"
          maxItems={5}
        />
      </div>
    </DoctorLayout>
  )
}
