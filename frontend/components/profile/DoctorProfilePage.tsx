"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
} from "lucide-react"
import { DoctorProfileData, AppointmentStats, ScheduleItem, Review, WorkExperience } from '@/lib/types'
import { useDoctorProfile } from '@/hooks/useDoctorProfile'

// Interfaces moved to types file

interface DoctorProfilePageProps {
  doctorId: string
  onBack?: () => void
}

export function DoctorProfilePage({ doctorId, onBack }: DoctorProfilePageProps) {
  const {
    doctor,
    appointmentStats,
    todaySchedule,
    reviews,
    experiences,
    loading,
    error,
    refetch
  } = useDoctorProfile(doctorId)

  const [currentWeek, setCurrentWeek] = useState(0)


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Loading Doctor Profile</h2>
          <p className="text-gray-600 mt-2">Please wait while we fetch the doctor information...</p>
        </div>
      </div>
    )
  }

  if (error && !doctor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Error Loading Profile</h2>
          <p className="text-gray-600 mt-2 mb-4">{error}</p>
          <Button onClick={refetch} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!doctor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Doctor not found</h2>
          <p className="text-gray-600 mt-2">The requested doctor profile could not be loaded.</p>
          <Button onClick={onBack} variant="outline" className="mt-4">
            Back to Doctor List
          </Button>
        </div>
      </div>
    )
  }

  const getInitials = (name: string | undefined | null) => {
    if (!name || typeof name !== 'string') return 'DR'
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Doctor List
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Doctor Details</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Doctor Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Doctor Profile Card */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Avatar className="h-24 w-24 mx-auto mb-4">
                    <AvatarImage
                      src={doctor?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${doctor?.full_name || 'doctor'}`}
                      alt={doctor?.full_name || 'Doctor'}
                    />
                    <AvatarFallback className="text-lg bg-blue-100 text-blue-600">
                      {getInitials(doctor?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{doctor?.full_name || 'Doctor Name'}</h2>
                  <p className="text-sm text-gray-600 mb-2">{doctor?.qualification || 'Qualification'}</p>
                  
                  <Badge 
                    variant="secondary" 
                    className="bg-green-100 text-green-800 mb-4"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    {doctor?.availability_status || 'Available'}
                  </Badge>
                </div>

                <div className="space-y-4 mt-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Specialist</h3>
                    <p className="text-sm text-gray-600">{doctor?.specialty || 'Specialty'}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{doctor?.bio || 'No bio available'}</p>
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{doctor?.phone_number || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{doctor?.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        {doctor?.address ?
                          (typeof doctor.address === 'string' ?
                            doctor.address :
                            `${doctor.address.street || ''}, ${doctor.address.district || ''}, ${doctor.address.city || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',') || 'N/A'
                          ) :
                          'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Work Experience Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Work Experience
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {experiences.length > 0 ? (
                  experiences.map((exp, index) => (
                    <div key={exp.id || `experience-${index}`} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        exp.type === 'work' ? 'bg-blue-100' :
                        exp.type === 'education' ? 'bg-green-100' : 'bg-purple-100'
                      }`}>
                        {exp.type === 'work' ? (
                          <Stethoscope className={`h-4 w-4 ${
                            exp.type === 'work' ? 'text-blue-600' :
                            exp.type === 'education' ? 'text-green-600' : 'text-purple-600'
                          }`} />
                        ) : exp.type === 'education' ? (
                          <BookOpen className="h-4 w-4 text-green-600" />
                        ) : (
                          <Award className="h-4 w-4 text-purple-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{exp.position}</h4>
                        <p className="text-sm text-gray-600">{exp.organization}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(exp.start_date).getFullYear()} - {
                            exp.is_current ? 'Present' : new Date(exp.end_date!).getFullYear()
                          }
                          {exp.is_current && (
                            <Badge variant="secondary" className="ml-2 text-xs">Current</Badge>
                          )}
                        </p>
                        {exp.description && (
                          <p className="text-xs text-gray-600 mt-1">{exp.description}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">No work experience data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Stats and Schedule */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Patients</p>
                      <p className="text-3xl font-bold text-gray-900">{doctor?.total_patients || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Appointments</p>
                      <p className="text-3xl font-bold text-gray-900">{doctor?.total_appointments || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Appointment Stats Chart */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Appointment Stats</CardTitle>
                <Badge variant="secondary">This Week</Badge>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2 mb-6">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => (
                    <div key={day} className="text-center">
                      <div className="text-xs text-gray-500 mb-2">{day.slice(0, 3)}</div>
                      <div 
                        className="bg-blue-200 rounded-lg mx-auto"
                        style={{ 
                          height: `${(appointmentStats?.weekly_data[index] || 0) * 8}px`,
                          width: '24px',
                          minHeight: '20px'
                        }}
                      ></div>
                      <div className="text-xs text-gray-700 mt-1">{appointmentStats?.weekly_data[index] || 0}</div>
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{appointmentStats?.total || 0}</p>
                    <p className="text-sm text-gray-600">Total Appointments</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{appointmentStats?.new_patients || 0}</p>
                    <p className="text-sm text-gray-600">New Patients</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{appointmentStats?.follow_ups || 0}</p>
                    <p className="text-sm text-gray-600">Follow-Up Patients</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule and Feedback Tabs */}
            <Tabs defaultValue="schedule" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="feedback">Feedback</TabsTrigger>
              </TabsList>
              
              <TabsContent value="schedule" className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Schedule</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex gap-1">
                        {[17, 18, 19, 20].map((date) => (
                          <Button
                            key={date}
                            variant={date === 20 ? "default" : "ghost"}
                            size="sm"
                            className="w-8 h-8 p-0"
                          >
                            {date}
                          </Button>
                        ))}
                      </div>
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 mb-4">3 schedules today</p>
                      {todaySchedule.map((appointment, index) => (
                        <div key={appointment.id || `appointment-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-8 bg-blue-400 rounded-full"></div>
                            <div>
                              <p className="font-medium text-gray-900">{appointment.patient_name}</p>
                              <p className="text-sm text-gray-600">{appointment.appointment_type}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{appointment.time}</p>
                            <Badge 
                              variant="secondary" 
                              className={getStatusColor(appointment.status)}
                            >
                              {appointment.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 space-y-3">
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Users className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Staff Meeting</p>
                            <p className="text-sm text-gray-600">Monday</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">11:00 PM</p>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Activity className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Administrative Work</p>
                            <p className="text-sm text-gray-600">Task</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">03:00 PM</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="feedback" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Feedback
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {reviews.map((review, index) => (
                        <div key={review.id || `review-${index}`} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={review.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.patient_name || 'patient'}`}
                                alt={review.patient_name || 'Patient'}
                              />
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {getInitials(review.patient_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900">{review.patient_name}</p>
                              <p className="text-xs text-gray-500">{review.date}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                          
                          <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
