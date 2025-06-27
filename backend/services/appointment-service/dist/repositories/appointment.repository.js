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
        this.supabase = database_config_1.supabaseAdmin;
    }
    async getAllAppointments(filters = {}, page = 1, limit = 20) {
        try {
            let query = this.supabase
                .from('appointments')
                .select(`
          *,
          doctors!doctor_id (
            doctor_id,
            full_name,
            specialty,
            profile:profiles!profile_id (
              phone_number,
              email
            )
          ),
          patients!patient_id (
            patient_id,
            gender,
            blood_type,
            profile:profiles!profile_id (
              full_name,
              date_of_birth,
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
                    phone_number: appointment.doctors.profile?.phone_number,
                    email: appointment.doctors.profile?.email
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
          doctors!doctor_id (
            doctor_id,
            full_name,
            specialty,
            profile:profiles!profile_id (
              phone_number,
              email
            )
          ),
          patients!patient_id (
            patient_id,
            gender,
            blood_type,
            profile:profiles!profile_id (
              full_name,
              date_of_birth,
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
                    phone_number: data.doctors.profile?.phone_number,
                    email: data.doctors.profile?.email
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
            const { data, error } = await this.supabase
                .rpc('create_appointment', {
                appointment_data: {
                    ...appointmentData,
                    status: 'scheduled'
                }
            });
            if (error) {
                logger_1.default.error('Database function error in createAppointment:', error);
                throw error;
            }
            if (!data || data.length === 0) {
                throw new Error('Failed to create appointment - no data returned');
            }
            logger_1.default.info('Appointment created successfully via database function:', {
                appointmentId: data[0].appointment_id
            });
            return data[0];
        }
        catch (error) {
            logger_1.default.error('Exception in createAppointment:', error);
            throw error;
        }
    }
    async updateAppointment(appointmentId, updateData) {
        try {
            const { data, error } = await this.supabase
                .rpc('update_appointment', {
                input_appointment_id: appointmentId,
                appointment_data: updateData
            });
            if (error) {
                logger_1.default.error('Database function error in updateAppointment:', error);
                throw error;
            }
            if (!data || data.length === 0) {
                throw new Error('Failed to update appointment - appointment not found');
            }
            logger_1.default.info('Appointment updated successfully via database function:', {
                appointmentId,
                updatedFields: Object.keys(updateData)
            });
            return data[0];
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
          patients!patient_id (
            patient_id,
            full_name,
            date_of_birth,
            gender,
            profile:profiles!profile_id (
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
    async getCalendarView(date, doctorId, view = 'month') {
        try {
            let startDate;
            let endDate;
            const inputDate = new Date(date);
            switch (view) {
                case 'day':
                    startDate = date;
                    endDate = date;
                    break;
                case 'week':
                    const weekStart = new Date(inputDate);
                    weekStart.setDate(inputDate.getDate() - inputDate.getDay());
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    startDate = weekStart.toISOString().split('T')[0];
                    endDate = weekEnd.toISOString().split('T')[0];
                    break;
                case 'month':
                    const monthStart = new Date(inputDate.getFullYear(), inputDate.getMonth(), 1);
                    const monthEnd = new Date(inputDate.getFullYear(), inputDate.getMonth() + 1, 0);
                    startDate = monthStart.toISOString().split('T')[0];
                    endDate = monthEnd.toISOString().split('T')[0];
                    break;
            }
            let query = this.supabase
                .from('appointments')
                .select(`
          *,
          doctors!doctor_id (
            doctor_id,
            full_name,
            specialty
          ),
          patients!patient_id (
            patient_id,
            profile:profiles!profile_id (
              full_name
            )
          )
        `)
                .gte('appointment_date', startDate)
                .lte('appointment_date', endDate)
                .in('status', ['scheduled', 'confirmed', 'in_progress', 'completed']);
            if (doctorId) {
                query = query.eq('doctor_id', doctorId);
            }
            const { data, error } = await query.order('appointment_date').order('start_time');
            if (error) {
                logger_1.default.error('Error fetching calendar view:', error);
                throw new Error(`Failed to fetch calendar view: ${error.message}`);
            }
            const calendar = {};
            data?.forEach(appointment => {
                const appointmentDate = appointment.appointment_date;
                if (!calendar[appointmentDate]) {
                    calendar[appointmentDate] = [];
                }
                calendar[appointmentDate].push({
                    appointment_id: appointment.appointment_id,
                    start_time: appointment.start_time,
                    end_time: appointment.end_time,
                    status: appointment.status,
                    appointment_type: appointment.appointment_type,
                    doctor: appointment.doctors ? {
                        doctor_id: appointment.doctors.doctor_id,
                        full_name: appointment.doctors.full_name,
                        specialty: appointment.doctors.specialty
                    } : null,
                    patient: appointment.patients ? {
                        patient_id: appointment.patients.patient_id,
                        full_name: appointment.patients.profile?.full_name
                    } : null
                });
            });
            return {
                view,
                startDate,
                endDate,
                calendar,
                totalAppointments: data?.length || 0
            };
        }
        catch (error) {
            logger_1.default.error('Exception in getCalendarView:', error);
            throw error;
        }
    }
    async getWeeklySchedule(doctorId, startDate) {
        try {
            const weekStart = startDate ? new Date(startDate) : new Date();
            if (!startDate) {
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            }
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            const startDateStr = weekStart.toISOString().split('T')[0];
            const endDateStr = weekEnd.toISOString().split('T')[0];
            const { data, error } = await this.supabase
                .from('appointments')
                .select(`
          *,
          patients!patient_id (
            patient_id,
            profile:profiles!profile_id (
              full_name,
              phone_number
            )
          )
        `)
                .eq('doctor_id', doctorId)
                .gte('appointment_date', startDateStr)
                .lte('appointment_date', endDateStr)
                .in('status', ['scheduled', 'confirmed', 'in_progress'])
                .order('appointment_date')
                .order('start_time');
            if (error) {
                logger_1.default.error('Error fetching weekly schedule:', error);
                throw new Error(`Failed to fetch weekly schedule: ${error.message}`);
            }
            const weeklySchedule = {};
            const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            for (let i = 0; i < 7; i++) {
                const currentDate = new Date(weekStart);
                currentDate.setDate(weekStart.getDate() + i);
                const dateStr = currentDate.toISOString().split('T')[0];
                weeklySchedule[dateStr] = [];
            }
            data?.forEach(appointment => {
                const appointmentDate = appointment.appointment_date;
                weeklySchedule[appointmentDate].push({
                    appointment_id: appointment.appointment_id,
                    start_time: appointment.start_time,
                    end_time: appointment.end_time,
                    status: appointment.status,
                    appointment_type: appointment.appointment_type,
                    reason: appointment.reason,
                    patient: appointment.patients ? {
                        patient_id: appointment.patients.patient_id,
                        full_name: appointment.patients.profile?.full_name,
                        phone_number: appointment.patients.profile?.phone_number
                    } : null
                });
            });
            return {
                doctorId,
                weekStart: startDateStr,
                weekEnd: endDateStr,
                schedule: weeklySchedule,
                totalAppointments: data?.length || 0
            };
        }
        catch (error) {
            logger_1.default.error('Exception in getWeeklySchedule:', error);
            throw error;
        }
    }
    async getAvailableSlots(doctorId, date, duration = 30) {
        try {
            const { data, error } = await this.supabase
                .rpc('find_optimal_time_slots', {
                input_doctor_id: doctorId,
                input_date: date,
                duration_minutes: duration
            });
            if (error) {
                logger_1.default.error('Error fetching available slots:', error);
                throw new Error(`Failed to fetch available slots: ${error.message}`);
            }
            return data || [];
        }
        catch (error) {
            logger_1.default.error('Exception in getAvailableSlots:', error);
            throw error;
        }
    }
    async getDoctorAppointmentStats(doctorId) {
        try {
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const thisWeekStart = new Date(now.setDate(now.getDate() - now.getDay()));
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const { data: appointments, error } = await this.supabase
                .from('appointments')
                .select('appointment_id, status, appointment_type, appointment_date')
                .eq('doctor_id', doctorId);
            if (error) {
                logger_1.default.error('Error fetching doctor appointment stats:', error);
                throw error;
            }
            const appointmentList = appointments || [];
            const total = appointmentList.length;
            const todayAppointments = appointmentList.filter(a => a.appointment_date === today).length;
            const thisWeekAppointments = appointmentList.filter(a => new Date(a.appointment_date) >= thisWeekStart).length;
            const thisMonthAppointments = appointmentList.filter(a => new Date(a.appointment_date) >= thisMonthStart).length;
            const byStatus = {
                scheduled: appointmentList.filter(a => a.status === 'scheduled').length,
                confirmed: appointmentList.filter(a => a.status === 'confirmed').length,
                in_progress: appointmentList.filter(a => a.status === 'in_progress').length,
                completed: appointmentList.filter(a => a.status === 'completed').length,
                cancelled: appointmentList.filter(a => a.status === 'cancelled').length,
                no_show: appointmentList.filter(a => a.status === 'no_show').length
            };
            const byType = {
                consultation: appointmentList.filter(a => a.appointment_type === 'consultation').length,
                follow_up: appointmentList.filter(a => a.appointment_type === 'follow_up').length,
                emergency: appointmentList.filter(a => a.appointment_type === 'emergency').length,
                routine_checkup: appointmentList.filter(a => a.appointment_type === 'routine_checkup').length
            };
            return {
                total_appointments: total,
                appointments_this_month: thisMonthAppointments,
                today_appointments: todayAppointments,
                this_week_appointments: thisWeekAppointments,
                by_status: byStatus,
                by_type: byType
            };
        }
        catch (error) {
            logger_1.default.error('Exception in getDoctorAppointmentStats:', error);
            throw error;
        }
    }
    async getDoctorPatientCount(doctorId) {
        try {
            const { data: appointments, error } = await this.supabase
                .from('appointments')
                .select('patient_id')
                .eq('doctor_id', doctorId);
            if (error) {
                logger_1.default.error('Error fetching doctor patient count:', error);
                throw error;
            }
            const uniquePatients = [...new Set((appointments || []).map(a => a.patient_id))];
            return uniquePatients.length;
        }
        catch (error) {
            logger_1.default.error('Exception in getDoctorPatientCount:', error);
            throw error;
        }
    }
}
exports.AppointmentRepository = AppointmentRepository;
//# sourceMappingURL=appointment.repository.js.map