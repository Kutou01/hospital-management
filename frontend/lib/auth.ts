import { supabaseClient } from './supabase-client';

export const supabase = supabaseClient;

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

      // Update profile with correct role and additional data
      const profileUpdateData: any = {
        role: accountType
      };

      if (profileData.phoneNumber) {
        profileUpdateData.phone_number = profileData.phoneNumber;
      }

      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', authData.user.id);

      if (profileUpdateError) {
        console.error('Profile update error:', profileUpdateError);
        throw new Error('Không thể cập nhật thông tin hồ sơ. Vui lòng thử lại.');
      }

      // Create role-specific profile
      console.log(`🔄 Creating ${accountType} specific profile...`);

      if (accountType === 'doctor') {
        // Generate unique doctor ID
        const doctorId = `DOC${Math.floor(100000 + Math.random() * 900000)}`;

        // Ensure we have a valid department_id
        let departmentId = profileData.departmentId;
        if (!departmentId) {
          // Get the first available department
          const { data: departments } = await supabase
            .from('departments')
            .select('department_id')
            .eq('is_active', true)
            .limit(1);

          if (departments && departments.length > 0) {
            departmentId = departments[0].department_id;
          } else {
            departmentId = null; // Allow null if no departments exist
          }
        }

        const doctorData = {
          doctor_id: doctorId,
          profile_id: authData.user.id,
          license_number: profileData.licenseNo || '',
          specialization: profileData.specialization || '',
          qualification: profileData.qualification || '',
          experience_years: 0,
          consultation_fee: 100.00,
          department_id: departmentId,
          status: 'active',
          bio: `${profileData.specialization} specialist`
        };

        console.log('📋 Doctor data to insert:', doctorData);
        console.log('📋 Profile data received:', profileData);
        console.log('📋 Department ID selected:', departmentId);

        const { data: doctorResult, error: doctorError } = await supabase
          .from('doctors')
          .insert([doctorData])
          .select();

        if (doctorError) {
          console.error('❌ Doctor profile creation error:', doctorError);
          console.error('❌ Error details:', {
            message: doctorError.message,
            details: doctorError.details,
            hint: doctorError.hint,
            code: doctorError.code
          });

          // Rollback: Delete the auth user since doctor profile creation failed
          try {
            console.log('🔄 Rolling back auth user due to doctor profile creation failure...');
            await supabase.auth.admin.deleteUser(authData.user.id);
            console.log('✅ Auth user rollback completed');
          } catch (rollbackError) {
            console.error('❌ Failed to rollback auth user:', rollbackError);
          }

          throw new Error(`Không thể tạo hồ sơ bác sĩ: ${doctorError.message}`);
        }

        console.log('✅ Doctor profile created successfully:', doctorResult);

      } else if (accountType === 'patient') {
        // Generate unique patient ID
        const patientId = `PAT${Math.floor(100000 + Math.random() * 900000)}`;

        const patientData = {
          patient_id: patientId,
          profile_id: authData.user.id,
          date_of_birth: profileData.dateOfBirth || '1990-01-01',
          gender: profileData.gender || 'other',
          blood_type: profileData.bloodType || null,
          address: profileData.address ? JSON.stringify({ street: profileData.address }) : null,
          emergency_contact: profileData.emergencyContactName ? JSON.stringify({
            name: profileData.emergencyContactName,
            phone: profileData.emergencyContactPhone
          }) : null,
          registration_date: new Date().toISOString().split('T')[0],
          status: 'active'
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
        // Generate unique admin ID
        const adminId = `ADM${Math.floor(100000 + Math.random() * 900000)}`;

        const adminData = {
          admin_id: adminId,
          profile_id: authData.user.id,
          position: 'Administrator',
          department: 'Administration',
          hire_date: new Date().toISOString().split('T')[0],
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

      // Sign out the user immediately after successful registration
      // This ensures they need to login manually after registration
      console.log('🚪 Signing out user after successful registration...');
      await supabase.auth.signOut();

      // Wait a bit to ensure session is fully cleared
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('✅ User signed out successfully after registration');

      return { data: { ...authData, session: null }, error: null };
    } catch (error) {
      console.error('Error in signUp:', error);
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
      console.log('🚪 [authApi] Starting sign out process...');

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('🚪 [authApi] Supabase signOut error:', error);
        return { error: error.message };
      }

      console.log('🚪 [authApi] Sign out successful');

      // Clear any local storage if needed
      if (typeof window !== 'undefined') {
        // Clear all Supabase related data
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('sb-ciasxktujslgsdgylimv-auth-token');
        sessionStorage.clear();

        // Clear all localStorage items that start with 'sb-'
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-')) {
            localStorage.removeItem(key);
          }
        });
      }

      return { error: null };
    } catch (error) {
      console.error('🚪 [authApi] Error in signOut:', error);
      return { error: error instanceof Error ? error.message : 'Sign out failed' };
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
