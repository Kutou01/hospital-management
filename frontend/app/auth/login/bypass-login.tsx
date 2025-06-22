"use client"

import React, { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Hospital, Eye, EyeOff, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { sessionManager } from "@/lib/auth/session-manager"
import { getDashboardPath } from "@/lib/auth/dashboard-routes"

export default function BypassLoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { toast } = useToast()

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    })

    // Get redirect info
    const redirect = searchParams?.get('redirect') || null

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        if (error) setError("")
    }

    const validateForm = () => {
        if (!formData.email || !formData.password) {
            setError("Vui lòng điền đầy đủ thông tin")
            return false
        }

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
            console.log('🔐 [BypassLogin] Starting login process...')

            // Gọi API endpoint mới để bypass RLS
            const response = await fetch('/api/auth/admin-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                }),
                cache: 'no-store',
            })

            if (!response.ok) {
                // Đọc nội dung lỗi từ response
                const errorData = await response.json()
                throw new Error(errorData.error || `Lỗi ${response.status}: ${response.statusText}`)
            }

            const data = await response.json()

            console.log('✅ Bypass login successful')

            // Lưu session vào session manager
            if (data.user && data.session) {
                // Thêm flag bypassRLS vào user data
                const userData = data.user
                if (!userData.profile_data) {
                    userData.profile_data = {}
                }
                userData.profile_data.bypassRLS = true

                sessionManager.saveSession(
                    userData,
                    data.session.access_token,
                    data.session.refresh_token || '',
                    data.session.expires_in || 3600
                )

                toast({
                    title: "🎉 Đăng nhập thành công!",
                    description: "Đã bypass RLS. Chào mừng bạn!",
                    variant: "default",
                })

                // Chuyển hướng người dùng
                if (redirect) {
                    router.replace(redirect)
                } else {
                    const redirectPath = getDashboardPath(userData.role as any)
                    router.replace(redirectPath)
                }
            } else {
                throw new Error("Không nhận được thông tin người dùng hoặc phiên đăng nhập")
            }

        } catch (err: any) {
            console.error('❌ Bypass login failed:', err)
            let errorMessage = err.message || 'Unknown error'

            setError(errorMessage)
            toast({
                title: "Đăng nhập thất bại",
                description: errorMessage,
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="shadow-md">
            <CardContent className="p-6">
                <h2 className="text-red-600 text-xl font-bold text-center mb-6 font-poppins">
                    Đăng nhập (Bypass RLS)
                </h2>

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
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-red-600">
                                Email *
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="example@email.com"
                                className="h-10 rounded-md border-[#CCC] focus:border-red-600 focus:ring-1 focus:ring-red-600"
                                value={formData.email}
                                onChange={handleInputChange}
                                disabled={isLoading}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-red-600">
                                Mật khẩu *
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Nhập mật khẩu"
                                    className="h-10 rounded-md border-[#CCC] focus:border-red-600 focus:ring-1 focus:ring-red-600 pr-10"
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
                            className="w-full h-[45px] mt-6 bg-red-600 hover:bg-red-700 text-white rounded-md"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang đăng nhập...
                                </>
                            ) : (
                                "Đăng nhập (Bypass RLS)"
                            )}
                        </Button>
                    </div>
                </form>

                <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500">
                        Chế độ đăng nhập này sử dụng service role key để bypass Row Level Security
                    </p>
                </div>
            </CardContent>
        </Card>
    )
} 