/**
 * User Aggregate Root - Identity & Access Management
 * Clean Architecture + DDD Implementation
 * Schema: auth_schema
 */

import { AggregateRoot } from '../../../shared/domain/AggregateRoot';
import { UserId } from '../value-objects/UserId';
import { Email } from '../value-objects/Email';
import { PersonalInfo } from '../value-objects/PersonalInfo';
import { HealthcareRole } from '../entities/HealthcareRole';
import { UserSession } from '../entities/UserSession';
import { LoginAttempt } from '../entities/LoginAttempt';
import { PasswordResetToken } from '../entities/PasswordResetToken';
import { UserCreatedEvent } from '../events/UserCreatedEvent';
import { UserAuthenticatedEvent } from '../events/UserAuthenticatedEvent';
import { UserRoleChangedEvent } from '../events/UserRoleChangedEvent';

export interface UserProps {
  id: UserId;
  email: Email;
  personalInfo: PersonalInfo;
  passwordHash: string;
  healthcareRole: HealthcareRole;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends AggregateRoot<UserProps> {
  private constructor(props: UserProps) {
    super(props);
  }

  // Factory method for creating new users
  public static create(
    email: Email,
    personalInfo: PersonalInfo,
    passwordHash: string,
    healthcareRole: HealthcareRole
  ): User {
    const userId = UserId.generate();
    const now = new Date();

    const user = new User({
      id: userId,
      email,
      personalInfo,
      passwordHash,
      healthcareRole,
      isActive: true,
      isEmailVerified: false,
      createdAt: now,
      updatedAt: now
    });

    // Domain event for user creation
    user.addDomainEvent(new UserCreatedEvent(userId, email, healthcareRole));

    return user;
  }

  // Factory method for reconstituting from persistence
  public static reconstitute(props: UserProps): User {
    return new User(props);
  }

  // Getters
  public get id(): UserId {
    return this.props.id;
  }

  public get email(): Email {
    return this.props.email;
  }

  public get personalInfo(): PersonalInfo {
    return this.props.personalInfo;
  }

  public get healthcareRole(): HealthcareRole {
    return this.props.healthcareRole;
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  public get isEmailVerified(): boolean {
    return this.props.isEmailVerified;
  }

  public get lastLoginAt(): Date | undefined {
    return this.props.lastLoginAt;
  }

  // Business methods
  public authenticate(password: string, ipAddress: string, userAgent: string): UserSession {
    if (!this.props.isActive) {
      throw new Error('Tài khoản đã bị vô hiệu hóa');
    }

    if (!this.verifyPassword(password)) {
      // Record failed login attempt
      const failedAttempt = LoginAttempt.createFailed(
        this.props.email,
        ipAddress,
        userAgent,
        'Mật khẩu không chính xác'
      );
      throw new Error('Thông tin đăng nhập không chính xác');
    }

    // Update last login
    this.props.lastLoginAt = new Date();
    this.props.updatedAt = new Date();

    // Create user session
    const session = UserSession.create(this.props.id, ipAddress, userAgent);

    // Domain event for successful authentication
    this.addDomainEvent(new UserAuthenticatedEvent(this.props.id, session.id));

    return session;
  }

  public changeRole(newRole: HealthcareRole, changedBy: UserId): void {
    const oldRole = this.props.healthcareRole;
    this.props.healthcareRole = newRole;
    this.props.updatedAt = new Date();

    // Domain event for role change
    this.addDomainEvent(new UserRoleChangedEvent(this.props.id, oldRole, newRole, changedBy));
  }

  public updatePersonalInfo(personalInfo: PersonalInfo): void {
    this.props.personalInfo = personalInfo;
    this.props.updatedAt = new Date();
  }

  public verifyEmail(): void {
    this.props.isEmailVerified = true;
    this.props.updatedAt = new Date();
  }

  public deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  public activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  public createPasswordResetToken(): PasswordResetToken {
    return PasswordResetToken.create(this.props.id);
  }

  // Private methods
  private verifyPassword(password: string): boolean {
    // In real implementation, use bcrypt or similar
    // This is a placeholder for password verification logic
    return true; // Simplified for demo
  }

  // Validation methods
  public canPerformAction(action: string, resource: string): boolean {
    return this.props.healthcareRole.hasPermission(action, resource);
  }

  public isInRole(roleName: string): boolean {
    return this.props.healthcareRole.name === roleName;
  }

  // Healthcare-specific methods
  public canAccessPatientData(): boolean {
    return this.canPerformAction('read', 'patient_data');
  }

  public canModifyMedicalRecords(): boolean {
    return this.canPerformAction('write', 'medical_records');
  }

  public canManageUsers(): boolean {
    return this.canPerformAction('manage', 'users');
  }

  // Audit methods
  public getAuditInfo(): object {
    return {
      userId: this.props.id.value,
      email: this.props.email.value,
      role: this.props.healthcareRole.name,
      isActive: this.props.isActive,
      lastLoginAt: this.props.lastLoginAt,
      createdAt: this.props.createdAt
    };
  }
}
