import { Doctor, CreateDoctorRequest, UpdateDoctorRequest, DoctorSearchQuery } from '@hospital/shared/dist/types/doctor.types';
export declare class DoctorRepository {
    private supabase;
    constructor();
    findById(doctorId: string): Promise<Doctor | null>;
    findByProfileId(profileId: string): Promise<Doctor | null>;
    findByEmail(email: string): Promise<Doctor | null>;
    findAll(limit?: number, offset?: number): Promise<Doctor[]>;
    findByDepartment(departmentId: string, limit?: number, offset?: number): Promise<Doctor[]>;
    findBySpecialty(specialty: string, limit?: number, offset?: number): Promise<Doctor[]>;
    search(query: DoctorSearchQuery, limit?: number, offset?: number): Promise<Doctor[]>;
    create(doctorData: CreateDoctorRequest): Promise<Doctor>;
    update(doctorId: string, doctorData: UpdateDoctorRequest): Promise<Doctor | null>;
    delete(doctorId: string): Promise<boolean>;
    count(): Promise<number>;
    countByDepartment(departmentId: string): Promise<number>;
    private generateDoctorId;
    private mapSupabaseDoctorToDoctor;
}
//# sourceMappingURL=doctor.repository.d.ts.map