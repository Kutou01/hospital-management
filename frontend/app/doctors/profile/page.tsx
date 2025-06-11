"use client"

import { useState, useEffect } from "react"
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
import { DoctorLayout } from "@/components/layout/UniversalLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth/auth-wrapper"
import { doctorsApi } from "@/lib/api/doctors"
import { useToast } from "@/components/ui/toast-provider"

export default function DoctorProfile() {
  const { user, loading: authLoading } = useAuth()
  const { showToast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [doctorProfile, setDoctorProfile] = useState<any>(null)
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    specialty: "",
    license_number: "",
    qualification: "",
    bio: "",
    consultation_fee: "",
    working_hours: ""
  })

  // Fetch doctor profile data
  useEffect(() => {
    const fetchDoctorProfile = async () => {
      if (!user?.id) {
        console.log('🔍 [DoctorProfile] No user ID found:', user)
        setLoading(false)
        return
      }

      try {
        // Use Supabase directly to find doctor by profile_id
        console.log('🔍 [DoctorProfile] Finding doctor by profile_id:', user.id)

        // Import supabase client
        const { supabaseClient } = await import('../../../lib/supabase-client')

        // Query doctors table directly
        const { data: doctorData, error: doctorError } = await supabaseClient
          .from('doctors')
          .select('*')
          .eq('profile_id', user.id)
          .single()

        if (doctorError || !doctorData) {
          console.error('❌ [DoctorProfile] Failed to fetch doctor by profile_id:', doctorError)
          showToast('Không tìm thấy thông tin bác sĩ', undefined, 'error')
          setLoading(false)
          return
        }

        console.log('✅ [DoctorProfile] Found doctor:', doctorData)

        // Now fetch the complete profile using the frontend API
        const response = await fetch(`/api/doctors/${doctorData.doctor_id}/profile`)
        const profileResult = await response.json()

        if (response.ok && profileResult.success && profileResult.data) {
          console.log('✅ [DoctorProfile] Profile data received:', profileResult.data)
          setDoctorProfile(profileResult.data)

          // Initialize form data with real data
          setFormData({
            full_name: profileResult.data.doctor?.full_name || doctorData.full_name || "",
            email: profileResult.data.doctor?.email || doctorData.email || "",
            phone_number: profileResult.data.doctor?.phone_number || doctorData.phone_number || "",
            specialty: profileResult.data.doctor?.specialty || profileResult.data.doctor?.specialization || doctorData.specialization || "",
            license_number: profileResult.data.doctor?.license_number || doctorData.license_number || "",
            qualification: profileResult.data.doctor?.qualification || doctorData.qualification || "",
            bio: profileResult.data.doctor?.bio || doctorData.bio || "",
            consultation_fee: profileResult.data.doctor?.consultation_fee || doctorData.consultation_fee || "",
            working_hours: profileResult.data.doctor?.working_hours || doctorData.working_hours || ""
          })
        } else {
          console.error('❌ [DoctorProfile] Failed to fetch profile:', profileResult.error || 'API Error')
          showToast('Không thể tải thông tin hồ sơ', undefined, 'error')
        }
      } catch (error) {
        console.error('❌ [DoctorProfile] Error fetching profile:', error)
        showToast('Lỗi khi tải thông tin hồ sơ', undefined, 'error')
      } finally {
        setLoading(false)
      }
    }

    if (user && !authLoading) {
      fetchDoctorProfile()
    }
  }, [user, authLoading])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    if (!doctorProfile?.doctor_id) {
      showToast('Không tìm thấy ID bác sĩ', undefined, 'error')
      return
    }

    try {
      console.log('💾 [DoctorProfile] Saving profile data:', formData)
      const response = await doctorsApi.update(doctorProfile.doctor_id, formData)

      if (response.success) {
        console.log('✅ [DoctorProfile] Profile updated successfully')
        showToast('Cập nhật hồ sơ thành công!', undefined, 'success')
        setIsEditing(false)

        // Refresh profile data
        const updatedResponse = await doctorsApi.getProfile(doctorProfile.doctor_id)
        if (updatedResponse.success && updatedResponse.data) {
          setDoctorProfile(updatedResponse.data)
        }
      } else {
        console.error('❌ [DoctorProfile] Failed to update profile:', response.error)
        showToast('Không thể cập nhật hồ sơ', undefined, 'error')
      }
    } catch (error) {
      console.error('❌ [DoctorProfile] Error updating profile:', error)
      showToast('Lỗi khi cập nhật hồ sơ', undefined, 'error')
    }
  }

  const handleCancel = () => {
    // Reset form data to original values
    if (doctorProfile) {
      setFormData({
        full_name: doctorProfile.full_name || "",
        email: doctorProfile.email || "",
        phone_number: doctorProfile.phone_number || "",
        specialty: doctorProfile.specialty || "",
        license_number: doctorProfile.license_number || "",
        qualification: doctorProfile.qualification || "",
        bio: doctorProfile.bio || "",
        consultation_fee: doctorProfile.consultation_fee || "",
        working_hours: doctorProfile.working_hours || ""
      })
    }
    setIsEditing(false)
  }

  if (authLoading || loading) {
    return (
      <DoctorLayout title="My Profile" activePage="profile">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải thông tin hồ sơ...</p>
          </div>
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
            <p className="text-gray-600">Truy cập bị từ chối. Yêu cầu quyền bác sĩ.</p>
          </div>
        </div>
      </DoctorLayout>
    )
  }

  if (!doctorProfile && !loading) {
    return (
      <DoctorLayout title="My Profile" activePage="profile">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-600">Không tìm thấy thông tin bác sĩ trong hệ thống.</p>
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
                  <Label htmlFor="specialty">Specialization</Label>
                  {isEditing ? (
                    <Input
                      id="specialty"
                      name="specialty"
                      value={formData.specialty}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{formData.specialty}</p>
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
                  <Label htmlFor="qualification">Qualification</Label>
                  {isEditing ? (
                    <Input
                      id="qualification"
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{formData.qualification}</p>
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
                      value={typeof formData.working_hours === 'object' ? JSON.stringify(formData.working_hours) : formData.working_hours || ''}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <div className="mt-1 text-sm text-gray-900">
                      {formData.working_hours ? (
                        typeof formData.working_hours === 'object' ? (
                          <div className="space-y-1">
                            {Object.entries(formData.working_hours).map(([day, hours]) => (
                              <div key={day} className="flex justify-between">
                                <span className="capitalize">{day}:</span>
                                <span>
                                  {typeof hours === 'object' && hours !== null ? (
                                    // Handle time range objects with start/end properties
                                    (hours as any).start && (hours as any).end ?
                                      `${(hours as any).start} - ${(hours as any).end}` :
                                      JSON.stringify(hours)
                                  ) : (
                                    String(hours)
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          String(formData.working_hours)
                        )
                      ) : (
                        'Chưa có thông tin'
                      )}
                    </div>
                  )}
                </div>
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
                  <p className="mt-1 text-sm text-gray-900">{formData.bio || 'Chưa có thông tin'}</p>
                )}
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Department Info */}
          {doctorProfile?.departments && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Department
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{doctorProfile.departments.department_name}</p>
                  {doctorProfile.departments.description && (
                    <p className="text-sm text-gray-600">{doctorProfile.departments.description}</p>
                  )}
                  {doctorProfile.departments.location && (
                    <p className="text-sm text-gray-500">📍 {doctorProfile.departments.location}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Experience */}
          {doctorProfile?.experiences && doctorProfile.experiences.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Experience
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {doctorProfile.experiences.slice(0, 3).map((exp: any, index: number) => (
                    <div key={index} className="border-l-2 border-green-200 pl-3">
                      <p className="font-medium text-sm">{exp.position}</p>
                      <p className="text-sm text-gray-600">{exp.institution_name}</p>
                      <p className="text-xs text-gray-500">
                        {exp.start_date} - {exp.end_date || 'Present'}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Review Stats */}
          {doctorProfile?.review_stats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Average Rating</span>
                    <span className="font-medium">{doctorProfile.review_stats.average_rating || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Reviews</span>
                    <span className="font-medium">{doctorProfile.review_stats.total_reviews || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Account Status</span>
                  <Badge className={`${doctorProfile?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {doctorProfile?.status || 'Unknown'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email Verified</span>
                  <Badge className={`${user?.email_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {user?.email_verified ? 'Verified' : 'Pending'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">License Number</span>
                  <span className="text-sm text-gray-900">{doctorProfile?.license_number || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Member Since</span>
                  <span className="text-sm text-gray-900">
                    {doctorProfile?.created_at ? new Date(doctorProfile.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DoctorLayout>
  )
}