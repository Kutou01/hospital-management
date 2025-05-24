"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDatabase = exports.isSupabaseAvailable = exports.supabase = exports.getSupabase = exports.getDatabase = exports.connectDatabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const pg_1 = require("pg");
// import logger from '@hospital/shared/src/utils/logger';
// Simple logger for debugging
const logger = {
    info: (message, meta) => console.log(`[INFO] ${message}`, meta || ''),
    error: (message, meta) => console.error(`[ERROR] ${message}`, meta || ''),
    warn: (message, meta) => console.warn(`[WARN] ${message}`, meta || ''),
};
let pool;
let supabase;
const connectDatabase = async () => {
    try {
        // Initialize Supabase client
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (supabaseUrl && supabaseServiceKey) {
            exports.supabase = supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            });
            // Test Supabase connection
            const { data, error } = await supabase.from('users').select('count').limit(1);
            if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist, which is ok
                logger.warn('Supabase connection test failed, falling back to PostgreSQL', { error: error.message });
            }
            else {
                logger.info('Supabase connected successfully', {
                    url: supabaseUrl,
                    project: supabaseUrl.split('//')[1]?.split('.')[0]
                });
                return; // Use Supabase if available
            }
        }
        // Fallback to direct PostgreSQL connection
        pool = new pg_1.Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
        // Test the connection
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        logger.info('PostgreSQL connected successfully', {
            database: pool.options.database,
            host: pool.options.host,
            port: pool.options.port,
        });
    }
    catch (error) {
        logger.error('Database connection failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
    }
};
exports.connectDatabase = connectDatabase;
const getDatabase = () => {
    if (!pool) {
        throw new Error('Database not connected. Call connectDatabase() first.');
    }
    return pool;
};
exports.getDatabase = getDatabase;
const getSupabase = () => {
    if (!supabase) {
        throw new Error('Supabase not connected. Call connectDatabase() first.');
    }
    return supabase;
};
exports.getSupabase = getSupabase;
const isSupabaseAvailable = () => {
    return !!supabase;
};
exports.isSupabaseAvailable = isSupabaseAvailable;
const disconnectDatabase = async () => {
    if (pool) {
        await pool.end();
        logger.info('Database disconnected');
    }
};
exports.disconnectDatabase = disconnectDatabase;
