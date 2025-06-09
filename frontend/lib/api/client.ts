'use client';

import axios, { AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig, AxiosHeaderValue, AxiosHeaders } from 'axios';

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  timeout: 15000, // 15 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from local storage if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;

    // If token exists, add it to the headers
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Any status code in range of 2xx
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized errors - token expired
    if (error.response?.status === 401 && !originalRequest._retry && typeof window !== 'undefined') {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refreshToken');

        if (refreshToken) {
          const response = await axios.post('/api/auth/refresh', {
            refreshToken
          });

          if (response.data?.token) {
            // Update tokens
            localStorage.setItem('userToken', response.data.token);
            localStorage.setItem('refreshToken', response.data.refreshToken);

            // Update the authorization header
            apiClient.defaults.headers.common['Authorization'] =
              `Bearer ${response.data.token}`;

            // Retry the original request
            return apiClient(originalRequest);
          }
        }

        // If refresh token doesn't exist or failed to refresh
        // Redirect to login
        localStorage.removeItem('userToken');
        localStorage.removeItem('refreshToken');

        // Check if we're in the browser environment
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login?session=expired';
        }
      } catch (refreshError) {
        // Failed to refresh token
        localStorage.removeItem('userToken');
        localStorage.removeItem('refreshToken');

        // Redirect to login
        window.location.href = '/auth/login?session=expired';
      }
    }

    return Promise.reject(error);
  }
);

// API Client class - fixed
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3100') {
    this.baseUrl = baseUrl;
  }

  // Get auth token from localStorage instead of Supabase
  private async getAuthToken(): Promise<string | null> {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userToken');
    }
    return null;
  }

  // Make HTTP request
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers as Record<string, string>,
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/api${endpoint}`, {
        ...options,
        headers,
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
            message: data.error || data.message || 'Request failed',
            code: data.code,
          },
        };
      }
    } catch (error) {
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

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
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

      const headers: Record<string, string> = {};
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

// Helper functions for API responses
export const handleApiError = (response: ApiResponse<any>): string => {
  return response.error?.message || 'An unexpected error occurred';
};

export const isApiSuccess = <T>(response: ApiResponse<T>): response is ApiResponse<T> & { data: T } => {
  return response.success === true && response.data !== undefined;
};

export const getApiError = (response: ApiResponse<any>): string | null => {
  return response.error?.message || null;
};
