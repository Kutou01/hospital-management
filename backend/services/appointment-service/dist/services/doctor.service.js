"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
class DoctorService {
    constructor() {
        this.baseUrl = process.env.DOCTOR_SERVICE_URL || 'http://doctor-service:3002';
    }
    async getDoctorById(doctorId) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/api/doctors/${doctorId}`, {
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
                    is_available: true
                };
            }
            return null;
        }
        catch (error) {
            logger_1.default.error('Error fetching doctor information:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                doctorId
            });
            return null;
        }
    }
    async checkDoctorAvailability(doctorId, date, startTime, endTime) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/api/doctors/${doctorId}/availability`, {
                params: { date },
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.success && response.data.data) {
                const availability = response.data.data;
                if (!availability.is_available) {
                    return false;
                }
                const requestStart = this.timeToMinutes(startTime);
                const requestEnd = this.timeToMinutes(endTime);
                const workStart = this.timeToMinutes(availability.start_time);
                const workEnd = this.timeToMinutes(availability.end_time);
                if (requestStart < workStart || requestEnd > workEnd) {
                    return false;
                }
                if (availability.break_start && availability.break_end) {
                    const breakStart = this.timeToMinutes(availability.break_start);
                    const breakEnd = this.timeToMinutes(availability.break_end);
                    if ((requestStart >= breakStart && requestStart < breakEnd) ||
                        (requestEnd > breakStart && requestEnd <= breakEnd) ||
                        (requestStart <= breakStart && requestEnd >= breakEnd)) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        }
        catch (error) {
            logger_1.default.error('Error checking doctor availability:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                doctorId,
                date,
                startTime,
                endTime
            });
            return false;
        }
    }
    async getAvailableTimeSlots(doctorId, date, duration = 30) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/api/doctors/${doctorId}/time-slots`, {
                params: { date, duration },
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.success && response.data.data) {
                return response.data.data;
            }
            return [];
        }
        catch (error) {
            logger_1.default.error('Error fetching available time slots:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                doctorId,
                date,
                duration
            });
            return [];
        }
    }
    async verifyDoctorExists(doctorId) {
        try {
            const doctor = await this.getDoctorById(doctorId);
            return doctor !== null;
        }
        catch (error) {
            logger_1.default.error('Error verifying doctor existence:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                doctorId
            });
            return false;
        }
    }
    timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }
    minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
}
exports.DoctorService = DoctorService;
//# sourceMappingURL=doctor.service.js.map