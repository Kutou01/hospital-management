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

  // Sign up new user
  async signUp(userData: RegisterData): Promise<AuthResponse> {
    try {
      console.log('🔐 [SupabaseAuth] Starting sign up process for:', userData.email);

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
        return { user: null, session: null, error: authError.message };
      }

      if (!authData.user) {
        console.error('❌ No user returned from auth signup');
        return { user: null, session: null, error: 'Không thể tạo tài khoản. Vui lòng thử lại.' };
      }

      console.log('✅ Auth user created:', authData.user.id);

      // 2. Wait for trigger to create profile automatically
      console.log('🏥 Waiting for trigger to create profile for auth user:', authData.user.id);

      // Wait a bit for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Verify profile was created by trigger
      const { data: profileData, error: profileError } = await supabaseClient
        .from('profiles')
        .select('id, email, full_name, role, phone_number, created_at')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profileData) {
        console.error('❌ Profile not created by trigger:', profileError);
        return { user: null, session: null, error: 'Không thể tạo hồ sơ người dùng. Vui lòng thử lại.' };
      }

      console.log('✅ Profile created by trigger:', profileData);

      // 3. Create role-specific profile data if needed
      if (userData.role === 'doctor' && userData.specialty) {
        console.log('👨‍⚕️ Creating doctor profile for:', authData.user.id);

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

        const { error: doctorError } = await supabaseClient
          .from('doctors')
          .insert({
            profile_id: authData.user.id,
            specialization: userData.specialty,
            license_number: userData.license_number,
            qualification: userData.qualification,
            department_id: departmentId,
          });

        if (doctorError) {
          console.error('❌ Error creating doctor profile:', doctorError);
          // Don't fail the registration, just log the error
        } else {
          console.log('✅ Doctor profile created successfully');
        }
      } else if (userData.role === 'patient') {
        console.log('🏥 Creating patient profile for:', authData.user.id);

        const { error: patientError } = await supabaseClient
          .from('patients')
          .insert({
            profile_id: authData.user.id,
            date_of_birth: userData.date_of_birth,
            gender: userData.gender,
            address: userData.address ? { street: userData.address } : {},
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
        id: profileData.id,
        email: profileData.email,
        full_name: profileData.full_name,
        phone_number: profileData.phone_number,
        role: profileData.role,
        is_active: true,
        email_verified: authData.user.email_confirmed_at ? true : false,
        phone_verified: false,
        created_at: profileData.created_at,
        updated_at: profileData.created_at,
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

      // 3. Update last login
      await supabaseClient
        .from('profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', authData.user.id);

      // 4. Create HospitalUser object
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
        profile_data: userData.profile_data
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
}

// Export singleton instance
export const supabaseAuth = new SupabaseAuthService();

// Export the class for testing purposes
export { SupabaseAuthService };
