import { supabaseClient } from '../supabase-client';
import { Session } from '@supabase/supabase-js';

// Types for Hospital Management System
export interface HospitalUser {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  role: 'admin' | 'doctor' | 'patient' | 'nurse' | 'receptionist';
  is_active: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  profile_data?: any;
  created_at: string;
  updated_at: string;
  last_login?: string;
  // Role-specific IDs
  doctor_id?: string;
  patient_id?: string;
  admin_id?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone_number?: string;
  role: 'doctor' | 'patient' | 'nurse' | 'receptionist';
  // Doctor specific
  specialty?: string;
  license_number?: string;
  qualification?: string;
  department_id?: string;
  // Patient specific
  date_of_birth?: string;
  gender?: string;
  address?: string;
}

export interface AuthResponse {
  user: HospitalUser | null;
  session: Session | null;
  error: string | null;
}

// Supabase Auth Service Class
class SupabaseAuthService {
  // Add cache and debounce properties
  private userCache = new Map<string, { user: HospitalUser; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private authStateChangeTimeout: NodeJS.Timeout | null = null;
  private currentUserPromise: Promise<AuthResponse> | null = null;

  // Sign up new user with manual profile creation
  async signUp(userData: RegisterData): Promise<AuthResponse> {
    try {
      console.log('🔐 [SupabaseAuth] Starting sign up process for:', userData.email);

      // 0. Check if email already exists in profiles table
      const { data: existingProfile, error: checkError } = await supabaseClient
        .from('profiles')
        .select('id, email')
        .eq('email', userData.email)
        .maybeSingle();

      if (!checkError && existingProfile) {
        console.error('❌ Email already exists in profiles:', userData.email);
        return {
          user: null,
          session: null,
          error: 'Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.'
        };
      }

      // 1. Create auth user
      const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            phone_number: userData.phone_number,
            role: userData.role,
            // Doctor specific metadata
            specialty: userData.specialty,
            license_number: userData.license_number,
            qualification: userData.qualification,
            department_id: userData.department_id,
            // Patient specific metadata
            date_of_birth: userData.date_of_birth,
            gender: userData.gender,
            address: userData.address,
          }
        }
      });

      if (authError) {
        console.error('❌ Auth signup error:', authError);
        // Handle specific auth errors
        if (authError.message.includes('User already registered') ||
            authError.message.includes('already been registered')) {
          return {
            user: null,
            session: null,
            error: 'Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.'
          };
        }
        return { user: null, session: null, error: authError.message };
      }

      if (!authData.user) {
        console.error('❌ No user returned from auth signup');
        return { user: null, session: null, error: 'Không thể tạo tài khoản. Vui lòng thử lại.' };
      }

      console.log('✅ Auth user created:', authData.user.id);

      // 2. Try multiple methods to create profile
      const profileResult = await this.createUserProfile(authData.user.id, userData);

      if (!profileResult.success) {
        console.error('❌ Failed to create profile:', profileResult.error);

        // Handle specific profile creation errors
        if (profileResult.error?.includes('duplicate key value violates unique constraint')) {
          return {
            user: null,
            session: null,
            error: 'Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.'
          };
        }

        return { user: null, session: null, error: profileResult.error };
      }

      console.log('✅ Profile created successfully:', profileResult.profile);

      // 3. Create role-specific profile data if needed
      if (userData.role === 'doctor') {
        console.log('👨‍⚕️ Creating doctor profile via Auth Service for:', authData.user.id);

        try {
          // Get department ID based on specialty if not provided
          let departmentId = userData.department_id;
          if (!departmentId && userData.specialty) {
            const { data: department } = await supabaseClient
              .from('departments')
              .select('department_id')
              .ilike('name', `%${userData.specialty}%`)
              .single();

            if (department) {
              departmentId = department.department_id;
              console.log('🏥 Found department for specialty:', userData.specialty, '-> Department ID:', departmentId);
            }
          }

          // Call Auth Service to create doctor record with department-based ID
          const authServiceUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:3001';
          const response = await fetch(`${authServiceUrl}/api/auth/create-doctor-record`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: authData.user.id,
              userData: {
                full_name: userData.full_name,
                phone_number: userData.phone_number,
                specialty: userData.specialty,
                license_number: userData.license_number,
                qualification: userData.qualification,
                department_id: departmentId || 'DEPT001',
                gender: userData.gender || 'other'
              }
            })
          });

          if (response.ok) {
            const result = await response.json();
            console.log('✅ Doctor profile created successfully via Auth Service:', result);
          } else {
            const errorData = await response.json();
            console.error('❌ Auth Service error creating doctor profile:', errorData);
            // Don't fail the registration, just log the error
          }
        } catch (authServiceError) {
          console.error('❌ Error calling Auth Service for doctor creation:', authServiceError);
          // Fallback: Don't fail the registration
        }
      } else if (userData.role === 'patient') {
        console.log('🏥 Creating patient profile for:', authData.user.id);

        // Generate patient ID
        const patientId = `PAT${Date.now()}`;

        const { error: patientError } = await supabaseClient
          .from('patients')
          .insert({
            patient_id: patientId,
            profile_id: authData.user.id,
            // ✅ CLEAN DESIGN: NO full_name, date_of_birth - they are in profiles table
            gender: userData.gender || 'other',
            address: userData.address ? { street: userData.address } : {},
            medical_history: 'No medical history recorded',
            status: 'active',
          });

        if (patientError) {
          console.error('❌ Error creating patient profile:', patientError);
          // Don't fail the registration, just log the error
        } else {
          console.log('✅ Patient profile created successfully');
        }
      }

      // 4. Return the user data
      const hospitalUser: HospitalUser = {
        id: profileResult.profile.id,
        email: profileResult.profile.email,
        full_name: profileResult.profile.full_name,
        phone_number: profileResult.profile.phone_number,
        role: profileResult.profile.role,
        is_active: true,
        email_verified: authData.user.email_confirmed_at ? true : false,
        phone_verified: false,
        created_at: profileResult.profile.created_at,
        updated_at: profileResult.profile.updated_at,
      };

      console.log('✅ Registration completed successfully for:', userData.email);
      return {
        user: hospitalUser,
        session: authData.session,
        error: null
      };

    } catch (error) {
      console.error('❌ Unexpected error during signup:', error);
      return {
        user: null,
        session: null,
        error: 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.'
      };
    }
  }

  // Create user profile with multiple fallback methods
  private async createUserProfile(userId: string, userData: RegisterData): Promise<{
    success: boolean;
    profile?: any;
    error?: string;
    method?: string;
  }> {
    console.log('🏥 [createUserProfile] Starting profile creation for user:', userId);

    // Method 1: Wait for trigger to create profile
    console.log('🔄 Method 1: Checking if trigger created profile...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

    let { data: existingProfile, error: checkError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!checkError && existingProfile) {
      console.log('✅ Profile created by trigger!');
      return {
        success: true,
        profile: existingProfile,
        method: 'trigger'
      };
    }

    // Method 2: Try RPC function with role creation
    console.log('🔄 Method 2: Trying RPC function with role creation...');
    try {
      const { data: rpcResult, error: rpcError } = await supabaseClient.rpc('create_profile_with_role', {
        user_id: userId,
        user_email: userData.email,
        user_name: userData.full_name,
        user_phone: userData.phone_number,
        user_role: userData.role,
        user_gender: userData.gender || 'other',
        user_specialty: userData.specialty,
        user_dob: userData.date_of_birth
      });

      if (!rpcError && rpcResult?.success) {
        console.log('✅ Profile and role record created via RPC function!');
        return {
          success: true,
          profile: rpcResult.profile,
          method: 'rpc'
        };
      }
    } catch (rpcErr) {
      console.log('⚠️ RPC method failed:', rpcErr);
    }

    // Method 3: Direct insert with duplicate handling
    console.log('🔄 Method 3: Direct profile insert...');
    try {
      // Check one more time if profile exists before inserting
      const { data: doubleCheckProfile, error: doubleCheckError } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!doubleCheckError && doubleCheckProfile) {
        console.log('✅ Profile found on double check!');
        return {
          success: true,
          profile: doubleCheckProfile,
          method: 'found'
        };
      }

      // Also check by email to prevent duplicates
      const { data: emailCheckProfile, error: emailCheckError } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('email', userData.email)
        .maybeSingle();

      if (!emailCheckError && emailCheckProfile) {
        console.log('❌ Email already exists in profiles table');
        return {
          success: false,
          error: 'Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.',
          method: 'duplicate_check'
        };
      }

      const { data: manualProfile, error: manualError } = await supabaseClient
        .from('profiles')
        .insert({
          id: userId,
          email: userData.email,
          full_name: userData.full_name,
          phone_number: userData.phone_number,
          role: userData.role,
          email_verified: false,
          is_active: true
        })
        .select()
        .single();

      if (!manualError && manualProfile) {
        console.log('✅ Profile created via direct insert!');
        return {
          success: true,
          profile: manualProfile,
          method: 'manual'
        };
      }

      console.error('❌ Direct insert failed:', manualError);

      // Handle specific duplicate key errors
      if (manualError?.message?.includes('duplicate key value violates unique constraint')) {
        return {
          success: false,
          error: 'Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.',
          method: 'duplicate_error'
        };
      }

      return {
        success: false,
        error: manualError?.message || 'Không thể tạo hồ sơ người dùng',
        method: 'manual'
      };

    } catch (manualErr: any) {
      console.error('❌ Direct insert exception:', manualErr);

      // Handle specific duplicate key errors
      if (manualErr?.message?.includes('duplicate key value violates unique constraint')) {
        return {
          success: false,
          error: 'Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.',
          method: 'duplicate_exception'
        };
      }

      return {
        success: false,
        error: manualErr?.message || 'Không thể tạo hồ sơ người dùng',
        method: 'manual'
      };
    }

    // All methods failed
    return {
      success: false,
      error: 'Không thể tạo hồ sơ người dùng. Vui lòng thử lại hoặc liên hệ hỗ trợ.'
    };
  }

  // Sign in existing user
  async signIn(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('🔐 [SupabaseAuth] Starting sign in process for:', credentials.email);

      // 1. Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (authError) {
        console.error('❌ Auth signin error:', authError);
        let errorMessage = authError.message;

        // Translate common error messages to Vietnamese
        if (errorMessage.includes('Invalid login credentials')) {
          errorMessage = 'Email hoặc mật khẩu không đúng';
        } else if (errorMessage.includes('Email not confirmed')) {
          errorMessage = 'Vui lòng xác thực email trước khi đăng nhập';
        } else if (errorMessage.includes('Too many requests')) {
          errorMessage = 'Quá nhiều lần thử. Vui lòng thử lại sau';
        }

        return { user: null, session: null, error: errorMessage };
      }

      if (!authData.user || !authData.session) {
        console.error('❌ No user or session returned from auth signin');
        return { user: null, session: null, error: 'Đăng nhập thất bại. Vui lòng thử lại.' };
      }

      console.log('✅ Auth signin successful for user:', authData.user.id);

      // 2. Get user profile from database
      const { data: profileData, error: profileError } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profileData) {
        console.error('❌ Profile not found:', profileError);
        return { user: null, session: null, error: 'Không tìm thấy thông tin người dùng.' };
      }

      // 3. Update last login (with error handling)
      try {
        await supabaseClient
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', authData.user.id);
      } catch (lastLoginError) {
        // Log the error but don't fail the login
        console.warn('⚠️ Could not update last_login:', lastLoginError);
        // Login still succeeds even if last_login update fails
      }

      // 4. Fetch role-specific ID
      let roleSpecificId: { doctor_id?: string; patient_id?: string; admin_id?: string } = {};

      try {
        console.log('🔄 [SupabaseAuth] Fetching role-specific ID for role:', profileData.role, 'profile_id:', profileData.id);

        if (profileData.role === 'doctor') {
          const { data: doctorData, error: doctorError } = await supabaseClient
            .from('doctors')
            .select('doctor_id')
            .eq('profile_id', profileData.id)
            .single();

          console.log('🔄 [SupabaseAuth] Doctor query result:', { doctorData, doctorError });

          if (doctorData && !doctorError) {
            roleSpecificId.doctor_id = doctorData.doctor_id;
            console.log('✅ [SupabaseAuth] Found doctor_id:', doctorData.doctor_id);
          } else {
            console.warn('⚠️ [SupabaseAuth] No doctor found for profile_id:', profileData.id);
          }
        } else if (profileData.role === 'patient') {
          const { data: patientData, error: patientError } = await supabaseClient
            .from('patients')
            .select('patient_id')
            .eq('profile_id', profileData.id)
            .single();

          if (patientData && !patientError) {
            roleSpecificId.patient_id = patientData.patient_id;
            console.log('✅ [SupabaseAuth] Found patient_id:', patientData.patient_id);
          }
        } else if (profileData.role === 'admin') {
          const { data: adminData, error: adminError } = await supabaseClient
            .from('admin')
            .select('admin_id')
            .eq('profile_id', profileData.id)
            .single();

          if (adminData && !adminError) {
            roleSpecificId.admin_id = adminData.admin_id;
            console.log('✅ [SupabaseAuth] Found admin_id:', adminData.admin_id);
          }
        }
      } catch (roleError) {
        console.error('❌ [SupabaseAuth] Error fetching role-specific ID:', roleError);
      }

      // 5. Create HospitalUser object
      const hospitalUser: HospitalUser = {
        id: profileData.id,
        email: profileData.email,
        full_name: profileData.full_name,
        phone_number: profileData.phone_number,
        role: profileData.role,
        is_active: profileData.is_active,
        email_verified: profileData.email_verified,
        phone_verified: profileData.phone_verified,
        profile_data: profileData.profile_data,
        created_at: profileData.created_at,
        updated_at: profileData.updated_at,
        last_login: profileData.last_login,
        ...roleSpecificId
      };

      console.log('✅ Sign in completed successfully for:', credentials.email);
      return {
        user: hospitalUser,
        session: authData.session,
        error: null
      };

    } catch (error) {
      console.error('❌ Unexpected error during signin:', error);
      return {
        user: null,
        session: null,
        error: 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.'
      };
    }
  }

  // Sign out user
  async signOut(): Promise<{ error: string | null }> {
    try {
      console.log('🚪 [SupabaseAuth] Starting sign out process...');
      this.clearUserCache();

      const { error } = await supabaseClient.auth.signOut();

      if (error) {
        console.error('❌ Sign out error:', error);
        return { error: error.message };
      }

      console.log('✅ Sign out successful');
      return { error: null };

    } catch (error) {
      console.error('❌ Unexpected error during signout:', error);
      return { error: 'Đã xảy ra lỗi khi đăng xuất.' };
    }
  }

  // Reset password
  async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      console.log('🔑 [SupabaseAuth] Starting password reset for:', email);

      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        console.error('❌ Password reset error:', error);
        return { error: error.message };
      }

      console.log('✅ Password reset email sent');
      return { error: null };

    } catch (error) {
      console.error('❌ Unexpected error during password reset:', error);
      return { error: 'Đã xảy ra lỗi khi gửi email đặt lại mật khẩu.' };
    }
  }

  // Update password
  async updatePassword(newPassword: string): Promise<{ error: string | null }> {
    try {
      console.log('🔑 [SupabaseAuth] Starting password update...');

      const { error } = await supabaseClient.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('❌ Password update error:', error);
        return { error: error.message };
      }

      console.log('✅ Password updated successfully');
      return { error: null };

    } catch (error) {
      console.error('❌ Unexpected error during password update:', error);
      return { error: 'Đã xảy ra lỗi khi cập nhật mật khẩu.' };
    }
  }

  // Change password with current password verification
  async changePassword(currentPassword: string, newPassword: string): Promise<{ error: string | null }> {
    try {
      console.log('🔑 [SupabaseAuth] Starting password change with verification');

      // First verify current password by attempting to sign in
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        return { error: 'Bạn cần đăng nhập để thay đổi mật khẩu.' };
      }

      // Verify current password
      const { error: signInError } = await supabaseClient.auth.signInWithPassword({
        email: currentUser.email,
        password: currentPassword
      });

      if (signInError) {
        console.error('❌ Current password verification failed:', signInError);
        return { error: 'Mật khẩu hiện tại không đúng.' };
      }

      // Update to new password
      const { error: updateError } = await supabaseClient.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        console.error('❌ Password update error:', updateError);
        return { error: updateError.message };
      }

      console.log('✅ Password changed successfully');
      return { error: null };

    } catch (error) {
      console.error('❌ Unexpected error during password change:', error);
      return { error: 'Đã xảy ra lỗi khi thay đổi mật khẩu.' };
    }
  }

  // Get current session
  async getCurrentSession(): Promise<{ session: Session | null; error: string | null }> {
    try {
      const { data: { session }, error } = await supabaseClient.auth.getSession();

      if (error) {
        console.error('❌ Get session error:', error);
        return { session: null, error: error.message };
      }

      return { session, error: null };

    } catch (error) {
      console.error('❌ Unexpected error getting session:', error);
      return { session: null, error: 'Đã xảy ra lỗi khi lấy thông tin phiên.' };
    }
  }

  // Get current user
  async getCurrentUser(): Promise<AuthResponse> {
    // Return existing promise if one is already running
    if (this.currentUserPromise) {
      console.log('🔄 [getCurrentUser] Returning existing promise');
      return this.currentUserPromise;
    }

    // Create new promise
    this.currentUserPromise = this._getCurrentUserInternal();

    try {
      const result = await this.currentUserPromise;

      // Cache successful results for a short time to avoid rapid re-fetching
      if (result.user && !result.error) {
        console.log('🔄 [getCurrentUser] Caching successful result');
      }

      return result;
    } finally {
      // Clear the promise when done, but with a small delay to prevent rapid re-calls
      setTimeout(() => {
        this.currentUserPromise = null;
      }, 100);
    }
  }

  private async _getCurrentUserInternal(): Promise<AuthResponse> {
    try {
      console.log('🔄 [getCurrentUser] Starting user retrieval...');
      const { data: { user }, error } = await supabaseClient.auth.getUser();

      if (error) {
        console.error('❌ Get user error:', error);
        return { user: null, session: null, error: error.message };
      }

      if (!user) {
        console.log('🔄 [getCurrentUser] No authenticated user found');
        return { user: null, session: null, error: null };
      }

      console.log('🔄 [getCurrentUser] Auth user found, getting profile...');

      // Get user profile from database
      const { data: profileData, error: profileError } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profileData) {
        console.error('❌ Profile not found:', profileError);
        return { user: null, session: null, error: 'Không tìm thấy thông tin người dùng.' };
      }

      console.log('🔄 [getCurrentUser] Profile found:', {
        id: profileData.id,
        role: profileData.role,
        full_name: profileData.full_name
      });

      // Fetch role-specific ID
      let roleSpecificId: { doctor_id?: string; patient_id?: string; admin_id?: string } = {};

      try {
        console.log('🔄 [getCurrentUser] Fetching role-specific ID for role:', profileData.role, 'profile_id:', profileData.id);

        if (profileData.role === 'doctor') {
          const { data: doctorData, error: doctorError } = await supabaseClient
            .from('doctors')
            .select('doctor_id')
            .eq('profile_id', profileData.id)
            .single();

          console.log('🔄 [getCurrentUser] Doctor query result:', { doctorData, doctorError });

          if (doctorData && !doctorError) {
            roleSpecificId.doctor_id = doctorData.doctor_id;
            console.log('✅ [getCurrentUser] Found doctor_id:', doctorData.doctor_id);
          } else {
            console.warn('⚠️ [getCurrentUser] No doctor found for profile_id:', profileData.id);
          }
        } else if (profileData.role === 'patient') {
          const { data: patientData, error: patientError } = await supabaseClient
            .from('patients')
            .select('patient_id')
            .eq('profile_id', profileData.id)
            .single();

          if (patientData && !patientError) {
            roleSpecificId.patient_id = patientData.patient_id;
            console.log('✅ [getCurrentUser] Found patient_id:', patientData.patient_id);
          }
        } else if (profileData.role === 'admin') {
          const { data: adminData, error: adminError } = await supabaseClient
            .from('admin')
            .select('admin_id')
            .eq('profile_id', profileData.id)
            .single();

          if (adminData && !adminError) {
            roleSpecificId.admin_id = adminData.admin_id;
            console.log('✅ [getCurrentUser] Found admin_id:', adminData.admin_id);
          }
        }
      } catch (roleError) {
        console.error('❌ [getCurrentUser] Error fetching role-specific ID:', roleError);
      }

      // Create HospitalUser object
      const hospitalUser: HospitalUser = {
        id: profileData.id,
        email: profileData.email,
        full_name: profileData.full_name,
        phone_number: profileData.phone_number,
        role: profileData.role,
        is_active: profileData.is_active,
        email_verified: profileData.email_verified,
        phone_verified: profileData.phone_verified,
        profile_data: profileData.profile_data,
        created_at: profileData.created_at,
        updated_at: profileData.updated_at,
        last_login: profileData.last_login,
        ...roleSpecificId
      };

      return { user: hospitalUser, session: null, error: null };

    } catch (error) {
      console.error('❌ Unexpected error getting current user:', error);
      return { user: null, session: null, error: 'Đã xảy ra lỗi khi lấy thông tin người dùng.' };
    }
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (user: HospitalUser | null, session: Session | null) => void) {
    return supabaseClient.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 [onAuthStateChange] Auth state changed:', event);

      // Clear previous timeout to debounce rapid changes
      if (this.authStateChangeTimeout) {
        clearTimeout(this.authStateChangeTimeout);
      }

      // Debounce auth state changes by 500ms
      this.authStateChangeTimeout = setTimeout(async () => {
        let hospitalUser: HospitalUser | null = null;

        if (session?.user) {
          hospitalUser = await this.convertToHospitalUser(session.user);
        } else {
          // Clear cache when user logs out
          this.clearUserCache();
        }

        callback(hospitalUser, session);
      }, 500);
    });
  }

  // Private helper methods
  private async convertToHospitalUser(supabaseUser: any): Promise<HospitalUser | null> {
    try {
      console.log('🔄 [convertToHospitalUser] Starting conversion for user ID:', supabaseUser.id)

      // Check cache first
      const cached = this.userCache.get(supabaseUser.id);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log('🔄 [convertToHospitalUser] Returning cached user data');
        return cached.user;
      }

      console.log('🔄 [convertToHospitalUser] Supabase user data:', {
        id: supabaseUser.id,
        email: supabaseUser.email,
        user_metadata: supabaseUser.user_metadata
      });

      // Get user data from profiles table with timeout
      console.log('🔄 [convertToHospitalUser] Querying profiles table...');

      // Create a promise that rejects after 5 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile query timeout')), 5000);
      });

      // Race between the query and timeout
      const queryPromise = supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      const { data: userData, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error || !userData) {
        console.error('🔄 [SupabaseAuth] No profile data found for user:', supabaseUser.id)
        return null;
      }

      console.log('🔄 [SupabaseAuth] Profile data found:', {
        id: userData.id,
        role: userData.role,
        full_name: userData.full_name,
        is_active: userData.is_active
      })

      // Fetch role-specific ID
      let roleSpecificId: { doctor_id?: string; patient_id?: string; admin_id?: string } = {};

      try {
        console.log('🔄 [SupabaseAuth] Fetching role-specific ID for role:', userData.role, 'profile_id:', userData.id);

        if (userData.role === 'doctor') {
          const { data: doctorData, error: doctorError } = await supabaseClient
            .from('doctors')
            .select('doctor_id')
            .eq('profile_id', userData.id)
            .single();

          console.log('🔄 [SupabaseAuth] Doctor query result:', { doctorData, doctorError });

          if (doctorData && !doctorError) {
            roleSpecificId.doctor_id = doctorData.doctor_id;
            console.log('✅ [SupabaseAuth] Found doctor_id:', doctorData.doctor_id);
          } else {
            console.warn('⚠️ [SupabaseAuth] No doctor found for profile_id:', userData.id);
          }
        } else if (userData.role === 'patient') {
          const { data: patientData, error: patientError } = await supabaseClient
            .from('patients')
            .select('patient_id')
            .eq('profile_id', userData.id)
            .single();

          console.log('🔄 [SupabaseAuth] Patient query result:', { patientData, patientError });

          if (patientData && !patientError) {
            roleSpecificId.patient_id = patientData.patient_id;
            console.log('✅ [SupabaseAuth] Found patient_id:', patientData.patient_id);
          }
        } else if (userData.role === 'admin') {
          const { data: adminData, error: adminError } = await supabaseClient
            .from('admin')
            .select('admin_id')
            .eq('profile_id', userData.id)
            .single();

          console.log('🔄 [SupabaseAuth] Admin query result:', { adminData, adminError });

          if (adminData && !adminError) {
            roleSpecificId.admin_id = adminData.admin_id;
            console.log('✅ [SupabaseAuth] Found admin_id:', adminData.admin_id);
          }
        }
      } catch (roleError) {
        console.error('❌ [SupabaseAuth] Error fetching role-specific ID:', roleError);
      }

      const hospitalUser: HospitalUser = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        role: userData.role,
        full_name: userData.full_name,
        phone_number: userData.phone_number,
        is_active: userData.is_active,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
        last_login: userData.last_login,
        email_verified: supabaseUser.email_confirmed_at ? true : false,
        phone_verified: userData.phone_verified,
        profile_data: userData.profile_data,
        ...roleSpecificId
      };

      // Cache the result
      this.userCache.set(supabaseUser.id, {
        user: hospitalUser,
        timestamp: Date.now()
      });

      console.log('🔄 [convertToHospitalUser] Successfully converted and cached hospital user');
      return hospitalUser;

    } catch (error) {
      console.error('❌ Error converting to hospital user:', error);
      return null;
    }
  }

  private async updateLastLogin(authUserId: string): Promise<void> {
    try {
      await supabaseClient
        .from('profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', authUserId);
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  // Add method to clear cache
  public clearUserCache(): void {
    this.userCache.clear();
    console.log('🔄 [SupabaseAuth] User cache cleared');
  }

  // Force refresh current user (bypass cache)
  public async forceRefreshCurrentUser(): Promise<{ user: HospitalUser | null; session: any; error: string | null }> {
    console.log('🔄 [SupabaseAuth] Force refreshing current user...');

    // Clear cache first
    this.clearUserCache();

    // Get current user without cache
    return this.getCurrentUser();
  }
}

// Export singleton instance
export const supabaseAuth = new SupabaseAuthService();

// Export the class for testing purposes
export { SupabaseAuthService };
