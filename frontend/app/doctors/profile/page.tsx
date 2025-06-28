'use client';

import React, { useState, useEffect } from 'react';
import { RoleBasedLayout } from '@/components/layout/RoleBasedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Calendar,
  Clock,
  Phone,
  Mail,
  MapPin,
  Star,
  Users,
  Activity,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Stethoscope,
  Award,
  BookOpen,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { useEnhancedAuth } from '@/lib/auth/auth-wrapper';
import { doctorsApi } from '@/lib/api/doctors';
import { toast } from 'react-hot-toast';

interface DoctorProfile {
  doctor_id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  specialty: string;
  qualification?: string;
  license_number: string;
  department_id: string;
  bio?: string;
  experience_years?: number;
  consultation_fee?: number;
  languages_spoken?: string[];
  certifications?: string[];
  awards?: string[];
  research_interests?: string[];
  status: string;
  created_at: string;
  avatar_url?: string;
  total_patients?: number;
  total_appointments?: number;
  rating?: number;
  total_reviews?: number;
}

interface AppointmentStats {
  total_appointments: number;
  new_patients: number;
  follow_up_patients: number;
  weekly_data: Array<{
    day: string;
    newPatient: number;
    followUp: number;
  }>;
}

interface ScheduleItem {
  id: string;
  patient_name: string;
  appointment_type: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface Review {
  id: string;
  patient_name: string;
  rating: number;
  comment: string;
  date: string;
  patient_avatar?: string;
}

export default function DoctorProfilePage() {
  const { user, loading: authLoading } = useEnhancedAuth();
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [appointmentStats, setAppointmentStats] = useState<AppointmentStats | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<ScheduleItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !authLoading) {
      loadDoctorProfile();
    }
  }, [user, authLoading]);

  const loadDoctorProfile = async () => {
    try {
      setLoading(true);

      // Load doctor basic info
      const doctorResponse = await doctorsApi.getByProfileId(user?.id || '');

      if (doctorResponse.success && doctorResponse.data) {
        const doctorData = doctorResponse.data;
        setDoctor(doctorData);

        // Load additional data using doctor_id
        const doctorId = doctorData.doctor_id;

        // Load appointment stats, schedule, and reviews in parallel
        const [statsResponse, scheduleResponse, reviewsResponse] = await Promise.allSettled([
          doctorsApi.getAppointmentStats(doctorId, 'week'),
          doctorsApi.getTodaySchedule(doctorId),
          doctorsApi.getReviews(doctorId, 1, 4)
        ]);

        // Handle appointment stats
        if (statsResponse.status === 'fulfilled' && statsResponse.value.success) {
          setAppointmentStats(statsResponse.value.data);
        }

        // Handle today's schedule
        if (scheduleResponse.status === 'fulfilled' && scheduleResponse.value.success) {
          setTodaySchedule(scheduleResponse.value.data || []);
        }

        // Handle reviews
        if (reviewsResponse.status === 'fulfilled' && reviewsResponse.value.success) {
          setReviews(reviewsResponse.value.data || []);
        }

      } else {
        toast.error('Không thể tải thông tin bác sĩ');
      }
    } catch (error) {
      console.error('Error loading doctor profile:', error);
      toast.error('Lỗi khi tải thông tin bác sĩ');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'DR';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getCurrentWeekDate = () => {
    const today = new Date();
    return today.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    });
  };

  if (authLoading || loading) {
    return (
      <RoleBasedLayout title="Hồ sơ bác sĩ" activePage="profile">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900">Đang tải hồ sơ bác sĩ</h2>
            <p className="text-gray-600 mt-2">Vui lòng đợi trong giây lát...</p>
          </div>
        </div>
      </RoleBasedLayout>
    );
  }

  return (
    <RoleBasedLayout title="Hồ sơ bác sĩ" activePage="profile">
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Hồ sơ bác sĩ</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Main Layout - Left Sidebar + Right Content */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left Sidebar - Doctor Profile */}
            <div className="lg:col-span-1 space-y-4">
              {/* Doctor Profile Card */}
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardContent className="p-4">
                  {/* Doctor Avatar and Basic Info */}
                  <div className="text-center mb-4">
                    <div className="relative inline-block mb-3">
                      <div className="w-24 h-24 bg-gradient-to-br from-teal-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto">
                        <Avatar className="h-20 w-20 bg-transparent">
                          <AvatarImage
                            src={doctor?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=petra-winsbury`}
                            alt={doctor?.full_name || 'Doctor'}
                          />
                          <AvatarFallback className="text-lg bg-transparent text-white font-semibold">
                            PW
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>

                    <h2 className="text-base font-bold text-gray-900 mb-1">
                      Dr. Petra Winsbury
                    </h2>
                    <p className="text-xs text-gray-500 mb-3">
                      WNH-GM-001
                    </p>

                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                      Available
                    </Badge>
                  </div>

                  {/* Specialist Section */}
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-1 text-xs text-gray-500">Specialist</h3>
                    <p className="text-sm text-gray-800 font-medium">
                      Routine Check-Ups
                    </p>
                  </div>

                  {/* About Section */}
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-2 text-xs text-gray-500">About</h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Dr. Petra Winsbury is a seasoned general medicine practitioner with over 15 years of experience in providing comprehensive healthcare services. He is dedicated to ensuring the overall well-being of his patients through routine check-ups and preventive care.
                    </p>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-2 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs">
                      <Phone className="h-3 w-3 text-teal-500" />
                      <span className="text-gray-600">
                        +1 555-234-5678
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Mail className="h-3 w-3 text-teal-500" />
                      <span className="text-gray-600">
                        petra.wins@wellnesthospital.com
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <MapPin className="h-3 w-3 text-teal-500" />
                      <span className="text-gray-600">
                        WellNest Hospital, 456 Elm Street, Springfield, IL, USA
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Work Experience Card */}
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm font-semibold text-gray-900">
                    Work Experience
                    <Button variant="ghost" size="sm" className="p-1">
                      <MoreHorizontal className="h-3 w-3 text-gray-400" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-teal-500 rounded-lg flex items-center justify-center">
                      <Stethoscope className="h-3 w-3 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-xs">General Practitioner</h4>
                      <p className="text-xs text-gray-600">WellNest Hospital</p>
                      <p className="text-xs text-gray-500">Full Time • 2010-Present</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-red-500 rounded-lg flex items-center justify-center">
                      <Stethoscope className="h-3 w-3 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-xs">Resident Doctor</h4>
                      <p className="text-xs text-gray-600">City Hospital</p>
                      <p className="text-xs text-gray-500">Full Time • 2008-2010</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-4 space-y-4">
              {/* Khối 1 (trên) - Left: Stats + Charts, Right: Schedule */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Phần trái - Stats và Charts */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Thông tin chuyên môn */}
                  <Card className="bg-white shadow-sm border border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
                        <Stethoscope className="h-5 w-5 text-teal-500" />
                        Thông tin chuyên môn
                        <Button variant="ghost" size="sm" className="ml-auto p-1">
                          <MoreHorizontal className="h-4 w-4 text-gray-400" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-0">
                      {/* Chuyên khoa và Trình độ */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-700">Chuyên khoa:</span>
                          </div>
                          <p className="text-sm text-gray-900 ml-4">{doctor?.specialty || 'Nội tổng quát'}</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-700">Trình độ:</span>
                          </div>
                          <p className="text-sm text-gray-900 ml-4">{doctor?.qualification || 'Thạc sĩ Y khoa'}</p>
                        </div>
                      </div>

                      {/* Kinh nghiệm và Giấy phép hành nghề */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-700">Kinh nghiệm:</span>
                          </div>
                          <p className="text-sm text-gray-900 ml-4">{doctor?.experience_years || '15'} năm</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-700">Giấy phép:</span>
                          </div>
                          <p className="text-sm text-gray-900 ml-4">{doctor?.license_number || 'VN-GP-2024'}</p>
                        </div>
                      </div>

                      {/* Ngôn ngữ và Phí tư vấn */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-700">Ngôn ngữ:</span>
                          </div>
                          <div className="ml-4 flex flex-wrap gap-1">
                            {doctor?.languages_spoken?.length > 0 ? (
                              doctor.languages_spoken.map((lang, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {lang}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="secondary" className="text-xs">Tiếng Việt</Badge>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-700">Phí tư vấn:</span>
                          </div>
                          <p className="text-sm text-gray-900 ml-4">
                            {doctor?.consultation_fee ? `${doctor.consultation_fee.toLocaleString('vi-VN')} VNĐ` : '500.000 VNĐ'}
                          </p>
                        </div>
                      </div>

                      {/* Chứng chỉ và Giải thưởng */}
                      {(doctor?.certifications?.length > 0 || doctor?.awards?.length > 0) && (
                        <div className="space-y-3 pt-2 border-t border-gray-100">
                          {doctor?.certifications?.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                <span className="text-sm font-medium text-gray-700">Chứng chỉ chuyên môn:</span>
                              </div>
                              <div className="ml-4 flex flex-wrap gap-1">
                                {doctor.certifications.map((cert, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {cert}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {doctor?.awards?.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                <span className="text-sm font-medium text-gray-700">Giải thưởng:</span>
                              </div>
                              <div className="ml-4 flex flex-wrap gap-1">
                                {doctor.awards.map((award, index) => (
                                  <Badge key={index} variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                    {award}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Appointment Stats Chart */}
                  <Card className="bg-white shadow-sm border border-gray-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                      <CardTitle className="text-sm font-semibold text-gray-900">Appointment Stats</CardTitle>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded">
                        {getCurrentWeekDate()}
                      </Badge>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {/* Chart Legend */}
                      <div className="flex items-center gap-4 mb-3 text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-slate-700 rounded-full"></div>
                          <span className="text-gray-600">New Patient</span>
                          <span className="font-semibold text-gray-900">
                            {appointmentStats?.new_patients || 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                          <span className="text-gray-600">Follow-up Patient</span>
                          <span className="font-semibold text-gray-900">
                            {appointmentStats?.follow_up_patients || 0}
                          </span>
                        </div>
                      </div>

                      {/* Bar Chart */}
                      <div className="flex items-end justify-between gap-1 h-24 mb-3">
                        {appointmentStats?.weekly_data?.length > 0 ? (
                          appointmentStats.weekly_data.map((data, index) => (
                            <div key={data.day} className="flex flex-col items-center gap-1">
                              <div className="flex flex-col items-center justify-end h-20 w-8">
                                <div
                                  className="bg-slate-700 w-full rounded-t-sm"
                                  style={{ height: `${Math.max(data.newPatient * 5, 5)}%` }}
                                ></div>
                                <div
                                  className="bg-teal-400 w-full"
                                  style={{ height: `${Math.max(data.followUp * 5, 5)}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-500">{data.day.slice(0, 3)}</span>
                            </div>
                          ))
                        ) : (
                          // Fallback when no data
                          <div className="flex items-center justify-center h-20 w-full text-gray-400">
                            <div className="text-center">
                              <AlertCircle className="h-6 w-6 mx-auto mb-1" />
                              <p className="text-xs">Không có dữ liệu biểu đồ</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Stats Summary */}
                      <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-100">
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-900">
                            {appointmentStats?.total_appointments || doctor?.total_appointments || 0}
                          </div>
                          <div className="text-xs text-gray-500">Total Appointments</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-900">
                            {appointmentStats?.new_patients || 0}
                          </div>
                          <div className="text-xs text-gray-500">New Patients</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-900">
                            {appointmentStats?.follow_up_patients || 0}
                          </div>
                          <div className="text-xs text-gray-500">Follow-Up Patients</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Phần phải - Schedule Card */}
                <div className="lg:col-span-1">
                  <Card className="bg-white shadow-sm border border-gray-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                      <CardTitle className="text-sm font-semibold text-gray-900">Schedule</CardTitle>
                      <Button variant="ghost" size="sm" className="p-1">
                        <MoreHorizontal className="h-4 w-4 text-gray-400" />
                      </Button>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {/* Mini Calendar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <Button variant="ghost" size="sm" className="p-1">
                            <ChevronLeft className="h-3 w-3" />
                          </Button>
                          <div className="flex gap-1">
                            {[17, 18, 19, 20, 21].map((day) => (
                              <div
                                key={day}
                                className={`w-6 h-6 flex items-center justify-center rounded text-xs ${
                                  day === 20
                                    ? 'bg-slate-700 text-white font-semibold'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                {day}
                              </div>
                            ))}
                          </div>
                          <Button variant="ghost" size="sm" className="p-1">
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Today's Schedule */}
                      <div>
                        <p className="text-xs text-gray-500 mb-2">
                          {todaySchedule.length} lịch hẹn hôm nay
                        </p>
                        <div className="space-y-2">
                          {todaySchedule.length > 0 ? (
                            todaySchedule.map((schedule, index) => (
                              <div key={schedule.id || index} className="flex items-center gap-2 text-xs">
                                <div className={`w-1 h-4 rounded-full ${
                                  schedule.status === 'scheduled' ? 'bg-teal-400' :
                                  schedule.status === 'completed' ? 'bg-green-400' :
                                  'bg-gray-400'
                                }`}></div>
                                <div className="flex-1">
                                  <div className="font-medium text-gray-700">
                                    {schedule.patient_name || 'Bệnh nhân'}
                                  </div>
                                  <div className="text-gray-500">
                                    {schedule.appointment_type || 'Khám tổng quát'}
                                  </div>
                                </div>
                                <span className="text-gray-500">{schedule.time}</span>
                              </div>
                            ))
                          ) : (
                            <div className="flex items-center justify-center py-4 text-gray-400">
                              <div className="text-center">
                                <Calendar className="h-6 w-6 mx-auto mb-1" />
                                <p className="text-xs">Không có lịch hẹn hôm nay</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Khối 2 (dưới) - Feedback Section */}
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-900">Feedback</CardTitle>
                  <Button variant="ghost" size="sm" className="p-1">
                    <MoreHorizontal className="h-4 w-4 text-gray-400" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {reviews.length > 0 ? (
                      reviews.map((review, index) => {
                        const getInitials = (name: string | undefined | null) => {
                          if (!name || typeof name !== 'string') return 'PT';
                          return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                        };

                        const avatarColors = ['bg-slate-700', 'bg-teal-500', 'bg-blue-500', 'bg-green-600', 'bg-purple-500', 'bg-orange-500'];
                        const colorClass = avatarColors[index % avatarColors.length];

                        return (
                          <div key={review.id || index} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Avatar className={`h-8 w-8 ${colorClass}`}>
                                {review.patient_avatar ? (
                                  <AvatarImage src={review.patient_avatar} alt={review.patient_name} />
                                ) : null}
                                <AvatarFallback className="text-white text-xs">
                                  {getInitials(review.patient_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-medium text-gray-900 text-xs">{review.patient_name}</h4>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-500">
                                    {formatDate(review.date)}
                                  </span>
                                  {review.rating && (
                                    <div className="flex items-center gap-1">
                                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                      <span className="text-xs text-gray-600">{review.rating}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {review.comment || 'Bác sĩ rất tận tâm và chuyên nghiệp.'}
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-full flex items-center justify-center py-8 text-gray-400">
                        <div className="text-center">
                          <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm">Chưa có đánh giá nào</p>
                          <p className="text-xs">Đánh giá sẽ hiển thị ở đây khi có bệnh nhân phản hồi</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </RoleBasedLayout>
  );
}
