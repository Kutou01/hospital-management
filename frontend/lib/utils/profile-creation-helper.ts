/**
 * Profile Creation Helper
 * Provides utilities for creating user profiles when triggers don't work
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ProfileCreationData {
  full_name: string;
  phone_number?: string;
  role?: 'admin' | 'doctor' | 'patient';
}

export interface ProfileCreationResult {
  success: boolean;
  profile?: any;
  error?: string;
  method: 'trigger' | 'manual' | 'rpc';
}

/**
 * Enhanced signup with automatic profile creation
 * This function handles both trigger-based and manual profile creation
 */
export async function signupWithProfile(
  email: string,
  password: string,
  profileData: ProfileCreationData
): Promise<ProfileCreationResult> {
  try {
    console.log('🚀 Starting signup with profile creation...');
    
    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: profileData.full_name,
          phone_number: profileData.phone_number,
          role: profileData.role || 'patient'
        }
      }
    });
    
    if (authError) {
      console.error('❌ Auth signup failed:', authError);
      return {
        success: false,
        error: authError.message,
        method: 'trigger'
      };
    }
    
    if (!authData.user) {
      return {
        success: false,
        error: 'No user data returned from signup',
        method: 'trigger'
      };
    }
    
    console.log('✅ Auth user created:', authData.user.id);
    
    // Step 2: Wait for potential trigger
    console.log('⏳ Waiting for trigger...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 3: Check if profile was created by trigger
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();
    
    if (checkError) {
      console.error('❌ Profile check failed:', checkError);
      // Continue to manual creation
    } else if (existingProfile) {
      console.log('🎉 Profile created by trigger!');
      return {
        success: true,
        profile: existingProfile,
        method: 'trigger'
      };
    }
    
    // Step 4: Try RPC function for profile creation
    console.log('🔧 Trigger did not work, trying RPC function...');
    
    const { data: rpcResult, error: rpcError } = await supabase.rpc('create_user_profile', {
      user_id: authData.user.id,
      user_email: email,
      user_name: profileData.full_name,
      user_phone: profileData.phone_number,
      user_role: profileData.role || 'patient'
    });
    
    if (!rpcError && rpcResult?.success) {
      console.log('✅ Profile created via RPC function!');
      return {
        success: true,
        profile: rpcResult.profile,
        method: 'rpc'
      };
    }
    
    // Step 5: Fallback to direct insert
    console.log('🔧 RPC failed, trying direct insert...');
    
    const { data: manualProfile, error: manualError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: email,
        full_name: profileData.full_name,
        phone_number: profileData.phone_number,
        role: profileData.role || 'patient',
        email_verified: false,
        is_active: true
      })
      .select()
      .single();
    
    if (manualError) {
      console.error('❌ Manual profile creation failed:', manualError);
      return {
        success: false,
        error: manualError.message,
        method: 'manual'
      };
    }
    
    console.log('✅ Profile created manually!');
    return {
      success: true,
      profile: manualProfile,
      method: 'manual'
    };
    
  } catch (error) {
    console.error('❌ Signup with profile failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      method: 'manual'
    };
  }
}

/**
 * Check if user has a profile
 */
export async function checkUserProfile(userId: string): Promise<any | null> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('❌ Profile check failed:', error);
      return null;
    }
    
    return profile;
  } catch (error) {
    console.error('❌ Profile check exception:', error);
    return null;
  }
}

/**
 * Create profile for existing user (if missing)
 */
export async function createMissingProfile(
  userId: string,
  email: string,
  profileData: ProfileCreationData
): Promise<ProfileCreationResult> {
  try {
    // Check if profile already exists
    const existingProfile = await checkUserProfile(userId);
    if (existingProfile) {
      return {
        success: true,
        profile: existingProfile,
        method: 'trigger'
      };
    }
    
    // Try RPC function first
    const { data: rpcResult, error: rpcError } = await supabase.rpc('create_user_profile', {
      user_id: userId,
      user_email: email,
      user_name: profileData.full_name,
      user_phone: profileData.phone_number,
      user_role: profileData.role || 'patient'
    });
    
    if (!rpcError && rpcResult?.success) {
      return {
        success: true,
        profile: rpcResult.profile,
        method: 'rpc'
      };
    }
    
    // Fallback to direct insert
    const { data: manualProfile, error: manualError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        full_name: profileData.full_name,
        phone_number: profileData.phone_number,
        role: profileData.role || 'patient',
        email_verified: false,
        is_active: true
      })
      .select()
      .single();
    
    if (manualError) {
      return {
        success: false,
        error: manualError.message,
        method: 'manual'
      };
    }
    
    return {
      success: true,
      profile: manualProfile,
      method: 'manual'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      method: 'manual'
    };
  }
}

/**
 * Hook for React components to use signup with profile
 */
export function useSignupWithProfile() {
  const signup = async (
    email: string,
    password: string,
    profileData: ProfileCreationData
  ) => {
    return await signupWithProfile(email, password, profileData);
  };
  
  const checkProfile = async (userId: string) => {
    return await checkUserProfile(userId);
  };
  
  const createProfile = async (
    userId: string,
    email: string,
    profileData: ProfileCreationData
  ) => {
    return await createMissingProfile(userId, email, profileData);
  };
  
  return {
    signup,
    checkProfile,
    createProfile
  };
}

// Example usage in a React component:
/*
import { useSignupWithProfile } from '@/lib/utils/profile-creation-helper';

function SignupForm() {
  const { signup } = useSignupWithProfile();
  
  const handleSubmit = async (formData) => {
    const result = await signup(
      formData.email,
      formData.password,
      {
        full_name: formData.fullName,
        phone_number: formData.phoneNumber,
        role: 'patient'
      }
    );
    
    if (result.success) {
      console.log('Signup successful!', result.profile);
      console.log('Profile created via:', result.method);
      // Redirect to dashboard or next step
    } else {
      console.error('Signup failed:', result.error);
      // Show error message
    }
  };
  
  return (
    // Your signup form JSX
  );
}
*/
