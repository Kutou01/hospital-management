import { SupabaseClient } from "@supabase/supabase-js";
declare let connectionPool: any;
export { connectionPool };
export declare const supabaseAdmin: SupabaseClient;
export declare function getSupabase(): SupabaseClient;
export declare const dbPool: {
    executeQuery<T>(queryFn: (client: any) => Promise<T>): Promise<T>;
    executeFHIRValidation<T>(validationFn: (client: any) => Promise<T>): Promise<T>;
    executeDiagnosisOperation<T>(diagnosisFn: (client: any) => Promise<T>): Promise<T>;
    executeBulkOperation<T>(bulkFn: (client: any) => Promise<T>): Promise<T>;
};
export declare function testDatabaseConnection(): Promise<boolean>;
//# sourceMappingURL=database.config.d.ts.map