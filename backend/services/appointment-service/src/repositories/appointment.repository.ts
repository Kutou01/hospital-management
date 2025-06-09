import { getSupabase } from '../config/database.config';
import logger from '@hospital/shared/dist/utils/logger';
import { 
  Appointment, 
  AppointmentWithDetails, 
  CreateAppointmentDto, 
  UpdateAppointmentDto, 
  AppointmentSearchFilters,
  ConflictCheck,
  AppointmentStats
} from '../types/appointment.types';

export class AppointmentRepository {
  private supabase = getSupabase();

  // Generate appointment ID
  private generateAppointmentId(): string {
    const timestamp = Date.now().toString().slice(-6);
    return `APT${timestamp}`;
  }

  // Get all appointments with optional filters and pagination
  async getAllAppointments(
    filters: AppointmentSearchFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ appointments: AppointmentWithDetails[]; total: number }> {
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

      // Apply filters
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
        // Search in reason, notes, or joined patient/doctor names
        query = query.or(`reason.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      // Order by appointment date and time
      query = query.order('appointment_date', { ascending: true })
                   .order('start_time', { ascending: true });

      const { data, error, count } = await query;

      if (error) {
        logger.error('Error fetching appointments:', error);
        throw new Error(`Failed to fetch appointments: ${error.message}`);
      }

      // Transform data to include nested patient/doctor info
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
        appointments: transformedData as AppointmentWithDetails[],
        total: count || 0
      };
    } catch (error) {
      logger.error('Exception in getAllAppointments:', error);
      throw error;
    }
  }

  // Get appointment by ID
  async getAppointmentById(appointmentId: string): Promise<AppointmentWithDetails | null> {
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
          return null; // Appointment not found
        }
        logger.error('Error fetching appointment by ID:', error);
        throw new Error(`Failed to fetch appointment: ${error.message}`);
      }

      // Transform data
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

      return transformedData as AppointmentWithDetails;
    } catch (error) {
      logger.error('Exception in getAppointmentById:', error);
      throw error;
    }
  }

  // Get appointments by doctor ID
  async getAppointmentsByDoctorId(
    doctorId: string,
    filters: Partial<AppointmentSearchFilters> = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ appointments: AppointmentWithDetails[]; total: number }> {
    const searchFilters = { ...filters, doctor_id: doctorId };
    return this.getAllAppointments(searchFilters, page, limit);
  }

  // Get appointments by patient ID
  async getAppointmentsByPatientId(
    patientId: string,
    filters: Partial<AppointmentSearchFilters> = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ appointments: AppointmentWithDetails[]; total: number }> {
    const searchFilters = { ...filters, patient_id: patientId };
    return this.getAllAppointments(searchFilters, page, limit);
  }

  // Create new appointment
  async createAppointment(appointmentData: CreateAppointmentDto): Promise<Appointment> {
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
        logger.error('Error creating appointment:', error);
        throw new Error(`Failed to create appointment: ${error.message}`);
      }

      logger.info('Appointment created successfully:', { appointmentId });
      return data as Appointment;
    } catch (error) {
      logger.error('Exception in createAppointment:', error);
      throw error;
    }
  }

  // Update appointment
  async updateAppointment(appointmentId: string, updateData: UpdateAppointmentDto): Promise<Appointment> {
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
        logger.error('Error updating appointment:', error);
        throw new Error(`Failed to update appointment: ${error.message}`);
      }

      logger.info('Appointment updated successfully:', { appointmentId });
      return data as Appointment;
    } catch (error) {
      logger.error('Exception in updateAppointment:', error);
      throw error;
    }
  }

  // Cancel appointment (soft delete by setting status to cancelled)
  async cancelAppointment(appointmentId: string, reason?: string): Promise<boolean> {
    try {
      const updateData: any = { 
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
        logger.error('Error cancelling appointment:', error);
        throw new Error(`Failed to cancel appointment: ${error.message}`);
      }

      logger.info('Appointment cancelled successfully:', { appointmentId });
      return true;
    } catch (error) {
      logger.error('Exception in cancelAppointment:', error);
      throw error;
    }
  }

  // Check for appointment conflicts
  async checkConflicts(
    doctorId: string,
    appointmentDate: string,
    startTime: string,
    endTime: string,
    excludeAppointmentId?: string
  ): Promise<ConflictCheck> {
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
        logger.error('Error checking appointment conflicts:', error);
        throw new Error(`Failed to check conflicts: ${error.message}`);
      }

      const conflicts = data?.filter(appointment => {
        const existingStart = appointment.start_time;
        const existingEnd = appointment.end_time;

        // Check for time overlap
        return (
          (startTime >= existingStart && startTime < existingEnd) ||
          (endTime > existingStart && endTime <= existingEnd) ||
          (startTime <= existingStart && endTime >= existingEnd)
        );
      }) || [];

      return {
        has_conflict: conflicts.length > 0,
        conflicting_appointments: conflicts.length > 0 ? conflicts as Appointment[] : undefined,
        message: conflicts.length > 0 ? 'Time slot conflicts with existing appointment' : undefined
      };
    } catch (error) {
      logger.error('Exception in checkConflicts:', error);
      throw error;
    }
  }

  // Check if appointment exists
  async appointmentExists(appointmentId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('appointments')
        .select('appointment_id')
        .eq('appointment_id', appointmentId)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Error checking appointment existence:', error);
        throw new Error(`Failed to check appointment existence: ${error.message}`);
      }

      return !!data;
    } catch (error) {
      logger.error('Exception in appointmentExists:', error);
      throw error;
    }
  }

  // Get appointment statistics
  async getAppointmentStats(): Promise<AppointmentStats> {
    try {
      const { data, error } = await this.supabase
        .from('appointments')
        .select('status, appointment_type, appointment_date, created_at');

      if (error) {
        logger.error('Error fetching appointment stats:', error);
        throw new Error(`Failed to fetch appointment stats: ${error.message}`);
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const stats: AppointmentStats = {
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
        // Count by status
        if (appointment.status in stats.byStatus) {
          stats.byStatus[appointment.status as keyof typeof stats.byStatus]++;
        }

        // Count by type
        if (appointment.appointment_type in stats.byType) {
          stats.byType[appointment.appointment_type as keyof typeof stats.byType]++;
        }

        // Count by date
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
    } catch (error) {
      logger.error('Exception in getAppointmentStats:', error);
      throw error;
    }
  }

  // Get upcoming appointments for a doctor
  async getUpcomingAppointments(
    doctorId: string,
    days: number = 7
  ): Promise<AppointmentWithDetails[]> {
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
        logger.error('Error fetching upcoming appointments:', error);
        throw new Error(`Failed to fetch upcoming appointments: ${error.message}`);
      }

      // Transform data
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

      return transformedData as AppointmentWithDetails[];
    } catch (error) {
      logger.error('Exception in getUpcomingAppointments:', error);
      throw error;
    }
  }
}
