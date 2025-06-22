"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Hospital, Eye, EyeOff, Loader2, Calendar, Stethoscope, ArrowLeft } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-wrapper"
import { useToast } from "@/components/ui/toast-provider"

export default function LoginServicePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const { user, signIn, loading: authLoading, isAuthenticated, clearError } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  // Get redirect info
  const redirect = searchParams.get('redirect')
  const isFromBooking = redirect === 'booking'

  // Show success message from register page
  useEffect(() => {
    const message = searchParams.get('message')
    if (message) {
      showToast("Thông báo", message, "success")
    }
  }, [searchParams, showToast])

  // Auto-redirect if user is already authenticated
  useEffect(() => {
    const fromRegister = searchParams.get('from_register')
    const hasMessage = searchParams.get('message')

    if (fromRegister || hasMessage || isFromBooking || authLoading) {
      console.log('🔄 [LoginService] Skipping auth check - special case or loading')
      return
    }

    if (isAuthenticated && user && user.role && user.is_active) {
      console.log('🔄 [LoginService] User already logged in, redirecting to dashboard...')
      // Auth service context will handle redirect
    }
  }, [user, authLoading, isAuthenticated, router, searchParams, isFromBooking])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear errors when user starts typing
    if (error) setError("")
    clearError()
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
    clearError()

    try {
      console.log('🔐 [LoginService] Starting login process via Auth Service...')

      await signIn(formData.email, formData.password, 'service')

      console.log('✅ Login via Auth Service successful')
      showToast("🎉 Đăng nhập thành công!", "Chào mừng bạn!", "success")

    } catch (err: any) {
      console.error('❌ Login via Auth Service failed:', err)
      let errorMessage = err.message || 'Unknown error'

      // Handle specific error cases
      if (errorMessage.includes('Invalid login credentials') || errorMessage.includes('Invalid email or password')) {
        errorMessage = "Email hoặc mật khẩu không đúng. Vui lòng thử lại."
      } else if (errorMessage.includes('Email not confirmed')) {
        errorMessage = "Email chưa được xác nhận. Vui lòng kiểm tra email và xác nhận tài khoản."
      } else if (errorMessage.includes('Too many requests')) {
        errorMessage = "Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau."
      } else if (errorMessage.includes('service unavailable')) {
        errorMessage = "Dịch vụ xác thực tạm thời không khả dụng. Vui lòng thử lại sau."
      }

      setError(errorMessage)
      showToast("Đăng nhập thất bại", errorMessage, "error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#e6f7ff] to-white p-4">
      <div className="w-full max-w-[400px]">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/auth/login')}
            className="text-[#0066CC] hover:bg-[#0066CC]/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Về đăng nhập thường
          </Button>
        </div>

        {/* Hospital Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-[#0066CC] p-3 rounded-full">
              <Hospital className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Auth Service Login
          </h1>
          <p className="text-gray-600">
            Đăng nhập qua Auth Service Microservice
          </p>
        </div>

        {/* Login Form */}
        <Card className="shadow-md">
          <CardContent className="p-6">
            <h2 className="text-[#0066CC] text-xl font-bold text-center mb-6 font-poppins">
              🔐 Auth Service Test
            </h2>

            {/* Service Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Stethoscope className="w-5 h-5 text-[#0066CC]" />
                <span className="font-medium text-[#0066CC]">Auth Service Integration</span>
              </div>
              <p className="text-sm text-gray-700">
                Trang này sử dụng Auth Service microservice thay vì Supabase Auth trực tiếp.
                API calls sẽ đi qua API Gateway → Auth Service → Supabase.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4 text-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium mb-1">Đăng nhập thất bại</p>
                    <p className="text-sm">{error}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setError("")
                        clearError()
                        const emailInput = document.getElementById('email') as HTMLInputElement
                        if (emailInput) emailInput.focus()
                      }}
                      className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                    >
                      Thử lại
                    </button>
                  </div>
                </div>
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
                      Đang đăng nhập qua Auth Service...
                    </>
                  ) : (
                    "🔐 Đăng nhập qua Auth Service"
                  )}
                </Button>

                <div className="text-center space-y-2 mt-4">
                  <p className="text-[#555] text-xs">
                    <Link href="/auth/login" className="text-[#0066CC] hover:underline">
                      ← Quay lại đăng nhập thường
                    </Link>
                  </p>
                </div>
              </div>
            </form>

            {/* Demo Accounts */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 text-center mb-2 font-medium">
                🧪 Demo - Tài khoản thử nghiệm:
              </p>
              <div className="text-xs text-gray-500 space-y-1 text-center">
                <div className="p-2 bg-white rounded border">
                  <strong>Bệnh nhân:</strong> patient@hospital.vn / 123456
                </div>
                <div className="p-2 bg-white rounded border">
                  <strong>Bác sĩ:</strong> doctor@hospital.vn / 123456
                </div>
                <div className="p-2 bg-white rounded border">
                  <strong>Admin:</strong> admin@hospital.vn / 123456
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
