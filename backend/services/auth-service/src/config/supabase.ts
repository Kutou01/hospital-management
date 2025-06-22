import { createClient, SupabaseClient } from '@supabase/supabase-js';
import logger from '@hospital/shared/dist/utils/logger';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl) {
  throw new Error('SUPABASE_URL environment variable is required');
}

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
}

if (!supabaseAnonKey) {
  throw new Error('SUPABASE_ANON_KEY environment variable is required');
}

logger.info('🔧 Supabase configuration loaded', {
  url: supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  hasAnonKey: !!supabaseAnonKey
});

// Service role client (for admin operations)
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
        'X-Client-Info': `auth-service-${Date.now()}` // Force new client
      }
    }
  }
);

// Fresh client for schema-sensitive operations
export const supabaseFresh: SupabaseClient = createClient(
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
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Client-Info': `fresh-client-${Date.now()}`
      }
    }
  }
);

// Anonymous client (for public operations)
export const supabaseClient: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    },
    db: {
      schema: 'public'
    }
  }
);

// Test connection and validate setup
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    logger.info('🔍 Testing Supabase connection...');

    // Test admin client connection
    const { data: adminTest, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('count')
      .limit(1);

    if (adminError) {
      logger.error('❌ Supabase admin client connection failed:', {
        error: adminError.message,
        code: adminError.code,
        details: adminError.details
      });
      return false;
    }

    // Test anonymous client connection
    const { data: anonTest, error: anonError } = await supabaseClient
      .from('profiles')
      .select('count')
      .limit(1);

    if (anonError) {
      logger.error('❌ Supabase anonymous client connection failed:', {
        error: anonError.message,
        code: anonError.code,
        details: anonError.details
      });
      return false;
    }

    // Test auth functionality
    const { data: authTest, error: authTestError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1
    });

    if (authTestError) {
      logger.error('❌ Supabase auth test failed:', {
        error: authTestError.message,
        code: authTestError.code
      });
      return false;
    }

    logger.info('✅ Supabase connection and auth test successful', {
      profilesAccessible: true,
      authFunctional: true,
      userCount: authTest.users?.length || 0
    });

    return true;
  } catch (error: any) {
    logger.error('❌ Supabase connection test error:', {
      error: error.message,
      stack: error.stack
    });
    return false;
  }
};

// Initialize and test connection on startup
export const initializeSupabase = async (): Promise<void> => {
  logger.info('🚀 Initializing Supabase connection...');

  const isConnected = await testSupabaseConnection();

  if (!isConnected) {
    logger.error('❌ Failed to connect to Supabase. Please check your configuration.');
    process.exit(1);
  }

  logger.info('✅ Supabase initialized successfully');
};

export default {
  admin: supabaseAdmin,
  client: supabaseClient,
  testConnection: testSupabaseConnection
};
