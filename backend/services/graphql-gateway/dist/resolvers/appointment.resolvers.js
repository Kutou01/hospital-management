"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appointmentResolvers = void 0;
const shared_1 = require("@hospital/shared");
const context_1 = require("../context");
/**
 * Appointment GraphQL Resolvers
 * Handles all appointment-related queries, mutations, and subscriptions
 * Supports Vietnamese language and hospital management requirements
 */
exports.appointmentResolvers = {
    Query: {
        // Get single appointment
        async appointment(_, { id, appointmentId }, context) {
            try {
                const identifier = id || appointmentId;
                if (!identifier) {
                    throw new Error(context_1.contextUtils.translate(context, "appointment.errors.missing_identifier"));
                }
                shared_1.logger.debug("Fetching appointment:", {
                    identifier,
                    requestId: context.requestId,
                });
                const response = await context.restApi.getAppointment(identifier);
                if (!response.success) {
                    throw new Error(response.error?.message ||
                        context_1.contextUtils.translate(context, "appointment.errors.fetch_failed"));
                }
                return response.data;
            }
            catch (error) {
                shared_1.logger.error("Error fetching appointment:", error);
                throw error;
            }
        },
        // Get multiple appointments with filters
        async appointments(_, { filters, limit = 20, offset = 0, sortBy = "scheduledDateTime", sortOrder = "ASC", }, context) {
            try {
                shared_1.logger.debug("Fetching appointments:", {
                    filters,
                    limit,
                    offset,
                    requestId: context.requestId,
                });
                const response = await context.restApi.getAppointments({
                    ...filters,
                    limit,
                    offset,
                    sortBy,
                    sortOrder,
                });
                if (!response.success) {
                    throw new Error(response.error?.message ||
                        context_1.contextUtils.translate(context, "appointment.errors.fetch_failed"));
                }
                return {
                    edges: response.data.map((appointment) => ({
                        node: appointment,
                        cursor: Buffer.from(appointment.id).toString("base64"),
                    })),
                    pageInfo: {
                        hasNextPage: response.data.length === limit,
                        hasPreviousPage: offset > 0,
                        startCursor: response.data.length > 0
                            ? Buffer.from(response.data[0].id).toString("base64")
                            : null,
                        endCursor: response.data.length > 0
                            ? Buffer.from(response.data[response.data.length - 1].id).toString("base64")
                            : null,
                    },
                    totalCount: response.totalCount || response.data.length,
                };
            }
            catch (error) {
                shared_1.logger.error("Error fetching appointments:", error);
                throw error;
            }
        },
        // Get today's appointments
        async todayAppointments(_, { doctorId, departmentId, status }, context) {
            try {
                shared_1.logger.debug("Fetching today appointments:", {
                    doctorId,
                    departmentId,
                    status,
                    requestId: context.requestId,
                });
                const today = new Date().toISOString().split("T")[0];
                const response = await context.restApi.getTodayAppointments({
                    doctorId,
                    departmentId,
                    status,
                    date: today,
                });
                if (!response.success) {
                    throw new Error(response.error?.message ||
                        context_1.contextUtils.translate(context, "appointment.errors.today_failed"));
                }
                return response.data;
            }
            catch (error) {
                shared_1.logger.error("Error fetching today appointments:", error);
                throw error;
            }
        },
        // Get upcoming appointments
        async upcomingAppointments(_, { doctorId, patientId, days = 7, limit = 20 }, context) {
            try {
                shared_1.logger.debug("Fetching upcoming appointments:", {
                    doctorId,
                    patientId,
                    days,
                    limit,
                    requestId: context.requestId,
                });
                const response = await context.restApi.getUpcomingAppointments({
                    doctorId,
                    patientId,
                    days,
                    limit,
                });
                if (!response.success) {
                    throw new Error(response.error?.message ||
                        context_1.contextUtils.translate(context, "appointment.errors.upcoming_failed"));
                }
                return response.data;
            }
            catch (error) {
                shared_1.logger.error("Error fetching upcoming appointments:", error);
                throw error;
            }
        },
        // Get available slots
        async availableSlots(_, { doctorId, date, duration = 30, }, context) {
            try {
                shared_1.logger.debug("Fetching available slots:", {
                    doctorId,
                    date,
                    duration,
                    requestId: context.requestId,
                });
                const cacheKey = `${doctorId}:${date}`;
                const slots = await context.dataloaders.availableSlots.load(cacheKey);
                // Filter slots by duration if needed
                return slots.filter((slot) => slot.duration >= duration);
            }
            catch (error) {
                shared_1.logger.error("Error fetching available slots:", error);
                throw error;
            }
        },
        // Get appointment statistics
        async appointmentStats(_, { doctorId, patientId, departmentId, dateFrom, dateTo }, context) {
            try {
                shared_1.logger.debug("Fetching appointment stats:", {
                    doctorId,
                    patientId,
                    departmentId,
                    requestId: context.requestId,
                });
                const response = await context.restApi.getAppointmentStats({
                    doctorId,
                    patientId,
                    departmentId,
                    dateFrom,
                    dateTo,
                });
                if (!response.success) {
                    throw new Error(response.error?.message ||
                        context_1.contextUtils.translate(context, "appointment.errors.stats_failed"));
                }
                return response.data;
            }
            catch (error) {
                shared_1.logger.error("Error fetching appointment stats:", error);
                throw error;
            }
        },
    },
    Mutation: {
        // Create new appointment
        async createAppointment(_, { input }, context) {
            try {
                shared_1.logger.debug("Creating appointment:", {
                    input,
                    requestId: context.requestId,
                });
                const response = await context.restApi.createAppointment(input);
                if (!response.success) {
                    throw new Error(response.error?.message ||
                        context_1.contextUtils.translate(context, "appointment.errors.create_failed"));
                }
                shared_1.logger.info("Appointment created successfully:", {
                    appointmentId: response.data.appointmentId,
                });
                return response.data;
            }
            catch (error) {
                shared_1.logger.error("Error creating appointment:", error);
                throw error;
            }
        },
        // Update appointment
        async updateAppointment(_, { id, input }, context) {
            try {
                shared_1.logger.debug("Updating appointment:", {
                    id,
                    input,
                    requestId: context.requestId,
                });
                const response = await context.restApi.updateAppointment(id, input);
                if (!response.success) {
                    throw new Error(response.error?.message ||
                        context_1.contextUtils.translate(context, "appointment.errors.update_failed"));
                }
                shared_1.logger.info("Appointment updated successfully:", { appointmentId: id });
                return response.data;
            }
            catch (error) {
                shared_1.logger.error("Error updating appointment:", error);
                throw error;
            }
        },
        // Cancel appointment
        async cancelAppointment(_, { input }, context) {
            try {
                shared_1.logger.debug("Cancelling appointment:", {
                    input,
                    requestId: context.requestId,
                });
                const response = await context.restApi.cancelAppointment(input.appointmentId, input.reason || "Hủy cuộc hẹn");
                if (!response.success) {
                    throw new Error(response.error?.message ||
                        context_1.contextUtils.translate(context, "appointment.errors.cancel_failed"));
                }
                shared_1.logger.info("Appointment cancelled successfully:", {
                    appointmentId: input.appointmentId,
                });
                return response.data;
            }
            catch (error) {
                shared_1.logger.error("Error cancelling appointment:", error);
                throw error;
            }
        },
        // Confirm appointment
        async confirmAppointment(_, { id }, context) {
            try {
                shared_1.logger.debug("Confirming appointment:", {
                    id,
                    requestId: context.requestId,
                });
                const response = await context.restApi.confirmAppointment(id);
                if (!response.success) {
                    throw new Error(response.error?.message ||
                        context_1.contextUtils.translate(context, "appointment.errors.confirm_failed"));
                }
                shared_1.logger.info("Appointment confirmed successfully:", {
                    appointmentId: id,
                });
                return response.data;
            }
            catch (error) {
                shared_1.logger.error("Error confirming appointment:", error);
                throw error;
            }
        },
        // Reschedule appointment
        async rescheduleAppointment(_, { input }, context) {
            try {
                shared_1.logger.debug("Rescheduling appointment:", {
                    input,
                    requestId: context.requestId,
                });
                const response = await context.restApi.rescheduleAppointment(input.appointmentId, {
                    newDate: input.newDate,
                    newTime: input.newTime,
                });
                if (!response.success) {
                    throw new Error(response.error?.message ||
                        context_1.contextUtils.translate(context, "appointment.errors.reschedule_failed"));
                }
                shared_1.logger.info("Appointment rescheduled successfully:", {
                    appointmentId: input.appointmentId,
                });
                return response.data;
            }
            catch (error) {
                shared_1.logger.error("Error rescheduling appointment:", error);
                throw error;
            }
        },
        // Check in appointment
        async checkInAppointment(_, { id }, context) {
            try {
                shared_1.logger.debug("Checking in appointment:", {
                    id,
                    requestId: context.requestId,
                });
                const response = await context.restApi.checkInAppointment(id);
                if (!response.success) {
                    throw new Error(response.error?.message ||
                        context_1.contextUtils.translate(context, "appointment.errors.checkin_failed"));
                }
                shared_1.logger.info("Appointment checked in successfully:", {
                    appointmentId: id,
                });
                return response.data;
            }
            catch (error) {
                shared_1.logger.error("Error checking in appointment:", error);
                throw error;
            }
        },
        // Complete appointment
        async completeAppointment(_, { id, notes }, context) {
            try {
                shared_1.logger.debug("Completing appointment:", {
                    id,
                    notes,
                    requestId: context.requestId,
                });
                const response = await context.restApi.completeAppointment(id, notes);
                if (!response.success) {
                    throw new Error(response.error?.message ||
                        context_1.contextUtils.translate(context, "appointment.errors.complete_failed"));
                }
                shared_1.logger.info("Appointment completed successfully:", {
                    appointmentId: id,
                });
                return response.data;
            }
            catch (error) {
                shared_1.logger.error("Error completing appointment:", error);
                throw error;
            }
        },
    },
    // Field resolvers for Appointment type
    Appointment: {
        // Calculate end date time
        endDateTime(parent) {
            if (!parent.scheduledDateTime || !parent.duration)
                return null;
            const startTime = new Date(parent.scheduledDateTime);
            const endTime = new Date(startTime.getTime() + parent.duration * 60000);
            return endTime.toISOString();
        },
        // Resolve doctor using DataLoader
        async doctor(parent, _, context) {
            if (!parent.doctorId)
                return null;
            try {
                return await context.dataloaders.doctorById.load(parent.doctorId);
            }
            catch (error) {
                shared_1.logger.error("Error loading appointment doctor:", error);
                return null;
            }
        },
        // Resolve patient using DataLoader
        async patient(parent, _, context) {
            if (!parent.patientId)
                return null;
            try {
                return await context.dataloaders.patientById.load(parent.patientId);
            }
            catch (error) {
                shared_1.logger.error("Error loading appointment patient:", error);
                return null;
            }
        },
        // Resolve department using DataLoader
        async department(parent, _, context) {
            if (!parent.departmentId)
                return null;
            try {
                return await context.dataloaders.departmentById.load(parent.departmentId);
            }
            catch (error) {
                shared_1.logger.error("Error loading appointment department:", error);
                return null;
            }
        },
        // Computed fields
        isToday(parent) {
            if (!parent.scheduledDate)
                return false;
            const today = new Date().toISOString().split("T")[0];
            const appointmentDate = new Date(parent.scheduledDate)
                .toISOString()
                .split("T")[0];
            return today === appointmentDate;
        },
        isUpcoming(parent) {
            if (!parent.scheduledDateTime)
                return false;
            const now = new Date();
            const appointmentTime = new Date(parent.scheduledDateTime);
            return appointmentTime > now && parent.status !== "CANCELLED";
        },
        isPast(parent) {
            if (!parent.scheduledDateTime)
                return false;
            const now = new Date();
            const appointmentTime = new Date(parent.scheduledDateTime);
            return appointmentTime < now;
        },
        canCancel(parent) {
            if (!parent.scheduledDateTime ||
                parent.status === "CANCELLED" ||
                parent.status === "COMPLETED") {
                return false;
            }
            const now = new Date();
            const appointmentTime = new Date(parent.scheduledDateTime);
            const hoursUntilAppointment = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);
            // Can cancel if appointment is more than 2 hours away
            return hoursUntilAppointment > 2;
        },
        canReschedule(parent) {
            if (!parent.scheduledDateTime ||
                parent.status === "CANCELLED" ||
                parent.status === "COMPLETED") {
                return false;
            }
            const now = new Date();
            const appointmentTime = new Date(parent.scheduledDateTime);
            const hoursUntilAppointment = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);
            // Can reschedule if appointment is more than 4 hours away
            return hoursUntilAppointment > 4;
        },
        timeUntilAppointment(parent) {
            if (!parent.scheduledDateTime)
                return null;
            const now = new Date();
            const appointmentTime = new Date(parent.scheduledDateTime);
            const minutesUntil = Math.floor((appointmentTime.getTime() - now.getTime()) / (1000 * 60));
            return minutesUntil > 0 ? minutesUntil : null;
        },
        waitingTime(parent) {
            if (!parent.checkedInAt || parent.status !== "CONFIRMED")
                return null;
            const now = new Date();
            const checkedInTime = new Date(parent.checkedInAt);
            const waitingMinutes = Math.floor((now.getTime() - checkedInTime.getTime()) / (1000 * 60));
            return waitingMinutes > 0 ? waitingMinutes : 0;
        },
    },
};
exports.default = exports.appointmentResolvers;
//# sourceMappingURL=appointment.resolvers.js.map