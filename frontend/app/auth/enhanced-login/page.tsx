'use client'

import { Suspense } from 'react'
import { EnhancedAuthProvider } from '@/lib/auth/enhanced-auth-context'
import MultiMethodLogin from '@/components/auth/MultiMethodLogin'
import { Card, CardContent } from '@/components/ui/card'

export default function EnhancedLoginPage() {
  return (
    <EnhancedAuthProvider>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Hospital Management
            </h1>
            <p className="text-gray-600">
              Hệ thống quản lý bệnh viện hiện đại
            </p>
            <div className="mt-4 flex justify-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Multi-method Auth
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Enhanced Security
              </div>
            </div>
          </div>

          {/* Enhanced Multi-Method Login */}
          <Suspense fallback={
            <Card className="w-full">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          }>
            <MultiMethodLogin />
          </Suspense>

          {/* Features Showcase */}
          <div className="mt-8 grid grid-cols-2 gap-4 text-center">
            <div className="bg-white/50 rounded-lg p-4">
              <div className="text-blue-600 mb-2">
                <svg className="h-6 w-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-sm">Bảo mật cao</h3>
              <p className="text-xs text-gray-600">2FA & Biometric</p>
            </div>
            
            <div className="bg-white/50 rounded-lg p-4">
              <div className="text-green-600 mb-2">
                <svg className="h-6 w-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-sm">Nhanh chóng</h3>
              <p className="text-xs text-gray-600">Magic Link & OTP</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              © 2024 Hospital Management System. All rights reserved.
            </p>
            <div className="mt-2 flex justify-center space-x-4 text-xs text-gray-400">
              <a href="/privacy" className="hover:text-gray-600">Privacy Policy</a>
              <a href="/terms" className="hover:text-gray-600">Terms of Service</a>
              <a href="/support" className="hover:text-gray-600">Support</a>
            </div>
          </div>
        </div>
      </div>
    </EnhancedAuthProvider>
  )
}
