"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupabase = getSupabase;
const supabase_js_1 = require("@supabase/supabase-js");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
let supabaseClient = null;
function getSupabase() {
    if (!supabaseClient) {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !supabaseServiceKey) {
            const error = 'Missing Supabase configuration. Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.';
            logger_1.default.error(error);
            throw new Error(error);
        }
        try {
            supabaseClient = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            });
            logger_1.default.info('Supabase client initialized successfully', {
                service: 'appointment-service',
                url: supabaseUrl
            });
        }
        catch (error) {
            logger_1.default.error('Failed to initialize Supabase client', { error });
            throw error;
        }
    }
    return supabaseClient;
}
exports.default = getSupabase;
//# sourceMappingURL=database.config.js.map