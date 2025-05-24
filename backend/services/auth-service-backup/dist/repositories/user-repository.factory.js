"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepositoryFactory = void 0;
const user_repository_1 = require("./user.repository");
const supabase_user_repository_1 = require("./supabase-user.repository");
// import logger from '@hospital/shared/src/utils/logger';
// Simple logger for now
const logger = {
    info: (message, meta) => console.log(`[INFO] ${message}`, meta || ''),
    error: (message, meta) => console.error(`[ERROR] ${message}`, meta || ''),
    warn: (message, meta) => console.warn(`[WARN] ${message}`, meta || ''),
};
class UserRepositoryFactory {
    static getInstance() {
        if (!this.instance) {
            // Check if Supabase credentials are available in environment
            const supabaseUrl = process.env.SUPABASE_URL;
            const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            if (supabaseUrl && supabaseServiceKey) {
                logger.info('Using Supabase User Repository');
                this.instance = new supabase_user_repository_1.SupabaseUserRepository();
            }
            else {
                logger.info('Using PostgreSQL User Repository');
                this.instance = new user_repository_1.UserRepository();
            }
        }
        return this.instance;
    }
    static reset() {
        this.instance = null;
    }
}
exports.UserRepositoryFactory = UserRepositoryFactory;
UserRepositoryFactory.instance = null;
