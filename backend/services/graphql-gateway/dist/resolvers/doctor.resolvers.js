"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.doctorResolvers = void 0;
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
/**
 * Doctor GraphQL Resolvers
 * Handles all doctor-related queries, mutations, and subscriptions
 */
exports.doctorResolvers = {
    Query: {
        // Get single doctor
        async doctor(_, { id, doctorId }, context) {
            try {
                const identifier = id || doctorId;
                if (!identifier) {
                    throw new Error("Cần cung cấp ID hoặc mã bác sĩ");
                }
                logger_1.default.debug("Fetching doctor:", {
                    identifier,
                    requestId: context.requestId,
                });
                const response = await context.restApi.getDoctor(identifier);
                if (!response.success) {
                    throw new Error(response.error?.message || "Không thể lấy thông tin bác sĩ");
                }
                return response.data;
            }
            catch (error) {
                logger_1.default.error("Error fetching doctor:", error);
                throw error;
            }
        },
        // Get multiple doctors with filtering and pagination
        async doctors(_, { filters, limit = 20, offset = 0, sortBy = "createdAt", sortOrder = "DESC", }, context) {
            try {
                logger_1.default.debug("Fetching doctors:", {
                    filters,
                    limit,
                    offset,
                    sortBy,
                    sortOrder,
                    requestId: context.requestId,
                });
                const params = {
                    page: Math.floor(offset / limit) + 1,
                    limit,
                    ...filters,
                };
                const response = await context.restApi.getDoctors(params);
                if (!response.success) {
                    throw new Error(response.error?.message || "Không thể lấy danh sách bác sĩ");
                }
                // Transform to GraphQL Connection format
                const doctors = Array.isArray(response.data) ? response.data : [];
                const totalCount = response.pagination?.total || doctors.length;
                return {
                    edges: doctors.map((doctor, index) => ({
                        node: doctor,
                        cursor: Buffer.from(`${offset + index}`).toString("base64"),
                    })),
                    pageInfo: {
                        hasNextPage: response.pagination?.hasNext || false,
                        hasPreviousPage: response.pagination?.hasPrev || false,
                        startCursor: doctors.length > 0
                            ? Buffer.from(`${offset}`).toString("base64")
                            : null,
                        endCursor: doctors.length > 0
                            ? Buffer.from(`${offset + doctors.length - 1}`).toString("base64")
                            : null,
                    },
                    totalCount,
                };
            }
            catch (error) {
                logger_1.default.error("Error fetching doctors:", error);
                throw error;
            }
        },
        // Search doctors
        async searchDoctors(_, { query, filters, limit = 20, offset = 0, }, context) {
            try {
                logger_1.default.debug("Searching doctors:", {
                    query,
                    filters,
                    limit,
                    offset,
                    requestId: context.requestId,
                });
                const params = {
                    page: Math.floor(offset / limit) + 1,
                    limit,
                    search: query,
                    ...filters,
                };
                const response = await context.restApi.getDoctors(params);
                if (!response.success) {
                    throw new Error(response.error?.message || "Không thể tìm kiếm bác sĩ");
                }
                // Transform to GraphQL Connection format
                const doctors = Array.isArray(response.data) ? response.data : [];
                const totalCount = response.pagination?.total || doctors.length;
                return {
                    edges: doctors.map((doctor, index) => ({
                        node: doctor,
                        cursor: Buffer.from(`${offset + index}`).toString("base64"),
                    })),
                    pageInfo: {
                        hasNextPage: response.pagination?.hasNext || false,
                        hasPreviousPage: response.pagination?.hasPrev || false,
                        startCursor: doctors.length > 0
                            ? Buffer.from(`${offset}`).toString("base64")
                            : null,
                        endCursor: doctors.length > 0
                            ? Buffer.from(`${offset + doctors.length - 1}`).toString("base64")
                            : null,
                    },
                    totalCount,
                };
            }
            catch (error) {
                logger_1.default.error("Error searching doctors:", error);
                throw error;
            }
        },
        // Get doctor availability
        async doctorAvailability(_, { doctorId, date }, context) {
            try {
                logger_1.default.debug("Fetching doctor availability:", {
                    doctorId,
                    date,
                    requestId: context.requestId,
                });
                const response = await context.restApi.getAvailableSlots(doctorId, date);
                if (!response.success) {
                    throw new Error(response.error?.message || "Không thể lấy lịch trống của bác sĩ");
                }
                return response.data || [];
            }
            catch (error) {
                logger_1.default.error("Error fetching doctor availability:", error);
                throw error;
            }
        },
        // Get doctor statistics
        async doctorStats(_, { doctorId }, context) {
            try {
                // Use DataLoader for optimization
                const stats = await context.dataloaders.doctorStats.load(doctorId);
                if (!stats) {
                    throw new Error("Không thể lấy thống kê bác sĩ");
                }
                return stats;
            }
            catch (error) {
                logger_1.default.error("Error fetching doctor stats:", error);
                throw error;
            }
        },
        // Get doctor reviews
        async doctorReviews(_, { doctorId, limit = 10, offset = 0, }, context) {
            try {
                logger_1.default.debug("Fetching doctor reviews:", {
                    doctorId,
                    limit,
                    offset,
                    requestId: context.requestId,
                });
                const response = await context.restApi.getDoctorReviews({
                    doctorId,
                    limit,
                    offset,
                });
                if (!response.success) {
                    throw new Error(response.error?.message || "Không thể lấy đánh giá bác sĩ");
                }
                return response.data || [];
            }
            catch (error) {
                logger_1.default.error("Error fetching doctor reviews:", error);
                throw error;
            }
        },
        // Get doctor schedule
        async doctorSchedule(_, { doctorId, date }, context) {
            try {
                logger_1.default.debug("Fetching doctor schedule:", {
                    doctorId,
                    date,
                    requestId: context.requestId,
                });
                const response = await context.restApi.getDoctorSchedule(doctorId, date);
                if (!response.success) {
                    throw new Error(response.error?.message || "Không thể lấy lịch làm việc bác sĩ");
                }
                return response.data || [];
            }
            catch (error) {
                logger_1.default.error("Error fetching doctor schedule:", error);
                throw error;
            }
        },
        // Get single room
        async room(_, { id }, context) {
            try {
                logger_1.default.debug("Fetching room:", { id, requestId: context.requestId });
                const response = await context.restApi.getRoom(id);
                if (!response.success) {
                    throw new Error(response.error?.message || "Không thể lấy thông tin phòng");
                }
                return response.data;
            }
            catch (error) {
                logger_1.default.error("Error fetching room:", error);
                throw error;
            }
        },
        // Get multiple rooms
        async rooms(_, { departmentId, roomType, isActive = true, limit = 20 }, context) {
            try {
                logger_1.default.debug("Fetching rooms:", {
                    departmentId,
                    roomType,
                    isActive,
                    limit,
                    requestId: context.requestId,
                });
                const response = await context.restApi.getRooms({
                    departmentId,
                    roomType,
                    isActive,
                    limit,
                });
                if (!response.success) {
                    throw new Error(response.error?.message || "Không thể lấy danh sách phòng");
                }
                return response.data || [];
            }
            catch (error) {
                logger_1.default.error("Error fetching rooms:", error);
                throw error;
            }
        },
    },
    Mutation: {
        // Create new doctor
        async createDoctor(_, { input }, context) {
            try {
                // Require authentication and admin role
                if (!context.user) {
                    throw new Error("Yêu cầu xác thực");
                }
                if (context.user.role !== "admin") {
                    throw new Error("Chỉ admin mới có thể tạo bác sĩ mới");
                }
                logger_1.default.debug("Creating doctor:", {
                    input: { ...input, email: input.email },
                    userId: context.user.id,
                    requestId: context.requestId,
                });
                const response = await context.restApi.createDoctor(input);
                if (!response.success) {
                    throw new Error(response.error?.message || "Không thể tạo bác sĩ mới");
                }
                // Clear relevant caches
                context.dataloaders.doctorById.clear(response.data.id);
                if (input.departmentId) {
                    context.dataloaders.doctorsByDepartment.clear(input.departmentId);
                }
                return response.data;
            }
            catch (error) {
                logger_1.default.error("Error creating doctor:", error);
                throw error;
            }
        },
        // Update doctor
        async updateDoctor(_, { id, input }, context) {
            try {
                // Require authentication
                if (!context.user) {
                    throw new Error("Yêu cầu xác thực");
                }
                // Check permissions (admin or the doctor themselves)
                if (context.user.role !== "admin" && context.user.doctorId !== id) {
                    throw new Error("Không có quyền cập nhật thông tin bác sĩ này");
                }
                logger_1.default.debug("Updating doctor:", {
                    id,
                    input,
                    userId: context.user.id,
                    requestId: context.requestId,
                });
                const response = await context.restApi.updateDoctor(id, input);
                if (!response.success) {
                    throw new Error(response.error?.message || "Không thể cập nhật thông tin bác sĩ");
                }
                // Clear relevant caches
                context.dataloaders.doctorById.clear(id);
                if (input.departmentId) {
                    context.dataloaders.doctorsByDepartment.clear(input.departmentId);
                }
                return response.data;
            }
            catch (error) {
                logger_1.default.error("Error updating doctor:", error);
                throw error;
            }
        },
        // Delete doctor (soft delete)
        async deleteDoctor(_, { id }, context) {
            try {
                // Require admin role
                if (!context.user || context.user.role !== "admin") {
                    throw new Error("Chỉ admin mới có thể xóa bác sĩ");
                }
                logger_1.default.debug("Deleting doctor:", {
                    id,
                    userId: context.user.id,
                    requestId: context.requestId,
                });
                const response = await context.restApi.deleteDoctor(id);
                if (!response.success) {
                    throw new Error(response.error?.message || "Không thể xóa bác sĩ");
                }
                // Clear all related caches
                context.dataloaders.doctorById.clear(id);
                return true;
            }
            catch (error) {
                logger_1.default.error("Error deleting doctor:", error);
                throw error;
            }
        },
        // Create doctor review
        async createDoctorReview(_, { input }, context) {
            try {
                logger_1.default.debug("Creating doctor review:", {
                    input,
                    requestId: context.requestId,
                });
                const response = await context.restApi.createDoctorReview(input);
                if (!response.success) {
                    throw new Error(response.error?.message || "Không thể tạo đánh giá bác sĩ");
                }
                logger_1.default.info("Doctor review created successfully:", {
                    reviewId: response.data.id,
                });
                return response.data;
            }
            catch (error) {
                logger_1.default.error("Error creating doctor review:", error);
                throw error;
            }
        },
        // Update doctor review
        async updateDoctorReview(_, { id, rating, comment, }, context) {
            try {
                logger_1.default.debug("Updating doctor review:", {
                    id,
                    rating,
                    comment,
                    requestId: context.requestId,
                });
                const response = await context.restApi.updateDoctorReview(id, {
                    rating,
                    comment,
                });
                if (!response.success) {
                    throw new Error(response.error?.message || "Không thể cập nhật đánh giá bác sĩ");
                }
                logger_1.default.info("Doctor review updated successfully:", { reviewId: id });
                return response.data;
            }
            catch (error) {
                logger_1.default.error("Error updating doctor review:", error);
                throw error;
            }
        },
        // Delete doctor review
        async deleteDoctorReview(_, { id }, context) {
            try {
                logger_1.default.debug("Deleting doctor review:", {
                    id,
                    requestId: context.requestId,
                });
                const response = await context.restApi.deleteDoctorReview(id);
                if (!response.success) {
                    throw new Error(response.error?.message || "Không thể xóa đánh giá bác sĩ");
                }
                logger_1.default.info("Doctor review deleted successfully:", { reviewId: id });
                return true;
            }
            catch (error) {
                logger_1.default.error("Error deleting doctor review:", error);
                throw error;
            }
        },
    },
    // Field resolvers for Doctor type
    Doctor: {
        // Resolve department using DataLoader
        async department(parent, _, context) {
            if (!parent.departmentId)
                return null;
            try {
                return await context.dataloaders.departmentById.load(parent.departmentId);
            }
            catch (error) {
                logger_1.default.error("Error loading doctor department:", error);
                return null;
            }
        },
        // Resolve appointments using DataLoader
        async appointments(parent, { status, dateFrom, dateTo, limit = 10, offset = 0 }, context) {
            try {
                const appointments = await context.dataloaders.appointmentsByDoctor.load(parent.doctorId || parent.id);
                // Apply filters
                let filteredAppointments = appointments || [];
                if (status) {
                    filteredAppointments = filteredAppointments.filter((apt) => apt.status === status);
                }
                if (dateFrom) {
                    filteredAppointments = filteredAppointments.filter((apt) => new Date(apt.scheduledDate) >= new Date(dateFrom));
                }
                if (dateTo) {
                    filteredAppointments = filteredAppointments.filter((apt) => new Date(apt.scheduledDate) <= new Date(dateTo));
                }
                // Apply pagination
                const paginatedAppointments = filteredAppointments.slice(offset, offset + limit);
                return {
                    edges: paginatedAppointments.map((appointment, index) => ({
                        node: appointment,
                        cursor: Buffer.from(`${offset + index}`).toString("base64"),
                    })),
                    pageInfo: {
                        hasNextPage: offset + limit < filteredAppointments.length,
                        hasPreviousPage: offset > 0,
                        startCursor: paginatedAppointments.length > 0
                            ? Buffer.from(`${offset}`).toString("base64")
                            : null,
                        endCursor: paginatedAppointments.length > 0
                            ? Buffer.from(`${offset + paginatedAppointments.length - 1}`).toString("base64")
                            : null,
                    },
                    totalCount: filteredAppointments.length,
                };
            }
            catch (error) {
                logger_1.default.error("Error loading doctor appointments:", error);
                return {
                    edges: [],
                    pageInfo: {
                        hasNextPage: false,
                        hasPreviousPage: false,
                        startCursor: null,
                        endCursor: null,
                    },
                    totalCount: 0,
                };
            }
        },
        // Resolve reviews using DataLoader
        async reviews(parent, { limit = 10, offset = 0 }, context) {
            try {
                const reviews = await context.dataloaders.doctorReviews.load(parent.doctorId || parent.id);
                // Apply pagination
                const paginatedReviews = (reviews || []).slice(offset, offset + limit);
                return {
                    edges: paginatedReviews.map((review, index) => ({
                        node: review,
                        cursor: Buffer.from(`${offset + index}`).toString("base64"),
                    })),
                    pageInfo: {
                        hasNextPage: offset + limit < (reviews || []).length,
                        hasPreviousPage: offset > 0,
                        startCursor: paginatedReviews.length > 0
                            ? Buffer.from(`${offset}`).toString("base64")
                            : null,
                        endCursor: paginatedReviews.length > 0
                            ? Buffer.from(`${offset + paginatedReviews.length - 1}`).toString("base64")
                            : null,
                    },
                    totalCount: (reviews || []).length,
                };
            }
            catch (error) {
                logger_1.default.error("Error loading doctor reviews:", error);
                return {
                    edges: [],
                    pageInfo: {
                        hasNextPage: false,
                        hasPreviousPage: false,
                        startCursor: null,
                        endCursor: null,
                    },
                    totalCount: 0,
                };
            }
        },
        // Computed fields
        async averageRating(parent, _, context) {
            try {
                const stats = await context.dataloaders.doctorStats.load(parent.doctorId || parent.id);
                return stats?.averageRating || 0;
            }
            catch (error) {
                logger_1.default.error("Error loading doctor average rating:", error);
                return 0;
            }
        },
        async totalPatients(parent, _, context) {
            try {
                const stats = await context.dataloaders.doctorStats.load(parent.doctorId || parent.id);
                return stats?.totalPatients || 0;
            }
            catch (error) {
                logger_1.default.error("Error loading doctor total patients:", error);
                return 0;
            }
        },
        async totalAppointments(parent, _, context) {
            try {
                const stats = await context.dataloaders.doctorStats.load(parent.doctorId || parent.id);
                return stats?.totalAppointments || 0;
            }
            catch (error) {
                logger_1.default.error("Error loading doctor total appointments:", error);
                return 0;
            }
        },
        async upcomingAppointments(parent, _, context) {
            try {
                const stats = await context.dataloaders.doctorStats.load(parent.doctorId || parent.id);
                return stats?.upcomingAppointments || 0;
            }
            catch (error) {
                logger_1.default.error("Error loading doctor upcoming appointments:", error);
                return 0;
            }
        },
        async availableToday(parent, _, context) {
            try {
                const today = new Date().toISOString().split("T")[0];
                const slots = await context.dataloaders.availableSlots.load(`${parent.doctorId || parent.id}:${today}`);
                return (slots || []).some((slot) => slot.isAvailable);
            }
            catch (error) {
                logger_1.default.error("Error checking doctor availability today:", error);
                return false;
            }
        },
    },
    // Field resolvers for DoctorReview type
    DoctorReview: {
        // Map database snake_case to GraphQL camelCase
        serviceQuality: (parent) => parent.service_quality,
        isVerified: (parent) => parent.is_verified,
        isAnonymous: (parent) => parent.is_anonymous,
        createdAt: (parent) => parent.created_at,
        updatedAt: (parent) => parent.updated_at,
        // Resolve relationships using DataLoaders
        async doctor(parent, _, context) {
            if (!parent.doctor_id && !parent.doctorId)
                return null;
            try {
                const doctorId = parent.doctor_id || parent.doctorId;
                return await context.dataloaders.doctorById.load(doctorId);
            }
            catch (error) {
                logger_1.default.error("Error loading review doctor:", error);
                return null;
            }
        },
        async patient(parent, _, context) {
            if (!parent.patient_id && !parent.patientId)
                return null;
            try {
                const patientId = parent.patient_id || parent.patientId;
                return await context.dataloaders.patientById.load(patientId);
            }
            catch (error) {
                logger_1.default.error("Error loading review patient:", error);
                return null;
            }
        },
        async appointment(parent, _, context) {
            if (!parent.appointment_id && !parent.appointmentId)
                return null;
            try {
                const appointmentId = parent.appointment_id || parent.appointmentId;
                return await context.dataloaders.appointmentById.load(appointmentId);
            }
            catch (error) {
                logger_1.default.error("Error loading review appointment:", error);
                return null;
            }
        },
    },
    // Field resolvers for DoctorSchedule type
    DoctorSchedule: {
        // Map database snake_case to GraphQL camelCase
        dayOfWeek: (parent) => parent.day_of_week,
        startTime: (parent) => parent.start_time,
        endTime: (parent) => parent.end_time,
        isAvailable: (parent) => parent.is_available,
        maxAppointments: (parent) => parent.max_appointments,
        slotDuration: (parent) => parent.slot_duration,
        breakStartTime: (parent) => parent.break_start_time,
        breakEndTime: (parent) => parent.break_end_time,
        scheduleType: (parent) => parent.schedule_type,
        createdAt: (parent) => parent.created_at,
        updatedAt: (parent) => parent.updated_at,
        // Resolve relationships using DataLoaders
        async doctor(parent, _, context) {
            if (!parent.doctor_id && !parent.doctorId)
                return null;
            try {
                const doctorId = parent.doctor_id || parent.doctorId;
                return await context.dataloaders.doctorById.load(doctorId);
            }
            catch (error) {
                logger_1.default.error("Error loading schedule doctor:", error);
                return null;
            }
        },
        async room(parent, _, context) {
            if (!parent.room_id && !parent.roomId)
                return null;
            try {
                const roomId = parent.room_id || parent.roomId;
                // Note: Need to implement roomById dataloader
                // Room functionality moved to Department Service
                const response = await context.restApi.getRoom(roomId);
                return response.success ? response.data : null;
            }
            catch (error) {
                logger_1.default.error("Error loading schedule room:", error);
                return null;
            }
        },
    },
    // Field resolvers for Room type
    Room: {
        // Map database snake_case to GraphQL camelCase
        roomNumber: (parent) => parent.room_number,
        roomType: (parent) => parent.room_type,
        departmentId: (parent) => parent.department_id,
        currentOccupancy: (parent) => parent.current_occupancy,
        floorNumber: (parent) => parent.floor_number,
        dailyRate: (parent) => parent.daily_rate,
        equipmentIds: (parent) => parent.equipment_ids,
        isActive: (parent) => parent.is_active,
        createdAt: (parent) => parent.created_at,
        updatedAt: (parent) => parent.updated_at,
        // Resolve relationships using DataLoaders
        async department(parent, _, context) {
            if (!parent.department_id && !parent.departmentId)
                return null;
            try {
                const departmentId = parent.department_id || parent.departmentId;
                return await context.dataloaders.departmentById.load(departmentId);
            }
            catch (error) {
                logger_1.default.error("Error loading room department:", error);
                return null;
            }
        },
    },
};
exports.default = exports.doctorResolvers;
//# sourceMappingURL=doctor.resolvers.js.map