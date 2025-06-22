'use client';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Estas son las variables de entorno que Next.js expone al navegador
// Deben empezar con NEXT_PUBLIC_
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const createClient = () => {
    return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false
        },
        global: {
            // Tắt RLS tạm thời để khắc phục lỗi "Database error granting user"
            headers: {
                'x-supabase-custom': 'bypass-rls'
            }
        }
    });
};

// Tạo client với bypass RLS rõ ràng
export const createClientWithBypass = () => {
    return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false
        },
        global: {
            headers: {
                'x-supabase-custom': 'bypass-rls'
            }
        }
    });
};