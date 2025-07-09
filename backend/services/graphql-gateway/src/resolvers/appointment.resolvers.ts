import { logger } from "@hospital/shared";
import { contextUtils, GraphQLContext } from "../context";

/**
 * Appointment GraphQL Resolvers
 * Handles all appointment-related queries, mutations, and subscriptions
 * Supports Vietnamese language and hospital management requirements
 */
export const appointmentResolvers = {
  Query: {
    // Get single appointment
    async appointment(
      _: any,
      { id, appointmentId }: { id?: string; appointmentId?: string },
      context: GraphQLContext
    ) {
      try {
        const identifier = id || appointmentId;
        if (!identifier) {
          throw new Error(
            contextUtils.translate(
              context,
              "appointment.errors.missing_identifier"
            )
          );
        }

        logger.debug("Fetching appointment:", {
          identifier,
          requestId: context.requestId,
        });

        const response = await context.restApi.getAppointment(identifier);

        if (!response.success) {
          throw new Error(
            response.error?.message ||
              contextUtils.translate(context, "appointment.errors.fetch_failed")
          );
        }

        return response.data;
      } catch (error) {
        logger.error("Error fetching appointment:", error);
        throw error;
      }
    },

    // Get multiple appointments with filters
    async appointments(
      _: any,
      {
        filters,
        limit = 20,
        offset = 0,
        sortBy = "scheduledDateTime",
        sortOrder = "ASC",
      }: any,
      context: GraphQLContext
    ) {
      try {
        logger.debug("Fetching appointments:", {
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
          throw new Error(
            response.error?.message ||
              contextUtils.translate(context, "appointment.errors.fetch_failed")
          );
        }

        return {
          edges: response.data.map((appointment: any) => ({
            node: appointment,
            cursor: Buffer.from(appointment.id).toString("base64"),
          })),
          pageInfo: {
            hasNextPage: response.data.length === limit,
            hasPreviousPage: offset > 0,
            startCursor:
              response.data.length > 0
                ? Buffer.from(response.data[0].id).toString("base64")
                : null,
            endCursor:
              response.data.length > 0
                ? Buffer.from(
                    response.data[response.data.length - 1].id
                  ).toString("base64")
                : null,
          },
          totalCount: (response as any).totalCount || response.data.length,
        };
      } catch (error) {
        logger.error("Error fetching appointments:", error);
        throw error;
      }
    },

    // Get today's appointments
    async todayAppointments(
      _: any,
      { doctorId, departmentId, status }: any,
      context: GraphQLContext
    ) {
      try {
        logger.debug("Fetching today appointments:", {
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
          throw new Error(
            response.error?.message ||
              contextUtils.translate(context, "appointment.errors.today_failed")
          );
        }

        return response.data;
      } catch (error) {
        logger.error("Error fetching today appointments:", error);
        throw error;
      }
    },

    // Get upcoming appointments
    async upcomingAppointments(
      _: any,
      { doctorId, patientId, days = 7, limit = 20 }: any,
      context: GraphQLContext
    ) {
      try {
        logger.debug("Fetching upcoming appointments:", {
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
          throw new Error(
            response.error?.message ||
              contextUtils.translate(
                context,
                "appointment.errors.upcoming_failed"
              )
          );
        }

        return response.data;
      } catch (error) {
        logger.error("Error fetching upcoming appointments:", error);
        throw error;
      }
    },

    // Get available slots
    async availableSlots(
      _: any,
      {
        doctorId,
        date,
        duration = 30,
      }: { doctorId: string; date: string; duration: number },
      context: GraphQLContext
    ) {
      try {
        logger.debug("Fetching available slots:", {
          doctorId,
          date,
          duration,
          requestId: context.requestId,
        });

        const cacheKey = `${doctorId}:${date}`;
        const slots = await context.dataloaders.availableSlots.load(cacheKey);

        // Filter slots by duration if needed
        return slots.filter((slot: any) => slot.duration >= duration);
      } catch (error) {
        logger.error("Error fetching available slots:", error);
        throw error;
      }
    },

    // Get appointment statistics
    async appointmentStats(
      _: any,
      { doctorId, patientId, departmentId, dateFrom, dateTo }: any,
      context: GraphQLContext
    ) {
      try {
        logger.debug("Fetching appointment stats:", {
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
          throw new Error(
            response.error?.message ||
              contextUtils.translate(context, "appointment.errors.stats_failed")
          );
        }

        return response.data;
      } catch (error) {
        logger.error("Error fetching appointment stats:", error);
        throw error;
      }
    },
  },

  Mutation: {
    // Create new appointment
    async createAppointment(
      _: any,
      { input }: { input: any },
      context: GraphQLContext
    ) {
      try {
        logger.debug("Creating appointment:", {
          input,
          requestId: context.requestId,
        });

        const response = await context.restApi.createAppointment(input);

        if (!response.success) {
          throw new Error(
            response.error?.message ||
              contextUtils.translate(
                context,
                "appointment.errors.create_failed"
              )
          );
        }

        logger.info("Appointment created successfully:", {
          appointmentId: response.data.appointmentId,
        });
        return response.data;
      } catch (error) {
        logger.error("Error creating appointment:", error);
        throw error;
      }
    },

    // Update appointment
    async updateAppointment(
      _: any,
      { id, input }: { id: string; input: any },
      context: GraphQLContext
    ) {
      try {
        logger.debug("Updating appointment:", {
          id,
          input,
          requestId: context.requestId,
        });

        const response = await context.restApi.updateAppointment(id, input);

        if (!response.success) {
          throw new Error(
            response.error?.message ||
              contextUtils.translate(
                context,
                "appointment.errors.update_failed"
              )
          );
        }

        logger.info("Appointment updated successfully:", { appointmentId: id });
        return response.data;
      } catch (error) {
        logger.error("Error updating appointment:", error);
        throw error;
      }
    },

    // Cancel appointment
    async cancelAppointment(
      _: any,
      { input }: { input: any },
      context: GraphQLContext
    ) {
      try {
        logger.debug("Cancelling appointment:", {
          input,
          requestId: context.requestId,
        });

        const response = await context.restApi.cancelAppointment(
          input.appointmentId,
          input.reason || "Hủy cuộc hẹn"
        );

        if (!response.success) {
          throw new Error(
            response.error?.message ||
              contextUtils.translate(
                context,
                "appointment.errors.cancel_failed"
              )
          );
        }

        logger.info("Appointment cancelled successfully:", {
          appointmentId: input.appointmentId,
        });
        return response.data;
      } catch (error) {
        logger.error("Error cancelling appointment:", error);
        throw error;
      }
    },

    // Confirm appointment
    async confirmAppointment(
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) {
      try {
        logger.debug("Confirming appointment:", {
          id,
          requestId: context.requestId,
        });

        const response = await context.restApi.confirmAppointment(id);

        if (!response.success) {
          throw new Error(
            response.error?.message ||
              contextUtils.translate(
                context,
                "appointment.errors.confirm_failed"
              )
          );
        }

        logger.info("Appointment confirmed successfully:", {
          appointmentId: id,
        });
        return response.data;
      } catch (error) {
        logger.error("Error confirming appointment:", error);
        throw error;
      }
    },

    // Reschedule appointment
    async rescheduleAppointment(
      _: any,
      { input }: { input: any },
      context: GraphQLContext
    ) {
      try {
        logger.debug("Rescheduling appointment:", {
          input,
          requestId: context.requestId,
        });

        const response = await context.restApi.rescheduleAppointment(
          input.appointmentId,
          {
            newDate: input.newDate,
            newTime: input.newTime,
          }
        );

        if (!response.success) {
          throw new Error(
            response.error?.message ||
              contextUtils.translate(
                context,
                "appointment.errors.reschedule_failed"
              )
          );
        }

        logger.info("Appointment rescheduled successfully:", {
          appointmentId: input.appointmentId,
        });
        return response.data;
      } catch (error) {
        logger.error("Error rescheduling appointment:", error);
        throw error;
      }
    },

    // Check in appointment
    async checkInAppointment(
      _: any,
      { id }: { id: string },
      context: GraphQLContext
    ) {
      try {
        logger.debug("Checking in appointment:", {
          id,
          requestId: context.requestId,
        });

        const response = await context.restApi.checkInAppointment(id);

        if (!response.success) {
          throw new Error(
            response.error?.message ||
              contextUtils.translate(
                context,
                "appointment.errors.checkin_failed"
              )
          );
        }

        logger.info("Appointment checked in successfully:", {
          appointmentId: id,
        });
        return response.data;
      } catch (error) {
        logger.error("Error checking in appointment:", error);
        throw error;
      }
    },

    // Complete appointment
    async completeAppointment(
      _: any,
      { id, notes }: { id: string; notes?: string },
      context: GraphQLContext
    ) {
      try {
        logger.debug("Completing appointment:", {
          id,
          notes,
          requestId: context.requestId,
        });

        const response = await context.restApi.completeAppointment(id, notes);

        if (!response.success) {
          throw new Error(
            response.error?.message ||
              contextUtils.translate(
                context,
                "appointment.errors.complete_failed"
              )
          );
        }

        logger.info("Appointment completed successfully:", {
          appointmentId: id,
        });
        return response.data;
      } catch (error) {
        logger.error("Error completing appointment:", error);
        throw error;
      }
    },
  },

  // Field resolvers for Appointment type
  Appointment: {
    // Calculate end date time
    endDateTime(parent: any) {
      if (!parent.scheduledDateTime || !parent.duration) return null;

      const startTime = new Date(parent.scheduledDateTime);
      const endTime = new Date(startTime.getTime() + parent.duration * 60000);
      return endTime.toISOString();
    },

    // Resolve doctor using DataLoader
    async doctor(parent: any, _: any, context: GraphQLContext) {
      if (!parent.doctorId) return null;

      try {
        return await context.dataloaders.doctorById.load(parent.doctorId);
      } catch (error) {
        logger.error("Error loading appointment doctor:", error);
        return null;
      }
    },

    // Resolve patient using DataLoader
    async patient(parent: any, _: any, context: GraphQLContext) {
      if (!parent.patientId) return null;

      try {
        return await context.dataloaders.patientById.load(parent.patientId);
      } catch (error) {
        logger.error("Error loading appointment patient:", error);
        return null;
      }
    },

    // Resolve department using DataLoader
    async department(parent: any, _: any, context: GraphQLContext) {
      if (!parent.departmentId) return null;

      try {
        return await context.dataloaders.departmentById.load(
          parent.departmentId
        );
      } catch (error) {
        logger.error("Error loading appointment department:", error);
        return null;
      }
    },

    // Computed fields
    isToday(parent: any) {
      if (!parent.scheduledDate) return false;

      const today = new Date().toISOString().split("T")[0];
      const appointmentDate = new Date(parent.scheduledDate)
        .toISOString()
        .split("T")[0];
      return today === appointmentDate;
    },

    isUpcoming(parent: any) {
      if (!parent.scheduledDateTime) return false;

      const now = new Date();
      const appointmentTime = new Date(parent.scheduledDateTime);
      return appointmentTime > now && parent.status !== "CANCELLED";
    },

    isPast(parent: any) {
      if (!parent.scheduledDateTime) return false;

      const now = new Date();
      const appointmentTime = new Date(parent.scheduledDateTime);
      return appointmentTime < now;
    },

    canCancel(parent: any) {
      if (
        !parent.scheduledDateTime ||
        parent.status === "CANCELLED" ||
        parent.status === "COMPLETED"
      ) {
        return false;
      }

      const now = new Date();
      const appointmentTime = new Date(parent.scheduledDateTime);
      const hoursUntilAppointment =
        (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Can cancel if appointment is more than 2 hours away
      return hoursUntilAppointment > 2;
    },

    canReschedule(parent: any) {
      if (
        !parent.scheduledDateTime ||
        parent.status === "CANCELLED" ||
        parent.status === "COMPLETED"
      ) {
        return false;
      }

      const now = new Date();
      const appointmentTime = new Date(parent.scheduledDateTime);
      const hoursUntilAppointment =
        (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Can reschedule if appointment is more than 4 hours away
      return hoursUntilAppointment > 4;
    },

    timeUntilAppointment(parent: any) {
      if (!parent.scheduledDateTime) return null;

      const now = new Date();
      const appointmentTime = new Date(parent.scheduledDateTime);
      const minutesUntil = Math.floor(
        (appointmentTime.getTime() - now.getTime()) / (1000 * 60)
      );

      return minutesUntil > 0 ? minutesUntil : null;
    },

    waitingTime(parent: any) {
      if (!parent.checkedInAt || parent.status !== "CONFIRMED") return null;

      const now = new Date();
      const checkedInTime = new Date(parent.checkedInAt);
      const waitingMinutes = Math.floor(
        (now.getTime() - checkedInTime.getTime()) / (1000 * 60)
      );

      return waitingMinutes > 0 ? waitingMinutes : 0;
    },
  },
};

export default appointmentResolvers;
