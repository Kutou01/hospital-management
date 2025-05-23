import { apiClient } from './client';
import { Appointment, AppointmentForm, ApiResponse, FilterOptions } from '../types';

// Appointments API endpoints
export const appointmentsApi = {
  // Get all appointments
  getAll: async (filters?: FilterOptions): Promise<ApiResponse<Appointment[]>> => {
    return apiClient.get<Appointment[]>('/appointments', filters);
  },

  // Get appointment by ID
  getById: async (id: string): Promise<ApiResponse<Appointment>> => {
    return apiClient.get<Appointment>(`/appointments/${id}`);
  },

  // Create new appointment
  create: async (appointmentData: AppointmentForm): Promise<ApiResponse<Appointment>> => {
    return apiClient.post<Appointment>('/appointments', appointmentData);
  },

  // Update appointment
  update: async (id: string, appointmentData: Partial<AppointmentForm>): Promise<ApiResponse<Appointment>> => {
    return apiClient.put<Appointment>(`/appointments/${id}`, appointmentData);
  },

  // Delete appointment
  delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<{ message: string }>(`/appointments/${id}`);
  },

  // Update appointment status
  updateStatus: async (id: string, status: Appointment['status']): Promise<ApiResponse<Appointment>> => {
    return apiClient.patch<Appointment>(`/appointments/${id}/status`, { status });
  },
};
