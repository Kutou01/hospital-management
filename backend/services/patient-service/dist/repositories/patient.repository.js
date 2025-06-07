"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientRepository = void 0;
const database_config_1 = require("../config/database.config");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
class PatientRepository {
    constructor() {
        this.supabase = (0, database_config_1.getSupabase)();
    }
    generatePatientId() {
        const timestamp = Date.now().toString().slice(-6);
        return `PAT${timestamp}`;
    }
    calculateAge(dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }
    async getAllPatients(filters = {}, page = 1, limit = 20) {
        try {
            let query = this.supabase
                .from('patients')
                .select(`
          *,
          profile:profiles!patients_profile_id_fkey (
            id,
            email,
            phone_number,
            role,
            is_active,
            email_verified,
            phone_verified
          )
        `, { count: 'exact' });
            if (filters.search) {
                query = query.or(`full_name.ilike.%${filters.search}%,patient_id.ilike.%${filters.search}%`);
            }
            if (filters.gender) {
                query = query.eq('gender', filters.gender);
            }
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            if (filters.blood_type) {
                query = query.eq('blood_type', filters.blood_type);
            }
            if (filters.created_after) {
                query = query.gte('created_at', filters.created_after);
            }
            if (filters.created_before) {
                query = query.lte('created_at', filters.created_before);
            }
            const offset = (page - 1) * limit;
            query = query.range(offset, offset + limit - 1);
            query = query.order('full_name');
            const { data, error, count } = await query;
            if (error) {
                logger_1.default.error('Error fetching patients:', error);
                throw new Error(`Failed to fetch patients: ${error.message}`);
            }
            let filteredData = data || [];
            if (filters.age_min !== undefined || filters.age_max !== undefined) {
                filteredData = filteredData.filter(patient => {
                    const age = this.calculateAge(patient.date_of_birth);
                    if (filters.age_min !== undefined && age < filters.age_min)
                        return false;
                    if (filters.age_max !== undefined && age > filters.age_max)
                        return false;
                    return true;
                });
            }
            return {
                patients: filteredData,
                total: count || 0
            };
        }
        catch (error) {
            logger_1.default.error('Exception in getAllPatients:', error);
            throw error;
        }
    }
    async getPatientById(patientId) {
        try {
            const { data, error } = await this.supabase
                .from('patients')
                .select(`
          *,
          profile:profiles!patients_profile_id_fkey (
            id,
            email,
            phone_number,
            role,
            is_active,
            email_verified,
            phone_verified
          )
        `)
                .eq('patient_id', patientId)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                logger_1.default.error('Error fetching patient by ID:', error);
                throw new Error(`Failed to fetch patient: ${error.message}`);
            }
            return data;
        }
        catch (error) {
            logger_1.default.error('Exception in getPatientById:', error);
            throw error;
        }
    }
    async getPatientByProfileId(profileId) {
        try {
            const { data, error } = await this.supabase
                .from('patients')
                .select(`
          *,
          profile:profiles!patients_profile_id_fkey (
            id,
            email,
            phone_number,
            role,
            is_active,
            email_verified,
            phone_verified
          )
        `)
                .eq('profile_id', profileId)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                logger_1.default.error('Error fetching patient by profile ID:', error);
                throw new Error(`Failed to fetch patient: ${error.message}`);
            }
            return data;
        }
        catch (error) {
            logger_1.default.error('Exception in getPatientByProfileId:', error);
            throw error;
        }
    }
    async getPatientsByDoctorId(doctorId) {
        try {
            const { data, error } = await this.supabase
                .from('appointments')
                .select(`
          patient_id,
          patients!appointments_patient_id_fkey (
            *,
            profile:profiles!patients_profile_id_fkey (
              id,
              email,
              phone_number,
              role,
              is_active,
              email_verified,
              phone_verified
            )
          )
        `)
                .eq('doctor_id', doctorId);
            if (error) {
                logger_1.default.error('Error fetching patients by doctor ID:', error);
                throw new Error(`Failed to fetch patients: ${error.message}`);
            }
            const uniquePatients = new Map();
            data?.forEach((appointment) => {
                if (appointment.patients && appointment.patients.patient_id) {
                    uniquePatients.set(appointment.patients.patient_id, appointment.patients);
                }
            });
            return Array.from(uniquePatients.values());
        }
        catch (error) {
            logger_1.default.error('Exception in getPatientsByDoctorId:', error);
            throw error;
        }
    }
    async createPatient(patientData) {
        try {
            const patientId = this.generatePatientId();
            const newPatient = {
                patient_id: patientId,
                ...patientData,
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            const { data, error } = await this.supabase
                .from('patients')
                .insert([newPatient])
                .select()
                .single();
            if (error) {
                logger_1.default.error('Error creating patient:', error);
                throw new Error(`Failed to create patient: ${error.message}`);
            }
            logger_1.default.info('Patient created successfully:', { patientId });
            return data;
        }
        catch (error) {
            logger_1.default.error('Exception in createPatient:', error);
            throw error;
        }
    }
    async updatePatient(patientId, updateData) {
        try {
            const updatedData = {
                ...updateData,
                updated_at: new Date().toISOString()
            };
            const { data, error } = await this.supabase
                .from('patients')
                .update(updatedData)
                .eq('patient_id', patientId)
                .select()
                .single();
            if (error) {
                logger_1.default.error('Error updating patient:', error);
                throw new Error(`Failed to update patient: ${error.message}`);
            }
            logger_1.default.info('Patient updated successfully:', { patientId });
            return data;
        }
        catch (error) {
            logger_1.default.error('Exception in updatePatient:', error);
            throw error;
        }
    }
    async deletePatient(patientId) {
        try {
            const { error } = await this.supabase
                .from('patients')
                .update({
                status: 'inactive',
                updated_at: new Date().toISOString()
            })
                .eq('patient_id', patientId);
            if (error) {
                logger_1.default.error('Error deleting patient:', error);
                throw new Error(`Failed to delete patient: ${error.message}`);
            }
            logger_1.default.info('Patient deleted successfully:', { patientId });
            return true;
        }
        catch (error) {
            logger_1.default.error('Exception in deletePatient:', error);
            throw error;
        }
    }
    async patientExists(patientId) {
        try {
            const { data, error } = await this.supabase
                .from('patients')
                .select('patient_id')
                .eq('patient_id', patientId)
                .single();
            if (error && error.code !== 'PGRST116') {
                logger_1.default.error('Error checking patient existence:', error);
                throw new Error(`Failed to check patient existence: ${error.message}`);
            }
            return !!data;
        }
        catch (error) {
            logger_1.default.error('Exception in patientExists:', error);
            throw error;
        }
    }
    async getPatientStats() {
        try {
            const { data, error } = await this.supabase
                .from('patients')
                .select('status, gender, blood_type');
            if (error) {
                logger_1.default.error('Error fetching patient stats:', error);
                throw new Error(`Failed to fetch patient stats: ${error.message}`);
            }
            const stats = {
                total: data?.length || 0,
                active: 0,
                inactive: 0,
                byGender: { male: 0, female: 0, other: 0 },
                byBloodType: {}
            };
            data?.forEach(patient => {
                if (patient.status === 'active')
                    stats.active++;
                else
                    stats.inactive++;
                if (patient.gender in stats.byGender) {
                    stats.byGender[patient.gender]++;
                }
                if (patient.blood_type) {
                    stats.byBloodType[patient.blood_type] = (stats.byBloodType[patient.blood_type] || 0) + 1;
                }
            });
            return stats;
        }
        catch (error) {
            logger_1.default.error('Exception in getPatientStats:', error);
            throw error;
        }
    }
}
exports.PatientRepository = PatientRepository;
//# sourceMappingURL=patient.repository.js.map