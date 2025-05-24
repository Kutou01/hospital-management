import { User, UpdateUserRequest } from '@hospital/shared/src/types/user.types';
export declare class UserService {
    private userRepository;
    constructor();
    getUserById(id: string): Promise<Omit<User, 'password_hash'> | null>;
    getUserByEmail(email: string): Promise<Omit<User, 'password_hash'> | null>;
    getAllUsers(limit?: number, offset?: number): Promise<Omit<User, 'password_hash'>[]>;
    getUsersByRole(role: string, limit?: number, offset?: number): Promise<Omit<User, 'password_hash'>[]>;
    updateUser(id: string, userData: UpdateUserRequest): Promise<Omit<User, 'password_hash'> | null>;
    deactivateUser(id: string): Promise<void>;
    activateUser(id: string): Promise<void>;
    deleteUser(id: string): Promise<void>;
    getUserCount(): Promise<number>;
    getUserCountByRole(role: string): Promise<number>;
    getUserByProfileId(profileId: string): Promise<Omit<User, 'password_hash'> | null>;
}
