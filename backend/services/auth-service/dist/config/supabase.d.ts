import { connectionPool } from "@hospital/shared/src/database/connection-pool";
import { SupabaseClient } from "@supabase/supabase-js";
export { connectionPool };
export declare const supabaseAdmin: SupabaseClient;
export declare const supabaseFresh: SupabaseClient;
export declare const supabaseClient: SupabaseClient;
export declare const testSupabaseConnection: () => Promise<boolean>;
export declare const initializeSupabase: () => Promise<void>;
export declare const dbPool: {
    executeQuery<T>(queryFn: (client: any) => Promise<T>): Promise<T>;
    executeFHIRValidation<T>(validationFn: (client: any) => Promise<T>): Promise<T>;
    executeDiagnosisOperation<T>(diagnosisFn: (client: any) => Promise<T>): Promise<T>;
    executeBulkOperation<T>(bulkFn: (client: any) => Promise<T>): Promise<T>;
};
declare const _default: {
    admin: SupabaseClient<any, "public", "public", any, any>;
    client: SupabaseClient<any, "public", "public", any, any>;
    testConnection: () => Promise<boolean>;
    dbPool: {
        executeQuery<T>(queryFn: (client: any) => Promise<T>): Promise<T>;
        executeFHIRValidation<T>(validationFn: (client: any) => Promise<T>): Promise<T>;
        executeDiagnosisOperation<T>(diagnosisFn: (client: any) => Promise<T>): Promise<T>;
        executeBulkOperation<T>(bulkFn: (client: any) => Promise<T>): Promise<T>;
    };
};
export default _default;
//# sourceMappingURL=supabase.d.ts.map