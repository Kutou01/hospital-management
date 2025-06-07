import { createClient, SupabaseClient } from '@supabase/supabase-js';
import logger from '@hospital/shared/dist/utils/logger';

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
        service: 'patient-service',
        url: supabaseUrl
      });
    } catch (error) {
      logger.error('Failed to initialize Supabase client', { error });
      throw error;
    }
  }

  return supabaseClient;
}

export default getSupabase;
