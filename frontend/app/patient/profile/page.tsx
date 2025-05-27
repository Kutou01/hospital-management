"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Heart,
  Activity,
  FileText,
  Edit,
  Save,
  X,
  AlertCircle,
  Shield,
  Clock,
  Stethoscope,
  CheckCircle,
  Star
} from "lucide-react"
import { PatientLayout } from "@/components/layout/PatientLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSupabaseAuth } from "@/lib/hooks/useSupabaseAuth"

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  title: string;
  experience: string;
  rating: number;
  reviews: number;
  consultationFee: string;
  nextAvailable: string;
  location: string;
  phone: string;
  email: string;
}

export default function PatientProfile() {
  const { user, loading } = useSupabaseAuth()
  const searchParams = useSearchParams()
  const action = searchParams.get('action')

  const [activeTab, setActiveTab] = useState(action === 'booking' ? 'booking' : 'profile')
  const [isEditing, setIsEditing] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    date_of_birth: "",
    gender: "",
    address: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    blood_type: "",
    allergies: "",
    medical_history: ""
  })

  const [bookingForm, setBookingForm] = useState({
    appointmentDate: '',
    appointmentTime: '',
    reason: '',
    symptoms: '',
    notes: ''
  })

  // Mock doctors data
  const doctors: Doctor[] = [
    {
      id: 1,
      name: 'Dr. Nguyễn Văn An',
      specialty: 'Tim mạch',
      title: 'Trưởng khoa Tim mạch',
      experience: '15 năm',
      rating: 4.9,
      reviews: 285,
      consultationFee: '500.000 VNĐ',
      nextAvailable: 'Thứ 2, 08:30',
      location: 'Phòng 201 - Tầng 2 - Khoa Tim mạch',
      phone: '+84-123-456-789',
      email: 'dr.an@hospital.vn'
    },
    {
      id: 2,
      name: 'Dr. Trần Thị Bình',
      specialty: 'Nhi khoa',
      title: 'Phó Trưởng khoa Nhi',
      experience: '12 năm',
      rating: 4.8,
      reviews: 420,
      consultationFee: '300.000 VNĐ',
      nextAvailable: 'Hôm nay, 14:00',
      location: 'Phòng 105 - Tầng 1 - Khoa Nhi',
      phone: '+84-123-456-790',
      email: 'dr.binh@hospital.vn'
    },
    {
      id: 3,
      name: 'Dr. Lê Minh Cường',
      specialty: 'Thần kinh',
      title: 'Giám đốc Trung tâm Thần kinh',
      experience: '18 năm',
      rating: 4.9,
      reviews: 195,
      consultationFee: '800.000 VNĐ',
      nextAvailable: 'Thứ 3, 09:00',
      location: 'Phòng 301 - Tầng 3 - Trung tâm Thần kinh',
      phone: '+84-123-456-791',
      email: 'dr.cuong@hospital.vn'
    },
    {
      id: 4,
      name: 'Dr. Phạm Thị Dung',
      specialty: 'Phụ khoa',
      title: 'Bác sĩ chuyên khoa II',
      experience: '10 năm',
      rating: 4.7,
      reviews: 312,
      consultationFee: '400.000 VNĐ',
      nextAvailable: 'Thứ 4, 10:30',
      location: 'Phòng 205 - Tầng 2 - Khoa Phụ khoa',
      phone: '+84-123-456-792',
      email: 'dr.dung@hospital.vn'
    },
    {
      id: 5,
      name: 'Dr. Hoàng Đức',
      specialty: 'Chấn thương chỉnh hình',
      title: 'Trưởng khoa Chấn thương Chỉnh hình',
      experience: '14 năm',
      rating: 4.8,
      reviews: 278,
      consultationFee: '600.000 VNĐ',
      nextAvailable: 'Mai, 08:00',
      location: 'Phòng 401 - Tầng 4 - Khoa Chấn thương',
      phone: '+84-123-456-793',
      email: 'dr.duc@hospital.vn'
    },
    {
      id: 6,
      name: 'Dr. Võ Thị Hoa',
      specialty: 'Da liễu',
      title: 'Bác sĩ chuyên khoa I',
      experience: '8 năm',
      rating: 4.6,
      reviews: 156,
      consultationFee: '350.000 VNĐ',
      nextAvailable: 'Thứ 5, 15:00',
      location: 'Phòng 102 - Tầng 1 - Khoa Da liễu',
      phone: '+84-123-456-794',
      email: 'dr.hoa@hospital.vn'
    }
  ]

  // Mock additional patient data
  const patientData = {
    date_of_birth: "1990-05-15",
    gender: "Male",
    address: "123 Nguyễn Văn Cừ, Quận 5, TP.HCM",
    emergency_contact_name: "Nguyễn Thị B",
    emergency_contact_phone: "0987654321",
    blood_type: "O+",
    allergies: "Penicillin, Peanuts",
    medical_history: "Hypertension (2020), Diabetes Type 2 (2021)",
    insurance_info: {
      provider: "Bảo hiểm Y tế Xã hội",
      policy_number: "SV123456789",
      expiry_date: "2024-12-31"
    },
    recent_visits: [
      { date: "2024-01-10", doctor: "Dr. Nguyễn Văn A", reason: "Khám tổng quát" },
      { date: "2023-12-15", doctor: "Dr. Trần Thị B", reason: "Theo dõi huyết áp" },
      { date: "2023-11-20", doctor: "Dr. Lê Văn C", reason: "Khám tim mạch" }
    ]
  }

  // Load doctor info and initialize form
  useEffect(() => {
    // Initialize form data when user data is available
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        phone_number: user.phone_number || "",
        date_of_birth: patientData.date_of_birth,
        gender: patientData.gender,
        address: patientData.address,
        emergency_contact_name: patientData.emergency_contact_name,
        emergency_contact_phone: patientData.emergency_contact_phone,
        blood_type: patientData.blood_type,
        allergies: patientData.allergies,
        medical_history: patientData.medical_history
      })
    }

    // Load selected doctor for booking
    const selectedDoctorId = localStorage.getItem('selectedDoctorId')
    if (selectedDoctorId) {
      const doctor = doctors.find(d => d.id === parseInt(selectedDoctorId))
      if (doctor) {
        setSelectedDoctor(doctor)
      }
    }
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleBookingInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setBookingForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = () => {
    // Here you would typically save the data to your backend
    console.log("Saving profile data:", formData)
    setIsEditing(false)
    // Show success message
  }

  const handleCancel = () => {
    // Reset form data to original values
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        phone_number: user.phone_number || "",
        date_of_birth: patientData.date_of_birth,
        gender: patientData.gender,
        address: patientData.address,
        emergency_contact_name: patientData.emergency_contact_name,
        emergency_contact_phone: patientData.emergency_contact_phone,
        blood_type: patientData.blood_type,
        allergies: patientData.allergies,
        medical_history: patientData.medical_history
      })
    }
    setIsEditing(false)
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDoctor) return

    // Validate required fields
    if (!bookingForm.appointmentDate || !bookingForm.appointmentTime || !bookingForm.reason) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc.')
      return
    }

    setBookingLoading(true)

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Clear selected doctor from localStorage
      localStorage.removeItem('selectedDoctorId')

      setBookingSuccess(true)
      console.log('Booking submitted:', {
        doctorId: selectedDoctor.id,
        patientId: user?.id,
        ...bookingForm
      })
    } catch (error) {
      alert('Không thể đặt lịch khám. Vui lòng thử lại.')
    } finally {
      setBookingLoading(false)
    }
  }

  if (loading) {
    return (
      <PatientLayout title="My Profile" activePage="profile">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PatientLayout>
    )
  }

  if (!user || user.role !== 'patient') {
    return (
      <PatientLayout title="My Profile" activePage="profile">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Access denied. Patient role required.</p>
          </div>
        </div>
      </PatientLayout>
    )
  }

  if (bookingSuccess) {
    return (
      <PatientLayout title="Booking Success" activePage="profile">
        <div className="max-w-2xl mx-auto text-center py-12">
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-700 mb-4">Đặt lịch thành công!</h2>
              <div className="bg-green-50 p-4 rounded-lg mb-6 text-left">
                <p className="text-green-800 mb-2">
                  <strong>Bác sĩ:</strong> {selectedDoctor?.name}
                </p>
                <p className="text-green-800 mb-2">
                  <strong>Chuyên khoa:</strong> {selectedDoctor?.specialty}
                </p>
                <p className="text-green-800 mb-2">
                  <strong>Ngày khám:</strong> {bookingForm.appointmentDate}
                </p>
                <p className="text-green-800 mb-2">
                  <strong>Giờ khám:</strong> {bookingForm.appointmentTime}
                </p>
                <p className="text-green-800 mb-2">
                  <strong>Lý do khám:</strong> {bookingForm.reason}
                </p>
                <p className="text-green-800">
                  <strong>Phí khám:</strong> {selectedDoctor?.consultationFee}
                </p>
              </div>
              <p className="text-gray-600 mb-6">
                Chúng tôi sẽ gọi điện xác nhận lịch hẹn trong vòng 24 giờ tới.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    setBookingSuccess(false)
                    setActiveTab('profile')
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Quay lại hồ sơ
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/doctors'}
                  className="w-full"
                >
                  Đặt lịch khám khác
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PatientLayout>
    )
  }

  return (
    <PatientLayout title="My Profile" activePage="profile">
      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="inline-block w-5 h-5 mr-2" />
              Hồ sơ cá nhân
            </button>
            <button
              onClick={() => setActiveTab('booking')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'booking'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calendar className="inline-block w-5 h-5 mr-2" />
              Đặt lịch khám
            </button>
          </nav>
        </div>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <>
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
                <p className="text-gray-600">Manage your personal and medical information</p>
              </div>
              <div className="flex gap-2">
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button onClick={handleCancel} variant="outline">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">Full Name</Label>
                      {isEditing ? (
                        <Input
                          id="full_name"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleInputChange}
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-900">{formData.full_name}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      {isEditing ? (
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-900">{formData.email}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="phone_number">Phone Number</Label>
                      {isEditing ? (
                        <Input
                          id="phone_number"
                          name="phone_number"
                          value={formData.phone_number}
                          onChange={handleInputChange}
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-900">{formData.phone_number}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="date_of_birth">Date of Birth</Label>
                      {isEditing ? (
                        <Input
                          id="date_of_birth"
                          name="date_of_birth"
                          type="date"
                          value={formData.date_of_birth}
                          onChange={handleInputChange}
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-900">{formData.date_of_birth}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      {isEditing ? (
                        <select
                          id="gender"
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      ) : (
                        <p className="mt-1 text-sm text-gray-900">{formData.gender}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="blood_type">Blood Type</Label>
                      {isEditing ? (
                        <select
                          id="blood_type"
                          name="blood_type"
                          value={formData.blood_type}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Blood Type</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                      ) : (
                        <p className="mt-1 text-sm text-gray-900">{formData.blood_type}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    {isEditing ? (
                      <Textarea
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        rows={2}
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{formData.address}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergency_contact_name">Contact Name</Label>
                      {isEditing ? (
                        <Input
                          id="emergency_contact_name"
                          name="emergency_contact_name"
                          value={formData.emergency_contact_name}
                          onChange={handleInputChange}
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-900">{formData.emergency_contact_name}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                      {isEditing ? (
                        <Input
                          id="emergency_contact_phone"
                          name="emergency_contact_phone"
                          value={formData.emergency_contact_phone}
                          onChange={handleInputChange}
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-900">{formData.emergency_contact_phone}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Medical Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Medical Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="allergies">Allergies</Label>
                    {isEditing ? (
                      <Textarea
                        id="allergies"
                        name="allergies"
                        value={formData.allergies}
                        onChange={handleInputChange}
                        rows={2}
                        placeholder="List any known allergies..."
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{formData.allergies || "No known allergies"}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="medical_history">Medical History</Label>
                    {isEditing ? (
                      <Textarea
                        id="medical_history"
                        name="medical_history"
                        value={formData.medical_history}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Describe your medical history..."
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{formData.medical_history || "No significant medical history"}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Insurance Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Insurance Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Provider</span>
                      <p className="text-sm text-gray-900">{patientData.insurance_info.provider}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Policy Number</span>
                      <p className="text-sm text-gray-900">{patientData.insurance_info.policy_number}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Expiry Date</span>
                      <p className="text-sm text-gray-900">{patientData.insurance_info.expiry_date}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Visits */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Visits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {patientData.recent_visits.map((visit, index) => (
                      <div key={index} className="border-b border-gray-100 pb-2 last:border-b-0">
                        <p className="text-sm font-medium text-gray-900">{visit.date}</p>
                        <p className="text-sm text-gray-600">{visit.doctor}</p>
                        <p className="text-xs text-gray-500">{visit.reason}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Account Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Account Status</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Email Verified</span>
                      <Badge className="bg-green-100 text-green-800">Verified</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Phone Verified</span>
                      <Badge className="bg-green-100 text-green-800">Verified</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Member Since</span>
                      <span className="text-sm text-gray-900">Mar 2023</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Booking Tab */}
      {activeTab === 'booking' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Đặt lịch khám</h2>
            <p className="text-gray-600">Đặt lịch hẹn với bác sĩ chuyên khoa</p>
          </div>

          {/* Selected Doctor */}
          {selectedDoctor && (
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Stethoscope className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{selectedDoctor.name}</h3>
                    <p className="text-gray-600">{selectedDoctor.title}</p>
                    <p className="text-blue-600 font-medium">{selectedDoctor.specialty}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Kinh nghiệm:</span>
                    <span className="font-bold text-gray-900 ml-2">{selectedDoctor.experience}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Đánh giá:</span>
                    <div className="inline-flex items-center ml-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="font-bold text-gray-900 ml-1">{selectedDoctor.rating}</span>
                      <span className="text-gray-500 ml-1">({selectedDoctor.reviews})</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Phí khám:</span>
                    <span className="font-bold text-blue-600 ml-2">{selectedDoctor.consultationFee}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Lịch gần nhất:</span>
                    <span className="font-bold text-green-600 ml-2">{selectedDoctor.nextAvailable}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Booking Form */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin đặt lịch</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBookingSubmit}>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="appointmentDate">Ngày khám *</Label>
                    <Input
                      id="appointmentDate"
                      name="appointmentDate"
                      type="date"
                      value={bookingForm.appointmentDate}
                      onChange={handleBookingInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="appointmentTime">Giờ khám *</Label>
                    <Select
                      value={bookingForm.appointmentTime}
                      onValueChange={(value) => setBookingForm({...bookingForm, appointmentTime: value})}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn giờ khám" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="08:00">08:00</SelectItem>
                        <SelectItem value="08:30">08:30</SelectItem>
                        <SelectItem value="09:00">09:00</SelectItem>
                        <SelectItem value="09:30">09:30</SelectItem>
                        <SelectItem value="10:00">10:00</SelectItem>
                        <SelectItem value="10:30">10:30</SelectItem>
                        <SelectItem value="14:00">14:00</SelectItem>
                        <SelectItem value="14:30">14:30</SelectItem>
                        <SelectItem value="15:00">15:00</SelectItem>
                        <SelectItem value="15:30">15:30</SelectItem>
                        <SelectItem value="16:00">16:00</SelectItem>
                        <SelectItem value="16:30">16:30</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="reason">Lý do khám *</Label>
                    <Input
                      id="reason"
                      name="reason"
                      value={bookingForm.reason}
                      onChange={handleBookingInputChange}
                      placeholder="Ví dụ: Đau tim, khó thở..."
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="symptoms">Triệu chứng</Label>
                    <Textarea
                      id="symptoms"
                      name="symptoms"
                      value={bookingForm.symptoms}
                      onChange={handleBookingInputChange}
                      placeholder="Mô tả chi tiết triệu chứng..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notes">Ghi chú thêm</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={bookingForm.notes}
                      onChange={handleBookingInputChange}
                      placeholder="Thông tin bổ sung (nếu có)..."
                      rows={2}
                    />
                  </div>
                </div>

                <div className="mt-8 flex gap-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 py-3"
                    disabled={!selectedDoctor || bookingLoading}
                  >
                    {bookingLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Đang đặt lịch...
                      </div>
                    ) : (
                      <>
                        <Calendar className="mr-2" size={18} />
                        Xác nhận đặt lịch - {selectedDoctor?.consultationFee}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.location.href = '/doctors'}
                    className="px-8"
                  >
                    Chọn bác sĩ khác
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {!selectedDoctor && (
            <Card className="border-dashed border-2 border-gray-300">
              <CardContent className="p-8 text-center">
                <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa chọn bác sĩ</h3>
                <p className="text-gray-600 mb-4">Vui lòng chọn bác sĩ để đặt lịch khám</p>
                <Button
                  onClick={() => window.location.href = '/doctors'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Chọn bác sĩ
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </PatientLayout>
  )
}