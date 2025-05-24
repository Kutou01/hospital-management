"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// Import icons directly from lucide-react
import { User, Stethoscope, Check } from "lucide-react"
import { useSupabaseAuth } from "@/lib/hooks/useSupabaseAuth"

export default function RegisterPage() {
  const router = useRouter()
  const { signUp, loading } = useSupabaseAuth()
  const [accountType, setAccountType] = useState<"doctor" | "patient" | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    phone_number: "",
    specialty: "",
    license_number: "",
    date_of_birth: "",
    gender: "Male",
    address: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const { name, value } = e.target
      setFormData((prev) => ({ ...prev, [name]: value }))
      // Clear error when user starts typing
      if (error) setError("")
    } catch (err) {
      console.error('Error in handleInputChange:', err)
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (error) setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted with account type:', accountType)

    if (!accountType) {
      setError("Vui lòng chọn loại tài khoản")
      return
    }

    // Basic validation
    if (!formData.email || !formData.password || !formData.full_name) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc")
      return
    }

    if (formData.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự")
      return
    }

    setIsLoading(true)
    setError("")

    // Validate required fields based on account type
    if (accountType === "doctor") {
      if (!formData.specialty) {
        setError("Vui lòng chọn chuyên khoa")
        setIsLoading(false)
        return
      }
      if (!formData.license_number) {
        setError("Số giấy phép hành nghề là bắt buộc")
        setIsLoading(false)
        return
      }
    }

    if (accountType === "patient") {
      if (!formData.date_of_birth) {
        setError("Ngày sinh là bắt buộc")
        setIsLoading(false)
        return
      }
    }

    console.log('Form data to submit:', {
      email: formData.email,
      full_name: formData.full_name,
      phone_number: formData.phone_number,
      role: accountType,
      specialty: formData.specialty,
      license_number: formData.license_number,
      date_of_birth: formData.date_of_birth,
      gender: formData.gender,
      address: formData.address,
    })

    try {
      const result = await signUp({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        role: accountType,
        specialty: formData.specialty,
        license_number: formData.license_number,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        address: formData.address,
      })

      console.log('SignUp result:', result)

      if (result.error) {
        // Translate common Supabase errors to Vietnamese
        let errorMessage = result.error
        if (result.error.includes('already registered')) {
          errorMessage = 'Email này đã được đăng ký. Vui lòng sử dụng email khác.'
        } else if (result.error.includes('Invalid email')) {
          errorMessage = 'Email không hợp lệ. Vui lòng kiểm tra lại.'
        } else if (result.error.includes('Password')) {
          errorMessage = 'Mật khẩu không đủ mạnh. Vui lòng sử dụng mật khẩu khác.'
        }
        setError(errorMessage)
      } else if (result.user) {
        // Đăng ký thành công, chuyển về trang login
        router.push("/auth/login?message=Đăng ký thành công! Vui lòng đăng nhập.")
      }
    } catch (err) {
      console.error('Register error:', err)
      setError("Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#e6f7ff] to-white p-4">
      <Card className="w-full max-w-[400px] shadow-md">
        <CardContent className="p-6">
          <h2 className="text-[#0066CC] text-xl font-bold text-center mb-6 font-poppins">Chọn loại tài khoản</h2>

          <div className="flex justify-center gap-4 mb-6">
            <div
              className={`relative cursor-pointer border rounded-lg p-4 flex flex-col items-center transition-all ${
                accountType === "doctor" ? "border-[#0066CC] bg-[#E6F2FF]" : "border-[#E0E0E0] hover:border-[#0066CC]"
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setAccountType("doctor");
              }}
            >
              <div className="w-20 h-20 mb-2 flex items-center justify-center">
                <div className="w-16 h-16 bg-[#E6F2FF] rounded-full flex items-center justify-center">
                  <Stethoscope size={40} className="text-[#0066CC]" />
                </div>
              </div>
              <span className="font-medium">Bác sĩ</span>
              {accountType === "doctor" && (
                <div className="absolute bottom-2 right-2 text-[#0066CC]">
                  <Check size={16} />
                </div>
              )}
            </div>

            <div
              className={`relative cursor-pointer border rounded-lg p-4 flex flex-col items-center transition-all ${
                accountType === "patient" ? "border-[#0066CC] bg-[#E6F2FF]" : "border-[#E0E0E0] hover:border-[#0066CC]"
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setAccountType("patient");
              }}
            >
              <div className="w-20 h-20 mb-2 flex items-center justify-center">
                <div className="w-16 h-16 bg-[#E6F2FF] rounded-full flex items-center justify-center">
                  <User size={40} className="text-[#0066CC]" />
                </div>
              </div>
              <span className="font-medium">Bệnh nhân</span>
              {accountType === "patient" && (
                <div className="absolute bottom-2 right-2 text-[#0066CC]">
                  <Check size={16} />
                </div>
              )}
            </div>
          </div>

          {accountType && (
            <p className="text-[#777] text-sm text-center mb-6">
              Xin chào {accountType === "doctor" ? "Bác sĩ" : "Bệnh nhân"}! Vui lòng điền thông tin bên dưới để bắt đầu.
            </p>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}

          {accountType && (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#0066CC]">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    className="h-10 rounded-md border-[#CCC] focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC]"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#0066CC]">
                    Mật khẩu
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    className="h-10 rounded-md border-[#CCC] focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC]"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-[#0066CC]">
                    Họ và tên
                  </Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    className="h-10 rounded-md border-[#CCC] focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC]"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number" className="text-[#0066CC]">
                    Số điện thoại
                  </Label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    type="tel"
                    placeholder="+84 123 456 789"
                    className="h-10 rounded-md border-[#CCC] focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC]"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                </div>

                {accountType === "doctor" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="specialty" className="text-[#0066CC]">
                        Chuyên khoa
                      </Label>
                      <Select
                        value={formData.specialty}
                        onValueChange={(value) => handleSelectChange("specialty", value)}
                        required
                      >
                        <SelectTrigger className="h-10 rounded-md border-[#CCC] focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC]">
                          <SelectValue placeholder="Chọn chuyên khoa" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cardiology">Tim mạch</SelectItem>
                          <SelectItem value="neurology">Thần kinh</SelectItem>
                          <SelectItem value="pediatrics">Nhi khoa</SelectItem>
                          <SelectItem value="orthopedics">Chỉnh hình</SelectItem>
                          <SelectItem value="dermatology">Da liễu</SelectItem>
                          <SelectItem value="general">Nội tổng quát</SelectItem>
                          <SelectItem value="surgery">Phẫu thuật</SelectItem>
                          <SelectItem value="psychiatry">Tâm thần</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="license_number" className="text-[#0066CC]">
                        Số giấy phép hành nghề
                      </Label>
                      <Input
                        id="license_number"
                        name="license_number"
                        type="text"
                        placeholder="ML12345678"
                        className="h-10 rounded-md border-[#CCC] focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC]"
                        value={formData.license_number}
                        onChange={handleInputChange}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </>
                )}

                {accountType === "patient" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="date_of_birth" className="text-[#0066CC]">
                        Ngày sinh
                      </Label>
                      <Input
                        id="date_of_birth"
                        name="date_of_birth"
                        type="date"
                        className="h-10 rounded-md border-[#CCC] focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC]"
                        value={formData.date_of_birth}
                        onChange={handleInputChange}
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#0066CC]">Giới tính</Label>
                      <RadioGroup
                        value={formData.gender}
                        onValueChange={(value) => handleSelectChange("gender", value)}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Male" id="male" />
                          <Label htmlFor="male">Nam</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Female" id="female" />
                          <Label htmlFor="female">Nữ</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Other" id="other" />
                          <Label htmlFor="other">Khác</Label>
                        </div>
                      </RadioGroup>
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
                  </>
                )}

                <Button
                  type="submit"
                  className="w-full h-[45px] mt-6 bg-[#0066CC] hover:bg-[#0055AA] text-white rounded-md"
                  disabled={isLoading}
                >
                  {isLoading ? "Đang đăng ký..." : "Đăng ký"}
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