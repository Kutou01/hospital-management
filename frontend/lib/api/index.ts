// Export API client
export { apiClient, ApiClient, handleApiError, isApiSuccess, getApiError } from './client';

// Export authentication API
export * from './auth';

// Export all API services
export * from './doctors';
export * from './patients';
export * from './appointments';
export * from './departments';
export * from './rooms';

// Export microservices APIs
export * from './medical-records';
export * from './prescriptions';
export * from './billing';

// Re-export types for convenience
export type {
  Doctor,
  Patient,
  Appointment,
  Department,
  Room,
  ApiResponse,
  DoctorForm,
  PatientForm,
  AppointmentForm,
  DepartmentForm,
  RoomForm,
  FilterOptions,
} from '../types';
