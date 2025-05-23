import { apiClient } from './client';
import { Doctor, DoctorForm, ApiResponse, FilterOptions } from '../types';

// Export all other APIs
export * from './auth';
export * from './patients';
export * from './appointments';
export * from './departments';
export * from './rooms';

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

  // Get doctor's schedule
  getSchedule: async (id: string, date?: string): Promise<ApiResponse<any[]>> => {
    const params = date ? { date } : undefined;
    return apiClient.get<any[]>(`/doctors/${id}/schedule`, params);
  },

  // Update doctor's schedule
  updateSchedule: async (id: string, schedule: any): Promise<ApiResponse<any>> => {
    return apiClient.put<any>(`/doctors/${id}/schedule`, schedule);
  },

  // Get doctor's appointments
  getAppointments: async (id: string, filters?: FilterOptions): Promise<ApiResponse<any[]>> => {
    return apiClient.get<any[]>(`/doctors/${id}/appointments`, filters);
  },

  // Get doctor statistics
  getStats: async (id: string): Promise<ApiResponse<any>> => {
    return apiClient.get<any>(`/doctors/${id}/stats`);
  },

  // Upload doctor avatar
  uploadAvatar: async (id: string, file: File): Promise<ApiResponse<{ avatar_url: string }>> => {
    return apiClient.uploadFile<{ avatar_url: string }>(`/doctors/${id}/avatar`, file);
  },

  // Search doctors
  search: async (query: string): Promise<ApiResponse<Doctor[]>> => {
    return apiClient.get<Doctor[]>('/doctors/search', { q: query });
  },

  // Get available doctors for appointment
  getAvailable: async (date: string, time?: string): Promise<ApiResponse<Doctor[]>> => {
    const params = time ? { date, time } : { date };
    return apiClient.get<Doctor[]>('/doctors/available', params);
  },
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
    if (!fee) return 'Not specified';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(fee);
  },

  // Calculate experience level
  getExperienceLevel: (years?: number): string => {
    if (!years) return 'Not specified';
    if (years < 2) return 'Junior';
    if (years < 5) return 'Mid-level';
    if (years < 10) return 'Senior';
    return 'Expert';
  },

  // Validate doctor form
  validateForm: (data: DoctorForm): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    if (!data.first_name.trim()) {
      errors.first_name = 'First name is required';
    }

    if (!data.last_name.trim()) {
      errors.last_name = 'Last name is required';
    }

    if (!data.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Invalid email format';
    }

    if (!data.specialization.trim()) {
      errors.specialization = 'Specialization is required';
    }

    if (!data.license_number.trim()) {
      errors.license_number = 'License number is required';
    }

    if (!data.department_id) {
      errors.department_id = 'Department is required';
    }

    if (data.phone && !/^[0-9+\-\s()]+$/.test(data.phone)) {
      errors.phone = 'Invalid phone number format';
    }

    if (data.experience_years && (data.experience_years < 0 || data.experience_years > 50)) {
      errors.experience_years = 'Experience years must be between 0 and 50';
    }

    if (data.consultation_fee && data.consultation_fee < 0) {
      errors.consultation_fee = 'Consultation fee cannot be negative';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  // Filter doctors by criteria
  filterDoctors: (doctors: Doctor[], filters: {
    search?: string;
    department?: string;
    status?: string;
    specialization?: string;
  }): Doctor[] => {
    return doctors.filter(doctor => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = `${doctor.first_name} ${doctor.last_name}`.toLowerCase().includes(searchLower);
        const matchesEmail = doctor.email.toLowerCase().includes(searchLower);
        const matchesSpecialization = doctor.specialization.toLowerCase().includes(searchLower);

        if (!matchesName && !matchesEmail && !matchesSpecialization) {
          return false;
        }
      }

      if (filters.department && doctor.department_id !== filters.department) {
        return false;
      }

      if (filters.status && doctor.status !== filters.status) {
        return false;
      }

      if (filters.specialization && doctor.specialization !== filters.specialization) {
        return false;
      }

      return true;
    });
  },

  // Sort doctors
  sortDoctors: (doctors: Doctor[], sortBy: string, order: 'asc' | 'desc' = 'asc'): Doctor[] => {
    return [...doctors].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = `${a.first_name} ${a.last_name}`;
          bValue = `${b.first_name} ${b.last_name}`;
          break;
        case 'email':
          aValue = a.email;
          bValue = b.email;
          break;
        case 'specialization':
          aValue = a.specialization;
          bValue = b.specialization;
          break;
        case 'experience':
          aValue = a.experience_years || 0;
          bValue = b.experience_years || 0;
          break;
        case 'fee':
          aValue = a.consultation_fee || 0;
          bValue = b.consultation_fee || 0;
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
  },
};
