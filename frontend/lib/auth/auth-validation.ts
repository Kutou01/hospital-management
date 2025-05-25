/**
 * Auth validation utilities to ensure users have complete profiles
 */

import { supabase } from '@/lib/auth';

export interface UserValidationResult {
  isValid: boolean;
  user?: any;
  profile?: any;
  roleData?: any;
  error?: string;
}

/**
 * Validates that a user has complete profile data
 */
export async function validateUserProfile(userId: string): Promise<UserValidationResult> {
  try {
    // Check if user has profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return {
        isValid: false,
        error: 'Tài khoản chưa được thiết lập đầy đủ. Vui lòng đăng ký lại.'
      };
    }

    // Check role-specific data
    let roleData = null;
    
    if (profile.role === 'doctor') {
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('*')
        .eq('profile_id', userId)
        .single();

      if (doctorError || !doctorData) {
        return {
          isValid: false,
          profile,
          error: 'Hồ sơ bác sĩ chưa được thiết lập đầy đủ. Vui lòng đăng ký lại.'
        };
      }
      roleData = doctorData;
    } else if (profile.role === 'patient') {
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('profile_id', userId)
        .single();

      if (patientError || !patientData) {
        return {
          isValid: false,
          profile,
          error: 'Hồ sơ bệnh nhân chưa được thiết lập đầy đủ. Vui lòng đăng ký lại.'
        };
      }
      roleData = patientData;
    } else if (profile.role === 'admin') {
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('profile_id', userId)
        .single();

      if (adminError || !adminData) {
        return {
          isValid: false,
          profile,
          error: 'Hồ sơ quản trị viên chưa được thiết lập đầy đủ. Vui lòng đăng ký lại.'
        };
      }
      roleData = adminData;
    }

    return {
      isValid: true,
      profile,
      roleData
    };
  } catch (error) {
    console.error('Error validating user profile:', error);
    return {
      isValid: false,
      error: 'Đã xảy ra lỗi khi kiểm tra thông tin tài khoản.'
    };
  }
}

/**
 * Validates user during sign in and signs them out if incomplete
 */
export async function validateAndSignIn(email: string, password: string): Promise<UserValidationResult> {
  try {
    // First, attempt to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      return {
        isValid: false,
        error: signInError.message
      };
    }

    if (!signInData.user) {
      return {
        isValid: false,
        error: 'Không thể đăng nhập. Vui lòng thử lại.'
      };
    }

    // Validate the user's profile
    const validation = await validateUserProfile(signInData.user.id);

    if (!validation.isValid) {
      // Sign out the user since they have incomplete profile
      await supabase.auth.signOut();
      return validation;
    }

    // Update last login
    await supabase
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', signInData.user.id);

    return {
      isValid: true,
      user: signInData.user,
      profile: validation.profile,
      roleData: validation.roleData
    };
  } catch (error) {
    console.error('Error in validateAndSignIn:', error);
    return {
      isValid: false,
      error: 'Đã xảy ra lỗi không mong muốn khi đăng nhập.'
    };
  }
}

/**
 * Checks if current session user has valid profile
 */
export async function validateCurrentUser(): Promise<UserValidationResult> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        isValid: false,
        error: 'Không tìm thấy phiên đăng nhập.'
      };
    }

    return await validateUserProfile(user.id);
  } catch (error) {
    console.error('Error validating current user:', error);
    return {
      isValid: false,
      error: 'Đã xảy ra lỗi khi kiểm tra phiên đăng nhập.'
    };
  }
}

/**
 * Middleware to protect routes that require complete user profiles
 */
export async function requireCompleteProfile(): Promise<UserValidationResult> {
  const validation = await validateCurrentUser();
  
  if (!validation.isValid) {
    // Sign out if profile is incomplete
    await supabase.auth.signOut();
  }
  
  return validation;
}
