"use client"

import type React from "react"

import { useState } from "react"
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
  const [patients, setPatients] = useState(patientsData)
  const [searchTerm, setSearchTerm] = useState("")
  const [treatmentFilter, setTreatmentFilter] = useState("All Treatment")
  const [statusFilter, setStatusFilter] = useState("All Status")
  const [dateFilter, setDateFilter] = useState("1 July - 30 July 2023")
  const [currentPage, setCurrentPage] = useState(1)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [patientToEdit, setPatientToEdit] = useState<any | null>(null)

  // State cho dialog thêm bệnh nhân mới
  const [isAddPatientDialogOpen, setIsAddPatientDialogOpen] = useState(false)
  const [newPatient, setNewPatient] = useState({
    name: "",
    age: "",
    checkIn: "20 July 2023",
    treatment: "",
    doctor: "",
    room: "-",
    status: "New Patient"
  })

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

  const confirmDelete = () => {
    if (patientToDelete) {
      setPatients(patients.filter((patient) => patient.id !== patientToDelete))
      setIsDeleteDialogOpen(false)
      setPatientToDelete(null)
    }
  }

  // Xử lý chỉnh sửa bệnh nhân
  const handleEditClick = (patient: any) => {
    setPatientToEdit({ ...patient })
    setIsEditDialogOpen(true)
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setPatientToEdit((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const confirmEdit = () => {
    if (patientToEdit) {
      setPatients(patients.map((patient) => (patient.id === patientToEdit.id ? patientToEdit : patient)))
      setIsEditDialogOpen(false)
      setPatientToEdit(null)
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
  const handleAddNewPatient = () => {
    // Tạo ID mới cho bệnh nhân
    const lastId = parseInt(patients[patients.length - 1].id)
    const newId = String(lastId + 1)

    // Tạo bệnh nhân mới
    const patient = {
      id: newId,
      name: newPatient.name,
      avatar: "/placeholder.svg?height=40&width=40",
      age: parseInt(newPatient.age),
      checkIn: newPatient.checkIn,
      treatment: newPatient.treatment,
      doctor: newPatient.doctor,
      room: newPatient.room,
      status: newPatient.status,
    }

    // Thêm bệnh nhân mới vào danh sách
    setPatients([...patients, patient])

    // Đóng dialog và reset form
    setIsAddPatientDialogOpen(false)
    setNewPatient({
      name: "",
      age: "",
      checkIn: "20 July 2023",
      treatment: "",
      doctor: "",
      room: "-",
      status: "New Patient"
    })
  }

  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Active</Badge>
      case "New Patient":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">New Patient</Badge>
      case "Inactive":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Inactive</Badge>
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
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Age
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check In
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Treatment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Doctor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Room
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {patients
                      .filter((patient) => {
                        const searchTermLower = searchTerm.toLowerCase()
                        return (
                          patient.name.toLowerCase().includes(searchTermLower) ||
                          patient.treatment.toLowerCase().includes(searchTermLower) ||
                          patient.doctor.toLowerCase().includes(searchTermLower)
                        )
                      })
                      .filter((patient) => {
                        if (treatmentFilter === "All Treatment") return true
                        return patient.treatment === treatmentFilter
                      })
                      .filter((patient) => {
                        if (statusFilter === "All Status") return true
                        return patient.status === statusFilter
                      })
                      .slice((currentPage - 1) * patientsPerPage, currentPage * patientsPerPage)
                      .map((patient) => (
                        <tr key={patient.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Avatar className="mr-2">
                                <AvatarImage src={patient.avatar || "/placeholder.svg"} alt={patient.name} />
                                <AvatarFallback>{patient.name.substring(0, 2)}</AvatarFallback>
                              </Avatar>
                              <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{patient.age}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{patient.checkIn}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{patient.treatment}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{patient.doctor}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{patient.room}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">{renderStatusBadge(patient.status)}</td>
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
                      ))}
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
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={patientToEdit?.name || ""}
                onChange={handleEditChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="age" className="text-right">
                Age
              </Label>
              <Input
                type="number"
                id="age"
                name="age"
                value={patientToEdit?.age || ""}
                onChange={handleEditChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="checkIn" className="text-right">
                Check In
              </Label>
              <Input
                type="text"
                id="checkIn"
                name="checkIn"
                value={patientToEdit?.checkIn || ""}
                onChange={handleEditChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="treatment" className="text-right">
                Treatment
              </Label>
              <Input
                type="text"
                id="treatment"
                name="treatment"
                value={patientToEdit?.treatment || ""}
                onChange={handleEditChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="doctor" className="text-right">
                Doctor
              </Label>
              <Input
                type="text"
                id="doctor"
                name="doctor"
                value={patientToEdit?.doctor || ""}
                onChange={handleEditChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="room" className="text-right">
                Room
              </Label>
              <Input
                type="text"
                id="room"
                name="room"
                value={patientToEdit?.room || ""}
                onChange={handleEditChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select
                value={patientToEdit?.status || ""}
                onValueChange={(value) => handleEditChange({ target: { name: "status", value } } as any)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="New Patient">New Patient</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
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
                <Label htmlFor="name" className="text-right font-medium text-gray-700">
                  Họ tên
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={newPatient.name}
                  onChange={handleNewPatientChange}
                  className="col-span-3 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="age" className="text-right font-medium text-gray-700">
                  Tuổi
                </Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  value={newPatient.age}
                  onChange={handleNewPatientChange}
                  className="col-span-3 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                  min="0"
                  max="120"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="checkIn" className="text-right font-medium text-gray-700">
                  Ngày nhập viện
                </Label>
                <Input
                  id="checkIn"
                  name="checkIn"
                  value={newPatient.checkIn}
                  onChange={handleNewPatientChange}
                  className="col-span-3 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                  placeholder="20 July 2023"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="treatment" className="text-right font-medium text-gray-700">
                  Điều trị
                </Label>
                <div className="col-span-3">
                  <Select
                    name="treatment"
                    value={newPatient.treatment}
                    onValueChange={(value) => setNewPatient(prev => ({ ...prev, treatment: value }))}
                  >
                    <SelectTrigger className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm">
                      <SelectValue placeholder="Chọn loại điều trị" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Routine Check-Up">Routine Check-Up</SelectItem>
                      <SelectItem value="Cardiac Consultation">Cardiac Consultation</SelectItem>
                      <SelectItem value="Pediatric Check-Up">Pediatric Check-Up</SelectItem>
                      <SelectItem value="Skin Allergy">Skin Allergy</SelectItem>
                      <SelectItem value="Follow-Up Visit">Follow-Up Visit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="doctor" className="text-right font-medium text-gray-700">
                  Bác sĩ phụ trách
                </Label>
                <Input
                  id="doctor"
                  name="doctor"
                  value={newPatient.doctor}
                  onChange={handleNewPatientChange}
                  className="col-span-3 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                  placeholder="Dr. John Doe"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="room" className="text-right font-medium text-gray-700">
                  Phòng
                </Label>
                <Input
                  id="room"
                  name="room"
                  value={newPatient.room}
                  onChange={handleNewPatientChange}
                  className="col-span-3 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                  placeholder="Single - 101"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right font-medium text-gray-700">
                  Trạng thái
                </Label>
                <div className="col-span-3">
                  <Select
                    name="status"
                    value={newPatient.status}
                    onValueChange={(value) => setNewPatient(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm">
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="New Patient">New Patient</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
