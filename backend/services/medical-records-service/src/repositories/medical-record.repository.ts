import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@hospital/shared';
import {
  MedicalRecord,
  MedicalRecordAttachment,
  LabResult,
  VitalSignsHistory,
  CreateMedicalRecordRequest,
  UpdateMedicalRecordRequest,
  CreateLabResultRequest,
  CreateVitalSignsRequest
} from '../types/medical-record.types';

export class MedicalRecordRepository {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<MedicalRecord[]> {
    try {
      const { data, error } = await this.supabase
        .from('medical_records')
        .select('*')
        .eq('status', 'active')
        .order('visit_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data?.map(this.mapSupabaseRecordToMedicalRecord) || [];
    } catch (error) {
      logger.error('Error fetching medical records', { error });
      throw error;
    }
  }

  async findById(recordId: string): Promise<MedicalRecord | null> {
    try {
      const { data, error } = await this.supabase
        .from('medical_records')
        .select('*')
        .eq('record_id', recordId)
        .eq('status', 'active')
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this.mapSupabaseRecordToMedicalRecord(data);
    } catch (error) {
      logger.error('Error fetching medical record by ID', { error, recordId });
      throw error;
    }
  }

  async findByPatientId(patientId: string): Promise<MedicalRecord[]> {
    try {
      const { data, error } = await this.supabase
        .from('medical_records')
        .select('*')
        .eq('patient_id', patientId)
        .eq('status', 'active')
        .order('visit_date', { ascending: false });

      if (error) throw error;
      return data?.map(this.mapSupabaseRecordToMedicalRecord) || [];
    } catch (error) {
      logger.error('Error fetching medical records by patient ID', { error, patientId });
      throw error;
    }
  }

  async findByDoctorId(doctorId: string): Promise<MedicalRecord[]> {
    try {
      const { data, error } = await this.supabase
        .from('medical_records')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('status', 'active')
        .order('visit_date', { ascending: false });

      if (error) throw error;
      return data?.map(this.mapSupabaseRecordToMedicalRecord) || [];
    } catch (error) {
      logger.error('Error fetching medical records by doctor ID', { error, doctorId });
      throw error;
    }
  }

  async create(recordData: CreateMedicalRecordRequest, createdBy: string): Promise<MedicalRecord> {
    try {
      const recordId = await this.generateRecordId();
      
      const supabaseRecord = {
        record_id: recordId,
        patient_id: recordData.patient_id,
        doctor_id: recordData.doctor_id,
        appointment_id: recordData.appointment_id,
        visit_date: recordData.visit_date,
        chief_complaint: recordData.chief_complaint,
        present_illness: recordData.present_illness,
        past_medical_history: recordData.past_medical_history,
        physical_examination: recordData.physical_examination,
        vital_signs: recordData.vital_signs,
        diagnosis: recordData.diagnosis,
        treatment_plan: recordData.treatment_plan,
        medications: recordData.medications,
        follow_up_instructions: recordData.follow_up_instructions,
        notes: recordData.notes,
        created_by: createdBy,
        updated_by: createdBy
      };

      const { data, error } = await this.supabase
        .from('medical_records')
        .insert([supabaseRecord])
        .select()
        .single();

      if (error) throw error;
      return this.mapSupabaseRecordToMedicalRecord(data);
    } catch (error) {
      logger.error('Error creating medical record', { error, recordData });
      throw error;
    }
  }

  async update(recordId: string, recordData: UpdateMedicalRecordRequest, updatedBy: string): Promise<MedicalRecord> {
    try {
      const updateData = {
        ...recordData,
        updated_by: updatedBy,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('medical_records')
        .update(updateData)
        .eq('record_id', recordId)
        .select()
        .single();

      if (error) throw error;
      return this.mapSupabaseRecordToMedicalRecord(data);
    } catch (error) {
      logger.error('Error updating medical record', { error, recordId, recordData });
      throw error;
    }
  }

  async delete(recordId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('medical_records')
        .update({ status: 'deleted' })
        .eq('record_id', recordId);

      if (error) throw error;
    } catch (error) {
      logger.error('Error deleting medical record', { error, recordId });
      throw error;
    }
  }

  async count(): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('medical_records')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (error) throw error;
      return count || 0;
    } catch (error) {
      logger.error('Error counting medical records', { error });
      throw error;
    }
  }

  // Lab Results methods
  async createLabResult(labData: CreateLabResultRequest): Promise<LabResult> {
    try {
      const resultId = await this.generateLabResultId();
      
      const supabaseLabResult = {
        result_id: resultId,
        ...labData
      };

      const { data, error } = await this.supabase
        .from('lab_results')
        .insert([supabaseLabResult])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error creating lab result', { error, labData });
      throw error;
    }
  }

  async getLabResultsByRecordId(recordId: string): Promise<LabResult[]> {
    try {
      const { data, error } = await this.supabase
        .from('lab_results')
        .select('*')
        .eq('record_id', recordId)
        .order('test_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching lab results', { error, recordId });
      throw error;
    }
  }

  // Vital Signs methods
  async createVitalSigns(vitalData: CreateVitalSignsRequest, recordedBy: string): Promise<VitalSignsHistory> {
    try {
      const vitalId = await this.generateVitalSignsId();
      
      const supabaseVitalSigns = {
        vital_id: vitalId,
        ...vitalData,
        recorded_by: recordedBy,
        bmi: this.calculateBMI(vitalData.weight, vitalData.height)
      };

      const { data, error } = await this.supabase
        .from('vital_signs_history')
        .insert([supabaseVitalSigns])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error creating vital signs', { error, vitalData });
      throw error;
    }
  }

  async getVitalSignsByRecordId(recordId: string): Promise<VitalSignsHistory[]> {
    try {
      const { data, error } = await this.supabase
        .from('vital_signs_history')
        .select('*')
        .eq('record_id', recordId)
        .order('recorded_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching vital signs', { error, recordId });
      throw error;
    }
  }

  private async generateRecordId(): Promise<string> {
    const count = await this.count();
    const nextId = (count + 1).toString().padStart(6, '0');
    return `MR${nextId}`;
  }

  private async generateLabResultId(): Promise<string> {
    const { count } = await this.supabase
      .from('lab_results')
      .select('*', { count: 'exact', head: true });
    
    const nextId = ((count || 0) + 1).toString().padStart(6, '0');
    return `LAB${nextId}`;
  }

  private async generateVitalSignsId(): Promise<string> {
    const { count } = await this.supabase
      .from('vital_signs_history')
      .select('*', { count: 'exact', head: true });
    
    const nextId = ((count || 0) + 1).toString().padStart(6, '0');
    return `VS${nextId}`;
  }

  private calculateBMI(weight?: number, height?: number): number | undefined {
    if (!weight || !height) return undefined;
    const heightInMeters = height / 100;
    return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
  }

  private mapSupabaseRecordToMedicalRecord(supabaseRecord: any): MedicalRecord {
    return {
      record_id: supabaseRecord.record_id,
      patient_id: supabaseRecord.patient_id,
      doctor_id: supabaseRecord.doctor_id,
      appointment_id: supabaseRecord.appointment_id,
      visit_date: new Date(supabaseRecord.visit_date),
      chief_complaint: supabaseRecord.chief_complaint,
      present_illness: supabaseRecord.present_illness,
      past_medical_history: supabaseRecord.past_medical_history,
      physical_examination: supabaseRecord.physical_examination,
      vital_signs: supabaseRecord.vital_signs,
      diagnosis: supabaseRecord.diagnosis,
      treatment_plan: supabaseRecord.treatment_plan,
      medications: supabaseRecord.medications,
      follow_up_instructions: supabaseRecord.follow_up_instructions,
      notes: supabaseRecord.notes,
      status: supabaseRecord.status,
      created_at: new Date(supabaseRecord.created_at),
      updated_at: new Date(supabaseRecord.updated_at),
      created_by: supabaseRecord.created_by,
      updated_by: supabaseRecord.updated_by
    };
  }
}
