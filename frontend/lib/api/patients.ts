import { apiClient } from './client';
import { Patient, PatientForm, ApiResponse, FilterOptions } from '../types';

// Patients API endpoints
export const patientsApi = {
  // Get all patients
  getAll: async (filters?: FilterOptions): Promise<ApiResponse<Patient[]>> => {
    return apiClient.get<Patient[]>('/patients', filters);
  },

  // Get patient by ID
  getById: async (id: string): Promise<ApiResponse<Patient>> => {
    return apiClient.get<Patient>(`/patients/${id}`);
  },

  // Create new patient
  create: async (patientData: PatientForm): Promise<ApiResponse<Patient>> => {
    return apiClient.post<Patient>('/patients', patientData);
  },

  // Update patient
  update: async (id: string, patientData: Partial<PatientForm>): Promise<ApiResponse<Patient>> => {
    return apiClient.put<Patient>(`/patients/${id}`, patientData);
  },

  // Delete patient
  delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<{ message: string }>(`/patients/${id}`);
  },

  // Update patient status
  updateStatus: async (id: string, status: 'active' | 'inactive'): Promise<ApiResponse<Patient>> => {
    return apiClient.patch<Patient>(`/patients/${id}/status`, { status });
  },

  // Get patient's appointments
  getAppointments: async (id: string, filters?: FilterOptions): Promise<ApiResponse<any[]>> => {
    return apiClient.get<any[]>(`/patients/${id}/appointments`, filters);
  },

  // Get patient's medical history
  getMedicalHistory: async (id: string): Promise<ApiResponse<any[]>> => {
    return apiClient.get<any[]>(`/patients/${id}/medical-history`);
  },

  // Search patients
  search: async (query: string): Promise<ApiResponse<Patient[]>> => {
    return apiClient.get<Patient[]>('/patients/search', { q: query });
  },
};
