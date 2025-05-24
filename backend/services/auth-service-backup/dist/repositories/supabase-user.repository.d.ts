import { User } from '@hospital/shared/src/types/user.types';
export declare class SupabaseUserRepository {
    private supabase;
    constructor();
    private getSupabaseClient;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    create(userData: Omit<User, 'last_login' | 'profile_id'>): Promise<User>;
    update(id: string, userData: Partial<User>): Promise<User | null>;
    updateLastLogin(id: string): Promise<void>;
    updatePassword(id: string, passwordHash: string): Promise<void>;
    findAll(limit?: number, offset?: number): Promise<User[]>;
    findByRole(role: string, limit?: number, offset?: number): Promise<User[]>;
    delete(id: string): Promise<boolean>;
    deactivate(id: string): Promise<void>;
    activate(id: string): Promise<void>;
    count(): Promise<number>;
    countByRole(role: string): Promise<number>;
    findByProfileId(profileId: string): Promise<User | null>;
    private mapSupabaseUserToUser;
    private mapUserToSupabaseUser;
}
