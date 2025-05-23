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
// import { loginAction } from "./actions"

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Kiểm tra thông tin đăng nhập trực tiếp
      if (formData.email === "admin@hospital.com" && formData.password === "admin123") {
        // Giả lập đặt cookie (trong ứng dụng thực tế, điều này sẽ được xử lý bởi server)
        document.cookie = "auth_token=example-token-value; path=/; max-age=86400"
        document.cookie = "user_role=admin; path=/; max-age=86400"

        // Chuyển hướng đến trang dashboard
        router.push("/admin/dashboard")
      } else {
        setError("Email hoặc mật khẩu không đúng")
      }
    } catch (err) {
      setError("Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#e6f7ff] to-white p-4">
      <Card className="w-full max-w-[400px] shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-[#0066CC] rounded-full flex items-center justify-center text-white">
              <Hospital size={24} />
            </div>
            <h2 className="text-[#0066CC] text-xl font-bold text-center font-poppins">Login to Hospital Management</h2>
            <p className="text-[#777] text-sm text-center mt-2">Enter your credentials to access your account</p>
          </div>

          {error && <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</div>}

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
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[#0066CC]">
                    Password
                  </Label>
                  <Link href="/auth/forgot-password" className="text-xs text-[#0066CC] hover:underline">
                    Forgot?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  className="h-10 rounded-md border-[#CCC] focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC]"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="checkbox"
                  id="remember"
                  className="rounded border-gray-300 text-[#0066CC] focus:ring-[#0066CC]"
                />
                <Label htmlFor="remember" className="text-sm text-gray-600">
                  Remember me for 30 days
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full h-[45px] mt-6 bg-[#0066CC] hover:bg-[#0055AA] text-white rounded-md"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>

              <div className="text-center mt-4">
                <p className="text-[#555] text-xs">
                  Don't have an account?{" "}
                  <Link href="/auth/register" className="text-[#0066CC] hover:underline">
                    Sign Up
                  </Link>
                </p>
                <p className="text-[#555] text-xs mt-2">
                  <strong>Admin demo:</strong> admin@hospital.com / admin123
                </p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
