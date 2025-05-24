"use client"

import { useState, useEffect } from "react"
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Plus
} from "lucide-react"
import { DoctorLayout } from "@/components/layout/DoctorLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useAuthProvider } from "@/hooks/useAuthProvider"

export default function DoctorAppointments() {
  const { user, loading } = useAuthProvider()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  // Mock data for appointments
  const appointments = [
    {
      id: "1",
      patient: {
        name: "Nguyễn Văn A",
        phone: "0123456789",
        email: "nguyenvana@email.com",
        age: 35
      },
      date: "2024-01-15",
      time: "09:00",
      duration: "30 min",
      type: "Khám tổng quát",
      status: "confirmed",
      notes: "Đau đầu thường xuyên, cần kiểm tra huyết áp"
    },
    {
      id: "2",
      patient: {
        name: "Trần Thị B",
        phone: "0987654321",
        email: "tranthib@email.com",
        age: 28
      },
      date: "2024-01-15",
      time: "10:30",
      duration: "45 min",
      type: "Tái khám",
      status: "confirmed",
      notes: "Theo dõi kết quả điều trị"
    },
    {
      id: "3",
      patient: {
        name: "Lê Văn C",
        phone: "0369852147",
        email: "levanc@email.com",
        age: 42
      },
      date: "2024-01-15",
      time: "14:00",
      duration: "60 min",
      type: "Khám chuyên khoa",
      status: "pending",
      notes: "Khám tim mạch định kỳ"
    },
    {
      id: "4",
      patient: {
        name: "Phạm Thị D",
        phone: "0741852963",
        email: "phamthid@email.com",
        age: 55
      },
      date: "2024-01-16",
      time: "08:30",
      duration: "30 min",
      type: "Khám tổng quát",
      status: "confirmed",
      notes: "Kiểm tra sức khỏe định kỳ"
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
    const matchesSearch = appointment.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || appointment.status === filterStatus
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <DoctorLayout title="My Appointments" activePage="appointments">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </DoctorLayout>
    )
  }

  if (!user || user.role !== 'doctor') {
    return (
      <DoctorLayout title="My Appointments" activePage="appointments">
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
    <DoctorLayout title="My Appointments" activePage="appointments">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Appointments</h2>
            <p className="text-gray-600">Manage your patient appointments</p>
          </div>
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Schedule New
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search patients or appointment types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
        {filteredAppointments.map((appointment) => (
          <Card key={appointment.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-gray-500" />
                      <h3 className="text-lg font-semibold">{appointment.patient.name}</h3>
                      <span className="text-sm text-gray-500">({appointment.patient.age} years old)</span>
                    </div>
                    <Badge className={getStatusColor(appointment.status)}>
                      {getStatusIcon(appointment.status)}
                      <span className="ml-1 capitalize">{appointment.status}</span>
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{appointment.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{appointment.time} ({appointment.duration})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{appointment.patient.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{appointment.patient.email}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700">Type: {appointment.type}</p>
                    <p className="text-sm text-gray-600 mt-1">{appointment.notes}</p>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  {appointment.status === 'pending' && (
                    <>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        Confirm
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50">
                        Cancel
                      </Button>
                    </>
                  )}
                  {appointment.status === 'confirmed' && (
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      Start Consultation
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredAppointments.length === 0 && (
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
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Schedule New Appointment
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DoctorLayout>
  )
}
