import { SupabaseClient } from '@supabase/supabase-js';
import { User } from '@hospital/shared/src/types/user.types';
import { getSupabase } from '../config/database.config';
import logger from '@hospital/shared/src/utils/logger';

export class SupabaseUserRepository {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = getSupabase();
  }

  async findById(id: string): Promise<User | null> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('user_id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return this.mapSupabaseUserToUser(data);
    } catch (error) {
      logger.error('Error finding user by ID', { error, id });
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return this.mapSupabaseUserToUser(data);
    } catch (error) {
      logger.error('Error finding user by email', { error, email });
      throw error;
    }
  }

  async create(userData: Omit<User, 'last_login' | 'profile_id'>): Promise<User> {
    try {
      const supabaseUser = this.mapUserToSupabaseUser(userData);
      
      const { data, error } = await this.supabase
        .from('users')
        .insert([supabaseUser])
        .select()
        .single();

      if (error) throw error;

      return this.mapSupabaseUserToUser(data);
    } catch (error) {
      logger.error('Error creating user', { error, userData: { ...userData, password_hash: '[REDACTED]' } });
      throw error;
    }
  }

  async update(id: string, userData: Partial<User>): Promise<User | null> {
    try {
      const supabaseUpdate = this.mapUserToSupabaseUser(userData);
      
      const { data, error } = await this.supabase
        .from('users')
        .update(supabaseUpdate)
        .eq('user_id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return this.mapSupabaseUserToUser(data);
    } catch (error) {
      logger.error('Error updating user', { error, id, userData });
      throw error;
    }
  }

  async updateLastLogin(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('user_id', id);

      if (error) throw error;
    } catch (error) {
      logger.error('Error updating last login', { error, id });
      throw error;
    }
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('users')
        .update({ password_hash: passwordHash })
        .eq('user_id', id);

      if (error) throw error;
    } catch (error) {
      logger.error('Error updating password', { error, id });
      throw error;
    }
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<User[]> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return data.map(user => this.mapSupabaseUserToUser(user));
    } catch (error) {
      logger.error('Error finding all users', { error, limit, offset });
      throw error;
    }
  }

  async findByRole(role: string, limit: number = 50, offset: number = 0): Promise<User[]> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('role', role)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return data.map(user => this.mapSupabaseUserToUser(user));
    } catch (error) {
      logger.error('Error finding users by role', { error, role, limit, offset });
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('users')
        .delete()
        .eq('user_id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Error deleting user', { error, id });
      throw error;
    }
  }

  async deactivate(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('users')
        .update({ is_active: false })
        .eq('user_id', id);

      if (error) throw error;
    } catch (error) {
      logger.error('Error deactivating user', { error, id });
      throw error;
    }
  }

  async activate(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('users')
        .update({ is_active: true })
        .eq('user_id', id);

      if (error) throw error;
    } catch (error) {
      logger.error('Error activating user', { error, id });
      throw error;
    }
  }

  async count(): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    } catch (error) {
      logger.error('Error counting users', { error });
      throw error;
    }
  }

  async countByRole(role: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', role);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      logger.error('Error counting users by role', { error, role });
      throw error;
    }
  }

  // Helper methods to map between Supabase and internal User types
  private mapSupabaseUserToUser(supabaseUser: any): User {
    return {
      id: supabaseUser.user_id,
      email: supabaseUser.email,
      password_hash: supabaseUser.password_hash,
      role: supabaseUser.role,
      full_name: supabaseUser.full_name,
      phone_number: supabaseUser.phone_number,
      is_active: supabaseUser.is_active,
      email_verified: supabaseUser.email_verified || false,
      phone_verified: supabaseUser.phone_verified || false,
      created_at: new Date(supabaseUser.created_at),
      updated_at: new Date(supabaseUser.updated_at),
      last_login: supabaseUser.last_login ? new Date(supabaseUser.last_login) : undefined,
      profile_id: supabaseUser.profile_id
    };
  }

  private mapUserToSupabaseUser(user: Partial<User>): any {
    const supabaseUser: any = {};
    
    if (user.id) supabaseUser.user_id = user.id;
    if (user.email) supabaseUser.email = user.email;
    if (user.password_hash) supabaseUser.password_hash = user.password_hash;
    if (user.role) supabaseUser.role = user.role;
    if (user.full_name) supabaseUser.full_name = user.full_name;
    if (user.phone_number !== undefined) supabaseUser.phone_number = user.phone_number;
    if (user.is_active !== undefined) supabaseUser.is_active = user.is_active;
    if (user.email_verified !== undefined) supabaseUser.email_verified = user.email_verified;
    if (user.phone_verified !== undefined) supabaseUser.phone_verified = user.phone_verified;
    if (user.created_at) supabaseUser.created_at = user.created_at.toISOString();
    if (user.updated_at) supabaseUser.updated_at = user.updated_at.toISOString();
    if (user.last_login) supabaseUser.last_login = user.last_login.toISOString();
    if (user.profile_id) supabaseUser.profile_id = user.profile_id;

    return supabaseUser;
  }
}
