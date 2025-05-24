"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileService = void 0;
const common_types_1 = require("@hospital/shared/src/types/common.types");
const database_config_1 = require("../config/database.config");
const logger_1 = __importDefault(require("@hospital/shared/src/utils/logger"));
const uuid_1 = require("uuid");
class ProfileService {
    /**
     * Create role-specific profile after user registration
     */
    async createRoleProfile(userId, role, profileData) {
        try {
            switch (role) {
                case common_types_1.UserRole.DOCTOR:
                    return await this.createDoctorProfile(userId, profileData);
                case common_types_1.UserRole.PATIENT:
                    return await this.createPatientProfile(userId, profileData);
                case common_types_1.UserRole.NURSE:
                case common_types_1.UserRole.RECEPTIONIST:
                case common_types_1.UserRole.ADMIN:
                    return await this.createStaffProfile(userId, role);
                default:
                    throw new Error(`Unsupported role: ${role}`);
            }
        }
        catch (error) {
            logger_1.default.error('Error creating role profile', { error, userId, role });
            throw error;
        }
    }
    /**
     * Create doctor profile
     */
    async createDoctorProfile(userId, profileData) {
        const doctorId = `DOC${Date.now()}${Math.floor(Math.random() * 1000)}`;
        const doctorRecord = {
            id: doctorId,
            user_id: userId,
            specialization: profileData.specialization,
            license_number: profileData.license_number,
            department_id: profileData.department_id || null,
            experience_years: profileData.experience_years || 0,
            consultation_fee: profileData.consultation_fee || 0,
            bio: profileData.bio || '',
            education: profileData.education || [],
            certifications: profileData.certifications || [],
            languages: profileData.languages || ['English'],
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        const { data, error } = await database_config_1.supabase
            .from('doctors')
            .insert([doctorRecord])
            .select()
            .single();
        if (error) {
            logger_1.default.error('Error creating doctor profile', { error, userId });
            throw new Error(`Failed to create doctor profile: ${error.message}`);
        }
        // Create doctor availability if provided
        if (profileData.availability && profileData.availability.length > 0) {
            await this.createDoctorAvailability(doctorId, profileData.availability);
        }
        logger_1.default.info('Doctor profile created successfully', { doctorId, userId });
        return doctorId;
    }
    /**
     * Create patient profile
     */
    async createPatientProfile(userId, profileData) {
        const patientId = `PAT${Date.now()}${Math.floor(Math.random() * 1000)}`;
        const patientRecord = {
            id: patientId,
            user_id: userId,
            date_of_birth: profileData.date_of_birth,
            gender: profileData.gender,
            address: profileData.address || null,
            emergency_contact: profileData.emergency_contact || null,
            insurance_info: profileData.insurance_info || null,
            medical_history: profileData.medical_history || [],
            allergies: profileData.allergies || [],
            current_medications: profileData.current_medications || [],
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        const { data, error } = await database_config_1.supabase
            .from('patients')
            .insert([patientRecord])
            .select()
            .single();
        if (error) {
            logger_1.default.error('Error creating patient profile', { error, userId });
            throw new Error(`Failed to create patient profile: ${error.message}`);
        }
        logger_1.default.info('Patient profile created successfully', { patientId, userId });
        return patientId;
    }
    /**
     * Create staff profile for admin, nurse, receptionist
     */
    async createStaffProfile(userId, role) {
        const staffId = `STF${Date.now()}${Math.floor(Math.random() * 1000)}`;
        const staffRecord = {
            id: staffId,
            user_id: userId,
            role: role,
            department_id: null,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        const { data, error } = await database_config_1.supabase
            .from('staff')
            .insert([staffRecord])
            .select()
            .single();
        if (error) {
            logger_1.default.error('Error creating staff profile', { error, userId, role });
            throw new Error(`Failed to create staff profile: ${error.message}`);
        }
        logger_1.default.info('Staff profile created successfully', { staffId, userId, role });
        return staffId;
    }
    /**
     * Create doctor availability schedule
     */
    async createDoctorAvailability(doctorId, availability) {
        const availabilityRecords = availability.map(slot => ({
            id: (0, uuid_1.v4)(),
            doctor_id: doctorId,
            day_of_week: slot.day_of_week,
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_available: slot.is_available,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }));
        const { error } = await database_config_1.supabase
            .from('doctor_availability')
            .insert(availabilityRecords);
        if (error) {
            logger_1.default.error('Error creating doctor availability', { error, doctorId });
            throw new Error(`Failed to create doctor availability: ${error.message}`);
        }
        logger_1.default.info('Doctor availability created successfully', { doctorId, slotsCount: availability.length });
    }
    /**
     * Get profile by user ID and role
     */
    async getProfileByUserId(userId, role) {
        try {
            switch (role) {
                case common_types_1.UserRole.DOCTOR:
                    return await this.getDoctorProfile(userId);
                case common_types_1.UserRole.PATIENT:
                    return await this.getPatientProfile(userId);
                case common_types_1.UserRole.NURSE:
                case common_types_1.UserRole.RECEPTIONIST:
                case common_types_1.UserRole.ADMIN:
                    return await this.getStaffProfile(userId);
                default:
                    return null;
            }
        }
        catch (error) {
            logger_1.default.error('Error getting profile', { error, userId, role });
            throw error;
        }
    }
    async getDoctorProfile(userId) {
        const { data, error } = await database_config_1.supabase
            .from('doctors')
            .select(`
        *,
        department:departments(id, name),
        availability:doctor_availability(*)
      `)
            .eq('user_id', userId)
            .single();
        if (error && error.code !== 'PGRST116') {
            throw error;
        }
        return data;
    }
    async getPatientProfile(userId) {
        const { data, error } = await database_config_1.supabase
            .from('patients')
            .select('*')
            .eq('user_id', userId)
            .single();
        if (error && error.code !== 'PGRST116') {
            throw error;
        }
        return data;
    }
    async getStaffProfile(userId) {
        const { data, error } = await database_config_1.supabase
            .from('staff')
            .select(`
        *,
        department:departments(id, name)
      `)
            .eq('user_id', userId)
            .single();
        if (error && error.code !== 'PGRST116') {
            throw error;
        }
        return data;
    }
}
exports.ProfileService = ProfileService;
