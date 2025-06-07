"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { supabaseClient } from '@/lib/supabase-client'
import { useToast } from "@/components/ui/toast-provider"

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Đang xử lý đăng nhập...')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash fragment from URL (for OAuth)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        
        // Get query parameters (for Magic Link)
        const accessToken = searchParams.get('access_token')
        const refreshToken = searchParams.get('refresh_token')
        const tokenType = searchParams.get('token_type')
        const type = searchParams.get('type')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        // Check for errors first
        if (error) {
          console.error('Auth callback error:', error, errorDescription)
          setStatus('error')
          setMessage(errorDescription || 'Đã xảy ra lỗi trong quá trình đăng nhập')
          showToast("❌ Lỗi đăng nhập", errorDescription || error, "error")
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/auth/login')
          }, 3000)
          return
        }

        // Handle Magic Link callback
        if (type === 'magiclink' || accessToken) {
          setMessage('Đang xử lý Magic Link...')
          
          const { data, error: sessionError } = await supabaseClient.auth.getSession()
          
          if (sessionError) {
            console.error('Session error:', sessionError)
            setStatus('error')
            setMessage('Không thể xác thực phiên đăng nhập')
            showToast("❌ Lỗi", "Không thể xác thực phiên đăng nhập", "error")
            
            setTimeout(() => {
              router.push('/auth/login')
            }, 3000)
            return
          }

          if (data.session) {
            setStatus('success')
            setMessage('Đăng nhập thành công!')
            showToast("✅ Thành công", "Đăng nhập thành công!", "success")
            
            // Get user role and redirect accordingly
            const { data: profile } = await supabaseClient
              .from('profiles')
              .select('role')
              .eq('id', data.session.user.id)
              .single()

            const role = profile?.role || 'patient'
            
            // Redirect based on role
            setTimeout(() => {
              switch (role) {
                case 'admin':
                  router.push('/admin/dashboard')
                  break
                case 'doctor':
                  router.push('/doctors/dashboard')
                  break
                case 'patient':
                  router.push('/patient/dashboard')
                  break
                default:
                  router.push('/dashboard')
              }
            }, 1500)
            return
          }
        }

        // Handle OAuth callback
        const { data, error: authError } = await supabaseClient.auth.getSession()
        
        if (authError) {
          console.error('OAuth callback error:', authError)
          setStatus('error')
          setMessage('Đã xảy ra lỗi trong quá trình xác thực OAuth')
          showToast("❌ Lỗi OAuth", authError.message, "error")
          
          setTimeout(() => {
            router.push('/auth/login')
          }, 3000)
          return
        }

        if (data.session) {
          setMessage('Đang hoàn tất đăng nhập...')
          
          // Check if user profile exists
          const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single()

          if (profileError && profileError.code === 'PGRST116') {
            // Profile doesn't exist, create one
            setMessage('Đang tạo hồ sơ người dùng...')
            
            const { error: createError } = await supabaseClient
              .from('profiles')
              .insert({
                id: data.session.user.id,
                email: data.session.user.email,
                full_name: data.session.user.user_metadata?.full_name || 
                          data.session.user.user_metadata?.name || 
                          data.session.user.email?.split('@')[0],
                role: 'patient', // Default role for OAuth users
                phone_number: data.session.user.user_metadata?.phone,
                avatar_url: data.session.user.user_metadata?.avatar_url
              })

            if (createError) {
              console.error('Error creating profile:', createError)
              setStatus('error')
              setMessage('Không thể tạo hồ sơ người dùng')
              showToast("❌ Lỗi", "Không thể tạo hồ sơ người dùng", "error")
              
              setTimeout(() => {
                router.push('/auth/login')
              }, 3000)
              return
            }

            // Create patient record for OAuth users
            await supabaseClient
              .from('patients')
              .insert({
                id: data.session.user.id,
                full_name: data.session.user.user_metadata?.full_name || 
                          data.session.user.user_metadata?.name || 
                          data.session.user.email?.split('@')[0],
                email: data.session.user.email,
                phone_number: data.session.user.user_metadata?.phone
              })
          }

          setStatus('success')
          setMessage('Đăng nhập thành công!')
          showToast("✅ Thành công", "Đăng nhập thành công!", "success")
          
          const userRole = profile?.role || 'patient'
          
          // Redirect based on role
          setTimeout(() => {
            switch (userRole) {
              case 'admin':
                router.push('/admin/dashboard')
                break
              case 'doctor':
                router.push('/doctors/dashboard')
                break
              case 'patient':
                router.push('/patient/dashboard')
                break
              default:
                router.push('/dashboard')
            }
          }, 1500)
        } else {
          // No session found
          setStatus('error')
          setMessage('Không tìm thấy phiên đăng nhập')
          showToast("❌ Lỗi", "Không tìm thấy phiên đăng nhập", "error")
          
          setTimeout(() => {
            router.push('/auth/login')
          }, 3000)
        }

      } catch (error) {
        console.error('Auth callback error:', error)
        setStatus('error')
        setMessage('Đã xảy ra lỗi không mong muốn')
        showToast("❌ Lỗi", "Đã xảy ra lỗi không mong muốn", "error")
        
        setTimeout(() => {
          router.push('/auth/login')
        }, 3000)
      }
    }

    handleAuthCallback()
  }, [router, searchParams, showToast])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            {/* Status Icon */}
            <div className="flex justify-center">
              {status === 'loading' && (
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              )}
              {status === 'success' && (
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              )}
              {status === 'error' && (
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              )}
            </div>

            {/* Status Message */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {status === 'loading' && 'Đang xử lý...'}
                {status === 'success' && 'Thành công!'}
                {status === 'error' && 'Có lỗi xảy ra'}
              </h2>
              <p className="text-gray-600">{message}</p>
            </div>

            {/* Loading Animation */}
            {status === 'loading' && (
              <div className="flex justify-center space-x-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            )}

            {/* Redirect Notice */}
            {(status === 'success' || status === 'error') && (
              <p className="text-sm text-gray-500">
                {status === 'success' 
                  ? 'Đang chuyển hướng đến trang chính...'
                  : 'Đang chuyển hướng về trang đăng nhập...'
                }
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
