export interface SignUpData {
    email: string;
    password: string;
    full_name: string;
    role: 'admin' | 'doctor' | 'patient';
    phone_number?: string;
    gender?: 'male' | 'female' | 'other';
    date_of_birth?: string;
    specialty?: string;
    license_number?: string;
    qualification?: string;
    department_id?: string;
    address?: any;
    emergency_contact?: any;
    insurance_info?: any;
}
export interface AuthResponse {
    user?: any;
    session?: any;
    error?: string;
}
export declare class AuthService {
    private generateDoctorId;
    private generatePatientId;
    private generateAdminId;
    signUp(userData: SignUpData): Promise<AuthResponse>;
    signIn(email: string, password: string): Promise<AuthResponse>;
    signOut(token: string): Promise<AuthResponse>;
    refreshToken(refreshToken: string): Promise<AuthResponse>;
    resetPassword(email: string): Promise<AuthResponse>;
    verifyToken(token: string): Promise<AuthResponse>;
    private createRoleSpecificRecord;
    private forceRefreshSchemaCache;
    createDoctorRecord(userId: string, userData: SignUpData): Promise<void>;
    createPatientRecord(userId: string, userData: SignUpData): Promise<void>;
    private createAdminRecord;
}
//# sourceMappingURL=auth.service.d.ts.map