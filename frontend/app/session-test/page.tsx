'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useEnhancedAuth } from '@/lib/auth/enhanced-auth-context'
import { sessionManager } from '@/lib/auth/session-manager'
import SessionSettings from '@/components/auth/SessionSettings'
import { ArrowLeft, TestTube } from 'lucide-react'
import Link from 'next/link'

export default function SessionTestPage() {
  const { user, loading } = useEnhancedAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 mb-4">Bạn cần đăng nhập để xem trang này</p>
            <Link href="/auth/login">
              <Button>Đăng nhập</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href={`/${user.role}/dashboard`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Về Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <TestTube className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Test Session Management
              </h1>
            </div>
          </div>
          <p className="text-gray-600">
            Trang này để test các tính năng quản lý session và auto-logout
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Session Settings */}
          <SessionSettings />

          {/* Test Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Hướng dẫn test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Test Auto-Clear Session:</h4>
                <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                  <li>Bật "Tự động đăng xuất khi đóng tab"</li>
                  <li>Đóng tab này hoặc đóng browser</li>
                  <li>Mở lại và thử truy cập dashboard</li>
                  <li>Bạn sẽ bị redirect về login page</li>
                </ol>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-sm">Test Manual Logout:</h4>
                <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                  <li>Nhấn "Đăng xuất ngay"</li>
                  <li>Bạn sẽ bị redirect về login page</li>
                </ol>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-sm">Test Clear Session:</h4>
                <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                  <li>Nhấn "Xóa Session"</li>
                  <li>Session sẽ bị xóa nhưng không redirect</li>
                  <li>Refresh page để thấy hiệu ứng</li>
                </ol>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>Lưu ý:</strong> Khi bật auto-clear, session sẽ được lưu trong sessionStorage 
                  thay vì localStorage, nên sẽ tự động mất khi đóng tab.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Session Debug Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
              <div>User: {user.email} ({user.role})</div>
              <div>Authenticated: {sessionManager.isAuthenticated() ? 'Yes' : 'No'}</div>
              <div>Session Valid: {sessionManager.getSession() ? 'Yes' : 'No'}</div>
              <div>Needs Refresh: {sessionManager.needsRefresh() ? 'Yes' : 'No'}</div>
              <div>Should Verify: {sessionManager.shouldVerifySession() ? 'Yes' : 'No'}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
