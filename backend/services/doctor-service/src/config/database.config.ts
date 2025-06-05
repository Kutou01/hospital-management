import { createClient, SupabaseClient } from '@supabase/supabase-js';
import logger from '@hospital/shared/src/utils/logger';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      const error = 'Missing Supabase configuration. Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.';
      logger.error(error);
      throw new Error(error);
    }

    try {
      supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      logger.info('Supabase client initialized successfully', {
        service: 'doctor-service',
        url: supabaseUrl
      });
    } catch (error) {
      logger.error('Failed to initialize Supabase client', { error });
      throw error;
    }
  }

  return supabaseClient;
}

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('doctors')
      .select('count(*)')
      .limit(1);

    if (error) {
      logger.error('Database connection test failed', { error });
      return false;
    }

    logger.info('Database connection test successful', {
      service: 'doctor-service'
    });
    return true;
  } catch (error) {
    logger.error('Database connection test failed', { error });
    return false;
  }
}
