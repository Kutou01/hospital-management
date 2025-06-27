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
  Award
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

interface DoctorProfileData {
  id: string
  doctor_id: string
  profile_id: string
  full_name: string
  email: string
  phone_number?: string
  role: string
  specialty: string
  qualification: string
  license_number: string
  bio?: string
  experience_years?: number
  consultation_fee?: number
  languages_spoken?: string[]
  rating?: number
  total_reviews?: number
  department_id?: string
  gender?: string
  address?: any
  avatar_url?: string
}

interface AppointmentStats {
  total_appointments: number
  completed_appointments: number
  pending_appointments: number
  cancelled_appointments: number
}

interface Review {
  review_id: string
  patient_name: string
  rating: number
  comment: string
  created_at: string
  appointment_date: string
}

interface Experience {
  experience_id: string
  institution_name: string
  position: string
  start_date: string
  end_date?: string
  is_current: boolean
  description?: string
  experience_type: string
}

interface ScheduleItem {
  id: string
  patient_name: string
  appointment_type: string
  time: string
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled'
}

export default function DoctorProfileDashboard() {
  const { user, authLoading } = useAuth()
  const { showToast } = useToast()

  const [loading, setLoading] = useState(true)
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfileData | null>(null)
  const [appointmentStats, setAppointmentStats] = useState<any>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [todaySchedule, setTodaySchedule] = useState<ScheduleItem[]>([])
  const [doctorStats, setDoctorStats] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Week days for calendar
  const getWeekDays = () => {
    const today = new Date()
    const currentDay = today.getDay() // 0 = Sunday, 1 = Monday, etc.
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - currentDay) // Go to Sunday

    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      days.push(day)
    }
    return days
  }

  const formatDate = (date: Date) => {
    return date.getDate().toString()
  }

  const getDayName = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return days[date.getDay()]
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }


  // Fetch doctor profile data
  useEffect(() => {
    const fetchDoctorProfile = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // Get doctor profile
        const doctorResponse = await doctorsApi.getByProfileId(user.id)
        if (!doctorResponse.success || !doctorResponse.data) {
          showToast("Lỗi", "Không tìm thấy thông tin bác sĩ", "error")
          setLoading(false)
          return
        }

        const doctorData = doctorResponse.data as any
        const profileData: DoctorProfileData = {
          id: doctorData.doctor_id,
          doctor_id: doctorData.doctor_id,
          profile_id: user.id,
          full_name: doctorData.full_name,
          email: user.email,
          phone_number: doctorData.phone_number,
          role: 'doctor',
          specialty: doctorData.specialty,
          qualification: doctorData.qualification,
          license_number: doctorData.license_number,
          bio: doctorData.bio,
          experience_years: doctorData.experience_years,
          consultation_fee: doctorData.consultation_fee,
          languages_spoken: doctorData.languages_spoken,
          rating: doctorData.rating,
          total_reviews: doctorData.total_reviews,
          department_id: doctorData.department_id,
          gender: doctorData.gender,
          address: doctorData.address,
          avatar_url: doctorData.avatar_url
        }

        setDoctorProfile(profileData)
        
        // Fetch real data in parallel
        const [statsResponse, reviewsResponse, experiencesResponse, scheduleResponse] = await Promise.allSettled([
          doctorsApi.getStats(doctorData.doctor_id),
          doctorsApi.getReviews(doctorData.doctor_id, 1, 4),
          doctorsApi.getExperiences(doctorData.doctor_id),
          doctorsApi.getTodaySchedule(doctorData.doctor_id)
        ])

        // Handle stats
        if (statsResponse.status === 'fulfilled' && statsResponse.value.success) {
          setDoctorStats(statsResponse.value.data)
        }

        // Handle reviews
        if (reviewsResponse.status === 'fulfilled' && reviewsResponse.value.success) {
          console.log('Reviews API response:', reviewsResponse.value.data)
          setReviews(reviewsResponse.value.data?.reviews || [])
        }

        // Handle experiences
        if (experiencesResponse.status === 'fulfilled' && experiencesResponse.value.success) {
          setExperiences(experiencesResponse.value.data || [])
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
      <DoctorLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DoctorLayout>
    )
  }

  if (!doctorProfile) {
    return (
      <DoctorLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy thông tin bác sĩ</h2>
            <p className="text-gray-600">Vui lòng kiểm tra lại thông tin đăng nhập</p>
          </div>
        </div>
      </DoctorLayout>
    )
  }

  return (
    <DoctorLayout>
      <div className="space-y-6">


        {/* Main Content Grid - 4 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Doctor Profile */}
          <div className="lg:col-span-1 space-y-6">
            {/* Doctor Profile Card */}
            <Card className="bg-gradient-to-br from-teal-400 to-teal-500 text-white">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-20 w-20 mb-4 border-4 border-white/20">
                    <AvatarImage src={doctorProfile.avatar_url} alt={doctorProfile.full_name} />
                    <AvatarFallback className="text-lg bg-white/20 text-white">
                      {doctorProfile.full_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-bold mb-1">{doctorProfile.full_name}</h2>
                  <p className="text-teal-100 mb-4">{doctorProfile.license_number}</p>

                  <Badge className="mb-4 bg-green-500 text-white hover:bg-green-500">
                    Available
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Specialty Card */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Specialty</h3>
                <p className="text-gray-600">{doctorProfile.specialty}</p>
              </CardContent>
            </Card>

            {/* About Card */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">About</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {doctorProfile.bio || 'Chưa có thông tin mô tả'}
                </p>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{doctorProfile.phone_number || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{doctorProfile.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{doctorProfile.address ?
                      (typeof doctorProfile.address === 'string' ? doctorProfile.address :
                       `${doctorProfile.address.street || ''}, ${doctorProfile.address.city || ''}`.trim().replace(/^,|,$/, ''))
                      : 'Chưa cập nhật địa chỉ'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Work Experience */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Work Experience</h3>
                {experiences.length > 0 ? (
                  <div className="space-y-4">
                    {experiences.map((exp) => (
                      <div key={exp.experience_id} className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Briefcase className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{exp.position}</h4>
                          <p className="text-sm text-gray-600">{exp.institution_name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(exp.start_date).getFullYear()} - {exp.is_current ? 'Present' : new Date(exp.end_date || '').getFullYear()}
                          </p>
                          {exp.description && (
                            <p className="text-xs text-gray-500 mt-1">{exp.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">Chưa có thông tin kinh nghiệm làm việc</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Stats & Feedback */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Patients</p>
                      <p className="text-2xl font-bold text-gray-900">{doctorStats?.total_patients || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Appointments</p>
                      <p className="text-2xl font-bold text-gray-900">{doctorStats?.total_appointments || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Clock className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">This Week</p>
                      <p className="text-2xl font-bold text-gray-900">{todaySchedule.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Appointment Stats Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Appointment Stats</CardTitle>
                <p className="text-sm text-gray-500">Week 01 Jul 24</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2 mb-6">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => (
                    <div key={day} className="text-center">
                      <div className="text-xs text-gray-500 mb-2">{day.slice(0, 3)}</div>
                      <div className="space-y-1">
                        <div className="bg-teal-200 rounded h-8 mx-auto w-6"></div>
                        <div className="bg-gray-800 rounded h-12 mx-auto w-6"></div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">50</p>
                    <p className="text-sm text-gray-500">Total Appointments</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">22</p>
                    <p className="text-sm text-gray-500">New Patients</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">28</p>
                    <p className="text-sm text-gray-500">Follow-Up Patients</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feedback Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {reviews.map((review) => (
                      <div key={review.review_id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {(review.patients?.profiles?.full_name || review.patient_name) ?
                                (review.patients?.profiles?.full_name || review.patient_name).split(' ').map(n => n[0]).join('') : 'BN'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">{review.patients?.profiles?.full_name || review.patient_name || 'Bệnh nhân ẩn danh'}</p>
                            <p className="text-xs text-gray-500">{new Date(review.created_at || review.review_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                          ))}
                        </div>
                        <p className="text-sm text-gray-600">{review.comment || review.review_text || 'Không có nhận xét'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Chưa có đánh giá nào</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Today's Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    {todaySchedule.length} schedules today
                  </h3>

                  {todaySchedule.length > 0 ? todaySchedule.map((item, index) => (
                    <div key={item.id || `schedule-${index}`} className="flex items-start gap-3 py-2">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        item.status === 'confirmed' ? 'bg-green-500' :
                        item.status === 'pending' ? 'bg-yellow-500' :
                        'bg-gray-400'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 mb-1">
                          {item.patient_name || 'No patient'}
                        </h4>
                        <p className="text-xs text-gray-500 mb-0.5">
                          {item.appointment_type || 'Appointment'} • {item.time || 'No time'}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No appointments today</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Schedule */}
          <div className="lg:col-span-1 space-y-6">
            {/* Schedule Calendar */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Schedule</CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs">
                    This Week
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <Button variant="ghost" size="sm">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex gap-1">
                    {[17, 18, 19, 20, 21, 22, 23].map((date, index) => (
                      <Button
                        key={date}
                        variant={date === 20 ? "default" : "ghost"}
                        size="sm"
                        className="w-8 h-8 p-0 text-xs"
                      >
                        {date}
                      </Button>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600">{todaySchedule.length} schedules today</p>
                </div>

                <div className="space-y-3">
                  {todaySchedule.length > 0 ? todaySchedule.map((item, index) => (
                    <div key={item.id || `schedule-${index}`} className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${
                          item.status === 'confirmed' ? 'bg-teal-500' :
                          item.status === 'pending' ? 'bg-yellow-500' :
                          'bg-gray-400'
                        }`}></div>
                        <span className="font-medium text-sm">{item.patient_name || 'No patient'}</span>
                      </div>
                      <p className="text-xs text-gray-600">{item.appointment_type || 'Appointment'} • {item.time || 'No time'}</p>
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Không có lịch hẹn hôm nay</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>


          </div>
        </div>


      </div>
    </DoctorLayout>
  )
}
