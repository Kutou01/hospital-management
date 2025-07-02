"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorService = void 0;
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const api_gateway_client_1 = require("@hospital/shared/dist/clients/api-gateway.client");
class DoctorService {
    constructor() {
        this.apiGatewayClient = (0, api_gateway_client_1.createApiGatewayClient)({
            ...api_gateway_client_1.defaultApiGatewayConfig,
            serviceName: 'appointment-service',
        });
    }
    async getDoctorById(doctorId) {
        try {
            logger_1.default.info('🔄 Fetching doctor info via API Gateway', { doctorId });
            const response = await this.apiGatewayClient.getDoctor(doctorId);
            if (response.success && response.data) {
                const doctor = response.data;
                logger_1.default.info('✅ Doctor info fetched successfully via API Gateway', { doctorId });
                return {
                    doctor_id: doctor.doctor_id,
                    full_name: doctor.full_name,
                    specialty: doctor.specialty,
                    phone_number: doctor.phone_number,
                    email: doctor.email,
                    is_available: true
                };
            }
            logger_1.default.warn('⚠️ Doctor not found via API Gateway', { doctorId });
            return null;
        }
        catch (error) {
            logger_1.default.error('❌ Error fetching doctor info via API Gateway:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                doctorId
            });
            return null;
        }
    }
    async checkDoctorAvailability(doctorId, date, startTime, endTime) {
        try {
            logger_1.default.info('🔄 Checking doctor availability via API Gateway', {
                doctorId,
                date,
                startTime,
                endTime
            });
            const response = await this.apiGatewayClient.getDoctorAvailability(doctorId, date);
            if (response.success && response.data) {
                const availability = response.data;
                if (!availability.is_available) {
                    logger_1.default.info('⚠️ Doctor not available on this date via API Gateway', { doctorId, date });
                    return false;
                }
                const requestStart = this.timeToMinutes(startTime);
                const requestEnd = this.timeToMinutes(endTime);
                const workStart = this.timeToMinutes(availability.start_time);
                const workEnd = this.timeToMinutes(availability.end_time);
                if (requestStart < workStart || requestEnd > workEnd) {
                    logger_1.default.info('⚠️ Requested time outside working hours via API Gateway', {
                        doctorId,
                        requestStart,
                        requestEnd,
                        workStart,
                        workEnd
                    });
                    return false;
                }
                if (availability.break_start && availability.break_end) {
                    const breakStart = this.timeToMinutes(availability.break_start);
                    const breakEnd = this.timeToMinutes(availability.break_end);
                    if ((requestStart >= breakStart && requestStart < breakEnd) ||
                        (requestEnd > breakStart && requestEnd <= breakEnd) ||
                        (requestStart <= breakStart && requestEnd >= breakEnd)) {
                        logger_1.default.info('⚠️ Requested time conflicts with break time via API Gateway', {
                            doctorId,
                            breakStart,
                            breakEnd
                        });
                        return false;
                    }
                }
                logger_1.default.info('✅ Doctor is available via API Gateway', { doctorId, date, startTime, endTime });
                return true;
            }
            logger_1.default.warn('⚠️ No availability data found via API Gateway', { doctorId, date });
            return false;
        }
        catch (error) {
            logger_1.default.error('❌ Error checking doctor availability via API Gateway:', {
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
            logger_1.default.info('🔄 Fetching available time slots via API Gateway', {
                doctorId,
                date,
                duration
            });
            const response = await this.apiGatewayClient.getDoctorTimeSlots(doctorId, date, duration);
            if (response.success && response.data) {
                logger_1.default.info('✅ Time slots fetched successfully via API Gateway', {
                    doctorId,
                    date,
                    slotsCount: response.data.length
                });
                return response.data;
            }
            logger_1.default.warn('⚠️ No time slots found via API Gateway', { doctorId, date });
            return [];
        }
        catch (error) {
            logger_1.default.error('❌ Error fetching time slots via API Gateway:', {
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
            logger_1.default.info('🔄 Verifying doctor existence via API Gateway', { doctorId });
            const doctor = await this.getDoctorById(doctorId);
            const exists = doctor !== null;
            if (exists) {
                logger_1.default.info('✅ Doctor exists via API Gateway', { doctorId });
            }
            else {
                logger_1.default.warn('⚠️ Doctor does not exist via API Gateway', { doctorId });
            }
            return exists;
        }
        catch (error) {
            logger_1.default.error('❌ Error verifying doctor existence via API Gateway:', {
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