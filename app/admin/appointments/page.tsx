"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { appointmentsApi, doctorsApi, patientsApi } from "@/lib/supabase"
import ClientOnly from "@/components/client-only"
import { SidebarItem, Menu } from "@/components/shared-components"
import Link from "next/link"
import {
  Search,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Calendar,
  User,
  UserCog,
  Settings2,
  FileBarChart,
  Plus,
  Edit,
  Trash2,
  Filter,
  CreditCard,
  Clock,
  Building2,
  BedDouble,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

// Dữ liệu mẫu cho cuộc hẹn
const appointmentsData = [
  {
    id: "APT001",
    patientName: "Carol C-Simpson",
    patientAvatar: "/placeholder.svg?height=40&width=40",
    date: "19 Jul 2023",
    time: "09:00 AM",
    doctorName: "Dr. Ava Mullins",
    treatment: "Routine Check-Up",
    status: "Confirmed",
  },
  {
    id: "APT002",
    patientName: "Steven Bennett",
    patientAvatar: "/placeholder.svg?height=40&width=40",
    date: "19 Jul 2023",
    time: "10:30 AM",
    doctorName: "Dr. Andrew Karin",
    treatment: "Cardiac Evaluation",
    status: "Pending",
  },
  {
    id: "APT003",
    patientName: "Ocean Jane Lupre",
    patientAvatar: "/placeholder.svg?height=40&width=40",
    date: "19 Jul 2023",
    time: "11:15 AM",
    doctorName: "Dr. Damian Sanchez",
    treatment: "Pediatric Check-Up",
    status: "Confirmed",
  },
  {
    id: "APT004",
    patientName: "Shane Riddick",
    patientAvatar: "/placeholder.svg?height=40&width=40",
    date: "19 Jul 2023",
    time: "01:00 PM",
    doctorName: "Dr. Chloe Harrington",
    treatment: "Skin Allergy",
    status: "Cancelled",
  },
  {
    id: "APT005",
    patientName: "Queen Lawriston",
    patientAvatar: "/placeholder.svg?height=40&width=40",
    date: "19 Jul 2023",
    time: "02:30 PM",
    doctorName: "Dr. Petra Winsbury",
    treatment: "Follow-Up Visit",
    status: "Confirmed",
  },
  {
    id: "APT006",
    patientName: "Alice Mitchell",
    patientAvatar: "/placeholder.svg?height=40&width=40",
    date: "20 Jul 2023",
    time: "09:00 AM",
    doctorName: "Dr. Emily Smith",
    treatment: "Routine Check-Up",
    status: "Confirmed",
  },
  {
    id: "APT007",
    patientName: "Mikhail Morozov",
    patientAvatar: "/placeholder.svg?height=40&width=40",
    date: "20 Jul 2023",
    time: "10:45 AM",
    doctorName: "Dr. Samuel Thompson",
    treatment: "Cardiac Consultation",
    status: "Pending",
  },
  {
    id: "APT008",
    patientName: "Mateus Fernandes",
    patientAvatar: "/placeholder.svg?height=40&width=40",
    date: "20 Jul 2023",
    time: "11:30 AM",
    doctorName: "Dr. Sarah Johnson",
    treatment: "Pediatric Check-Up",
    status: "Confirmed",
  },
]

// Danh sách các bác sĩ mẫu
const doctorsData = [
  { id: "DOC001", name: "Dr. Ava Mullins", specialization: "General Medicine" },
  { id: "DOC002", name: "Dr. Andrew Karin", specialization: "Cardiology" },
  { id: "DOC003", name: "Dr. Damian Sanchez", specialization: "Pediatrics" },
  { id: "DOC004", name: "Dr. Chloe Harrington", specialization: "Dermatology" },
  { id: "DOC005", name: "Dr. Petra Winsbury", specialization: "Internal Medicine" },
  { id: "DOC006", name: "Dr. Emily Smith", specialization: "General Medicine" },
  { id: "DOC007", name: "Dr. Samuel Thompson", specialization: "Cardiology" },
  { id: "DOC008", name: "Dr. Sarah Johnson", specialization: "Pediatrics" },
]

// Danh sách các loại điều trị mẫu
const treatmentsData = [
  "Routine Check-Up",
  "Cardiac Evaluation",
  "Pediatric Check-Up",
  "Skin Allergy",
  "Follow-Up Visit",
  "Cardiac Consultation",
  "Dental Check-Up",
  "Eye Examination",
  "Physical Therapy",
  "Vaccination"
]

// Danh sách bệnh nhân mẫu
const patientsData = [
  { id: "PAT001", name: "Carol C-Simpson" },
  { id: "PAT002", name: "Steven Bennett" },
  { id: "PAT003", name: "Ocean Jane Lupre" },
  { id: "PAT004", name: "Shane Riddick" },
  { id: "PAT005", name: "Queen Lawriston" },
  { id: "PAT006", name: "Alice Mitchell" },
  { id: "PAT007", name: "Mikhail Morozov" },
  { id: "PAT008", name: "Mateus Fernandes" },
]

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [patients, setPatients] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All Status")
  const [dateFilter, setDateFilter] = useState("Today")
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)

  // Kiểm tra xem chúng ta đang ở phía client hay không
  useEffect(() => {
    setIsClient(true)
  }, [])

  // State cho dialog thêm lịch khám mới
  const [isNewAppointmentDialogOpen, setIsNewAppointmentDialogOpen] = useState(false)
  const [newAppointment, setNewAppointment] = useState({
    appointment_id: "",
    patient_id: 0,
    doctor_id: "",
    appointment_date: "",
    appointment_time: "09:00",
    treatment_description: "",
    status: "Pending"
  })

  // Cập nhật ngày mặc định khi ở phía client
  useEffect(() => {
    if (isClient) {
      setNewAppointment(prev => ({
        ...prev,
        appointment_date: new Date().toISOString().split('T')[0]
      }))
    }
  }, [isClient])

  // Lấy dữ liệu từ Supabase khi component được tải
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Lấy dữ liệu cuộc hẹn
        const appointmentsData = await appointmentsApi.getAllAppointments();
        setAppointments(appointmentsData);

        // Lấy dữ liệu bác sĩ
        const doctorsData = await doctorsApi.getAllDoctors();
        setDoctors(doctorsData);

        // Lấy dữ liệu bệnh nhân
        const patientsData = await patientsApi.getAllPatients();
        setPatients(patientsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Sử dụng dữ liệu mẫu nếu có lỗi
        setAppointments(appointmentsData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const appointmentsPerPage = 8
  const totalAppointments = 24
  const totalPages = Math.ceil(totalAppointments / appointmentsPerPage)

  // Xử lý tìm kiếm
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  // Xử lý lọc theo trạng thái
  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
  }

  // Xử lý lọc theo ngày
  const handleDateFilter = (value: string) => {
    setDateFilter(value)
  }

  // Xử lý phân trang
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Xử lý thay đổi giá trị trong form thêm lịch khám mới
  const handleNewAppointmentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewAppointment(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Xử lý thay đổi giá trị select
  const handleSelectChange = (name: string, value: string) => {
    setNewAppointment(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Xử lý khi nhấn nút "New Appointment"
  const handleOpenNewAppointmentDialog = () => {
    setIsNewAppointmentDialogOpen(true)
  }

  // Xử lý khi submit form thêm lịch khám mới
  const handleAddNewAppointment = async () => {
    try {
      // Tạo cuộc hẹn mới
      const appointment = {
        appointment_id: `APT${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        patient_id: newAppointment.patient_id,
        doctor_id: newAppointment.doctor_id,
        appointment_date: newAppointment.appointment_date,
        appointment_time: newAppointment.appointment_time,
        treatment_description: newAppointment.treatment_description,
        status: newAppointment.status
      };

      // Thêm cuộc hẹn mới vào cơ sở dữ liệu
      const newAppointmentData = await appointmentsApi.addAppointment(appointment);

      if (newAppointmentData) {
        // Lấy lại danh sách cuộc hẹn để có dữ liệu mới nhất
        const updatedAppointments = await appointmentsApi.getAllAppointments();
        setAppointments(updatedAppointments);

        // Hiển thị thông báo thành công
        console.log('Thêm lịch khám thành công!');
      }
    } catch (error) {
      console.error('Lỗi khi thêm lịch khám:', error);
    }

    // Đóng dialog và reset form
    setIsNewAppointmentDialogOpen(false);
    setNewAppointment({
      appointment_id: "",
      patient_id: 0,
      doctor_id: "",
      appointment_date: isClient ? new Date().toISOString().split('T')[0] : "",
      appointment_time: "09:00",
      treatment_description: "",
      status: "Pending"
    });
  }

  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "Confirmed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Confirmed</Badge>
      case "Pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
      case "Cancelled":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <ClientOnly>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 hidden md:block">
        <div className="p-4 flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-[#0066CC] flex items-center justify-center">
            <span className="text-white font-bold">H</span>
          </div>
          <span className="text-xl font-bold">Hospital</span>
        </div>
        <div className="mt-6">
          <SidebarItem icon={<BarChart3 size={20} />} label="Dashboard" href="/admin/dashboard" />
          <SidebarItem icon={<Calendar size={20} />} label="Appointments" href="/admin/appointments" active />
          <SidebarItem icon={<UserCog size={20} />} label="Doctors" href="/admin/doctors" />
          <SidebarItem icon={<User size={20} />} label="Patients" href="/admin/patients" />
          <SidebarItem icon={<Building2 size={20} />} label="Departments" href="/admin/departments" />
          <SidebarItem icon={<BedDouble size={20} />} label="Rooms" href="/admin/rooms" />
          <SidebarItem icon={<CreditCard size={20} />} label="Payment" href="/admin/payment" />
          <SidebarItem icon={<Settings2 size={20} />} label="Settings" href="/admin/settings" />
          <SidebarItem icon={<FileBarChart size={20} />} label="Audit Logs" href="/admin/audit-logs" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="md:hidden mr-2">
              <Menu size={20} />
            </Button>
            <h1 className="text-xl font-bold">Appointments</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Settings size={20} />
            </Button>
            <div className="flex items-center space-x-2">
              <Avatar>
                <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Alfredo Westervelt" />
                <AvatarFallback>AW</AvatarFallback>
              </Avatar>
              <span className="font-medium hidden md:inline">Alfredo Westervelt</span>
              <ChevronDown size={16} className="text-gray-400" />
            </div>
          </div>
        </header>

        {/* Filter Bar */}
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
            <div className="flex flex-wrap items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <Calendar size={16} className="mr-2" />
                    {dateFilter}
                    <ChevronDown size={16} className="ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleDateFilter("Today")}>Today</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDateFilter("Tomorrow")}>Tomorrow</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDateFilter("This Week")}>This Week</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDateFilter("This Month")}>This Month</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger className="h-9 w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Status">All Status</SelectItem>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" className="h-9">
                <Filter size={16} className="mr-2" /> More Filters
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Search appointments"
                  className="pl-8 h-9 w-[250px]"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
              <Button size="sm" className="h-9 bg-[#0066CC]" onClick={handleOpenNewAppointmentDialog}>
                <Plus size={16} className="mr-1" /> New Appointment
              </Button>
            </div>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="p-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-3">Patient</th>
                      <th className="px-6 py-3">Appointment ID</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Time</th>
                      <th className="px-6 py-3 hidden md:table-cell">Doctor</th>
                      <th className="px-6 py-3 hidden md:table-cell">Treatment</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 text-center">
                          <div className="flex justify-center items-center space-x-2">
                            <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Đang tải dữ liệu...</span>
                          </div>
                        </td>
                      </tr>
                    ) : appointments.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 text-center">
                          <div className="text-gray-500">Không có dữ liệu cuộc hẹn</div>
                        </td>
                      </tr>
                    ) : (
                      appointments
                        .filter((appointment) => {
                          if (searchTerm === "") return true;
                          const searchTermLower = searchTerm.toLowerCase();
                          return (
                            (appointment.patients?.full_name && appointment.patients.full_name.toLowerCase().includes(searchTermLower)) ||
                            (appointment.appointment_id && appointment.appointment_id.toLowerCase().includes(searchTermLower)) ||
                            (appointment.doctors?.full_name && appointment.doctors.full_name.toLowerCase().includes(searchTermLower))
                          );
                        })
                        .filter((appointment) => {
                          if (statusFilter === "All Status") return true;
                          return appointment.status === statusFilter;
                        })
                        .map((appointment) => (
                      <tr key={appointment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-3">
                              <AvatarImage
                                src="/placeholder.svg"
                                alt={appointment.patients?.full_name}
                              />
                              <AvatarFallback>{appointment.patients?.full_name?.charAt(0) || 'P'}</AvatarFallback>
                            </Avatar>
                            <div className="text-sm font-medium text-gray-900">{appointment.patients?.full_name || 'Unknown Patient'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{appointment.appointment_id || appointment.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {appointment.appointment_date ? new Date(appointment.appointment_date).toISOString().split('T')[0] : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {appointment.appointment_time || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                          {appointment.doctors?.full_name || 'Unknown Doctor'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                          {appointment.reason_for_visit || appointment.notes || 'No treatment specified'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{renderStatusBadge(appointment.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button variant="ghost" size="sm" className="text-yellow-600 hover:text-yellow-900 mr-2">
                            <Edit size={16} className="md:mr-1" />
                            <span className="hidden md:inline">Edit</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-900">
                            <Trash2 size={16} className="md:mr-1" />
                            <span className="hidden md:inline">Cancel</span>
                          </Button>
                        </td>
                      </tr>
                    ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pagination */}
        <div className="p-4 flex items-center justify-between border-t border-gray-200 bg-white">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">8</span> out of <span className="font-medium">24</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-l-md"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button
                  variant={currentPage === 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  className="bg-blue-600 text-white"
                >
                  1
                </Button>
                <Button variant="outline" size="sm" onClick={() => handlePageChange(2)}>
                  2
                </Button>
                <Button variant="outline" size="sm" onClick={() => handlePageChange(3)}>
                  3
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-r-md"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={16} />
                </Button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog thêm lịch khám mới */}
      <Dialog open={isNewAppointmentDialogOpen} onOpenChange={setIsNewAppointmentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Thêm lịch khám mới</DialogTitle>
            <DialogDescription>
              Điền thông tin để tạo lịch khám mới cho bệnh nhân.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="patient_id" className="text-right">
                Bệnh nhân
              </Label>
              <Select
                name="patient_id"
                value={newAppointment.patient_id}
                onValueChange={(value) => handleSelectChange('patient_id', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Chọn bệnh nhân" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map(patient => (
                    <SelectItem key={patient.id} value={String(patient.id)}>
                      {patient.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="doctor_id" className="text-right">
                Bác sĩ
              </Label>
              <Select
                name="doctor_id"
                value={newAppointment.doctor_id}
                onValueChange={(value) => handleSelectChange('doctor_id', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Chọn bác sĩ" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map(doctor => (
                    <SelectItem key={doctor.id} value={String(doctor.id)}>
                      {doctor.full_name} - {doctor.specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="appointment_date" className="text-right">
                Ngày khám
              </Label>
              <div className="col-span-3 flex items-center">
                <Calendar className="mr-2 h-4 w-4 opacity-70" />
                <Input
                  type="date"
                  id="appointment_date"
                  name="appointment_date"
                  value={newAppointment.appointment_date}
                  onChange={handleNewAppointmentChange}
                  className="col-span-3"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="appointment_time" className="text-right">
                Giờ khám
              </Label>
              <div className="col-span-3 flex items-center">
                <Clock className="mr-2 h-4 w-4 opacity-70" />
                <Input
                  type="time"
                  id="appointment_time"
                  name="appointment_time"
                  value={newAppointment.appointment_time}
                  onChange={handleNewAppointmentChange}
                  className="col-span-3"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Trạng thái
              </Label>
              <Select
                name="status"
                value={newAppointment.status}
                onValueChange={(value) => handleSelectChange('status', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason_for_visit" className="text-right">
                Lý do khám
              </Label>
              <Input
                id="reason_for_visit"
                name="reason_for_visit"
                value={newAppointment.reason_for_visit}
                onChange={handleNewAppointmentChange}
                className="col-span-3"
                placeholder="Nhập lý do khám..."
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Ghi chú
              </Label>
              <textarea
                id="notes"
                name="notes"
                value={newAppointment.notes}
                onChange={handleNewAppointmentChange}
                className="col-span-3 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Nhập ghi chú về cuộc hẹn..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewAppointmentDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleAddNewAppointment}>
              Thêm lịch khám
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </ClientOnly>
  )
}


