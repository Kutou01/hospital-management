'use client';

import { supabaseClient } from '../supabase-client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

// Extended User interface with hospital-specific fields
export interface HospitalUser {
  id: string;
  email: string;
  role: 'admin' | 'doctor' | 'patient' | 'nurse' | 'receptionist';
  full_name: string;
  phone_number?: string;
  is_active: boolean;
  profile_id?: string;
  created_at: string;
  last_login?: string;
  email_verified: boolean;
  phone_verified: boolean;
}

// Auth response types
export interface AuthResponse {
  user: HospitalUser | null;
  session: Session | null;
  error: string | null;
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
  // Role-specific data
  specialty?: string; // for doctors
  license_number?: string; // for doctors
  date_of_birth?: string; // for patients
  gender?: string;
  address?: string; // for patients
}

// Supabase Auth Service
export class SupabaseAuthService {

  // Sign up with email and password
  async signUp(userData: RegisterData): Promise<AuthResponse> {
    try {
      // 1. Create auth user in Supabase Auth
      console.log('Attempting to sign up user with data:', {
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        phone_number: userData.phone_number
      });

      const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            role: userData.role,
            phone_number: userData.phone_number || null
          }
        }
      });

      console.log('Supabase auth.signUp response:', { authData, authError });

      if (authError) {
        console.error('Supabase auth error:', authError);
        let errorMessage = authError.message;

        // Translate common Supabase errors to Vietnamese
        if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
          errorMessage = 'Email này đã được đăng ký. Vui lòng sử dụng email khác.';
        } else if (authError.message.includes('Invalid email')) {
          errorMessage = 'Email không hợp lệ. Vui lòng kiểm tra lại.';
        } else if (authError.message.includes('Password')) {
          errorMessage = 'Mật khẩu không đủ mạnh. Vui lòng sử dụng mật khẩu khác.';
        } else if (authError.message.includes('weak password')) {
          errorMessage = 'Mật khẩu quá yếu. Vui lòng sử dụng mật khẩu mạnh hơn.';
        }

        return { user: null, session: null, error: errorMessage };
      }

      if (!authData.user) {
        return { user: null, session: null, error: 'Không thể tạo tài khoản. Vui lòng thử lại.' };
      }

      console.log('Auth user created successfully:', {
        id: authData.user.id,
        email: authData.user.email,
        user_metadata: authData.user.user_metadata,
        raw_user_meta_data: authData.user.user_metadata
      });

      // 2. Create user profile in custom users table
      const profileId = await this.createUserProfile(authData.user.id, userData);

      if (!profileId) {
        // Note: Cannot delete auth user from client side, user will need to be cleaned up manually
        console.error('Failed to create user profile for auth user:', authData.user.id);
        return { user: null, session: null, error: 'Không thể tạo hồ sơ người dùng. Vui lòng thử lại sau.' };
      }

      // 3. Update auth user metadata with profile_id
      const { error: updateError } = await supabaseClient.auth.updateUser({
        data: { profile_id: profileId }
      });

      if (updateError) {
        console.warn('Failed to update user metadata:', updateError);
      }

      // 4. Convert to HospitalUser format
      const hospitalUser = await this.convertToHospitalUser(authData.user);

      return {
        user: hospitalUser,
        session: authData.session,
        error: null
      };

    } catch (error) {
      console.error('Sign up error:', error);
      let errorMessage = 'Đã xảy ra lỗi không mong muốn trong quá trình đăng ký';

      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet và thử lại.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Quá thời gian chờ. Vui lòng thử lại.';
        }
      }

      return {
        user: null,
        session: null,
        error: errorMessage
      };
    }
  }

  // Sign in with email and password
  async signIn(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) {
        return { user: null, session: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, session: null, error: 'Login failed' };
      }

      // Convert to HospitalUser format
      const hospitalUser = await this.convertToHospitalUser(data.user);

      // Update last login
      await this.updateLastLogin(data.user.id);

      return {
        user: hospitalUser,
        session: data.session,
        error: null
      };

    } catch (error) {
      console.error('Sign in error:', error);
      return {
        user: null,
        session: null,
        error: 'An unexpected error occurred during login'
      };
    }
  }

  // Sign out
  async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabaseClient.auth.signOut();
      return { error: error?.message || null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: 'An unexpected error occurred during logout' };
    }
  }

  // Get current session
  async getCurrentSession(): Promise<{ session: Session | null; user: HospitalUser | null }> {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();

      if (!session?.user) {
        return { session: null, user: null };
      }

      const hospitalUser = await this.convertToHospitalUser(session.user);

      return { session, user: hospitalUser };
    } catch (error) {
      console.error('Get session error:', error);
      return { session: null, user: null };
    }
  }

  // Reset password
  async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      return { error: error?.message || null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error: 'An unexpected error occurred' };
    }
  }

  // Update password
  async updatePassword(newPassword: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabaseClient.auth.updateUser({
        password: newPassword
      });

      return { error: error?.message || null };
    } catch (error) {
      console.error('Update password error:', error);
      return { error: 'An unexpected error occurred' };
    }
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (user: HospitalUser | null, session: Session | null) => void) {
    return supabaseClient.auth.onAuthStateChange(async (_event, session) => {
      let hospitalUser: HospitalUser | null = null;

      if (session?.user) {
        hospitalUser = await this.convertToHospitalUser(session.user);
      }

      callback(hospitalUser, session);
    });
  }

  // Private helper methods
  private async createUserProfile(authUserId: string, userData: RegisterData): Promise<string | null> {
    try {
      console.log('Creating user profile for auth user:', authUserId);

      // First, try to create profile manually (in case trigger doesn't work)
      const { data: manualProfile, error: manualError } = await supabaseClient
        .from('profiles')
        .insert([{
          id: authUserId,
          full_name: userData.full_name,
          role: userData.role,
          phone_number: userData.phone_number || null,
          phone_verified: false,
          email_verified: false,
          is_active: true
        }])
        .select()
        .single();

      if (manualError) {
        console.log('Manual profile creation failed, checking if trigger created it:', manualError);

        // Wait a bit for the trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check if profile was created by trigger with retry logic
        let existingProfile = null;
        let retryCount = 0;
        const maxRetries = 3;

        while (!existingProfile && retryCount < maxRetries) {
          const { data, error: fetchError } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', authUserId)
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error checking existing profile:', fetchError);
            if (retryCount === maxRetries - 1) {
              return null;
            }
          } else if (data) {
            existingProfile = data;
            break;
          }

          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`Profile not found, retrying... (${retryCount}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        if (existingProfile) {
          // Update existing profile with additional data
          const { error: updateError } = await supabaseClient
            .from('profiles')
            .update({
              phone_number: userData.phone_number || null,
              phone_verified: false
            })
            .eq('id', authUserId);

          if (updateError) {
            console.error('Error updating profile:', updateError);
            return null;
          }

          console.log('Profile updated successfully');
        } else {
          console.error('Profile not created by trigger and manual creation failed');
          return null;
        }
      } else {
        console.log('Profile created manually successfully:', manualProfile);
      }

      // Create role-specific profile
      let profileId = null;
      console.log('Creating role-specific profile for role:', userData.role);

      if (userData.role === 'doctor') {
        profileId = await this.createDoctorProfile(authUserId, userData);
        if (!profileId) {
          console.error('Failed to create doctor profile');
          return null;
        }
      } else if (userData.role === 'patient') {
        profileId = await this.createPatientProfile(authUserId, userData);
        if (!profileId) {
          console.error('Failed to create patient profile');
          return null;
        }
      }

      console.log('Role-specific profile created with ID:', profileId);

      return authUserId;
    } catch (error) {
      console.error('Error creating user profile:', error);
      return null;
    }
  }

  private async createDoctorProfile(authUserId: string, userData: RegisterData): Promise<string | null> {
    try {
      console.log('Creating doctor profile for auth user:', authUserId);
      const doctorId = `DOC${Math.floor(100000 + Math.random() * 900000)}`;

      // Validate required fields
      if (!userData.specialty) {
        console.error('Specialty is required for doctor profile');
        return null;
      }

      if (!userData.license_number) {
        console.error('License number is required for doctor profile');
        return null;
      }

      // Check required fields for doctors table
      const doctorData = {
        doctor_id: doctorId,
        auth_user_id: authUserId,
        full_name: userData.full_name,
        specialty: userData.specialty,
        license_number: userData.license_number,
        gender: userData.gender || 'Male',
        department_id: null, // Allow null if not required
        qualification: 'MD',
        schedule: 'Mon-Fri 9AM-5PM',
        photo_url: null
      };

      console.log('Doctor data to insert:', doctorData);

      const { data, error } = await supabaseClient
        .from('doctors')
        .insert([doctorData])
        .select()
        .single();

      if (error) {
        console.error('Error creating doctor profile:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        console.error('Doctor data that failed to insert:', doctorData);
        return null;
      }

      console.log('Doctor profile created successfully:', data);
      return doctorId;
    } catch (error) {
      console.error('Error creating doctor profile:', error);
      return null;
    }
  }

  private async createPatientProfile(authUserId: string, userData: RegisterData): Promise<string | null> {
    try {
      console.log('Creating patient profile for auth user:', authUserId);
      const patientId = `PAT${Math.floor(100000 + Math.random() * 900000)}`;

      // Validate required fields for patients
      if (!userData.date_of_birth) {
        console.error('Date of birth is required for patient profile');
        return null;
      }

      // Prepare patient data with all required fields
      const patientData = {
        patient_id: patientId,
        auth_user_id: authUserId,
        full_name: userData.full_name,
        dateofbirth: userData.date_of_birth,
        gender: userData.gender || 'Male',
        address: userData.address || '',
        registration_date: new Date().toISOString().split('T')[0],
        // Add any other required fields with defaults
        blood_type: null,
        allergies: null,
        chronic_diseases: null,
        insurance_info: null
      };

      console.log('Patient data to insert:', patientData);

      const { data, error } = await supabaseClient
        .from('patients')
        .insert([patientData])
        .select()
        .single();

      if (error) {
        console.error('Error creating patient profile:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        console.error('Patient data that failed to insert:', patientData);
        return null;
      }

      console.log('Patient profile created successfully:', data);
      return patientId;
    } catch (error) {
      console.error('Error creating patient profile:', error);
      return null;
    }
  }

  private async convertToHospitalUser(supabaseUser: SupabaseUser): Promise<HospitalUser | null> {
    try {
      // Get user data from profiles table
      const { data: userData, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error || !userData) {
        console.error('Error fetching user data:', error);
        return null;
      }

      return {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        role: userData.role,
        full_name: userData.full_name,
        phone_number: userData.phone_number,
        is_active: userData.is_active,
        profile_id: userData.id, // Use the auth user id as profile_id
        created_at: userData.created_at,
        last_login: userData.last_login,
        email_verified: supabaseUser.email_confirmed_at ? true : false,
        phone_verified: userData.phone_verified
      };
    } catch (error) {
      console.error('Error converting to hospital user:', error);
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
}

// Export singleton instance
export const supabaseAuth = new SupabaseAuthService();
