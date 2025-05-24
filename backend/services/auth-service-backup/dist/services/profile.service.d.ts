import { UserRole } from '@hospital/shared/src/types/common.types';
import { DoctorProfileData, PatientProfileData } from '@hospital/shared/src/types/user.types';
export declare class ProfileService {
    /**
     * Create role-specific profile after user registration
     */
    createRoleProfile(userId: string, role: UserRole, profileData: DoctorProfileData | PatientProfileData): Promise<string>;
    /**
     * Create doctor profile
     */
    private createDoctorProfile;
    /**
     * Create patient profile
     */
    private createPatientProfile;
    /**
     * Create staff profile for admin, nurse, receptionist
     */
    private createStaffProfile;
    /**
     * Create doctor availability schedule
     */
    private createDoctorAvailability;
    /**
     * Get profile by user ID and role
     */
    getProfileByUserId(userId: string, role: UserRole): Promise<any>;
    private getDoctorProfile;
    private getPatientProfile;
    private getStaffProfile;
}
