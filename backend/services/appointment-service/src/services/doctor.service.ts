import axios from 'axios';
import logger from '@hospital/shared/dist/utils/logger';
import {
  DoctorInfo,
  DoctorServiceResponse,
  DoctorAvailabilityResponse,
  DoctorTimeSlotsResponse
} from '../types/appointment.types';

export class DoctorService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.DOCTOR_SERVICE_URL || 'http://doctor-service:3002';
  }

  // Get doctor information by ID
  async getDoctorById(doctorId: string): Promise<DoctorInfo | null> {
    try {
      const response = await axios.get<DoctorServiceResponse>(`${this.baseUrl}/api/doctors/${doctorId}`, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success && response.data.data) {
        const doctor = response.data.data;
        return {
          doctor_id: doctor.doctor_id,
          full_name: doctor.full_name,
          specialty: doctor.specialty,
          phone_number: doctor.phone_number,
          email: doctor.email,
          is_available: true // Will be determined by schedule check
        };
      }

      return null;
    } catch (error) {
      logger.error('Error fetching doctor information:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        doctorId
      });
      return null;
    }
  }

  // Check doctor availability for a specific date and time
  async checkDoctorAvailability(
    doctorId: string,
    date: string,
    startTime: string,
    endTime: string
  ): Promise<boolean> {
    try {
      const response = await axios.get<DoctorAvailabilityResponse>(
        `${this.baseUrl}/api/doctors/${doctorId}/availability`,
        {
          params: { date },
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success && response.data.data) {
        const availability = response.data.data;
        
        // Check if doctor is available on this day
        if (!availability.is_available) {
          return false;
        }

        // Check if requested time is within working hours
        const requestStart = this.timeToMinutes(startTime);
        const requestEnd = this.timeToMinutes(endTime);
        const workStart = this.timeToMinutes(availability.start_time);
        const workEnd = this.timeToMinutes(availability.end_time);

        if (requestStart < workStart || requestEnd > workEnd) {
          return false;
        }

        // Check if requested time conflicts with break time
        if (availability.break_start && availability.break_end) {
          const breakStart = this.timeToMinutes(availability.break_start);
          const breakEnd = this.timeToMinutes(availability.break_end);

          if (
            (requestStart >= breakStart && requestStart < breakEnd) ||
            (requestEnd > breakStart && requestEnd <= breakEnd) ||
            (requestStart <= breakStart && requestEnd >= breakEnd)
          ) {
            return false;
          }
        }

        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error checking doctor availability:', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        doctorId,
        date,
        startTime,
        endTime
      });
      return false;
    }
  }

  // Get available time slots for a doctor on a specific date
  async getAvailableTimeSlots(
    doctorId: string,
    date: string,
    duration: number = 30
  ): Promise<{ start_time: string; end_time: string }[]> {
    try {
      const response = await axios.get<DoctorTimeSlotsResponse>(
        `${this.baseUrl}/api/doctors/${doctorId}/time-slots`,
        {
          params: { date, duration },
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return [];
    } catch (error) {
      logger.error('Error fetching available time slots:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        doctorId,
        date,
        duration
      });
      return [];
    }
  }

  // Verify doctor exists
  async verifyDoctorExists(doctorId: string): Promise<boolean> {
    try {
      const doctor = await this.getDoctorById(doctorId);
      return doctor !== null;
    } catch (error) {
      logger.error('Error verifying doctor existence:', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        doctorId 
      });
      return false;
    }
  }

  // Helper method to convert time string to minutes
  private timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Helper method to convert minutes to time string
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
}
