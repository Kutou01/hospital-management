import { SupabaseClient } from '@supabase/supabase-js';
export declare const supabaseAdmin: SupabaseClient;
export declare const supabaseFresh: SupabaseClient;
export declare const supabaseClient: SupabaseClient;
export declare const testSupabaseConnection: () => Promise<boolean>;
export declare const initializeSupabase: () => Promise<void>;
declare const _default: {
    admin: SupabaseClient<any, "public", any>;
    client: SupabaseClient<any, "public", any>;
    testConnection: () => Promise<boolean>;
};
export default _default;
//# sourceMappingURL=supabase.d.ts.map