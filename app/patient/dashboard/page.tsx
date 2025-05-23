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
  Thermometer
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { StatCard } from "@/components/dashboard/StatCard"
import { ChartCard, BarChartGroup } from "@/components/dashboard/ChartCard"
import { RecentActivity } from "@/components/dashboard/RecentActivity"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

export default function PatientDashboard() {
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
    <DashboardLayout title="Patient Dashboard" activePage="dashboard">
      {/* Welcome Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Welcome back, John!</h2>
        <p className="text-gray-600">{currentDate}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Upcoming Appointments"
          value={upcomingAppointments.length}
          icon={<Calendar className="text-blue-500" />}
          description="Next: Jan 15, 10:00 AM"
        />
        <StatCard
          title="Health Score"
          value="85%"
          change={5}
          icon={<Heart className="text-red-500" />}
          description="Good condition"
        />
        <StatCard
          title="Active Medications"
          value={medications.length}
          icon={<Pill className="text-green-500" />}
          description="Currently taking"
        />
        <StatCard
          title="Last Checkup"
          value="3 days"
          icon={<Activity className="text-purple-500" />}
          description="ago"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Upcoming Appointments */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">Upcoming Appointments</h3>
              <Button variant="outline" size="sm">
                Book New
              </Button>
            </div>
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-sm font-medium">{appointment.date}</div>
                      <div className="text-xs text-gray-500">{appointment.time}</div>
                    </div>
                    <div>
                      <p className="font-medium">{appointment.doctor}</p>
                      <p className="text-sm text-gray-500">{appointment.department}</p>
                      <p className="text-xs text-gray-400">{appointment.type}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(appointment.status)}>
                    {appointment.status}
                  </Badge>
                </div>
              ))}
              {upcomingAppointments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>No upcoming appointments</p>
                  <Button className="mt-2" size="sm">Book Appointment</Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Health Summary */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Health Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Blood Pressure</span>
                </div>
                <span className="text-sm font-medium">120/80</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Thermometer className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Temperature</span>
                </div>
                <span className="text-sm font-medium">36.5°C</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Heart Rate</span>
                </div>
                <span className="text-sm font-medium">72 bpm</span>
              </div>
              <div className="pt-4">
                <Button className="w-full" variant="outline" size="sm">
                  View Full Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Current Medications */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Current Medications</h3>
              <Button variant="ghost" size="sm">
                <Pill className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              {medications.map((med) => (
                <div key={med.id} className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{med.name}</p>
                      <p className="text-xs text-gray-500">{med.dosage}</p>
                    </div>
                    <span className="text-xs text-gray-500">{med.timeLeft}</span>
                  </div>
                  <Progress value={med.progress} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <RecentActivity 
          activities={recentActivities}
          title="Recent Activity"
          maxItems={4}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="h-20 flex-col space-y-2" variant="outline">
              <Calendar className="h-6 w-6" />
              <span className="text-xs">Book Appointment</span>
            </Button>
            <Button className="h-20 flex-col space-y-2" variant="outline">
              <FileText className="h-6 w-6" />
              <span className="text-xs">Medical Records</span>
            </Button>
            <Button className="h-20 flex-col space-y-2" variant="outline">
              <Heart className="h-6 w-6" />
              <span className="text-xs">Health Tracking</span>
            </Button>
            <Button className="h-20 flex-col space-y-2" variant="outline">
              <Pill className="h-6 w-6" />
              <span className="text-xs">Medications</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
