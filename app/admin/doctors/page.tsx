"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { doctorsApi } from "@/lib/supabase"
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
  Star,
  StarHalf,
  CreditCard,
  Building2,
  BedDouble,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

// Dữ liệu mẫu cho bác sĩ
const doctorsData = [
  {
    id: "D001",
    name: "Dr. Ava Mullins",
    avatar: "/placeholder.svg?height=40&width=40",
    specialization: "Cardiology",
    experience: "12 years",
    schedule: "Mon-Fri, 08:00-16:00",
    patients: 145,
    rating: 4.8,
    status: "Available",
  },
  {
    id: "D002",
    name: "Dr. Andrew Karlin",
    avatar: "/placeholder.svg?height=40&width=40",
    specialization: "Neurology",
    experience: "15 years",
    schedule: "Mon-Thu, 09:00-17:00",
    patients: 120,
    rating: 4.5,
    status: "On Leave",
  },
  {
    id: "D003",
    name: "Dr. Damian Sanchez",
    avatar: "/placeholder.svg?height=40&width=40",
    specialization: "Pediatrics",
    experience: "8 years",
    schedule: "Mon-Wed, 08:00-16:00",
    patients: 210,
    rating: 4.9,
    status: "Available",
  },
  {
    id: "D004",
    name: "Dr. Chloe Harrington",
    avatar: "/placeholder.svg?height=40&width=40",
    specialization: "Dermatology",
    experience: "10 years",
    schedule: "Tue-Sat, 10:00-18:00",
    patients: 180,
    rating: 4.7,
    status: "Available",
  },
  {
    id: "D005",
    name: "Dr. Petra Winsbury",
    avatar: "/placeholder.svg?height=40&width=40",
    specialization: "Orthopedics",
    experience: "14 years",
    schedule: "Mon-Fri, 09:00-17:00",
    patients: 165,
    rating: 4.6,
    status: "Available",
  },
  {
    id: "D006",
    name: "Dr. Emily Smith",
    avatar: "/placeholder.svg?height=40&width=40",
    specialization: "Gynecology",
    experience: "9 years",
    schedule: "Mon-Thu, 08:30-16:30",
    patients: 190,
    rating: 4.8,
    status: "Available",
  },
  {
    id: "D007",
    name: "Dr. Samuel Thompson",
    avatar: "/placeholder.svg?height=40&width=40",
    specialization: "Cardiology",
    experience: "11 years",
    schedule: "Wed-Sun, 09:00-17:00",
    patients: 135,
    rating: 4.4,
    status: "Available",
  },
  {
    id: "D008",
    name: "Dr. Sarah Johnson",
    avatar: "/placeholder.svg?height=40&width=40",
    specialization: "Pediatrics",
    experience: "7 years",
    schedule: "Mon-Fri, 08:00-16:00",
    patients: 175,
    rating: 4.7,
    status: "On Leave",
  },
  {
    id: "D009",
    name: "Dr. Luke Harrison",
    avatar: "/placeholder.svg?height=40&width=40",
    specialization: "Dermatology",
    experience: "6 years",
    schedule: "Tue-Sat, 09:00-17:00",
    patients: 110,
    rating: 4.3,
    status: "Available",
  },
  {
    id: "D010",
    name: "Dr. Andrew Peterson",
    avatar: "/placeholder.svg?height=40&width=40",
    specialization: "Orthopedics",
    experience: "13 years",
    schedule: "Mon-Fri, 08:00-16:00",
    patients: 155,
    rating: 4.6,
    status: "Available",
  },
  {
    id: "D011",
    name: "Dr. Olivia Martinez",
    avatar: "/placeholder.svg?height=40&width=40",
    specialization: "Cardiology",
    experience: "10 years",
    schedule: "Mon-Thu, 09:00-17:00",
    patients: 140,
    rating: 4.5,
    status: "Available",
  },
  {
    id: "D012",
    name: "Dr. William Carter",
    avatar: "/placeholder.svg?height=40&width=40",
    specialization: "Pediatrics",
    experience: "9 years",
    schedule: "Wed-Sun, 08:30-16:30",
    patients: 185,
    rating: 4.8,
    status: "Available",
  },
]

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [specializationFilter, setSpecializationFilter] = useState("All Specializations")
  const [statusFilter, setStatusFilter] = useState("All Status")
  const [currentPage, setCurrentPage] = useState(1)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [doctorToDelete, setDoctorToDelete] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [doctorToEdit, setDoctorToEdit] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)

  // Kiểm tra xem chúng ta đang ở phía client hay không
  useEffect(() => {
    setIsClient(true)
  }, [])

  // State cho dialog thêm bác sĩ mới
  const [isAddDoctorDialogOpen, setIsAddDoctorDialogOpen] = useState(false)
  const [newDoctor, setNewDoctor] = useState({
    doctorid: "",
    fullname: "",
    specialty: "",
    qualification: "",
    department: "",
    phone: "",
    email: "",
    gender: "Male"
  })

  // Lấy dữ liệu bác sĩ từ Supabase khi component được tải
  useEffect(() => {
    const fetchDoctors = async () => {
      setIsLoading(true);
      try {
        const data = await doctorsApi.getAllDoctors();
        setDoctors(data);
      } catch (error) {
        console.error('Error fetching doctors:', error);
        // Sử dụng dữ liệu mẫu nếu có lỗi khi lấy dữ liệu từ Supabase
        setDoctors(doctorsData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const doctorsPerPage = 10
  const totalDoctors = 120
  const totalPages = Math.ceil(totalDoctors / doctorsPerPage)

  // Xử lý tìm kiếm
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  // Xử lý lọc theo chuyên khoa
  const handleSpecializationFilter = (value: string) => {
    setSpecializationFilter(value)
  }

  // Xử lý lọc theo trạng thái
  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
  }

  // Xử lý phân trang
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Xử lý xóa bác sĩ
  const handleDeleteClick = (id: string) => {
    setDoctorToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (doctorToDelete) {
      try {
        // Xóa bác sĩ từ cơ sở dữ liệu
        const success = await doctorsApi.deleteDoctor(doctorToDelete);

        if (success) {
          // Cập nhật state nếu xóa thành công
          setDoctors(doctors.filter((doctor) => doctor.id !== doctorToDelete));
          console.log('Xóa bác sĩ thành công!');
        }
      } catch (error) {
        console.error('Lỗi khi xóa bác sĩ:', error);
      }

      // Đóng dialog và reset state
      setIsDeleteDialogOpen(false);
      setDoctorToDelete(null);
    }
  }

  // Xử lý chỉnh sửa bác sĩ
  const handleEditClick = (doctor: any) => {
    setDoctorToEdit({ ...doctor })
    setIsEditDialogOpen(true)
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setDoctorToEdit((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const confirmEdit = async () => {
    if (doctorToEdit) {
      try {
        // Chuẩn bị dữ liệu cập nhật
        const updates = {
          full_name: doctorToEdit.full_name,
          specialty: doctorToEdit.specialty,
          qualification: doctorToEdit.qualification,
          department: doctorToEdit.department,
          license_number: doctorToEdit.license_number,
          phone: doctorToEdit.phone,
          email: doctorToEdit.email,
          gender: doctorToEdit.gender,
        };

        // Cập nhật bác sĩ trong cơ sở dữ liệu
        const updatedDoctor = await doctorsApi.updateDoctor(doctorToEdit.id, updates);

        if (updatedDoctor) {
          // Cập nhật state nếu cập nhật thành công
          setDoctors(doctors.map((doctor) => (doctor.id === doctorToEdit.id ? updatedDoctor : doctor)));
          console.log('Cập nhật bác sĩ thành công!');
        }
      } catch (error) {
        console.error('Lỗi khi cập nhật bác sĩ:', error);
      }

      // Đóng dialog và reset state
      setIsEditDialogOpen(false);
      setDoctorToEdit(null);
    }
  }

  // Xử lý khi nhấn nút "Add Doctor"
  const handleOpenAddDoctorDialog = () => {
    setIsAddDoctorDialogOpen(true)
  }

  // Xử lý thay đổi giá trị trong form thêm bác sĩ mới
  const handleNewDoctorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setNewDoctor(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Xử lý khi submit form thêm bác sĩ mới
  const handleAddNewDoctor = async () => {
    // Tạo bác sĩ mới
    const doctor = {
      doctorid: `DOC${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      fullname: newDoctor.fullname,
      specialty: newDoctor.specialty,
      qualification: newDoctor.qualification,
      department: newDoctor.department,
      phone: newDoctor.phone,
      email: newDoctor.email,
      gender: newDoctor.gender
    }

    try {
      // Thêm bác sĩ mới vào cơ sở dữ liệu
      const newDoctorData = await doctorsApi.addDoctor(doctor);

      if (newDoctorData) {
        // Thêm bác sĩ mới vào danh sách hiện tại
        setDoctors([...doctors, newDoctorData]);

        // Hiển thị thông báo thành công (có thể thêm toast notification ở đây)
        console.log('Thêm bác sĩ thành công!');
      }
    } catch (error) {
      console.error('Lỗi khi thêm bác sĩ:', error);
      // Hiển thị thông báo lỗi (có thể thêm toast notification ở đây)
    }

    // Đóng dialog và reset form
    setIsAddDoctorDialogOpen(false);
    setNewDoctor({
      doctorid: "",
      fullname: "",
      specialty: "",
      qualification: "",
      department: "",
      phone: "",
      email: "",
      gender: "Male"
    });
  }

  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "Male":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Male</Badge>
      case "Female":
        return <Badge className="bg-pink-100 text-pink-800 hover:bg-pink-100">Female</Badge>
      case "Other":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Other</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  // Render rating stars
  const renderRating = (rating: number) => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5

    return (
      <div className="flex items-center">
        {Array(fullStars)
          .fill(0)
          .map((_, i) => (
            <Star key={i} size={16} className="text-yellow-500 fill-yellow-500" />
          ))}
        {hasHalfStar && <StarHalf size={16} className="text-yellow-500 fill-yellow-500" />}
        <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    )
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
          <SidebarItem icon={<UserCog size={20} />} label="Doctors" href="/admin/doctors" active />
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
            <h1 className="text-xl font-bold">Doctors</h1>
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
              <Select value={specializationFilter} onValueChange={handleSpecializationFilter}>
                <SelectTrigger className="h-9 w-[180px]">
                  <SelectValue placeholder="All Specialties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Specializations">All Specialties</SelectItem>
                  <SelectItem value="Cardiology">Cardiology</SelectItem>
                  <SelectItem value="Neurology">Neurology</SelectItem>
                  <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                  <SelectItem value="Dermatology">Dermatology</SelectItem>
                  <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                  <SelectItem value="Gynecology">Gynecology</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger className="h-9 w-[120px]">
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Status">All Genders</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
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
                  placeholder="Search doctors"
                  className="pl-8 h-9 w-[250px]"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
              <Button size="sm" className="h-9 bg-[#0066CC]" onClick={handleOpenAddDoctorDialog}>
                <Plus size={16} className="mr-1" /> Add Doctor
              </Button>
            </div>
          </div>
        </div>

        {/* Doctors Table */}
        <div className="p-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-3">Doctor</th>
                      <th className="px-6 py-3">ID</th>
                      <th className="px-6 py-3">Specialty</th>
                      <th className="px-6 py-3 hidden md:table-cell">Qualification</th>
                      <th className="px-6 py-3 hidden md:table-cell">Schedule</th>
                      <th className="px-6 py-3 hidden md:table-cell">Department</th>
                      <th className="px-6 py-3">License</th>
                      <th className="px-6 py-3">Gender</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoading ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-4 text-center">
                          <div className="flex justify-center items-center space-x-2">
                            <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Đang tải dữ liệu...</span>
                          </div>
                        </td>
                      </tr>
                    ) : doctors.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-4 text-center">
                          <div className="text-gray-500">Không có dữ liệu bác sĩ</div>
                        </td>
                      </tr>
                    ) : (
                      doctors
                        .filter((doctor) => {
                          if (searchTerm === "") return true;
                          const searchTermLower = searchTerm.toLowerCase();
                          return (
                            (doctor.full_name && doctor.full_name.toLowerCase().includes(searchTermLower)) ||
                            (doctor.doctor_id && doctor.doctor_id.toLowerCase().includes(searchTermLower)) ||
                            (doctor.specialty && doctor.specialty.toLowerCase().includes(searchTermLower))
                          );
                        })
                        .filter((doctor) => {
                          if (specializationFilter === "All Specializations") return true;
                          return doctor.specialty === specializationFilter;
                        })
                        .filter((doctor) => {
                          if (statusFilter === "All Status") return true;
                          return doctor.gender === statusFilter;
                        })
                        .map((doctor) => (
                      <tr key={doctor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-3">
                              <AvatarImage src="/placeholder.svg" alt={doctor.full_name} />
                              <AvatarFallback>{doctor.full_name?.charAt(0) || 'D'}</AvatarFallback>
                            </Avatar>
                            <div className="text-sm font-medium text-gray-900">{doctor.full_name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doctor.doctor_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doctor.specialty}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                          {doctor.qualification}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                          {typeof doctor.work_schedule === 'string' ? 'Mon-Fri, 09:00-17:00' : 'Mon-Fri, 09:00-17:00'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                          {doctor.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{doctor.license_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{renderStatusBadge(doctor.gender)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-yellow-600 hover:text-yellow-900 mr-2"
                            onClick={() => handleEditClick(doctor)}
                          >
                            <Edit size={16} className="md:mr-1" />
                            <span className="hidden md:inline">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleDeleteClick(doctor.id)}
                          >
                            <Trash2 size={16} className="md:mr-1" />
                            <span className="hidden md:inline">Delete</span>
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
                Showing <span className="font-medium">10</span> out of <span className="font-medium">120</span>
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
                <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300">
                  ...
                </span>
                <Button variant="outline" size="sm" onClick={() => handlePageChange(totalPages)}>
                  {totalPages}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this doctor? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Doctor Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Doctor</DialogTitle>
            <DialogDescription>Make changes to the doctor information here.</DialogDescription>
          </DialogHeader>
          {doctorToEdit && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="full_name" className="text-right">
                  Name
                </Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={doctorToEdit.full_name}
                  onChange={handleEditChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="specialty" className="text-right">
                  Specialty
                </Label>
                <Select
                  value={doctorToEdit.specialty}
                  onValueChange={(value) => setDoctorToEdit({ ...doctorToEdit, specialty: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cardiology">Cardiology</SelectItem>
                    <SelectItem value="Neurology">Neurology</SelectItem>
                    <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                    <SelectItem value="Dermatology">Dermatology</SelectItem>
                    <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                    <SelectItem value="Gynecology">Gynecology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="qualification" className="text-right">
                  Qualification
                </Label>
                <Input
                  id="qualification"
                  name="qualification"
                  value={doctorToEdit.qualification}
                  onChange={handleEditChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="department" className="text-right">
                  Department
                </Label>
                <Input
                  id="department"
                  name="department"
                  value={doctorToEdit.department}
                  onChange={handleEditChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="license_number" className="text-right">
                  License
                </Label>
                <Input
                  id="license_number"
                  name="license_number"
                  value={doctorToEdit.license_number}
                  onChange={handleEditChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={doctorToEdit.phone}
                  onChange={handleEditChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="gender" className="text-right">
                  Gender
                </Label>
                <Select
                  value={doctorToEdit.gender}
                  onValueChange={(value) => setDoctorToEdit({ ...doctorToEdit, gender: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmEdit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Doctor Dialog */}
      <Dialog open={isAddDoctorDialogOpen} onOpenChange={setIsAddDoctorDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Thêm bác sĩ mới</DialogTitle>
            <DialogDescription>
              Điền thông tin để thêm bác sĩ mới vào hệ thống.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fullname" className="text-right">
                Tên bác sĩ
              </Label>
              <Input
                id="fullname"
                name="fullname"
                value={newDoctor.fullname}
                onChange={handleNewDoctorChange}
                className="col-span-3"
                placeholder="Dr. John Doe"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="specialty" className="text-right">
                Chuyên khoa
              </Label>
              <Select
                name="specialty"
                value={newDoctor.specialty}
                onValueChange={(value) => setNewDoctor(prev => ({ ...prev, specialty: value }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Chọn chuyên khoa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cardiology">Cardiology</SelectItem>
                  <SelectItem value="Neurology">Neurology</SelectItem>
                  <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                  <SelectItem value="Dermatology">Dermatology</SelectItem>
                  <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                  <SelectItem value="Gynecology">Gynecology</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="qualification" className="text-right">
                Bằng cấp
              </Label>
              <Input
                id="qualification"
                name="qualification"
                value={newDoctor.qualification}
                onChange={handleNewDoctorChange}
                className="col-span-3"
                placeholder="MD, PhD"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">
                Khoa
              </Label>
              <Input
                id="department"
                name="department"
                value={newDoctor.department}
                onChange={handleNewDoctorChange}
                className="col-span-3"
                placeholder="Cardiology Department"
              />
            </div>



            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Số điện thoại
              </Label>
              <Input
                id="phone"
                name="phone"
                value={newDoctor.phone}
                onChange={handleNewDoctorChange}
                className="col-span-3"
                placeholder="+84 123 456 789"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={newDoctor.email}
                onChange={handleNewDoctorChange}
                className="col-span-3"
                placeholder="doctor@hospital.com"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="gender" className="text-right">
                Giới tính
              </Label>
              <Select
                name="gender"
                value={newDoctor.gender}
                onValueChange={(value) => setNewDoctor(prev => ({ ...prev, gender: value }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Chọn giới tính" />
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
            <Button variant="outline" onClick={() => setIsAddDoctorDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleAddNewDoctor}>
              Thêm bác sĩ
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
