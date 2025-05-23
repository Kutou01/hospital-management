import { BaseEntity, UserRole } from './common.types';
export interface User extends BaseEntity {
    email: string;
    password_hash: string;
    role: UserRole;
    full_name: string;
    phone_number?: string;
    is_active: boolean;
    last_login?: Date;
    profile_id?: string;
    email_verified: boolean;
    phone_verified: boolean;
}
export interface CreateUserRequest {
    email: string;
    password: string;
    role: UserRole;
    full_name: string;
    phone_number?: string;
    profile_data?: any;
}
export interface UpdateUserRequest {
    full_name?: string;
    phone_number?: string;
    is_active?: boolean;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface LoginResponse {
    user: Omit<User, 'password_hash'>;
    access_token: string;
    refresh_token: string;
    expires_in: number;
}
export interface RefreshTokenRequest {
    refresh_token: string;
}
export interface ChangePasswordRequest {
    current_password: string;
    new_password: string;
}
export interface ResetPasswordRequest {
    email: string;
}
export interface ResetPasswordConfirmRequest {
    token: string;
    new_password: string;
}
export interface Session extends BaseEntity {
    user_id: string;
    token: string;
    refresh_token: string;
    expires_at: Date;
    ip_address?: string;
    user_agent?: string;
    device_info?: any;
    is_active: boolean;
}
export interface CreateSessionRequest {
    user_id: string;
    ip_address?: string;
    user_agent?: string;
    device_info?: any;
}
export interface JWTPayload {
    sub: string;
    email: string;
    role: UserRole;
    iat: number;
    exp: number;
}
export interface AuthContext {
    user: Omit<User, 'password_hash'>;
    session: Session;
}
export interface Permission {
    id: string;
    name: string;
    description: string;
    resource: string;
    action: string;
}
export interface Role {
    id: string;
    name: UserRole;
    description: string;
    permissions: Permission[];
}
export interface UserProfile {
    user_id: string;
    avatar_url?: string;
    bio?: string;
    date_of_birth?: Date;
    gender?: 'male' | 'female' | 'other';
    address?: Address;
    emergency_contact?: EmergencyContact;
    preferences?: UserPreferences;
}
export interface Address {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
}
export interface EmergencyContact {
    name: string;
    relationship: string;
    phone_number: string;
    email?: string;
}
export interface UserPreferences {
    language: string;
    timezone: string;
    notifications: {
        email: boolean;
        sms: boolean;
        push: boolean;
    };
    theme: 'light' | 'dark' | 'auto';
}
//# sourceMappingURL=user.types.d.ts.map