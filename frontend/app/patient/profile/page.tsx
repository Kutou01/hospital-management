"use client"

import { useState } from "react"
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
  Clock
} from "lucide-react"
import { PatientLayout } from "@/components/layout/PatientLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useSupabaseAuth } from "@/lib/hooks/useSupabaseAuth"

export default function PatientProfile() {
  const { user, loading } = useSupabaseAuth()
  const [isEditing, setIsEditing] = useState(false)
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

  // Initialize form data when user data is available
  useState(() => {
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
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
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

  return (
    <PatientLayout title="My Profile" activePage="profile">
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
                      aria-label="Select gender"
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
                      aria-label="Select blood type"
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
    </PatientLayout>
  )
}
