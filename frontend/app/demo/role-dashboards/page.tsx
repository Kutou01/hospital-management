"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Shield,
  Stethoscope,
  User,
  Heart,
  Users,
  Calendar,
  Activity,
  AlertTriangle,
  TrendingUp,
  Clock,
  FileText,
  BedDouble,
  Pill,
  Building2
} from "lucide-react"

// Import enhanced components
import { EnhancedStatCard } from "@/components/dashboard/EnhancedStatCard"
import { RealTimeStatsEnhanced } from "@/components/dashboard/RealTimeStatsEnhanced"
import { InteractiveCalendar } from "@/components/dashboard/InteractiveCalendar"
import { ChartCard, ProgressChart, MetricComparison } from "@/components/dashboard/ChartCard"
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline"
import { NotificationCenter } from "@/components/dashboard/NotificationCenter"

export default function RoleDashboardsDemo() {
  const [selectedRole, setSelectedRole] = useState("admin")

  // Mock data for different roles
  const adminData = {
    stats: [
      { title: "Total Users", value: 1247, change: 8.2, icon: <Users className="h-6 w-6" />, color: "blue" as const },
      { title: "System Health", value: "98.5%", change: 0.3, icon: <Shield className="h-6 w-6" />, color: "green" as const },
      { title: "Revenue", value: "2.4M", change: 15.7, icon: <TrendingUp className="h-6 w-6" />, color: "purple" as const },
      { title: "Active Sessions", value: 156, change: -2.1, icon: <Activity className="h-6 w-6" />, color: "orange" as const }
    ],
    metrics: { activeUsers: 156, serverLoad: 45, databaseConnections: 23, responseTime: 120 }
  }

  const doctorData = {
    stats: [
      { title: "Today's Patients", value: 24, change: 12.5, icon: <Users className="h-6 w-6" />, color: "blue" as const },
      { title: "Appointments", value: 18, change: -5.2, icon: <Calendar className="h-6 w-6" />, color: "green" as const },
      { title: "Surgeries", value: 3, change: 0, icon: <Activity className="h-6 w-6" />, color: "red" as const },
      { title: "Consultations", value: 15, change: 8.7, icon: <Stethoscope className="h-6 w-6" />, color: "purple" as const }
    ],
    metrics: { activeUsers: 24, serverLoad: 0, databaseConnections: 0, responseTime: 0 }
  }

  const patientData = {
    stats: [
      { title: "Health Score", value: "92%", change: 2.1, icon: <Heart className="h-6 w-6" />, color: "green" as const },
      { title: "Appointments", value: 3, change: 0, icon: <Calendar className="h-6 w-6" />, color: "blue" as const },
      { title: "Medications", value: 5, change: -1, icon: <Pill className="h-6 w-6" />, color: "purple" as const },
      { title: "Test Results", value: 2, change: 1, icon: <FileText className="h-6 w-6" />, color: "orange" as const }
    ],
    metrics: { activeUsers: 0, serverLoad: 0, databaseConnections: 0, responseTime: 0 }
  }

  const nurseData = {
    stats: [
      { title: "Ward Patients", value: 32, change: 3.2, icon: <BedDouble className="h-6 w-6" />, color: "blue" as const },
      { title: "Critical Cases", value: 4, change: -1, icon: <AlertTriangle className="h-6 w-6" />, color: "red" as const },
      { title: "Medications Due", value: 18, change: 5, icon: <Pill className="h-6 w-6" />, color: "orange" as const },
      { title: "Shift Hours", value: "8h", change: 0, icon: <Clock className="h-6 w-6" />, color: "green" as const }
    ],
    metrics: { activeUsers: 32, serverLoad: 0, databaseConnections: 0, responseTime: 0 }
  }

  const getCurrentData = () => {
    switch (selectedRole) {
      case "admin": return adminData
      case "doctor": return doctorData
      case "patient": return patientData
      case "nurse": return nurseData
      default: return adminData
    }
  }

  const currentData = getCurrentData()

  const mockEvents = [
    {
      id: '1',
      title: 'Morning Rounds',
      date: new Date(),
      time: '08:00',
      type: 'appointment' as const,
      patient: 'Ward A',
      status: 'confirmed' as const
    }
  ]

  const mockActivities = [
    {
      id: '1',
      type: 'appointment' as const,
      title: 'Patient consultation completed',
      description: 'Regular checkup with positive results',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      user: { name: 'Dr. Smith', role: 'Doctor', avatar: '' },
      patient: { name: 'John Doe', id: 'PAT-001' },
      status: 'completed' as const,
      priority: 'medium' as const
    }
  ]

  const mockNotifications = [
    {
      id: '1',
      type: 'emergency' as const,
      title: 'Emergency Alert',
      message: 'Patient in room 205 requires immediate attention',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      isRead: false,
      priority: 'urgent' as const,
      sender: { name: 'Nurse Station', role: 'Nursing', avatar: '' }
    }
  ]

  const progressData = [
    { label: 'Daily Goals', value: 85, color: 'blue', target: 100 },
    { label: 'Patient Satisfaction', value: 92, color: 'green', target: 100 },
    { label: 'Efficiency', value: 78, color: 'orange', target: 100 }
  ]

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <Shield className="h-5 w-5" />
      case "doctor": return <Stethoscope className="h-5 w-5" />
      case "patient": return <User className="h-5 w-5" />
      case "nurse": return <Heart className="h-5 w-5" />
      default: return <Shield className="h-5 w-5" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "text-blue-600 bg-blue-100"
      case "doctor": return "text-green-600 bg-green-100"
      case "patient": return "text-purple-600 bg-purple-100"
      case "nurse": return "text-pink-600 bg-pink-100"
      default: return "text-blue-600 bg-blue-100"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">
            🏥 Role-Specific Dashboard Demo
          </h1>
          <p className="text-gray-600">
            Specialized dashboard layouts for different user roles in Hospital Management System
          </p>
        </div>

        {/* Role Selector */}
        <div className="flex justify-center">
          <Tabs value={selectedRole} onValueChange={setSelectedRole} className="w-full max-w-2xl">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Admin
              </TabsTrigger>
              <TabsTrigger value="doctor" className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                Doctor
              </TabsTrigger>
              <TabsTrigger value="patient" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Patient
              </TabsTrigger>
              <TabsTrigger value="nurse" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Nurse
              </TabsTrigger>
            </TabsList>

            {/* Admin Dashboard */}
            <TabsContent value="admin" className="space-y-6">
              <div className="flex items-center gap-2 mb-6">
                <div className={`p-2 rounded-lg ${getRoleColor("admin")}`}>
                  {getRoleIcon("admin")}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Admin Dashboard</h2>
                  <p className="text-gray-600">System overview and management</p>
                </div>
              </div>

              {/* Admin Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {currentData.stats.map((stat, index) => (
                  <EnhancedStatCard
                    key={index}
                    title={stat.title}
                    value={stat.value}
                    change={stat.change}
                    changeLabel="vs last month"
                    icon={stat.icon}
                    color={stat.color}
                    variant="gradient"
                    showTrend={true}
                  />
                ))}
              </div>

              {/* Admin Charts and System Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RealTimeStatsEnhanced
                  systemHealth="healthy"
                  metrics={currentData.metrics}
                  showDetailedMetrics={true}
                />
                <ChartCard title="System Performance" subtitle="Last 7 days">
                  <ProgressChart data={progressData} />
                </ChartCard>
              </div>
            </TabsContent>

            {/* Doctor Dashboard */}
            <TabsContent value="doctor" className="space-y-6">
              <div className="flex items-center gap-2 mb-6">
                <div className={`p-2 rounded-lg ${getRoleColor("doctor")}`}>
                  {getRoleIcon("doctor")}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Doctor Dashboard</h2>
                  <p className="text-gray-600">Patient care and medical management</p>
                </div>
              </div>

              {/* Doctor Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {currentData.stats.map((stat, index) => (
                  <EnhancedStatCard
                    key={index}
                    title={stat.title}
                    value={stat.value}
                    change={stat.change}
                    changeLabel="vs yesterday"
                    icon={stat.icon}
                    color={stat.color}
                    variant="gradient"
                    showTrend={true}
                  />
                ))}
              </div>

              {/* Doctor Calendar and Activities */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <InteractiveCalendar
                  events={mockEvents}
                  showMiniCalendar={true}
                  showEventList={false}
                />
                <ActivityTimeline
                  activities={mockActivities}
                  showFilters={false}
                  showSearch={false}
                  maxItems={5}
                />
              </div>
            </TabsContent>

            {/* Patient Dashboard */}
            <TabsContent value="patient" className="space-y-6">
              <div className="flex items-center gap-2 mb-6">
                <div className={`p-2 rounded-lg ${getRoleColor("patient")}`}>
                  {getRoleIcon("patient")}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Patient Dashboard</h2>
                  <p className="text-gray-600">Personal health management</p>
                </div>
              </div>

              {/* Patient Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {currentData.stats.map((stat, index) => (
                  <EnhancedStatCard
                    key={index}
                    title={stat.title}
                    value={stat.value}
                    change={stat.change}
                    changeLabel="vs last week"
                    icon={stat.icon}
                    color={stat.color}
                    variant="minimal"
                    showTrend={true}
                  />
                ))}
              </div>

              {/* Patient Health Tracking */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Health Metrics" subtitle="Weekly overview">
                  <ProgressChart data={[
                    { label: 'Blood Pressure', value: 85, color: 'green', target: 100 },
                    { label: 'Heart Rate', value: 92, color: 'blue', target: 100 },
                    { label: 'Weight', value: 78, color: 'purple', target: 100 }
                  ]} />
                </ChartCard>
                <NotificationCenter
                  notifications={mockNotifications}
                  showFilters={false}
                  showSearch={false}
                  maxItems={5}
                />
              </div>
            </TabsContent>

            {/* Nurse Dashboard */}
            <TabsContent value="nurse" className="space-y-6">
              <div className="flex items-center gap-2 mb-6">
                <div className={`p-2 rounded-lg ${getRoleColor("nurse")}`}>
                  {getRoleIcon("nurse")}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Nurse Dashboard</h2>
                  <p className="text-gray-600">Ward management and patient care</p>
                </div>
              </div>

              {/* Nurse Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {currentData.stats.map((stat, index) => (
                  <EnhancedStatCard
                    key={index}
                    title={stat.title}
                    value={stat.value}
                    change={stat.change}
                    changeLabel="vs last shift"
                    icon={stat.icon}
                    color={stat.color}
                    variant="outlined"
                    showTrend={true}
                  />
                ))}
              </div>

              {/* Nurse Ward Management */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Ward Occupancy" subtitle="Current status">
                  <ProgressChart data={[
                    { label: 'ICU', value: 85, color: 'red', target: 100 },
                    { label: 'General Ward', value: 70, color: 'blue', target: 100 },
                    { label: 'Emergency', value: 45, color: 'orange', target: 100 }
                  ]} />
                </ChartCard>
                <ActivityTimeline
                  activities={mockActivities}
                  showFilters={false}
                  showSearch={false}
                  maxItems={5}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Role Comparison */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">🔄 Role Comparison</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {["admin", "doctor", "patient", "nurse"].map(role => (
              <Card key={role} className={`border-2 ${selectedRole === role ? 'border-blue-500' : 'border-gray-200'}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${getRoleColor(role)}`}>
                      {getRoleIcon(role)}
                    </div>
                    <CardTitle className="capitalize">{role}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Focus:</span>
                      <span className="font-medium">
                        {role === "admin" && "System Management"}
                        {role === "doctor" && "Patient Care"}
                        {role === "patient" && "Health Tracking"}
                        {role === "nurse" && "Ward Management"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Key Metrics:</span>
                      <span className="font-medium">
                        {role === "admin" && "4 System"}
                        {role === "doctor" && "4 Clinical"}
                        {role === "patient" && "4 Health"}
                        {role === "nurse" && "4 Ward"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Components:</span>
                      <span className="font-medium">6-8 Widgets</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="text-center py-8 border-t border-gray-200">
          <p className="text-gray-600">
            🎯 Role-Specific Dashboards - Tailored for Healthcare Professionals
          </p>
        </div>
      </div>
    </div>
  )
}
