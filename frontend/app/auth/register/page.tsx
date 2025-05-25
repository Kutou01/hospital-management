"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Stethoscope, Shield, Eye, EyeOff, Loader2 } from "lucide-react"
import { authApi, SignUpData } from "@/lib/auth"
import { useToast } from "@/components/ui/toast-provider"

export default function RegisterPage() {
  const router = useRouter()
  const { showToast } = useToast()

  const [accountType, setAccountType] = useState<"doctor" | "patient" | "admin" | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [departments, setDepartments] = useState<any[]>([])
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phoneNumber: "",
    // Doctor specific
    specialization: "",
    licenseNo: "",
    qualification: "",
    departmentId: "",
    // Patient specific
    dateOfBirth: "",
    gender: "male" as "male" | "female" | "other",
    bloodType: "",
    address: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  })

  // Load departments for doctor registration
  useEffect(() => {
    const loadDepartments = async () => {
      const { data } = await authApi.getDepartments()
      if (data) {
        setDepartments(data)
      }
    }
    loadDepartments()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error and success when user starts typing
    if (error) setError("")
    if (success) setSuccess("")
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError("")
    if (success) setSuccess("")
  }

  const validateForm = () => {
    if (!accountType) {
      setError("Vui lòng chọn loại tài khoản")
      return false
    }

    if (!formData.email || !formData.password || !formData.fullName) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc")
      return false
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Email không hợp lệ")
      return false
    }

    if (formData.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự")
      return false
    }

    if (accountType === "doctor") {
      if (!formData.specialization || !formData.licenseNo || !formData.qualification) {
        setError("Vui lòng điền đầy đủ thông tin chuyên khoa, số giấy phép và trình độ")
        return false
      }
    }

    if (accountType === "patient") {
      if (!formData.dateOfBirth) {
        setError("Vui lòng điền ngày sinh")
        return false
      }
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

    try {
      const signUpData: SignUpData = {
        email: formData.email,
        password: formData.password,
        accountType: accountType!,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber || undefined,
        // Doctor specific
        specialization: accountType === "doctor" ? formData.specialization : undefined,
        licenseNo: accountType === "doctor" ? formData.licenseNo : undefined,
        qualification: accountType === "doctor" ? formData.qualification : undefined,
        departmentId: accountType === "doctor" ? formData.departmentId : undefined,
        // Patient specific
        dateOfBirth: accountType === "patient" ? formData.dateOfBirth : undefined,
        gender: accountType === "patient" ? formData.gender : undefined,
        bloodType: accountType === "patient" ? formData.bloodType : undefined,
        address: accountType === "patient" ? formData.address : undefined,
        emergencyContactName: accountType === "patient" ? formData.emergencyContactName : undefined,
        emergencyContactPhone: accountType === "patient" ? formData.emergencyContactPhone : undefined,
      }

      const result = await authApi.signUp(signUpData)

      console.log('🔍 [Register] Registration result:', {
        hasError: !!result.error,
        hasUser: !!result.data?.user,
        error: result.error,
        userId: result.data?.user?.id
      })

      if (result.error) {
        console.error('❌ Registration failed:', result.error)
        let errorMessage = (result.error as any)?.message || result.error.toString()

        // Handle specific error cases
        if (errorMessage.includes('User already registered') || errorMessage.includes('already been registered')) {
          errorMessage = "Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập."
        } else if (errorMessage.includes('Invalid email')) {
          errorMessage = "Email không hợp lệ. Vui lòng kiểm tra lại."
        } else if (errorMessage.includes('Password')) {
          errorMessage = "Mật khẩu không hợp lệ. Vui lòng kiểm tra lại."
        } else if (errorMessage.includes('weak')) {
          errorMessage = "Mật khẩu quá yếu. Vui lòng sử dụng mật khẩu mạnh hơn."
        } else if (errorMessage.includes('signup')) {
          errorMessage = "Đăng ký tạm thời bị tắt. Vui lòng thử lại sau."
        } else if (errorMessage.includes('Thông tin') || errorMessage.includes('không đầy đủ')) {
          // Keep the original validation error message
          errorMessage = errorMessage
        } else if (errorMessage.includes('Không thể')) {
          // Keep the original profile creation error message
          errorMessage = errorMessage
        }

        setError(errorMessage)
        showToast("Đăng ký thất bại", errorMessage, "error")
        setIsLoading(false)
      } else if (result.data?.user) {
        // Registration successful
        console.log('✅ Registration successful for user:', {
          id: result.data.user.id,
          email: result.data.user.email
        })

        const roleText = accountType === "doctor" ? "bác sĩ" : accountType === "patient" ? "bệnh nhân" : "quản trị viên"
        const successMessage = `Đăng ký tài khoản ${roleText} thành công! Đang chuyển đến trang đăng nhập...`

        // Clear any existing errors and set success
        setError("")
        setSuccess(successMessage)

        // Show success toast
        showToast("🎉 Đăng ký thành công!", successMessage, "success")

        // Wait a bit to show the success message, then redirect
        console.log('⏳ Waiting 2 seconds before redirect...')
        setTimeout(() => {
          console.log('🔄 Redirecting to login page...')
          setIsLoading(false) // Reset loading before redirect
          router.push("/auth/login?message=" + encodeURIComponent("Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.") + "&from_register=true")
        }, 2000)

      } else {
        console.warn('⚠️ No error but no user returned from registration')
        setError("Đăng ký không thành công. Vui lòng thử lại.")
        showToast("Đăng ký thất bại", "Đăng ký không thành công. Vui lòng thử lại.", "error")
        setIsLoading(false)
      }
    } catch (err) {
      console.error('❌ Registration error:', err)
      const errorMessage = "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại."
      setError(errorMessage)
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
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="example@email.com"
                    className="h-10 rounded-md border-[#CCC] focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC]"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    required
                  />
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
                      placeholder="Ít nhất 6 ký tự"
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
                  <Label htmlFor="phoneNumber" className="text-[#0066CC]">
                    Số điện thoại
                  </Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    placeholder="0123456789"
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
                          <SelectItem value="Nội tổng hợp">Nội tổng hợp</SelectItem>
                          <SelectItem value="Ngoại tổng hợp">Ngoại tổng hợp</SelectItem>
                          <SelectItem value="Sản phụ khoa">Sản phụ khoa</SelectItem>
                          <SelectItem value="Nhi khoa">Nhi khoa</SelectItem>
                          <SelectItem value="Tim mạch can thiệp">Tim mạch can thiệp</SelectItem>
                          <SelectItem value="Thần kinh học">Thần kinh học</SelectItem>
                          <SelectItem value="Chấn thương và chỉnh hình">Chấn thương và chỉnh hình</SelectItem>
                          <SelectItem value="Cấp cứu và hồi sức">Cấp cứu và hồi sức</SelectItem>
                          <SelectItem value="Da liễu">Da liễu</SelectItem>
                          <SelectItem value="Mắt">Mắt</SelectItem>
                          <SelectItem value="Tai mũi họng">Tai mũi họng</SelectItem>
                          <SelectItem value="Răng hàm mặt">Răng hàm mặt</SelectItem>
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
                        placeholder="VD: 12345/BYT"
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
                      <Label htmlFor="departmentId" className="text-[#0066CC]">
                        Khoa
                      </Label>
                      <Select
                        value={formData.departmentId}
                        onValueChange={(value) => handleSelectChange("departmentId", value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="h-10 rounded-md border-[#CCC] focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC]">
                          <SelectValue placeholder="Chọn khoa" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.department_id} value={dept.department_id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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

                <Button
                  type="submit"
                  className="w-full h-[45px] mt-6 bg-[#0066CC] hover:bg-[#0055AA] text-white rounded-md"
                  disabled={isLoading}
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