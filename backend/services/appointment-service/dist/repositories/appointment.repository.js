"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentRepository = void 0;
const database_config_1 = require("../config/database.config");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
class AppointmentRepository {
    constructor() {
        this.supabase = (0, database_config_1.getSupabase)();
    }
    generateAppointmentId() {
        const timestamp = Date.now().toString().slice(-6);
        return `APT${timestamp}`;
    }
    async getAllAppointments(filters = {}, page = 1, limit = 20) {
        try {
            let query = this.supabase
                .from('appointments')
                .select(`
          *,
          doctors!appointments_doctor_id_fkey (
            doctor_id,
            full_name,
            specialty,
            phone_number,
            email
          ),
          patients!appointments_patient_id_fkey (
            patient_id,
            full_name,
            date_of_birth,
            gender,
            profile:profiles!patients_profile_id_fkey (
              phone_number,
              email
            )
          )
        `, { count: 'exact' });
            if (filters.doctor_id) {
                query = query.eq('doctor_id', filters.doctor_id);
            }
            if (filters.patient_id) {
                query = query.eq('patient_id', filters.patient_id);
            }
            if (filters.appointment_date) {
                query = query.eq('appointment_date', filters.appointment_date);
            }
            if (filters.date_from) {
                query = query.gte('appointment_date', filters.date_from);
            }
            if (filters.date_to) {
                query = query.lte('appointment_date', filters.date_to);
            }
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            if (filters.appointment_type) {
                query = query.eq('appointment_type', filters.appointment_type);
            }
            if (filters.search) {
                query = query.or(`reason.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
            }
            const offset = (page - 1) * limit;
            query = query.range(offset, offset + limit - 1);
            query = query.order('appointment_date', { ascending: true })
                .order('start_time', { ascending: true });
            const { data, error, count } = await query;
            if (error) {
                logger_1.default.error('Error fetching appointments:', error);
                throw new Error(`Failed to fetch appointments: ${error.message}`);
            }
            const transformedData = data?.map(appointment => ({
                ...appointment,
                patient: appointment.patients ? {
                    patient_id: appointment.patients.patient_id,
                    full_name: appointment.patients.full_name,
                    date_of_birth: appointment.patients.date_of_birth,
                    gender: appointment.patients.gender,
                    phone_number: appointment.patients.profile?.phone_number,
                    email: appointment.patients.profile?.email
                } : undefined,
                doctor: appointment.doctors ? {
                    doctor_id: appointment.doctors.doctor_id,
                    full_name: appointment.doctors.full_name,
                    specialty: appointment.doctors.specialty,
                    phone_number: appointment.doctors.phone_number,
                    email: appointment.doctors.email
                } : undefined
            })) || [];
            return {
                appointments: transformedData,
                total: count || 0
            };
        }
        catch (error) {
            logger_1.default.error('Exception in getAllAppointments:', error);
            throw error;
        }
    }
    async getAppointmentById(appointmentId) {
        try {
            const { data, error } = await this.supabase
                .from('appointments')
                .select(`
          *,
          doctors!appointments_doctor_id_fkey (
            doctor_id,
            full_name,
            specialty,
            phone_number,
            email
          ),
          patients!appointments_patient_id_fkey (
            patient_id,
            full_name,
            date_of_birth,
            gender,
            profile:profiles!patients_profile_id_fkey (
              phone_number,
              email
            )
          )
        `)
                .eq('appointment_id', appointmentId)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                logger_1.default.error('Error fetching appointment by ID:', error);
                throw new Error(`Failed to fetch appointment: ${error.message}`);
            }
            const transformedData = {
                ...data,
                patient: data.patients ? {
                    patient_id: data.patients.patient_id,
                    full_name: data.patients.full_name,
                    date_of_birth: data.patients.date_of_birth,
                    gender: data.patients.gender,
                    phone_number: data.patients.profile?.phone_number,
                    email: data.patients.profile?.email
                } : undefined,
                doctor: data.doctors ? {
                    doctor_id: data.doctors.doctor_id,
                    full_name: data.doctors.full_name,
                    specialty: data.doctors.specialty,
                    phone_number: data.doctors.phone_number,
                    email: data.doctors.email
                } : undefined
            };
            return transformedData;
        }
        catch (error) {
            logger_1.default.error('Exception in getAppointmentById:', error);
            throw error;
        }
    }
    async getAppointmentsByDoctorId(doctorId, filters = {}, page = 1, limit = 20) {
        const searchFilters = { ...filters, doctor_id: doctorId };
        return this.getAllAppointments(searchFilters, page, limit);
    }
    async getAppointmentsByPatientId(patientId, filters = {}, page = 1, limit = 20) {
        const searchFilters = { ...filters, patient_id: patientId };
        return this.getAllAppointments(searchFilters, page, limit);
    }
    async createAppointment(appointmentData) {
        try {
            const appointmentId = this.generateAppointmentId();
            const newAppointment = {
                appointment_id: appointmentId,
                ...appointmentData,
                status: 'scheduled',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            const { data, error } = await this.supabase
                .from('appointments')
                .insert([newAppointment])
                .select()
                .single();
            if (error) {
                logger_1.default.error('Error creating appointment:', error);
                throw new Error(`Failed to create appointment: ${error.message}`);
            }
            logger_1.default.info('Appointment created successfully:', { appointmentId });
            return data;
        }
        catch (error) {
            logger_1.default.error('Exception in createAppointment:', error);
            throw error;
        }
    }
    async updateAppointment(appointmentId, updateData) {
        try {
            const updatedData = {
                ...updateData,
                updated_at: new Date().toISOString()
            };
            const { data, error } = await this.supabase
                .from('appointments')
                .update(updatedData)
                .eq('appointment_id', appointmentId)
                .select()
                .single();
            if (error) {
                logger_1.default.error('Error updating appointment:', error);
                throw new Error(`Failed to update appointment: ${error.message}`);
            }
            logger_1.default.info('Appointment updated successfully:', { appointmentId });
            return data;
        }
        catch (error) {
            logger_1.default.error('Exception in updateAppointment:', error);
            throw error;
        }
    }
    async cancelAppointment(appointmentId, reason) {
        try {
            const updateData = {
                status: 'cancelled',
                updated_at: new Date().toISOString()
            };
            if (reason) {
                updateData.notes = reason;
            }
            const { error } = await this.supabase
                .from('appointments')
                .update(updateData)
                .eq('appointment_id', appointmentId);
            if (error) {
                logger_1.default.error('Error cancelling appointment:', error);
                throw new Error(`Failed to cancel appointment: ${error.message}`);
            }
            logger_1.default.info('Appointment cancelled successfully:', { appointmentId });
            return true;
        }
        catch (error) {
            logger_1.default.error('Exception in cancelAppointment:', error);
            throw error;
        }
    }
    async checkConflicts(doctorId, appointmentDate, startTime, endTime, excludeAppointmentId) {
        try {
            let query = this.supabase
                .from('appointments')
                .select('appointment_id, start_time, end_time, status')
                .eq('doctor_id', doctorId)
                .eq('appointment_date', appointmentDate)
                .in('status', ['scheduled', 'confirmed', 'in_progress']);
            if (excludeAppointmentId) {
                query = query.neq('appointment_id', excludeAppointmentId);
            }
            const { data, error } = await query;
            if (error) {
                logger_1.default.error('Error checking appointment conflicts:', error);
                throw new Error(`Failed to check conflicts: ${error.message}`);
            }
            const conflicts = data?.filter(appointment => {
                const existingStart = appointment.start_time;
                const existingEnd = appointment.end_time;
                return ((startTime >= existingStart && startTime < existingEnd) ||
                    (endTime > existingStart && endTime <= existingEnd) ||
                    (startTime <= existingStart && endTime >= existingEnd));
            }) || [];
            return {
                has_conflict: conflicts.length > 0,
                conflicting_appointments: conflicts.length > 0 ? conflicts : undefined,
                message: conflicts.length > 0 ? 'Time slot conflicts with existing appointment' : undefined
            };
        }
        catch (error) {
            logger_1.default.error('Exception in checkConflicts:', error);
            throw error;
        }
    }
    async appointmentExists(appointmentId) {
        try {
            const { data, error } = await this.supabase
                .from('appointments')
                .select('appointment_id')
                .eq('appointment_id', appointmentId)
                .single();
            if (error && error.code !== 'PGRST116') {
                logger_1.default.error('Error checking appointment existence:', error);
                throw new Error(`Failed to check appointment existence: ${error.message}`);
            }
            return !!data;
        }
        catch (error) {
            logger_1.default.error('Exception in appointmentExists:', error);
            throw error;
        }
    }
    async getAppointmentStats() {
        try {
            const { data, error } = await this.supabase
                .from('appointments')
                .select('status, appointment_type, appointment_date, created_at');
            if (error) {
                logger_1.default.error('Error fetching appointment stats:', error);
                throw new Error(`Failed to fetch appointment stats: ${error.message}`);
            }
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const stats = {
                total: data?.length || 0,
                today: 0,
                thisWeek: 0,
                thisMonth: 0,
                byStatus: {
                    scheduled: 0,
                    confirmed: 0,
                    in_progress: 0,
                    completed: 0,
                    cancelled: 0,
                    no_show: 0
                },
                byType: {
                    consultation: 0,
                    follow_up: 0,
                    emergency: 0,
                    routine_checkup: 0
                }
            };
            data?.forEach(appointment => {
                if (appointment.status in stats.byStatus) {
                    stats.byStatus[appointment.status]++;
                }
                if (appointment.appointment_type in stats.byType) {
                    stats.byType[appointment.appointment_type]++;
                }
                const appointmentDate = new Date(appointment.appointment_date);
                const createdDate = new Date(appointment.created_at);
                if (appointment.appointment_date === today) {
                    stats.today++;
                }
                if (appointmentDate >= weekStart) {
                    stats.thisWeek++;
                }
                if (createdDate >= monthStart) {
                    stats.thisMonth++;
                }
            });
            return stats;
        }
        catch (error) {
            logger_1.default.error('Exception in getAppointmentStats:', error);
            throw error;
        }
    }
    async getUpcomingAppointments(doctorId, days = 7) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + days);
            const futureDateStr = futureDate.toISOString().split('T')[0];
            const { data, error } = await this.supabase
                .from('appointments')
                .select(`
          *,
          patients!appointments_patient_id_fkey (
            patient_id,
            full_name,
            date_of_birth,
            gender,
            profile:profiles!patients_profile_id_fkey (
              phone_number,
              email
            )
          )
        `)
                .eq('doctor_id', doctorId)
                .gte('appointment_date', today)
                .lte('appointment_date', futureDateStr)
                .in('status', ['scheduled', 'confirmed'])
                .order('appointment_date', { ascending: true })
                .order('start_time', { ascending: true });
            if (error) {
                logger_1.default.error('Error fetching upcoming appointments:', error);
                throw new Error(`Failed to fetch upcoming appointments: ${error.message}`);
            }
            const transformedData = data?.map(appointment => ({
                ...appointment,
                patient: appointment.patients ? {
                    patient_id: appointment.patients.patient_id,
                    full_name: appointment.patients.full_name,
                    date_of_birth: appointment.patients.date_of_birth,
                    gender: appointment.patients.gender,
                    phone_number: appointment.patients.profile?.phone_number,
                    email: appointment.patients.profile?.email
                } : undefined
            })) || [];
            return transformedData;
        }
        catch (error) {
            logger_1.default.error('Exception in getUpcomingAppointments:', error);
            throw error;
        }
    }
}
exports.AppointmentRepository = AppointmentRepository;
//# sourceMappingURL=appointment.repository.js.map