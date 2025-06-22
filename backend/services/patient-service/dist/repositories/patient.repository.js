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
        this.supabase = database_config_1.supabaseAdmin;
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
            const offset = (page - 1) * limit;
            const { data, error } = await this.supabase
                .rpc('get_all_patients', {
                search_filters: {
                    search: filters.search || null,
                    gender: filters.gender || null,
                    status: filters.status || null,
                    blood_type: filters.blood_type || null,
                    age_min: filters.age_min || null,
                    age_max: filters.age_max || null,
                    created_after: filters.created_after || null,
                    created_before: filters.created_before || null
                },
                limit_count: limit,
                offset_count: offset
            });
            if (error) {
                logger_1.default.error('Database function error in getAllPatients:', error);
                return this.getAllPatientsDirectQuery(filters, page, limit);
            }
            if (!data || data.length === 0) {
                return { patients: [], total: 0 };
            }
            const result = data[0];
            if (!result || !result.patients) {
                return { patients: [], total: 0 };
            }
            return {
                patients: result.patients,
                total: result.total || 0
            };
        }
        catch (error) {
            logger_1.default.error('Exception in getAllPatients:', error);
            return this.getAllPatientsDirectQuery(filters, page, limit);
        }
    }
    async getAllPatientsDirectQuery(filters = {}, page = 1, limit = 20) {
        try {
            const offset = (page - 1) * limit;
            let query = this.supabase
                .from('patients')
                .select(`
          *,
          profiles!inner (
            id,
            email,
            full_name,
            date_of_birth,
            phone_number,
            role,
            is_active,
            email_verified,
            phone_verified
          )
        `, { count: 'exact' });
            if (filters.gender) {
                query = query.eq('gender', filters.gender);
            }
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            if (filters.blood_type) {
                query = query.eq('blood_type', filters.blood_type);
            }
            if (filters.search) {
                query = query.ilike('profiles.full_name', `%${filters.search}%`);
            }
            query = query
                .range(offset, offset + limit - 1)
                .order('created_at', { ascending: false });
            const { data, error, count } = await query;
            if (error) {
                logger_1.default.error('Direct query error in getAllPatientsDirectQuery:', error);
                throw error;
            }
            if (!data || data.length === 0) {
                return { patients: [], total: count || 0 };
            }
            const transformedPatients = data.map((patient) => ({
                ...patient,
                profile: patient.profiles
            }));
            return {
                patients: transformedPatients,
                total: count || 0
            };
        }
        catch (error) {
            logger_1.default.error('Exception in getAllPatientsDirectQuery:', error);
            throw error;
        }
    }
    async getPatientById(patientId) {
        try {
            const { data, error } = await this.supabase
                .rpc('get_patient_by_id', { input_patient_id: patientId });
            if (error) {
                logger_1.default.error('Database function error in getPatientById:', error);
                return null;
            }
            if (!data || data.length === 0) {
                return null;
            }
            return data[0];
        }
        catch (error) {
            logger_1.default.error('Exception in getPatientById:', error);
            throw error;
        }
    }
    async getPatientByProfileId(profileId) {
        try {
            const { data, error } = await this.supabase
                .rpc('get_patient_by_profile_id', { input_profile_id: profileId });
            if (error) {
                logger_1.default.error('Database function error in getPatientByProfileId:', error);
                return null;
            }
            if (!data || data.length === 0) {
                return null;
            }
            return data[0];
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
              full_name,
              date_of_birth,
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
    async verifyProfileExists(profileId) {
        try {
            const { data, error } = await this.supabase
                .from('profiles')
                .select('id')
                .eq('id', profileId)
                .single();
            if (error && error.code !== 'PGRST116') {
                logger_1.default.error('Error verifying profile existence:', error);
                throw error;
            }
            return !!data;
        }
        catch (error) {
            logger_1.default.error('Exception in verifyProfileExists:', error);
            return false;
        }
    }
    async createPatient(patientData) {
        try {
            const { data, error } = await this.supabase
                .rpc('create_patient', {
                patient_data: {
                    ...patientData,
                    status: 'active'
                }
            });
            if (error) {
                logger_1.default.error('Database function error in createPatient:', error);
                throw error;
            }
            if (!data || data.length === 0) {
                throw new Error('Failed to create patient - no data returned');
            }
            logger_1.default.info('Patient created successfully via database function:', {
                patientId: data[0].patient_id
            });
            return data[0];
        }
        catch (error) {
            logger_1.default.error('Exception in createPatient:', error);
            throw error;
        }
    }
    async updatePatient(patientId, updateData) {
        try {
            const { data, error } = await this.supabase
                .rpc('update_patient', {
                input_patient_id: patientId,
                patient_data: updateData
            });
            if (error) {
                logger_1.default.error('Database function error in updatePatient:', error);
                throw error;
            }
            if (!data || data.length === 0) {
                throw new Error('Failed to update patient - patient not found');
            }
            logger_1.default.info('Patient updated successfully via database function:', {
                patientId,
                updatedFields: Object.keys(updateData)
            });
            return data[0];
        }
        catch (error) {
            logger_1.default.error('Exception in updatePatient:', error);
            throw error;
        }
    }
    async deletePatient(patientId) {
        try {
            const { data, error } = await this.supabase
                .rpc('delete_patient', { input_patient_id: patientId });
            if (error) {
                logger_1.default.error('Database function error in deletePatient:', error);
                throw error;
            }
            logger_1.default.info('Patient deleted successfully via database function:', { patientId });
            return data === true;
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
                .eq('status', 'active')
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
    async searchPatients(searchTerm, limit = 10) {
        try {
            const { data, error } = await this.supabase
                .from('patients')
                .select(`
          *,
          profiles!inner (
            id,
            email,
            full_name,
            date_of_birth,
            phone_number,
            role,
            is_active,
            email_verified,
            phone_verified
          )
        `)
                .or(`profiles.full_name.ilike.%${searchTerm}%,profiles.phone_number.ilike.%${searchTerm}%,patient_id.ilike.%${searchTerm}%`)
                .eq('status', 'active')
                .limit(limit);
            if (error) {
                logger_1.default.error('Error searching patients:', error);
                throw new Error(`Failed to search patients: ${error.message}`);
            }
            return data?.map((patient) => ({
                ...patient,
                profile: patient.profiles
            })) || [];
        }
        catch (error) {
            logger_1.default.error('Exception in searchPatients:', error);
            throw error;
        }
    }
    async getPatientsWithUpcomingAppointments() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const { data, error } = await this.supabase
                .from('appointments')
                .select(`
          patient_id,
          appointment_date,
          patients!inner (
            *,
            profiles!inner (
              id,
              email,
              full_name,
              date_of_birth,
              phone_number,
              role,
              is_active,
              email_verified,
              phone_verified
            )
          )
        `)
                .gte('appointment_date', today)
                .eq('status', 'scheduled')
                .order('appointment_date', { ascending: true });
            if (error) {
                logger_1.default.error('Error fetching patients with upcoming appointments:', error);
                throw new Error(`Failed to fetch patients with upcoming appointments: ${error.message}`);
            }
            const uniquePatients = new Map();
            data?.forEach((appointment) => {
                if (appointment.patients && appointment.patients.patient_id) {
                    const patient = {
                        ...appointment.patients,
                        profile: appointment.patients.profiles
                    };
                    uniquePatients.set(appointment.patients.patient_id, patient);
                }
            });
            return Array.from(uniquePatients.values());
        }
        catch (error) {
            logger_1.default.error('Exception in getPatientsWithUpcomingAppointments:', error);
            throw error;
        }
    }
    async getPatientMedicalSummary(patientId) {
        try {
            const patient = await this.getPatientById(patientId);
            if (!patient) {
                return {
                    patient: null,
                    appointmentCount: 0,
                    lastAppointment: null,
                    medicalHistory: [],
                    allergies: [],
                    currentMedications: {}
                };
            }
            const { data: appointments, error: appointmentError } = await this.supabase
                .from('appointments')
                .select('appointment_date, status')
                .eq('patient_id', patientId)
                .order('appointment_date', { ascending: false });
            if (appointmentError) {
                logger_1.default.error('Error fetching patient appointments:', appointmentError);
            }
            const appointmentCount = appointments?.length || 0;
            const lastAppointment = appointments?.[0]?.appointment_date || null;
            return {
                patient,
                appointmentCount,
                lastAppointment,
                medicalHistory: Array.isArray(patient.medical_history) ? patient.medical_history :
                    patient.medical_history ? [patient.medical_history] : [],
                allergies: patient.allergies || [],
                currentMedications: patient.current_medications || {}
            };
        }
        catch (error) {
            logger_1.default.error('Exception in getPatientMedicalSummary:', error);
            throw error;
        }
    }
}
exports.PatientRepository = PatientRepository;
//# sourceMappingURL=patient.repository.js.map