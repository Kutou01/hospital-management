"use client"

import { useState, useEffect, createContext, useContext } from 'react';
import { apiClient, type ApiResponse, type LoginResponse, type RegisterData } from '@/lib/api-client';

interface User {
  user_id: string;
  email: string;
  role: 'admin' | 'doctor' | 'patient';
  full_name: string;
  phone_number?: string;
  is_active: boolean;
  profile_id?: string;
  created_at: string;
  last_login?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuthProvider() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthProvider must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra xem có auth token không và lấy thông tin user
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      apiClient.setToken(token);
      refreshUser();
    } else {
      setLoading(false);
    }
  }, []);

  const refreshUser = async () => {
    try {
      const response = await apiClient.getCurrentUser();
      
      if (response.data) {
        setUser(response.data);
      } else {
        // Token không hợp lệ, clear auth
        apiClient.clearToken();
        setUser(null);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      apiClient.clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await apiClient.login(email, password);
      
      if (response.error) {
        return { success: false, error: response.error };
      }

      if (response.data?.user) {
        setUser(response.data.user);
        return { success: true };
      }

      return { success: false, error: 'Đăng nhập thất bại' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Đã xảy ra lỗi không mong muốn' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setLoading(true);
      const response = await apiClient.register(userData);
      
      if (response.error) {
        return { success: false, error: response.error };
      }

      return { success: true };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: 'Đã xảy ra lỗi không mong muốn' };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export type { User };
