import logger from "@hospital/shared/dist/utils/logger";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Try to import connection pool, fallback if not available
let connectionPool: any = null;
try {
  const poolModule = require("@hospital/shared/dist/database/connection-pool");
  connectionPool = poolModule.connectionPool;
  console.log("✅ Connection pool imported successfully");
} catch (error) {
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

logger.info("Database configuration loaded for Medical Records Service", {
  service: "medical-records-service",
  url: supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  connectionPooling: true,
});

// Connection Pool Integration - Primary method for database operations
export { connectionPool };

// Legacy direct client for backward compatibility (deprecated - use connectionPool instead)
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
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
  }
);

// Legacy function for backward compatibility (deprecated)
export function getSupabase(): SupabaseClient {
  return supabaseAdmin;
}

// New recommended database access methods using connection pooling
export const dbPool = {
  // Execute standard query with connection pooling
  async executeQuery<T>(queryFn: (client: any) => Promise<T>): Promise<T> {
    if (connectionPool && connectionPool.executeQuery) {
      return connectionPool.executeQuery(queryFn);
    }
    // Fallback to direct supabase client
    return queryFn(supabaseAdmin);
  },

  // Execute healthcare-specific FHIR validation
  async executeFHIRValidation<T>(
    validationFn: (client: any) => Promise<T>
  ): Promise<T> {
    if (connectionPool && connectionPool.executeFHIRValidation) {
      return connectionPool.executeFHIRValidation(validationFn);
    }
    // Fallback to direct supabase client
    return validationFn(supabaseAdmin);
  },

  // Execute diagnosis operations with high priority
  async executeDiagnosisOperation<T>(
    diagnosisFn: (client: any) => Promise<T>
  ): Promise<T> {
    if (connectionPool && connectionPool.executeDiagnosisOperation) {
      return connectionPool.executeDiagnosisOperation(diagnosisFn);
    }
    // Fallback to direct supabase client
    return diagnosisFn(supabaseAdmin);
  },

  // Execute bulk operations with low priority
  async executeBulkOperation<T>(
    bulkFn: (client: any) => Promise<T>
  ): Promise<T> {
    if (connectionPool && connectionPool.executeBulkOperation) {
      return connectionPool.executeBulkOperation(bulkFn);
    }
    // Fallback to direct supabase client
    return bulkFn(supabaseAdmin);
  },
};

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from("medical_records")
      .select("count(*)", { count: "exact", head: true });

    if (error) {
      logger.error("Database connection test failed", { error });
      return false;
    }

    logger.info("Database connection test successful", {
      service: "medical-records-service",
    });
    return true;
  } catch (error) {
    logger.error("Database connection test exception", { error });
    return false;
  }
}
