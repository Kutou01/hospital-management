"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Lock, Loader2, Eye, EyeOff, CheckCircle } from "lucide-react"
import { supabaseAuth } from "@/lib/auth/supabase-auth"
import { useToast } from "@/components/ui/toast-provider"
import { PasswordStrengthIndicator, validatePasswordStrength } from "@/components/auth/PasswordStrengthIndicator"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null)

  // Check if we have valid reset token
  useEffect(() => {
    const checkToken = async () => {
      const accessToken = searchParams.get('access_token')
      const refreshToken = searchParams.get('refresh_token')
      
      if (!accessToken || !refreshToken) {
        setIsValidToken(false)
        return
      }
      
      try {
        // Set the session with the tokens from URL
        const { data, error } = await supabaseAuth.supabaseClient.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        })
        
        if (error || !data.user) {
          setIsValidToken(false)
        } else {
          setIsValidToken(true)
        }
      } catch (error) {
        setIsValidToken(false)
      }
    }
    
    checkToken()
  }, [searchParams])

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.password) {
      newErrors.password = "Mật khẩu không được để trống"
    } else {
      const passwordValidation = validatePasswordStrength(formData.password)
      if (!passwordValidation.isValid) {
        newErrors.password = "Mật khẩu không đáp ứng yêu cầu bảo mật"
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const result = await supabaseAuth.updatePassword(formData.password)
      
      if (result.error) {
        showToast("❌ Lỗi", result.error, "error")
        setErrors({ general: result.error })
      } else {
        setIsSuccess(true)
        showToast("✅ Thành công", "Mật khẩu đã được cập nhật thành công!", "success")
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/auth/login')
        }, 3000)
      }
    } catch (error) {
      const errorMessage = "Đã xảy ra lỗi khi cập nhật mật khẩu"
      showToast("❌ Lỗi", errorMessage, "error")
      setErrors({ general: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  // Loading state while checking token
  if (isValidToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#e6f7ff] to-white p-4">
        <Card className="w-full max-w-[400px] shadow-md">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#0066CC]" />
            <p className="text-gray-600">Đang xác thực...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Invalid token
  if (isValidToken === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#e6f7ff] to-white p-4">
        <Card className="w-full max-w-[400px] shadow-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-4">
                <Lock size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Link không hợp lệ</h2>
              <p className="text-gray-600 mb-6">
                Link đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu link mới.
              </p>
              <div className="space-y-2">
                <Link href="/auth/forgot-password">
                  <Button className="w-full bg-[#0066CC] hover:bg-[#0055AA]">
                    Yêu cầu link mới
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" className="w-full">
                    Quay lại đăng nhập
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#e6f7ff] to-white p-4">
        <Card className="w-full max-w-[400px] shadow-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4">
                <CheckCircle size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Thành công!</h2>
              <p className="text-gray-600 mb-6">
                Mật khẩu của bạn đã được cập nhật thành công. Bạn sẽ được chuyển hướng đến trang đăng nhập.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-700">
                  Đang chuyển hướng trong 3 giây...
                </p>
              </div>
              <Link href="/auth/login">
                <Button className="w-full bg-[#0066CC] hover:bg-[#0055AA]">
                  Đăng nhập ngay
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#e6f7ff] to-white p-4">
      <Card className="w-full max-w-[400px] shadow-md">
        <CardContent className="p-6">
          <Link href="/auth/login" className="flex items-center text-[#0066CC] text-sm mb-6 hover:underline">
            <ArrowLeft size={16} className="mr-1" />
            Quay lại đăng nhập
          </Link>

          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-[#0066CC] rounded-full flex items-center justify-center text-white mb-3">
              <Lock size={24} />
            </div>
            <h2 className="text-[#0066CC] text-xl font-bold text-center font-poppins">Đặt lại mật khẩu</h2>
            <p className="text-[#777] text-sm text-center mt-2">
              Nhập mật khẩu mới cho tài khoản của bạn
            </p>
          </div>

          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-700 text-sm">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#0066CC]">
                  Mật khẩu mới
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu mới"
                    className="h-10 rounded-md border-[#CCC] focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC] pr-10"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm">{errors.password}</p>
                )}
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <PasswordStrengthIndicator password={formData.password} />
              )}

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[#0066CC]">
                  Xác nhận mật khẩu
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu mới"
                    className="h-10 rounded-md border-[#CCC] focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC] pr-10"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
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
                    Đang cập nhật...
                  </>
                ) : (
                  "Cập nhật mật khẩu"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
