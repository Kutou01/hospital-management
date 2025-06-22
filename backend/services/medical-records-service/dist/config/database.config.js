"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseAdmin = void 0;
exports.getSupabase = getSupabase;
exports.testDatabaseConnection = testDatabaseConnection;
const supabase_js_1 = require("@supabase/supabase-js");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
// Environment variables validation
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl) {
    throw new Error('SUPABASE_URL environment variable is required');
}
if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
}
logger_1.default.info('🔧 Supabase configuration loaded', {
    service: 'medical-records-service',
    url: supabaseUrl,
    hasServiceKey: !!supabaseServiceKey
});
// Service role client (for admin operations) - unified with auth-service pattern
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
            'X-Client-Info': `medical-records-service-${Date.now()}`
        }
    }
});
// Legacy function for backward compatibility
function getSupabase() {
    return exports.supabaseAdmin;
}
// Test database connection
async function testDatabaseConnection() {
    try {
        const { data, error } = await exports.supabaseAdmin
            .from('medical_records')
            .select('count(*)', { count: 'exact', head: true });
        if (error) {
            logger_1.default.error('Database connection test failed', { error });
            return false;
        }
        logger_1.default.info('Database connection test successful', {
            service: 'medical-records-service'
        });
        return true;
    }
    catch (error) {
        logger_1.default.error('Database connection test exception', { error });
        return false;
    }
}
//# sourceMappingURL=database.config.js.map