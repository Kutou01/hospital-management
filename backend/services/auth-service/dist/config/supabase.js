"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSupabase = exports.testSupabaseConnection = exports.supabaseClient = exports.supabaseFresh = exports.supabaseAdmin = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl) {
    throw new Error('SUPABASE_URL environment variable is required');
}
if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
}
if (!supabaseAnonKey) {
    throw new Error('SUPABASE_ANON_KEY environment variable is required');
}
logger_1.default.info('🔧 Supabase configuration loaded', {
    url: supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
    hasAnonKey: !!supabaseAnonKey
});
exports.supabaseAdmin = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
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
            'X-Client-Info': `auth-service-${Date.now()}`
        }
    }
});
exports.supabaseFresh = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
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
});
exports.supabaseClient = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true
    },
    db: {
        schema: 'public'
    }
});
const testSupabaseConnection = async () => {
    try {
        logger_1.default.info('🔍 Testing Supabase connection...');
        const { data: adminTest, error: adminError } = await exports.supabaseAdmin
            .from('profiles')
            .select('count')
            .limit(1);
        if (adminError) {
            logger_1.default.error('❌ Supabase admin client connection failed:', {
                error: adminError.message,
                code: adminError.code,
                details: adminError.details
            });
            return false;
        }
        const { data: anonTest, error: anonError } = await exports.supabaseClient
            .from('profiles')
            .select('count')
            .limit(1);
        if (anonError) {
            logger_1.default.error('❌ Supabase anonymous client connection failed:', {
                error: anonError.message,
                code: anonError.code,
                details: anonError.details
            });
            return false;
        }
        const { data: authTest, error: authTestError } = await exports.supabaseAdmin.auth.admin.listUsers({
            page: 1,
            perPage: 1
        });
        if (authTestError) {
            logger_1.default.error('❌ Supabase auth test failed:', {
                error: authTestError.message,
                code: authTestError.code
            });
            return false;
        }
        logger_1.default.info('✅ Supabase connection and auth test successful', {
            profilesAccessible: true,
            authFunctional: true,
            userCount: authTest.users?.length || 0
        });
        return true;
    }
    catch (error) {
        logger_1.default.error('❌ Supabase connection test error:', {
            error: error.message,
            stack: error.stack
        });
        return false;
    }
};
exports.testSupabaseConnection = testSupabaseConnection;
const initializeSupabase = async () => {
    logger_1.default.info('🚀 Initializing Supabase connection...');
    const isConnected = await (0, exports.testSupabaseConnection)();
    if (!isConnected) {
        logger_1.default.error('❌ Failed to connect to Supabase. Please check your configuration.');
        process.exit(1);
    }
    logger_1.default.info('✅ Supabase initialized successfully');
};
exports.initializeSupabase = initializeSupabase;
exports.default = {
    admin: exports.supabaseAdmin,
    client: exports.supabaseClient,
    testConnection: exports.testSupabaseConnection
};
//# sourceMappingURL=supabase.js.map