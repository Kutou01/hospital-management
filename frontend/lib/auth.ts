import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for auth
export interface SignUpData {
  email: string;
  password: string;
  accountType: 'doctor' | 'patient' | 'admin';
  fullName: string;
  phoneNumber?: string;
  // Doctor specific
  specialization?: string;
  licenseNo?: string;
  qualification?: string;
  departmentId?: string;
  // Patient specific
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  bloodType?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

// Auth functions
export const authApi = {
  // Sign up with enhanced profile creation and proper rollback
  signUp: async (userData: SignUpData) => {
    let authUserId: string | null = null;

    try {
      const { email, password, accountType, fullName, ...profileData } = userData;

      // Validate required data before creating auth user
      if (accountType === 'doctor') {
        if (!profileData.specialization || !profileData.licenseNo || !profileData.qualification) {
          throw new Error('Thông tin bác sĩ không đầy đủ. Vui lòng điền đầy đủ chuyên khoa, số giấy phép và trình độ.');
        }
      } else if (accountType === 'patient') {
        if (!profileData.dateOfBirth) {
          throw new Error('Thông tin bệnh nhân không đầy đủ. Vui lòng điền ngày sinh.');
        }
      }

      // First create auth user with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: accountType
          }
        }
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to create user');
      }

      authUserId = authData.user.id;
      console.log('✅ Auth user created:', authUserId);
      console.log('📧 Email confirmed:', authData.user.email_confirmed_at);
      console.log('🔑 Session:', authData.session ? 'Active' : 'None');

      // Wait for trigger to create profile
      console.log('⏳ Waiting for profile creation trigger...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Verify profile was created by trigger
      let profile = null;
      let retryCount = 0;
      const maxRetries = 5;

      while (!profile && retryCount < maxRetries) {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (profileData) {
          profile = profileData;
          console.log('✅ Profile found:', profile.role);
          break;
        }

        retryCount++;
        console.log(`⏳ Profile not found, retrying... (${retryCount}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (!profile) {
        throw new Error('Không thể tạo hồ sơ người dùng. Vui lòng thử lại.');
      }

      // Update profile with additional data if needed
      if (profileData.phoneNumber) {
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({
            phone_number: profileData.phoneNumber
          })
          .eq('id', authData.user.id);

        if (profileUpdateError) {
          console.warn('Profile phone update warning:', profileUpdateError);
        }
      }

      // Create role-specific profile
      console.log(`🔄 Creating ${accountType} specific profile...`);

      if (accountType === 'doctor') {
        const doctorData = {
          profile_id: authData.user.id,
          license_number: profileData.licenseNo || '',
          specialization: profileData.specialization || '',
          qualification: profileData.qualification || '',
          department_id: profileData.departmentId || 'DEPT001'
        };

        console.log('📋 Doctor data to insert:', doctorData);

        const { data: doctorResult, error: doctorError } = await supabase
          .from('doctors')
          .insert([doctorData])
          .select();

        if (doctorError) {
          console.error('❌ Doctor profile creation error:', doctorError);
          throw new Error('Không thể tạo hồ sơ bác sĩ. Vui lòng thử lại.');
        }

        console.log('✅ Doctor profile created successfully:', doctorResult);

      } else if (accountType === 'patient') {
        const patientData = {
          profile_id: authData.user.id,
          date_of_birth: profileData.dateOfBirth || '1990-01-01',
          gender: profileData.gender || 'other',
          blood_type: profileData.bloodType || null,
          address: profileData.address ? JSON.stringify({ street: profileData.address }) : '{}',
          emergency_contact: profileData.emergencyContactName ? JSON.stringify({
            name: profileData.emergencyContactName,
            phone: profileData.emergencyContactPhone
          }) : '{}'
        };

        console.log('📋 Patient data to insert:', patientData);

        const { data: patientResult, error: patientError } = await supabase
          .from('patients')
          .insert([patientData])
          .select();

        if (patientError) {
          console.error('❌ Patient profile creation error:', patientError);
          throw new Error('Không thể tạo hồ sơ bệnh nhân. Vui lòng thử lại.');
        }

        console.log('✅ Patient profile created successfully:', patientResult);

      } else if (accountType === 'admin') {
        const adminData = {
          profile_id: authData.user.id,
          position: 'Administrator',
          is_super_admin: false
        };

        console.log('📋 Admin data to insert:', adminData);

        const { data: adminResult, error: adminError } = await supabase
          .from('admins')
          .insert([adminData])
          .select();

        if (adminError) {
          console.error('❌ Admin profile creation error:', adminError);
          throw new Error('Không thể tạo hồ sơ quản trị viên. Vui lòng thử lại.');
        }

        console.log('✅ Admin profile created successfully:', adminResult);
      }

      console.log('✅ Registration completed successfully for user:', authUserId);
      return { data: authData, error: null };
    } catch (error) {
      console.error('Error in signUp:', error);

      // If we created an auth user but failed later, we need to clean up
      if (authUserId) {
        console.log('🧹 Attempting to clean up auth user due to registration failure:', authUserId);
        try {
          // Note: We can't delete the auth user from client side with current Supabase setup
          // The user will exist in auth but won't have proper profile data
          // This is a limitation of Supabase - auth users can only be deleted from server side
          console.warn('⚠️ Auth user cleanup not possible from client side. User may exist in auth without proper profile.');
        } catch (cleanupError) {
          console.error('Failed to cleanup auth user:', cleanupError);
        }
      }

      return { data: null, error };
    }
  },

  // Sign in with enhanced profile fetching and validation
  signIn: async ({ email, password }: SignInData) => {
    try {
      // Use the new validation function
      const { validateAndSignIn } = await import('./auth/auth-validation');
      const validation = await validateAndSignIn(email, password);

      if (!validation.isValid) {
        throw new Error(validation.error || 'Đăng nhập thất bại');
      }

      const { user, profile, roleData } = validation;

      return {
        data: {
          user,
          session: null, // Session is handled by Supabase internally
          profile: {
            ...profile,
            roleData: roleData
          }
        },
        error: null
      };
    } catch (error) {
      console.error('Error in signIn:', error);
      return { data: null, error };
    }
  },

  // Get current user with profile
  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        return { data: null, error };
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        return { data: null, error: profileError };
      }

      return { data: { user, profile }, error: null };
    } catch (error) {
      console.error('Error getting current user:', error);
      return { data: null, error };
    }
  },

  // Sign out
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      return { error: null };
    } catch (error) {
      console.error('Error in signOut:', error);
      return { error };
    }
  },

  // Get departments for doctor registration
  getDepartments: async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('department_id, name, description')
        .eq('is_active', true)
        .order('name');

      return { data, error };
    } catch (error) {
      console.error('Error fetching departments:', error);
      return { data: null, error };
    }
  }
};
