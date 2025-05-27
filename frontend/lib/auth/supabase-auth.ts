'use client';

import { supabaseClient } from '../supabase-client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

// Extended User interface with hospital-specific fields
export interface HospitalUser {
  id: string;
  email: string;
  role: 'admin' | 'doctor' | 'patient';
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
  role: 'doctor' | 'patient';
  // Role-specific data
  specialty?: string; // for doctors
  license_number?: string; // for doctors
  date_of_birth?: string; // for patients
  gender?: string;
  address?: string; // for patients
}

// Supabase Auth Service
export class SupabaseAuthService {
  private lastError: string | null = null;

  // Add cache and debounce properties
  private userCache = new Map<string, { user: HospitalUser; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private authStateChangeTimeout: NodeJS.Timeout | null = null;

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
          errorMessage = `Email "${userData.email}" đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.`;
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
      console.log('🏥 Creating user profile for auth user:', authData.user.id);
      const profileId = await this.createUserProfile(authData.user.id, userData);

      if (!profileId) {
        console.error('❌ Failed to create user profile for auth user:', authData.user.id);

        // Use the specific error message if available
        let errorMessage = this.lastError || 'Không thể tạo hồ sơ người dùng. Vui lòng thử lại sau.';

        // Reset the error after using it
        this.lastError = null;

        return { user: null, session: null, error: errorMessage };
      }

      console.log('✅ User profile created successfully with ID:', profileId);

      // 3. Update auth user metadata with profile_id
      const { error: updateError } = await supabaseClient.auth.updateUser({
        data: { profile_id: profileId }
      });

      if (updateError) {
        console.warn('⚠️ Failed to update user metadata:', updateError);
      } else {
        console.log('✅ User metadata updated successfully');
      }

      // 4. Wait for trigger to create profile and verify it exists
      console.log('🔄 Waiting for trigger to create profile...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify profile was created by trigger
      console.log('🔄 Verifying profile creation...');
      const { data: profileData, error: profileError } = await supabaseClient
        .from('profiles')
        .select('id, email, full_name, role')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profileData) {
        console.error('❌ Profile not created by trigger:', profileError);
        return { user: null, session: null, error: 'Không thể tạo hồ sơ người dùng. Vui lòng thử lại.' };
      }

      console.log('✅ Profile created successfully by trigger:', {
        id: profileData.id,
        email: profileData.email,
        full_name: profileData.full_name,
        role: profileData.role
      });

      // For registration, we don't need to convert to HospitalUser immediately
      // Just return the auth data and let the login flow handle the conversion
      console.log('✅ Registration completed successfully');

      console.log('✅ Successfully created user and profile:', {
        id: authData.user.id,
        email: authData.user.email,
        role: profileData.role,
        full_name: profileData.full_name
      });

      // Sign out the user immediately after successful registration
      // This ensures they need to login manually after registration
      console.log('🚪 Signing out user after successful registration...');
      await supabaseClient.auth.signOut();

      // Wait a bit to ensure session is fully cleared
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('✅ User signed out successfully after registration');

      return {
        user: authData.user,
        session: null, // Don't return session to prevent auto-login
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
      console.log('🔐 [SupabaseAuth] Starting sign in process...')

      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      console.log('🔐 [SupabaseAuth] Auth response:', {
        hasUser: !!data.user,
        hasSession: !!data.session,
        error: error?.message
      })

      if (error) {
        console.error('🔐 [SupabaseAuth] Auth error:', error)
        let errorMessage = error.message

        // Translate common errors to Vietnamese
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.'
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Email chưa được xác thực. Vui lòng kiểm tra email và xác thực tài khoản.'
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Quá nhiều lần thử. Vui lòng đợi một lúc rồi thử lại.'
        }

        return { user: null, session: null, error: errorMessage };
      }

      if (!data.user || !data.session) {
        console.error('🔐 [SupabaseAuth] Missing user or session data')
        return { user: null, session: null, error: 'Đăng nhập thất bại. Vui lòng thử lại.' };
      }

      console.log('🔐 [SupabaseAuth] Auth successful, converting to hospital user...')

      // Wait for session to be properly established
      await new Promise(resolve => setTimeout(resolve, 500));

      // Convert to HospitalUser format with retry logic
      let hospitalUser = null;
      let retryCount = 0;
      const maxRetries = 2; // Reduced from 5 to 2

      while (!hospitalUser && retryCount < maxRetries) {
        console.log(`🔐 [SupabaseAuth] Converting user data attempt ${retryCount + 1}/${maxRetries}`)
        hospitalUser = await this.convertToHospitalUser(data.user);
        if (!hospitalUser && retryCount < maxRetries - 1) {
          console.log(`🔐 [SupabaseAuth] Retry ${retryCount + 1}/${maxRetries} to convert user data...`);
          await new Promise(resolve => setTimeout(resolve, 500)); // Reduced from 1000ms to 500ms
        }
        retryCount++;
      }

      if (!hospitalUser) {
        console.error('🔐 [SupabaseAuth] Failed to convert to hospital user after all retries')
        return { user: null, session: null, error: 'Không thể tải thông tin người dùng. Vui lòng thử lại.' };
      }

      console.log('🔐 [SupabaseAuth] Successfully converted to hospital user:', {
        id: hospitalUser.id,
        email: hospitalUser.email,
        role: hospitalUser.role,
        full_name: hospitalUser.full_name
      })

      // Update last login
      await this.updateLastLogin(data.user.id);

      return {
        user: hospitalUser,
        session: data.session,
        error: null
      };

    } catch (error) {
      console.error('🔐 [SupabaseAuth] Sign in error:', error);
      return {
        user: null,
        session: null,
        error: 'Đã xảy ra lỗi không mong muốn trong quá trình đăng nhập'
      };
    }
  }

  // Sign out
  async signOut(): Promise<{ error: string | null }> {
    try {
      console.log('🚪 [SupabaseAuth] Starting sign out process...');
      this.clearUserCache();

      const { error } = await supabaseClient.auth.signOut();

      if (error) {
        console.error('🚪 [SupabaseAuth] Sign out error:', error);
        return { error: error.message };
      }

      console.log('🚪 [SupabaseAuth] Sign out successful');

      // Clear any local storage or session data if needed
      if (typeof window !== 'undefined') {
        // Force redirect to login page
        console.log('🚪 [SupabaseAuth] Redirecting to login page...');
        window.location.href = '/auth/login';
      }

      return { error: null };
    } catch (error) {
      console.error('🚪 [SupabaseAuth] Sign out error:', error);
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
  private async createUserProfile(authUserId: string, userData: RegisterData): Promise<string | null> {
    try {
      console.log('🚀 [createUserProfile] Starting profile creation for auth user:', authUserId);
      console.log('🚀 [createUserProfile] User data:', {
        full_name: userData.full_name,
        role: userData.role,
        phone_number: userData.phone_number,
        specialty: userData.specialty,
        license_number: userData.license_number
      });

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
          console.log('📝 Updating existing profile with phone number...');
          const { error: updateError } = await supabaseClient
            .from('profiles')
            .update({
              phone_number: userData.phone_number || null,
              phone_verified: false
            })
            .eq('id', authUserId);

          if (updateError) {
            console.error('❌ Error updating profile:', updateError);
            return null;
          }

          console.log('✅ Profile updated successfully');
        } else {
          console.error('❌ Profile not created by trigger and manual creation failed');
          return null;
        }
      } else {
        console.log('Profile created manually successfully:', manualProfile);
      }

      // Create role-specific profile
      let profileId = null;
      console.log('🎯 Creating role-specific profile for role:', userData.role);
      console.log('🎯 About to check role and create profile...');

      if (userData.role === 'doctor') {
        console.log('🏥 Starting doctor profile creation...');
        const result = await this.createDoctorProfile(authUserId, userData);
        if (!result.success) {
          console.error('❌ Failed to create doctor profile:', result.error);
          // Store the specific error for later use
          this.lastError = result.error;
          return null;
        }
        profileId = result.profileId;
        console.log('✅ Doctor profile created successfully');
      } else if (userData.role === 'patient') {
        console.log('🏥 Starting patient profile creation...');
        const result = await this.createPatientProfile(authUserId, userData);
        if (!result.success) {
          console.error('❌ Failed to create patient profile:', result.error);
          this.lastError = result.error;
          return null;
        }
        profileId = result.profileId;
        console.log('✅ Patient profile created successfully');
      }

      console.log('🎯 Role-specific profile created with ID:', profileId);
      console.log('🎯 Returning auth user ID:', authUserId);

      return authUserId;
    } catch (error) {
      console.error('Error creating user profile:', error);
      return null;
    }
  }

  private async createDoctorProfile(authUserId: string, userData: RegisterData): Promise<{success: boolean, profileId?: string, error?: string}> {
    try {
      console.log('👨‍⚕️ Creating doctor profile for auth user:', authUserId);
      console.log('👨‍⚕️ Input data:', {
        specialty: userData.specialty,
        license_number: userData.license_number,
        full_name: userData.full_name,
        gender: userData.gender
      });

      const doctorId = `DOC${Math.floor(100000 + Math.random() * 900000)}`;
      console.log('👨‍⚕️ Generated doctor ID:', doctorId);

      // Validate required fields
      if (!userData.specialty) {
        console.error('❌ Specialty is required for doctor profile');
        return { success: false, error: 'Chuyên khoa là bắt buộc cho bác sĩ.' };
      }

      if (!userData.license_number) {
        console.error('❌ License number is required for doctor profile');
        return { success: false, error: 'Số giấy phép hành nghề là bắt buộc cho bác sĩ.' };
      }

      console.log('✅ Required fields validation passed');

      // Get a default department (first available department)
      const { data: departments, error: deptError } = await supabaseClient
        .from('departments')
        .select('department_id')
        .limit(1)
        .single();

      if (deptError || !departments) {
        console.error('❌ Failed to get default department:', deptError);
        return null;
      }

      // Ensure license number is unique by appending short random suffix (max 20 chars total)
      const maxLicenseLength = 20;
      const suffix = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
      const baseLength = maxLicenseLength - suffix.length - 1; // -1 for underscore
      const baseLicense = userData.license_number.substring(0, baseLength);
      const uniqueLicenseNumber = `${baseLicense}_${suffix}`;

      console.log('👨‍⚕️ License number generation:', {
        original: userData.license_number,
        originalLength: userData.license_number.length,
        maxLength: maxLicenseLength,
        suffix: suffix,
        baseLength: baseLength,
        baseLicense: baseLicense,
        final: uniqueLicenseNumber,
        finalLength: uniqueLicenseNumber.length
      });

      // Check required fields for doctors table
      const doctorData = {
        doctor_id: doctorId,
        auth_user_id: authUserId,
        full_name: userData.full_name,
        specialty: userData.specialty,
        license_number: uniqueLicenseNumber,
        gender: userData.gender || 'Male',
        department_id: departments.department_id, // Use first available department
        qualification: 'MD',
        schedule: 'Mon-Fri 9AM-5PM',
        photo_url: null
      };

      console.log('👨‍⚕️ Doctor data to insert:', doctorData);

      const { data, error } = await supabaseClient
        .from('doctors')
        .insert([doctorData])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating doctor profile:', error);
        console.error('❌ Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        console.error('❌ Doctor data that failed to insert:', doctorData);

        // Provide specific error messages based on error type
        let errorMessage = 'Không thể tạo hồ sơ bác sĩ. Vui lòng thử lại.';

        if (error.message.includes('duplicate key')) {
          if (error.message.includes('license_number')) {
            errorMessage = `Số giấy phép "${userData.license_number}" đã tồn tại. Vui lòng sử dụng số giấy phép khác.`;
          } else if (error.message.includes('doctor_id')) {
            errorMessage = 'ID bác sĩ đã tồn tại. Vui lòng thử lại.';
          } else {
            errorMessage = 'Thông tin bác sĩ đã tồn tại trong hệ thống. Vui lòng kiểm tra lại.';
          }
        } else if (error.message.includes('foreign key')) {
          if (error.message.includes('department_id')) {
            errorMessage = `Chuyên khoa "${userData.specialty}" không tồn tại trong hệ thống.`;
          } else {
            errorMessage = 'Thông tin liên kết không hợp lệ. Vui lòng kiểm tra lại.';
          }
        } else if (error.message.includes('not null')) {
          errorMessage = 'Thiếu thông tin bắt buộc. Vui lòng điền đầy đủ thông tin.';
        } else if (error.code === '23505') {
          errorMessage = `Số giấy phép "${userData.license_number}" đã được sử dụng. Vui lòng sử dụng số khác.`;
        }

        return { success: false, error: errorMessage };
      }

      console.log('✅ Doctor profile created successfully:', {
        doctor_id: data.doctor_id,
        auth_user_id: data.auth_user_id,
        full_name: data.full_name,
        specialty: data.specialty
      });
      return { success: true, profileId: doctorId };
    } catch (error) {
      console.error('❌ Exception in createDoctorProfile:', error);
      return { success: false, error: 'Đã xảy ra lỗi không mong muốn khi tạo hồ sơ bác sĩ.' };
    }
  }

  private async createPatientProfile(authUserId: string, userData: RegisterData): Promise<{success: boolean, profileId?: string, error?: string}> {
    try {
      console.log('Creating patient profile for auth user:', authUserId);
      const patientId = `PAT${Math.floor(100000 + Math.random() * 900000)}`;

      // Validate required fields for patients
      if (!userData.date_of_birth) {
        console.error('Date of birth is required for patient profile');
        return { success: false, error: 'Ngày sinh là bắt buộc cho bệnh nhân.' };
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

        let errorMessage = 'Không thể tạo hồ sơ bệnh nhân. Vui lòng thử lại.';

        if (error.message.includes('duplicate key')) {
          errorMessage = 'Thông tin bệnh nhân đã tồn tại trong hệ thống.';
        } else if (error.message.includes('foreign key')) {
          errorMessage = 'Thông tin liên kết không hợp lệ.';
        } else if (error.message.includes('not null')) {
          errorMessage = 'Thiếu thông tin bắt buộc cho bệnh nhân.';
        }

        return { success: false, error: errorMessage };
      }

      console.log('Patient profile created successfully:', data);
      return { success: true, profileId: patientId };
    } catch (error) {
      console.error('Error creating patient profile:', error);
      return { success: false, error: 'Đã xảy ra lỗi không mong muốn khi tạo hồ sơ bệnh nhân.' };
    }
  }

  private async convertToHospitalUser(supabaseUser: SupabaseUser): Promise<HospitalUser | null> {
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

      // Create a promise that rejects after 10 seconds
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

      console.log('🔄 [convertToHospitalUser] Profile query result:', {
        hasData: !!userData,
        error: error?.message,
        errorCode: error?.code,
        userData: userData
      })

      if (error) {
        if (error.code === 'PGRST116') {
          console.error('🔄 [SupabaseAuth] Profile not found for user:', supabaseUser.id)
        } else {
          console.error('🔄 [SupabaseAuth] Error fetching user profile:', error)
        }
        return null;
      }

      if (!userData) {
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
        profile_id: userData.id,
        created_at: userData.created_at,
        last_login: userData.last_login,
        email_verified: supabaseUser.email_confirmed_at ? true : false,
        phone_verified: userData.phone_verified
      };
      
      // Cache the result
      this.userCache.set(supabaseUser.id, {
        user: hospitalUser,
        timestamp: Date.now()
      });
      
      console.log('🔄 [convertToHospitalUser] Successfully converted and cached hospital user');
      console.log('🔄 [convertToHospitalUser] Successfully converted to hospital user:', {
        id: hospitalUser.id,
        email: hospitalUser.email,
        role: hospitalUser.role,
        full_name: hospitalUser.full_name
      })

      console.log('🔄 [convertToHospitalUser] Returning hospital user object');
      return hospitalUser;
    } catch (error) {
      console.error('🔄 [convertToHospitalUser] Error converting to hospital user:', error);
      if (error instanceof Error) {
        console.error('🔄 [convertToHospitalUser] Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
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
  }}export const supabaseAuth = new SupabaseAuthService();

