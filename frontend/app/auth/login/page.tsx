"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Hospital, Eye, EyeOff, Loader2, Calendar, Stethoscope, ArrowLeft, Mail, Phone } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-wrapper"
import { useToast } from "@/components/ui/toast-provider"
import { getDashboardPath } from "@/lib/auth/dashboard-routes"
import OAuthLoginButtons from "@/components/auth/OAuthLoginButtons"
import MagicLinkLogin from "@/components/auth/MagicLinkLogin"
import PhoneAuthForm from "@/components/auth/PhoneAuthForm"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const { user, signIn, loading: authLoading, isAuthenticated, clearError } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loginMethod, setLoginMethod] = useState<'email' | 'magic' | 'phone' | 'oauth'>('email')
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  // Get redirect and booking info
  const redirect = searchParams.get('redirect')
  const isFromBooking = redirect === 'booking'
  const selectedDoctorId = typeof window !== 'undefined' ? localStorage.getItem('selectedDoctorId') : null

  // Show success message from register page
  useEffect(() => {
    const message = searchParams.get('message')
    if (message) {
      showToast("Thông báo", message, "success")
    }
  }, [searchParams, showToast])

  // Auto-redirect if user is already authenticated
  useEffect(() => {
    // Add debug logging
    console.log('🔍 [Login] Auth state:', {
      user: !!user,
      authLoading,
      isAuthenticated,
      userRole: user?.role,
      isActive: user?.is_active,
      isRedirecting
    })

    // Don't auto-redirect if coming from registration or booking
    const fromRegister = searchParams.get('from_register')
    const hasMessage = searchParams.get('message')

    if (fromRegister || hasMessage || isFromBooking || authLoading || isRedirecting) {
      console.log('🔄 [Login] Skipping auth check - special case or loading')
      return
    }

    // Only redirect if we have a stable authenticated state
    if (isAuthenticated && user && user.role && user.is_active && !authLoading) {
      console.log('🔄 [Login] User already logged in, redirecting to dashboard...')
      setIsRedirecting(true)
      const redirectPath = getDashboardPath(user.role as any)

      // Add a small delay to prevent rapid redirects
      setTimeout(() => {
        router.replace(redirectPath)
      }, 100)
    }
  }, [user, authLoading, isAuthenticated, router, searchParams, isFromBooking, isRedirecting])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear errors when user starts typing
    if (error) setError("")
    clearError() // Clear context error as well
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
    clearError() // Clear context error as well

    try {
      console.log('🔐 [Login] Starting login process...')

      await signIn(formData.email, formData.password)

      console.log('✅ Login successful')
      showToast("🎉 Đăng nhập thành công!", "Chào mừng bạn!", "success")

    } catch (err: any) {
      console.error('❌ Login failed:', err)
      let errorMessage = err.message || 'Unknown error'

      // Handle specific error cases - these are now handled in the enhanced auth context
      // but we keep this for backward compatibility
      if (errorMessage.includes('Invalid login credentials') || errorMessage.includes('Invalid email or password')) {
        errorMessage = "Email hoặc mật khẩu không đúng. Vui lòng thử lại."
      } else if (errorMessage.includes('Email not confirmed')) {
        errorMessage = "Email chưa được xác nhận. Vui lòng kiểm tra email và xác nhận tài khoản."
      } else if (errorMessage.includes('Too many requests')) {
        errorMessage = "Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau."
      }

      setError(errorMessage)
      showToast("Đăng nhập thất bại", errorMessage, "error")
    } finally {
      setIsLoading(false)
    }
  }

  // Get doctor info if coming from booking
  const getDoctorInfo = () => {
    if (!selectedDoctorId) return null

    // Mock doctor data (in real app, you'd fetch from API)
    const doctors = [
      { id: 1, name: 'Dr. Nguyễn Văn An', specialty: 'Tim mạch' },
      { id: 2, name: 'Dr. Trần Thị Bình', specialty: 'Nhi khoa' },
      { id: 3, name: 'Dr. Lê Minh Cường', specialty: 'Thần kinh' },
      { id: 4, name: 'Dr. Phạm Thị Dung', specialty: 'Phụ khoa' },
      { id: 5, name: 'Dr. Hoàng Đức', specialty: 'Chấn thương chỉnh hình' },
      { id: 6, name: 'Dr. Võ Thị Hoa', specialty: 'Da liễu' }
    ]

    return doctors.find(d => d.id === parseInt(selectedDoctorId))
  }

  const doctorInfo = getDoctorInfo()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#e6f7ff] to-white p-4">
      <div className="w-full max-w-[400px]">
        {/* Back Button - only show if not from booking */}
        {!isFromBooking && (
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="text-[#0066CC] hover:bg-[#0066CC]/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Về trang chủ
            </Button>
          </div>
        )}

        {/* Booking Context Banner */}
        {isFromBooking && doctorInfo && (
          <Card className="mb-6 border-l-4 border-l-[#0066CC] shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0066CC] rounded-full flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Đặt lịch khám với</p>
                  <p className="font-semibold text-[#0066CC]">{doctorInfo.name}</p>
                  <p className="text-xs text-gray-500">{doctorInfo.specialty}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
            {isFromBooking ? 'Đăng nhập để đặt lịch khám' : 'Chào mừng bạn quay trở lại'}
          </p>
        </div>

        {/* Login Form */}
        <Card className="shadow-md">
          <CardContent className="p-6">
            <h2 className="text-[#0066CC] text-xl font-bold text-center mb-6 font-poppins">
              Đăng nhập
            </h2>

            {/* Booking Notice */}
            {isFromBooking && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-[#0066CC]" />
                  <span className="font-medium text-[#0066CC]">Đặt lịch khám</span>
                </div>
                <p className="text-sm text-gray-700">
                  Vui lòng đăng nhập để tiếp tục đặt lịch khám.
                  {doctorInfo && ` Bạn đang đặt lịch với ${doctorInfo.name}.`}
                </p>
              </div>
            )}

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
                        // Focus on email field for retry
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

            {/* Login Method Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Button
                type="button"
                variant={loginMethod === 'email' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLoginMethod('email')}
                className={loginMethod === 'email' ? 'bg-[#0066CC] text-white' : 'text-[#0066CC] border-[#0066CC]'}
              >
                Email
              </Button>
              <Button
                type="button"
                variant={loginMethod === 'magic' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLoginMethod('magic')}
                className={loginMethod === 'magic' ? 'bg-[#0066CC] text-white' : 'text-[#0066CC] border-[#0066CC]'}
              >
                <Mail className="w-4 h-4 mr-1" />
                Magic Link
              </Button>
              <Button
                type="button"
                variant={loginMethod === 'phone' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLoginMethod('phone')}
                className={loginMethod === 'phone' ? 'bg-[#0066CC] text-white' : 'text-[#0066CC] border-[#0066CC]'}
              >
                <Phone className="w-4 h-4 mr-1" />
                SMS
              </Button>
              <Button
                type="button"
                variant={loginMethod === 'oauth' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLoginMethod('oauth')}
                className={loginMethod === 'oauth' ? 'bg-[#0066CC] text-white' : 'text-[#0066CC] border-[#0066CC]'}
              >
                OAuth
              </Button>
            </div>

            {/* Email/Password Login */}
            {loginMethod === 'email' && (
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
                    ) : isFromBooking ? (
                      <>
                        <Calendar className="mr-2 h-4 w-4" />
                        Đăng nhập và đặt lịch
                      </>
                    ) : (
                      "Đăng nhập"
                    )}
                  </Button>

                  <div className="text-center space-y-2 mt-4">
                    <p className="text-[#555] text-xs">
                      Chưa có tài khoản?{" "}
                      <Link
                        href={`/auth/register${isFromBooking ? '?redirect=booking' : ''}`}
                        className="text-[#0066CC] hover:underline"
                      >
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
            )}

            {/* Magic Link Login */}
            {loginMethod === 'magic' && (
              <MagicLinkLogin
                onBack={() => setLoginMethod('email')}
              />
            )}

            {/* Phone Auth */}
            {loginMethod === 'phone' && (
              <PhoneAuthForm
                onBack={() => setLoginMethod('email')}
                onSuccess={() => {
                  showToast("✅ Thành công", "Đăng nhập thành công!", "success")
                  // Redirect will be handled by auth context
                }}
              />
            )}

            {/* OAuth Login */}
            {loginMethod === 'oauth' && (
              <div className="space-y-4">
                <OAuthLoginButtons showTitle={false} />
                <div className="text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setLoginMethod('email')}
                    className="text-[#0066CC]"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Quay lại đăng nhập email
                  </Button>
                </div>
              </div>
            )}

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

        {/* Quick Actions for Booking */}
        {isFromBooking && (
          <div className="mt-6 text-center">
            <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <p className="text-sm text-gray-700 mb-3">
                🚀 <strong>Lần đầu sử dụng?</strong>
              </p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/auth/register?redirect=booking`)}
                  className="w-full border-[#0066CC] text-[#0066CC] hover:bg-[#0066CC] hover:text-white"
                >
                  Tạo tài khoản mới (2 phút)
                </Button>
                <p className="text-xs text-gray-600">
                  Hoặc quay lại{" "}
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('selectedDoctorId')
                      router.push('/doctors')
                    }}
                    className="text-[#0066CC] hover:underline"
                  >
                    danh sách bác sĩ
                  </button>
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}