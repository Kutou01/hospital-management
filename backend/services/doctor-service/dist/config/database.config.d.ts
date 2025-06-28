import { SupabaseClient } from '@supabase/supabase-js';
export declare const supabaseAdmin: SupabaseClient;
export declare const supabase: SupabaseClient<any, "public", any>;
export declare function getSupabase(): SupabaseClient;
export declare function testDatabaseConnection(): Promise<boolean>;
//# sourceMappingURL=database.config.d.ts.map