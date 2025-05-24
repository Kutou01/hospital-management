"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const database_config_1 = require("../config/database.config");
// import logger from '@hospital/shared/src/utils/logger';
// Simple logger for now
const logger = {
    info: (message, meta) => console.log(`[INFO] ${message}`, meta || ''),
    error: (message, meta) => console.error(`[ERROR] ${message}`, meta || ''),
    warn: (message, meta) => console.warn(`[WARN] ${message}`, meta || ''),
};
class UserRepository {
    constructor() {
        this.db = (0, database_config_1.getDatabase)();
    }
    async findById(id) {
        try {
            const query = 'SELECT * FROM users WHERE id = $1';
            const result = await this.db.query(query, [id]);
            return result.rows[0] || null;
        }
        catch (error) {
            logger.error('Error finding user by ID', { error, id });
            throw error;
        }
    }
    async findByEmail(email) {
        try {
            const query = 'SELECT * FROM users WHERE email = $1';
            const result = await this.db.query(query, [email]);
            return result.rows[0] || null;
        }
        catch (error) {
            logger.error('Error finding user by email', { error, email });
            throw error;
        }
    }
    async create(userData) {
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
        }
        catch (error) {
            logger.error('Error creating user', { error, userData: { ...userData, password_hash: '[REDACTED]' } });
            throw error;
        }
    }
    async update(id, userData) {
        try {
            const fields = Object.keys(userData).filter(key => key !== 'id');
            const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
            const values = [id, ...fields.map(field => userData[field])];
            const query = `
        UPDATE users
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
            const result = await this.db.query(query, values);
            return result.rows[0] || null;
        }
        catch (error) {
            logger.error('Error updating user', { error, id, userData });
            throw error;
        }
    }
    async updateLastLogin(id) {
        try {
            const query = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1';
            await this.db.query(query, [id]);
        }
        catch (error) {
            logger.error('Error updating last login', { error, id });
            throw error;
        }
    }
    async updatePassword(id, passwordHash) {
        try {
            const query = 'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
            await this.db.query(query, [passwordHash, id]);
        }
        catch (error) {
            logger.error('Error updating password', { error, id });
            throw error;
        }
    }
    async findAll(limit = 50, offset = 0) {
        try {
            const query = 'SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2';
            const result = await this.db.query(query, [limit, offset]);
            return result.rows;
        }
        catch (error) {
            logger.error('Error finding all users', { error, limit, offset });
            throw error;
        }
    }
    async findByRole(role, limit = 50, offset = 0) {
        try {
            const query = 'SELECT * FROM users WHERE role = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
            const result = await this.db.query(query, [role, limit, offset]);
            return result.rows;
        }
        catch (error) {
            logger.error('Error finding users by role', { error, role, limit, offset });
            throw error;
        }
    }
    async delete(id) {
        try {
            const query = 'DELETE FROM users WHERE id = $1';
            const result = await this.db.query(query, [id]);
            return (result.rowCount || 0) > 0;
        }
        catch (error) {
            logger.error('Error deleting user', { error, id });
            throw error;
        }
    }
    async deactivate(id) {
        try {
            const query = 'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1';
            await this.db.query(query, [id]);
        }
        catch (error) {
            logger.error('Error deactivating user', { error, id });
            throw error;
        }
    }
    async activate(id) {
        try {
            const query = 'UPDATE users SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1';
            await this.db.query(query, [id]);
        }
        catch (error) {
            logger.error('Error activating user', { error, id });
            throw error;
        }
    }
    async count() {
        try {
            const query = 'SELECT COUNT(*) as count FROM users';
            const result = await this.db.query(query);
            return parseInt(result.rows[0].count);
        }
        catch (error) {
            logger.error('Error counting users', { error });
            throw error;
        }
    }
    async countByRole(role) {
        try {
            const query = 'SELECT COUNT(*) as count FROM users WHERE role = $1';
            const result = await this.db.query(query, [role]);
            return parseInt(result.rows[0].count);
        }
        catch (error) {
            logger.error('Error counting users by role', { error, role });
            throw error;
        }
    }
    async findByProfileId(profileId) {
        try {
            const query = 'SELECT * FROM users WHERE profile_id = $1';
            const result = await this.db.query(query, [profileId]);
            if (result.rows.length === 0) {
                return null;
            }
            return result.rows[0];
        }
        catch (error) {
            logger.error('Error finding user by profile ID', { error, profileId });
            throw error;
        }
    }
}
exports.UserRepository = UserRepository;
