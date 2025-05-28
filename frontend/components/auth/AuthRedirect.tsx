'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEnhancedAuth } from '@/lib/auth/enhanced-auth-context';

interface AuthRedirectProps {
  expectedRole?: 'admin' | 'doctor' | 'patient';
  redirectTo?: string;
  fallbackPath?: string;
}

/**
 * Component to handle authentication-based redirects
 * This component ensures proper redirect after login/registration
 */
export function AuthRedirect({
  expectedRole,
  redirectTo,
  fallbackPath = '/auth/login'
}: AuthRedirectProps) {
  const { user, loading } = useEnhancedAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Wait for auth state to load

    const handleRedirect = async (path: string) => {
      console.log(`AuthRedirect: preparing to redirect to ${path}`);
      // Add delay before redirection
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`AuthRedirect: executing redirect to ${path}`);
      router.push(path);
    };

    if (!user) {
      // User not authenticated, redirect to login
      console.log('AuthRedirect: user not authenticated, redirecting to login');
      handleRedirect(fallbackPath);
      return;
    }

    if (expectedRole && user.role !== expectedRole) {
      // User has wrong role, redirect to their dashboard
      console.log(`AuthRedirect: user has wrong role (${user.role} vs expected ${expectedRole})`);
      handleRedirect(`/${user.role}/dashboard`);
      return;
    }

    if (redirectTo) {
      // Redirect to specific path
      console.log(`AuthRedirect: redirecting to specified path: ${redirectTo}`);
      handleRedirect(redirectTo);
      return;
    }

    if (user.role) {
      // Default redirect to role-based dashboard
      console.log(`AuthRedirect: redirecting to role dashboard: /${user.role}/dashboard`);
      handleRedirect(`/${user.role}/dashboard`);
    }
  }, [user, loading, expectedRole, redirectTo, fallbackPath, router]);

  // Show loading while processing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang xử lý...</p>
        </div>
      </div>
    );
  }

  return null; // Component doesn't render anything visible
}

/**
 * Hook for programmatic redirects after authentication
 */
export function useAuthRedirect() {
  const { user, loading } = useEnhancedAuth();
  const router = useRouter();

  const redirectToDashboard = async (role?: string) => {
    const targetRole = role || user?.role;
    if (targetRole) {
      console.log(`useAuthRedirect: redirecting to dashboard for role: ${targetRole}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push(`/${targetRole}/dashboard`);
    }
  };

  const redirectToLogin = async () => {
    console.log('useAuthRedirect: redirecting to login');
    await new Promise(resolve => setTimeout(resolve, 1000));
    router.push('/auth/login');
  };

  const redirectWithDelay = (path: string, delay: number = 1000) => {
    console.log(`useAuthRedirect: redirecting to ${path} with ${delay}ms delay`);
    setTimeout(() => {
      router.push(path);
    }, delay);
  };

  return {
    user,
    loading,
    redirectToDashboard,
    redirectToLogin,
    redirectWithDelay
  };
}
