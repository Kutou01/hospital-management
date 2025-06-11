'use client';

import { supabaseClient } from '../supabase-client';

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

// API Client class
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3100') {
    this.baseUrl = baseUrl;
  }

  // Get auth token from localStorage (Auth Service) or Supabase
  private async getAuthToken(): Promise<string | null> {
    // First try to get Auth Service token
    const authServiceToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (authServiceToken) {
      return authServiceToken;
    }

    // Fallback to Supabase token
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session?.access_token || null;
  }

  // Make HTTP request
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    requireAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      // Only add auth token if required
      if (requireAuth) {
        const token = await this.getAuthToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch(`${this.baseUrl}/api${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (response.ok) {
        // Handle different response formats
        if (data.success !== undefined) {
          // Backend service response format
          return {
            success: data.success,
            data: data.data || data,
            meta: data.pagination || data.meta,
          };
        } else {
          // Direct data response
          return {
            success: true,
            data: data.data || data,
          };
        }
      } else {
        return {
          success: false,
          error: {
            message: data.error || data.message || 'Request failed',
            code: data.code,
          },
        };
      }
    } catch (error) {
      console.error('API Request Error:', error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Network error',
        },
      };
    }
  }

  // HTTP methods
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseUrl}/api${endpoint}`);
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, String(params[key]));
        }
      });
    }

    return this.makeRequest<T>(endpoint + (url.search ? `?${url.searchParams}` : ''), {
      method: 'GET',
    });
  }

  async post<T>(endpoint: string, data?: any, requireAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }, requireAuth);
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // File upload method
  async uploadFile<T>(endpoint: string, file: File): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();
      
      const formData = new FormData();
      formData.append('file', file);

      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/api${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: data.data || data,
        };
      } else {
        return {
          success: false,
          error: {
            message: data.error || data.message || 'Upload failed',
            code: data.code,
          },
        };
      }
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Upload error',
        },
      };
    }
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Helper functions
export const handleApiError = (response: ApiResponse<any>): string => {
  return response.error?.message || 'An error occurred';
};

export const isApiSuccess = <T>(response: ApiResponse<T>): response is ApiResponse<T> & { data: T } => {
  return response.success && response.data !== undefined;
};

export const getApiError = (response: ApiResponse<any>): string | null => {
  return response.error?.message || null;
};
