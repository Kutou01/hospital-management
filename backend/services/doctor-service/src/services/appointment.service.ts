import axios from 'axios';
import logger from '@hospital/shared/dist/utils/logger';

interface AppointmentData {
  appointment_id: string;
  patient_id: string;
  patient_name?: string;
  patient_phone?: string;
  patient_email?: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  appointment_type: string;
  notes?: string;
}

interface AppointmentServiceResponse {
  success: boolean;
  data: AppointmentData[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface AppointmentStats {
  total_appointments: number;
  appointments_this_month: number;
  appointments_today: number;
  monthly_stats: Array<{
    month: string;
    appointments: number;
    patients: number;
  }>;
  appointment_types: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
}

export class AppointmentService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3004';
  }

  // Get doctor's appointments
  async getDoctorAppointments(
    doctorId: string,
    filters: {
      date?: string;
      status?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ appointments: AppointmentData[]; pagination?: any }> {
    try {
      const params = new URLSearchParams();
      if (filters.date) params.append('date', filters.date);
      if (filters.status) params.append('status', filters.status);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await axios.get<AppointmentServiceResponse>(
        `${this.baseUrl}/api/appointments/doctor/${doctorId}?${params.toString()}`,
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        return {
          appointments: response.data.data || [],
          pagination: response.data.pagination
        };
      }

      return { appointments: [] };
    } catch (error) {
      logger.error('Error fetching doctor appointments from Appointment Service:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        doctorId,
        filters
      });
      
      // Return empty array instead of throwing error to maintain service availability
      return { appointments: [] };
    }
  }

  // Get appointment statistics for a doctor
  async getDoctorAppointmentStats(doctorId: string): Promise<AppointmentStats> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/appointments/doctor/${doctorId}/stats`,
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      // Return default stats if service is unavailable
      return this.getDefaultStats();
    } catch (error) {
      logger.error('Error fetching appointment stats from Appointment Service:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        doctorId
      });
      
      // Return default stats to maintain service availability
      return this.getDefaultStats();
    }
  }

  // Get total patient count for a doctor
  async getDoctorPatientCount(doctorId: string): Promise<number> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/appointments/doctor/${doctorId}/patients/count`,
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success && response.data.data) {
        return response.data.data.total_patients || 0;
      }

      return 0;
    } catch (error) {
      logger.error('Error fetching patient count from Appointment Service:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        doctorId
      });
      
      return 0;
    }
  }

  // Check if Appointment Service is available
  async isServiceAvailable(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 2000
      });
      
      return response.status === 200;
    } catch (error) {
      logger.warn('Appointment Service is not available:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        baseUrl: this.baseUrl
      });
      
      return false;
    }
  }

  // Get appointments for today
  async getTodayAppointments(doctorId: string): Promise<AppointmentData[]> {
    const today = new Date().toISOString().split('T')[0];
    const result = await this.getDoctorAppointments(doctorId, { 
      date: today,
      limit: 100 
    });
    
    return result.appointments;
  }

  // Get appointments for current month
  async getMonthlyAppointments(doctorId: string): Promise<AppointmentData[]> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const response = await axios.get(
        `${this.baseUrl}/api/appointments/doctor/${doctorId}`,
        {
          params: {
            start_date: startOfMonth.toISOString().split('T')[0],
            end_date: endOfMonth.toISOString().split('T')[0],
            limit: 1000
          },
          timeout: 5000
        }
      );

      if (response.data.success) {
        return response.data.data || [];
      }

      return [];
    } catch (error) {
      logger.error('Error fetching monthly appointments:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        doctorId
      });
      
      return [];
    }
  }

  private getDefaultStats(): AppointmentStats {
    return {
      total_appointments: 0,
      appointments_this_month: 0,
      appointments_today: 0,
      monthly_stats: [
        { month: 'Jan', appointments: 0, patients: 0 },
        { month: 'Feb', appointments: 0, patients: 0 },
        { month: 'Mar', appointments: 0, patients: 0 },
        { month: 'Apr', appointments: 0, patients: 0 },
        { month: 'May', appointments: 0, patients: 0 },
        { month: 'Jun', appointments: 0, patients: 0 }
      ],
      appointment_types: [
        { type: 'Khám tổng quát', count: 0, percentage: 0 },
        { type: 'Tái khám', count: 0, percentage: 0 },
        { type: 'Khám chuyên khoa', count: 0, percentage: 0 },
        { type: 'Tư vấn', count: 0, percentage: 0 }
      ]
    };
  }
}
