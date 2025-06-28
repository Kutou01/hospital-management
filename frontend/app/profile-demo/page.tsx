"use client"

import { useState } from "react"
import { ProfessionalProfile } from "@/components/profile/ProfessionalProfile"
import { ProfileFeatures } from "@/components/profile/ProfileFeatures"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Mock data for demo
const mockDoctorData = {
  id: "GEN-DOC-202506-480",
  doctor_id: "GEN-DOC-202506-480",
  profile_id: "5bdcbd80-f344-40b7-a46b-3760ca487693",
  full_name: "BS. Nguyễn Văn Đức",
  email: "doctor@hospital.com",
  phone_number: "0901234567",
  role: "doctor" as const,
  specialty: "Tim mạch",
  qualification: "Tiến sĩ Y khoa, Chuyên khoa II Tim mạch, Thạc sĩ Quản lý Y tế",
  license_number: "VN-MAIN-0001",
  bio: "Bác sĩ chuyên khoa Tim mạch với 20 năm kinh nghiệm. Chuyên điều trị các bệnh lý tim mạch phức tạp, can thiệp tim mạch và phẫu thuật tim. Từng tu nghiệp tại Mỹ và có nhiều công trình nghiên cứu quốc tế.",
  experience_years: 20,
  consultation_fee: 800000,
  languages_spoken: ["Vietnamese", "English", "French"],
  rating: 4.8,
  total_reviews: 156,
  department_id: "DEPT001",
  gender: "male",
  address: {
    city: "TP.HCM",
    street: "123 Đường Nguyễn Văn Cừ",
    zipcode: "70000",
    district: "Quận 1"
  },
  avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=NguyenVanDuc"
}

const mockPatientData = {
  id: "PAT-202506-001",
  patient_id: "PAT-202506-001", 
  profile_id: "patient-123",
  full_name: "Nguyễn Thị Lan",
  email: "patient@hospital.com",
  phone_number: "0987654321",
  role: "patient" as const,
  date_of_birth: "1990-05-15",
  gender: "female",
  blood_type: "A+",
  medical_history: "Tiền sử dị ứng với penicillin. Đã phẫu thuật ruột thừa năm 2018. Hiện tại sức khỏe ổn định.",
  allergies: ["Penicillin", "Tôm cua"],
  chronic_conditions: ["Cao huyết áp nhẹ"],
  avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=NguyenThiLan"
}

export default function ProfileDemo() {
  const [currentProfile, setCurrentProfile] = useState<'doctor' | 'patient'>('doctor')
  const [profileData, setProfileData] = useState(mockDoctorData)

  const handleSave = async (formData: any) => {
    console.log('💾 Saving profile data:', formData)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Update local state
    setProfileData(prev => ({ ...prev, ...formData }))
    console.log('✅ Profile saved successfully')
  }

  const handleAvatarUpload = async (file: File): Promise<string> => {
    console.log('📸 Uploading avatar:', file.name)
    // Simulate upload
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Return mock URL
    const mockUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`
    console.log('✅ Avatar uploaded:', mockUrl)
    return mockUrl
  }

  const switchProfile = (type: 'doctor' | 'patient') => {
    setCurrentProfile(type)
    setProfileData(type === 'doctor' ? mockDoctorData : mockPatientData)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🏥 Professional Profile Component Demo
          </h1>
          <p className="text-gray-600 mb-6">
            Trang profile chuyên nghiệp với avatar, thiết kế hiện đại và responsive
          </p>
          
          {/* Profile Type Switcher */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Chọn loại profile để demo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button
                  onClick={() => switchProfile('doctor')}
                  variant={currentProfile === 'doctor' ? 'default' : 'outline'}
                  className="flex items-center gap-2"
                >
                  👨‍⚕️ Bác sĩ
                  {currentProfile === 'doctor' && <Badge variant="secondary">Active</Badge>}
                </Button>
                <Button
                  onClick={() => switchProfile('patient')}
                  variant={currentProfile === 'patient' ? 'default' : 'outline'}
                  className="flex items-center gap-2"
                >
                  🧑‍🤝‍🧑 Bệnh nhân
                  {currentProfile === 'patient' && <Badge variant="secondary">Active</Badge>}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📸</span>
                  <div>
                    <h3 className="font-semibold">Avatar Upload</h3>
                    <p className="text-sm text-gray-600">Tải lên và preview avatar</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">✏️</span>
                  <div>
                    <h3 className="font-semibold">Inline Editing</h3>
                    <p className="text-sm text-gray-600">Chỉnh sửa trực tiếp</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📱</span>
                  <div>
                    <h3 className="font-semibold">Responsive</h3>
                    <p className="text-sm text-gray-600">Tối ưu cho mọi thiết bị</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="demo" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="demo">🎯 Live Demo</TabsTrigger>
            <TabsTrigger value="features">📋 Tính năng</TabsTrigger>
          </TabsList>

          <TabsContent value="demo" className="space-y-6">
            <ProfessionalProfile
              profileData={profileData}
              onSave={handleSave}
              onAvatarUpload={handleAvatarUpload}
              isLoading={false}
            />
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <ProfileFeatures />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500">
          <p>🚀 Hospital Management System - Professional Profile Component</p>
          <p className="text-sm">Thiết kế hiện đại, tối ưu trải nghiệm người dùng</p>
        </div>
      </div>
    </div>
  )
}
