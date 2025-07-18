import { Request, Response } from 'express';
export declare class DoctorController {
    private doctorRepository;
    private scheduleRepository;
    private reviewRepository;
    private shiftRepository;
    private experienceRepository;
    private appointmentService;
    private patientService;
    constructor();
    getAllDoctors(req: Request, res: Response): Promise<void>;
    getDoctorById(req: Request, res: Response): Promise<void>;
    getDoctorByProfileId(req: Request, res: Response): Promise<void>;
    getDoctorsByDepartment(req: Request, res: Response): Promise<void>;
    searchDoctors(req: Request, res: Response): Promise<void>;
    createDoctor(req: Request, res: Response): Promise<void>;
    updateDoctor(req: Request, res: Response): Promise<void>;
    deleteDoctor(req: Request, res: Response): Promise<void>;
    getDoctorSchedule(req: Request, res: Response): Promise<void>;
    getTodaySchedule(req: Request, res: Response): Promise<void>;
    getWeeklySchedule(req: Request, res: Response): Promise<void>;
    updateSchedule(req: Request, res: Response): Promise<void>;
    getAvailability(req: Request, res: Response): Promise<void>;
    getAvailableTimeSlots(req: Request, res: Response): Promise<void>;
    getDoctorReviews(req: Request, res: Response): Promise<void>;
    getReviewStats(req: Request, res: Response): Promise<void>;
    getDoctorShifts(req: Request, res: Response): Promise<void>;
    getUpcomingShifts(req: Request, res: Response): Promise<void>;
    createShift(req: Request, res: Response): Promise<void>;
    updateShift(req: Request, res: Response): Promise<void>;
    confirmShift(req: Request, res: Response): Promise<void>;
    getShiftStatistics(req: Request, res: Response): Promise<void>;
    getDoctorExperiences(req: Request, res: Response): Promise<void>;
    getExperienceTimeline(req: Request, res: Response): Promise<void>;
    getTotalExperience(req: Request, res: Response): Promise<void>;
    createExperience(req: Request, res: Response): Promise<void>;
    updateExperience(req: Request, res: Response): Promise<void>;
    deleteExperience(req: Request, res: Response): Promise<void>;
    getDoctorProfile(req: Request, res: Response): Promise<void>;
    getDoctorAppointments(req: Request, res: Response): Promise<void>;
    getDoctorStats(req: Request, res: Response): Promise<void>;
    getRealtimeStatus(req: Request, res: Response): Promise<void>;
    getLiveDoctors(req: Request, res: Response): Promise<void>;
    getCurrentDoctorProfile(req: any, res: Response): Promise<void>;
    getCurrentDoctorStats(req: any, res: Response): Promise<void>;
    getDashboardComplete(req: any, res: Response): Promise<void>;
    getTodayAppointments(req: any, res: Response): Promise<void>;
    getUpcomingAppointments(req: any, res: Response): Promise<void>;
    getRecentActivity(req: any, res: Response): Promise<void>;
}
//# sourceMappingURL=doctor.controller.d.ts.map