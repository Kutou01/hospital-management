"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const user_repository_factory_1 = require("../repositories/user-repository.factory");
const common_types_1 = require("@hospital/shared/src/types/common.types");
const logger_1 = __importDefault(require("@hospital/shared/src/utils/logger"));
class UserService {
    constructor() {
        this.userRepository = user_repository_factory_1.UserRepositoryFactory.getInstance();
    }
    async getUserById(id) {
        try {
            const user = await this.userRepository.findById(id);
            if (!user) {
                throw new common_types_1.NotFoundError('User', id);
            }
            // Remove password from response
            const { password_hash, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }
        catch (error) {
            logger_1.default.error('Error getting user by ID', { error, id });
            throw error;
        }
    }
    async getUserByEmail(email) {
        try {
            const user = await this.userRepository.findByEmail(email);
            if (!user) {
                return null;
            }
            // Remove password from response
            const { password_hash, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }
        catch (error) {
            logger_1.default.error('Error getting user by email', { error, email });
            throw error;
        }
    }
    async getAllUsers(limit = 50, offset = 0) {
        try {
            const users = await this.userRepository.findAll(limit, offset);
            // Remove passwords from response
            return users.map(user => {
                const { password_hash, ...userWithoutPassword } = user;
                return userWithoutPassword;
            });
        }
        catch (error) {
            logger_1.default.error('Error getting all users', { error, limit, offset });
            throw error;
        }
    }
    async getUsersByRole(role, limit = 50, offset = 0) {
        try {
            const users = await this.userRepository.findByRole(role, limit, offset);
            // Remove passwords from response
            return users.map(user => {
                const { password_hash, ...userWithoutPassword } = user;
                return userWithoutPassword;
            });
        }
        catch (error) {
            logger_1.default.error('Error getting users by role', { error, role, limit, offset });
            throw error;
        }
    }
    async updateUser(id, userData) {
        try {
            const updatedUser = await this.userRepository.update(id, userData);
            if (!updatedUser) {
                throw new common_types_1.NotFoundError('User', id);
            }
            // Remove password from response
            const { password_hash, ...userWithoutPassword } = updatedUser;
            return userWithoutPassword;
        }
        catch (error) {
            logger_1.default.error('Error updating user', { error, id, userData });
            throw error;
        }
    }
    async deactivateUser(id) {
        try {
            await this.userRepository.deactivate(id);
            logger_1.default.info('User deactivated', { userId: id });
        }
        catch (error) {
            logger_1.default.error('Error deactivating user', { error, id });
            throw error;
        }
    }
    async activateUser(id) {
        try {
            await this.userRepository.activate(id);
            logger_1.default.info('User activated', { userId: id });
        }
        catch (error) {
            logger_1.default.error('Error activating user', { error, id });
            throw error;
        }
    }
    async deleteUser(id) {
        try {
            const deleted = await this.userRepository.delete(id);
            if (!deleted) {
                throw new common_types_1.NotFoundError('User', id);
            }
            logger_1.default.info('User deleted', { userId: id });
        }
        catch (error) {
            logger_1.default.error('Error deleting user', { error, id });
            throw error;
        }
    }
    async getUserCount() {
        try {
            return await this.userRepository.count();
        }
        catch (error) {
            logger_1.default.error('Error getting user count', { error });
            throw error;
        }
    }
    async getUserCountByRole(role) {
        try {
            return await this.userRepository.countByRole(role);
        }
        catch (error) {
            logger_1.default.error('Error getting user count by role', { error, role });
            throw error;
        }
    }
    async getUserByProfileId(profileId) {
        try {
            const user = await this.userRepository.findByProfileId(profileId);
            if (!user) {
                return null;
            }
            // Remove password from response
            const { password_hash, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }
        catch (error) {
            logger_1.default.error('Error getting user by profile ID', { error, profileId });
            throw error;
        }
    }
}
exports.UserService = UserService;
