import { LoginRequest, CreateUserRequest, ChangePasswordRequest, ResetPasswordConfirmRequest, LoginResponse, User, JWTPayload } from '@hospital/shared/src/types/user.types';
export declare class AuthService {
    private userRepository;
    private sessionRepository;
    private profileService;
    constructor();
    login(loginData: LoginRequest, clientInfo: any): Promise<LoginResponse>;
    register(userData: CreateUserRequest): Promise<Omit<User, 'password_hash'> & {
        profile?: any;
    }>;
    refreshToken(refreshToken: string): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    logout(token: string): Promise<void>;
    changePassword(userId: string, passwordData: ChangePasswordRequest): Promise<void>;
    requestPasswordReset(email: string): Promise<void>;
    confirmPasswordReset(resetData: ResetPasswordConfirmRequest): Promise<void>;
    verifyToken(token: string): Promise<JWTPayload>;
    private generateAccessToken;
    private generateRefreshToken;
}
