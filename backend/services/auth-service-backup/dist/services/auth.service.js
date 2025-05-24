"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const user_types_1 = require("@hospital/shared/src/types/user.types");
const common_types_1 = require("@hospital/shared/src/types/common.types");
const user_repository_factory_1 = require("../repositories/user-repository.factory");
const session_repository_1 = require("../repositories/session.repository");
const profile_service_1 = require("./profile.service");
const logger_1 = __importDefault(require("@hospital/shared/src/utils/logger"));
class AuthService {
    constructor() {
        this.userRepository = user_repository_factory_1.UserRepositoryFactory.getInstance();
        this.sessionRepository = new session_repository_1.SessionRepository();
        this.profileService = new profile_service_1.ProfileService();
    }
    async login(loginData, clientInfo) {
        const { email, password } = loginData;
        // Find user by email
        const user = await this.userRepository.findByEmail(email);
        if (!user || !user.is_active) {
            throw new common_types_1.UnauthorizedError('Invalid credentials');
        }
        // Verify password
        const isPasswordValid = await bcrypt_1.default.compare(password, user.password_hash);
        if (!isPasswordValid) {
            throw new common_types_1.UnauthorizedError('Invalid credentials');
        }
        // Get user profile
        const profile = await this.profileService.getProfileByUserId(user.id, user.role);
        // Generate tokens with profile info
        const accessToken = this.generateAccessToken(user, profile?.id);
        const refreshToken = this.generateRefreshToken(user);
        // Create session
        const sessionId = (0, uuid_1.v4)();
        await this.sessionRepository.create({
            id: sessionId,
            user_id: user.id,
            token: accessToken,
            refresh_token: refreshToken,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            ip_address: clientInfo.ip,
            user_agent: clientInfo.userAgent,
            device_info: clientInfo.deviceInfo,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
        });
        // Update last login
        await this.userRepository.updateLastLogin(user.id);
        // Remove password from response
        const { password_hash, ...userWithoutPassword } = user;
        return {
            user: {
                ...userWithoutPassword,
                profile
            },
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: 24 * 60 * 60 // 24 hours in seconds
        };
    }
    async register(userData) {
        const { email, password, role, full_name, phone_number, profile_data } = userData;
        // Check if user already exists
        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) {
            throw new common_types_1.ConflictError('Email already exists');
        }
        // Hash password
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
        const password_hash = await bcrypt_1.default.hash(password, saltRounds);
        // Generate user ID
        const userId = `USR${Date.now()}${Math.floor(Math.random() * 1000)}`;
        // Create user
        const newUser = await this.userRepository.create({
            id: userId,
            email,
            password_hash,
            role,
            full_name,
            phone_number,
            is_active: true,
            email_verified: false,
            phone_verified: false,
            created_at: new Date(),
            updated_at: new Date()
        });
        // Create role-specific profile if profile_data is provided
        let profile = null;
        if (profile_data) {
            try {
                const profileId = await this.profileService.createRoleProfile(userId, role, profile_data);
                profile = await this.profileService.getProfileByUserId(userId, role);
                // Update user with profile_id
                await this.userRepository.update(userId, { profile_id: profileId });
                logger_1.default.info('Profile created successfully during registration', {
                    userId,
                    role,
                    profileId
                });
            }
            catch (error) {
                logger_1.default.error('Error creating profile during registration', {
                    error,
                    userId,
                    role
                });
                // Don't fail registration if profile creation fails
            }
        }
        // Remove password from response
        const { password_hash: _, ...userWithoutPassword } = newUser;
        return {
            ...userWithoutPassword,
            profile
        };
    }
    async refreshToken(refreshToken) {
        // Find session by refresh token
        const session = await this.sessionRepository.findByRefreshToken(refreshToken);
        if (!session || !session.is_active || session.expires_at < new Date()) {
            throw new common_types_1.UnauthorizedError('Invalid refresh token');
        }
        // Get user
        const user = await this.userRepository.findById(session.user_id);
        if (!user || !user.is_active) {
            throw new common_types_1.UnauthorizedError('User not found or inactive');
        }
        // Get user profile
        const profile = await this.profileService.getProfileByUserId(user.id, user.role);
        // Generate new tokens
        const newAccessToken = this.generateAccessToken(user, profile?.id);
        const newRefreshToken = this.generateRefreshToken(user);
        // Update session
        await this.sessionRepository.update(session.id, {
            token: newAccessToken,
            refresh_token: newRefreshToken,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            updated_at: new Date()
        });
        return {
            access_token: newAccessToken,
            refresh_token: newRefreshToken
        };
    }
    async logout(token) {
        // Find and deactivate session
        const session = await this.sessionRepository.findByToken(token);
        if (session) {
            await this.sessionRepository.update(session.id, {
                is_active: false,
                updated_at: new Date()
            });
        }
    }
    async changePassword(userId, passwordData) {
        const { current_password, new_password } = passwordData;
        // Get user
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new common_types_1.NotFoundError('User', userId);
        }
        // Verify current password
        const isCurrentPasswordValid = await bcrypt_1.default.compare(current_password, user.password_hash);
        if (!isCurrentPasswordValid) {
            throw new common_types_1.UnauthorizedError('Current password is incorrect');
        }
        // Hash new password
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
        const newPasswordHash = await bcrypt_1.default.hash(new_password, saltRounds);
        // Update password
        await this.userRepository.updatePassword(userId, newPasswordHash);
        // Deactivate all sessions for this user
        await this.sessionRepository.deactivateAllUserSessions(userId);
    }
    async requestPasswordReset(email) {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            // Don't reveal if email exists or not
            return;
        }
        // Generate reset token
        const resetToken = (0, uuid_1.v4)();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        // Save reset token (you would implement this)
        // await this.userRepository.savePasswordResetToken(user.id, resetToken, expiresAt);
        // Send email (you would implement this)
        logger_1.default.info('Password reset requested', { userId: user.id, email });
    }
    async confirmPasswordReset(resetData) {
        // Implement password reset confirmation
        // This would involve verifying the token and updating the password
        logger_1.default.info('Password reset confirmed', { token: resetData.token });
    }
    async verifyToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            return decoded;
        }
        catch (error) {
            throw new common_types_1.UnauthorizedError('Invalid token');
        }
    }
    generateAccessToken(user, profileId) {
        const permissions = user_types_1.DEFAULT_PERMISSIONS[user.role] || [];
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            full_name: user.full_name,
            profile_id: profileId || user.profile_id,
            permissions
        };
        return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET || 'default-secret', {
            expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        });
    }
    generateRefreshToken(user) {
        const payload = {
            sub: user.id,
            type: 'refresh'
        };
        return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET || 'default-secret', {
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
        });
    }
}
exports.AuthService = AuthService;
