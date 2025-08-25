import logger from "@hospital/shared/dist/utils/logger";
import { connectionPool } from "@hospital/shared/src/database/connection-pool";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

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
  async executeQuery<T>(
    queryFn: (client: SupabaseClient) => Promise<T>
  ): Promise<T> {
    return connectionPool.executeQuery(queryFn);
  },

  // Execute healthcare-specific FHIR validation
  async executeFHIRValidation<T>(
    validationFn: (client: SupabaseClient) => Promise<T>
  ): Promise<T> {
    return connectionPool.executeFHIRValidation(validationFn);
  },

  // Execute diagnosis operations with high priority
  async executeDiagnosisOperation<T>(
    diagnosisFn: (client: SupabaseClient) => Promise<T>
  ): Promise<T> {
    return connectionPool.executeDiagnosisOperation(diagnosisFn);
  },

  // Execute bulk operations with low priority
  async executeBulkOperation<T>(
    bulkFn: (client: SupabaseClient) => Promise<T>
  ): Promise<T> {
    return connectionPool.executeBulkOperation(bulkFn);
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
