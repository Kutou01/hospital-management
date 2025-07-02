// Clean doctors API without complex dependencies
// lib/api/doctors.ts

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface FilterOptions {
  [key: string]: any;
}

interface Doctor {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  specialization: string;
  department_id: string;
  license_number: string;
  phone?: string;
  experience_years?: number;
  consultation_fee?: number;
  status: 'active' | 'inactive' | 'on_leave';
  created_at: string;
  bio?: string;
  title?: string;
  rating?: number;
  total_reviews?: number;
  patients_count?: number;
}

interface DoctorForm {
  first_name: string;
  last_name: string;
  email: string;
  specialization: string;
  department_id: string;
  license_number: string;
  phone?: string;
  experience_years?: number;
  consultation_fee?: number;
  bio?: string;
  title?: string;
}

// Simple API client
const apiClient = {
  async get<T>(url: string, params?: any): Promise<ApiResponse<T>> {
    try {
      const queryString = params ? new URLSearchParams(params).toString() : '';
      const fullUrl = `/api${url}${queryString ? `?${queryString}` : ''}`;

      console.log('Making API call to:', fullUrl);
      const response = await fetch(fullUrl);
      const result = await response.json();

      console.log('API response:', result);

      if (!response.ok) {
        throw new Error(result.message || 'API Error');
      }

      // Handle our API format: { success: true, data: [...] }
      if (result.success && result.data) {
        return { success: true, data: result.data };
      } else {
        return { success: true, data: result };
      }
    } catch (error: any) {
      console.error('API Error:', error);
      return { success: false, error: error.message };
    }
  },

  async post<T>(url: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`/api${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'API Error');
      }

      return { success: true, data: result };
    } catch (error: any) {
      console.error('API Error:', error);
      return { success: false, error: error.message };
    }
  },

  async put<T>(url: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`/api${url}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'API Error');
      }

      return { success: true, data: result };
    } catch (error: any) {
      console.error('API Error:', error);
      return { success: false, error: error.message };
    }
  },

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`/api${url}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'API Error');
      }

      return { success: true, data: result };
    } catch (error: any) {
      console.error('API Error:', error);
      return { success: false, error: error.message };
    }
  },

  async patch<T>(url: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`/api${url}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'API Error');
      }

      return { success: true, data: result };
    } catch (error: any) {
      console.error('API Error:', error);
      return { success: false, error: error.message };
    }
  }
};

// Doctors API endpoints
export const doctorsApi = {
  // Get all doctors
  getAll: async (filters?: FilterOptions): Promise<ApiResponse<Doctor[]>> => {
    return apiClient.get<Doctor[]>('/doctors', filters);
  },

  // Get doctor by ID
  getById: async (id: string): Promise<ApiResponse<Doctor>> => {
    return apiClient.get<Doctor>(`/doctors/${id}`);
  },

  // Create new doctor
  create: async (doctorData: DoctorForm): Promise<ApiResponse<Doctor>> => {
    return apiClient.post<Doctor>('/doctors', doctorData);
  },

  // Update doctor
  update: async (id: string, doctorData: Partial<DoctorForm>): Promise<ApiResponse<Doctor>> => {
    return apiClient.put<Doctor>(`/doctors/${id}`, doctorData);
  },

  // Delete doctor
  delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<{ message: string }>(`/doctors/${id}`);
  },

  // Update doctor status
  updateStatus: async (id: string, status: 'active' | 'inactive' | 'on_leave'): Promise<ApiResponse<Doctor>> => {
    return apiClient.patch<Doctor>(`/doctors/${id}/status`, { status });
  },

  // Get doctors by department
  getByDepartment: async (departmentId: string): Promise<ApiResponse<Doctor[]>> => {
    return apiClient.get<Doctor[]>(`/doctors/department/${departmentId}`);
  },

  // Search doctors
  search: async (query: string): Promise<ApiResponse<Doctor[]>> => {
    return apiClient.get<Doctor[]>('/doctors/search', { q: query });
  },

  // Get doctor's schedule
  getSchedule: async (id: string, date?: string): Promise<ApiResponse<any[]>> => {
    const params = date ? { date } : undefined;
    return apiClient.get<any[]>(`/doctors/${id}/schedule`, params);
  },

  // Get doctor's appointments
  getAppointments: async (id: string, filters?: FilterOptions): Promise<ApiResponse<any[]>> => {
    return apiClient.get<any[]>(`/doctors/${id}/appointments`, filters);
  },

  // Get doctor profile
  getProfile: async (id: string): Promise<ApiResponse<any>> => {
    return apiClient.get<any>(`/doctors/${id}/profile`);
  },

  // Get doctor reviews
  getReviews: async (id: string, page: number = 1, limit: number = 20): Promise<ApiResponse<any[]>> => {
    return apiClient.get<any[]>(`/doctors/${id}/reviews`, { page, limit });
  },

  // Get available doctors for appointment
  getAvailable: async (date: string, time?: string): Promise<ApiResponse<Doctor[]>> => {
    const params = time ? { date, time } : { date };
    return apiClient.get<Doctor[]>('/doctors/available', params);
  }
};

// Doctor utilities
export const doctorUtils = {
  // Format doctor name
  formatName: (doctor: Doctor): string => {
    return `Dr. ${doctor.first_name} ${doctor.last_name}`;
  },

  // Get doctor full name
  getFullName: (doctor: Doctor): string => {
    return `${doctor.first_name} ${doctor.last_name}`;
  },

  // Get doctor status badge color
  getStatusColor: (status: Doctor['status']): string => {
    switch (status) {
      case 'active':
        return 'green';
      case 'inactive':
        return 'red';
      case 'on_leave':
        return 'yellow';
      default:
        return 'gray';
    }
  },

  // Get doctor status label
  getStatusLabel: (status: Doctor['status']): string => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'on_leave':
        return 'On Leave';
      default:
        return 'Unknown';
    }
  },

  // Format consultation fee
  formatFee: (fee?: number): string => {
    if (!fee) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(fee);
  },

  // Calculate experience level
  getExperienceLevel: (years?: number): string => {
    if (!years) return 'Chưa xác định';
    if (years < 2) return 'Junior';
    if (years < 5) return 'Trung cấp';
    if (years < 10) return 'Cao cấp';
    return 'Chuyên gia';
  }
};