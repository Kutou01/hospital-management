// Utility functions for Supabase client management
import { supabaseClient } from './supabase-client';
import { createSupabaseServerClient } from './supabase-server';

/**
 * Get the appropriate Supabase client based on environment
 * @param isServer - Whether this is running on server-side
 * @returns Supabase client instance
 */
export async function getSupabaseClient(isServer: boolean = false) {
  if (isServer) {
    return await createSupabaseServerClient();
  }
  return supabaseClient;
}

/**
 * Client-side only Supabase client
 * Use this in React components, hooks, and client-side logic
 */
export const clientSupabase = supabaseClient;

/**
 * Server-side Supabase client factory
 * Use this in API routes, getServerSideProps, and middleware
 */
export const serverSupabase = createSupabaseServerClient;

/**
 * Type guard to check if we're on the server
 */
export const isServer = typeof window === 'undefined';

/**
 * Get Supabase client with automatic environment detection
 */
export async function getSupabase() {
  return await getSupabaseClient(isServer);
}

// Re-export for convenience
export { supabaseClient, createSupabaseServerClient };
