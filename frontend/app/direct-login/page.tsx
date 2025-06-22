"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from '@supabase/supabase-js'
import { sessionManager } from "@/lib/auth/session-manager"
import { getDashboardPath } from "@/lib/auth/dashboard-routes"

export default function DirectLogin() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            // Sử dụng API endpoint để bypass RLS
            const response = await fetch('/api/auth/admin-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password
                }),
                cache: 'no-store',
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || `Lỗi ${response.status}: ${response.statusText}`)
            }

            const data = await response.json()

            if (data.user && data.session) {
                // Thêm flag bypassRLS vào user data
                const userData = data.user
                if (!userData.profile_data) {
                    userData.profile_data = {}
                }
                userData.profile_data.bypassRLS = true

                // Lưu session
                sessionManager.saveSession(
                    userData,
                    data.session.access_token,
                    data.session.refresh_token || '',
                    data.session.expires_in || 3600
                )

                // Chuyển hướng người dùng
                const redirectPath = getDashboardPath(userData.role as any)
                router.replace(redirectPath)
            } else {
                throw new Error("Không nhận được thông tin người dùng hoặc phiên đăng nhập")
            }
        } catch (err: any) {
            setError(err.message || "Đăng nhập thất bại")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center">Đăng nhập trực tiếp</h1>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded"
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-700 mb-2">Mật khẩu</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                    >
                        {loading ? "Đang xử lý..." : "Đăng nhập"}
                    </button>
                </form>
            </div>
        </div>
    )
} 