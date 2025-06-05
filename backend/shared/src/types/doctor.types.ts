import { BaseEntity } from './common.types';

export interface Doctor extends BaseEntity {
  doctor_id: string;
  full_name: string;
  specialty: string;
  qualification: string;
  working_hours: string;
  department_id: string;
  license_number: string;
  gender: string;
  photo_url?: string;
  phone_number: string;
  email: string;
  user_id?: string; // Link to users table
}

export interface CreateDoctorRequest {
  full_name: string;
  specialty: string;
  qualification: string;
  working_hours: string;
  department_id: string;
  license_number: string;
  gender: string;
  photo_url?: string;
  phone_number: string;
  email: string;
  user_id?: string;
}

export interface UpdateDoctorRequest {
  full_name?: string;
  specialty?: string;
  qualification?: string;
  working_hours?: string;
  department_id?: string;
  license_number?: string;
  gender?: string;
  photo_url?: string;
  phone_number?: string;
  email?: string;
}

export interface DoctorSchedule {
  doctor_id: string;
  day_of_week: number; // 0-6 (Sunday-Saturday)
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface DoctorAvailability {
  doctor_id: string;
  date: Date;
  start_time: string;
  end_time: string;
  is_available: boolean;
  reason?: string; // If not available
}

export interface DoctorSearchQuery {
  specialty?: string;
  department_id?: string;
  gender?: string;
  available_date?: string;
  available_time?: string;
  search?: string; // Search by name
}

export interface DoctorWithDepartment extends Doctor {
  department_name?: string;
}

export interface DoctorStats {
  total_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  average_rating?: number;
  total_patients: number;
}
