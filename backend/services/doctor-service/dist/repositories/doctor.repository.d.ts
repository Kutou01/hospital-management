import { Doctor, CreateDoctorRequest, UpdateDoctorRequest, DoctorSearchQuery } from '@hospital/shared/dist/types/doctor.types';
export declare class DoctorRepository {
    private supabase;
    constructor();
    findById(doctorId: string): Promise<Doctor | null>;
    findByProfileId(profileId: string): Promise<Doctor | null>;
    findByEmail(email: string): Promise<Doctor | null>;
    findAll(limit?: number, offset?: number): Promise<Doctor[]>;
    findByDepartment(departmentId: string, limit?: number, offset?: number): Promise<Doctor[]>;
    findByDepartmentWithCount(departmentId: string, limit?: number, offset?: number): Promise<{
        doctors: Doctor[];
        total: number;
    }>;
    findBySpecialty(specialty: string, limit?: number, offset?: number): Promise<Doctor[]>;
    search(query: DoctorSearchQuery, limit?: number, offset?: number): Promise<Doctor[]>;
    getSearchCount(query: DoctorSearchQuery): Promise<number>;
    create(doctorData: CreateDoctorRequest): Promise<Doctor>;
    update(doctorId: string, doctorData: UpdateDoctorRequest): Promise<Doctor | null>;
    delete(doctorId: string): Promise<boolean>;
    count(): Promise<number>;
    getDashboardStats(doctorId: string): Promise<any>;
    getRecentAppointments(doctorId: string, limit?: number): Promise<any[]>;
    getWeeklyStats(doctorId: string): Promise<any>;
    getMonthlyStats(doctorId: string): Promise<any>;
    countByDepartment(departmentId: string): Promise<number>;
    private mapSupabaseDoctorToDoctor;
}
//# sourceMappingURL=doctor.repository.d.ts.map