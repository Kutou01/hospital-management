import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { createDataLoaders } from './dataloaders';
import { RestApiService } from './services/rest-api.service';
import { addVietnameseContext } from './middleware/i18n.middleware';
import logger from '@hospital/shared/dist/utils/logger';

/**
 * GraphQL Context Interface
 * Contains all data and services needed by resolvers
 */
export interface GraphQLContext {
  // Request/Response objects
  req: Request;
  res?: Response;
  
  // Authentication
  user?: AuthenticatedUser;
  token?: string;
  
  // Services
  restApi: RestApiService;
  
  // DataLoaders for N+1 optimization
  dataloaders: ReturnType<typeof createDataLoaders>;
  
  // Request metadata
  requestId: string;
  userAgent?: string;
  ipAddress?: string;
  
  // Language preference
  language: 'vi' | 'en';
  
  // Rate limiting info
  rateLimitInfo?: {
    limit: number;
    remaining: number;
    resetTime: Date;
  };
}

/**
 * Authenticated User Interface
 */
export interface AuthenticatedUser {
  id: string;
  profileId: string;
  email: string;
  role: UserRole;
  permissions: string[];
  
  // Role-specific IDs
  doctorId?: string;
  patientId?: string;
  
  // User details
  fullName: string;
  isActive: boolean;
  lastLoginAt?: Date;
  
  // Session info
  sessionId?: string;
  tokenIssuedAt: Date;
  tokenExpiresAt: Date;
}

/**
 * User Roles
 */
export enum UserRole {
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  PATIENT = 'patient',
  NURSE = 'nurse',
  RECEPTIONIST = 'receptionist',
  MANAGER = 'manager'
}

/**
 * Context creation parameters
 */
interface ContextParams {
  req: Request;
  res?: Response;
  connectionParams?: any; // For WebSocket subscriptions
}

/**
 * Create GraphQL Context
 * Sets up all services, authentication, and utilities needed by resolvers
 */
export async function createContext({ req, res, connectionParams }: ContextParams): Promise<GraphQLContext> {
  // Extract request metadata
  const requestId = req.headers['x-request-id'] as string || generateRequestId();
  const userAgent = req.headers['user-agent'];
  const ipAddress = req.ip || req.connection.remoteAddress;
  
  // Determine language preference
  const acceptLanguage = req.headers['accept-language'] as string;
  const language: 'vi' | 'en' = acceptLanguage?.includes('vi') ? 'vi' : 'en';
  
  // Extract authentication token
  let token: string | undefined;
  let user: AuthenticatedUser | undefined;
  
  try {
    // Get token from Authorization header or connection params (for subscriptions)
    const authHeader = req.headers.authorization || connectionParams?.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      user = await authenticateUser(token);
    }
  } catch (error) {
    logger.warn('Authentication failed:', { error: (error as Error).message, requestId });
    // Don't throw error here - let resolvers handle unauthorized access
  }
  
  // Create REST API service
  const restApi = new RestApiService({
    baseURL: process.env.API_GATEWAY_URL || 'http://localhost:3100',
    token,
    requestId,
    language
  });
  
  // Create DataLoaders for N+1 optimization
  const dataloaders = createDataLoaders(restApi);
  
  // Create context object
  const context: GraphQLContext = {
    req,
    res,
    user,
    token,
    restApi,
    dataloaders,
    requestId,
    userAgent,
    ipAddress,
    language
  };

  // Add Vietnamese i18n support
  const contextWithI18n = addVietnameseContext(context);

  logger.debug('GraphQL context created:', {
    requestId,
    userId: user?.id,
    role: user?.role,
    language,
    hasToken: !!token
  });

  return contextWithI18n;
}

/**
 * Authenticate user from JWT token
 */
async function authenticateUser(token: string): Promise<AuthenticatedUser> {
  try {
    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }
    
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // Extract user information from token
    const user: AuthenticatedUser = {
      id: decoded.sub || decoded.userId,
      profileId: decoded.profileId,
      email: decoded.email,
      role: decoded.role as UserRole,
      permissions: decoded.permissions || [],
      doctorId: decoded.doctorId,
      patientId: decoded.patientId,
      fullName: decoded.fullName || decoded.name,
      isActive: decoded.isActive !== false,
      lastLoginAt: decoded.lastLoginAt ? new Date(decoded.lastLoginAt) : undefined,
      sessionId: decoded.sessionId,
      tokenIssuedAt: new Date(decoded.iat * 1000),
      tokenExpiresAt: new Date(decoded.exp * 1000)
    };
    
    // Validate token expiration
    if (user.tokenExpiresAt < new Date()) {
      throw new Error('Token expired');
    }
    
    // Validate user is active
    if (!user.isActive) {
      throw new Error('User account is inactive');
    }
    
    return user;
  } catch (error) {
    logger.error('Token authentication failed:', error);
    throw new Error('Invalid or expired token');
  }
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `gql-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if user has required role
 */
export function hasRole(user: AuthenticatedUser | undefined, requiredRoles: UserRole[]): boolean {
  if (!user) return false;
  return requiredRoles.includes(user.role);
}

/**
 * Check if user has required permission
 */
export function hasPermission(user: AuthenticatedUser | undefined, requiredPermission: string): boolean {
  if (!user) return false;
  return user.permissions.includes(requiredPermission) || user.role === UserRole.ADMIN;
}

/**
 * Get user's entity ID based on role
 */
export function getUserEntityId(user: AuthenticatedUser): string | undefined {
  switch (user.role) {
    case UserRole.DOCTOR:
      return user.doctorId;
    case UserRole.PATIENT:
      return user.patientId;
    default:
      return user.id;
  }
}

/**
 * Context utilities for resolvers
 */
export const contextUtils = {
  /**
   * Require authentication
   */
  requireAuth(context: GraphQLContext): AuthenticatedUser {
    if (!context.user) {
      throw new Error('Yêu cầu xác thực');
    }
    return context.user;
  },
  
  /**
   * Require specific role
   */
  requireRole(context: GraphQLContext, roles: UserRole[]): AuthenticatedUser {
    const user = this.requireAuth(context);
    if (!hasRole(user, roles)) {
      throw new Error('Không có quyền truy cập');
    }
    return user;
  },
  
  /**
   * Require specific permission
   */
  requirePermission(context: GraphQLContext, permission: string): AuthenticatedUser {
    const user = this.requireAuth(context);
    if (!hasPermission(user, permission)) {
      throw new Error('Không có quyền thực hiện hành động này');
    }
    return user;
  },
  
  /**
   * Check if user can access entity
   */
  canAccessEntity(context: GraphQLContext, entityUserId: string): boolean {
    if (!context.user) return false;
    
    // Admin can access everything
    if (context.user.role === UserRole.ADMIN) return true;
    
    // Users can access their own data
    if (context.user.id === entityUserId) return true;
    
    // Doctors can access their patients' data (implement business logic)
    if (context.user.role === UserRole.DOCTOR) {
      // TODO: Check if patient is assigned to this doctor
      return true;
    }
    
    return false;
  },
  
  /**
   * Get Vietnamese error message
   */
  getVietnameseError(englishMessage: string): string {
    const translations: Record<string, string> = {
      'Authentication required': 'Yêu cầu xác thực',
      'Access denied': 'Không có quyền truy cập',
      'Not found': 'Không tìm thấy',
      'Invalid input': 'Dữ liệu không hợp lệ',
      'Internal error': 'Lỗi hệ thống'
    };
    
    return translations[englishMessage] || englishMessage;
  }
};

export default createContext;
