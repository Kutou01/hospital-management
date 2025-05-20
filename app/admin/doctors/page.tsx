"use client"

import { useState, useEffect } from "react"
import {
  Plus,
  Edit,
  Trash2,
  Filter,
  Search
} from "lucide-react"
import { doctorsApi, departmentsApi } from "@/lib/supabase"

// Shared components
import { AdminLayout } from "@/components/layout/AdminLayout"
import { StatusBadge } from "@/components/data-display/StatusBadge"
import { LoadingIndicator } from "@/components/feedback/LoadingIndicator"
import { ConfirmDeleteDialog } from "@/components/dialogs/ConfirmDeleteDialog"

// UI components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function DoctorsPage() {
  // State variables
  const [doctors, setDoctors] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [specialtyFilter, setSpecialtyFilter] = useState("All Specialties")
  const [currentPage, setCurrentPage] = useState(1)
  const [isNewDoctorDialogOpen, setIsNewDoctorDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [doctorToDelete, setDoctorToDelete] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [doctorToEdit, setDoctorToEdit] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // New doctor state
  const [newDoctor, setNewDoctor] = useState({
    full_name: "",
    specialty: "",
    qualification: "",
    schedule: "Mon-Fri, 09:00-17:00",
    department_id: "",
    license_number: "",
    gender: "Male",
    photo_url: "",
    phone_number: "",
    email: ""
  })

  // Constants
  const doctorsPerPage = 10
  const specialties = [
    "All Specialties",
    "Cardiology",
    "Neurology",
    "Pediatrics",
    "Dermatology",
    "Orthopedics",
    "Gynecology"
  ]

  // Fetch doctors and departments data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Get doctors data
        const doctorsData = await doctorsApi.getAllDoctors()
        setDoctors(doctorsData)

        // Get departments data
        const departmentsData = await departmentsApi.getAllDepartments()
        setDepartments(departmentsData)
      } catch (error) {
        console.error('Error fetching data:', error)
        setDoctors([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter doctors based on search term and specialty filter
  const filteredDoctors = doctors.filter((doctor) => {
    // Search filter
    const matchesSearch =
      (doctor.full_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doctor.doctor_id && doctor.doctor_id.toString().includes(searchTerm)) ||
      (doctor.specialty?.toLowerCase().includes(searchTerm.toLowerCase()))

    // Specialty filter
    const matchesSpecialty = specialtyFilter === "All Specialties" || doctor.specialty === specialtyFilter

    return matchesSearch && matchesSpecialty
  })

  const totalPages = Math.ceil(filteredDoctors.length / doctorsPerPage)

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1) // Reset to first page when searching
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

  // Handle new doctor form
  const handleNewDoctorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewDoctor({
      ...newDoctor,
      [name]: value,
    })
  }

  const handleNewDoctorSelectChange = (name: string, value: string) => {
    setNewDoctor({
      ...newDoctor,
      [name]: value,
    })
  }

  // State for error message
  const [errorMessage, setErrorMessage] = useState("")

  // Add new doctor
  const handleAddNewDoctor = async () => {
    setErrorMessage("") // Clear previous errors

    // Validate required fields
    if (!newDoctor.full_name) {
      setErrorMessage("Full name is required")
      return
    }

    if (!newDoctor.department_id) {
      setErrorMessage("Department is required")
      return
    }

    try {
      // Prepare doctor data for Supabase
      const doctorData = {
        full_name: newDoctor.full_name,
        specialty: newDoctor.specialty,
        qualification: newDoctor.qualification,
        schedule: newDoctor.schedule,
        department_id: newDoctor.department_id,
        license_number: newDoctor.license_number,
        gender: newDoctor.gender,
        photo_url: newDoctor.photo_url,
        phone_number: newDoctor.phone_number,
        email: newDoctor.email
      }

      // Add doctor to database
      const { data: newDoctorData, error } = await doctorsApi.addDoctor(doctorData)

      if (error) {
        // Handle specific errors
        if (error.code === '23505' && error.details?.includes('license_number')) {
          setErrorMessage("License number already exists")
        } else if (error.code === '23503' && error.details?.includes('department_id')) {
          setErrorMessage("Invalid department selected")
        } else if (error.code === '23514' && error.details?.includes('doctors_doctor_id_check')) {
          setErrorMessage("Invalid doctor ID format. It must be 'DOC' followed by 6 digits.")
        } else {
          setErrorMessage(`Error adding doctor: ${error.message}`)
        }
        return // Don't close dialog or reset form on error
      }

      if (newDoctorData) {
        // Refresh doctors list
        const updatedDoctors = await doctorsApi.getAllDoctors()
        setDoctors(updatedDoctors)

        // Reset form
        setNewDoctor({
          full_name: "",
          specialty: "",
          qualification: "",
          schedule: "Mon-Fri, 09:00-17:00",
          department_id: "",
          license_number: "",
          gender: "Male",
          photo_url: "",
          phone_number: "",
          email: ""
        })

        // Close dialog
        setIsNewDoctorDialogOpen(false)
      }
    } catch (error) {
      console.error('Error adding doctor:', error)
      setErrorMessage(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Delete doctor
  const handleDeleteClick = (doctorId: string) => {
    setDoctorToDelete(doctorId)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (doctorToDelete) {
      try {
        // Delete from database
        const success = await doctorsApi.deleteDoctor(doctorToDelete)

        if (success) {
          // Update UI
          setDoctors(doctors.filter((doctor) => doctor.doctor_id !== doctorToDelete))
        }
      } catch (error) {
        console.error('Error deleting doctor:', error)
      } finally {
        setDoctorToDelete(null)
        setIsDeleteDialogOpen(false)
      }
    }
  }

  // Edit doctor
  const handleEditClick = (doctor: any) => {
    setDoctorToEdit({
      ...doctor,
    })
    setIsEditDialogOpen(true)
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setDoctorToEdit({
      ...doctorToEdit,
      [name]: value,
    })
  }

  const handleEditSelectChange = (name: string, value: string) => {
    setDoctorToEdit({
      ...doctorToEdit,
      [name]: value,
    })
  }

  // State for edit error message
  const [editErrorMessage, setEditErrorMessage] = useState("")

  const handleSaveEdit = async () => {
    setEditErrorMessage("") // Clear previous errors

    // Validate required fields
    if (!doctorToEdit?.full_name) {
      setEditErrorMessage("Full name is required")
      return
    }

    if (!doctorToEdit?.department_id) {
      setEditErrorMessage("Department is required")
      return
    }

    try {
      if (doctorToEdit) {
        // Prepare doctor data for Supabase
        const doctorData = {
          full_name: doctorToEdit.full_name,
          specialty: doctorToEdit.specialty,
          qualification: doctorToEdit.qualification,
          schedule: doctorToEdit.schedule,
          department_id: doctorToEdit.department_id,
          license_number: doctorToEdit.license_number,
          gender: doctorToEdit.gender,
          photo_url: doctorToEdit.photo_url,
          phone_number: doctorToEdit.phone_number,
          email: doctorToEdit.email
        }

        // Update doctor in database
        const { data: updatedDoctor, error } = await doctorsApi.updateDoctor(doctorToEdit.doctor_id, doctorData)

        if (error) {
          // Handle specific errors
          if (error.code === '23505' && error.details?.includes('license_number')) {
            setEditErrorMessage("License number already exists")
          } else if (error.code === '23503' && error.details?.includes('department_id')) {
            setEditErrorMessage("Invalid department selected")
          } else if (error.code === '23514' && error.details?.includes('doctors_doctor_id_check')) {
            setEditErrorMessage("Invalid doctor ID format. It must be 'DOC' followed by 6 digits.")
          } else {
            setEditErrorMessage(`Error updating doctor: ${error.message}`)
          }
          return // Don't close dialog or reset form on error
        }

        if (updatedDoctor) {
          // Refresh doctors list
          const updatedDoctors = await doctorsApi.getAllDoctors()
          setDoctors(updatedDoctors)

          // Close dialog
          setIsEditDialogOpen(false)
        }
      }
    } catch (error) {
      console.error('Error updating doctor:', error)
    } finally {
      setDoctorToEdit(null)
      setIsEditDialogOpen(false)
    }
  }

  return (
    <AdminLayout title="Doctors" activePage="doctors">
      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
        <div className="flex flex-col md:flex-row gap-4 md:items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search doctors..."
              className="pl-8 w-full md:w-[300px]"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>

          <Select value={specialtyFilter} onValueChange={(value) => setSpecialtyFilter(value)}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Specialty" />
            </SelectTrigger>
            <SelectContent>
              {specialties.map((specialty) => (
                <SelectItem key={specialty} value={specialty}>
                  {specialty}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setIsNewDoctorDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Doctor
        </Button>
      </div>

      {/* Doctors Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingIndicator size="medium" text="Loading doctors..." fullWidth={true} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Doctor</th>
                    <th className="px-6 py-3">ID</th>
                    <th className="px-6 py-3">Specialty</th>
                    <th className="px-6 py-3 hidden md:table-cell">Qualification</th>
                    <th className="px-6 py-3 hidden md:table-cell">Department</th>
                    <th className="px-6 py-3">Gender</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDoctors.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        No doctors found
                      </td>
                    </tr>
                  ) : (
                    filteredDoctors
                      .slice((currentPage - 1) * doctorsPerPage, currentPage * doctorsPerPage)
                      .map((doctor) => (
                        <tr key={doctor.doctor_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-3">
                                <AvatarImage src={doctor.photo_url || "/placeholder.svg"} alt={doctor.full_name} />
                                <AvatarFallback>{doctor.full_name?.charAt(0) || 'D'}</AvatarFallback>
                              </Avatar>
                              <div className="text-sm font-medium text-gray-900">{doctor.full_name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {doctor.doctor_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {doctor.specialty}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                            {doctor.qualification}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                            {doctor.departments?.department_name ||
                             departments.find(dept => dept.department_id === doctor.department_id)?.department_name ||
                             'No Department'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={doctor.gender} type="gender" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button variant="ghost" size="sm" onClick={() => handleEditClick(doctor)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(doctor.doctor_id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">{filteredDoctors.length > 0 ? (currentPage - 1) * doctorsPerPage + 1 : 0}</span> to{" "}
          <span className="font-medium">{Math.min(currentPage * doctorsPerPage, filteredDoctors.length)}</span> of{" "}
          <span className="font-medium">{filteredDoctors.length}</span> doctors
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages || totalPages === 0}>
            Next
          </Button>
        </div>
      </div>

      {/* Add New Doctor Dialog */}
      <Dialog
        open={isNewDoctorDialogOpen}
        onOpenChange={(open) => {
          if (!open) setErrorMessage("");
          setIsNewDoctorDialogOpen(open);
        }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Doctor</DialogTitle>
            <DialogDescription>
              Enter the details for the new doctor.
            </DialogDescription>
          </DialogHeader>
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm">
              {errorMessage}
            </div>
          )}
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="full_name" className="text-right">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="full_name"
                name="full_name"
                value={newDoctor.full_name}
                onChange={handleNewDoctorChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="specialty" className="text-right">
                Specialty
              </Label>
              <Select
                value={newDoctor.specialty}
                onValueChange={(value) => handleNewDoctorSelectChange("specialty", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select specialty" />
                </SelectTrigger>
                <SelectContent>
                  {specialties.slice(1).map((specialty) => (
                    <SelectItem key={specialty} value={specialty}>
                      {specialty}
                    </SelectItem>
                  ))}
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
                value={newDoctor.qualification}
                onChange={handleNewDoctorChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department_id" className="text-right">
                Department <span className="text-red-500">*</span>
              </Label>
              <Select
                value={newDoctor.department_id}
                onValueChange={(value) => handleNewDoctorSelectChange("department_id", value)}
                required
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department.department_id} value={department.department_id}>
                      {department.department_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="license_number" className="text-right">
                License Number
              </Label>
              <Input
                id="license_number"
                name="license_number"
                value={newDoctor.license_number}
                onChange={handleNewDoctorChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="gender" className="text-right">
                Gender
              </Label>
              <Select
                value={newDoctor.gender}
                onValueChange={(value) => handleNewDoctorSelectChange("gender", value)}
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone_number" className="text-right">
                Phone Number
              </Label>
              <Input
                id="phone_number"
                name="phone_number"
                value={newDoctor.phone_number}
                onChange={handleNewDoctorChange}
                className="col-span-3"
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
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setErrorMessage("");
              setIsNewDoctorDialogOpen(false);
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddNewDoctor} type="submit">Add Doctor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Doctor Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) setEditErrorMessage("");
          setIsEditDialogOpen(open);
        }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Doctor</DialogTitle>
            <DialogDescription>
              Update the doctor details.
            </DialogDescription>
          </DialogHeader>
          {editErrorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm">
              {editErrorMessage}
            </div>
          )}
          {doctorToEdit && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="full_name" className="text-right">
                  Full Name <span className="text-red-500">*</span>
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
                  onValueChange={(value) => handleEditSelectChange("specialty", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.slice(1).map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>
                        {specialty}
                      </SelectItem>
                    ))}
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
                <Label htmlFor="department_id" className="text-right">
                  Department <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={doctorToEdit.department_id}
                  onValueChange={(value) => handleEditSelectChange("department_id", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((department) => (
                      <SelectItem key={department.department_id} value={department.department_id}>
                        {department.department_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="license_number" className="text-right">
                  License Number
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
                <Label htmlFor="gender" className="text-right">
                  Gender
                </Label>
                <Select
                  value={doctorToEdit.gender}
                  onValueChange={(value) => handleEditSelectChange("gender", value)}
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
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone_number" className="text-right">
                  Phone Number
                </Label>
                <Input
                  id="phone_number"
                  name="phone_number"
                  value={doctorToEdit.phone_number}
                  onChange={handleEditChange}
                  className="col-span-3"
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
                  value={doctorToEdit.email}
                  onChange={handleEditChange}
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditErrorMessage("");
              setIsEditDialogOpen(false);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} type="submit">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Doctor"
        description="Are you sure you want to delete this doctor? This action cannot be undone."
        itemType="doctor"
      />
    </AdminLayout>
  )
}
