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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export default function DepartmentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isNewDepartmentDialogOpen, setIsNewDepartmentDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [departmentToDelete, setDepartmentToDelete] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [departmentToEdit, setDepartmentToEdit] = useState<any | null>(null)
  
  // Sample departments data
  const departmentsData = [
    { id: "DEP001", name: "Cardiology", head: "Dr. John Smith", staff_count: 15, rooms: 8, description: "Heart and cardiovascular system" },
    { id: "DEP002", name: "Neurology", head: "Dr. Sarah Johnson", staff_count: 12, rooms: 6, description: "Brain and nervous system" },
    { id: "DEP003", name: "Pediatrics", head: "Dr. Michael Brown", staff_count: 20, rooms: 10, description: "Medical care for infants, children, and adolescents" },
    { id: "DEP004", name: "Orthopedics", head: "Dr. Emily Davis", staff_count: 18, rooms: 7, description: "Musculoskeletal system" },
    { id: "DEP005", name: "Oncology", head: "Dr. Robert Wilson", staff_count: 14, rooms: 9, description: "Cancer treatment" },
    { id: "DEP006", name: "Gynecology", head: "Dr. Lisa Martinez", staff_count: 10, rooms: 5, description: "Female reproductive health" },
    { id: "DEP007", name: "Dermatology", head: "Dr. James Taylor", staff_count: 8, rooms: 4, description: "Skin conditions" },
    { id: "DEP008", name: "Ophthalmology", head: "Dr. Patricia Anderson", staff_count: 9, rooms: 6, description: "Eye care" },
    { id: "DEP009", name: "Psychiatry", head: "Dr. Thomas White", staff_count: 12, rooms: 8, description: "Mental health" },
    { id: "DEP010", name: "Radiology", head: "Dr. Jennifer Lee", staff_count: 15, rooms: 7, description: "Medical imaging" },
  ]

  const [departments, setDepartments] = useState(departmentsData)
  const [newDepartment, setNewDepartment] = useState({
    name: "",
    head: "",
    staff_count: 0,
    rooms: 0,
    description: "",
  })

  const departmentsPerPage = 10
  const totalPages = Math.ceil(departments.length / departmentsPerPage)

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  // Handle pagination
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Handle new department form
  const handleNewDepartmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewDepartment({
      ...newDepartment,
      [name]: name === 'staff_count' || name === 'rooms' ? parseInt(value) : value,
    })
  }

  const handleAddNewDepartment = () => {
    const newId = `DEP${String(departments.length + 1).padStart(3, '0')}`
    const departmentWithId = {
      id: newId,
      ...newDepartment,
    }
    setDepartments([...departments, departmentWithId])
    setNewDepartment({
      name: "",
      head: "",
      staff_count: 0,
      rooms: 0,
      description: "",
    })
    setIsNewDepartmentDialogOpen(false)
  }

  // Handle delete department
  const handleDeleteClick = (id: string) => {
    setDepartmentToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (departmentToDelete) {
      setDepartments(departments.filter((dept) => dept.id !== departmentToDelete))
      setDepartmentToDelete(null)
      setIsDeleteDialogOpen(false)
    }
  }

  // Handle edit department
  const handleEditClick = (department: any) => {
    setDepartmentToEdit({ ...department })
    setIsEditDialogOpen(true)
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setDepartmentToEdit({
      ...departmentToEdit,
      [name]: name === 'staff_count' || name === 'rooms' ? parseInt(value) : value,
    })
  }

  const handleSaveEdit = () => {
    setDepartments(
      departments.map((dept) => (dept.id === departmentToEdit.id ? departmentToEdit : dept))
    )
    setDepartmentToEdit(null)
    setIsEditDialogOpen(false)
  }

  // Filter departments based on search term
  const filteredDepartments = departments.filter((department) =>
    department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    department.head.toLowerCase().includes(searchTerm.toLowerCase()) ||
    department.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get current page departments
  const indexOfLastDepartment = currentPage * departmentsPerPage
  const indexOfFirstDepartment = indexOfLastDepartment - departmentsPerPage
  const currentDepartments = filteredDepartments.slice(indexOfFirstDepartment, indexOfLastDepartment)

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
          <SidebarItem icon={<User size={20} />} label="Patients" href="/admin/patients" />
          <SidebarItem icon={<Building2 size={20} />} label="Departments" href="/admin/departments" active />
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
            <h1 className="text-xl font-bold">Departments</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Settings size={20} />
            </Button>
            <div className="flex items-center space-x-2">
              <Avatar>
                <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Admin" />
                <AvatarFallback>AW</AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <span className="font-medium">Admin User</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4">
          {/* Filters and Actions */}
          <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
            <div className="flex flex-col md:flex-row gap-4 md:items-center">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search departments..."
                  className="pl-8 w-full md:w-[300px]"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
            </div>
            <Button onClick={() => setIsNewDepartmentDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Department
            </Button>
          </div>

          {/* Departments Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-3">ID</th>
                      <th className="px-6 py-3">Department Name</th>
                      <th className="px-6 py-3">Head of Department</th>
                      <th className="px-6 py-3">Staff Count</th>
                      <th className="px-6 py-3">Rooms</th>
                      <th className="px-6 py-3">Description</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentDepartments.map((department) => (
                      <tr key={department.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium">{department.id}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium">{department.name}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{department.head}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{department.staff_count}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{department.rooms}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{department.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(department)}>
                            <Edit size={16} />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(department.id)}>
                            <Trash2 size={16} />
                          </Button>
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
            <div className="text-sm text-gray-500">
              Showing {indexOfFirstDepartment + 1} to{" "}
              {Math.min(indexOfLastDepartment, filteredDepartments.length)} of{" "}
              {filteredDepartments.length} departments
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Department Dialog */}
      <Dialog open={isNewDepartmentDialogOpen} onOpenChange={setIsNewDepartmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Department</DialogTitle>
            <DialogDescription>
              Enter the details for the new department.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={newDepartment.name}
                onChange={handleNewDepartmentChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="head" className="text-right">
                Head of Department
              </Label>
              <Input
                id="head"
                name="head"
                value={newDepartment.head}
                onChange={handleNewDepartmentChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="staff_count" className="text-right">
                Staff Count
              </Label>
              <Input
                id="staff_count"
                name="staff_count"
                type="number"
                value={newDepartment.staff_count}
                onChange={handleNewDepartmentChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rooms" className="text-right">
                Rooms
              </Label>
              <Input
                id="rooms"
                name="rooms"
                type="number"
                value={newDepartment.rooms}
                onChange={handleNewDepartmentChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                name="description"
                value={newDepartment.description}
                onChange={handleNewDepartmentChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewDepartmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNewDepartment}>
              Add Department
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>
              Update the department details.
            </DialogDescription>
          </DialogHeader>
          {departmentToEdit && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={departmentToEdit.name}
                  onChange={handleEditChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-head" className="text-right">
                  Head of Department
                </Label>
                <Input
                  id="edit-head"
                  name="head"
                  value={departmentToEdit.head}
                  onChange={handleEditChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-staff_count" className="text-right">
                  Staff Count
                </Label>
                <Input
                  id="edit-staff_count"
                  name="staff_count"
                  type="number"
                  value={departmentToEdit.staff_count}
                  onChange={handleEditChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-rooms" className="text-right">
                  Rooms
                </Label>
                <Input
                  id="edit-rooms"
                  name="rooms"
                  type="number"
                  value={departmentToEdit.rooms}
                  onChange={handleEditChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">
                  Description
                </Label>
                <Input
                  id="edit-description"
                  name="description"
                  value={departmentToEdit.description}
                  onChange={handleEditChange}
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this department? This action cannot be undone.
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
