'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/lib/hooks/useSupabaseAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export function SupabaseLoginForm() {
  const router = useRouter();
  const { signIn, loading } = useSupabaseAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const result = await signIn({
        email: formData.email,
        password: formData.password
      });

      if (result.error) {
        setError(result.error);
      } else if (result.user) {
        // Redirect based on user role
        const redirectPath = `/${result.user.role}/dashboard`;
        router.push(redirectPath);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.email && formData.password;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Đăng nhập
        </CardTitle>
        <CardDescription className="text-center">
          Nhập thông tin đăng nhập của bạn
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@hospital.com"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={isSubmitting || loading}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={isSubmitting || loading}
                className="w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={isSubmitting || loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!isFormValid || isSubmitting || loading}
          >
            {isSubmitting || loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang đăng nhập...
              </>
            ) : (
              'Đăng nhập'
            )}
          </Button>

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={() => router.push('/auth/forgot-password')}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
              disabled={isSubmitting || loading}
            >
              Quên mật khẩu?
            </button>
            
            <div className="text-sm text-gray-600">
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => router.push('/auth/register')}
                className="text-blue-600 hover:text-blue-800 underline"
                disabled={isSubmitting || loading}
              >
                Đăng ký ngay
              </button>
            </div>
          </div>
        </form>

        {/* Demo credentials */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Tài khoản demo:
          </h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Admin: admin@hospital.com / admin123</div>
            <div>Bác sĩ: doctor@hospital.com / doctor123</div>
            <div>Bệnh nhân: patient@hospital.com / patient123</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading component for auth state
export function AuthLoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Đang kiểm tra trạng thái đăng nhập...</p>
      </div>
    </div>
  );
}

// Protected route wrapper
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles = [], 
  fallback 
}: ProtectedRouteProps) {
  const { user, loading } = useSupabaseAuth();
  const router = useRouter();

  if (loading) {
    return fallback || <AuthLoadingSpinner />;
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Không có quyền truy cập</h2>
              <p className="text-gray-600 mb-4">
                Bạn không có quyền truy cập vào trang này.
              </p>
              <Button onClick={() => router.back()}>
                Quay lại
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

// Role-based access components
export function AdminOnly({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      {children}
    </ProtectedRoute>
  );
}

export function DoctorOnly({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['doctor']}>
      {children}
    </ProtectedRoute>
  );
}

export function PatientOnly({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['patient']}>
      {children}
    </ProtectedRoute>
  );
}

export function MedicalStaffOnly({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin', 'doctor', 'nurse']}>
      {children}
    </ProtectedRoute>
  );
}

export function StaffOnly({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin', 'doctor', 'nurse', 'receptionist']}>
      {children}
    </ProtectedRoute>
  );
}
