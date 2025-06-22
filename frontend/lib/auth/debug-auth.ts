import { authServiceApi } from '../api/auth';
import { supabaseClient } from '../supabase-client';

/**
 * Debug utility to check auth state and doctor_id
 */
export async function debugAuthState() {
  console.log('🔍 [DEBUG] Starting auth state debug...');

  try {
    // 1. Check Auth Service token
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    console.log('🔍 [DEBUG] Auth Service token:', { hasToken: !!token });

    if (!token) {
      console.log('❌ [DEBUG] No auth token found');
      return;
    }

    // 2. Verify token with Auth Service
    try {
      const verifyResult = await authServiceApi.verifyToken();
      console.log('🔍 [DEBUG] Token verification:', verifyResult);

      if (!verifyResult.success) {
        console.log('❌ [DEBUG] Token verification failed');
        return;
      }

      const user = verifyResult.data?.user;
      if (!user) {
        console.log('❌ [DEBUG] No user data from token verification');
        return;
      }

      // 3. Check profile data in database
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log('🔍 [DEBUG] Profile data:', { profile, error: profileError });

      // 4. Check doctor data if role is doctor
      if (user.role === 'doctor') {
        const { data: doctor, error: doctorError } = await supabaseClient
          .from('doctors')
          .select('*')
          .eq('profile_id', user.id)
          .single();

        console.log('🔍 [DEBUG] Doctor data:', { doctor, error: doctorError });
      }

      return { user, profile };

    } catch (verifyError) {
      console.error('❌ [DEBUG] Token verification error:', verifyError);
      return null;
    }

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
    // Clear Auth Service tokens
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('refresh_token');

    console.log('✅ [DEBUG] Auth tokens cleared');

    // Try to get fresh auth state
    const result = await debugAuthState();
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
