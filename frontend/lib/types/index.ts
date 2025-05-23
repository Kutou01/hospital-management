// Base types
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// User types
export interface User extends BaseEntity {
  email: string;
  role: 'admin' | 'doctor' | 'patient';
  profile?: UserProfile;
}

export interface UserProfile {
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
}

// Doctor types
export interface Doctor extends BaseEntity {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  specialization: string;
  license_number: string;
  department_id: string;
  status: 'active' | 'inactive' | 'on_leave';
  avatar_url?: string;
  bio?: string;
  experience_years?: number;
  consultation_fee?: number;
  department?: Department;
}

// Patient types
export interface Patient extends BaseEntity {
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  blood_type?: string;
  allergies?: string;
  medical_history?: string;
  insurance_number?: string;
  status: 'active' | 'inactive';
}

// Appointment types
export interface Appointment extends BaseEntity {
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  type: 'consultation' | 'follow_up' | 'emergency' | 'routine_checkup';
  notes?: string;
  symptoms?: string;
  diagnosis?: string;
  prescription?: string;
  patient?: Patient;
  doctor?: Doctor;
}

// Department types
export interface Department extends BaseEntity {
  name: string;
  description?: string;
  head_doctor_id?: string;
  location?: string;
  phone?: string;
  email?: string;
  status: 'active' | 'inactive';
  head_doctor?: Doctor;
}

// Room types
export interface Room extends BaseEntity {
  room_number: string;
  room_type: 'consultation' | 'surgery' | 'emergency' | 'ward' | 'icu' | 'laboratory';
  department_id: string;
  capacity: number;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  equipment?: string;
  notes?: string;
  department?: Department;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  role: 'admin' | 'doctor' | 'patient';
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface DoctorForm {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  specialization: string;
  license_number: string;
  department_id: string;
  bio?: string;
  experience_years?: number;
  consultation_fee?: number;
}

export interface PatientForm {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  blood_type?: string;
  allergies?: string;
  medical_history?: string;
  insurance_number?: string;
}

export interface AppointmentForm {
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  type: 'consultation' | 'follow_up' | 'emergency' | 'routine_checkup';
  notes?: string;
  symptoms?: string;
}

export interface DepartmentForm {
  name: string;
  description?: string;
  head_doctor_id?: string;
  location?: string;
  phone?: string;
  email?: string;
}

export interface RoomForm {
  room_number: string;
  room_type: 'consultation' | 'surgery' | 'emergency' | 'ward' | 'icu' | 'laboratory';
  department_id: string;
  capacity: number;
  equipment?: string;
  notes?: string;
}

// Filter and search types
export interface FilterOptions {
  search?: string;
  status?: string;
  department_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Dashboard types
export interface DashboardStats {
  total_patients: number;
  total_doctors: number;
  total_appointments: number;
  total_departments: number;
  appointments_today: number;
  appointments_this_week: number;
  appointments_this_month: number;
  revenue_this_month: number;
}

// Navigation types
export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  badge?: string | number;
  children?: NavItem[];
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Status types
export type Status = 'loading' | 'success' | 'error' | 'idle';

// Toast types
export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}
