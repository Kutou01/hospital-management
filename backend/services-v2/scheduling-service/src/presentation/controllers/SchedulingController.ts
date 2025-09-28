/**
 * Scheduling Controller - Presentation Layer
 * V2 Clean Architecture + DDD Implementation
 * Main controller for appointment scheduling operations
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, RESTful API, Vietnamese Healthcare Standards
 */

import { Request, Response, NextFunction } from 'express';
import { SchedulingApplicationService } from '../../application/services/SchedulingApplicationService';
import { 
  ScheduleAppointmentRequestDto, 
  ScheduleAppointmentResponseDto,
  RescheduleAppointmentRequestDto,
  RescheduleAppointmentResponseDto,
  CheckAvailabilityRequestDto,
  CheckAvailabilityResponseDto,
  AppointmentDetailsResponseDto,
  SuccessResponseDto
} from '../dto/ScheduleAppointmentDto';
import { AppointmentId, AppointmentType, AppointmentPriority } from '../../domain/value-objects/AppointmentId';
import { PatientInfo } from '../../domain/value-objects/PatientInfo';
import { ProviderInfo, ProviderType, ProviderStatus } from '../../domain/value-objects/ProviderInfo';
import { TimeSlot, TimeSlotStatus } from '../../domain/value-objects/TimeSlot';
import { AppointmentDetails, AppointmentReason } from '../../domain/value-objects/AppointmentDetails';
import { asyncHandler, NotFoundError, BusinessLogicError } from '../middleware/ErrorHandlingMiddleware';

/**
 * Scheduling Controller
 * Handles HTTP requests for appointment scheduling operations
 */
export class SchedulingController {
  constructor(
    private readonly schedulingService: SchedulingApplicationService
  ) {}

  /**
   * Schedule new appointment
   * POST /api/v1/scheduling/appointments
   */
  public scheduleAppointment = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const requestDto: ScheduleAppointmentRequestDto = req.body;
      const userId = req.user?.id || requestDto.createdBy || 'system';

      try {
        // Create domain value objects
        const appointmentId = AppointmentId.create(
          requestDto.appointment.appointmentType as AppointmentType,
          requestDto.departmentCode,
          requestDto.appointment.priority as AppointmentPriority
        );

        const patientInfo = PatientInfo.create(
          requestDto.patient.patientId,
          requestDto.patient.fullName,
          requestDto.patient.phone,
          requestDto.patient.dateOfBirth,
          requestDto.patient.nationalId,
          requestDto.patient.email,
          requestDto.patient.address,
          requestDto.patient.emergencyContact,
          requestDto.patient.insuranceNumber,
          requestDto.patient.insuranceType
        );

        const providerInfo = ProviderInfo.create(
          requestDto.provider.providerId,
          requestDto.provider.fullName || '',
          requestDto.provider.specialization || '',
          requestDto.departmentCode,
          '', // License number will be fetched from Provider Service
          ProviderType.DOCTOR,
          ProviderStatus.ACTIVE
        );

        const timeSlot = TimeSlot.create(
          new Date(requestDto.appointment.startTime),
          new Date(requestDto.appointment.endTime),
          TimeSlotStatus.AVAILABLE
        );

        const appointmentDetails = AppointmentDetails.create(
          requestDto.appointment.reason,
          requestDto.appointment.estimatedDuration,
          requestDto.appointment.requiresPreparation || false,
          requestDto.appointment.isFollowUp || false,
          requestDto.appointment.urgencyLevel || 'routine',
          requestDto.appointment.reasonCode as AppointmentReason || AppointmentReason.CONSULTATION,
          requestDto.appointment.symptoms,
          requestDto.appointment.notes,
          requestDto.appointment.preparationInstructions,
          requestDto.appointment.specialRequirements,
          requestDto.appointment.interpreterRequired,
          requestDto.appointment.wheelchairAccessible,
          requestDto.appointment.fasting,
          requestDto.appointment.medicationRestrictions
        );

        // Schedule appointment through application service
        const appointment = await this.schedulingService.scheduleAppointment(
          appointmentId,
          patientInfo,
          providerInfo,
          timeSlot,
          appointmentDetails,
          requestDto.appointment.roomId,
          userId
        );

        // Create response
        const responseDto: ScheduleAppointmentResponseDto = {
          success: true,
          message: 'Đặt lịch hẹn thành công',
          data: {
            appointment: {
              id: appointment.id,
              appointmentId: appointment.appointmentId.value,
              patientId: appointment.patient.patientId,
              patientName: appointment.patient.fullName,
              providerId: appointment.provider.providerId,
              providerName: appointment.provider.fullName,
              startTime: appointment.timeSlot.startTime.toISOString(),
              endTime: appointment.timeSlot.endTime.toISOString(),
              status: appointment.status,
              roomId: appointment.roomId,
              reason: appointment.details.reason,
              estimatedDuration: appointment.details.estimatedDuration,
              urgencyLevel: appointment.details.urgencyLevel,
              createdAt: appointment.createdAt.toISOString(),
              createdBy: appointment.createdBy
            },
            nextSteps: [
              'Bệnh nhân sẽ nhận được SMS xác nhận trong vòng 5 phút',
              'Vui lòng đến trước giờ hẹn 15 phút để làm thủ tục',
              'Mang theo CMND/CCCD và thẻ bảo hiểm (nếu có)'
            ],
            reminders: {
              smsReminder: true,
              emailReminder: !!requestDto.patient.email,
              reminderTimes: [
                new Date(appointment.timeSlot.startTime.getTime() - 24 * 60 * 60 * 1000).toISOString(), // 1 day before
                new Date(appointment.timeSlot.startTime.getTime() - 2 * 60 * 60 * 1000).toISOString()   // 2 hours before
              ]
            },
            qrCode: `QR-${appointment.appointmentId.value}`,
            appointmentUrl: `/appointments/${appointment.id}`
          }
        };

        res.status(201).json(responseDto);

      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Reschedule existing appointment
   * PUT /api/v1/scheduling/appointments/:appointmentId/reschedule
   */
  public rescheduleAppointment = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { appointmentId } = req.params;
      const requestDto: RescheduleAppointmentRequestDto = req.body;
      const userId = req.user?.id || requestDto.rescheduledBy || 'system';

      try {
        // Create new time slot
        const newTimeSlot = TimeSlot.create(
          new Date(requestDto.newStartTime),
          new Date(requestDto.newEndTime),
          TimeSlotStatus.AVAILABLE
        );

        // Reschedule appointment through application service
        const appointment = await this.schedulingService.rescheduleAppointment(
          appointmentId,
          newTimeSlot,
          requestDto.reason,
          requestDto.newRoomId,
          userId
        );

        // Create response
        const responseDto: RescheduleAppointmentResponseDto = {
          success: true,
          message: 'Thay đổi lịch hẹn thành công',
          data: {
            appointmentId: appointment.appointmentId.value,
            oldStartTime: appointment.previousTimeSlot?.startTime.toISOString() || '',
            oldEndTime: appointment.previousTimeSlot?.endTime.toISOString() || '',
            newStartTime: appointment.timeSlot.startTime.toISOString(),
            newEndTime: appointment.timeSlot.endTime.toISOString(),
            status: appointment.status,
            rescheduledAt: appointment.updatedAt.toISOString(),
            rescheduledBy: userId,
            reason: requestDto.reason,
            notificationsSent: {
              patient: requestDto.notifyPatient !== false,
              provider: requestDto.notifyProvider !== false,
              channels: ['sms', 'email'].filter(channel => 
                (channel === 'sms') || 
                (channel === 'email' && appointment.patient.email)
              )
            }
          }
        };

        res.status(200).json(responseDto);

      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Check availability
   * GET /api/v1/scheduling/availability
   */
  public checkAvailability = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const requestDto: CheckAvailabilityRequestDto = req.query as any;

      try {
        // Check availability through application service
        const availability = await this.schedulingService.checkAvailability(
          requestDto.providerId,
          requestDto.departmentCode,
          new Date(requestDto.date),
          requestDto.startTime ? new Date(requestDto.startTime) : undefined,
          requestDto.endTime ? new Date(requestDto.endTime) : undefined,
          requestDto.appointmentType,
          requestDto.duration,
          requestDto.includeUnavailable
        );

        // Create response
        const responseDto: CheckAvailabilityResponseDto = {
          success: true,
          message: 'Kiểm tra lịch trống thành công',
          data: {
            date: requestDto.date,
            providerId: requestDto.providerId,
            providerName: availability.providerName,
            departmentCode: requestDto.departmentCode,
            departmentName: availability.departmentName,
            totalSlots: availability.totalSlots,
            availableSlots: availability.availableSlots,
            bookedSlots: availability.bookedSlots,
            blockedSlots: availability.blockedSlots,
            slots: availability.slots.map(slot => ({
              startTime: slot.startTime.toISOString(),
              endTime: slot.endTime.toISOString(),
              duration: slot.duration,
              status: slot.status,
              providerId: slot.providerId,
              providerName: slot.providerName,
              department: slot.department,
              roomId: slot.roomId,
              roomName: slot.roomName,
              appointmentId: slot.appointmentId,
              notes: slot.notes,
              conflictReason: slot.conflictReason
            })),
            recommendations: availability.recommendations ? {
              alternativeTimes: availability.recommendations.alternativeTimes.map(time => time.toISOString()),
              alternativeProviders: availability.recommendations.alternativeProviders.map(provider => ({
                providerId: provider.providerId,
                providerName: provider.providerName,
                department: provider.department,
                nextAvailableTime: provider.nextAvailableTime.toISOString()
              })),
              nextAvailableDate: availability.recommendations.nextAvailableDate.toISOString().split('T')[0]
            } : undefined
          }
        };

        res.status(200).json(responseDto);

      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get appointment details
   * GET /api/v1/scheduling/appointments/:appointmentId
   */
  public getAppointmentDetails = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { appointmentId } = req.params;

      try {
        // Get appointment details through application service
        const appointment = await this.schedulingService.getAppointmentDetails(appointmentId);

        if (!appointment) {
          throw new NotFoundError('Cuộc hẹn');
        }

        // Create response
        const responseDto: AppointmentDetailsResponseDto = {
          success: true,
          message: 'Lấy thông tin cuộc hẹn thành công',
          data: {
            id: appointment.id,
            appointmentId: appointment.appointmentId.value,
            patient: {
              patientId: appointment.patient.patientId,
              fullName: appointment.patient.fullName,
              phone: appointment.patient.phone,
              email: appointment.patient.email,
              insuranceNumber: appointment.patient.insuranceNumber,
              insuranceType: appointment.patient.insuranceType
            },
            provider: {
              providerId: appointment.provider.providerId,
              fullName: appointment.provider.fullName,
              specialization: appointment.provider.specialization,
              department: appointment.provider.department,
              phone: appointment.provider.phone,
              email: appointment.provider.email
            },
            appointment: {
              startTime: appointment.timeSlot.startTime.toISOString(),
              endTime: appointment.timeSlot.endTime.toISOString(),
              status: appointment.status,
              roomId: appointment.roomId,
              roomName: appointment.roomName,
              reason: appointment.details.reason,
              symptoms: appointment.details.symptoms,
              notes: appointment.details.notes,
              estimatedDuration: appointment.details.estimatedDuration,
              urgencyLevel: appointment.details.urgencyLevel,
              specialRequirements: appointment.details.specialRequirements,
              preparationInstructions: appointment.details.preparationInstructions
            },
            timeline: {
              createdAt: appointment.createdAt.toISOString(),
              createdBy: appointment.createdBy,
              confirmedAt: appointment.confirmedAt?.toISOString(),
              confirmedBy: appointment.confirmedBy,
              completedAt: appointment.completedAt?.toISOString(),
              completedBy: appointment.completedBy,
              cancelledAt: appointment.cancelledAt?.toISOString(),
              cancelledBy: appointment.cancelledBy,
              cancellationReason: appointment.cancellationReason
            },
            reminders: {
              sent: appointment.remindersSent || 0,
              scheduled: appointment.remindersScheduled || 2,
              lastSent: appointment.lastReminderSent?.toISOString(),
              nextScheduled: appointment.nextReminderScheduled?.toISOString()
            }
          }
        };

        res.status(200).json(responseDto);

      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Cancel appointment
   * DELETE /api/v1/scheduling/appointments/:appointmentId
   */
  public cancelAppointment = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { appointmentId } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id || 'system';

      try {
        // Cancel appointment through application service
        await this.schedulingService.cancelAppointment(appointmentId, reason, userId);

        // Create response
        const responseDto: SuccessResponseDto = {
          success: true,
          message: 'Hủy lịch hẹn thành công',
          data: {
            appointmentId,
            cancelledAt: new Date().toISOString(),
            cancelledBy: userId,
            reason
          },
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method,
          statusCode: 200
        };

        res.status(200).json(responseDto);

      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Confirm appointment
   * POST /api/v1/scheduling/appointments/:appointmentId/confirm
   */
  public confirmAppointment = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { appointmentId } = req.params;
      const userId = req.user?.id || 'system';

      try {
        // Confirm appointment through application service
        const appointment = await this.schedulingService.confirmAppointment(appointmentId, userId);

        // Create response
        const responseDto: SuccessResponseDto = {
          success: true,
          message: 'Xác nhận lịch hẹn thành công',
          data: {
            appointmentId: appointment.appointmentId.value,
            status: appointment.status,
            confirmedAt: appointment.confirmedAt?.toISOString(),
            confirmedBy: appointment.confirmedBy
          },
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method,
          statusCode: 200
        };

        res.status(200).json(responseDto);

      } catch (error) {
        next(error);
      }
    }
  );
}
