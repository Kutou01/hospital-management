"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Stethoscope, Shield, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-wrapper"
import { useToast } from "@/components/ui/toast-provider"
import { useSpecialtyOptions, useDepartmentOptions } from "@/lib/contexts/EnumContext"
import { checkEmailAvailability, validateEmailFormat, createDebouncedEmailCheck } from "@/lib/utils/email-validation"
import { registerWithAuthService, checkAuthServiceAvailability, AuthServiceRegisterData } from "@/lib/api/auth-service-client"

// Define SignUpData interface for this component - Updated for new structure
interface SignUpData {
  email: string
  password: string
  accountType: "doctor" | "patient" | "admin"
  fullName: string
  phoneNumber?: string
  gender?: "male" | "female" | "other"
  dateOfBirth?: string
  // Doctor specific
  specialization?: string
  licenseNo?: string
  qualification?: string
  departmentId?: string
  yearsOfExperience?: number
  // Patient specific
  bloodType?: string
  address?: {
    street?: string
    district?: string
    city?: string
  }
  emergencyContact?: {
    name?: string
    phone?: string
    relationship?: string
  }
}

// Function để tự động gán khoa dựa trên chuyên khoa (sử dụng dynamic data)
const getDepartmentBySpecialization = (specialization: string, departmentOptions: any[], specialtyOptions: any[]): string => {

  // ✅ DYNAMIC APPROACH: Find specialty in specialtyOptions and get its department
  // Tìm specialty trong danh sách và lấy department_id tương ứng

  // If specialization is a specialty_id, find the corresponding specialty
  const specialty = specialtyOptions.find(spec => spec.value === specialization);

  if (specialty) {
    // If specialty has department_id, find matching department
    const matchingDept = departmentOptions.find(dept =>
      dept.value === specialty.department_id ||
      dept.label === specialty.department_name
    );

    if (matchingDept) {
      console.log('🎯 Found matching department via specialty:', {
        specialization,
        specialty: specialty.label,
        department: matchingDept.label,
        departmentId: matchingDept.value
      });
      return matchingDept.value;
    }
  }

  // ✅ FALLBACK: Smart mapping based on specialty name
  const specialtyLabel = specialty?.label || '';
  let targetDepartmentName = '';

  if (specialtyLabel.toLowerCase().includes('tim') || specialtyLabel.toLowerCase().includes('cardio')) {
    targetDepartmentName = 'Khoa Tim Mạch';
  } else if (specialtyLabel.toLowerCase().includes('chấn thương') || specialtyLabel.toLowerCase().includes('chỉnh hình')) {
    targetDepartmentName = 'Khoa Chấn Thương Chỉnh Hình';
  } else if (specialtyLabel.toLowerCase().includes('nhi')) {
    targetDepartmentName = 'Khoa Nhi';
  } else if (specialtyLabel.toLowerCase().includes('thần kinh')) {
    targetDepartmentName = 'Khoa Thần Kinh';
  } else if (specialtyLabel.toLowerCase().includes('da liễu')) {
    targetDepartmentName = 'Khoa Da Liễu';
  } else if (specialtyLabel.toLowerCase().includes('phụ sản')) {
    targetDepartmentName = 'Khoa Phụ Sản';
  } else if (specialtyLabel.toLowerCase().includes('cấp cứu')) {
    targetDepartmentName = 'Khoa Cấp Cứu';
  } else if (specialtyLabel.toLowerCase().includes('nội')) {
    targetDepartmentName = 'Khoa Nội Tổng Hợp';
  } else if (specialtyLabel.toLowerCase().includes('ngoại')) {
    targetDepartmentName = 'Khoa Ngoại Tổng Hợp';
  } else if (specialtyLabel.toLowerCase().includes('mắt') || specialtyLabel.toLowerCase().includes('nhãn')) {
    targetDepartmentName = 'Khoa Mắt';
  } else if (specialtyLabel.toLowerCase().includes('tai mũi họng')) {
    targetDepartmentName = 'Khoa Tai Mũi Họng';
  } else if (specialtyLabel.toLowerCase().includes('tâm thần')) {
    targetDepartmentName = 'Khoa Tâm Thần';
  }


  if (targetDepartmentName) {
    const matchingDept = departmentOptions.find(dept =>
      dept.label === targetDepartmentName
    )


    if (matchingDept) {
      return matchingDept.value
    }
  }

  // Fallback to first department if no match found
  const fallbackValue = departmentOptions.length > 0 ? departmentOptions[0].value : "DEPT001"

  console.log('🔍 getDepartmentBySpecialization Debug:', {
    specialization,
    targetDepartmentName,
    departmentOptions: departmentOptions.map(d => ({ value: d.value, label: d.label })),
    matchingDept: departmentOptions.find(dept => dept.label === targetDepartmentName),
    fallbackValue
  });

  return fallbackValue
}

export default function RegisterPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const { signUp } = useAuth()
  const specialtyOptions = useSpecialtyOptions()

  const [accountType, setAccountType] = useState<"doctor" | "patient" | "admin" | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)



  // Enhanced profile creation status
  const [profileStatus, setProfileStatus] = useState<{
    step: 'auth' | 'profile' | 'complete';
    method?: 'trigger' | 'rpc' | 'manual';
    message?: string;
  }>({ step: 'auth' })

  // Email validation state
  const [emailValidation, setEmailValidation] = useState<{
    isChecking: boolean
    isValid: boolean
    message: string
    type: 'success' | 'warning' | 'error' | 'info'
  }>({
    isChecking: false,
    isValid: false,
    message: '',
    type: 'info'
  })

  // Create debounced email check function
  const debouncedEmailCheck = createDebouncedEmailCheck(800)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phoneNumber: "",
    gender: "male" as "male" | "female" | "other",
    dateOfBirth: "",
    // Doctor specific
    specialization: "",
    licenseNo: "",
    qualification: "",
    departmentId: "",
    yearsOfExperience: "",
    // Patient specific
    bloodType: "",
    // Address fields
    address: "", // Single address field for simple input
    addressStreet: "",
    addressDistrict: "",
    addressCity: "",
    // Emergency contact as object
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
  })

  // Use dynamic departments from EnumContext instead of hardcoded list
  const departmentOptions = useDepartmentOptions()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear error and success when user starts typing
    if (error) setError("")
    if (success) setSuccess("")

    // Handle email validation
    if (name === 'email') {
      // Real-time format validation
      const formatValidation = validateEmailFormat(value)

      if (!value) {
        setEmailValidation({
          isChecking: false,
          isValid: false,
          message: '',
          type: 'info'
        })
      } else if (!formatValidation.isValid) {
        setEmailValidation({
          isChecking: false,
          isValid: false,
          message: formatValidation.message || 'Email không hợp lệ',
          type: 'error'
        })
      } else {
        // Format is valid, check availability
        setEmailValidation({
          isChecking: true,
          isValid: false,
          message: 'Đang kiểm tra email...',
          type: 'info'
        })

        // Debounced availability check
        debouncedEmailCheck(value, (result) => {
          setEmailValidation({
            isChecking: false,
            isValid: result.isAvailable,
            message: result.message,
            type: result.isAvailable ? 'success' : 'error'
          })
        })
      }
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      }

      // Tự động gán khoa khi chọn chuyên khoa
      if (name === "specialization" && value && accountType === "doctor") {


        const autoDepartmentId = getDepartmentBySpecialization(value, departmentOptions, specialtyOptions)

        newData.departmentId = autoDepartmentId
      }

      return newData
    })
    if (error) setError("")
    if (success) setSuccess("")
  }

  const validateForm = () => {
    if (!accountType) {
      setError("Vui lòng chọn loại tài khoản")
      return false
    }

    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.fullName) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc")
      return false
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Email không hợp lệ")
      return false
    }

    // Password validation
    if (formData.password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự")
      return false
    }

    // Password complexity check
    const hasUpperCase = /[A-Z]/.test(formData.password)
    const hasLowerCase = /[a-z]/.test(formData.password)
    const hasNumbers = /\d/.test(formData.password)

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      setError("Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số")
      return false
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp")
      return false
    }

    // Phone number validation (Vietnamese format)
    if (formData.phoneNumber) {
      const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/
      if (!phoneRegex.test(formData.phoneNumber)) {
        setError("Số điện thoại không hợp lệ (phải có 10 số và bắt đầu bằng 03, 05, 07, 08, 09)")
        return false
      }
    }

    if (accountType === "doctor") {
      if (!formData.specialization || !formData.licenseNo || !formData.qualification) {
        setError("Vui lòng điền đầy đủ thông tin chuyên khoa, số giấy phép và trình độ")
        return false
      }

      // License number validation (Vietnamese format: VN-XX-XXXX)
      const licenseRegex = /^VN-[A-Z]{2}-\d{4}$/
      if (!licenseRegex.test(formData.licenseNo)) {
        setError("Số giấy phép không hợp lệ (định dạng: VN-XX-XXXX, ví dụ: VN-HN-1234)")
        return false
      }
    }

    if (accountType === "patient") {
      if (!formData.dateOfBirth) {
        setError("Vui lòng điền ngày sinh")
        return false
      }

      // Age validation (must be at least 1 year old)
      const birthDate = new Date(formData.dateOfBirth)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()

      if (age < 1 || birthDate > today) {
        setError("Ngày sinh không hợp lệ")
        return false
      }
    }

    // Terms acceptance validation
    if (!acceptTerms) {
      setError("Vui lòng đồng ý với điều khoản sử dụng")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setError("")
    setSuccess("")
    setProfileStatus({ step: 'auth' })

    try {
      // Check Auth Service availability first
      setProfileStatus({ step: 'auth', message: 'Đang kiểm tra Auth Service...' })
      const healthCheck = await checkAuthServiceAvailability()

      if (!healthCheck.available) {
        setError('Auth Service không khả dụng. Vui lòng thử lại sau.')
        return
      }

      setProfileStatus({ step: 'auth', message: 'Đang tạo tài khoản xác thực...' })
      const signUpData: SignUpData = {
        email: formData.email,
        password: formData.password,
        accountType: accountType!,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber || undefined,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth || undefined,
        // Doctor specific
        specialization: accountType === "doctor" ? formData.specialization : undefined,
        licenseNo: accountType === "doctor" ? formData.licenseNo : undefined,
        qualification: accountType === "doctor" ? formData.qualification : undefined,
        departmentId: accountType === "doctor" ? formData.departmentId : undefined,
        yearsOfExperience: accountType === "doctor" ? parseInt(formData.yearsOfExperience) || undefined : undefined,
        // Patient specific - structured data
        bloodType: accountType === "patient" ? formData.bloodType : undefined,
        address: accountType === "patient" ? {
          street: formData.addressStreet || undefined,
          district: formData.addressDistrict || undefined,
          city: formData.addressCity || undefined,
        } : undefined,
        emergencyContact: accountType === "patient" ? {
          name: formData.emergencyContactName || undefined,
          phone: formData.emergencyContactPhone || undefined,
          relationship: formData.emergencyContactRelationship || undefined,
        } : undefined,
      }

      // Tự động gán khoa dựa trên chuyên khoa cho bác sĩ
      let departmentId = signUpData.departmentId
      if (signUpData.accountType === "doctor" && signUpData.specialization) {
        departmentId = getDepartmentBySpecialization(signUpData.specialization, departmentOptions, specialtyOptions)

      }

      // Convert to Auth Service format (new structure)
      const authServiceData: AuthServiceRegisterData = {
        email: signUpData.email,
        password: signUpData.password,
        full_name: signUpData.fullName,
        phone_number: signUpData.phoneNumber,
        role: signUpData.accountType as "doctor" | "patient",
        gender: signUpData.gender,
        date_of_birth: signUpData.dateOfBirth,
        // Doctor specific
        specialty: signUpData.specialization,
        license_number: signUpData.licenseNo,
        qualification: signUpData.qualification,
        department_id: signUpData.departmentId,
        years_of_experience: signUpData.yearsOfExperience,
        // Patient specific - structured data
        address: signUpData.address,
        emergency_contact: signUpData.emergencyContact,
        blood_type: signUpData.bloodType,
      }

      // Register via Auth Service
      setProfileStatus({ step: 'profile', message: 'Đang tạo hồ sơ người dùng...' })
      const result = await registerWithAuthService(authServiceData)

      if (!result.success) {
        throw new Error(result.error || 'Registration failed')
      }

      // Registration successful
      setProfileStatus({ step: 'complete', message: 'Đăng ký thành công!' })

      const roleText = accountType === "doctor" ? "bác sĩ" : accountType === "patient" ? "bệnh nhân" : "quản trị viên"
      const successMessage = `Đăng ký tài khoản ${roleText} thành công! Hồ sơ người dùng đã được tạo. Đang chuyển đến trang đăng nhập...`

      // Clear any existing errors and set success
      setError("")
      setSuccess(successMessage)

      // Show success toast
      showToast("🎉 Đăng ký thành công!", successMessage, "success")

      // Wait a bit to show the success message, then redirect
      setTimeout(() => {
        setIsLoading(false) // Reset loading before redirect
        router.push("/auth/login?message=" + encodeURIComponent("Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.") + "&from_register=true")
      }, 2000)
    } catch (err: any) {
      console.error('❌ Registration failed:', err)
      let errorMessage = err.message || 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.'

      // Handle specific error cases with better user experience
      if (errorMessage.includes('Email này đã được đăng ký') ||
          errorMessage.includes('User already registered') ||
          errorMessage.includes('already been registered') ||
          errorMessage.includes('duplicate key value violates unique constraint')) {
        errorMessage = "Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập."
      } else if (errorMessage.includes('Invalid email')) {
        errorMessage = "Email không hợp lệ. Vui lòng kiểm tra lại."
      } else if (errorMessage.includes('Password')) {
        errorMessage = "Mật khẩu không hợp lệ. Vui lòng kiểm tra lại."
      } else if (errorMessage.includes('weak')) {
        errorMessage = "Mật khẩu quá yếu. Vui lòng sử dụng mật khẩu mạnh hơn."
      } else if (errorMessage.includes('signup')) {
        errorMessage = "Đăng ký tạm thời bị tắt. Vui lòng thử lại sau."
      }

      setError(errorMessage)
      setProfileStatus({ step: 'auth' })
      showToast("Đăng ký thất bại", errorMessage, "error")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#e6f7ff] to-white p-4">
      <Card className="w-full max-w-[400px] shadow-md">
        <CardContent className="p-6">
          <h2 className="text-[#0066CC] text-xl font-bold text-center mb-6 font-poppins">
            Chọn loại tài khoản
          </h2>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-700 p-3 rounded-md mb-4 text-sm">
              {success}
            </div>
          )}

          {/* Profile Creation Status Indicator */}
          {isLoading && (
            <Alert className="mb-4">
              <div className="flex items-center space-x-2">
                {profileStatus.step === 'auth' && <Loader2 className="h-4 w-4 animate-spin" />}
                {profileStatus.step === 'profile' && <Loader2 className="h-4 w-4 animate-spin" />}
                {profileStatus.step === 'complete' && <CheckCircle className="h-4 w-4 text-green-600" />}
                <AlertDescription>
                  {profileStatus.message ||
                   (profileStatus.step === 'auth' ? 'Đang tạo tài khoản...' :
                    profileStatus.step === 'profile' ? 'Đang tạo hồ sơ người dùng...' :
                    'Hoàn tất đăng ký!')}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {!accountType ? (
            <div className="grid grid-cols-1 gap-3 mb-6">
              <div
                className="relative cursor-pointer border rounded-lg p-4 flex items-center gap-4 transition-all border-[#E0E0E0] hover:border-[#0066CC]"
                onClick={() => setAccountType("doctor")}
              >
                <div className="w-12 h-12 bg-[#E6F2FF] rounded-full flex items-center justify-center">
                  <Stethoscope size={24} className="text-[#0066CC]" />
                </div>
                <div>
                  <span className="font-medium block">Bác sĩ</span>
                  <span className="text-sm text-gray-500">Đăng ký tài khoản bác sĩ</span>
                </div>
              </div>

              <div
                className="relative cursor-pointer border rounded-lg p-4 flex items-center gap-4 transition-all border-[#E0E0E0] hover:border-[#0066CC]"
                onClick={() => setAccountType("patient")}
              >
                <div className="w-12 h-12 bg-[#E6F2FF] rounded-full flex items-center justify-center">
                  <User size={24} className="text-[#0066CC]" />
                </div>
                <div>
                  <span className="font-medium block">Bệnh nhân</span>
                  <span className="text-sm text-gray-500">Đăng ký tài khoản bệnh nhân</span>
                </div>
              </div>

              <div
                className="relative cursor-pointer border rounded-lg p-4 flex items-center gap-4 transition-all border-[#E0E0E0] hover:border-[#0066CC]"
                onClick={() => setAccountType("admin")}
              >
                <div className="w-12 h-12 bg-[#E6F2FF] rounded-full flex items-center justify-center">
                  <Shield size={24} className="text-[#0066CC]" />
                </div>
                <div>
                  <span className="font-medium block">Quản trị viên</span>
                  <span className="text-sm text-gray-500">Đăng ký tài khoản quản trị</span>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {accountType === "doctor" ? (
                      <Stethoscope size={20} className="text-[#0066CC]" />
                    ) : accountType === "patient" ? (
                      <User size={20} className="text-[#0066CC]" />
                    ) : (
                      <Shield size={20} className="text-[#0066CC]" />
                    )}
                    <span className="text-[#0066CC] font-medium">
                      {accountType === "doctor" ? "Đăng ký Bác sĩ" :
                       accountType === "patient" ? "Đăng ký Bệnh nhân" :
                       "Đăng ký Quản trị viên"}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAccountType(null)}
                    className="text-[#0066CC] border-[#0066CC]"
                  >
                    Thay đổi
                  </Button>
                </div>

                {/* Basic Information */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-[#0066CC]">
                    Họ và tên *
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    className="h-10 rounded-md border-[#CCC] focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC]"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#0066CC]">
                    Email *
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="example@email.com"
                      className={`h-10 rounded-md border-[#CCC] focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC] pr-10 ${
                        emailValidation.type === 'error' ? 'border-red-500' :
                        emailValidation.type === 'success' ? 'border-green-500' :
                        emailValidation.type === 'warning' ? 'border-yellow-500' : ''
                      }`}
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      required
                    />
                    {emailValidation.isChecking && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      </div>
                    )}
                    {!emailValidation.isChecking && emailValidation.message && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {emailValidation.type === 'success' && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {emailValidation.type === 'error' && (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        {emailValidation.type === 'warning' && (
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {emailValidation.message && (
                    <p className={`text-xs ${
                      emailValidation.type === 'error' ? 'text-red-600' :
                      emailValidation.type === 'success' ? 'text-green-600' :
                      emailValidation.type === 'warning' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`}>
                      {emailValidation.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#0066CC]">
                    Mật khẩu *
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Ít nhất 8 ký tự, có chữ hoa, thường và số"
                      className="h-10 rounded-md border-[#CCC] focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC] pr-10"
                      value={formData.password}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-10 px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-[#0066CC]">
                    Xác nhận mật khẩu *
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Nhập lại mật khẩu"
                    className="h-10 rounded-md border-[#CCC] focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC]"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-[#0066CC]">
                    Số điện thoại
                  </Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    placeholder="0987654321 (10 số, bắt đầu 03/05/07/08/09)"
                    className="h-10 rounded-md border-[#CCC] focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC]"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>

                {/* Doctor-specific fields */}
                {accountType === "doctor" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="specialization" className="text-[#0066CC]">
                        Chuyên khoa *
                      </Label>
                      <Select
                        value={formData.specialization}
                        onValueChange={(value) => handleSelectChange("specialization", value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="h-10 rounded-md border-[#CCC] focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC]">
                          <SelectValue placeholder="Chọn chuyên khoa" />
                        </SelectTrigger>
                        <SelectContent>
                          {specialtyOptions.map((option) => (
                            <SelectItem key={option.value} value={String(option.value)}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="licenseNo" className="text-[#0066CC]">
                        Số giấy phép hành nghề *
                      </Label>
                      <Input
                        id="licenseNo"
                        name="licenseNo"
                        type="text"
                        placeholder="VN-HN-1234 (định dạng: VN-XX-XXXX)"
                        className="h-10 rounded-md border-[#CCC] focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC]"
                        value={formData.licenseNo}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="qualification" className="text-[#0066CC]">
                        Trình độ học vấn *
                      </Label>
                      <Select
                        value={formData.qualification}
                        onValueChange={(value) => handleSelectChange("qualification", value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="h-10 rounded-md border-[#CCC] focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC]">
                          <SelectValue placeholder="Chọn trình độ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Bác sĩ">Bác sĩ</SelectItem>
                          <SelectItem value="Thạc sĩ">Thạc sĩ</SelectItem>
                          <SelectItem value="Tiến sĩ">Tiến sĩ</SelectItem>
                          <SelectItem value="Giáo sư">Giáo sư</SelectItem>
                          <SelectItem value="Phó Giáo sư">Phó Giáo sư</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-[#0066CC]">
                        Giới tính
                      </Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value) => handleSelectChange("gender", value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="h-10 rounded-md border-[#CCC] focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC]">
                          <SelectValue placeholder="Chọn giới tính" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Nam</SelectItem>
                          <SelectItem value="female">Nữ</SelectItem>
                          <SelectItem value="other">Khác</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Khoa sẽ được tự động gán dựa trên chuyên khoa */}
                    {formData.specialization && formData.departmentId && (
                      <div className="space-y-2">
                        <Label className="text-[#0066CC]">
                          Khoa được gán tự động
                        </Label>
                        <div className="h-10 px-3 py-2 border border-[#CCC] rounded-md bg-gray-50 flex items-center text-sm text-gray-600">
                          {departmentOptions.find(dept => dept.value === formData.departmentId)?.label ||
                           `Khoa tương ứng với ${formData.specialization}`}
                        </div>
                        <p className="text-xs text-gray-500">
                          Khoa đã được tự động gán dựa trên chuyên khoa bạn chọn
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Patient-specific fields */}
                {accountType === "patient" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth" className="text-[#0066CC]">
                        Ngày sinh *
                      </Label>
                      <Input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        className="h-10 rounded-md border-[#CCC] focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC]"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-[#0066CC]">
                        Giới tính
                      </Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value) => handleSelectChange("gender", value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="h-10 rounded-md border-[#CCC] focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC]">
                          <SelectValue placeholder="Chọn giới tính" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Nam</SelectItem>
                          <SelectItem value="female">Nữ</SelectItem>
                          <SelectItem value="other">Khác</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bloodType" className="text-[#0066CC]">
                        Nhóm máu
                      </Label>
                      <Select
                        value={formData.bloodType}
                        onValueChange={(value) => handleSelectChange("bloodType", value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="h-10 rounded-md border-[#CCC] focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC]">
                          <SelectValue placeholder="Chọn nhóm máu" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-[#0066CC]">
                        Địa chỉ
                      </Label>
                      <Input
                        id="address"
                        name="address"
                        type="text"
                        placeholder="123 Đường ABC, Quận XYZ, TP.HCM"
                        className="h-10 rounded-md border-[#CCC] focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC]"
                        value={formData.address}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactName" className="text-[#0066CC]">
                        Tên người liên hệ khẩn cấp
                      </Label>
                      <Input
                        id="emergencyContactName"
                        name="emergencyContactName"
                        type="text"
                        placeholder="Nguyễn Văn B"
                        className="h-10 rounded-md border-[#CCC] focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC]"
                        value={formData.emergencyContactName}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactPhone" className="text-[#0066CC]">
                        SĐT người liên hệ khẩn cấp
                      </Label>
                      <Input
                        id="emergencyContactPhone"
                        name="emergencyContactPhone"
                        type="tel"
                        placeholder="0987654321"
                        className="h-10 rounded-md border-[#CCC] focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC]"
                        value={formData.emergencyContactPhone}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                    </div>
                  </>
                )}

                {/* Terms and Conditions */}
                <div className="flex items-start space-x-2 mt-6">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 text-[#0066CC] border-gray-300 rounded focus:ring-[#0066CC]"
                    disabled={isLoading}
                    aria-label="Đồng ý với điều khoản sử dụng và chính sách bảo mật"
                  />
                  <Label htmlFor="acceptTerms" className="text-sm text-gray-700 leading-5">
                    Tôi đồng ý với{" "}
                    <Link href="/terms" className="text-[#0066CC] hover:underline">
                      Điều khoản sử dụng
                    </Link>{" "}
                    và{" "}
                    <Link href="/privacy" className="text-[#0066CC] hover:underline">
                      Chính sách bảo mật
                    </Link>{" "}
                    của hệ thống quản lý bệnh viện
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full h-[45px] mt-6 bg-[#0066CC] hover:bg-[#0055AA] text-white rounded-md"
                  disabled={isLoading || !acceptTerms}
                >
                  {isLoading ? (
                    success ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang chuyển hướng...
                      </>
                    ) : (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang đăng ký...
                      </>
                    )
                  ) : (
                    "Đăng ký"
                  )}
                </Button>

                <p className="text-[#555] text-xs text-center mt-4">
                  Đã có tài khoản?{" "}
                  <Link href="/auth/login" className="text-[#0066CC] hover:underline">
                    Đăng nhập
                  </Link>
                </p>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}