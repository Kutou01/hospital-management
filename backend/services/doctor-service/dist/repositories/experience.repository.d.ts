import { DoctorExperience, CreateExperienceRequest } from '@hospital/shared/dist/types/doctor.types';
export declare class ExperienceRepository {
    private supabase;
    constructor();
    findByDoctorId(doctorId: string): Promise<DoctorExperience[]>;
    findById(experienceId: string): Promise<DoctorExperience | null>;
    findByType(doctorId: string, experienceType: 'work' | 'education' | 'certification' | 'research'): Promise<DoctorExperience[]>;
    findCurrent(doctorId: string): Promise<DoctorExperience[]>;
    create(experienceData: CreateExperienceRequest): Promise<DoctorExperience>;
    update(experienceId: string, experienceData: Partial<CreateExperienceRequest>): Promise<DoctorExperience | null>;
    delete(experienceId: string): Promise<boolean>;
    getWorkExperience(doctorId: string): Promise<DoctorExperience[]>;
    getEducation(doctorId: string): Promise<DoctorExperience[]>;
    getCertifications(doctorId: string): Promise<DoctorExperience[]>;
    getResearch(doctorId: string): Promise<DoctorExperience[]>;
    calculateTotalExperience(doctorId: string): Promise<{
        total_years: number;
        work_years: number;
        education_years: number;
        current_positions: DoctorExperience[];
    }>;
    getExperienceTimeline(doctorId: string): Promise<DoctorExperience[]>;
    searchExperiences(doctorId: string, searchTerm: string): Promise<DoctorExperience[]>;
    getExperiencesByDateRange(doctorId: string, startDate: Date, endDate: Date): Promise<DoctorExperience[]>;
    private updateCurrentStatus;
    private mapSupabaseExperienceToExperience;
}
//# sourceMappingURL=experience.repository.d.ts.map