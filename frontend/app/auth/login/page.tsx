"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Hospital } from "lucide-react"
import { useSupabaseAuth } from "@/lib/hooks/useSupabaseAuth"
import { useToast } from "@/components/ui/toast-provider"
import { AuthDebug } from "@/components/debug/AuthDebug"
import { ProfileFixer } from "@/components/debug/ProfileFixer"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn, loading } = useSupabaseAuth()
  const { showToast } = useToast()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Show success message from register page
  useEffect(() => {
    const message = searchParams.get('message')
    if (message) {
      showToast("Thông báo", message, "success")
    }
  }, [searchParams, showToast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (error) setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('🔐 Form submitted! Event:', e)
    e.preventDefault()
    setIsLoading(true)
    setError("")

    console.log('🔐 Starting login process with data:', formData)

    try {
      const result = await signIn({
        email: formData.email,
        password: formData.password
      })

      console.log('🔐 Login result:', {
        hasUser: !!result.user,
        hasSession: !!result.session,
        error: result.error,
        userRole: result.user?.role
      })

      if (result.error) {
        console.error('🔐 Login failed:', result.error)
        setError(result.error)
        showToast("Đăng nhập thất bại", result.error, "error")
      } else if (result.user && result.session) {
        console.log('🔐 Login successful for user:', {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
          full_name: result.user.full_name
        })

        // Hiển thị thông báo thành công
        const roleText = result.user.role === 'admin' ? 'Quản trị viên' :
                        result.user.role === 'doctor' ? 'Bác sĩ' : 'Bệnh nhân'
        showToast(
          "Đăng nhập thành công!",
          `Chào mừng ${roleText} ${result.user.full_name}. Đang chuyển đến dashboard...`,
          "success"
        )

        // Chuyển hướng đến dashboard tương ứng
        const redirectPath = `/${result.user.role}/dashboard`
        console.log('🔐 REDIRECT to:', redirectPath)

        // Try multiple redirect methods
        console.log('🔐 Method 1: Using router.push')
        router.push(redirectPath)

        // Fallback after delay
        setTimeout(() => {
          console.log('🔐 Method 2: Using window.location.href as fallback')
          window.location.href = redirectPath
        }, 1000)
      } else {
        console.error('🔐 Login succeeded but missing user or session data')
        setError("Đăng nhập không thành công. Vui lòng thử lại.")
        showToast("Đăng nhập thất bại", "Không thể lấy thông tin người dùng", "error")
      }
    } catch (err) {
      console.error('🔐 Login error:', err)
      setError("Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.")
      showToast("Đăng nhập thất bại", "Đã xảy ra lỗi không mong muốn", "error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#e6f7ff] to-white p-4">
      <Card className="w-full max-w-[400px] shadow-md">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-[#0066CC] p-3 rounded-full">
                <Hospital className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Đăng nhập
            </h1>
            <p className="text-gray-600">
              Chào mừng bạn quay trở lại
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1"
                placeholder="Nhập email của bạn"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Mật khẩu
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                className="mt-1"
                placeholder="Nhập mật khẩu"
                required
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="checkbox"
                  id="remember"
                  title="Remember me"
                  className="rounded border-gray-300 text-[#0066CC] focus:ring-[#0066CC]"
                />
                <Label htmlFor="remember" className="text-sm text-gray-600">
                  Ghi nhớ đăng nhập
                </Label>
              </div>

              <Link
                href="/auth/forgot-password"
                className="text-sm text-[#0066CC] hover:text-[#0052A3] font-medium"
              >
                Quên mật khẩu?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#0066CC] hover:bg-[#0052A3] text-white py-2 px-4 rounded-md transition duration-200"
              disabled={isLoading}
              onClick={(e) => {
                console.log('🔐 Button clicked!', e)
                console.log('🔐 Form data:', formData)
                console.log('🔐 Is loading:', isLoading)
              }}
            >
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>

            {/* Test button */}
            <Button
              type="button"
              onClick={() => {
                console.log('🧪 Test button clicked!')
                handleSubmit(new Event('submit') as any)
              }}
              className="w-full mt-2 bg-red-500 hover:bg-red-600 text-white"
              disabled={isLoading}
            >
              🧪 Test Login Function
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Chưa có tài khoản?{" "}
              <Link
                href="/auth/register"
                className="text-[#0066CC] hover:text-[#0052A3] font-medium"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Tài khoản demo:
            </h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Admin: admin-1748129254407@hospital.com / admin123</div>
              <div>Bệnh nhân: test@hospital.com / test123</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug component - remove in production */}
      <AuthDebug />

      {/* Profile Fixer - remove in production */}
      <ProfileFixer />

      {/* Test redirect buttons */}
      <Card className="mt-4 border-red-200 bg-red-50">
        <CardContent className="p-4">
          <h3 className="font-bold text-red-800 mb-2">🧪 Test Redirects</h3>
          <div className="space-y-2">
            <Button
              onClick={() => {
                console.log('🧪 Testing patient dashboard redirect...')
                window.location.href = '/patient/dashboard'
              }}
              className="w-full"
              variant="outline"
            >
              Test Patient Dashboard
            </Button>
            <Button
              onClick={() => {
                console.log('🧪 Testing doctor dashboard redirect...')
                window.location.href = '/doctor/dashboard'
              }}
              className="w-full"
              variant="outline"
            >
              Test Doctor Dashboard
            </Button>
            <Button
              onClick={() => {
                console.log('🧪 Testing admin dashboard redirect...')
                window.location.href = '/admin/dashboard'
              }}
              className="w-full"
              variant="outline"
            >
              Test Admin Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
