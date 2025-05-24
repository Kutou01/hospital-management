import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
// import logger from '@hospital/shared/src/utils/logger';

// Simple logger for debugging
const logger = {
  info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta || ''),
  error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta || ''),
  warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta || ''),
};

let pool: Pool;
let supabase: SupabaseClient;

export const connectDatabase = async (): Promise<void> => {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      // Test Supabase connection
      const { data, error } = await supabase.from('users').select('count').limit(1);
      if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist, which is ok
        logger.warn('Supabase connection test failed, falling back to PostgreSQL', { error: error.message });
      } else {
        logger.info('Supabase connected successfully', {
          url: supabaseUrl,
          project: supabaseUrl.split('//')[1]?.split('.')[0]
        });
        return; // Use Supabase if available
      }
    }

    // Fallback to direct PostgreSQL connection
    pool = new Pool({
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
  } catch (error) {
    logger.error('Database connection failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

export const getDatabase = (): Pool => {
  if (!pool) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return pool;
};

export const getSupabase = (): SupabaseClient => {
  if (!supabase) {
    throw new Error('Supabase not connected. Call connectDatabase() first.');
  }
  return supabase;
};

export { supabase };

export const isSupabaseAvailable = (): boolean => {
  return !!supabase;
};

export const disconnectDatabase = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    logger.info('Database disconnected');
  }
};
