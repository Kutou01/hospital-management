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

// Doctor Schedule Management
export interface DoctorSchedule {
  schedule_id: string;
  doctor_id: string;
  day_of_week: number; // 0-6 (Sunday-Saturday)
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  is_available: boolean;
  break_start?: string; // Optional break time
  break_end?: string;
  max_appointments?: number; // Max appointments per slot
  slot_duration?: number; // Duration in minutes
  created_at: Date;
  updated_at: Date;
}

export interface CreateScheduleRequest {
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  break_start?: string;
  break_end?: string;
  max_appointments?: number;
  slot_duration?: number;
}

export interface UpdateScheduleRequest {
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
  is_available?: boolean;
  break_start?: string;
  break_end?: string;
  max_appointments?: number;
  slot_duration?: number;
}

// Doctor Reviews and Ratings
export interface DoctorReview {
  review_id: string;
  doctor_id: string;
  patient_id: string;
  appointment_id?: string;
  rating: number; // 1-5 stars
  review_text?: string;
  review_date: Date;
  is_anonymous: boolean;
  is_verified: boolean; // Verified if from actual appointment
  helpful_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateReviewRequest {
  doctor_id: string;
  patient_id: string;
  appointment_id?: string;
  rating: number;
  review_text?: string;
  is_anonymous?: boolean;
}

export interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  rating_distribution: {
    five_star: number;
    four_star: number;
    three_star: number;
    two_star: number;
    one_star: number;
  };
  recent_reviews: DoctorReview[];
}

// Doctor Shifts Management
export interface DoctorShift {
  shift_id: string;
  doctor_id: string;
  shift_type: 'morning' | 'afternoon' | 'night' | 'emergency';
  shift_date: Date;
  start_time: string;
  end_time: string;
  department_id: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  is_emergency_shift: boolean;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateShiftRequest {
  doctor_id: string;
  shift_type: 'morning' | 'afternoon' | 'night' | 'emergency';
  shift_date: Date;
  start_time: string;
  end_time: string;
  department_id: string;
  is_emergency_shift?: boolean;
  notes?: string;
}

export interface UpdateShiftRequest {
  shift_type?: 'morning' | 'afternoon' | 'night' | 'emergency';
  shift_date?: Date;
  start_time?: string;
  end_time?: string;
  department_id?: string;
  status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  is_emergency_shift?: boolean;
  notes?: string;
}

// Doctor Experience and Education
export interface DoctorExperience {
  experience_id: string;
  doctor_id: string;
  institution_name: string;
  position: string;
  start_date: Date;
  end_date?: Date;
  is_current: boolean;
  description?: string;
  experience_type: 'work' | 'education' | 'certification' | 'research';
  created_at: Date;
  updated_at: Date;
}

export interface CreateExperienceRequest {
  doctor_id: string;
  institution_name: string;
  position: string;
  start_date: Date;
  end_date?: Date;
  is_current?: boolean;
  description?: string;
  experience_type: 'work' | 'education' | 'certification' | 'research';
}

// Enhanced Doctor Profile
export interface DoctorProfile extends Doctor {
  bio?: string;
  experience_years?: number;
  consultation_fee?: number;
  languages_spoken?: string[];
  certifications?: string[];
  awards?: string[];
  research_interests?: string[];
  schedule?: DoctorSchedule[];
  reviews?: DoctorReview[];
  review_stats?: ReviewStats;
  experiences?: DoctorExperience[];
  current_shifts?: DoctorShift[];
}
