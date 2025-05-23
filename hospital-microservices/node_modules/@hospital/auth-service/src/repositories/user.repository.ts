import { Pool } from 'pg';
import { User } from '@hospital/shared/src/types/user.types';
import { getDatabase } from '../config/database.config';
import logger from '@hospital/shared/src/utils/logger';

export class UserRepository {
  private db: Pool;

  constructor() {
    this.db = getDatabase();
  }

  async findById(id: string): Promise<User | null> {
    try {
      const query = 'SELECT * FROM users WHERE id = $1';
      const result = await this.db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by ID', { error, id });
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await this.db.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by email', { error, email });
      throw error;
    }
  }

  async create(userData: Omit<User, 'last_login' | 'profile_id'>): Promise<User> {
    try {
      const query = `
        INSERT INTO users (
          id, email, password_hash, role, full_name, phone_number, 
          is_active, email_verified, phone_verified, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      
      const values = [
        userData.id,
        userData.email,
        userData.password_hash,
        userData.role,
        userData.full_name,
        userData.phone_number,
        userData.is_active,
        userData.email_verified,
        userData.phone_verified,
        userData.created_at,
        userData.updated_at
      ];

      const result = await this.db.query(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating user', { error, userData: { ...userData, password_hash: '[REDACTED]' } });
      throw error;
    }
  }

  async update(id: string, userData: Partial<User>): Promise<User | null> {
    try {
      const fields = Object.keys(userData).filter(key => key !== 'id');
      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
      const values = [id, ...fields.map(field => userData[field as keyof User])];

      const query = `
        UPDATE users 
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating user', { error, id, userData });
      throw error;
    }
  }

  async updateLastLogin(id: string): Promise<void> {
    try {
      const query = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1';
      await this.db.query(query, [id]);
    } catch (error) {
      logger.error('Error updating last login', { error, id });
      throw error;
    }
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    try {
      const query = 'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
      await this.db.query(query, [passwordHash, id]);
    } catch (error) {
      logger.error('Error updating password', { error, id });
      throw error;
    }
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<User[]> {
    try {
      const query = 'SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2';
      const result = await this.db.query(query, [limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding all users', { error, limit, offset });
      throw error;
    }
  }

  async findByRole(role: string, limit: number = 50, offset: number = 0): Promise<User[]> {
    try {
      const query = 'SELECT * FROM users WHERE role = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
      const result = await this.db.query(query, [role, limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding users by role', { error, role, limit, offset });
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const query = 'DELETE FROM users WHERE id = $1';
      const result = await this.db.query(query, [id]);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error deleting user', { error, id });
      throw error;
    }
  }

  async deactivate(id: string): Promise<void> {
    try {
      const query = 'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1';
      await this.db.query(query, [id]);
    } catch (error) {
      logger.error('Error deactivating user', { error, id });
      throw error;
    }
  }

  async activate(id: string): Promise<void> {
    try {
      const query = 'UPDATE users SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1';
      await this.db.query(query, [id]);
    } catch (error) {
      logger.error('Error activating user', { error, id });
      throw error;
    }
  }

  async count(): Promise<number> {
    try {
      const query = 'SELECT COUNT(*) as count FROM users';
      const result = await this.db.query(query);
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Error counting users', { error });
      throw error;
    }
  }

  async countByRole(role: string): Promise<number> {
    try {
      const query = 'SELECT COUNT(*) as count FROM users WHERE role = $1';
      const result = await this.db.query(query, [role]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Error counting users by role', { error, role });
      throw error;
    }
  }
}
