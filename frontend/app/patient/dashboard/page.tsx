"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { useEnhancedAuth } from "@/lib/auth/auth-wrapper"
import { appointmentsApi, patientsApi, medicalRecordsApi, prescriptionsApi } from "@/lib/api"
import { toast } from "sonner"

export default function PatientDashboard() {
  const { user, loading } = useEnhancedAuth()
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState("")

  // State for dashboard data
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([])
  const [medications, setMedications] = useState<any[]>([])
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [healthMetrics, setHealthMetrics] = useState<any>({
    bloodPressure: "N/A",
    heartRate: "N/A",
    temperature: "N/A",
    weight: "N/A",
    height: "N/A",
    bmi: "N/A",
    lastUpdated: "N/A"
  })
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Handle authentication and redirect
  useEffect(() => {
    console.log('🏥 [PatientDashboard] Auth state changed:', {
      loading,
      user,
      isAuthenticated: !!user,
      role: user?.role
    })

    // Handle redirect when auth state is determined
    if (!loading) {
      if (!user) {
        console.log('🏥 [PatientDashboard] No user found, redirecting to login')
        router.replace('/auth/login')
      } else if (user.role !== 'patient') {
        console.log(`🏥 [PatientDashboard] Wrong role (${user.role}), redirecting to appropriate dashboard`)
        // Redirect to appropriate dashboard based on role
        switch (user.role) {
          case 'admin':
            router.replace('/admin/dashboard')
            break
          case 'doctor':
            router.replace('/doctors/dashboard')
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

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      console.log('🏥 [PatientDashboard] Loading dashboard data for user:', {
        user,
        patient_id: user?.patient_id,
        hasPatientId: !!user?.patient_id
      })

      if (!user?.patient_id) {
        console.log('🏥 [PatientDashboard] No patient_id found, trying to fetch from API...')

        // Try to get patient_id via API
        try {
          const patientResponse = await patientsApi.getByProfileId(user.id)
          if (patientResponse.success && patientResponse.data) {
            console.log('🏥 [PatientDashboard] Found patient via API:', patientResponse.data.patient_id)
            // Update user object with patient_id (temporary fix)
            user.patient_id = patientResponse.data.patient_id
          } else {
            console.log('🏥 [PatientDashboard] No patient record found for profile_id:', user.id)
            setIsLoadingData(false)
            return
          }
        } catch (error) {
          console.error('🏥 [PatientDashboard] Error fetching patient by profile_id:', error)
          setIsLoadingData(false)
          return
        }
      }

      try {
        setIsLoadingData(true)

        // Load upcoming appointments
        console.log('🏥 [PatientDashboard] Loading appointments for patient:', user.patient_id)
        const appointmentsResponse = await appointmentsApi.getByPatientId(user.patient_id)
        console.log('🏥 [PatientDashboard] Appointments response:', appointmentsResponse)
        if (appointmentsResponse.success && appointmentsResponse.data) {
          // Filter upcoming appointments and sort by date
          const upcoming = appointmentsResponse.data
            .filter((apt: any) => {
              const appointmentDate = new Date(apt.appointment_date)
              return appointmentDate >= new Date() && apt.status !== 'cancelled'
            })
            .sort((a: any, b: any) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())
            .slice(0, 3) // Get next 3 appointments

          setUpcomingAppointments(upcoming)
        }

        // Load current medications (prescriptions)
        console.log('🏥 [PatientDashboard] Loading prescriptions for patient:', user.patient_id)
        const prescriptionsResponse = await prescriptionsApi.getByPatientId(user.patient_id)
        console.log('🏥 [PatientDashboard] Prescriptions response:', prescriptionsResponse)
        if (prescriptionsResponse.success && prescriptionsResponse.data) {
          // Filter active prescriptions
          const activeMeds = prescriptionsResponse.data
            .filter((prescription: any) => prescription.status === 'active')
            .map((prescription: any) => ({
              id: prescription.prescription_id,
              name: prescription.medication_name,
              dosage: prescription.dosage,
              timeLeft: prescription.duration || "N/A",
              progress: 70 // This would be calculated based on start date and duration
            }))

          setMedications(activeMeds)
        }

        // Load patient health metrics (from patient profile)
        console.log('🏥 [PatientDashboard] Loading patient profile for:', user.patient_id)
        const patientResponse = await patientsApi.getById(user.patient_id)
        console.log('🏥 [PatientDashboard] Patient profile response:', patientResponse)
        if (patientResponse.success && patientResponse.data) {
          const patient = patientResponse.data
          setHealthMetrics({
            bloodPressure: patient.blood_pressure || "120/80",
            heartRate: patient.heart_rate || "72 bpm",
            temperature: patient.temperature || "36.5°C",
            weight: patient.weight || "N/A",
            height: patient.height || "N/A",
            bmi: patient.bmi || "N/A",
            lastUpdated: patient.updated_at ? new Date(patient.updated_at).toLocaleDateString('vi-VN') : "N/A"
          })
        }

        // Create recent activities from appointments and medical records
        const recentAppointments = appointmentsResponse.data?.slice(0, 2).map((apt: any) => ({
          id: apt.appointment_id,
          type: "appointment" as const,
          title: apt.status === 'completed' ? "Appointment completed" : "Appointment scheduled",
          description: `${apt.appointment_type} với ${apt.doctor_name || 'Doctor'}`,
          time: new Date(apt.appointment_date).toLocaleDateString('vi-VN'),
          status: apt.status as const,
          initials: apt.doctor_name?.split(' ').map((n: string) => n[0]).join('') || "DR"
        })) || []

        setRecentActivities(recentAppointments)

      } catch (error) {
        console.error('🏥 [PatientDashboard] Error loading dashboard data:', error)
        toast.error('Không thể tải dữ liệu dashboard')
      } finally {
        console.log('🏥 [PatientDashboard] Dashboard data loading completed')
        setIsLoadingData(false)
      }
    }

    loadDashboardData()
  }, [user?.patient_id])

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

  // Enhanced debug and redirect logic
  console.log('🏥 [PatientDashboard] Access check:', {
    hasUser: !!user,
    userRole: user?.role,
    isPatient: user?.role === 'patient',
    loading
  })

  // Don't render anything if redirecting or wrong role
  if (!user || user.role !== 'patient') {
    return (
      <PatientLayout title="Patient Dashboard" activePage="dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PatientLayout>
    )
  }

  // Show loading state while data is being fetched
  if (isLoadingData) {
    return (
      <PatientLayout title="Patient Dashboard" activePage="dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading dashboard data...</span>
        </div>
      </PatientLayout>
    )
  }

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
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/doctors/1')}
          >
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
              {/* Debug info */}
              <p className="text-xs text-gray-500 mt-1">
                Patient ID: {user.patient_id || 'Not found'} | Profile ID: {user.id}
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
                  <p className="text-xs text-blue-700 mt-1">
                    {upcomingAppointments.length > 0
                      ? `Next: ${new Date(upcomingAppointments[0].appointment_date).toLocaleDateString('vi-VN')}, ${upcomingAppointments[0].start_time}`
                      : "No upcoming appointments"
                    }
                  </p>
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
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  onClick={() => router.push('/doctors/1')}
                >
                  Book New
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.appointment_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="text-center bg-white p-3 rounded-lg shadow-sm">
                        <div className="text-sm font-semibold text-gray-900">
                          {new Date(appointment.appointment_date).toLocaleDateString('vi-VN')}
                        </div>
                        <div className="text-xs text-gray-500">{appointment.start_time}</div>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{appointment.doctor_name || 'Doctor'}</p>
                        <p className="text-sm text-blue-600">{appointment.department || 'Department'}</p>
                        <p className="text-xs text-gray-500">{appointment.appointment_type}</p>
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
                    <Button
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => router.push('/doctors/1')}
                    >
                      Book Appointment
                    </Button>
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
                  <span className="text-lg font-bold text-red-600">{healthMetrics.bloodPressure}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Thermometer className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Temperature</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{healthMetrics.temperature}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <Activity className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Heart Rate</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">{healthMetrics.heartRate}</span>
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
              <Button
                className="h-24 flex-col space-y-2 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 border-blue-200"
                variant="outline"
                onClick={() => router.push('/doctors/1')}
              >
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
