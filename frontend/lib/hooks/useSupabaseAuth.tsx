'use client';

import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import {
  supabaseAuth,
  HospitalUser,
  LoginCredentials,
  RegisterData,
  AuthResponse
} from '../auth/supabase-auth';

// Auth Context Type
interface AuthContextType {
  user: HospitalUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (credentials: LoginCredentials) => Promise<AuthResponse>;
  signUp: (userData: RegisterData) => Promise<AuthResponse>;
  signOut: () => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
}

// Create Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<HospitalUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { session: initialSession, user: initialUser } = await supabaseAuth.getCurrentSession();
        setSession(initialSession);
        setUser(initialUser);
      } catch (error) {
        console.error('Error getting initial session:', error);
        setSession(null);
        setUser(null);
      }
    };

    getInitialSession();

    // Listen for auth state changes
    const authListener = supabaseAuth.onAuthStateChange((user, session) => {
      console.log('🔄 [useSupabaseAuth] Auth state changed:', {
        hasUser: !!user,
        hasSession: !!session,
        userRole: user?.role,
        userId: user?.id
      });
      setUser(user);
      setSession(session);
    });

    return () => {
      if (authListener?.data?.subscription) {
        authListener.data.subscription.unsubscribe();
      }
    };
  }, []);

  // Sign in function
  const signIn = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    setLoading(true);
    try {
      const result = await supabaseAuth.signIn(credentials);
      if (result.user && result.session) {
        setUser(result.user);
        setSession(result.session);
      }
      return result;
    } finally {
      setLoading(false);
    }
  };

  // Sign up function
  const signUp = async (userData: RegisterData): Promise<AuthResponse> => {
    setLoading(true);
    try {
      const result = await supabaseAuth.signUp(userData);
      // Don't auto-login after registration - user should login manually
      // if (result.user && result.session) {
      //   setUser(result.user);
      //   setSession(result.session);
      // }
      return result;
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async (): Promise<{ error: string | null }> => {
    setLoading(true);
    try {
      console.log('🚪 [useSupabaseAuth] Starting logout process...');

      const result = await supabaseAuth.signOut();

      if (!result.error) {
        console.log('🚪 [useSupabaseAuth] Logout successful, clearing state...');
        setUser(null);
        setSession(null);
      } else {
        console.error('🚪 [useSupabaseAuth] Logout error:', result.error);
      }

      return result;
    } catch (error) {
      console.error('🚪 [useSupabaseAuth] Logout exception:', error);
      return { error: 'Logout failed' };
    } finally {
      setLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    return await supabaseAuth.resetPassword(email);
  };

  // Update password function
  const updatePassword = async (newPassword: string): Promise<{ error: string | null }> => {
    return await supabaseAuth.updatePassword(newPassword);
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useSupabaseAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}

// Helper hooks for specific use cases
export function useUser(): HospitalUser | null {
  const { user } = useSupabaseAuth();
  return user;
}

export function useSession(): Session | null {
  const { session } = useSupabaseAuth();
  return session;
}

export function useAuthLoading(): boolean {
  const { loading } = useSupabaseAuth();
  return loading;
}

// Role-based access control hooks
export function useIsAdmin(): boolean {
  const { user } = useSupabaseAuth();
  return user?.role === 'admin';
}

export function useIsDoctor(): boolean {
  const { user } = useSupabaseAuth();
  return user?.role === 'doctor';
}

export function useIsPatient(): boolean {
  const { user } = useSupabaseAuth();
  return user?.role === 'patient';
}

export function useIsNurse(): boolean {
  const { user } = useSupabaseAuth();
  return user?.role === 'nurse';
}

export function useIsReceptionist(): boolean {
  const { user } = useSupabaseAuth();
  return user?.role === 'receptionist';
}

export function useHasRole(role: string): boolean {
  const { user } = useSupabaseAuth();
  return user?.role === role;
}

export function useHasAnyRole(roles: string[]): boolean {
  const { user } = useSupabaseAuth();
  return user ? roles.includes(user.role) : false;
}

// Authentication status hooks
export function useIsAuthenticated(): boolean {
  const { user, loading } = useSupabaseAuth();
  return !loading && user !== null;
}

export function useIsUnauthenticated(): boolean {
  const { user, loading } = useSupabaseAuth();
  return !loading && user === null;
}

// Profile access hooks
export function useProfileId(): string | null {
  const { user } = useSupabaseAuth();
  return user?.profile_id || null;
}

export function useUserEmail(): string | null {
  const { user } = useSupabaseAuth();
  return user?.email || null;
}

export function useUserFullName(): string | null {
  const { user } = useSupabaseAuth();
  return user?.full_name || null;
}

// Verification status hooks
export function useIsEmailVerified(): boolean {
  const { user } = useSupabaseAuth();
  return user?.email_verified || false;
}

export function useIsPhoneVerified(): boolean {
  const { user } = useSupabaseAuth();
  return user?.phone_verified || false;
}

// Account status hooks
export function useIsAccountActive(): boolean {
  const { user } = useSupabaseAuth();
  return user?.is_active || false;
}

// Export types for external use
export type { HospitalUser, LoginCredentials, RegisterData, AuthResponse };
