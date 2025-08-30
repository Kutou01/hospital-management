"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbPool = exports.supabase = exports.supabaseAdmin = exports.connectionPool = void 0;
exports.getSupabase = getSupabase;
exports.testDatabaseConnection = testDatabaseConnection;
const connection_pool_1 = require("@hospital/shared/dist/database/connection-pool");
Object.defineProperty(exports, "connectionPool", { enumerable: true, get: function () { return connection_pool_1.connectionPool; } });
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl) {
    throw new Error("SUPABASE_URL environment variable is required");
}
if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required");
}
logger_1.default.info("Database configuration loaded for Doctor Service", {
    service: "doctor-service",
    url: supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
    connectionPooling: true,
});
exports.supabaseAdmin = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
    db: {
        schema: "public",
    },
    global: {
        headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
            "X-Client-Info": `doctor-service-${Date.now()}`,
        },
    },
});
exports.supabase = exports.supabaseAdmin;
function getSupabase() {
    return exports.supabaseAdmin;
}
exports.dbPool = {
    async executeQuery(queryFn) {
        return connection_pool_1.connectionPool.executeQuery(queryFn);
    },
    async executeFHIRValidation(validationFn) {
        return connection_pool_1.connectionPool.executeFHIRValidation(validationFn);
    },
    async executeDiagnosisOperation(diagnosisFn) {
        return connection_pool_1.connectionPool.executeDiagnosisOperation(diagnosisFn);
    },
    async executeBulkOperation(bulkFn) {
        return connection_pool_1.connectionPool.executeBulkOperation(bulkFn);
    },
};
async function testDatabaseConnection() {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from("doctors")
            .select("count(*)")
            .limit(1);
        if (error) {
            logger_1.default.error("Database connection test failed", { error });
            return false;
        }
        logger_1.default.info("Database connection test successful", {
            service: "doctor-service",
        });
        return true;
    }
    catch (error) {
        logger_1.default.error("Database connection test failed", { error });
        return false;
    }
}
//# sourceMappingURL=database.config.js.map