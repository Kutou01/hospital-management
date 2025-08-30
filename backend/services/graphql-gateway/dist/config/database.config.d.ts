import { connectionPool } from "@hospital/shared/src/database/connection-pool";
import { SupabaseClient } from "@supabase/supabase-js";
export { connectionPool };
export declare const supabaseAdmin: SupabaseClient;
export declare function getSupabase(): SupabaseClient;
export declare const dbPool: {
    executeQuery<T>(queryFn: (client: SupabaseClient) => Promise<T>): Promise<T>;
    executeFHIRValidation<T>(validationFn: (client: SupabaseClient) => Promise<T>): Promise<T>;
    executeDiagnosisOperation<T>(diagnosisFn: (client: SupabaseClient) => Promise<T>): Promise<T>;
    executeBulkOperation<T>(bulkFn: (client: SupabaseClient) => Promise<T>): Promise<T>;
};
export default getSupabase;
//# sourceMappingURL=database.config.d.ts.map