'use client';

import { useState, useEffect, useCallback } from 'react';
import { authApi, authUtils } from '../api/auth';
import { User, LoginForm, RegisterForm } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginForm) => Promise<boolean>;
  register: (userData: RegisterForm) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuth = (): AuthState & AuthActions => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = authUtils.getStoredUser();
        const isAuthenticated = authUtils.isAuthenticated();

        if (isAuthenticated && storedUser) {
          // Check if token is expired
          if (authUtils.isTokenExpired()) {
            // Try to refresh token
            const refreshResponse = await authApi.refreshToken();
            if (refreshResponse.success) {
              // Get updated user info
              const userResponse = await authApi.getCurrentUser();
              if (userResponse.success && userResponse.data) {
                setState({
                  user: userResponse.data,
                  isAuthenticated: true,
                  isLoading: false,
                  error: null,
                });
                return;
              }
            }
            // If refresh failed, clear auth
            authUtils.clearAuth();
            setState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          } else {
            setState({
              user: storedUser,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          }
        } else {
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authUtils.clearAuth();
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Failed to initialize authentication',
        });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = useCallback(async (credentials: LoginForm): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authApi.login(credentials);

      if (response.success && response.data) {
        setState({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return true;
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: response.error?.message || 'Login failed',
        }));
        return false;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Login failed. Please try again.',
      }));
      return false;
    }
  }, []);

  // Register function
  const register = useCallback(async (userData: RegisterForm): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authApi.register(userData);

      if (response.success && response.data) {
        setState({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return true;
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: response.error?.message || 'Registration failed',
        }));
        return false;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Registration failed. Please try again.',
      }));
      return false;
    }
  }, []);

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async (): Promise<void> => {
    if (!state.isAuthenticated) return;

    try {
      const response = await authApi.getCurrentUser();
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          user: response.data!,
          error: null,
        }));
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, [state.isAuthenticated]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
    refreshUser,
    clearError,
  };
};

// Auth context hook for role-based access
export const useAuthRole = () => {
  const { user, isAuthenticated } = useAuth();

  return {
    user,
    isAuthenticated,
    isAdmin: isAuthenticated && user?.role === 'admin',
    isDoctor: isAuthenticated && user?.role === 'doctor',
    isPatient: isAuthenticated && user?.role === 'patient',
    hasRole: (role: string) => isAuthenticated && user?.role === role,
    hasAnyRole: (roles: string[]) => isAuthenticated && user?.role && roles.includes(user.role),
  };
};

// Protected route hook
export const useProtectedRoute = (requiredRoles?: string[]) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  const hasAccess = () => {
    if (!isAuthenticated || !user) return false;
    if (!requiredRoles || requiredRoles.length === 0) return true;
    return requiredRoles.includes(user.role);
  };

  return {
    isAuthenticated,
    hasAccess: hasAccess(),
    isLoading,
    user,
  };
};
