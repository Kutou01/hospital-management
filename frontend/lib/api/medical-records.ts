import { apiClient } from './client';
import { ApiResponse } from '../types';

// Medical Record types
export interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  visit_date: string;
  chief_complaint?: string;
  present_illness?: string;
  past_medical_history?: string;
  physical_examination?: string;
  diagnosis?: string;
  treatment_plan?: string;
  medications?: string;
  follow_up_instructions?: string;
  notes?: string;
  status: 'active' | 'archived' | 'deleted';
  created_at: string;
  updated_at: string;
}

export interface LabResult {
  id: string;
  record_id: string;
  test_name: string;
  test_type: string;
  test_date: string;
  result_value?: string;
  reference_range?: string;
  unit?: string;
  result_date?: string;
  lab_technician?: string;
  notes?: string;
  created_at: string;
}

export interface VitalSigns {
  id: string;
  record_id: string;
  recorded_at: string;
  temperature?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  oxygen_saturation?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  notes?: string;
  created_at: string;
}

export interface CreateMedicalRecordRequest {
  patient_id: string;
  doctor_id: string;
  visit_date: string;
  chief_complaint?: string;
  present_illness?: string;
  past_medical_history?: string;
  physical_examination?: string;
  diagnosis?: string;
  treatment_plan?: string;
  medications?: string;
  follow_up_instructions?: string;
  notes?: string;
}

export interface UpdateMedicalRecordRequest {
  chief_complaint?: string;
  present_illness?: string;
  past_medical_history?: string;
  physical_examination?: string;
  diagnosis?: string;
  treatment_plan?: string;
  medications?: string;
  follow_up_instructions?: string;
  notes?: string;
  status?: 'active' | 'archived' | 'deleted';
}

export interface CreateLabResultRequest {
  record_id: string;
  test_name: string;
  test_type: string;
  test_date: string;
  result_value?: string;
  reference_range?: string;
  unit?: string;
  result_date?: string;
  lab_technician?: string;
  notes?: string;
}

export interface CreateVitalSignsRequest {
  record_id: string;
  recorded_at: string;
  temperature?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  oxygen_saturation?: number;
  weight?: number;
  height?: number;
  notes?: string;
}

// Medical Records API
export const medicalRecordsApi = {
  // Medical Records CRUD
  getAllMedicalRecords: async (params?: { page?: number; limit?: number }): Promise<ApiResponse<MedicalRecord[]>> => {
    return apiClient.get<MedicalRecord[]>('/medical-records', params);
  },

  getMedicalRecordById: async (recordId: string): Promise<ApiResponse<MedicalRecord>> => {
    return apiClient.get<MedicalRecord>(`/medical-records/${recordId}`);
  },

  getMedicalRecordsByPatientId: async (patientId: string): Promise<ApiResponse<MedicalRecord[]>> => {
    return apiClient.get<MedicalRecord[]>(`/medical-records/patient/${patientId}`);
  },

  getMedicalRecordsByDoctorId: async (doctorId: string): Promise<ApiResponse<MedicalRecord[]>> => {
    return apiClient.get<MedicalRecord[]>(`/medical-records/doctor/${doctorId}`);
  },

  createMedicalRecord: async (data: CreateMedicalRecordRequest): Promise<ApiResponse<MedicalRecord>> => {
    return apiClient.post<MedicalRecord>('/medical-records', data);
  },

  // Alias for compatibility
  create: async (data: CreateMedicalRecordRequest): Promise<ApiResponse<MedicalRecord>> => {
    return apiClient.post<MedicalRecord>('/medical-records', data);
  },

  updateMedicalRecord: async (recordId: string, data: UpdateMedicalRecordRequest): Promise<ApiResponse<MedicalRecord>> => {
    return apiClient.put<MedicalRecord>(`/medical-records/${recordId}`, data);
  },

  deleteMedicalRecord: async (recordId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/medical-records/${recordId}`);
  },

  // Lab Results
  createLabResult: async (data: CreateLabResultRequest): Promise<ApiResponse<LabResult>> => {
    return apiClient.post<LabResult>('/medical-records/lab-results', data);
  },

  getLabResultsByRecordId: async (recordId: string): Promise<ApiResponse<LabResult[]>> => {
    return apiClient.get<LabResult[]>(`/medical-records/${recordId}/lab-results`);
  },

  // Vital Signs
  createVitalSigns: async (data: CreateVitalSignsRequest): Promise<ApiResponse<VitalSigns>> => {
    return apiClient.post<VitalSigns>('/medical-records/vital-signs', data);
  },

  getVitalSignsByRecordId: async (recordId: string): Promise<ApiResponse<VitalSigns[]>> => {
    return apiClient.get<VitalSigns[]>(`/medical-records/${recordId}/vital-signs`);
  },
};
