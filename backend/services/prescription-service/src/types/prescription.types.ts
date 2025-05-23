export interface Prescription {
  prescription_id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id?: string;
  medical_record_id?: string;
  prescription_date: Date;
  status: 'pending' | 'dispensed' | 'cancelled' | 'expired';
  notes?: string;
  total_cost?: number;
  pharmacy_notes?: string;
  dispensed_by?: string;
  dispensed_at?: Date;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by?: string;
}

export interface PrescriptionItem {
  item_id: string;
  prescription_id: string;
  medication_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  unit: string;
  instructions: string;
  cost_per_unit?: number;
  total_cost?: number;
  substitution_allowed: boolean;
  created_at: Date;
}

export interface Medication {
  medication_id: string;
  name: string;
  generic_name?: string;
  brand_name?: string;
  category: string;
  form: string; // tablet, capsule, syrup, injection, etc.
  strength: string;
  unit: string;
  manufacturer?: string;
  description?: string;
  contraindications?: string;
  side_effects?: string;
  storage_conditions?: string;
  price_per_unit?: number;
  stock_quantity?: number;
  expiry_date?: Date;
  requires_prescription: boolean;
  is_controlled_substance: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DrugInteraction {
  interaction_id: string;
  medication1_id: string;
  medication2_id: string;
  interaction_type: 'major' | 'moderate' | 'minor';
  description: string;
  severity_level: number; // 1-10
  recommendation: string;
  created_at: Date;
}

export interface PrescriptionTemplate {
  template_id: string;
  template_name: string;
  doctor_id: string;
  specialty?: string;
  condition?: string;
  template_items: PrescriptionTemplateItem[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PrescriptionTemplateItem {
  template_item_id: string;
  template_id: string;
  medication_id: string;
  medication_name: string;
  default_dosage: string;
  default_frequency: string;
  default_duration: string;
  default_quantity: number;
  default_instructions: string;
}

export interface CreatePrescriptionRequest {
  patient_id: string;
  doctor_id: string;
  appointment_id?: string;
  medical_record_id?: string;
  prescription_date: string;
  notes?: string;
  items: CreatePrescriptionItemRequest[];
}

export interface CreatePrescriptionItemRequest {
  medication_id: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions: string;
  substitution_allowed?: boolean;
}

export interface UpdatePrescriptionRequest {
  status?: 'pending' | 'dispensed' | 'cancelled' | 'expired';
  notes?: string;
  pharmacy_notes?: string;
  dispensed_by?: string;
  dispensed_at?: string;
}

export interface CreateMedicationRequest {
  name: string;
  generic_name?: string;
  brand_name?: string;
  category: string;
  form: string;
  strength: string;
  unit: string;
  manufacturer?: string;
  description?: string;
  contraindications?: string;
  side_effects?: string;
  storage_conditions?: string;
  price_per_unit?: number;
  stock_quantity?: number;
  expiry_date?: string;
  requires_prescription?: boolean;
  is_controlled_substance?: boolean;
}

export interface UpdateMedicationRequest {
  name?: string;
  generic_name?: string;
  brand_name?: string;
  category?: string;
  form?: string;
  strength?: string;
  unit?: string;
  manufacturer?: string;
  description?: string;
  contraindications?: string;
  side_effects?: string;
  storage_conditions?: string;
  price_per_unit?: number;
  stock_quantity?: number;
  expiry_date?: string;
  requires_prescription?: boolean;
  is_controlled_substance?: boolean;
  is_active?: boolean;
}

export interface PrescriptionWithDetails extends Prescription {
  items: PrescriptionItem[];
  patient_name?: string;
  doctor_name?: string;
}

export interface DrugInteractionCheck {
  has_interactions: boolean;
  interactions: DrugInteraction[];
  severity_level: 'low' | 'medium' | 'high';
  recommendations: string[];
}
