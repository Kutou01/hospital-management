"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// Import icons directly from lucide-react
import { User, Stethoscope, Check } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const [accountType, setAccountType] = useState<"doctor" | "patient" | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    specialization: "",
    licenseNo: "",
    dateOfBirth: "",
    gender: "male",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted:", { accountType, ...formData })
    // Here you would typically send the data to your backend
    // Then redirect to login or dashboard
    router.push("/auth/login")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#e6f7ff] to-white p-4">
      <Card className="w-full max-w-[400px] shadow-md">
        <CardContent className="p-6">
          <h2 className="text-[#0066CC] text-xl font-bold text-center mb-6 font-poppins">Choose Account Type</h2>

          <div className="flex justify-center gap-4 mb-6">
            <div
              className={`relative cursor-pointer border rounded-lg p-4 flex flex-col items-center transition-all ${
                accountType === "doctor" ? "border-[#0066CC] bg-[#E6F2FF]" : "border-[#E0E0E0] hover:border-[#0066CC]"
              }`}
              onClick={() => setAccountType("doctor")}
            >
              <div className="w-20 h-20 mb-2 flex items-center justify-center">
                <div className="w-16 h-16 bg-[#E6F2FF] rounded-full flex items-center justify-center">
                  <Stethoscope size={40} className="text-[#0066CC]" />
                </div>
              </div>
              <span className="font-medium">Doctor</span>
              {accountType === "doctor" && (
                <div className="absolute bottom-2 right-2 text-[#0066CC]">
                  <Check size={16} />
                </div>
              )}
            </div>

            <div
              className={`relative cursor-pointer border rounded-lg p-4 flex flex-col items-center transition-all ${
                accountType === "patient" ? "border-[#0066CC] bg-[#E6F2FF]" : "border-[#E0E0E0] hover:border-[#0066CC]"
              }`}
              onClick={() => setAccountType("patient")}
            >
              <div className="w-20 h-20 mb-2 flex items-center justify-center">
                <div className="w-16 h-16 bg-[#E6F2FF] rounded-full flex items-center justify-center">
                  <User size={40} className="text-[#0066CC]" />
                </div>
              </div>
              <span className="font-medium">Patient</span>
              {accountType === "patient" && (
                <div className="absolute bottom-2 right-2 text-[#0066CC]">
                  <Check size={16} />
                </div>
              )}
            </div>
          </div>

          {accountType && (
            <p className="text-[#777] text-sm text-center mb-6">
              Hello {accountType === "doctor" ? "Doctor" : "Patient"}! Please fill out the form below to get started.
            </p>
          )}

          {accountType && (
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

                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-[#0066CC]">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="John Doe"
                    className="h-10 rounded-md border-[#CCC] focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC]"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {accountType === "doctor" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="specialization" className="text-[#0066CC]">
                        Specialization
                      </Label>
                      <Select
                        value={formData.specialization}
                        onValueChange={(value) => handleSelectChange("specialization", value)}
                      >
                        <SelectTrigger className="h-10 rounded-md border-[#CCC] focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC]">
                          <SelectValue placeholder="Select specialization" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cardiology">Cardiology</SelectItem>
                          <SelectItem value="neurology">Neurology</SelectItem>
                          <SelectItem value="pediatrics">Pediatrics</SelectItem>
                          <SelectItem value="orthopedics">Orthopedics</SelectItem>
                          <SelectItem value="dermatology">Dermatology</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="licenseNo" className="text-[#0066CC]">
                        Medical License No.
                      </Label>
                      <Input
                        id="licenseNo"
                        name="licenseNo"
                        type="text"
                        placeholder="ML12345678"
                        className="h-10 rounded-md border-[#CCC] focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC]"
                        value={formData.licenseNo}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </>
                )}

                {accountType === "patient" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth" className="text-[#0066CC]">
                        Date of Birth
                      </Label>
                      <Input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        className="h-10 rounded-md border-[#CCC] focus:border-[#0066CC] focus:ring-1 focus:ring-[#0066CC]"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#0066CC]">Gender</Label>
                      <RadioGroup
                        value={formData.gender}
                        onValueChange={(value) => handleSelectChange("gender", value)}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="male" id="male" />
                          <Label htmlFor="male">Male</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="female" id="female" />
                          <Label htmlFor="female">Female</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="other" id="other" />
                          <Label htmlFor="other">Other</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </>
                )}

                <Button
                  type="submit"
                  className="w-full h-[45px] mt-6 bg-[#0066CC] hover:bg-[#0055AA] text-white rounded-md"
                >
                  Sign Up
                </Button>

                <p className="text-[#555] text-xs text-center mt-4">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="text-[#0066CC] hover:underline">
                    Login
                  </Link>
                </p>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
