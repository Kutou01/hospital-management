export interface IUserRepository {
    findById(id: string): Promise<any>;
    findByEmail(email: string): Promise<any>;
    findByProfileId(profileId: string): Promise<any>;
    create(userData: any): Promise<any>;
    update(id: string, userData: any): Promise<any>;
    updateLastLogin(id: string): Promise<void>;
    updatePassword(id: string, passwordHash: string): Promise<void>;
    findAll(limit?: number, offset?: number): Promise<any[]>;
    findByRole(role: string, limit?: number, offset?: number): Promise<any[]>;
    delete(id: string): Promise<boolean>;
    deactivate(id: string): Promise<void>;
    activate(id: string): Promise<void>;
    count(): Promise<number>;
    countByRole(role: string): Promise<number>;
}
export declare class UserRepositoryFactory {
    private static instance;
    static getInstance(): IUserRepository;
    static reset(): void;
}
