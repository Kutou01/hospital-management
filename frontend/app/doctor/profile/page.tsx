"use client"

import { useState } from "react"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Stethoscope,
  GraduationCap,
  Award,
  Clock,
  Edit,
  Save,
  X,
  AlertCircle
} from "lucide-react"
import { DoctorLayout } from "@/components/layout/DoctorLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useSupabaseAuth } from "@/lib/hooks/useSupabaseAuth"

export default function DoctorProfile() {
  const { user, loading } = useSupabaseAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    specialization: "",
    license_number: "",
    experience_years: "",
    education: "",
    bio: "",
    consultation_fee: "",
    working_hours: ""
  })

  // Mock additional doctor data
  const doctorData = {
    specialization: "Khoa Nội",
    license_number: "MD123456789",
    experience_years: "8",
    education: "Bác sĩ Đa khoa - Đại học Y Hà Nội",
    bio: "Bác sĩ chuyên khoa Nội với 8 năm kinh nghiệm trong điều trị các bệnh lý tim mạch và tiểu đường. Tốt nghiệp loại Giỏi tại Đại học Y Hà Nội.",
    consultation_fee: "500,000",
    working_hours: "8:00 - 17:00 (Thứ 2 - Thứ 6)",
    certifications: [
      "Chứng chỉ Tim mạch học",
      "Chứng chỉ Siêu âm tim",
      "Chứng chỉ Điều trị tiểu đường"
    ],
    achievements: [
      "Bác sĩ xuất sắc năm 2023",
      "Nghiên cứu khoa học về tim mạch",
      "Đào tạo 50+ bác sĩ trẻ"
    ]
  }

  // Initialize form data when user data is available
  useState(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        phone_number: user.phone_number || "",
        specialization: doctorData.specialization,
        license_number: doctorData.license_number,
        experience_years: doctorData.experience_years,
        education: doctorData.education,
        bio: doctorData.bio,
        consultation_fee: doctorData.consultation_fee,
        working_hours: doctorData.working_hours
      })
    }
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        specialization: doctorData.specialization,
        license_number: doctorData.license_number,
        experience_years: doctorData.experience_years,
        education: doctorData.education,
        bio: doctorData.bio,
        consultation_fee: doctorData.consultation_fee,
        working_hours: doctorData.working_hours
      })
    }
    setIsEditing(false)
  }

  if (loading) {
    return (
      <DoctorLayout title="My Profile" activePage="profile">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </DoctorLayout>
    )
  }

  if (!user || user.role !== 'doctor') {
    return (
      <DoctorLayout title="My Profile" activePage="profile">
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
    <DoctorLayout title="My Profile" activePage="profile">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
            <p className="text-gray-600">Manage your professional information</p>
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} className="bg-green-600 hover:bg-green-700">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <>
                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
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
        {/* Basic Information */}
        <div className="lg:col-span-2 space-y-6">
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
                  <Label htmlFor="specialization">Specialization</Label>
                  {isEditing ? (
                    <Input
                      id="specialization"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{formData.specialization}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Professional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="license_number">License Number</Label>
                  {isEditing ? (
                    <Input
                      id="license_number"
                      name="license_number"
                      value={formData.license_number}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{formData.license_number}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="experience_years">Years of Experience</Label>
                  {isEditing ? (
                    <Input
                      id="experience_years"
                      name="experience_years"
                      value={formData.experience_years}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{formData.experience_years} years</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="consultation_fee">Consultation Fee (VND)</Label>
                  {isEditing ? (
                    <Input
                      id="consultation_fee"
                      name="consultation_fee"
                      value={formData.consultation_fee}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{formData.consultation_fee} VND</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="working_hours">Working Hours</Label>
                  {isEditing ? (
                    <Input
                      id="working_hours"
                      name="working_hours"
                      value={formData.working_hours}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{formData.working_hours}</p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="education">Education</Label>
                {isEditing ? (
                  <Input
                    id="education"
                    name="education"
                    value={formData.education}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{formData.education}</p>
                )}
              </div>
              <div>
                <Label htmlFor="bio">Professional Bio</Label>
                {isEditing ? (
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{formData.bio}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Certifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Certifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {doctorData.certifications.map((cert, index) => (
                  <Badge key={index} variant="secondary" className="block w-full text-center py-2">
                    {cert}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {doctorData.achievements.map((achievement, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Award className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{achievement}</span>
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
                  <span className="text-sm text-gray-600">License Verified</span>
                  <Badge className="bg-green-100 text-green-800">Verified</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Member Since</span>
                  <span className="text-sm text-gray-900">Jan 2020</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DoctorLayout>
  )
}
