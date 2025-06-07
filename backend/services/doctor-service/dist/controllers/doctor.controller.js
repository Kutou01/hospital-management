"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorController = void 0;
const express_validator_1 = require("express-validator");
const doctor_repository_1 = require("../repositories/doctor.repository");
const schedule_repository_1 = require("../repositories/schedule.repository");
const review_repository_1 = require("../repositories/review.repository");
const shift_repository_1 = require("../repositories/shift.repository");
const experience_repository_1 = require("../repositories/experience.repository");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
class DoctorController {
    constructor() {
        this.doctorRepository = new doctor_repository_1.DoctorRepository();
        this.scheduleRepository = new schedule_repository_1.ScheduleRepository();
        this.reviewRepository = new review_repository_1.ReviewRepository();
        this.shiftRepository = new shift_repository_1.ShiftRepository();
        this.experienceRepository = new experience_repository_1.ExperienceRepository();
    }
    async getAllDoctors(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const offset = (page - 1) * limit;
            const doctors = await this.doctorRepository.findAll(limit, offset);
            const total = await this.doctorRepository.count();
            res.json({
                success: true,
                data: doctors,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching doctors', { error });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async getDoctorById(req, res) {
        try {
            const { doctorId } = req.params;
            const doctor = await this.doctorRepository.findById(doctorId);
            if (!doctor) {
                res.status(404).json({
                    success: false,
                    message: 'Doctor not found'
                });
                return;
            }
            res.json({
                success: true,
                data: doctor
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching doctor by ID', { error, doctorId: req.params.doctorId });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async getDoctorByProfileId(req, res) {
        try {
            const { profileId } = req.params;
            const doctor = await this.doctorRepository.findByProfileId(profileId);
            if (!doctor) {
                res.status(404).json({
                    success: false,
                    message: 'Doctor not found for this profile'
                });
                return;
            }
            res.json({
                success: true,
                data: doctor
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching doctor by profile ID', { error, profileId: req.params.profileId });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async getDoctorsByDepartment(req, res) {
        try {
            const { departmentId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const offset = (page - 1) * limit;
            const doctors = await this.doctorRepository.findByDepartment(departmentId, limit, offset);
            const total = await this.doctorRepository.countByDepartment(departmentId);
            res.json({
                success: true,
                data: doctors,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching doctors by department', { error, departmentId: req.params.departmentId });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async searchDoctors(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const offset = (page - 1) * limit;
            const searchQuery = {
                specialty: req.query.specialty,
                department_id: req.query.department_id,
                gender: req.query.gender,
                search: req.query.search
            };
            const doctors = await this.doctorRepository.search(searchQuery, limit, offset);
            res.json({
                success: true,
                data: doctors,
                pagination: {
                    page,
                    limit,
                    total: doctors.length
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error searching doctors', { error, query: req.query });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async createDoctor(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
                return;
            }
            const doctor = await this.doctorRepository.create(req.body);
            res.status(201).json({
                success: true,
                message: 'Doctor created successfully',
                data: doctor
            });
        }
        catch (error) {
            logger_1.default.error('Error creating doctor', { error, body: req.body });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async updateDoctor(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
                return;
            }
            const { doctorId } = req.params;
            const doctor = await this.doctorRepository.update(doctorId, req.body);
            if (!doctor) {
                res.status(404).json({
                    success: false,
                    message: 'Doctor not found'
                });
                return;
            }
            res.json({
                success: true,
                message: 'Doctor updated successfully',
                data: doctor
            });
        }
        catch (error) {
            logger_1.default.error('Error updating doctor', { error, doctorId: req.params.doctorId, body: req.body });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async deleteDoctor(req, res) {
        try {
            const { doctorId } = req.params;
            const success = await this.doctorRepository.delete(doctorId);
            if (!success) {
                res.status(404).json({
                    success: false,
                    message: 'Doctor not found'
                });
                return;
            }
            res.json({
                success: true,
                message: 'Doctor deleted successfully'
            });
        }
        catch (error) {
            logger_1.default.error('Error deleting doctor', { error, doctorId: req.params.doctorId });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async getDoctorSchedule(req, res) {
        try {
            const { doctorId } = req.params;
            const schedule = await this.scheduleRepository.findByDoctorId(doctorId);
            res.json({
                success: true,
                data: schedule
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching doctor schedule', { error, doctorId: req.params.doctorId });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async getWeeklySchedule(req, res) {
        try {
            const { doctorId } = req.params;
            const schedule = await this.scheduleRepository.getWeeklySchedule(doctorId);
            res.json({
                success: true,
                data: schedule
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching weekly schedule', { error, doctorId: req.params.doctorId });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async updateSchedule(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
                return;
            }
            const { doctorId } = req.params;
            const { schedules } = req.body;
            const updatedSchedules = await this.scheduleRepository.bulkUpdateSchedule(doctorId, schedules);
            res.json({
                success: true,
                message: 'Schedule updated successfully',
                data: updatedSchedules
            });
        }
        catch (error) {
            logger_1.default.error('Error updating schedule', { error, doctorId: req.params.doctorId, body: req.body });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async getAvailability(req, res) {
        try {
            const { doctorId } = req.params;
            const { date } = req.query;
            if (!date) {
                res.status(400).json({
                    success: false,
                    message: 'Date parameter is required'
                });
                return;
            }
            const checkDate = new Date(date);
            const availability = await this.scheduleRepository.getAvailability(doctorId, checkDate);
            res.json({
                success: true,
                data: availability
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching availability', { error, doctorId: req.params.doctorId, date: req.query.date });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async getAvailableTimeSlots(req, res) {
        try {
            const { doctorId } = req.params;
            const { date } = req.query;
            if (!date) {
                res.status(400).json({
                    success: false,
                    message: 'Date parameter is required'
                });
                return;
            }
            const checkDate = new Date(date);
            const timeSlots = await this.scheduleRepository.getAvailableTimeSlots(doctorId, checkDate);
            res.json({
                success: true,
                data: timeSlots
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching available time slots', { error, doctorId: req.params.doctorId, date: req.query.date });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async getDoctorReviews(req, res) {
        try {
            const { doctorId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;
            const reviews = await this.reviewRepository.findByDoctorId(doctorId, limit, offset);
            res.json({
                success: true,
                data: reviews,
                pagination: {
                    page,
                    limit,
                    total: reviews.length
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching doctor reviews', { error, doctorId: req.params.doctorId });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async getReviewStats(req, res) {
        try {
            const { doctorId } = req.params;
            const stats = await this.reviewRepository.getReviewStats(doctorId);
            res.json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching review stats', { error, doctorId: req.params.doctorId });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async getDoctorShifts(req, res) {
        try {
            const { doctorId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;
            const shifts = await this.shiftRepository.findByDoctorId(doctorId, limit, offset);
            res.json({
                success: true,
                data: shifts,
                pagination: {
                    page,
                    limit,
                    total: shifts.length
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching doctor shifts', { error, doctorId: req.params.doctorId });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async getUpcomingShifts(req, res) {
        try {
            const { doctorId } = req.params;
            const days = parseInt(req.query.days) || 7;
            const shifts = await this.shiftRepository.getUpcomingShifts(doctorId, days);
            res.json({
                success: true,
                data: shifts
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching upcoming shifts', { error, doctorId: req.params.doctorId });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async createShift(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
                return;
            }
            const shift = await this.shiftRepository.create(req.body);
            res.status(201).json({
                success: true,
                message: 'Shift created successfully',
                data: shift
            });
        }
        catch (error) {
            logger_1.default.error('Error creating shift', { error, body: req.body });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async updateShift(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
                return;
            }
            const { shiftId } = req.params;
            const shift = await this.shiftRepository.update(shiftId, req.body);
            if (!shift) {
                res.status(404).json({
                    success: false,
                    message: 'Shift not found'
                });
                return;
            }
            res.json({
                success: true,
                message: 'Shift updated successfully',
                data: shift
            });
        }
        catch (error) {
            logger_1.default.error('Error updating shift', { error, shiftId: req.params.shiftId, body: req.body });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async confirmShift(req, res) {
        try {
            const { shiftId } = req.params;
            const shift = await this.shiftRepository.confirmShift(shiftId);
            if (!shift) {
                res.status(404).json({
                    success: false,
                    message: 'Shift not found'
                });
                return;
            }
            res.json({
                success: true,
                message: 'Shift confirmed successfully',
                data: shift
            });
        }
        catch (error) {
            logger_1.default.error('Error confirming shift', { error, shiftId: req.params.shiftId });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async getShiftStatistics(req, res) {
        try {
            const { doctorId } = req.params;
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) {
                res.status(400).json({
                    success: false,
                    message: 'Start date and end date are required'
                });
                return;
            }
            const stats = await this.shiftRepository.getShiftStatistics(doctorId, new Date(startDate), new Date(endDate));
            res.json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching shift statistics', { error, doctorId: req.params.doctorId });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async getDoctorExperiences(req, res) {
        try {
            const { doctorId } = req.params;
            const { type } = req.query;
            let experiences;
            if (type) {
                experiences = await this.experienceRepository.findByType(doctorId, type);
            }
            else {
                experiences = await this.experienceRepository.findByDoctorId(doctorId);
            }
            res.json({
                success: true,
                data: experiences
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching doctor experiences', { error, doctorId: req.params.doctorId });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async getExperienceTimeline(req, res) {
        try {
            const { doctorId } = req.params;
            const timeline = await this.experienceRepository.getExperienceTimeline(doctorId);
            res.json({
                success: true,
                data: timeline
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching experience timeline', { error, doctorId: req.params.doctorId });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async getTotalExperience(req, res) {
        try {
            const { doctorId } = req.params;
            const totalExperience = await this.experienceRepository.calculateTotalExperience(doctorId);
            res.json({
                success: true,
                data: totalExperience
            });
        }
        catch (error) {
            logger_1.default.error('Error calculating total experience', { error, doctorId: req.params.doctorId });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async createExperience(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
                return;
            }
            const experience = await this.experienceRepository.create(req.body);
            res.status(201).json({
                success: true,
                message: 'Experience created successfully',
                data: experience
            });
        }
        catch (error) {
            logger_1.default.error('Error creating experience', { error, body: req.body });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async updateExperience(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
                return;
            }
            const { experienceId } = req.params;
            const experience = await this.experienceRepository.update(experienceId, req.body);
            if (!experience) {
                res.status(404).json({
                    success: false,
                    message: 'Experience not found'
                });
                return;
            }
            res.json({
                success: true,
                message: 'Experience updated successfully',
                data: experience
            });
        }
        catch (error) {
            logger_1.default.error('Error updating experience', { error, experienceId: req.params.experienceId, body: req.body });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async deleteExperience(req, res) {
        try {
            const { experienceId } = req.params;
            const success = await this.experienceRepository.delete(experienceId);
            if (!success) {
                res.status(404).json({
                    success: false,
                    message: 'Experience not found'
                });
                return;
            }
            res.json({
                success: true,
                message: 'Experience deleted successfully'
            });
        }
        catch (error) {
            logger_1.default.error('Error deleting experience', { error, experienceId: req.params.experienceId });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async getDoctorProfile(req, res) {
        try {
            const { doctorId } = req.params;
            const doctor = await this.doctorRepository.findById(doctorId);
            if (!doctor) {
                res.status(404).json({
                    success: false,
                    message: 'Doctor not found'
                });
                return;
            }
            const [schedule, reviewStats, experiences, upcomingShifts] = await Promise.all([
                this.scheduleRepository.getWeeklySchedule(doctorId),
                this.reviewRepository.getReviewStats(doctorId),
                this.experienceRepository.findByDoctorId(doctorId),
                this.shiftRepository.getUpcomingShifts(doctorId, 7)
            ]);
            const profile = {
                ...doctor,
                schedule,
                review_stats: reviewStats,
                experiences,
                current_shifts: upcomingShifts
            };
            res.json({
                success: true,
                data: profile
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching doctor profile', { error, doctorId: req.params.doctorId });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async getDoctorAppointments(req, res) {
        try {
            const { doctorId } = req.params;
            const { date, status, page = 1, limit = 10 } = req.query;
            const doctor = await this.doctorRepository.findById(doctorId);
            if (!doctor) {
                res.status(404).json({
                    success: false,
                    message: 'Doctor not found'
                });
                return;
            }
            const mockAppointments = [
                {
                    appointment_id: 'APT001',
                    patient_name: 'Nguyễn Văn A',
                    patient_phone: '0901234567',
                    patient_email: 'nguyenvana@email.com',
                    appointment_date: '2024-01-15',
                    start_time: '09:00',
                    end_time: '09:30',
                    appointment_type: 'Khám tổng quát',
                    status: 'confirmed',
                    reason: 'Khám sức khỏe định kỳ',
                    notes: 'Bệnh nhân có tiền sử cao huyết áp'
                },
                {
                    appointment_id: 'APT002',
                    patient_name: 'Trần Thị B',
                    patient_phone: '0907654321',
                    patient_email: 'tranthib@email.com',
                    appointment_date: '2024-01-15',
                    start_time: '10:00',
                    end_time: '10:30',
                    appointment_type: 'Tái khám',
                    status: 'pending',
                    reason: 'Theo dõi điều trị',
                    notes: 'Cần kiểm tra kết quả xét nghiệm'
                }
            ];
            let filteredAppointments = mockAppointments;
            if (date) {
                filteredAppointments = filteredAppointments.filter(apt => apt.appointment_date === date);
            }
            if (status) {
                filteredAppointments = filteredAppointments.filter(apt => apt.status === status);
            }
            const startIndex = (Number(page) - 1) * Number(limit);
            const endIndex = startIndex + Number(limit);
            const paginatedAppointments = filteredAppointments.slice(startIndex, endIndex);
            res.json({
                success: true,
                data: paginatedAppointments,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: filteredAppointments.length,
                    totalPages: Math.ceil(filteredAppointments.length / Number(limit))
                }
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching doctor appointments', { error, doctorId: req.params.doctorId });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    async getDoctorStats(req, res) {
        try {
            const { doctorId } = req.params;
            const doctor = await this.doctorRepository.findById(doctorId);
            if (!doctor) {
                res.status(404).json({
                    success: false,
                    message: 'Doctor not found'
                });
                return;
            }
            const reviewStats = await this.reviewRepository.getReviewStats(doctorId);
            const stats = {
                total_patients: 150,
                total_appointments: 1250,
                appointments_this_month: 45,
                appointments_today: 8,
                success_rate: 95.5,
                average_rating: reviewStats.average_rating || 4.5,
                total_reviews: reviewStats.total_reviews || 25,
                years_experience: 5,
                specialization: doctor.specialty,
                department: doctor.department_id,
                status: 'active',
                monthly_stats: [
                    { month: 'Jan', appointments: 42, patients: 38 },
                    { month: 'Feb', appointments: 38, patients: 35 },
                    { month: 'Mar', appointments: 45, patients: 41 },
                    { month: 'Apr', appointments: 52, patients: 48 },
                    { month: 'May', appointments: 48, patients: 44 },
                    { month: 'Jun', appointments: 55, patients: 51 }
                ],
                appointment_types: [
                    { type: 'Khám tổng quát', count: 45, percentage: 40 },
                    { type: 'Tái khám', count: 35, percentage: 31 },
                    { type: 'Khám chuyên khoa', count: 25, percentage: 22 },
                    { type: 'Tư vấn', count: 8, percentage: 7 }
                ]
            };
            res.json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching doctor stats', { error, doctorId: req.params.doctorId });
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
}
exports.DoctorController = DoctorController;
//# sourceMappingURL=doctor.controller.js.map