"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbPool = exports.supabaseAdmin = exports.connectionPool = void 0;
exports.getSupabase = getSupabase;
exports.testDatabaseConnection = testDatabaseConnection;
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const supabase_js_1 = require("@supabase/supabase-js");
// Try to import connection pool, fallback if not available
let connectionPool = null;
exports.connectionPool = connectionPool;
try {
    const poolModule = require("@hospital/shared/dist/database/connection-pool");
    exports.connectionPool = connectionPool = poolModule.connectionPool;
    console.log("✅ Connection pool imported successfully");
}
catch (error) {
    console.warn("⚠️ Connection pool not available, using direct client:", error);
}
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
        if (connectionPool && connectionPool.executeQuery) {
            return connectionPool.executeQuery(queryFn);
        }
        // Fallback to direct supabase client
        return queryFn(exports.supabaseAdmin);
    },
    // Execute healthcare-specific FHIR validation
    async executeFHIRValidation(validationFn) {
        if (connectionPool && connectionPool.executeFHIRValidation) {
            return connectionPool.executeFHIRValidation(validationFn);
        }
        // Fallback to direct supabase client
        return validationFn(exports.supabaseAdmin);
    },
    // Execute diagnosis operations with high priority
    async executeDiagnosisOperation(diagnosisFn) {
        if (connectionPool && connectionPool.executeDiagnosisOperation) {
            return connectionPool.executeDiagnosisOperation(diagnosisFn);
        }
        // Fallback to direct supabase client
        return diagnosisFn(exports.supabaseAdmin);
    },
    // Execute bulk operations with low priority
    async executeBulkOperation(bulkFn) {
        if (connectionPool && connectionPool.executeBulkOperation) {
            return connectionPool.executeBulkOperation(bulkFn);
        }
        // Fallback to direct supabase client
        return bulkFn(exports.supabaseAdmin);
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