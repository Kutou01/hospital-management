"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Hospital, Eye, EyeOff, Loader2 } from "lucide-react"
import { authApi, SignInData } from "@/lib/auth"
import { useToast } from "@/components/ui/toast-provider"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  // Show success message from register page
  useEffect(() => {
    const message = searchParams.get('message')
    if (message) {
      showToast("Thông báo", message, "success")
    }
  }, [searchParams, showToast])

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await authApi.getCurrentUser()
      if (data?.user && data?.profile) {
        const redirectPath = `/${data.profile.role}/dashboard`
        router.push(redirectPath)
      }
    }
    checkAuth()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (error) setError("")
  }

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError("Vui lòng điền đầy đủ thông tin")
      return false
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Email không hợp lệ")
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

    try {
      const signInData: SignInData = {
        email: formData.email,
        password: formData.password
      }

      const result = await authApi.signIn(signInData)

      console.log('🔍 [Login] Sign in result:', {
        hasError: !!result.error,
        hasUser: !!result.data?.user,
        hasProfile: !!result.data?.profile,
        role: result.data?.profile?.role
      })

      if (result.error) {
        console.error('❌ Login failed:', result.error)
        let errorMessage = result.error.message || result.error.toString()

        // Handle specific error cases
        if (errorMessage.includes('Invalid login credentials') || errorMessage.includes('Invalid email or password')) {
          errorMessage = "Email hoặc mật khẩu không đúng. Vui lòng thử lại."
        } else if (errorMessage.includes('Email not confirmed')) {
          errorMessage = "Email chưa được xác nhận. Vui lòng kiểm tra email và xác nhận tài khoản."
        } else if (errorMessage.includes('Too many requests')) {
          errorMessage = "Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau."
        }

        setError(errorMessage)
        showToast("Đăng nhập thất bại", errorMessage, "error")
        setIsLoading(false)
      } else if (result.data?.user && result.data?.profile) {
        // Login successful
        console.log('✅ Login successful for user:', {
          id: result.data.user.id,
          email: result.data.user.email,
          role: result.data.profile.role
        })

        const role = result.data.profile.role
        const roleText = role === "doctor" ? "bác sĩ" : role === "patient" ? "bệnh nhân" : "quản trị viên"

        showToast("🎉 Đăng nhập thành công!", `Chào mừng ${roleText} ${result.data.profile.full_name}!`, "success")

        // Redirect to role-specific dashboard
        const redirectPath = `/${role}/dashboard`
        console.log('🔄 Redirecting to:', redirectPath)
        router.push(redirectPath)
      } else {
        console.warn('⚠️ No error but no user/profile returned from login')
        setError("Đăng nhập không thành công. Vui lòng thử lại.")
        showToast("Đăng nhập thất bại", "Đăng nhập không thành công. Vui lòng thử lại.", "error")
        setIsLoading(false)
      }
    } catch (err) {
      console.error('❌ Login error:', err)
      const errorMessage = "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại."
      setError(errorMessage)
      showToast("Đăng nhập thất bại", errorMessage, "error")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#e6f7ff] to-white p-4">
      <div className="w-full max-w-[400px]">
        {/* Hospital Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-[#0066CC] p-3 rounded-full">
              <Hospital className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Hệ thống Quản lý Bệnh viện
          </h1>
          <p className="text-gray-600">
            Chào mừng bạn quay trở lại
          </p>
        </div>

        {/* Login Form */}
        <Card className="shadow-md">
          <CardContent className="p-6">
            <h2 className="text-[#0066CC] text-xl font-bold text-center mb-6 font-poppins">
              Đăng nhập
            </h2>

            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
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
                      placeholder="Nhập mật khẩu"
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

                <Button
                  type="submit"
                  className="w-full h-[45px] mt-6 bg-[#0066CC] hover:bg-[#0055AA] text-white rounded-md"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang đăng nhập...
                    </>
                  ) : (
                    "Đăng nhập"
                  )}
                </Button>

                <div className="text-center space-y-2 mt-4">
                  <p className="text-[#555] text-xs">
                    Chưa có tài khoản?{" "}
                    <Link href="/auth/register" className="text-[#0066CC] hover:underline">
                      Đăng ký ngay
                    </Link>
                  </p>
                  <p className="text-[#555] text-xs">
                    <Link href="/auth/forgot-password" className="text-[#0066CC] hover:underline">
                      Quên mật khẩu?
                    </Link>
                  </p>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
