import { SupabaseClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
declare let supabase: SupabaseClient;
export declare const connectDatabase: () => Promise<void>;
export declare const getDatabase: () => Pool;
export declare const getSupabase: () => SupabaseClient;
export { supabase };
export declare const isSupabaseAvailable: () => boolean;
export declare const disconnectDatabase: () => Promise<void>;
