import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@hospital/shared';
import {
  Prescription,
  PrescriptionItem,
  Medication,
  DrugInteraction,
  CreatePrescriptionRequest,
  UpdatePrescriptionRequest,
  CreateMedicationRequest,
  UpdateMedicationRequest,
  PrescriptionWithDetails,
  DrugInteractionCheck
} from '../types/prescription.types';

export class PrescriptionRepository {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  // Prescription methods
  async findAllPrescriptions(limit: number = 50, offset: number = 0): Promise<Prescription[]> {
    try {
      const { data, error } = await this.supabase
        .from('prescriptions')
        .select('*')
        .order('prescription_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data?.map(this.mapSupabasePrescriptionToPrescription) || [];
    } catch (error) {
      logger.error('Error fetching prescriptions', { error });
      throw error;
    }
  }

  async findPrescriptionById(prescriptionId: string): Promise<PrescriptionWithDetails | null> {
    try {
      // Get prescription
      const { data: prescriptionData, error: prescriptionError } = await this.supabase
        .from('prescriptions')
        .select('*')
        .eq('prescription_id', prescriptionId)
        .single();

      if (prescriptionError) {
        if (prescriptionError.code === 'PGRST116') return null;
        throw prescriptionError;
      }

      // Get prescription items
      const { data: itemsData, error: itemsError } = await this.supabase
        .from('prescription_items')
        .select('*')
        .eq('prescription_id', prescriptionId);

      if (itemsError) throw itemsError;

      const prescription = this.mapSupabasePrescriptionToPrescription(prescriptionData);
      const items = itemsData?.map(this.mapSupabasePrescriptionItemToPrescriptionItem) || [];

      return {
        ...prescription,
        items
      };
    } catch (error) {
      logger.error('Error fetching prescription by ID', { error, prescriptionId });
      throw error;
    }
  }

  async findPrescriptionsByPatientId(patientId: string): Promise<Prescription[]> {
    try {
      const { data, error } = await this.supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .order('prescription_date', { ascending: false });

      if (error) throw error;
      return data?.map(this.mapSupabasePrescriptionToPrescription) || [];
    } catch (error) {
      logger.error('Error fetching prescriptions by patient ID', { error, patientId });
      throw error;
    }
  }

  async findPrescriptionsByDoctorId(doctorId: string): Promise<Prescription[]> {
    try {
      const { data, error } = await this.supabase
        .from('prescriptions')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('prescription_date', { ascending: false });

      if (error) throw error;
      return data?.map(this.mapSupabasePrescriptionToPrescription) || [];
    } catch (error) {
      logger.error('Error fetching prescriptions by doctor ID', { error, doctorId });
      throw error;
    }
  }

  async createPrescription(prescriptionData: CreatePrescriptionRequest, createdBy: string): Promise<PrescriptionWithDetails> {
    try {
      const prescriptionId = await this.generatePrescriptionId();
      
      // Calculate total cost
      let totalCost = 0;
      for (const item of prescriptionData.items) {
        const medication = await this.findMedicationById(item.medication_id);
        if (medication?.price_per_unit) {
          totalCost += medication.price_per_unit * item.quantity;
        }
      }

      const supabasePrescription = {
        prescription_id: prescriptionId,
        patient_id: prescriptionData.patient_id,
        doctor_id: prescriptionData.doctor_id,
        appointment_id: prescriptionData.appointment_id,
        medical_record_id: prescriptionData.medical_record_id,
        prescription_date: prescriptionData.prescription_date,
        notes: prescriptionData.notes,
        total_cost: totalCost,
        created_by: createdBy,
        updated_by: createdBy
      };

      // Insert prescription
      const { data: prescriptionResult, error: prescriptionError } = await this.supabase
        .from('prescriptions')
        .insert([supabasePrescription])
        .select()
        .single();

      if (prescriptionError) throw prescriptionError;

      // Insert prescription items
      const prescriptionItems = prescriptionData.items.map((item, index) => ({
        item_id: `${prescriptionId}_${(index + 1).toString().padStart(3, '0')}`,
        prescription_id: prescriptionId,
        medication_id: item.medication_id,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        quantity: item.quantity,
        instructions: item.instructions,
        substitution_allowed: item.substitution_allowed || false
      }));

      const { data: itemsResult, error: itemsError } = await this.supabase
        .from('prescription_items')
        .insert(prescriptionItems)
        .select();

      if (itemsError) throw itemsError;

      const prescription = this.mapSupabasePrescriptionToPrescription(prescriptionResult);
      const items = itemsResult?.map(this.mapSupabasePrescriptionItemToPrescriptionItem) || [];

      return {
        ...prescription,
        items
      };
    } catch (error) {
      logger.error('Error creating prescription', { error, prescriptionData });
      throw error;
    }
  }

  async updatePrescription(prescriptionId: string, prescriptionData: UpdatePrescriptionRequest, updatedBy: string): Promise<Prescription> {
    try {
      const updateData = {
        ...prescriptionData,
        updated_by: updatedBy,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('prescriptions')
        .update(updateData)
        .eq('prescription_id', prescriptionId)
        .select()
        .single();

      if (error) throw error;
      return this.mapSupabasePrescriptionToPrescription(data);
    } catch (error) {
      logger.error('Error updating prescription', { error, prescriptionId, prescriptionData });
      throw error;
    }
  }

  async deletePrescription(prescriptionId: string): Promise<void> {
    try {
      // Delete prescription items first
      const { error: itemsError } = await this.supabase
        .from('prescription_items')
        .delete()
        .eq('prescription_id', prescriptionId);

      if (itemsError) throw itemsError;

      // Delete prescription
      const { error } = await this.supabase
        .from('prescriptions')
        .delete()
        .eq('prescription_id', prescriptionId);

      if (error) throw error;
    } catch (error) {
      logger.error('Error deleting prescription', { error, prescriptionId });
      throw error;
    }
  }

  // Medication methods
  async findAllMedications(limit: number = 100, offset: number = 0): Promise<Medication[]> {
    try {
      const { data, error } = await this.supabase
        .from('medications')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data?.map(this.mapSupabaseMedicationToMedication) || [];
    } catch (error) {
      logger.error('Error fetching medications', { error });
      throw error;
    }
  }

  async findMedicationById(medicationId: string): Promise<Medication | null> {
    try {
      const { data, error } = await this.supabase
        .from('medications')
        .select('*')
        .eq('medication_id', medicationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this.mapSupabaseMedicationToMedication(data);
    } catch (error) {
      logger.error('Error fetching medication by ID', { error, medicationId });
      throw error;
    }
  }

  async searchMedications(searchTerm: string): Promise<Medication[]> {
    try {
      const { data, error } = await this.supabase
        .from('medications')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,generic_name.ilike.%${searchTerm}%,brand_name.ilike.%${searchTerm}%`)
        .eq('is_active', true)
        .order('name', { ascending: true })
        .limit(50);

      if (error) throw error;
      return data?.map(this.mapSupabaseMedicationToMedication) || [];
    } catch (error) {
      logger.error('Error searching medications', { error, searchTerm });
      throw error;
    }
  }

  async createMedication(medicationData: CreateMedicationRequest): Promise<Medication> {
    try {
      const medicationId = await this.generateMedicationId();
      
      const supabaseMedication = {
        medication_id: medicationId,
        ...medicationData,
        requires_prescription: medicationData.requires_prescription ?? true,
        is_controlled_substance: medicationData.is_controlled_substance ?? false
      };

      const { data, error } = await this.supabase
        .from('medications')
        .insert([supabaseMedication])
        .select()
        .single();

      if (error) throw error;
      return this.mapSupabaseMedicationToMedication(data);
    } catch (error) {
      logger.error('Error creating medication', { error, medicationData });
      throw error;
    }
  }

  async updateMedication(medicationId: string, medicationData: UpdateMedicationRequest): Promise<Medication> {
    try {
      const updateData = {
        ...medicationData,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('medications')
        .update(updateData)
        .eq('medication_id', medicationId)
        .select()
        .single();

      if (error) throw error;
      return this.mapSupabaseMedicationToMedication(data);
    } catch (error) {
      logger.error('Error updating medication', { error, medicationId, medicationData });
      throw error;
    }
  }

  // Drug interaction methods
  async checkDrugInteractions(medicationIds: string[]): Promise<DrugInteractionCheck> {
    try {
      if (medicationIds.length < 2) {
        return {
          has_interactions: false,
          interactions: [],
          severity_level: 'low',
          recommendations: []
        };
      }

      const { data, error } = await this.supabase
        .from('drug_interactions')
        .select('*')
        .or(
          medicationIds.map(id1 => 
            medicationIds.map(id2 => 
              id1 !== id2 ? `and(medication1_id.eq.${id1},medication2_id.eq.${id2})` : null
            ).filter(Boolean).join(',')
          ).filter(Boolean).join(',')
        );

      if (error) throw error;

      const interactions = data?.map(this.mapSupabaseDrugInteractionToDrugInteraction) || [];
      const hasInteractions = interactions.length > 0;
      
      let severityLevel: 'low' | 'medium' | 'high' = 'low';
      if (interactions.some(i => i.interaction_type === 'major')) {
        severityLevel = 'high';
      } else if (interactions.some(i => i.interaction_type === 'moderate')) {
        severityLevel = 'medium';
      }

      const recommendations = interactions.map(i => i.recommendation);

      return {
        has_interactions: hasInteractions,
        interactions,
        severity_level: severityLevel,
        recommendations
      };
    } catch (error) {
      logger.error('Error checking drug interactions', { error, medicationIds });
      throw error;
    }
  }

  // Helper methods
  private async generatePrescriptionId(): Promise<string> {
    const { count } = await this.supabase
      .from('prescriptions')
      .select('*', { count: 'exact', head: true });
    
    const nextId = ((count || 0) + 1).toString().padStart(6, '0');
    return `RX${nextId}`;
  }

  private async generateMedicationId(): Promise<string> {
    const { count } = await this.supabase
      .from('medications')
      .select('*', { count: 'exact', head: true });
    
    const nextId = ((count || 0) + 1).toString().padStart(6, '0');
    return `MED${nextId}`;
  }

  private mapSupabasePrescriptionToPrescription(supabasePrescription: any): Prescription {
    return {
      prescription_id: supabasePrescription.prescription_id,
      patient_id: supabasePrescription.patient_id,
      doctor_id: supabasePrescription.doctor_id,
      appointment_id: supabasePrescription.appointment_id,
      medical_record_id: supabasePrescription.medical_record_id,
      prescription_date: new Date(supabasePrescription.prescription_date),
      status: supabasePrescription.status,
      notes: supabasePrescription.notes,
      total_cost: supabasePrescription.total_cost,
      pharmacy_notes: supabasePrescription.pharmacy_notes,
      dispensed_by: supabasePrescription.dispensed_by,
      dispensed_at: supabasePrescription.dispensed_at ? new Date(supabasePrescription.dispensed_at) : undefined,
      created_at: new Date(supabasePrescription.created_at),
      updated_at: new Date(supabasePrescription.updated_at),
      created_by: supabasePrescription.created_by,
      updated_by: supabasePrescription.updated_by
    };
  }

  private mapSupabasePrescriptionItemToPrescriptionItem(supabaseItem: any): PrescriptionItem {
    return {
      item_id: supabaseItem.item_id,
      prescription_id: supabaseItem.prescription_id,
      medication_id: supabaseItem.medication_id,
      medication_name: supabaseItem.medication_name,
      dosage: supabaseItem.dosage,
      frequency: supabaseItem.frequency,
      duration: supabaseItem.duration,
      quantity: supabaseItem.quantity,
      unit: supabaseItem.unit,
      instructions: supabaseItem.instructions,
      cost_per_unit: supabaseItem.cost_per_unit,
      total_cost: supabaseItem.total_cost,
      substitution_allowed: supabaseItem.substitution_allowed,
      created_at: new Date(supabaseItem.created_at)
    };
  }

  private mapSupabaseMedicationToMedication(supabaseMedication: any): Medication {
    return {
      medication_id: supabaseMedication.medication_id,
      name: supabaseMedication.name,
      generic_name: supabaseMedication.generic_name,
      brand_name: supabaseMedication.brand_name,
      category: supabaseMedication.category,
      form: supabaseMedication.form,
      strength: supabaseMedication.strength,
      unit: supabaseMedication.unit,
      manufacturer: supabaseMedication.manufacturer,
      description: supabaseMedication.description,
      contraindications: supabaseMedication.contraindications,
      side_effects: supabaseMedication.side_effects,
      storage_conditions: supabaseMedication.storage_conditions,
      price_per_unit: supabaseMedication.price_per_unit,
      stock_quantity: supabaseMedication.stock_quantity,
      expiry_date: supabaseMedication.expiry_date ? new Date(supabaseMedication.expiry_date) : undefined,
      requires_prescription: supabaseMedication.requires_prescription,
      is_controlled_substance: supabaseMedication.is_controlled_substance,
      is_active: supabaseMedication.is_active,
      created_at: new Date(supabaseMedication.created_at),
      updated_at: new Date(supabaseMedication.updated_at)
    };
  }

  private mapSupabaseDrugInteractionToDrugInteraction(supabaseInteraction: any): DrugInteraction {
    return {
      interaction_id: supabaseInteraction.interaction_id,
      medication1_id: supabaseInteraction.medication1_id,
      medication2_id: supabaseInteraction.medication2_id,
      interaction_type: supabaseInteraction.interaction_type,
      description: supabaseInteraction.description,
      severity_level: supabaseInteraction.severity_level,
      recommendation: supabaseInteraction.recommendation,
      created_at: new Date(supabaseInteraction.created_at)
    };
  }
}
