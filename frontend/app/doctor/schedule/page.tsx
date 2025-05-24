"use client"

import { useState } from "react"
import {
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  User,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react"
import { DoctorLayout } from "@/components/layout/DoctorLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuthProvider } from "@/hooks/useAuthProvider"

export default function DoctorSchedule() {
  const { user, loading } = useAuthProvider()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week')

  // Mock schedule data
  const scheduleData = {
    '2024-01-15': [
      {
        id: '1',
        time: '09:00',
        duration: 30,
        type: 'appointment',
        patient: 'Nguyễn Văn A',
        status: 'confirmed',
        notes: 'Khám tổng quát'
      },
      {
        id: '2',
        time: '10:30',
        duration: 45,
        type: 'appointment',
        patient: 'Trần Thị B',
        status: 'confirmed',
        notes: 'Tái khám tim mạch'
      },
      {
        id: '3',
        time: '14:00',
        duration: 60,
        type: 'appointment',
        patient: 'Lê Văn C',
        status: 'pending',
        notes: 'Khám chuyên khoa'
      },
      {
        id: '4',
        time: '16:00',
        duration: 30,
        type: 'break',
        title: 'Coffee Break',
        status: 'scheduled'
      }
    ],
    '2024-01-16': [
      {
        id: '5',
        time: '08:30',
        duration: 30,
        type: 'appointment',
        patient: 'Phạm Thị D',
        status: 'confirmed',
        notes: 'Khám da liễu'
      },
      {
        id: '6',
        time: '11:00',
        duration: 120,
        type: 'surgery',
        title: 'Minor Surgery',
        status: 'scheduled',
        notes: 'Phẫu thuật nhỏ'
      }
    ],
    '2024-01-17': [
      {
        id: '7',
        time: '09:00',
        duration: 30,
        type: 'appointment',
        patient: 'Hoàng Văn E',
        status: 'confirmed',
        notes: 'Khám nội khoa'
      },
      {
        id: '8',
        time: '15:00',
        duration: 60,
        type: 'consultation',
        title: 'Team Consultation',
        status: 'scheduled',
        notes: 'Hội chẩn bệnh nhân'
      }
    ]
  }

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30'
  ]

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'appointment':
        return 'bg-blue-50 border-blue-200'
      case 'surgery':
        return 'bg-red-50 border-red-200'
      case 'consultation':
        return 'bg-purple-50 border-purple-200'
      case 'break':
        return 'bg-gray-50 border-gray-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-3 w-3" />
      case 'pending':
        return <AlertCircle className="h-3 w-3" />
      case 'cancelled':
        return <XCircle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  // Get current week dates
  const getCurrentWeekDates = () => {
    const today = new Date(selectedDate)
    const currentDay = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - currentDay + 1)

    const weekDates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      weekDates.push(date.toISOString().split('T')[0])
    }
    return weekDates
  }

  const weekDates = getCurrentWeekDates()

  if (loading) {
    return (
      <DoctorLayout title="My Schedule" activePage="schedule">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </DoctorLayout>
    )
  }

  if (!user || user.role !== 'doctor') {
    return (
      <DoctorLayout title="My Schedule" activePage="schedule">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Access denied. Doctor role required.</p>
          </div>
        </div>
      </DoctorLayout>
    )
  }

  return (
    <DoctorLayout title="My Schedule" activePage="schedule">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Schedule</h2>
            <p className="text-gray-600">Manage your appointments and availability</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'day' ? 'default' : 'outline'}
              onClick={() => setViewMode('day')}
              size="sm"
            >
              Day View
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'outline'}
              onClick={() => setViewMode('week')}
              size="sm"
            >
              Week View
            </Button>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Slot
            </Button>
          </div>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            aria-label="Select date for schedule view"
          />
          <div className="text-sm text-gray-600">
            {viewMode === 'week' ? 'Week View' : 'Day View'}
          </div>
        </div>
      </div>

      {viewMode === 'week' ? (
        /* Week View */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Weekly Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-8 gap-2">
              {/* Time column */}
              <div className="space-y-2">
                <div className="h-12 flex items-center justify-center font-medium text-sm">
                  Time
                </div>
                {timeSlots.map((time) => (
                  <div key={time} className="h-16 flex items-center justify-center text-xs text-gray-500 border-r">
                    {time}
                  </div>
                ))}
              </div>

              {/* Days columns */}
              {weekDates.map((date, dayIndex) => (
                <div key={date} className="space-y-2">
                  <div className="h-12 flex flex-col items-center justify-center bg-gray-50 rounded">
                    <div className="font-medium text-sm">{weekDays[dayIndex]}</div>
                    <div className="text-xs text-gray-500">{date}</div>
                  </div>
                  {timeSlots.map((time) => {
                    const daySchedule = scheduleData[date] || []
                    const appointment = daySchedule.find(apt => apt.time === time)

                    return (
                      <div key={`${date}-${time}`} className="h-16 border border-gray-200 rounded relative">
                        {appointment && (
                          <div className={`absolute inset-1 rounded p-1 border ${getTypeColor(appointment.type)} ${getStatusColor(appointment.status)}`}>
                            <div className="flex items-center gap-1 mb-1">
                              {getStatusIcon(appointment.status)}
                              <span className="text-xs font-medium truncate">
                                {appointment.patient || appointment.title}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 truncate">
                              {appointment.notes}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Day View */
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule for {selectedDate}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(scheduleData[selectedDate] || []).map((appointment) => (
                  <div key={appointment.id} className={`p-4 rounded-lg border ${getTypeColor(appointment.type)}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">{appointment.time}</span>
                            <span className="text-sm text-gray-500">({appointment.duration} min)</span>
                          </div>
                          <Badge className={getStatusColor(appointment.status)}>
                            {getStatusIcon(appointment.status)}
                            <span className="ml-1 capitalize">{appointment.status}</span>
                          </Badge>
                        </div>

                        <div className="mb-2">
                          {appointment.patient ? (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-500" />
                              <span className="font-medium">{appointment.patient}</span>
                            </div>
                          ) : (
                            <span className="font-medium">{appointment.title}</span>
                          )}
                        </div>

                        {appointment.notes && (
                          <p className="text-sm text-gray-600">{appointment.notes}</p>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {(!scheduleData[selectedDate] || scheduleData[selectedDate].length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p>No appointments scheduled for this day</p>
                    <Button className="mt-2 bg-green-600 hover:bg-green-700" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Appointment
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Today's Patients</p>
                    <p className="text-xl font-bold">
                      {(scheduleData[selectedDate] || []).filter(apt => apt.type === 'appointment').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Confirmed</p>
                    <p className="text-xl font-bold">
                      {(scheduleData[selectedDate] || []).filter(apt => apt.status === 'confirmed').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-xl font-bold">
                      {(scheduleData[selectedDate] || []).filter(apt => apt.status === 'pending').length}
                    </p>
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
                    <p className="text-sm text-gray-600">Total Hours</p>
                    <p className="text-xl font-bold">
                      {Math.round((scheduleData[selectedDate] || []).reduce((total, apt) => total + apt.duration, 0) / 60 * 10) / 10}h
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </DoctorLayout>
  )
}
