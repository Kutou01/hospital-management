"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { departmentsApi } from "@/lib/supabase"
import ClientOnly from "@/components/client-only"
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
  const [isLoading, setIsLoading] = useState(true)

  // Sample departments data for fallback
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

  const [departments, setDepartments] = useState<any[]>([])

  // Lấy dữ liệu phòng ban từ Supabase khi component được tải
  useEffect(() => {
    const fetchDepartments = async () => {
      setIsLoading(true);
      try {
        const data = await departmentsApi.getAllDepartments();

        // Transform data to match the UI format if needed
        const formattedData = data.map(dept => ({
          id: `DEP${String(dept.department_id).padStart(3, '0')}`,
          name: dept.department_name,
          head: dept.head_doctor,
          staff_count: 0, // This might need to be calculated or fetched
          rooms: 0, // This might need to be calculated or fetched
          description: dept.description || '',
          // Keep original data
          department_id: dept.department_id,
          department_name: dept.department_name,
          head_doctor: dept.head_doctor,
          location: dept.location
        }));

        setDepartments(formattedData);
      } catch (error) {
        console.error('Error fetching departments:', error);
        // Sử dụng dữ liệu mẫu nếu có lỗi khi lấy dữ liệu từ Supabase
        setDepartments(departmentsData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartments();
  }, []);
  const [newDepartment, setNewDepartment] = useState({
    department_id: 0,
    department_name: "",
    head_doctor: "",
    location: "",
    description: ""
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

  const handleAddNewDepartment = async () => {
    try {
      // Prepare department data for API
      const departmentData = {
        department_name: newDepartment.department_name,
        head_doctor: newDepartment.head_doctor,
        location: newDepartment.location,
        description: newDepartment.description
      };

      // Add department to database
      const newDepartmentData = await departmentsApi.addDepartment(departmentData);

      if (newDepartmentData) {
        // Format for UI display
        const departmentWithId = {
          id: `DEP${String(newDepartmentData.department_id).padStart(3, '0')}`,
          name: newDepartmentData.department_name,
          head: newDepartmentData.head_doctor,
          staff_count: 0,
          rooms: 0,
          description: newDepartmentData.description || '',
          // Store the original data
          department_id: newDepartmentData.department_id,
          department_name: newDepartmentData.department_name,
          head_doctor: newDepartmentData.head_doctor,
          location: newDepartmentData.location
        };

        // Update state with new department
        setDepartments([...departments, departmentWithId]);
        console.log('Department added successfully!');
      }
    } catch (error) {
      console.error('Error adding department:', error);
    }

    // Reset form and close dialog
    setNewDepartment({
      department_id: 0,
      department_name: "",
      head_doctor: "",
      location: "",
      description: ""
    });
    setIsNewDepartmentDialogOpen(false);
  }

  // Handle delete department
  const handleDeleteClick = (id: string) => {
    setDepartmentToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (departmentToDelete) {
      try {
        // Find the department to get its ID
        const departmentToRemove = departments.find(dept => dept.id === departmentToDelete);

        if (departmentToRemove) {
          // Delete from database
          const success = await departmentsApi.deleteDepartment(departmentToRemove.department_id);

          if (success) {
            // Update state if deletion was successful
            setDepartments(departments.filter((dept) => dept.id !== departmentToDelete));
            console.log('Department deleted successfully!');
          }
        }
      } catch (error) {
        console.error('Error deleting department:', error);
      }

      // Reset state and close dialog
      setDepartmentToDelete(null);
      setIsDeleteDialogOpen(false);
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

  const handleSaveEdit = async () => {
    if (departmentToEdit) {
      try {
        // Prepare update data
        const updates = {
          department_name: departmentToEdit.name,
          head_doctor: departmentToEdit.head,
          location: departmentToEdit.location,
          description: departmentToEdit.description
        };

        // Update in database
        const updatedDepartment = await departmentsApi.updateDepartment(departmentToEdit.department_id, updates);

        if (updatedDepartment) {
          // Update state with edited department
          setDepartments(
            departments.map((dept) => (dept.id === departmentToEdit.id ? {
              ...dept,
              name: updatedDepartment.department_name,
              head: updatedDepartment.head_doctor,
              description: updatedDepartment.description,
              department_name: updatedDepartment.department_name,
              head_doctor: updatedDepartment.head_doctor,
              location: updatedDepartment.location
            } : dept))
          );
          console.log('Department updated successfully!');
        }
      } catch (error) {
        console.error('Error updating department:', error);
      }
    }

    // Reset state and close dialog
    setDepartmentToEdit(null);
    setIsEditDialogOpen(false);
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
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center">
                          <div className="flex justify-center items-center space-x-2">
                            <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Đang tải dữ liệu...</span>
                          </div>
                        </td>
                      </tr>
                    ) : departments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center">
                          <div className="text-gray-500">Không có dữ liệu phòng ban</div>
                        </td>
                      </tr>
                    ) : (
                      currentDepartments.map((department) => (
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
                    )))}
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
              <Label htmlFor="department_id" className="text-right">
                Department ID
              </Label>
              <Input
                id="department_id"
                name="department_id"
                type="number"
                value={newDepartment.department_id}
                onChange={handleNewDepartmentChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department_name" className="text-right">
                Department Name
              </Label>
              <Input
                id="department_name"
                name="department_name"
                value={newDepartment.department_name}
                onChange={handleNewDepartmentChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="head_doctor" className="text-right">
                Head Doctor
              </Label>
              <Input
                id="head_doctor"
                name="head_doctor"
                value={newDepartment.head_doctor}
                onChange={handleNewDepartmentChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Location
              </Label>
              <Input
                id="location"
                name="location"
                value={newDepartment.location}
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
    </ClientOnly>
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
