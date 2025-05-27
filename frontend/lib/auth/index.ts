// Auth API exports
export { supabaseAuth } from './supabase-auth';
export type {
  HospitalUser,
  LoginCredentials,
  RegisterData,
  AuthResponse
} from './supabase-auth';

// Create authApi alias for compatibility
export const authApi = {
  getCurrentUser: () => supabaseAuth.getCurrentUser(),
  signIn: (credentials: any) => supabaseAuth.signIn(credentials),
  signUp: (userData: any) => supabaseAuth.signUp(userData),
  signOut: () => supabaseAuth.signOut(),
  resetPassword: (email: string) => supabaseAuth.resetPassword(email),
  updatePassword: (newPassword: string) => supabaseAuth.updatePassword(newPassword),
  getCurrentSession: () => supabaseAuth.getCurrentSession(),
  onAuthStateChange: (callback: any) => supabaseAuth.onAuthStateChange(callback),
  clearUserCache: () => supabaseAuth.clearUserCache()
};

// Export client-side auth guard hook
export { useAuthGuard, withAuthGuard, useAdminGuard, useDoctorGuard, usePatientGuard } from '../../hooks/useAuthGuard';

// Export client-side RLS helpers
export { clientRLS } from './rls-helpers';

// Note: Server-side auth-guard (withServerAuth) should be imported directly
// from lib/auth/auth-guard.ts in server components and getServerSideProps
