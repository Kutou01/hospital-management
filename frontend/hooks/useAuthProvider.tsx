'use client';

import { 
  useSupabaseAuth, 
  useIsAdmin, 
  useIsDoctor, 
  useIsPatient,
  useIsNurse,
  useIsReceptionist,
  HospitalUser,
  LoginCredentials,
  RegisterData,
  AuthResponse
} from '@/lib/hooks/useSupabaseAuth';

// Wrapper interface to maintain compatibility
interface AuthProviderType {
  user: HospitalUser | null;
  loading: boolean;
  signIn: (credentials: LoginCredentials) => Promise<AuthResponse>;
  signUp: (userData: RegisterData) => Promise<AuthResponse>;
  signOut: () => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  isAdmin: () => boolean;
  isDoctor: () => boolean;
  isPatient: () => boolean;
  isNurse: () => boolean;
  isReceptionist: () => boolean;
  logout: () => Promise<{ error: string | null }>;
}

/**
 * Wrapper hook for backward compatibility with existing components
 * This hook wraps the new useSupabaseAuth hook to maintain the same interface
 * as the old useAuthProvider hook that components are expecting
 */
export function useAuthProvider(): AuthProviderType {
  const { 
    user, 
    loading, 
    signIn, 
    signUp, 
    signOut, 
    resetPassword, 
    updatePassword 
  } = useSupabaseAuth();
  
  const isAdminRole = useIsAdmin();
  const isDoctorRole = useIsDoctor();
  const isPatientRole = useIsPatient();
  const isNurseRole = useIsNurse();
  const isReceptionistRole = useIsReceptionist();

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    isAdmin: () => isAdminRole,
    isDoctor: () => isDoctorRole,
    isPatient: () => isPatientRole,
    isNurse: () => isNurseRole,
    isReceptionist: () => isReceptionistRole,
    logout: signOut, // Alias for signOut
  };
}

// Export types for external use
export type { HospitalUser, LoginCredentials, RegisterData, AuthResponse };
