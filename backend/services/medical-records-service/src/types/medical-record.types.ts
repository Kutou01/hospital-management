export interface MedicalRecord {
  record_id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id?: string;
  visit_date: Date;
  chief_complaint?: string;
  present_illness?: string;
  past_medical_history?: string;
  physical_examination?: string;
  vital_signs?: VitalSigns;
  diagnosis?: string;
  treatment_plan?: string;
  medications?: string;
  follow_up_instructions?: string;
  notes?: string;
  status: 'active' | 'archived' | 'deleted';
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}

export interface VitalSigns {
  temperature?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  oxygen_saturation?: number;
  weight?: number;
  height?: number;
  bmi?: number;
}

export interface MedicalRecordAttachment {
  attachment_id: string;
  record_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  description?: string;
  uploaded_by: string;
  uploaded_at: Date;
}

export interface LabResult {
  result_id: string;
  record_id: string;
  test_name: string;
  test_type: string;
  result_value?: string;
  reference_range?: string;
  unit?: string;
  status: 'pending' | 'completed' | 'cancelled';
  test_date: Date;
  result_date?: Date;
  lab_technician?: string;
  notes?: string;
  created_at: Date;
}

export interface VitalSignsHistory {
  vital_id: string;
  record_id: string;
  temperature?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  oxygen_saturation?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  recorded_at: Date;
  recorded_by: string;
  notes?: string;
}

export interface MedicalRecordTemplate {
  template_id: string;
  template_name: string;
  specialty?: string;
  template_content: any;
  is_active: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateMedicalRecordRequest {
  patient_id: string;
  doctor_id: string;
  appointment_id?: string;
  visit_date: string;
  chief_complaint?: string;
  present_illness?: string;
  past_medical_history?: string;
  physical_examination?: string;
  vital_signs?: VitalSigns;
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
  vital_signs?: VitalSigns;
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
  result_value?: string;
  reference_range?: string;
  unit?: string;
  test_date: string;
  result_date?: string;
  lab_technician?: string;
  notes?: string;
}

export interface CreateVitalSignsRequest {
  record_id: string;
  temperature?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  oxygen_saturation?: number;
  weight?: number;
  height?: number;
  recorded_at: string;
  notes?: string;
}
