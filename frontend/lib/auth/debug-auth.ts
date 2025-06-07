import { supabaseAuth } from './supabase-auth';
import { supabaseClient } from '../supabase-client';

/**
 * Debug utility to check auth state and doctor_id
 */
export async function debugAuthState() {
  console.log('🔍 [DEBUG] Starting auth state debug...');
  
  try {
    // 1. Check Supabase session
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    console.log('🔍 [DEBUG] Supabase session:', { session: !!session, error: sessionError });
    
    if (!session?.user) {
      console.log('❌ [DEBUG] No active session found');
      return;
    }
    
    // 2. Check profile data
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    console.log('🔍 [DEBUG] Profile data:', { profile, error: profileError });
    
    if (!profile) {
      console.log('❌ [DEBUG] No profile found');
      return;
    }
    
    // 3. Check doctor data if role is doctor
    if (profile.role === 'doctor') {
      const { data: doctor, error: doctorError } = await supabaseClient
        .from('doctors')
        .select('*')
        .eq('profile_id', profile.id)
        .single();
      
      console.log('🔍 [DEBUG] Doctor data:', { doctor, error: doctorError });
    }
    
    // 4. Force refresh auth and check result
    console.log('🔍 [DEBUG] Force refreshing auth...');
    const authResult = await supabaseAuth.forceRefreshCurrentUser();
    console.log('🔍 [DEBUG] Auth refresh result:', authResult);
    
    return authResult;
    
  } catch (error) {
    console.error('❌ [DEBUG] Error during auth debug:', error);
    return null;
  }
}

/**
 * Clear all auth cache and refresh
 */
export async function clearAuthCacheAndRefresh() {
  console.log('🔄 [DEBUG] Clearing auth cache and refreshing...');
  
  try {
    // Clear auth cache
    supabaseAuth.clearUserCache();
    
    // Force refresh
    const result = await supabaseAuth.forceRefreshCurrentUser();
    console.log('✅ [DEBUG] Cache cleared and refreshed:', result);
    
    return result;
  } catch (error) {
    console.error('❌ [DEBUG] Error clearing cache:', error);
    return null;
  }
}

// Make functions available globally for debugging in browser console
if (typeof window !== 'undefined') {
  (window as any).debugAuthState = debugAuthState;
  (window as any).clearAuthCacheAndRefresh = clearAuthCacheAndRefresh;
  console.log('🔧 [DEBUG] Auth debug functions available: debugAuthState(), clearAuthCacheAndRefresh()');
}
