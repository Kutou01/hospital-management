"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
class AppointmentService {
    constructor() {
        this.baseUrl = process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3004';
    }
    async getDoctorAppointments(doctorId, filters = {}) {
        try {
            const params = new URLSearchParams();
            if (filters.date)
                params.append('date', filters.date);
            if (filters.status)
                params.append('status', filters.status);
            if (filters.page)
                params.append('page', filters.page.toString());
            if (filters.limit)
                params.append('limit', filters.limit.toString());
            const response = await axios_1.default.get(`${this.baseUrl}/api/appointments/doctor/${doctorId}?${params.toString()}`, {
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.success) {
                return {
                    appointments: response.data.data || [],
                    pagination: response.data.pagination
                };
            }
            return { appointments: [] };
        }
        catch (error) {
            logger_1.default.error('Error fetching doctor appointments from Appointment Service:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                doctorId,
                filters
            });
            return { appointments: [] };
        }
    }
    async getDoctorAppointmentStats(doctorId) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/api/appointments/doctor/${doctorId}/stats`, {
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.success && response.data.data) {
                return response.data.data;
            }
            return this.getDefaultStats();
        }
        catch (error) {
            logger_1.default.error('Error fetching appointment stats from Appointment Service:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                doctorId
            });
            return this.getDefaultStats();
        }
    }
    async getDoctorPatientCount(doctorId) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/api/appointments/doctor/${doctorId}/patients/count`, {
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.success && response.data.data) {
                return response.data.data.total_patients || 0;
            }
            return 0;
        }
        catch (error) {
            logger_1.default.error('Error fetching patient count from Appointment Service:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                doctorId
            });
            return 0;
        }
    }
    async isServiceAvailable() {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/health`, {
                timeout: 2000
            });
            return response.status === 200;
        }
        catch (error) {
            logger_1.default.warn('Appointment Service is not available:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                baseUrl: this.baseUrl
            });
            return false;
        }
    }
    async getTodayAppointments(doctorId) {
        const today = new Date().toISOString().split('T')[0];
        const result = await this.getDoctorAppointments(doctorId, {
            date: today,
            limit: 100
        });
        return result.appointments;
    }
    async getMonthlyAppointments(doctorId) {
        try {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            const response = await axios_1.default.get(`${this.baseUrl}/api/appointments/doctor/${doctorId}`, {
                params: {
                    start_date: startOfMonth.toISOString().split('T')[0],
                    end_date: endOfMonth.toISOString().split('T')[0],
                    limit: 1000
                },
                timeout: 5000
            });
            if (response.data.success) {
                return response.data.data || [];
            }
            return [];
        }
        catch (error) {
            logger_1.default.error('Error fetching monthly appointments:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                doctorId
            });
            return [];
        }
    }
    getDefaultStats() {
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
exports.AppointmentService = AppointmentService;
//# sourceMappingURL=appointment.service.js.map