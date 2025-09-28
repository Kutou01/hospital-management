/**
 * Schedule Appointment Use Case - Application Layer
 * V2 Clean Architecture + DDD + CQRS Implementation
 * Vietnamese healthcare appointment scheduling
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, Vietnamese Healthcare Standards
 */

import { Appointment } from '../../domain/aggregates/scheduling.aggregate';
import { AppointmentId, AppointmentType, AppointmentPriority } from '../../domain/value-objects/AppointmentId';
import { PatientInfo } from '../../domain/value-objects/PatientInfo';
import { ProviderInfo } from '../../domain/value-objects/ProviderInfo';
import { TimeSlot } from '../../domain/value-objects/TimeSlot';
import { AppointmentDetails, AppointmentReason } from '../../domain/value-objects/AppointmentDetails';
import { ISchedulingRepository } from '../interfaces/ISchedulingRepository';
import { IEventBus } from '../interfaces/IEventBus';
import { IAvailabilityService } from '../interfaces/IAvailabilityService';

export interface ScheduleAppointmentRequest {
  // Patient Information
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientDateOfBirth: string;
  patientNationalId: string;
  patientEmail?: string;
  patientAddress?: string;
  patientEmergencyContact?: string;
  patientInsuranceNumber?: string;
  patientInsuranceType?: 'BHYT' | 'BHTN' | 'PRIVATE';

  // Provider Information
  providerId: string;
  providerName: string;
  department: string;
  departmentCode: string;

  // Appointment Details
  appointmentType: AppointmentType;
  priority: AppointmentPriority;
  startTime: Date;
  endTime: Date;
  roomId?: string;
  reason: string;
  reasonCode?: AppointmentReason;
  symptoms?: string;
  notes?: string;
  preparationInstructions?: string;
  estimatedDuration: number;
  requiresPreparation?: boolean;
  isFollowUp?: boolean;
  previousAppointmentId?: string;
  urgencyLevel?: 'routine' | 'urgent' | 'emergency';
  specialRequirements?: string[];
  interpreterRequired?: boolean;
  wheelchairAccessible?: boolean;
  fasting?: boolean;
  medicationRestrictions?: string[];

  // System Information
  createdBy: string;
}

export interface ScheduleAppointmentResponse {
  success: boolean;
  appointmentId: string;
  message: string;
  data?: {
    appointment: {
      id: string;
      appointmentId: string;
      patientId: string;
      providerId: string;
      startTime: Date;
      endTime: Date;
      status: string;
      roomId?: string;
      reason: string;
      estimatedDuration: number;
      createdAt: Date;
      createdBy: string;
    };
    nextSteps: string[];
    reminders: {
      smsReminder: boolean;
      emailReminder: boolean;
      reminderTimes: Date[];
    };
  };
  errors?: string[];
}

/**
 * Schedule Appointment Use Case
 * Handles the complete appointment scheduling workflow
 */
export class ScheduleAppointmentUseCase {
  constructor(
    private readonly schedulingRepository: ISchedulingRepository,
    private readonly eventBus: IEventBus,
    private readonly availabilityService: IAvailabilityService
  ) {}

  async execute(request: ScheduleAppointmentRequest): Promise<ScheduleAppointmentResponse> {
    try {
      // 1. Validate request
      this.validateRequest(request);

      // 2. Check provider availability
      const isAvailable = await this.availabilityService.checkAvailability(
        request.providerId,
        request.startTime,
        request.endTime
      );

      if (!isAvailable) {
        return {
          success: false,
          appointmentId: '',
          message: 'Khung thời gian đã được đặt hoặc không khả dụng',
          errors: ['TIME_SLOT_NOT_AVAILABLE']
        };
      }

      // 3. Check for conflicts
      const conflicts = await this.schedulingRepository.findConflicts(
        request.providerId,
        request.startTime,
        request.endTime
      );

      if (conflicts.length > 0) {
        return {
          success: false,
          appointmentId: '',
          message: 'Có xung đột lịch hẹn trong khung thời gian này',
          errors: ['APPOINTMENT_CONFLICT']
        };
      }

      // 4. Create domain objects
      const appointmentId = AppointmentId.create(
        request.appointmentType,
        request.departmentCode,
        request.priority
      );

      const patientInfo = PatientInfo.create(
        request.patientId,
        request.patientName,
        request.patientPhone,
        request.patientDateOfBirth,
        request.patientNationalId,
        request.patientEmail,
        request.patientAddress,
        request.patientEmergencyContact,
        request.patientInsuranceNumber,
        request.patientInsuranceType
      );

      const providerInfo = await this.getProviderInfo(request.providerId);

      const timeSlot = TimeSlot.create(
        request.startTime,
        request.endTime,
        'available',
        request.providerId,
        request.roomId
      );

      const appointmentDetails = AppointmentDetails.create(
        request.reason,
        request.estimatedDuration,
        request.requiresPreparation || false,
        request.isFollowUp || false,
        request.urgencyLevel || 'routine',
        request.reasonCode,
        request.symptoms,
        request.notes,
        request.preparationInstructions,
        request.previousAppointmentId,
        request.specialRequirements,
        request.interpreterRequired,
        request.wheelchairAccessible,
        request.fasting,
        request.medicationRestrictions
      );

      // 5. Create appointment aggregate
      const appointment = Appointment.create(
        appointmentId,
        patientInfo,
        providerInfo,
        timeSlot,
        appointmentDetails,
        request.roomId || 'TBD',
        request.createdBy
      );

      // 6. Save appointment
      await this.schedulingRepository.save(appointment);

      // 7. Publish domain events
      const events = appointment.getUncommittedEvents();
      for (const event of events) {
        await this.eventBus.publish(event);
      }
      appointment.markEventsAsCommitted();

      // 8. Generate response
      return {
        success: true,
        appointmentId: appointment.appointmentId.value,
        message: 'Cuộc hẹn đã được đặt thành công',
        data: {
          appointment: {
            id: appointment.id,
            appointmentId: appointment.appointmentId.value,
            patientId: appointment.patient.patientId,
            providerId: appointment.provider.providerId,
            startTime: appointment.timeSlot.startTime,
            endTime: appointment.timeSlot.endTime,
            status: appointment.status,
            roomId: appointment.roomId,
            reason: appointment.details.reason,
            estimatedDuration: appointment.details.estimatedDuration,
            createdAt: appointment.createdAt,
            createdBy: appointment.createdBy
          },
          nextSteps: this.generateNextSteps(appointment),
          reminders: this.generateReminderSchedule(appointment)
        }
      };

    } catch (error) {
      return {
        success: false,
        appointmentId: '',
        message: 'Có lỗi xảy ra khi đặt lịch hẹn',
        errors: [error instanceof Error ? error.message : 'UNKNOWN_ERROR']
      };
    }
  }

  private validateRequest(request: ScheduleAppointmentRequest): void {
    if (!request.patientId || !request.patientName) {
      throw new Error('Thông tin bệnh nhân không đầy đủ');
    }

    if (!request.providerId || !request.providerName) {
      throw new Error('Thông tin nhà cung cấp không đầy đủ');
    }

    if (!request.startTime || !request.endTime) {
      throw new Error('Thời gian cuộc hẹn không hợp lệ');
    }

    if (request.startTime >= request.endTime) {
      throw new Error('Thời gian bắt đầu phải trước thời gian kết thúc');
    }

    if (request.startTime <= new Date()) {
      throw new Error('Không thể đặt lịch hẹn trong quá khứ');
    }

    if (!request.reason || request.reason.trim().length < 3) {
      throw new Error('Lý do khám phải có ít nhất 3 ký tự');
    }

    if (request.estimatedDuration <= 0 || request.estimatedDuration > 480) {
      throw new Error('Thời gian dự kiến phải từ 1 phút đến 8 giờ');
    }
  }

  private async getProviderInfo(providerId: string): Promise<ProviderInfo> {
    // This would typically call Provider Staff Service through API Gateway
    // For now, we'll create a mock implementation
    return ProviderInfo.create(
      providerId,
      'Provider Name', // Would be fetched from Provider Staff Service
      'Department',
      'DEPT',
      'VN-XX-0000',
      'DOCTOR',
      'ACTIVE'
    );
  }

  private generateNextSteps(appointment: Appointment): string[] {
    const steps: string[] = [
      'Cuộc hẹn đã được tạo và đang chờ xác nhận',
      'Bạn sẽ nhận được thông báo xác nhận qua SMS/Email'
    ];

    if (appointment.details.requiresPreparation) {
      steps.push('Vui lòng chuẩn bị theo hướng dẫn đã gửi');
    }

    if (appointment.details.fasting) {
      steps.push('Nhớ nhịn ăn theo yêu cầu trước khi đến khám');
    }

    steps.push('Đến sớm 15 phút để làm thủ tục');

    return steps;
  }

  private generateReminderSchedule(appointment: Appointment): any {
    const reminderTimes: Date[] = [];
    const startTime = appointment.timeSlot.startTime;

    // 24 hours before
    const oneDayBefore = new Date(startTime);
    oneDayBefore.setHours(oneDayBefore.getHours() - 24);
    reminderTimes.push(oneDayBefore);

    // 2 hours before for urgent appointments
    if (appointment.details.isUrgent() || appointment.details.isEmergency()) {
      const twoHoursBefore = new Date(startTime);
      twoHoursBefore.setHours(twoHoursBefore.getHours() - 2);
      reminderTimes.push(twoHoursBefore);
    }

    return {
      smsReminder: true,
      emailReminder: !!appointment.patient.email,
      reminderTimes
    };
  }
}
