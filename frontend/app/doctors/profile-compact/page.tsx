"use client"

import { useState, useEffect } from "react"
import {
  ArrowLeft,
  Users,
  Calendar,
  MoreHorizontal,
  Phone,
  Mail,
  MapPin,
  Star,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Briefcase,
  Award,
  BarChart3
} from "lucide-react"
import { DoctorLayout } from "@/components/layout/UniversalLayout"
import { useAuth } from "@/lib/auth/auth-wrapper"
import { doctorsApi } from "@/lib/api/doctors"
import { useToast } from "@/components/ui/toast-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

export default function ProfileCompact() {
  const { user, loading: authLoading } = useAuth()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [doctorProfile, setDoctorProfile] = useState<any>(null)
  const [doctorStats, setDoctorStats] = useState<any>(null)
  const [todaySchedule, setTodaySchedule] = useState<any[]>([])

  // Fetch doctor profile data
  useEffect(() => {
    const fetchDoctorProfile = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const doctorResponse = await doctorsApi.getByProfileId(user.id)
        if (!doctorResponse.success || !doctorResponse.data) {
          showToast("Lỗi", "Không tìm thấy thông tin bác sĩ", "error")
          setLoading(false)
          return
        }

        const doctorData = doctorResponse.data as any
        const profileData = {
          id: doctorData.doctor_id,
          doctor_id: doctorData.doctor_id,
          profile_id: user.id,
          full_name: doctorData.full_name,
          email: user.email,
          phone_number: doctorData.phone_number,
          specialty: doctorData.specialty,
          qualification: doctorData.qualification,
          license_number: doctorData.license_number,
          bio: doctorData.bio,
          experience_years: doctorData.experience_years,
          consultation_fee: doctorData.consultation_fee,
          rating: doctorData.rating,
          total_reviews: doctorData.total_reviews,
          avatar_url: doctorData.avatar_url
        }

        setDoctorProfile(profileData)

        // Fetch additional data
        const [statsResponse, scheduleResponse] = await Promise.allSettled([
          doctorsApi.getStats(doctorData.doctor_id),
          doctorsApi.getTodaySchedule(doctorData.doctor_id)
        ])

        // Handle stats
        if (statsResponse.status === 'fulfilled' && statsResponse.value.success) {
          setDoctorStats(statsResponse.value.data)
        }

        // Handle today's schedule
        if (scheduleResponse.status === 'fulfilled' && scheduleResponse.value.success) {
          setTodaySchedule(scheduleResponse.value.data || [])
        }

      } catch (error) {
        showToast("Lỗi", "Có lỗi xảy ra khi tải dữ liệu", "error")
      } finally {
        setLoading(false)
      }
    }

    if (user && !authLoading) {
      fetchDoctorProfile()
    }
  }, [user, authLoading, showToast])

  if (authLoading || loading) {
    return (
      <DoctorLayout title="Profile Compact" activePage="profile">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải thông tin hồ sơ...</p>
          </div>
        </div>
      </DoctorLayout>
    )
  }

  if (!doctorProfile) {
    return (
      <DoctorLayout title="Profile Compact" activePage="profile">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <User className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-600">Không tìm thấy thông tin bác sĩ trong hệ thống.</p>
          </div>
        </div>
      </DoctorLayout>
    )
  }

  return (
    <DoctorLayout title="Profile Compact" activePage="profile">
      <div className="min-h-screen bg-gray-50 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Doctor Profile</h1>
              <p className="text-sm text-gray-500">Compact View</p>
            </div>
          </div>
          <Badge className="bg-blue-600">Compact</Badge>
        </div>

        {/* Main Content - 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Doctor Profile Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={doctorProfile.avatar_url} />
                    <AvatarFallback className="text-lg bg-green-100 text-green-600">
                      {doctorProfile.full_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">
                      Dr. {doctorProfile.full_name}
                    </h2>
                    <p className="text-sm text-gray-500 mb-2">{doctorProfile.specialty}</p>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 mb-3">
                      Available
                    </Badge>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span>{doctorProfile.rating || 4.9}</span>
                      </div>
                      <span className="text-gray-500">•</span>
                      <span>{doctorProfile.total_reviews || 127} reviews</span>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{doctorProfile.phone_number || '+1 555-234-5678'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{doctorProfile.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>WellNest Hospital</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="p-3 bg-blue-100 rounded-lg w-fit mx-auto mb-3">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{doctorStats?.total_patients || 0}</p>
                    <p className="text-sm text-gray-500">Total Patients</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="p-3 bg-green-100 rounded-lg w-fit mx-auto mb-3">
                      <Calendar className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{doctorStats?.total_appointments || 0}</p>
                    <p className="text-sm text-gray-500">Appointments</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Today's Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xl font-bold text-gray-900">{todaySchedule.length}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-blue-600">{doctorStats?.new_patients || 0}</p>
                    <p className="text-xs text-gray-500">New</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-teal-500">{doctorStats?.follow_up_patients || 0}</p>
                    <p className="text-xs text-gray-500">Follow-up</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Today's Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {todaySchedule.map((item, index) => (
                    <div key={item.id || `schedule-${index}`} className="flex items-start gap-3 py-2">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        item.status === 'confirmed' ? 'bg-green-500' :
                        item.status === 'pending' ? 'bg-yellow-500' :
                        'bg-gray-400'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 mb-1">
                          {item.patient_name}
                        </h4>
                        <p className="text-xs text-gray-500 mb-0.5">
                          {item.appointment_type} • {item.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Bio */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {doctorProfile.bio || `Dr. ${doctorProfile.full_name} is a seasoned general medicine practitioner with over ${doctorProfile.experience_years || 15} years of experience in providing comprehensive healthcare services.`}
                </p>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" onClick={() => window.location.href = '/doctors/profile'}>
                  View Dashboard Profile
                </Button>
                <Button variant="outline" className="w-full" onClick={() => window.location.href = '/doctors/settings'}>
                  Profile Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DoctorLayout>
  )
}
