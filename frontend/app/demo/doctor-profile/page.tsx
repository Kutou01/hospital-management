"use client"

import React, { useState } from 'react'
import { DoctorProfilePage } from '@/components/profile/DoctorProfilePage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export default function DoctorProfileDemo() {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null)

  // Mock doctor list for demo
  const mockDoctors = [
    {
      id: "DOC-TIM-001",
      name: "Dr. Petra Winsbury",
      specialty: "General Medicine",
      department: "General"
    },
    {
      id: "DOC-TIM-002", 
      name: "Dr. John Smith",
      specialty: "Cardiology",
      department: "Cardiology"
    },
    {
      id: "DOC-NEU-001",
      name: "Dr. Sarah Johnson",
      specialty: "Neurology", 
      department: "Neurology"
    }
  ]

  if (selectedDoctorId) {
    return (
      <DoctorProfilePage 
        doctorId={selectedDoctorId}
        onBack={() => setSelectedDoctorId(null)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Doctor Profile Demo</h1>
          <p className="text-gray-600">
            Select a doctor to view their profile page with real API integration
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockDoctors.map((doctor) => (
            <Card key={doctor.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">{doctor.name}</CardTitle>
                <p className="text-sm text-gray-600">{doctor.specialty}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Department:</span> {doctor.department}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">ID:</span> {doctor.id}
                  </p>
                  <Button 
                    onClick={() => setSelectedDoctorId(doctor.id)}
                    className="w-full mt-4"
                  >
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h2 className="text-xl font-semibold text-blue-900 mb-3">API Integration Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-medium text-blue-800 mb-2">Real API Calls:</h3>
              <ul className="space-y-1 text-blue-700">
                <li>• Doctor profile data</li>
                <li>• Appointment statistics</li>
                <li>• Today's schedule</li>
                <li>• Patient reviews</li>
                <li>• Work experiences</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-blue-800 mb-2">Fallback Features:</h3>
              <ul className="space-y-1 text-blue-700">
                <li>• Mock data when API fails</li>
                <li>• Error handling with retry</li>
                <li>• Loading states</li>
                <li>• Toast notifications</li>
                <li>• Responsive design</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-medium text-yellow-800 mb-2">Note:</h3>
          <p className="text-sm text-yellow-700">
            This demo will first try to fetch real data from the backend services. 
            If the API calls fail, it will automatically fall back to mock data to demonstrate the UI.
          </p>
        </div>
      </div>
    </div>
  )
}
