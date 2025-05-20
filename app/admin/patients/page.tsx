"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { patientsApi } from "@/lib/supabase"
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
  Settings2,
  FileBarChart,
  Plus,
  Edit,
  Trash2,
  CreditCard,
  UserCog,
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
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

// Dữ liệu mẫu cho bệnh nhân
const patientsData = [
  {
    id: "301",
    name: "Caren G. Simpson",
    avatar: "/placeholder.svg?height=40&width=40",
    age: 35,
    checkIn: "20 July 2023",
    treatment: "Routine Check-Up",
    doctor: "Dr. Petra Winsbury",
    room: "-",
    status: "Active",
  },
  {
    id: "302",
    name: "Edgar Worrow",
    avatar: "/placeholder.svg?height=40&width=40",
    age: 45,
    checkIn: "20 July 2023",
    treatment: "Cardiac Consultation",
    doctor: "Dr. Olivia Martinez",
    room: "-",
    status: "Active",
  },
  {
    id: "303",
    name: "Ocean Jane Lupre",
    avatar: "/placeholder.svg?height=40&width=40",
    age: 10,
    checkIn: "20 July 2023",
    treatment: "Pediatric Check-Up",
    doctor: "Dr. Damian Sanchez",
    room: "Double - 303",
    status: "New Patient",
  },
  {
    id: "304",
    name: "Shane Riddick",
    avatar: "/placeholder.svg?height=40&width=40",
    age: 50,
    checkIn: "20 July 2023",
    treatment: "Skin Allergy",
    doctor: "Dr. Chloe Harrington",
    room: "Single - 304",
    status: "Inactive",
  },
  {
    id: "305",
    name: "Queen Lawriston",
    avatar: "/placeholder.svg?height=40&width=40",
    age: 60,
    checkIn: "20 July 2023",
    treatment: "Follow-Up Visit",
    doctor: "Dr. Petra Winsbury",
    room: "Single - 305",
    status: "Active",
  },
  {
    id: "306",
    name: "Alice Mitchell",
    avatar: "/placeholder.svg?height=40&width=40",
    age: 28,
    checkIn: "20 July 2023",
    treatment: "Routine Check-Up",
    doctor: "Dr. Emily Smith",
    room: "-",
    status: "Active",
  },
  {
    id: "307",
    name: "Mikhail Morozov",
    avatar: "/placeholder.svg?height=40&width=40",
    age: 55,
    checkIn: "20 July 2023",
    treatment: "Cardiac Consultation",
    doctor: "Dr. Samuel Thompson",
    room: "-",
    status: "Active",
  },
  {
    id: "308",
    name: "Mateus Fernandes",
    avatar: "/placeholder.svg?height=40&width=40",
    age: 12,
    checkIn: "20 July 2023",
    treatment: "Pediatric Check-Up",
    doctor: "Dr. Sarah Johnson",
    room: "Double - 308",
    status: "New Patient",
  },
  {
    id: "309",
    name: "Pari Desai",
    avatar: "/placeholder.svg?height=40&width=40",
    age: 40,
    checkIn: "20 July 2023",
    treatment: "Skin Allergy",
    doctor: "Dr. Luke Harrison",
    room: "Single - 309",
    status: "Inactive",
  },
  {
    id: "310",
    name: "Omar Ali",
    avatar: "/placeholder.svg?height=40&width=40",
    age: 70,
    checkIn: "20 July 2023",
    treatment: "Follow-Up Visit",
    doctor: "Dr. Andrew Peterson",
    room: "Single - 310",
    status: "Active",
  },
  {
    id: "311",
    name: "Camila Alvarez",
    avatar: "/placeholder.svg?height=40&width=40",
    age: 30,
    checkIn: "20 July 2023",
    treatment: "Cardiac Check-Up",
    doctor: "Dr. Olivia Martinez",
    room: "-",
    status: "Active",
  },
  {
    id: "312",
    name: "Thabo van Rooyen",
    avatar: "/placeholder.svg?height=40&width=40",
    age: 15,
    checkIn: "20 July 2023",
    treatment: "Pediatric Check-Up",
    doctor: "Dr. William Carter",
    room: "Double - 312",
    status: "New Patient",
  },
]

export default function PatientsPage() {
  const [patients, setPatients] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [treatmentFilter, setTreatmentFilter] = useState("All Treatment")
  const [statusFilter, setStatusFilter] = useState("All Status")
  const [dateFilter, setDateFilter] = useState("1 July - 30 July 2023")
  const [currentPage, setCurrentPage] = useState(1)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [patientToEdit, setPatientToEdit] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)

  // Kiểm tra xem chúng ta đang ở phía client hay không
  useEffect(() => {
    setIsClient(true)
  }, [])

  // State cho dialog thêm bệnh nhân mới
  const [isAddPatientDialogOpen, setIsAddPatientDialogOpen] = useState(false)
  const [newPatient, setNewPatient] = useState({
    patient_id: 0,
    full_name: "",
    date_of_birth: "",
    registration_date: "",
    phone_number: "",
    email: "",
    blood_type: "",
    gender: "Male",
    address: "",
    allergies: "",
    chronic_diseases: "",
    insurance_info: ""
  })

  // Lấy dữ liệu bệnh nhân từ Supabase khi component được tải
  useEffect(() => {
    const fetchPatients = async () => {
      setIsLoading(true);
      try {
        const data = await patientsApi.getAllPatients();
        setPatients(data);
      } catch (error) {
        console.error('Error fetching patients:', error);
        // Sử dụng dữ liệu mẫu nếu có lỗi khi lấy dữ liệu từ Supabase
        setPatients(patientsData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const patientsPerPage = 12
  const totalPatients = 286
  const totalPages = Math.ceil(totalPatients / patientsPerPage)

  // Xử lý tìm kiếm
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  // Xử lý lọc theo điều trị
  const handleTreatmentFilter = (value: string) => {
    setTreatmentFilter(value)
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

  // Xử lý xóa bệnh nhân
  const handleDeleteClick = (id: string) => {
    setPatientToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (patientToDelete) {
      try {
        // Xóa bệnh nhân từ cơ sở dữ liệu
        const success = await patientsApi.deletePatient(patientToDelete);

        if (success) {
          // Cập nhật state nếu xóa thành công
          setPatients(patients.filter((patient) => patient.id !== patientToDelete));
          console.log('Xóa bệnh nhân thành công!');
        }
      } catch (error) {
        console.error('Lỗi khi xóa bệnh nhân:', error);
      }

      // Đóng dialog và reset state
      setIsDeleteDialogOpen(false);
      setPatientToDelete(null);
    }
  }

  // Xử lý chỉnh sửa bệnh nhân
  const handleEditClick = (patient: any) => {
    setPatientToEdit(patient);
    setIsEditDialogOpen(true);
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setPatientToEdit((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const confirmEdit = async () => {
    if (patientToEdit) {
      try {
        // Chuẩn bị dữ liệu cập nhật
        const updates = {
          full_name: patientToEdit.full_name,
          date_of_birth: patientToEdit.date_of_birth,
          gender: patientToEdit.gender,
          phone: patientToEdit.phone,
          email: patientToEdit.email,
          address: patientToEdit.address,
          blood_type: patientToEdit.blood_type,
          allergies: patientToEdit.allergies,
          chronic_diseases: patientToEdit.chronic_diseases,
          insurance_number: patientToEdit.insurance_number,
          insurance_provider: patientToEdit.insurance_provider,
          emergency_contact_name: patientToEdit.emergency_contact_name,
          emergency_contact_phone: patientToEdit.emergency_contact_phone
        };

        // Cập nhật bệnh nhân trong cơ sở dữ liệu
        const updatedPatient = await patientsApi.updatePatient(patientToEdit.id, updates);

        if (updatedPatient) {
          // Cập nhật state nếu cập nhật thành công
          setPatients(patients.map((patient) => (patient.id === patientToEdit.id ? updatedPatient : patient)));
          console.log('Cập nhật bệnh nhân thành công!');
        }
      } catch (error) {
        console.error('Lỗi khi cập nhật bệnh nhân:', error);
      }

      // Đóng dialog và reset state
      setIsEditDialogOpen(false);
      setPatientToEdit(null);
    }
  }

  // Xử lý khi nhấn nút "Add Patient"
  const handleOpenAddPatientDialog = () => {
    setIsAddPatientDialogOpen(true)
  }

  // Xử lý thay đổi giá trị trong form thêm bệnh nhân mới
  const handleNewPatientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setNewPatient(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Xử lý khi submit form thêm bệnh nhân mới
  const handleAddNewPatient = async () => {
    // Tạo bệnh nhân mới
    const patient = {
      patient_id: Math.floor(Math.random() * 10000),
      full_name: newPatient.full_name,
      date_of_birth: newPatient.date_of_birth || null,
      registration_date: isClient ? new Date().toISOString().split('T')[0] : "",
      phone_number: newPatient.phone_number,
      email: newPatient.email,
      blood_type: newPatient.blood_type,
      gender: newPatient.gender,
      address: newPatient.address,
      allergies: newPatient.allergies,
      chronic_diseases: newPatient.chronic_diseases,
      insurance_info: newPatient.insurance_info
    }

    try {
      // Thêm bệnh nhân mới vào cơ sở dữ liệu
      const newPatientData = await patientsApi.addPatient(patient);

      if (newPatientData) {
        // Thêm bệnh nhân mới vào danh sách hiện tại
        setPatients([...patients, newPatientData]);

        // Hiển thị thông báo thành công (có thể thêm toast notification ở đây)
        console.log('Thêm bệnh nhân thành công!');
      }
    } catch (error) {
      console.error('Lỗi khi thêm bệnh nhân:', error);
      // Hiển thị thông báo lỗi (có thể thêm toast notification ở đây)
    }

    // Đóng dialog và reset form
    setIsAddPatientDialogOpen(false);
    setNewPatient({
      patient_id: 0,
      full_name: "",
      date_of_birth: "",
      registration_date: "",
      phone_number: "",
      email: "",
      blood_type: "",
      gender: "Male",
      address: "",
      allergies: "",
      chronic_diseases: "",
      insurance_info: ""
    });
  }

  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "Male":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Nam</Badge>
      case "Female":
        return <Badge className="bg-pink-100 text-pink-800 hover:bg-pink-100">Nữ</Badge>
      case "Other":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Khác</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
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
          <SidebarItem icon={<Calendar size={20} />} label="Appointments" href="/admin/appointments" />
          <SidebarItem icon={<UserCog size={20} />} label="Doctors" href="/admin/doctors" />
          <SidebarItem icon={<User size={20} />} label="Patients" href="/admin/patients" active />
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
            <h1 className="text-xl font-bold">Patients</h1>
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
                  <DropdownMenuItem onClick={() => handleDateFilter("1 July - 30 July 2023")}>
                    1 July - 30 July 2023
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDateFilter("1 June - 30 June 2023")}>
                    1 June - 30 June 2023
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDateFilter("1 May - 31 May 2023")}>
                    1 May - 31 May 2023
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Select value={treatmentFilter} onValueChange={handleTreatmentFilter}>
                <SelectTrigger className="h-9 w-[150px]">
                  <SelectValue placeholder="All Treatment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Treatment">All Treatment</SelectItem>
                  <SelectItem value="Routine Check-Up">Routine Check-Up</SelectItem>
                  <SelectItem value="Cardiac Consultation">Cardiac Consultation</SelectItem>
                  <SelectItem value="Pediatric Check-Up">Pediatric Check-Up</SelectItem>
                  <SelectItem value="Skin Allergy">Skin Allergy</SelectItem>
                  <SelectItem value="Follow-Up Visit">Follow-Up Visit</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger className="h-9 w-[120px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Status">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="New Patient">New Patient</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2" />
              </div>
              <Input
                type="text"
                placeholder="Search patients..."
                className="pl-10 pr-3 py-2 h-9 w-full md:w-80 bg-gray-100 border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>

            <Button variant="outline" size="sm" className="h-9" onClick={handleOpenAddPatientDialog}>
              <Plus size={16} className="mr-2" />
              Add Patient
            </Button>
          </div>
        </div>

        {/* Patient List */}
        <div className="p-4">
          <Card>
            <CardContent className="p-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date of Birth
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registration Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Blood Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gender
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
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
                    ) : patients.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 text-center">
                          <div className="text-gray-500">Không có dữ liệu bệnh nhân</div>
                        </td>
                      </tr>
                    ) : (
                      patients
                        .filter((patient) => {
                          const searchTermLower = searchTerm.toLowerCase()
                          return (
                            (patient.full_name && patient.full_name.toLowerCase().includes(searchTermLower)) ||
                            (patient.email && patient.email.toLowerCase().includes(searchTermLower)) ||
                            (patient.phone && patient.phone.toLowerCase().includes(searchTermLower))
                          )
                        })
                        .slice((currentPage - 1) * patientsPerPage, currentPage * patientsPerPage)
                        .map((patient) => (
                        <tr key={patient.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Avatar className="mr-2">
                                <AvatarImage src="/placeholder.svg" alt={patient.full_name} />
                                <AvatarFallback>{patient.full_name?.substring(0, 2) || 'P'}</AvatarFallback>
                              </Avatar>
                              <div className="text-sm font-medium text-gray-900">{patient.full_name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {patient.date_of_birth ? new Date(patient.date_of_birth).toISOString().split('T')[0] : '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {patient.registration_date ? new Date(patient.registration_date).toISOString().split('T')[0] : '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{patient.phone || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{patient.email || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{patient.blood_type || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">{renderStatusBadge(patient.gender)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Settings size={16} className="mr-2" />
                                  Actions
                                  <ChevronDown size={16} className="ml-2" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditClick(patient)}>
                                  <Edit size={16} className="mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteClick(patient.id)}>
                                  <Trash2 size={16} className="mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} className="mr-2" />
              Previous
            </Button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight size={16} className="ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Patient</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this patient? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Patient Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Patient</DialogTitle>
            <DialogDescription>Make changes to the patient's information here.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="full_name" className="text-right">
                Full Name
              </Label>
              <Input
                type="text"
                id="full_name"
                name="full_name"
                value={patientToEdit?.full_name || ""}
                onChange={handleEditChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date_of_birth" className="text-right">
                Date of Birth
              </Label>
              <Input
                type="date"
                id="date_of_birth"
                name="date_of_birth"
                value={patientToEdit?.date_of_birth ? new Date(patientToEdit.date_of_birth).toISOString().split('T')[0] : ""}
                onChange={handleEditChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                type="text"
                id="phone"
                name="phone"
                value={patientToEdit?.phone || ""}
                onChange={handleEditChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={patientToEdit?.email || ""}
                onChange={handleEditChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                Address
              </Label>
              <Input
                type="text"
                id="address"
                name="address"
                value={patientToEdit?.address || ""}
                onChange={handleEditChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="blood_type" className="text-right">
                Blood Type
              </Label>
              <Input
                type="text"
                id="blood_type"
                name="blood_type"
                value={patientToEdit?.blood_type || ""}
                onChange={handleEditChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="gender" className="text-right">
                Gender
              </Label>
              <Select
                value={patientToEdit?.gender || ""}
                onValueChange={(value) => handleEditChange({ target: { name: "gender", value } } as any)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Patient Dialog */}
      <Dialog open={isAddPatientDialogOpen} onOpenChange={setIsAddPatientDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white rounded-lg shadow-lg border border-gray-200">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-xl font-bold text-gray-900">Thêm bệnh nhân mới</DialogTitle>
            <DialogDescription className="text-gray-600">
              Điền thông tin để thêm bệnh nhân mới vào hệ thống.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-5 bg-white">
            <div className="space-y-5">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="full_name" className="text-right font-medium text-gray-700">
                  Họ tên
                </Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={newPatient.full_name}
                  onChange={handleNewPatientChange}
                  className="col-span-3 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date_of_birth" className="text-right font-medium text-gray-700">
                  Ngày sinh
                </Label>
                <Input
                  id="date_of_birth"
                  name="date_of_birth"
                  type="date"
                  value={newPatient.date_of_birth}
                  onChange={handleNewPatientChange}
                  className="col-span-3 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="gender" className="text-right font-medium text-gray-700">
                  Giới tính
                </Label>
                <div className="col-span-3">
                  <Select
                    name="gender"
                    value={newPatient.gender}
                    onValueChange={(value) => setNewPatient(prev => ({ ...prev, gender: value }))}
                  >
                    <SelectTrigger className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm">
                      <SelectValue placeholder="Chọn giới tính" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Nam</SelectItem>
                      <SelectItem value="Female">Nữ</SelectItem>
                      <SelectItem value="Other">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right font-medium text-gray-700">
                  Số điện thoại
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={newPatient.phone}
                  onChange={handleNewPatientChange}
                  className="col-span-3 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                  placeholder="+84 123 456 789"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right font-medium text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={newPatient.email}
                  onChange={handleNewPatientChange}
                  className="col-span-3 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                  placeholder="patient@example.com"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right font-medium text-gray-700">
                  Địa chỉ
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={newPatient.address}
                  onChange={handleNewPatientChange}
                  className="col-span-3 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                  placeholder="123 Đường ABC, Quận XYZ, TP. HCM"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="blood_type" className="text-right font-medium text-gray-700">
                  Nhóm máu
                </Label>
                <Input
                  id="blood_type"
                  name="blood_type"
                  value={newPatient.blood_type}
                  onChange={handleNewPatientChange}
                  className="col-span-3 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                  placeholder="A+, B-, O+, AB+..."
                />
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsAddPatientDialogOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Hủy
            </Button>
            <Button
              onClick={handleAddNewPatient}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Thêm bệnh nhân
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Component for sidebar items
function SidebarItem({ icon, label, href, active = false }) {
  return (
    <Link
      href={href}
      className={`flex items-center px-4 py-3 space-x-3 ${active ? "bg-blue-50 text-blue-600 border-r-4 border-blue-600" : "text-gray-600 hover:bg-gray-100"}`}
    >
      <span>{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  )
}

// Menu component for mobile
function Menu({ size }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  )
}
