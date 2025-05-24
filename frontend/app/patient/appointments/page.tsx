"use client"

import { useState, useEffect } from "react"
import {
  Calendar,
  Clock,
  User,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Plus,
  Stethoscope,
  Building2
} from "lucide-react"
import { PatientLayout } from "@/components/layout/PatientLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useAuthProvider } from "@/hooks/useAuthProvider"

export default function PatientAppointments() {
  const { user, loading } = useAuthProvider()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  // Mock data for patient appointments
  const appointments = [
    {
      id: "1",
      doctor: {
        name: "Dr. Nguyễn Văn A",
        specialization: "Khoa Nội",
        hospital: "Bệnh viện Đa khoa Thành phố"
      },
      date: "2024-01-15",
      time: "10:00",
      duration: "30 min",
      type: "Khám tổng quát",
      status: "confirmed",
      location: "Phòng 201, Tầng 2",
      notes: "Mang theo kết quả xét nghiệm máu"
    },
    {
      id: "2",
      doctor: {
        name: "Dr. Trần Thị B",
        specialization: "Khoa Tim mạch",
        hospital: "Bệnh viện Đa khoa Thành phố"
      },
      date: "2024-01-20",
      time: "14:30",
      duration: "45 min",
      type: "Tái khám",
      status: "pending",
      location: "Phòng 305, Tầng 3",
      notes: "Theo dõi kết quả điều trị tim mạch"
    },
    {
      id: "3",
      doctor: {
        name: "Dr. Lê Văn C",
        specialization: "Khoa Thần kinh",
        hospital: "Bệnh viện Đa khoa Thành phố"
      },
      date: "2024-01-25",
      time: "09:15",
      duration: "60 min",
      type: "Khám chuyên khoa",
      status: "confirmed",
      location: "Phòng 108, Tầng 1",
      notes: "Khám đau đầu mãn tính"
    },
    {
      id: "4",
      doctor: {
        name: "Dr. Phạm Thị D",
        specialization: "Khoa Da liễu",
        hospital: "Bệnh viện Đa khoa Thành phố"
      },
      date: "2024-01-12",
      time: "11:00",
      duration: "30 min",
      type: "Khám tổng quát",
      status: "completed",
      location: "Phòng 205, Tầng 2",
      notes: "Đã hoàn thành khám"
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
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />
      case 'pending':
        return <AlertCircle className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || appointment.status === filterStatus
    return matchesSearch && matchesFilter
  })

  // Sort appointments by date and time
  const sortedAppointments = filteredAppointments.sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.time}`)
    const dateB = new Date(`${b.date} ${b.time}`)
    return dateA.getTime() - dateB.getTime()
  })

  if (loading) {
    return (
      <PatientLayout title="My Appointments" activePage="appointments">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PatientLayout>
    )
  }

  if (!user || user.role !== 'patient') {
    return (
      <PatientLayout title="My Appointments" activePage="appointments">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Access denied. Patient role required.</p>
          </div>
        </div>
      </PatientLayout>
    )
  }

  return (
    <PatientLayout title="My Appointments" activePage="appointments">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Appointments</h2>
            <p className="text-gray-600">View and manage your medical appointments</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Book New Appointment
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search doctors, specializations, or appointment types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filter appointments by status"
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {sortedAppointments.map((appointment) => (
          <Card key={appointment.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-5 w-5 text-blue-500" />
                      <h3 className="text-lg font-semibold">{appointment.doctor.name}</h3>
                    </div>
                    <Badge className={getStatusColor(appointment.status)}>
                      {getStatusIcon(appointment.status)}
                      <span className="ml-1 capitalize">{appointment.status}</span>
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{appointment.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{appointment.time} ({appointment.duration})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{appointment.location}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">{appointment.doctor.specialization}</span>
                      <span className="text-sm text-gray-500">• {appointment.doctor.hospital}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-700">Type: {appointment.type}</p>
                    <p className="text-sm text-gray-600 mt-1">{appointment.notes}</p>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  {appointment.status === 'pending' && (
                    <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50">
                      Cancel
                    </Button>
                  )}
                  {appointment.status === 'confirmed' && (
                    <Button variant="outline" size="sm" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                      Reschedule
                    </Button>
                  )}
                  {appointment.status === 'completed' && (
                    <Button variant="outline" size="sm" className="text-green-600 border-green-600 hover:bg-green-50">
                      View Report
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {sortedAppointments.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterStatus !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "You don't have any appointments scheduled yet"
                }
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Book Your First Appointment
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PatientLayout>
  )
}
