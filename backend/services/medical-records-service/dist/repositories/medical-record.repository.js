"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicalRecordRepository = void 0;
const database_config_1 = require("../config/database.config");
const shared_1 = require("@hospital/shared");
class MedicalRecordRepository {
    constructor() {
        this.supabase = database_config_1.supabaseAdmin;
    }
    async findAll(limit = 50, offset = 0) {
        try {
            const { data, error } = await this.supabase
                .rpc('get_all_medical_records', {
                limit_count: limit,
                offset_count: offset
            });
            if (error) {
                shared_1.logger.error('Database function error in findAll:', error);
                throw error;
            }
            if (!data || data.length === 0) {
                return [];
            }
            return data.map(this.mapSupabaseRecordToMedicalRecord);
        }
        catch (error) {
            shared_1.logger.error('Error fetching medical records', { error });
            throw error;
        }
    }
    async findById(recordId) {
        try {
            const { data, error } = await this.supabase
                .from('medical_records')
                .select('*')
                .eq('record_id', recordId)
                .eq('status', 'active')
                .single();
            if (error) {
                if (error.code === 'PGRST116')
                    return null;
                throw error;
            }
            return this.mapSupabaseRecordToMedicalRecord(data);
        }
        catch (error) {
            shared_1.logger.error('Error fetching medical record by ID', { error, recordId });
            throw error;
        }
    }
    async findByPatientId(patientId) {
        try {
            const { data, error } = await this.supabase
                .from('medical_records')
                .select('*')
                .eq('patient_id', patientId)
                .eq('status', 'active')
                .order('visit_date', { ascending: false });
            if (error)
                throw error;
            return data?.map(this.mapSupabaseRecordToMedicalRecord) || [];
        }
        catch (error) {
            shared_1.logger.error('Error fetching medical records by patient ID', { error, patientId });
            throw error;
        }
    }
    async findByDoctorId(doctorId) {
        try {
            const { data, error } = await this.supabase
                .from('medical_records')
                .select('*')
                .eq('doctor_id', doctorId)
                .eq('status', 'active')
                .order('visit_date', { ascending: false });
            if (error)
                throw error;
            return data?.map(this.mapSupabaseRecordToMedicalRecord) || [];
        }
        catch (error) {
            shared_1.logger.error('Error fetching medical records by doctor ID', { error, doctorId });
            throw error;
        }
    }
    async create(recordData, createdBy) {
        try {
            const { data, error } = await this.supabase
                .rpc('create_medical_record', {
                record_data: {
                    ...recordData,
                    created_by: createdBy,
                    updated_by: createdBy
                }
            });
            if (error) {
                shared_1.logger.error('Database function error in create:', error);
                throw error;
            }
            if (!data || data.length === 0) {
                throw new Error('Failed to create medical record - no data returned');
            }
            shared_1.logger.info('Medical record created successfully via database function:', {
                recordId: data[0].record_id
            });
            return this.mapSupabaseRecordToMedicalRecord(data[0]);
        }
        catch (error) {
            shared_1.logger.error('Error creating medical record', { error, recordData });
            throw error;
        }
    }
    async update(recordId, recordData, updatedBy) {
        try {
            const { data, error } = await this.supabase
                .rpc('update_medical_record', {
                record_id: recordId,
                record_data: {
                    ...recordData,
                    updated_by: updatedBy
                }
            });
            if (error) {
                shared_1.logger.error('Database function error in update:', error);
                throw error;
            }
            if (!data || data.length === 0) {
                throw new Error('Failed to update medical record - record not found');
            }
            shared_1.logger.info('Medical record updated successfully via database function:', {
                recordId,
                updatedFields: Object.keys(recordData)
            });
            return this.mapSupabaseRecordToMedicalRecord(data[0]);
        }
        catch (error) {
            shared_1.logger.error('Error updating medical record', { error, recordId, recordData });
            throw error;
        }
    }
    async delete(recordId) {
        try {
            const { error } = await this.supabase
                .from('medical_records')
                .update({ status: 'deleted' })
                .eq('record_id', recordId);
            if (error)
                throw error;
        }
        catch (error) {
            shared_1.logger.error('Error deleting medical record', { error, recordId });
            throw error;
        }
    }
    async count() {
        try {
            const { count, error } = await this.supabase
                .from('medical_records')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');
            if (error)
                throw error;
            return count || 0;
        }
        catch (error) {
            shared_1.logger.error('Error counting medical records', { error });
            throw error;
        }
    }
    // Lab Results methods
    async createLabResult(labData) {
        try {
            // Generate ID using timestamp for now (should use database function)
            const resultId = `LAB${Date.now().toString().slice(-6)}`;
            const supabaseLabResult = {
                result_id: resultId,
                ...labData
            };
            const { data, error } = await this.supabase
                .from('lab_results')
                .insert([supabaseLabResult])
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            shared_1.logger.error('Error creating lab result', { error, labData });
            throw error;
        }
    }
    async getLabResultsByRecordId(recordId) {
        try {
            const { data, error } = await this.supabase
                .from('lab_results')
                .select('*')
                .eq('record_id', recordId)
                .order('test_date', { ascending: false });
            if (error)
                throw error;
            return data || [];
        }
        catch (error) {
            shared_1.logger.error('Error fetching lab results', { error, recordId });
            throw error;
        }
    }
    // Vital Signs methods
    async createVitalSigns(vitalData, recordedBy) {
        try {
            // Generate ID using timestamp for now (should use database function)
            const vitalId = `VS${Date.now().toString().slice(-6)}`;
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
            if (error)
                throw error;
            return data;
        }
        catch (error) {
            shared_1.logger.error('Error creating vital signs', { error, vitalData });
            throw error;
        }
    }
    async getVitalSignsByRecordId(recordId) {
        try {
            const { data, error } = await this.supabase
                .from('vital_signs_history')
                .select('*')
                .eq('record_id', recordId)
                .order('recorded_at', { ascending: false });
            if (error)
                throw error;
            return data || [];
        }
        catch (error) {
            shared_1.logger.error('Error fetching vital signs', { error, recordId });
            throw error;
        }
    }
    // Remove local ID generation - now handled by database functions
    // These methods are kept for backward compatibility but not used
    calculateBMI(weight, height) {
        if (!weight || !height)
            return undefined;
        const heightInMeters = height / 100;
        return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
    }
    mapSupabaseRecordToMedicalRecord(supabaseRecord) {
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
exports.MedicalRecordRepository = MedicalRecordRepository;
//# sourceMappingURL=medical-record.repository.js.map