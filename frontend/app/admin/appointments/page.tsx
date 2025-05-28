"use client"

import { useState, useEffect } from "react"
import {
  Plus,
  Edit,
  Trash2,
  Filter,
  Search,
  Calendar,
  Clock,
  ChevronDown,
  AlertCircle,
  CheckCircle
} from "lucide-react"
import { appointmentsApi, doctorsApi, patientsApi } from "@/lib/supabase"

// Shared components
import { AdminPageWrapper } from "../page-wrapper"
import { SupabaseSearchableTable } from "@/components/data-display/SupabaseSearchableTable"
import { ConfirmDeleteDialog } from "@/components/dialogs/ConfirmDeleteDialog"

// UI components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/toast-provider"

export default function AppointmentsPage() {
  // State variables
  const [appointments, setAppointments] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All Status")
  const [dateFilter, setDateFilter] = useState("All Dates")
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isNewAppointmentDialogOpen, setIsNewAppointmentDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [appointmentToEdit, setAppointmentToEdit] = useState<any | null>(null)
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null)

  // Toast notifications
  const { showToast } = useToast()

  // New appointment state
  const [newAppointment, setNewAppointment] = useState({
    patient_id: "",
    doctor_id: "",
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: "09:00",
    treatment_description: "",
    status: "Scheduled"
  })

  // Constants
  const appointmentsPerPage = 10
  const statusOptions = ["All Status", "Scheduled", "Completed", "Cancelled", "No-show"]
  const dateOptions = ["All Dates", "Today", "This Week", "This Month"]

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Get appointments data
        const appointmentsData = await appointmentsApi.getAllAppointments()
        setAppointments(appointmentsData)

        // Get doctors data
        const doctorsData = await doctorsApi.getAllDoctors()
        setDoctors(doctorsData)

        // Get patients data
        const patientsData = await patientsApi.getAllPatients()
        setPatients(patientsData)
      } catch (error) {
        console.error('Error fetching data:', error)
        setAppointments([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter appointments based on search term and filters
  const filteredAppointments = appointments.filter((appointment) => {
    // Search filter
    const patientName = appointment.patients?.full_name || ''
    const doctorName = appointment.doctors?.full_name || ''
    const appointmentId = appointment.appointment_id || ''

    const matchesSearch =
      patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (appointmentId && appointmentId.toString().includes(searchTerm))

    // Status filter
    const matchesStatus = statusFilter === "All Status" || appointment.status === statusFilter

    // Date filter
    let matchesDate = true
    const appointmentDate = appointment.appointment_date ? new Date(appointment.appointment_date) : null

    if (appointmentDate && dateFilter !== "All Dates") {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const weekStart = new Date(today)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())

      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

      if (dateFilter === "Today") {
        matchesDate = appointmentDate >= today && appointmentDate < tomorrow
      } else if (dateFilter === "This Week") {
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 7)
        matchesDate = appointmentDate >= weekStart && appointmentDate < weekEnd
      } else if (dateFilter === "This Month") {
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        matchesDate = appointmentDate >= monthStart && appointmentDate <= monthEnd
      }
    }

    return matchesSearch && matchesStatus && matchesDate
  })

  const totalPages = Math.ceil(filteredAppointments.length / appointmentsPerPage)

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

  // Handle new appointment form
  const handleNewAppointmentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewAppointment({
      ...newAppointment,
      [name]: value,
    })
  }

  const handleNewAppointmentSelectChange = (name: string, value: string) => {
    setNewAppointment({
      ...newAppointment,
      [name]: value,
    })
  }

  // Add new appointment
  const handleAddNewAppointment = async () => {
    try {
      // Validate required fields
      if (!newAppointment.patient_id) {
        showToast("Patient is required", undefined, "error")
        return
      }

      if (!newAppointment.doctor_id) {
        showToast("Doctor is required", undefined, "error")
        return
      }

      if (!newAppointment.appointment_date) {
        showToast("Appointment date is required", undefined, "error")
        return
      }

      if (!newAppointment.appointment_time) {
        showToast("Appointment time is required", undefined, "error")
        return
      }

      // Prepare appointment data for Supabase
      const appointmentData = {
        patient_id: newAppointment.patient_id,
        doctor_id: newAppointment.doctor_id,
        appointment_date: newAppointment.appointment_date,
        appointment_time: newAppointment.appointment_time,
        treatment_description: newAppointment.treatment_description,
        status: newAppointment.status
      }

      // Add appointment to database
      const newAppointmentData = await appointmentsApi.addAppointment(appointmentData)

      if (newAppointmentData) {
        // Refresh appointments list
        const updatedAppointments = await appointmentsApi.getAllAppointments()
        setAppointments(updatedAppointments)

        // Show success toast
        showToast("Appointment added successfully", "The appointment has been added to the system.", "success")

        // Reset form and close dialog
        setNewAppointment({
          patient_id: "",
          doctor_id: "",
          appointment_date: new Date().toISOString().split('T')[0],
          appointment_time: "09:00",
          treatment_description: "",
          status: "Scheduled"
        })
        setIsNewAppointmentDialogOpen(false)
      }
    } catch (error) {
      console.error('Error adding appointment:', error)
      showToast("Error adding appointment", error instanceof Error ? error.message : "An unknown error occurred", "error")
    }
  }

  // Delete appointment
  const handleDeleteClick = (appointmentId: string) => {
    setAppointmentToDelete(appointmentId)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (appointmentToDelete) {
      try {
        // Delete from database
        const success = await appointmentsApi.deleteAppointment(appointmentToDelete)

        if (success) {
          // Update UI
          setAppointments(appointments.filter((appointment) => appointment.appointment_id !== appointmentToDelete))

          // Show success toast
          showToast("Appointment deleted successfully", "The appointment has been removed from the system.", "success")
        }
      } catch (error) {
        console.error('Error deleting appointment:', error)
        showToast("Error deleting appointment", error instanceof Error ? error.message : "An unknown error occurred", "error")
      } finally {
        setAppointmentToDelete(null)
        setIsDeleteDialogOpen(false)
      }
    }
  }

  // Edit appointment
  const handleEditClick = (appointment: any) => {
    setAppointmentToEdit({
      ...appointment,
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id,
      appointment_date: appointment.appointment_date,
      appointment_time: appointment.appointment_time,
      treatment_description: appointment.treatment_description || "",
      status: appointment.status
    })
    setIsEditDialogOpen(true)
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setAppointmentToEdit({
      ...appointmentToEdit,
      [name]: value,
    })
  }

  const handleEditSelectChange = (name: string, value: string) => {
    setAppointmentToEdit({
      ...appointmentToEdit,
      [name]: value,
    })
  }

  const handleSaveEdit = async () => {
    try {
      if (appointmentToEdit) {
        // Validate required fields
        if (!appointmentToEdit.patient_id) {
          showToast("Patient is required", undefined, "error")
          return
        }

        if (!appointmentToEdit.doctor_id) {
          showToast("Doctor is required", undefined, "error")
          return
        }

        if (!appointmentToEdit.appointment_date) {
          showToast("Appointment date is required", undefined, "error")
          return
        }

        if (!appointmentToEdit.appointment_time) {
          showToast("Appointment time is required", undefined, "error")
          return
        }

        // Prepare appointment data for Supabase
        const appointmentData = {
          patient_id: appointmentToEdit.patient_id,
          doctor_id: appointmentToEdit.doctor_id,
          appointment_date: appointmentToEdit.appointment_date,
          appointment_time: appointmentToEdit.appointment_time,
          treatment_description: appointmentToEdit.treatment_description,
          status: appointmentToEdit.status
        }

        // Update appointment in database
        const updatedAppointment = await appointmentsApi.updateAppointment(appointmentToEdit.appointment_id, appointmentData)

        if (updatedAppointment) {
          // Refresh appointments list
          const updatedAppointments = await appointmentsApi.getAllAppointments()
          setAppointments(updatedAppointments)

          // Show success toast
          showToast("Appointment updated successfully", "The appointment information has been updated.", "success")

          // Close dialog
          setAppointmentToEdit(null)
          setIsEditDialogOpen(false)
        }
      }
    } catch (error) {
      console.error('Error updating appointment:', error)
      showToast("Error updating appointment", error instanceof Error ? error.message : "An unknown error occurred", "error")
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <AdminPageWrapper title="Appointments" activePage="appointments">
      {/* Supabase Searchable Table */}
      <SupabaseSearchableTable
        type="appointments"
        data={appointments}
        title="Quản lý Cuộc hẹn"
        description="Danh sách tất cả cuộc hẹn trong hệ thống"
        isLoading={isLoading}
        onAdd={() => setIsNewAppointmentDialogOpen(true)}
        addButtonLabel="Thêm Cuộc hẹn"
        onEdit={handleEditClick}
        onDelete={(appointmentId) => handleDeleteClick(appointmentId)}
        searchPlaceholder="Tìm kiếm cuộc hẹn..."
        itemsPerPage={10}
      />

      {/* Add New Appointment Dialog */}
      <Dialog open={isNewAppointmentDialogOpen} onOpenChange={setIsNewAppointmentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Appointment</DialogTitle>
            <DialogDescription>
              Enter the details for the new appointment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="patient_id" className="text-right">
                Patient
              </Label>
              <Select
                value={newAppointment.patient_id}
                onValueChange={(value) => handleNewAppointmentSelectChange("patient_id", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.patient_id} value={patient.patient_id}>
                      {patient.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="doctor_id" className="text-right">
                Doctor
              </Label>
              <Select
                value={newAppointment.doctor_id}
                onValueChange={(value) => handleNewAppointmentSelectChange("doctor_id", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.doctor_id} value={doctor.doctor_id}>
                      {doctor.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="appointment_date" className="text-right">
                Date
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
                Time
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
              <Label htmlFor="treatment_description" className="text-right">
                Treatment
              </Label>
              <Textarea
                id="treatment_description"
                name="treatment_description"
                value={newAppointment.treatment_description}
                onChange={handleNewAppointmentChange}
                className="col-span-3"
                placeholder="Enter treatment description"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select
                value={newAppointment.status}
                onValueChange={(value) => handleNewAppointmentSelectChange("status", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="No-show">No-show</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewAppointmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNewAppointment}>Add Appointment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Appointment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
            <DialogDescription>
              Update the appointment details.
            </DialogDescription>
          </DialogHeader>
          {appointmentToEdit && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="patient_id" className="text-right">
                  Patient
                </Label>
                <Select
                  value={appointmentToEdit.patient_id}
                  onValueChange={(value) => handleEditSelectChange("patient_id", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.patient_id} value={patient.patient_id}>
                        {patient.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="doctor_id" className="text-right">
                  Doctor
                </Label>
                <Select
                  value={appointmentToEdit.doctor_id}
                  onValueChange={(value) => handleEditSelectChange("doctor_id", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.doctor_id} value={doctor.doctor_id}>
                        {doctor.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="appointment_date" className="text-right">
                  Date
                </Label>
                <div className="col-span-3 flex items-center">
                  <Calendar className="mr-2 h-4 w-4 opacity-70" />
                  <Input
                    type="date"
                    id="appointment_date"
                    name="appointment_date"
                    value={appointmentToEdit.appointment_date}
                    onChange={handleEditChange}
                    className="col-span-3"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="appointment_time" className="text-right">
                  Time
                </Label>
                <div className="col-span-3 flex items-center">
                  <Clock className="mr-2 h-4 w-4 opacity-70" />
                  <Input
                    type="time"
                    id="appointment_time"
                    name="appointment_time"
                    value={appointmentToEdit.appointment_time}
                    onChange={handleEditChange}
                    className="col-span-3"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="treatment_description" className="text-right">
                  Treatment
                </Label>
                <Textarea
                  id="treatment_description"
                  name="treatment_description"
                  value={appointmentToEdit.treatment_description}
                  onChange={handleEditChange}
                  className="col-span-3"
                  placeholder="Enter treatment description"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select
                  value={appointmentToEdit.status}
                  onValueChange={(value) => handleEditSelectChange("status", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                    <SelectItem value="No-show">No-show</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Appointment"
        description="Are you sure you want to delete this appointment? This action cannot be undone."
        itemType="appointment"
      />
    </AdminPageWrapper>
  )
}
