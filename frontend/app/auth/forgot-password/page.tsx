"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// Import icons directly from lucide-react
import { ArrowLeft, Mail, Loader2 } from "lucide-react"
import { supabaseAuth } from "@/lib/auth/supabase-auth"
import { useToast } from "@/components/ui/toast-provider"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      setError("Vui lòng nhập email")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const result = await supabaseAuth.resetPassword(email)

      if (result.error) {
        setError(result.error)
        showToast("❌ Lỗi", result.error, "error")
      } else {
        setIsSubmitted(true)
        showToast("✅ Thành công", "Email đặt lại mật khẩu đã được gửi!", "success")
      }
    } catch (error) {
      const errorMessage = "Đã xảy ra lỗi khi gửi email đặt lại mật khẩu"
      setError(errorMessage)
      showToast("❌ Lỗi", errorMessage, "error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#e6f7ff] to-white p-4">
      <Card className="w-full max-w-[400px] shadow-md">
        <CardContent className="p-6">
          <Link href="/auth/login" className="flex items-center text-[#0066CC] text-sm mb-6 hover:underline">
            <ArrowLeft size={16} className="mr-1" />
            Back to login
          </Link>

          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-[#0066CC] rounded-full flex items-center justify-center text-white">
              <Mail size={24} />
            </div>
            <h2 className="text-[#0066CC] text-xl font-bold text-center font-poppins">Forgot Password</h2>
            <p className="text-[#777] text-sm text-center mt-2">
              Enter your email and we'll send you a link to reset your password
            </p>
          </div>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#0066CC]">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="h-10 rounded-md border-[#CCC] focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC]"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setError("")
                    }}
                    required
                    disabled={isLoading}
                  />
                  {error && (
                    <p className="text-red-500 text-sm mt-1">{error}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-[45px] mt-6 bg-[#0066CC] hover:bg-[#0055AA] text-white rounded-md"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    "Gửi link đặt lại mật khẩu"
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-center p-4">
              <div className="bg-green-50 text-green-700 p-4 rounded-md mb-4">
                <p className="font-medium">Email đã được gửi!</p>
                <p className="text-sm mt-1">Vui lòng kiểm tra hộp thư email của bạn và làm theo hướng dẫn để đặt lại mật khẩu.</p>
                <p className="text-xs mt-2 text-green-600">Nếu không thấy email, hãy kiểm tra thư mục spam.</p>
              </div>
              <div className="space-y-2">
                <Button onClick={() => {
                  setIsSubmitted(false)
                  setEmail("")
                  setError("")
                }} variant="outline" className="w-full">
                  Thử email khác
                </Button>
                <Link href="/auth/login">
                  <Button variant="ghost" className="w-full text-[#0066CC]">
                    Quay lại đăng nhập
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
