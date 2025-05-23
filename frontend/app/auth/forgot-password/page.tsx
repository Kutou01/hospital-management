"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// Import icons directly from lucide-react
import { ArrowLeft, Mail } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Reset password for:", email)
    setIsSubmitted(true)
    // Here you would typically send a password reset email
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
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-[45px] mt-6 bg-[#0066CC] hover:bg-[#0055AA] text-white rounded-md"
                >
                  Send Reset Link
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-center p-4">
              <div className="bg-green-50 text-green-700 p-4 rounded-md mb-4">
                <p>Reset link sent!</p>
                <p className="text-sm mt-1">Please check your email inbox.</p>
              </div>
              <Button onClick={() => setIsSubmitted(false)} variant="outline" className="mt-2">
                Try another email
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
