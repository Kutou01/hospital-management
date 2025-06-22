import { createClient, SupabaseClient } from '@supabase/supabase-js';
import logger from '@hospital/shared/dist/utils/logger';

// Environment variables validation
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL environment variable is required');
}
if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
}

logger.info('🔧 Supabase configuration loaded', {
  service: 'medical-records-service',
  url: supabaseUrl,
  hasServiceKey: !!supabaseServiceKey
});

// Service role client (for admin operations) - unified with auth-service pattern
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'X-Client-Info': `medical-records-service-${Date.now()}`
      }
    }
  }
);

// Legacy function for backward compatibility
export function getSupabase(): SupabaseClient {
  return supabaseAdmin;
}

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('medical_records')
      .select('count(*)', { count: 'exact', head: true });

    if (error) {
      logger.error('Database connection test failed', { error });
      return false;
    }

    logger.info('Database connection test successful', {
      service: 'medical-records-service'
    });
    return true;
  } catch (error) {
    logger.error('Database connection test exception', { error });
    return false;
  }
}
