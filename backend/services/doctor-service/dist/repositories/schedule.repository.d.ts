import { DoctorSchedule, CreateScheduleRequest, UpdateScheduleRequest } from '@hospital/shared/dist/types/doctor.types';
export declare class ScheduleRepository {
    private supabase;
    constructor();
    findByDoctorId(doctorId: string): Promise<DoctorSchedule[]>;
    findByDoctorAndDay(doctorId: string, dayOfWeek: number): Promise<DoctorSchedule | null>;
    create(scheduleData: CreateScheduleRequest): Promise<DoctorSchedule>;
    update(scheduleId: string, scheduleData: UpdateScheduleRequest): Promise<DoctorSchedule | null>;
    delete(scheduleId: string): Promise<boolean>;
    upsertSchedule(doctorId: string, dayOfWeek: number, scheduleData: UpdateScheduleRequest): Promise<DoctorSchedule>;
    getAvailability(doctorId: string, date: Date): Promise<DoctorSchedule | null>;
    getWeeklySchedule(doctorId: string): Promise<DoctorSchedule[]>;
    bulkUpdateSchedule(doctorId: string, schedules: UpdateScheduleRequest[]): Promise<DoctorSchedule[]>;
    getAvailableTimeSlots(doctorId: string, date: Date): Promise<string[]>;
    private timeStringToMinutes;
    private minutesToTimeString;
    private mapSupabaseScheduleToSchedule;
}
//# sourceMappingURL=schedule.repository.d.ts.map