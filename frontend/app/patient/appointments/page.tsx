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
  Building2,
  FileText,
  CreditCard
} from "lucide-react"
import { PatientLayout } from "@/components/layout/UniversalLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useEnhancedAuth } from "@/lib/auth/enhanced-auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function PatientAppointments() {
  const { user, loading } = useEnhancedAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const router = useRouter()

  // State for local and API appointments
  const [appointments, setAppointments] = useState([])
  const [loadingAppointments, setLoadingAppointments] = useState(true)

  // Fetch appointments on component mount
  useEffect(() => {
    // Check if there's a recently completed payment with appointment data
    const checkForNewAppointment = () => {
      const paymentDataStr = localStorage.getItem('paymentCompleted');
      if (paymentDataStr) {
        try {
          const paymentData = JSON.parse(paymentDataStr);

          // Get doctor info if available
          let doctorName = "Bác sĩ";
          const doctorInfoStr = localStorage.getItem('selectedDoctor');
          if (doctorInfoStr) {
            try {
              const doctorInfo = JSON.parse(doctorInfoStr);
              doctorName = doctorInfo.name || doctorName;

              // Create a new appointment from payment data
              const newAppointment = {
                id: paymentData.recordId || `app-${Date.now()}`,
                doctor: {
                  name: doctorName,
                  specialization: doctorInfo.specialty || "Chưa xác định",
                  hospital: "Bệnh viện Đa khoa"
                },
                date: new Date().toISOString().split('T')[0],
                time: "10:00", // Default time
                duration: "30 min",
                type: "Khám theo lịch hẹn",
                status: "confirmed",
                location: "Phòng khám bệnh",
                notes: "Đã thanh toán qua PayOS",
                paymentInfo: {
                  amount: paymentData.amount,
                  orderCode: paymentData.orderCode,
                  date: paymentData.paymentDate
                }
              };

              // Add to beginning of mock appointments
              setAppointments(prevAppointments => [newAppointment, ...prevAppointments]);

              // Clear the completed payment data to avoid duplication
              localStorage.removeItem('paymentCompleted');
            } catch (e) {
              console.error('Error parsing doctor info:', e);
            }
          }
        } catch (e) {
          console.error('Error parsing payment data:', e);
        }
      }
    };

    // Add mock data and check for new appointments
    const loadAppointmentData = async () => {
      setLoadingAppointments(true);

      // Mock data for patient appointments
      const mockAppointments = [
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
      ];

      // Set mock appointments
      setAppointments(mockAppointments);

      // Then check for any new appointments from payment process
      checkForNewAppointment();

      setLoadingAppointments(false);
    };

    if (!loading && user) {
      loadAppointmentData();
    }
  }, [loading, user]);

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

  if (loading || loadingAppointments) {
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
            <h2 className="text-2xl font-bold text-gray-900">Lịch hẹn khám bệnh</h2>
            <p className="text-gray-600">Xem và quản lý lịch hẹn khám bệnh của bạn</p>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => router.push('/doctors')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Đặt lịch mới
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Tìm kiếm bác sĩ, chuyên khoa, hoặc loại khám..."
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
            <option value="all">Tất cả trạng thái</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="pending">Đang chờ</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {sortedAppointments.length > 0 ? (
          sortedAppointments.map((appointment) => (
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
                        <span className="ml-1 capitalize">
                          {appointment.status === 'confirmed' ? 'Đã xác nhận' :
                            appointment.status === 'pending' ? 'Đang chờ' :
                              appointment.status === 'completed' ? 'Hoàn thành' :
                                appointment.status === 'cancelled' ? 'Đã hủy' :
                                  appointment.status}
                        </span>
                      </Badge>

                      {/* Payment badge if exists */}
                      {appointment.paymentInfo && (
                        <Badge className="bg-green-50 text-green-700">
                          <CreditCard className="h-3 w-3 mr-1" />
                          Đã thanh toán
                        </Badge>
                      )}
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
                      <p className="text-sm font-medium text-gray-700">Loại khám: {appointment.type}</p>
                      <p className="text-sm text-gray-600 mt-1">{appointment.notes}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {appointment.paymentInfo ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/patient/medical-records?appointmentId=${appointment.id}`)}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Xem bệnh án
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm">
                        Xem chi tiết
                      </Button>
                    )}

                    {appointment.status === 'pending' && (
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Xác nhận
                      </Button>
                    )}

                    {appointment.status === 'confirmed' && !appointment.paymentInfo && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CreditCard className="h-4 w-4 mr-1" />
                        Thanh toán
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Không có lịch hẹn nào</h3>
            <p className="text-gray-600 mb-6">Bạn chưa có lịch hẹn khám bệnh nào</p>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => router.push('/doctors')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Đặt lịch ngay
            </Button>
          </div>
        )}
      </div>
    </PatientLayout>
  )
}
