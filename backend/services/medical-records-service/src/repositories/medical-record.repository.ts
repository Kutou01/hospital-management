import { logger } from "@hospital/shared";
import { supabaseAdmin } from "../config/database.config";
import {
  CreateEmbeddedPrescriptionRequest,
  CreateMedicalRecordRequest,
  EmbeddedPrescription,
  MedicalRecord,
  UpdateEmbeddedPrescriptionRequest,
  UpdateMedicalRecordRequest,
} from "../types/medical-record.types";

export class MedicalRecordRepository {
  private supabase = supabaseAdmin;

  async findAll(
    limit: number = 50,
    offset: number = 0
  ): Promise<MedicalRecord[]> {
    try {
      const { data, error } = await this.supabase.rpc(
        "get_all_medical_records",
        {
          limit_count: limit,
          offset_count: offset,
        }
      );

      if (error) {
        logger.error("Database function error in findAll:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map(this.mapSupabaseRecordToMedicalRecord);
    } catch (error) {
      logger.error("Error fetching medical records", { error });
      throw error;
    }
  }

  async findById(recordId: string): Promise<MedicalRecord | null> {
    try {
      const { data, error } = await this.supabase
        .from("medical_records")
        .select("*")
        .eq("record_id", recordId)
        .eq("status", "active")
        .single();

      if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
      }

      return this.mapSupabaseRecordToMedicalRecord(data);
    } catch (error) {
      logger.error("Error fetching medical record by ID", { error, recordId });
      throw error;
    }
  }

  async findByPatientId(patient_id: string): Promise<MedicalRecord[]> {
    try {
      const { data, error } = await this.supabase
        .from("medical_records")
        .select("*")
        .eq("patient_id", patient_id)
        .eq("status", "active")
        .order("visit_date", { ascending: false });

      if (error) throw error;
      return data?.map(this.mapSupabaseRecordToMedicalRecord) || [];
    } catch (error) {
      logger.error("Error fetching medical records by patient ID", {
        error,
        patient_id,
      });
      throw error;
    }
  }

  async findByDoctorId(doctor_id: string): Promise<MedicalRecord[]> {
    try {
      const { data, error } = await this.supabase
        .from("medical_records")
        .select("*")
        .eq("doctor_id", doctor_id)
        .eq("status", "active")
        .order("visit_date", { ascending: false });

      if (error) throw error;
      return data?.map(this.mapSupabaseRecordToMedicalRecord) || [];
    } catch (error) {
      logger.error("Error fetching medical records by doctor ID", {
        error,
        doctor_id,
      });
      throw error;
    }
  }

  async create(
    recordData: CreateMedicalRecordRequest,
    createdBy: string
  ): Promise<MedicalRecord> {
    try {
      const { data, error } = await this.supabase.rpc("create_medical_record", {
        record_data: {
          ...recordData,
          created_by: createdBy,
          updated_by: createdBy,
        },
      });

      if (error) {
        logger.error("Database function error in create:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error("Failed to create medical record - no data returned");
      }

      logger.info(
        "Medical record created successfully via database function:",
        {
          recordId: data[0].record_id,
        }
      );

      return this.mapSupabaseRecordToMedicalRecord(data[0]);
    } catch (error) {
      logger.error("Error creating medical record", { error, recordData });
      throw error;
    }
  }

  async update(
    recordId: string,
    recordData: UpdateMedicalRecordRequest,
    updatedBy: string
  ): Promise<MedicalRecord> {
    try {
      const { data, error } = await this.supabase.rpc("update_medical_record", {
        record_id: recordId,
        record_data: {
          ...recordData,
          updated_by: updatedBy,
        },
      });

      if (error) {
        logger.error("Database function error in update:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error("Failed to update medical record - record not found");
      }

      logger.info(
        "Medical record updated successfully via database function:",
        {
          recordId,
          updatedFields: Object.keys(recordData),
        }
      );

      return this.mapSupabaseRecordToMedicalRecord(data[0]);
    } catch (error) {
      logger.error("Error updating medical record", {
        error,
        recordId,
        recordData,
      });
      throw error;
    }
  }

  async delete(recordId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from("medical_records")
        .update({ status: "deleted" })
        .eq("record_id", recordId);

      if (error) throw error;
    } catch (error) {
      logger.error("Error deleting medical record", { error, recordId });
      throw error;
    }
  }

  async count(): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from("medical_records")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      if (error) throw error;
      return count || 0;
    } catch (error) {
      logger.error("Error counting medical records", { error });
      throw error;
    }
  }

  // REMOVED: Lab Results methods - lab results now stored as simple text in medical records

  // REMOVED: Vital Signs methods - vital signs now embedded as BasicVitalSigns in medical records
  // REMOVED: calculateBMI method - no longer needed in simplified system

  // ============================================
  // PRESCRIPTION METHODS (Merged from Prescription Service)
  // ============================================

  async createPrescriptionForRecord(
    recordId: string,
    prescriptionData: CreateEmbeddedPrescriptionRequest,
    createdBy: string
  ): Promise<EmbeddedPrescription> {
    try {
      // Generate prescription ID
      const prescriptionId = `PRES-${Date.now().toString().slice(-6)}`;

      // Calculate total cost
      let totalCost = 0;
      const medications = prescriptionData.medications.map((med) => {
        const itemCost = (med.cost_per_unit || 0) * med.quantity;
        totalCost += itemCost;
        return {
          ...med,
          total_cost: itemCost,
        };
      });

      const prescription: EmbeddedPrescription = {
        prescription_id: prescriptionId,
        prescription_date: new Date(prescriptionData.prescription_date),
        status: "active",
        medications,
        notes: prescriptionData.notes,
        total_cost: totalCost,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Get current medical record
      const currentRecord = await this.findById(recordId);
      if (!currentRecord) {
        throw new Error("Medical record not found");
      }

      // Add prescription to existing prescriptions array
      const updatedPrescriptions = [
        ...(currentRecord.prescriptions || []),
        prescription,
      ];

      // Update medical record with new prescription
      const { error } = await this.supabase
        .from("medical_records")
        .update({
          prescriptions: updatedPrescriptions,
          updated_at: new Date().toISOString(),
        })
        .eq("record_id", recordId);

      if (error) throw error;
      return prescription;
    } catch (error) {
      logger.error("Error creating prescription for record", {
        error,
        recordId,
        prescriptionData,
      });
      throw error;
    }
  }

  async updatePrescriptionInRecord(
    recordId: string,
    prescriptionId: string,
    updateData: UpdateEmbeddedPrescriptionRequest
  ): Promise<EmbeddedPrescription> {
    try {
      // Get current medical record
      const currentRecord = await this.findById(recordId);
      if (!currentRecord) {
        throw new Error("Medical record not found");
      }

      // Find and update the prescription
      const prescriptions = currentRecord.prescriptions || [];
      const prescriptionIndex = prescriptions.findIndex(
        (p: EmbeddedPrescription) => p.prescription_id === prescriptionId
      );

      if (prescriptionIndex === -1) {
        throw new Error("Prescription not found");
      }

      // Update prescription
      const updatedPrescription = {
        ...prescriptions[prescriptionIndex],
        ...updateData,
        updated_at: new Date(),
      };

      // Recalculate total cost if medications updated
      if (updateData.medications) {
        let totalCost = 0;
        const medications = updateData.medications.map((med) => {
          const itemCost = (med.cost_per_unit || 0) * med.quantity;
          totalCost += itemCost;
          return {
            ...med,
            total_cost: itemCost,
          };
        });
        updatedPrescription.medications = medications;
        updatedPrescription.total_cost = totalCost;
      }

      prescriptions[prescriptionIndex] = updatedPrescription;

      // Update medical record
      const { error } = await this.supabase
        .from("medical_records")
        .update({
          prescriptions,
          updated_at: new Date().toISOString(),
        })
        .eq("record_id", recordId);

      if (error) throw error;
      return updatedPrescription;
    } catch (error) {
      logger.error("Error updating prescription in record", {
        error,
        recordId,
        prescriptionId,
      });
      throw error;
    }
  }

  async getPrescriptionsByPatientId(
    patient_id: string
  ): Promise<EmbeddedPrescription[]> {
    try {
      const { data, error } = await this.supabase
        .from("medical_records")
        .select("prescriptions")
        .eq("patient_id", patient_id)
        .not("prescriptions", "is", null);

      if (error) throw error;

      // Flatten all prescriptions from all medical records
      const allPrescriptions: EmbeddedPrescription[] = [];
      data?.forEach((record) => {
        if (record.prescriptions) {
          allPrescriptions.push(...record.prescriptions);
        }
      });

      return allPrescriptions.sort(
        (a, b) =>
          new Date(b.prescription_date).getTime() -
          new Date(a.prescription_date).getTime()
      );
    } catch (error) {
      logger.error("Error fetching prescriptions by patient ID", {
        error,
        patient_id,
      });
      throw error;
    }
  }

  async getPrescriptionsByDoctorId(
    doctor_id: string
  ): Promise<EmbeddedPrescription[]> {
    try {
      const { data, error } = await this.supabase
        .from("medical_records")
        .select("prescriptions")
        .eq("doctor_id", doctor_id)
        .not("prescriptions", "is", null);

      if (error) throw error;

      // Flatten all prescriptions from all medical records
      const allPrescriptions: EmbeddedPrescription[] = [];
      data?.forEach((record) => {
        if (record.prescriptions) {
          allPrescriptions.push(...record.prescriptions);
        }
      });

      return allPrescriptions.sort(
        (a, b) =>
          new Date(b.prescription_date).getTime() -
          new Date(a.prescription_date).getTime()
      );
    } catch (error) {
      logger.error("Error fetching prescriptions by doctor ID", {
        error,
        doctor_id,
      });
      throw error;
    }
  }

  private mapSupabaseRecordToMedicalRecord(supabaseRecord: any): MedicalRecord {
    return {
      record_id: supabaseRecord.record_id,
      patient_id: supabaseRecord.patient_id,
      doctor_id: supabaseRecord.doctor_id,
      appointment_id: supabaseRecord.appointment_id,
      visit_date: new Date(supabaseRecord.visit_date),
      // Map simplified fields
      symptoms: supabaseRecord.symptoms,
      examination_notes: supabaseRecord.examination_notes,
      diagnosis: supabaseRecord.diagnosis,
      treatment: supabaseRecord.treatment,
      medications: supabaseRecord.medications,
      notes: supabaseRecord.notes,
      basic_vitals: supabaseRecord.basic_vitals,
      // MERGED: Map prescriptions data
      prescriptions: supabaseRecord.prescriptions || [],
      status: supabaseRecord.status,
      created_at: new Date(supabaseRecord.created_at),
      updated_at: new Date(supabaseRecord.updated_at),
      created_by: supabaseRecord.created_by,
      updated_by: supabaseRecord.updated_by,
    };
  }
}
