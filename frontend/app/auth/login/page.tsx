"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Hospital } from "lucide-react"
import { useSupabaseAuth } from "@/lib/hooks/useSupabaseAuth"

export default function LoginPage() {
  const router = useRouter()
  const { signIn, loading } = useSupabaseAuth()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (error) setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn({
        email: formData.email,
        password: formData.password
      })

      if (result.error) {
        setError(result.error)
      } else if (result.user) {
        // Chuyển hướng đến dashboard tương ứng
        const redirectPath = `/${result.user.role}/dashboard`
        router.push(redirectPath)
      }
    } catch (err) {
      console.error('Login error:', err)
      setError("Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.")
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
            >
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
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
              <div>Admin: admin@hospital.com / admin123</div>
              <div>Bác sĩ: doctor@hospital.com / doctor123</div>
              <div>Bệnh nhân: patient@hospital.com / patient123</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
