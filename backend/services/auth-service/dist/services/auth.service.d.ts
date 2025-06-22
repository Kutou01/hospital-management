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
    blood_type?: string;
}
export interface AuthResponse {
    user?: {
        id: string;
        email?: string;
        full_name?: string;
        role?: string;
        email_confirmed_at?: string;
        created_at?: string;
        patient_id?: string;
        doctor_id?: string;
        admin_id?: string;
        phone_number?: string;
        is_active?: boolean;
        last_sign_in_at?: string;
    } | null;
    session?: any;
    error?: string;
    url?: string;
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
    sendMagicLink(email: string): Promise<AuthResponse>;
    sendPhoneOTP(phoneNumber: string): Promise<AuthResponse>;
    verifyPhoneOTP(phoneNumber: string, otpCode: string): Promise<AuthResponse>;
    initiateOAuth(provider: 'google' | 'github' | 'facebook' | 'apple'): Promise<AuthResponse & {
        url?: string;
    }>;
    handleOAuthCallback(code: string, state: string, provider?: string): Promise<AuthResponse>;
}
//# sourceMappingURL=auth.service.d.ts.map