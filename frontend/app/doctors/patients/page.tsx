"use client"

import { useState, useEffect } from "react"
import {
  Users,
  Search,
  Filter,
  Eye,
  Phone,
  Mail,
  Calendar,
  Heart,
  FileText,
  AlertCircle,
  User,
  MapPin,
  Clock
} from "lucide-react"
import { DoctorLayout } from "@/components/layout/UniversalLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useEnhancedAuth } from "@/lib/auth/enhanced-auth-context"
import { patientsApi } from "@/lib/api/patients"
import { doctorsApi } from "@/lib/api/doctors"
import { toast } from "sonner"

interface Patient {
  patient_id: string
  full_name: string
  email?: string
  phone_number?: string
  date_of_birth?: string
  gender?: string
  blood_type?: string
  address?: any
  status: string
  created_at: string
  updated_at: string
  age?: number
  lastVisit?: string
  nextAppointment?: string
  condition?: string
  riskLevel?: string
  totalVisits?: number
}

export default function DoctorPatients() {
  const { user, loading } = useEnhancedAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoadingPatients, setIsLoadingPatients] = useState(true)

  // Fetch patients when user is available
  useEffect(() => {
    if (user && user.role === 'doctor') {
      fetchPatients()
    }
  }, [user])

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }

  const fetchPatients = async () => {
    try {
      setIsLoadingPatients(true)
      const response = await patientsApi.getAll()

      if (response.success && response.data) {
        // Transform the data to match our interface and add calculated fields
        const transformedPatients: Patient[] = response.data.map((patient: any) => ({
          ...patient,
          age: patient.date_of_birth ? calculateAge(patient.date_of_birth) : undefined,
          // These would come from appointments/medical records in a real system
          lastVisit: undefined,
          nextAppointment: undefined,
          condition: 'General',
          riskLevel: 'low',
          totalVisits: 0
        }))

        setPatients(transformedPatients)
      } else {
        toast.error('Không thể tải danh sách bệnh nhân')
        setPatients([])
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
      toast.error('Lỗi khi tải danh sách bệnh nhân')
      setPatients([])
    } finally {
      setIsLoadingPatients(false)
    }
  }

  // Mock patients data for reference (remove this when API is working)
  const mockPatients = [
    {
      id: "1",
      name: "Nguyễn Văn A",
      email: "nguyenvana@email.com",
      phone: "0123456789",
      age: 35,
      gender: "Male",
      bloodType: "O+",
      address: "123 Nguyễn Văn Cừ, Q.5, TP.HCM",
      lastVisit: "2024-01-10",
      nextAppointment: "2024-01-20",
      status: "active",
      condition: "Hypertension",
      riskLevel: "medium",
      totalVisits: 8,
      avatar: null
    },
    {
      id: "2",
      name: "Trần Thị B",
      email: "tranthib@email.com",
      phone: "0987654321",
      age: 28,
      gender: "Female",
      bloodType: "A+",
      address: "456 Lê Văn Sỹ, Q.3, TP.HCM",
      lastVisit: "2024-01-08",
      nextAppointment: "2024-01-25",
      status: "active",
      condition: "Diabetes Type 2",
      riskLevel: "high",
      totalVisits: 12,
      avatar: null
    },
    {
      id: "3",
      name: "Lê Văn C",
      email: "levanc@email.com",
      phone: "0369852147",
      age: 42,
      gender: "Male",
      bloodType: "B+",
      address: "789 Võ Văn Tần, Q.1, TP.HCM",
      lastVisit: "2024-01-05",
      nextAppointment: null,
      status: "inactive",
      condition: "Healthy",
      riskLevel: "low",
      totalVisits: 3,
      avatar: null
    },
    {
      id: "4",
      name: "Phạm Thị D",
      email: "phamthid@email.com",
      phone: "0741852963",
      age: 55,
      gender: "Female",
      bloodType: "AB+",
      address: "321 Điện Biên Phủ, Q.Bình Thạnh, TP.HCM",
      lastVisit: "2024-01-12",
      nextAppointment: "2024-01-18",
      status: "active",
      condition: "Arthritis",
      riskLevel: "medium",
      totalVisits: 15,
      avatar: null
    },
    {
      id: "5",
      name: "Hoàng Văn E",
      email: "hoangvane@email.com",
      phone: "0852963741",
      age: 67,
      gender: "Male",
      bloodType: "O-",
      address: "654 Cách Mạng Tháng 8, Q.10, TP.HCM",
      lastVisit: "2024-01-15",
      nextAppointment: "2024-01-22",
      status: "active",
      condition: "Heart Disease",
      riskLevel: "high",
      totalVisits: 25,
      avatar: null
    }
  ]

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'high':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (patient.condition && patient.condition.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesFilter = filterStatus === "all" || patient.status === filterStatus
    return matchesSearch && matchesFilter
  })

  if (loading || isLoadingPatients) {
    return (
      <DoctorLayout title="My Patients" activePage="patients">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </DoctorLayout>
    )
  }

  if (!user || user.role !== 'doctor') {
    return (
      <DoctorLayout title="My Patients" activePage="patients">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Access denied. Doctor role required.</p>
          </div>
        </div>
      </DoctorLayout>
    )
  }

  return (
    <DoctorLayout title="My Patients" activePage="patients">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Patients</h2>
            <p className="text-gray-600">Manage your patient records and information</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search patients by name, email, or condition..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            aria-label="Filter patients by status"
          >
            <option value="all">All Patients</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Patients</p>
                <p className="text-xl font-bold">{patients.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Heart className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Patients</p>
                <p className="text-xl font-bold">
                  {patients.filter(p => p.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">High Risk</p>
                <p className="text-xl font-bold">
                  {patients.filter(p => p.riskLevel === 'high').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Upcoming Appointments</p>
                <p className="text-xl font-bold">
                  {patients.filter(p => p.nextAppointment).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patients List */}
      <div className="space-y-4">
        {filteredPatients.map((patient) => (
          <Card key={patient.patient_id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-4 flex-1">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {patient.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{patient.full_name}</h3>
                      <Badge className={getStatusColor(patient.status)}>
                        {patient.status}
                      </Badge>
                      {patient.riskLevel && (
                        <Badge className={getRiskLevelColor(patient.riskLevel)}>
                          {patient.riskLevel} risk
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                      {patient.age && patient.gender && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{patient.age} years, {patient.gender}</span>
                        </div>
                      )}
                      {patient.phone_number && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{patient.phone_number}</span>
                        </div>
                      )}
                      {patient.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{patient.email}</span>
                        </div>
                      )}
                      {patient.blood_type && (
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">Blood Type: {patient.blood_type}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-3">
                      {patient.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            {typeof patient.address === 'string' ? patient.address : 'Address available'}
                          </span>
                        </div>
                      )}
                      {patient.lastVisit && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">Last visit: {patient.lastVisit}</span>
                        </div>
                      )}
                      {patient.nextAppointment && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">Next: {patient.nextAppointment}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      {patient.condition && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Condition: </span>
                          <span className="text-gray-900">{patient.condition}</span>
                        </div>
                      )}
                      {patient.totalVisits !== undefined && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Total Visits: </span>
                          <span className="text-gray-900">{patient.totalVisits}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View Profile
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-1" />
                    Medical Records
                  </Button>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    <Calendar className="h-4 w-4 mr-1" />
                    Schedule
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredPatients.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterStatus !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "You don't have any patients assigned yet"
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DoctorLayout>
  )
}