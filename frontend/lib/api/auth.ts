import { apiClient } from './client';
import { User, LoginForm, RegisterForm, ApiResponse } from '../types';

// Auth API endpoints
export const authApi = {
  // Login user
  login: async (credentials: LoginForm): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await apiClient.post<{ user: User; token: string }>('/auth/login', credentials);
    
    // Set token in client if login successful
    if (response.success && response.data?.token) {
      apiClient.setAuthToken(response.data.token);
      // Store token in localStorage
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  },

  // Register user
  register: async (userData: RegisterForm): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await apiClient.post<{ user: User; token: string }>('/auth/register', userData);
    
    // Set token in client if registration successful
    if (response.success && response.data?.token) {
      apiClient.setAuthToken(response.data.token);
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  },

  // Logout user
  logout: async (): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post<{ message: string }>('/auth/logout');
    
    // Clear token and user data
    apiClient.removeAuthToken();
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    
    return response;
  },

  // Get current user
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    return apiClient.get<User>('/auth/me');
  },

  // Refresh token
  refreshToken: async (): Promise<ApiResponse<{ token: string }>> => {
    const response = await apiClient.post<{ token: string }>('/auth/refresh');
    
    if (response.success && response.data?.token) {
      apiClient.setAuthToken(response.data.token);
      localStorage.setItem('auth_token', response.data.token);
    }
    
    return response;
  },

  // Change password
  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post<{ message: string }>('/auth/change-password', data);
  },

  // Forgot password
  forgotPassword: async (email: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post<{ message: string }>('/auth/forgot-password', { email });
  },

  // Reset password
  resetPassword: async (data: { token: string; password: string }): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post<{ message: string }>('/auth/reset-password', data);
  },

  // Verify email
  verifyEmail: async (token: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post<{ message: string }>('/auth/verify-email', { token });
  },

  // Resend verification email
  resendVerification: async (email: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post<{ message: string }>('/auth/resend-verification', { email });
  },
};

// Auth utilities
export const authUtils = {
  // Initialize auth from localStorage
  initializeAuth: () => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user');
    
    if (token) {
      apiClient.setAuthToken(token);
    }
    
    if (userStr) {
      try {
        return JSON.parse(userStr) as User;
      } catch (error) {
        console.error('Failed to parse user from localStorage:', error);
        localStorage.removeItem('user');
      }
    }
    
    return null;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token');
  },

  // Get stored user
  getStoredUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr) as User;
      } catch (error) {
        console.error('Failed to parse user from localStorage:', error);
        localStorage.removeItem('user');
      }
    }
    return null;
  },

  // Clear auth data
  clearAuth: () => {
    apiClient.removeAuthToken();
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  // Check if token is expired (basic check)
  isTokenExpired: (): boolean => {
    const token = localStorage.getItem('auth_token');
    if (!token) return true;
    
    try {
      // Basic JWT expiration check
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Failed to parse token:', error);
      return true;
    }
  },

  // Get user role
  getUserRole: (): string | null => {
    const user = authUtils.getStoredUser();
    return user?.role || null;
  },

  // Check if user has specific role
  hasRole: (role: string): boolean => {
    const userRole = authUtils.getUserRole();
    return userRole === role;
  },

  // Check if user is admin
  isAdmin: (): boolean => {
    return authUtils.hasRole('admin');
  },

  // Check if user is doctor
  isDoctor: (): boolean => {
    return authUtils.hasRole('doctor');
  },

  // Check if user is patient
  isPatient: (): boolean => {
    return authUtils.hasRole('patient');
  },
};
