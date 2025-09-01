"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbPool = exports.supabaseAdmin = exports.connectionPool = void 0;
exports.getSupabase = getSupabase;
exports.testDatabaseConnection = testDatabaseConnection;
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const connection_pool_1 = require("@hospital/shared/src/database/connection-pool");
Object.defineProperty(exports, "connectionPool", { enumerable: true, get: function () { return connection_pool_1.connectionPool; } });
const supabase_js_1 = require("@supabase/supabase-js");
// Environment variables validation
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl) {
    throw new Error("SUPABASE_URL environment variable is required");
}
if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required");
}
logger_1.default.info("Database configuration loaded for Medical Records Service", {
    service: "medical-records-service",
    url: supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
    connectionPooling: true,
});
// Legacy direct client for backward compatibility (deprecated - use connectionPool instead)
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
            "X-Client-Info": `medical-records-service-${Date.now()}`,
        },
    },
});
// Legacy function for backward compatibility (deprecated)
function getSupabase() {
    return exports.supabaseAdmin;
}
// New recommended database access methods using connection pooling
exports.dbPool = {
    // Execute standard query with connection pooling
    async executeQuery(queryFn) {
        return connection_pool_1.connectionPool.executeQuery(queryFn);
    },
    // Execute healthcare-specific FHIR validation
    async executeFHIRValidation(validationFn) {
        return connection_pool_1.connectionPool.executeFHIRValidation(validationFn);
    },
    // Execute diagnosis operations with high priority
    async executeDiagnosisOperation(diagnosisFn) {
        return connection_pool_1.connectionPool.executeDiagnosisOperation(diagnosisFn);
    },
    // Execute bulk operations with low priority
    async executeBulkOperation(bulkFn) {
        return connection_pool_1.connectionPool.executeBulkOperation(bulkFn);
    },
};
// Test database connection
async function testDatabaseConnection() {
    try {
        const { data, error } = await exports.supabaseAdmin
            .from("medical_records")
            .select("count(*)", { count: "exact", head: true });
        if (error) {
            logger_1.default.error("Database connection test failed", { error });
            return false;
        }
        logger_1.default.info("Database connection test successful", {
            service: "medical-records-service",
        });
        return true;
    }
    catch (error) {
        logger_1.default.error("Database connection test exception", { error });
        return false;
    }
}
//# sourceMappingURL=database.config.js.map