import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import {
  LoginRequest,
  CreateUserRequest,
  ChangePasswordRequest,
  ResetPasswordRequest,
  ResetPasswordConfirmRequest,
  LoginResponse,
  User,
  JWTPayload,
  DEFAULT_PERMISSIONS
} from '@hospital/shared/src/types/user.types';
import { UnauthorizedError, ConflictError, NotFoundError } from '@hospital/shared/src/types/common.types';
import { UserRepositoryFactory, IUserRepository } from '../repositories/user-repository.factory';
import { SessionRepository } from '../repositories/session.repository';
import { ProfileService } from './profile.service';
import logger from '@hospital/shared/src/utils/logger';

export class AuthService {
  private userRepository: IUserRepository;
  private sessionRepository: SessionRepository;
  private profileService: ProfileService;

  constructor() {
    this.userRepository = UserRepositoryFactory.getInstance();
    this.sessionRepository = new SessionRepository();
    this.profileService = new ProfileService();
  }

  async login(loginData: LoginRequest, clientInfo: any): Promise<LoginResponse> {
    const { email, password } = loginData;

    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.is_active) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Get user profile
    const profile = await this.profileService.getProfileByUserId(user.id, user.role);

    // Generate tokens with profile info
    const accessToken = this.generateAccessToken(user, profile?.id);
    const refreshToken = this.generateRefreshToken(user);

    // Create session
    const sessionId = uuidv4();
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

  async register(userData: CreateUserRequest): Promise<Omit<User, 'password_hash'> & { profile?: any }> {
    const { email, password, role, full_name, phone_number, profile_data } = userData;

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('Email already exists');
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const password_hash = await bcrypt.hash(password, saltRounds);

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

        logger.info('Profile created successfully during registration', {
          userId,
          role,
          profileId
        });
      } catch (error) {
        logger.error('Error creating profile during registration', {
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

  async refreshToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
    // Find session by refresh token
    const session = await this.sessionRepository.findByRefreshToken(refreshToken);
    if (!session || !session.is_active || session.expires_at < new Date()) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Get user
    const user = await this.userRepository.findById(session.user_id);
    if (!user || !user.is_active) {
      throw new UnauthorizedError('User not found or inactive');
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

  async logout(token: string): Promise<void> {
    // Find and deactivate session
    const session = await this.sessionRepository.findByToken(token);
    if (session) {
      await this.sessionRepository.update(session.id, {
        is_active: false,
        updated_at: new Date()
      });
    }
  }

  async changePassword(userId: string, passwordData: ChangePasswordRequest): Promise<void> {
    const { current_password, new_password } = passwordData;

    // Get user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User', userId);
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(current_password, user.password_hash);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const newPasswordHash = await bcrypt.hash(new_password, saltRounds);

    // Update password
    await this.userRepository.updatePassword(userId, newPasswordHash);

    // Deactivate all sessions for this user
    await this.sessionRepository.deactivateAllUserSessions(userId);
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not
      return;
    }

    // Generate reset token
    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token (you would implement this)
    // await this.userRepository.savePasswordResetToken(user.id, resetToken, expiresAt);

    // Send email (you would implement this)
    logger.info('Password reset requested', { userId: user.id, email });
  }

  async confirmPasswordReset(resetData: ResetPasswordConfirmRequest): Promise<void> {
    // Implement password reset confirmation
    // This would involve verifying the token and updating the password
    logger.info('Password reset confirmed', { token: resetData.token });
  }

  async verifyToken(token: string): Promise<JWTPayload> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      return decoded;
    } catch (error) {
      throw new UnauthorizedError('Invalid token');
    }
  }

  private generateAccessToken(user: Omit<User, 'password_hash'>, profileId?: string): string {
    const permissions = DEFAULT_PERMISSIONS[user.role] || [];

    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      sub: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      profile_id: profileId || user.profile_id,
      permissions
    };

    return (jwt.sign as any)(payload, process.env.JWT_SECRET || 'default-secret', {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
  }

  private generateRefreshToken(user: Omit<User, 'password_hash'>): string {
    const payload = {
      sub: user.id,
      type: 'refresh'
    };

    return (jwt.sign as any)(payload, process.env.JWT_SECRET || 'default-secret', {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    });
  }
}
