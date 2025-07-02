"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseAdmin = void 0;
exports.getSupabase = getSupabase;
const supabase_js_1 = require("@supabase/supabase-js");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl) {
    throw new Error('SUPABASE_URL environment variable is required');
}
if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
}
logger_1.default.info('🔧 Supabase configuration loaded', {
    service: 'patient-service',
    url: supabaseUrl,
    hasServiceKey: !!supabaseServiceKey
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
            'X-Client-Info': `patient-service-${Date.now()}`
        }
    }
});
function getSupabase() {
    return exports.supabaseAdmin;
}
exports.default = getSupabase;
//# sourceMappingURL=database.config.js.map