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
  UserCog,
  Settings2,
  FileBarChart,
  Plus,
  Edit,
  Trash2,
  Filter,
  CreditCard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card"

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

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState(appointmentsData)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All Status")
  const [dateFilter, setDateFilter] = useState("Today")
  const [currentPage, setCurrentPage] = useState(1)

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
              <Button size="sm" className="h-9 bg-[#0066CC]">
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
                    {appointments.map((appointment) => (
                      <tr key={appointment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-3">
                              <AvatarImage
                                src={appointment.patientAvatar || "/placeholder.svg"}
                                alt={appointment.patientName}
                              />
                              <AvatarFallback>{appointment.patientName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="text-sm font-medium text-gray-900">{appointment.patientName}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{appointment.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{appointment.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{appointment.time}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                          {appointment.doctorName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                          {appointment.treatment}
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
                    ))}
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
