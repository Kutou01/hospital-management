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
  service: 'doctor-service',
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
        'X-Client-Info': `doctor-service-${Date.now()}`
      }
    }
  }
);

// Legacy function for backward compatibility
export function getSupabase(): SupabaseClient {
  return supabaseAdmin;
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
