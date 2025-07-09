import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import logger from '@hospital/shared/dist/utils/logger';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL environment variable is required');
}

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
}

logger.info('🔧 Supabase configuration loaded', {
  service: 'graphql-gateway',
  url: supabaseUrl,
  hasServiceKey: !!supabaseServiceKey
});

// Service role client (for admin operations) - unified with other services pattern
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
        'X-Client-Info': `graphql-gateway-${Date.now()}`
      }
    }
  }
);

// Legacy function for backward compatibility
export function getSupabase(): SupabaseClient {
  return supabaseAdmin;
}

export default getSupabase;
