import { UserRepository } from './user.repository';
import { SupabaseUserRepository } from './supabase-user.repository';
import { isSupabaseAvailable } from '../config/database.config';
// import logger from '@hospital/shared/src/utils/logger';

// Simple logger for now
const logger = {
  info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta || ''),
  error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta || ''),
  warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta || ''),
};

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

export class UserRepositoryFactory {
  private static instance: IUserRepository | null = null;

  static getInstance(): IUserRepository {
    if (!this.instance) {
      // Check if Supabase credentials are available in environment
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && supabaseServiceKey) {
        logger.info('Using Supabase User Repository');
        this.instance = new SupabaseUserRepository();
      } else {
        logger.info('Using PostgreSQL User Repository');
        this.instance = new UserRepository();
      }
    }
    return this.instance!;
  }

  static reset(): void {
    this.instance = null;
  }
}
