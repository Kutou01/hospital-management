"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionRepository = void 0;
const database_config_1 = require("../config/database.config");
const logger_1 = __importDefault(require("@hospital/shared/src/utils/logger"));
class SessionRepository {
    constructor() {
        this.supabase = null;
        if ((0, database_config_1.isSupabaseAvailable)()) {
            this.supabase = (0, database_config_1.getSupabase)();
        }
    }
    async create(sessionData) {
        try {
            if (!this.supabase) {
                // For now, just return the session data without persisting
                // In a real implementation, you'd use PostgreSQL or Redis
                logger_1.default.warn('Session storage not available, returning session without persistence');
                return sessionData;
            }
            // Create sessions table if it doesn't exist
            const { data, error } = await this.supabase
                .from('sessions')
                .insert([{
                    id: sessionData.id,
                    user_id: sessionData.user_id,
                    token: sessionData.token,
                    refresh_token: sessionData.refresh_token,
                    expires_at: sessionData.expires_at.toISOString(),
                    ip_address: sessionData.ip_address,
                    user_agent: sessionData.user_agent,
                    device_info: sessionData.device_info,
                    is_active: sessionData.is_active,
                    created_at: sessionData.created_at.toISOString(),
                    updated_at: sessionData.updated_at.toISOString()
                }])
                .select()
                .single();
            if (error) {
                logger_1.default.warn('Could not persist session to database', { error: error.message });
                return sessionData; // Return without persistence
            }
            return this.mapSupabaseSessionToSession(data);
        }
        catch (error) {
            logger_1.default.error('Error creating session', { error });
            return sessionData; // Return without persistence
        }
    }
    async findByToken(token) {
        try {
            if (!this.supabase) {
                return null;
            }
            const { data, error } = await this.supabase
                .from('sessions')
                .select('*')
                .eq('token', token)
                .eq('is_active', true)
                .single();
            if (error) {
                if (error.code === 'PGRST116')
                    return null;
                throw error;
            }
            return this.mapSupabaseSessionToSession(data);
        }
        catch (error) {
            logger_1.default.error('Error finding session by token', { error });
            return null;
        }
    }
    async findByRefreshToken(refreshToken) {
        try {
            if (!this.supabase) {
                return null;
            }
            const { data, error } = await this.supabase
                .from('sessions')
                .select('*')
                .eq('refresh_token', refreshToken)
                .eq('is_active', true)
                .single();
            if (error) {
                if (error.code === 'PGRST116')
                    return null;
                throw error;
            }
            return this.mapSupabaseSessionToSession(data);
        }
        catch (error) {
            logger_1.default.error('Error finding session by refresh token', { error });
            return null;
        }
    }
    async update(sessionId, sessionData) {
        try {
            if (!this.supabase) {
                return null;
            }
            const updateData = {};
            if (sessionData.token)
                updateData.token = sessionData.token;
            if (sessionData.refresh_token)
                updateData.refresh_token = sessionData.refresh_token;
            if (sessionData.expires_at)
                updateData.expires_at = sessionData.expires_at.toISOString();
            if (sessionData.is_active !== undefined)
                updateData.is_active = sessionData.is_active;
            if (sessionData.updated_at)
                updateData.updated_at = sessionData.updated_at.toISOString();
            const { data, error } = await this.supabase
                .from('sessions')
                .update(updateData)
                .eq('id', sessionId)
                .select()
                .single();
            if (error) {
                if (error.code === 'PGRST116')
                    return null;
                throw error;
            }
            return this.mapSupabaseSessionToSession(data);
        }
        catch (error) {
            logger_1.default.error('Error updating session', { error, sessionId });
            return null;
        }
    }
    async deactivateAllUserSessions(userId) {
        try {
            if (!this.supabase) {
                return;
            }
            const { error } = await this.supabase
                .from('sessions')
                .update({ is_active: false, updated_at: new Date().toISOString() })
                .eq('user_id', userId);
            if (error) {
                logger_1.default.warn('Could not deactivate user sessions', { error: error.message, userId });
            }
        }
        catch (error) {
            logger_1.default.error('Error deactivating user sessions', { error, userId });
        }
    }
    async deleteExpiredSessions() {
        try {
            if (!this.supabase) {
                return;
            }
            const { error } = await this.supabase
                .from('sessions')
                .delete()
                .lt('expires_at', new Date().toISOString());
            if (error) {
                logger_1.default.warn('Could not delete expired sessions', { error: error.message });
            }
        }
        catch (error) {
            logger_1.default.error('Error deleting expired sessions', { error });
        }
    }
    mapSupabaseSessionToSession(supabaseSession) {
        return {
            id: supabaseSession.id,
            user_id: supabaseSession.user_id,
            token: supabaseSession.token,
            refresh_token: supabaseSession.refresh_token,
            expires_at: new Date(supabaseSession.expires_at),
            ip_address: supabaseSession.ip_address,
            user_agent: supabaseSession.user_agent,
            device_info: supabaseSession.device_info,
            is_active: supabaseSession.is_active,
            created_at: new Date(supabaseSession.created_at),
            updated_at: new Date(supabaseSession.updated_at)
        };
    }
}
exports.SessionRepository = SessionRepository;
