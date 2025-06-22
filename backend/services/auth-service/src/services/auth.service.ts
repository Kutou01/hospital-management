import { supabaseAdmin, supabaseClient, supabaseFresh } from '../config/supabase';
import logger from '@hospital/shared/dist/utils/logger';

// Department code mapping for ID generation
const DEPARTMENT_CODES: Record<string, string> = {
  'DEPT001': 'CARD',  // Tim mạch
  'DEPT002': 'NEUR',  // Thần kinh
  'DEPT003': 'PEDI',  // Nhi
  'DEPT004': 'OBGY',  // Sản phụ khoa
  'DEPT005': 'INTE',  // Nội tổng hợp
  'DEPT006': 'SURG',  // Ngoại tổng hợp
  'DEPT007': 'ORTH',  // Chấn thương chỉnh hình
  'DEPT008': 'EMER',  // Cấp cứu
  'DEPT009': 'OPHT',  // Mắt
  'DEPT010': 'ENT',   // Tai mũi họng
  'DEPT011': 'DERM',  // Da liễu
  'DEPT012': 'ICU',   // Hồi sức cấp cứu
};

export interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'doctor' | 'patient';
  phone_number?: string;
  gender?: 'male' | 'female' | 'other';
  date_of_birth?: string;
  specialty?: string;
  license_number?: string;
  qualification?: string;
  department_id?: string;
  address?: any;
  emergency_contact?: any;
  insurance_info?: any;
  blood_type?: string;
}

export interface AuthResponse {
  user?: {
    id: string;
    email?: string;
    full_name?: string;
    role?: string;
    email_confirmed_at?: string;
    created_at?: string;
    patient_id?: string;  // For patients
    doctor_id?: string;   // For doctors
    admin_id?: string;    // For admins
    phone_number?: string;
    is_active?: boolean;
    last_sign_in_at?: string;
  } | null;
  session?: any;
  error?: string;
  url?: string; // For OAuth redirects
}

export class AuthService {

  /**
   * Generate department-based doctor ID using database function
   * Format: DEPT_CODE-DOC-YYYYMM-XXX
   * Example: CARD-DOC-202506-001
   */
  private async generateDoctorId(departmentId: string): Promise<string> {
    try {
      logger.info('Generating doctor ID for department:', departmentId);

      // Use database function for ID generation (production-ready)
      const { data: doctorId, error } = await supabaseAdmin
        .rpc('generate_doctor_id', { dept_id: departmentId });

      if (error) {
        logger.error('Database function error for doctor ID generation:', error);

        // Fallback to local generation if database function fails
        const departmentCode = DEPARTMENT_CODES[departmentId] || 'GEN';
        const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
        const timestamp = Date.now().toString().slice(-3);
        const fallbackId = `${departmentCode}-DOC-${yearMonth}-${timestamp}`;

        logger.warn('Using fallback ID generation:', fallbackId);
        return fallbackId;
      }

      if (!doctorId) {
        throw new Error('Database function returned null doctor ID');
      }

      logger.info('Generated doctor ID via database function:', { departmentId, doctorId });
      return doctorId;
    } catch (error: any) {
      logger.error('Error in generateDoctorId:', error);
      throw error;
    }
  }

  /**
   * Generate patient ID using database function
   * Format: PAT-YYYYMM-XXX
   * Example: PAT-202506-001
   */
  private async generatePatientId(): Promise<string> {
    try {
      logger.info('Generating patient ID via database function');

      // Use database function for ID generation (production-ready)
      const { data: patientId, error } = await supabaseAdmin
        .rpc('generate_patient_id');

      if (error) {
        logger.error('Database function error for patient ID generation:', error);

        // Fallback to local generation if database function fails
        const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
        const timestamp = Date.now().toString().slice(-3);
        const fallbackId = `PAT-${yearMonth}-${timestamp}`;

        logger.warn('Using fallback ID generation:', fallbackId);
        return fallbackId;
      }

      if (!patientId) {
        throw new Error('Database function returned null patient ID');
      }

      logger.info('Generated patient ID via database function:', patientId);
      return patientId;
    } catch (error: any) {
      logger.error('Error in generatePatientId:', error);
      throw error;
    }
  }

  /**
   * Generate admin ID
   * Format: ADM-YYYYMM-XXX
   * Example: ADM-202506-001
   */
  private async generateAdminId(): Promise<string> {
    try {
      logger.info('Generating admin ID via database function');

      // Use database function for ID generation (production-ready)
      const { data: adminId, error } = await supabaseAdmin
        .rpc('generate_admin_id');

      if (error) {
        logger.error('Database function error for admin ID generation:', error);

        // Fallback to local generation if database function fails
        const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
        const timestamp = Date.now().toString().slice(-3);
        const fallbackId = `ADM-${yearMonth}-${timestamp}`;

        logger.warn('Using fallback ID generation:', fallbackId);
        return fallbackId;
      }

      if (!adminId) {
        throw new Error('Database function returned null admin ID');
      }

      logger.info('Generated admin ID via database function:', adminId);
      return adminId;
    } catch (error: any) {
      logger.error('Error in generateAdminId:', error);
      throw error;
    }
  }

  /**
   * Sign up a new user using Supabase Auth
   */
  public async signUp(userData: SignUpData): Promise<AuthResponse> {
    let authData: any = null;

    try {
      // Create user in Supabase Auth
      const { data: authDataResult, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true, // Auto-confirm email in development
        user_metadata: {
          full_name: userData.full_name,
          role: userData.role
        }
      });

      if (authError) {
        logger.error('Supabase auth error:', authError);
        return { error: authError.message };
      }

      if (!authDataResult.user) {
        return { error: 'Failed to create user' };
      }

      authData = authDataResult;
      logger.info('✅ Auth user created successfully', { userId: authData.user.id, email: userData.email });

      // Create optimized profile with only essential shared fields
      const profileData = {
        id: authData.user.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        phone_number: userData.phone_number || null,
        date_of_birth: userData.date_of_birth || null, // ✅ UPDATED: date_of_birth in profiles (shared)
        email_verified: true, // Auto-verified in development
        phone_verified: false,
        is_active: true,
        last_login: null,
        login_count: 0,
        created_by: null // Self-registered
        // ❌ REMOVED: created_at, updated_at (auto-generated by database)
        // ❌ REMOVED: gender (moved to role tables - doctors/patients)
      };

      logger.info('Creating profile with data:', {
        userId: authData.user.id,
        email: userData.email,
        role: userData.role,
        phone_number: userData.phone_number,
        date_of_birth: userData.date_of_birth
      });

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert(profileData);

      if (profileError) {
        logger.error('❌ Profile creation error:', profileError);
        throw new Error(`Profile creation failed: ${profileError.message}`);
      }

      logger.info('✅ Profile created successfully', {
        userId: authData.user.id,
        phone_number: userData.phone_number
      });

      // Create role-specific record
      try {
        await this.createRoleSpecificRecord(authData.user.id, userData);
        logger.info('✅ Role-specific record created successfully', {
          userId: authData.user.id,
          role: userData.role
        });
      } catch (roleError: any) {
        logger.error('❌ Role-specific record creation failed:', roleError);
        throw roleError; // Re-throw to trigger cleanup in main catch block
      }

      // Sign in the user to get a session
      const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
        email: userData.email,
        password: userData.password
      });

      if (signInError) {
        logger.error('Auto sign-in after signup failed:', signInError);
        // Don't return error here, user can still sign in manually
      }

      // Get role-specific ID after creation with retry mechanism
      let roleSpecificData = {};

      logger.info('🔍 [SignUp] Starting role-specific ID fetch after creation:', {
        role: userData.role,
        profile_id: authData.user.id,
        email: userData.email
      });

      try {
        // Add small delay to ensure record is committed
        await new Promise(resolve => setTimeout(resolve, 200));

        if (userData.role === 'patient') {
          logger.info('🔍 [SignUp] Fetching patient_id after creation for profile:', {
            profile_id: authData.user.id,
            email: userData.email
          });

          const { data: patientData, error: patientError } = await supabaseAdmin
            .from('patients')
            .select('patient_id')
            .eq('profile_id', authData.user.id)
            .single();

          logger.info('🔍 [SignUp] Patient query result:', {
            patientData,
            patientError,
            profile_id: authData.user.id
          });

          if (patientError) {
            logger.warn('⚠️ [SignUp] Patient query error:', {
              error: patientError.message,
              code: patientError.code,
              profile_id: authData.user.id
            });
          }

          if (patientData) {
            logger.info('✅ [SignUp] Patient found after creation:', {
              patient_id: patientData.patient_id,
              profile_id: authData.user.id
            });
            roleSpecificData = { patient_id: patientData.patient_id };
            logger.info('🔍 [SignUp] roleSpecificData set to:', roleSpecificData);
          } else {
            logger.warn('⚠️ [SignUp] No patient data found after creation for profile_id:', authData.user.id);
          }
        } else if (userData.role === 'doctor') {
          logger.info('🔍 [SignUp] Fetching doctor_id after creation for profile:', {
            profile_id: authData.user.id,
            email: userData.email
          });

          const { data: doctorData, error: doctorError } = await supabaseAdmin
            .from('doctors')
            .select('doctor_id')
            .eq('profile_id', authData.user.id)
            .single();

          if (doctorError) {
            logger.warn('⚠️ [SignUp] Doctor query error:', {
              error: doctorError.message,
              code: doctorError.code,
              profile_id: authData.user.id
            });
          }

          if (doctorData) {
            logger.info('✅ [SignUp] Doctor found after creation:', {
              doctor_id: doctorData.doctor_id,
              profile_id: authData.user.id
            });
            roleSpecificData = { doctor_id: doctorData.doctor_id };
          }
        } else if (userData.role === 'admin') {
          logger.info('🔍 [SignUp] Fetching admin_id after creation for profile:', {
            profile_id: authData.user.id,
            email: userData.email
          });

          const { data: adminData, error: adminError } = await supabaseAdmin
            .from('admins')
            .select('admin_id')
            .eq('profile_id', authData.user.id)
            .single();

          if (adminError) {
            logger.warn('⚠️ [SignUp] Admin query error:', {
              error: adminError.message,
              code: adminError.code,
              profile_id: authData.user.id
            });
          }

          if (adminData) {
            logger.info('✅ [SignUp] Admin found after creation:', {
              admin_id: adminData.admin_id,
              profile_id: authData.user.id
            });
            roleSpecificData = { admin_id: adminData.admin_id };
          }
        }
      } catch (roleError: any) {
        logger.error('❌ [SignUp] Error fetching role-specific ID after signup:', {
          error: roleError.message || 'Unknown error',
          stack: roleError.stack || 'No stack trace',
          role: userData.role,
          profile_id: authData.user.id
        });
      }

      logger.info('🔍 [SignUp] Final roleSpecificData before return:', roleSpecificData);

      logger.info('✅ User signup completed successfully', {
        userId: authData.user.id,
        email: authData.user.email,
        role: userData.role,
        roleSpecificData
      });

      return {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          full_name: userData.full_name,
          role: userData.role,
          email_confirmed_at: authData.user.email_confirmed_at,
          created_at: authData.user.created_at,
          ...roleSpecificData
        },
        session: signInData?.session || null
      };

    } catch (error: any) {
      logger.error('❌ Signup error, performing cleanup:', error);

      // Cleanup in reverse order: role-specific record, profile, auth user
      if (authData?.user?.id) {
        try {
          // Clean up role-specific records
          if (userData.role === 'doctor') {
            await supabaseAdmin.from('doctors').delete().eq('profile_id', authData.user.id);
          } else if (userData.role === 'patient') {
            await supabaseAdmin.from('patients').delete().eq('profile_id', authData.user.id);
          } else if (userData.role === 'admin') {
            await supabaseAdmin.from('admins').delete().eq('profile_id', authData.user.id);
          }

          // Clean up profile
          await supabaseAdmin.from('profiles').delete().eq('id', authData.user.id);

          // Clean up auth user
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

          logger.info('✅ Cleanup completed successfully');
        } catch (cleanupError: any) {
          logger.error('❌ Cleanup error:', cleanupError);
        }
      }

      return { error: error.message || 'Registration failed' };
    }
  }

  /**
   * Sign in user using Supabase Auth
   */
  public async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        logger.error('Sign in error:', error);
        return { error: error.message };
      }

      if (!data.user || !data.session) {
        return { error: 'Invalid credentials' };
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        logger.error('Profile fetch error:', profileError);
        return { error: 'User profile not found' };
      }

      if (!profile.is_active) {
        return { error: 'Account is inactive' };
      }

      // Update last_login time
      try {
        await supabaseAdmin.rpc('update_user_login_time', { user_id: data.user.id });
      } catch (updateError) {
        logger.warn('Failed to update last_login time:', updateError);
        // Don't fail the login, just log the warning
      }

      // Get role-specific ID
      let roleSpecificData = {};
      try {
        if (profile.role === 'patient') {
          logger.info('🔍 [SignIn] Fetching patient_id for profile:', {
            profile_id: data.user.id,
            email: data.user.email
          });

          const { data: patientData, error: patientError } = await supabaseAdmin
            .from('patients')
            .select('patient_id')
            .eq('profile_id', data.user.id)
            .single();

          logger.info('🔍 [SignIn] Patient query raw result:', {
            patientData,
            patientError,
            profile_id: data.user.id
          });

          if (patientError) {
            logger.warn('⚠️ [SignIn] Patient query error:', {
              error: patientError.message,
              code: patientError.code,
              profile_id: data.user.id
            });
          }

          if (patientData) {
            logger.info('✅ [SignIn] Patient found:', {
              patient_id: patientData.patient_id,
              profile_id: data.user.id
            });
            roleSpecificData = { patient_id: patientData.patient_id };
            logger.info('🔍 [SignIn] roleSpecificData set to:', roleSpecificData);
          } else {
            logger.warn('⚠️ [SignIn] No patient data found for profile_id:', data.user.id);
          }
        } else if (profile.role === 'doctor') {
          const { data: doctorData } = await supabaseAdmin
            .from('doctors')
            .select('doctor_id')
            .eq('profile_id', data.user.id)
            .single();
          if (doctorData) {
            roleSpecificData = { doctor_id: doctorData.doctor_id };
          }
        } else if (profile.role === 'admin') {
          const { data: adminData } = await supabaseAdmin
            .from('admins')
            .select('admin_id')
            .eq('profile_id', data.user.id)
            .single();
          if (adminData) {
            roleSpecificData = { admin_id: adminData.admin_id };
          }
        }
      } catch (roleError) {
        logger.warn('Could not fetch role-specific ID:', roleError);
      }

      logger.info('🔍 [SignIn] Final roleSpecificData before return:', roleSpecificData);

      const finalUser = {
        id: data.user.id,
        email: data.user.email,
        full_name: profile.full_name,
        role: profile.role,
        phone_number: profile.phone_number,
        is_active: profile.is_active,
        last_sign_in_at: data.user.last_sign_in_at,
        ...roleSpecificData
      };

      logger.info('🔍 [SignIn] Final user object:', finalUser);

      return {
        user: finalUser,
        session: data.session
      };

    } catch (error) {
      logger.error('Sign in service error:', error);
      return { error: 'Internal server error' };
    }
  }

  /**
   * Sign out user
   */
  public async signOut(token: string): Promise<AuthResponse> {
    try {
      // Set the session for the client
      await supabaseClient.auth.setSession({
        access_token: token,
        refresh_token: '' // We don't have refresh token here
      });

      const { error } = await supabaseClient.auth.signOut();

      if (error) {
        logger.error('Sign out error:', error);
        return { error: error.message };
      }

      return { user: null, session: null };

    } catch (error) {
      logger.error('Sign out service error:', error);
      return { error: 'Internal server error' };
    }
  }

  /**
   * Refresh access token
   */
  public async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabaseClient.auth.refreshSession({
        refresh_token: refreshToken
      });

      if (error) {
        logger.error('Refresh token error:', error);
        return { error: error.message };
      }

      return {
        session: data.session,
        user: data.user
      };

    } catch (error) {
      logger.error('Refresh token service error:', error);
      return { error: 'Internal server error' };
    }
  }

  /**
   * Reset password
   */
  public async resetPassword(email: string): Promise<AuthResponse> {
    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.CORS_ORIGIN}/auth/reset-password`
      });

      if (error) {
        logger.error('Reset password error:', error);
        return { error: error.message };
      }

      return { user: null, session: null };

    } catch (error) {
      logger.error('Reset password service error:', error);
      return { error: 'Internal server error' };
    }
  }

  /**
   * Verify JWT token
   */
  public async verifyToken(token: string): Promise<AuthResponse> {
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        return { error: 'Invalid or expired token' };
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        return { error: 'User profile not found' };
      }

      // Get role-specific ID
      let roleSpecificData = {};
      try {
        if (profile.role === 'patient') {
          logger.info('🔍 [VerifyToken] Fetching patient_id for profile:', {
            profile_id: user.id,
            email: user.email
          });

          const { data: patientData, error: patientError } = await supabaseAdmin
            .from('patients')
            .select('patient_id')
            .eq('profile_id', user.id)
            .single();

          if (patientError) {
            logger.warn('⚠️ [VerifyToken] Patient query error:', {
              error: patientError.message,
              code: patientError.code,
              profile_id: user.id
            });
          }

          if (patientData) {
            logger.info('✅ [VerifyToken] Patient found:', {
              patient_id: patientData.patient_id,
              profile_id: user.id
            });
            roleSpecificData = { patient_id: patientData.patient_id };
          } else {
            logger.warn('⚠️ [VerifyToken] No patient data found for profile_id:', user.id);
          }
        } else if (profile.role === 'doctor') {
          const { data: doctorData } = await supabaseAdmin
            .from('doctors')
            .select('doctor_id')
            .eq('profile_id', user.id)
            .single();
          if (doctorData) {
            roleSpecificData = { doctor_id: doctorData.doctor_id };
          }
        } else if (profile.role === 'admin') {
          const { data: adminData } = await supabaseAdmin
            .from('admins')
            .select('admin_id')
            .eq('profile_id', user.id)
            .single();
          if (adminData) {
            roleSpecificData = { admin_id: adminData.admin_id };
          }
        }
      } catch (roleError) {
        logger.warn('Could not fetch role-specific ID:', roleError);
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          full_name: profile.full_name,
          role: profile.role,
          phone_number: profile.phone_number,
          is_active: profile.is_active,
          ...roleSpecificData
        }
      };

    } catch (error) {
      logger.error('Verify token service error:', error);
      return { error: 'Internal server error' };
    }
  }

  /**
   * Create role-specific record (doctor, patient, admin)
   */
  private async createRoleSpecificRecord(userId: string, userData: SignUpData): Promise<void> {
    try {
      logger.info(`🔄 Creating ${userData.role} record for user ${userId}`);

      switch (userData.role) {
        case 'doctor':
          await this.createDoctorRecord(userId, userData);
          break;
        case 'patient':
          await this.createPatientRecord(userId, userData);
          break;
        case 'admin':
          await this.createAdminRecord(userId, userData);
          break;
        default:
          throw new Error(`Invalid role: ${userData.role}. Supported roles: admin, doctor, patient`);
      }

      logger.info(`✅ ${userData.role} record created successfully for user ${userId}`);
    } catch (error: any) {
      logger.error(`❌ Error creating ${userData.role} record:`, {
        userId,
        role: userData.role,
        error: error.message,
        stack: error.stack
      });
      throw error; // Re-throw to handle in signup process
    }
  }

  private async forceRefreshSchemaCache(): Promise<void> {
    try {
      // Force refresh schema cache by making simple queries to all tables
      await Promise.all([
        supabaseAdmin.from('doctors').select('doctor_id').limit(1),
        supabaseAdmin.from('patients').select('patient_id').limit(1),
        supabaseAdmin.from('profiles').select('id').limit(1)
      ]);
      logger.info('✅ Schema cache refreshed successfully');
    } catch (error) {
      logger.warn('⚠️ Schema cache refresh failed, continuing anyway:', error);
    }
  }

  public async createDoctorRecord(userId: string, userData: SignUpData): Promise<void> {
    try {
      // Force refresh schema cache first
      await this.forceRefreshSchemaCache();

      // Validate required fields
      if (!userData.department_id) {
        throw new Error('Department ID is required for doctor registration');
      }

      // Generate department-based doctor ID
      const doctorId = await this.generateDoctorId(userData.department_id);
      const timestamp = new Date().toISOString();

      // Prepare doctor data with ONLY doctor-specific fields (clean design - no duplication)
      const doctorData = {
        doctor_id: doctorId,
        profile_id: userId,
        // ✅ CLEAN DESIGN: NO email, full_name, phone_number - they are in profiles table
        specialty: userData.specialty || 'General Medicine',
        license_number: userData.license_number || 'PENDING',
        qualification: userData.qualification || 'MD',
        department_id: userData.department_id,
        gender: userData.gender || 'other',
        bio: null,
        experience_years: 0,
        consultation_fee: null,
        address: {},
        languages_spoken: ['Vietnamese'],
        availability_status: 'available',
        rating: 0.00,
        total_reviews: 0,
        created_at: timestamp,
        updated_at: timestamp,
        created_by: null // Self-registered
      };

      logger.info('Creating doctor record with data:', {
        userId,
        doctorId,
        department_id: userData.department_id,
        phone_number: userData.phone_number
      });

      const { error } = await supabaseFresh
        .from('doctors')
        .insert(doctorData);

      if (error) {
        logger.error('❌ Doctor record creation error:', {
          userId,
          doctorId,
          error: error.message,
          code: error.code,
          details: error.details,
          doctorData
        });
        throw new Error(`Failed to create doctor record: ${error.message}`);
      }

      logger.info('✅ Doctor record created successfully', {
        userId,
        doctorId,
        department_id: userData.department_id,
        phone_number: userData.phone_number
      });
    } catch (error: any) {
      logger.error('❌ Error in createDoctorRecord:', error);
      throw error;
    }
  }

  public async createPatientRecord(userId: string, userData: SignUpData): Promise<void> {
    try {
      // Force refresh schema cache first
      await this.forceRefreshSchemaCache();

      // Generate month-based patient ID
      const patientId = await this.generatePatientId();
      const timestamp = new Date().toISOString();

      // Prepare patient data with ONLY patient-specific fields (clean design - no duplication)
      const patientData = {
        patient_id: patientId,
        profile_id: userId,
        // ✅ CLEAN DESIGN: NO email, full_name, phone_number, date_of_birth - they are in profiles table
        gender: userData.gender || 'other',
        blood_type: userData.blood_type || null,
        address: userData.address || {},
        emergency_contact: userData.emergency_contact || {},
        insurance_info: userData.insurance_info || {},
        medical_history: 'No medical history recorded', // ✅ ADD: patient-specific field
        allergies: [],
        chronic_conditions: [],
        current_medications: {},
        status: 'active',
        created_at: timestamp,
        updated_at: timestamp,
        created_by: null // Self-registered
      };

      logger.info('Creating patient record with data:', {
        userId,
        patientId,
        phone_number: userData.phone_number
      });

      const { error } = await supabaseFresh
        .from('patients')
        .insert(patientData);

      if (error) {
        logger.error('❌ Patient record creation error:', {
          userId,
          patientId,
          error: error.message,
          code: error.code,
          details: error.details,
          patientData
        });
        throw new Error(`Failed to create patient record: ${error.message}`);
      }

      logger.info('✅ Patient record created successfully', {
        userId,
        patientId,
        phone_number: userData.phone_number
      });
    } catch (error: any) {
      logger.error('❌ Error in createPatientRecord:', error);
      throw error;
    }
  }

  private async createAdminRecord(userId: string, userData: SignUpData): Promise<void> {
    try {
      // Generate month-based admin ID
      const adminId = await this.generateAdminId();
      const timestamp = new Date().toISOString();

      // Prepare admin data with ONLY admin-specific fields (no duplication with profiles)
      const adminData = {
        admin_id: adminId,
        profile_id: userId,
        permissions: ['read', 'write'],
        access_level: 'standard',
        department_access: null,
        can_create_users: false,
        can_modify_system: false,
        status: 'active',
        created_at: timestamp,
        updated_at: timestamp,
        created_by: null // Self-registered
      };

      logger.info('Creating admin record with data:', {
        userId,
        adminId,
        phone_number: userData.phone_number
      });

      const { error } = await supabaseAdmin
        .from('admins')
        .insert(adminData);

      if (error) {
        logger.error('❌ Admin record creation error:', {
          userId,
          adminId,
          error: error.message,
          code: error.code,
          details: error.details,
          adminData
        });
        throw new Error(`Failed to create admin record: ${error.message}`);
      }

      logger.info('✅ Admin record created successfully', {
        userId,
        adminId,
        phone_number: userData.phone_number
      });
    } catch (error: any) {
      logger.error('❌ Error in createAdminRecord:', error);
      throw error;
    }
  }

  /**
   * Send magic link for passwordless login
   */
  public async sendMagicLink(email: string): Promise<AuthResponse> {
    try {
      logger.info('Sending magic link to:', email);

      const { error } = await supabaseClient.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: `${process.env.CORS_ORIGIN}/auth/callback`,
          // You can customize the email template in Supabase dashboard
        }
      });

      if (error) {
        logger.error('Magic link error:', error);
        return { error: error.message };
      }

      logger.info('Magic link sent successfully to:', email);
      return { user: null, session: null };

    } catch (error: any) {
      logger.error('Send magic link service error:', error);
      return { error: 'Internal server error' };
    }
  }

  /**
   * Send OTP to phone number
   */
  public async sendPhoneOTP(phoneNumber: string): Promise<AuthResponse> {
    try {
      logger.info('Sending phone OTP to:', phoneNumber);

      const { error } = await supabaseClient.auth.signInWithOtp({
        phone: phoneNumber,
        options: {
          // You can customize SMS template in Supabase dashboard
        }
      });

      if (error) {
        logger.error('Phone OTP error:', error);
        return { error: error.message };
      }

      logger.info('Phone OTP sent successfully to:', phoneNumber);
      return { user: null, session: null };

    } catch (error: any) {
      logger.error('Send phone OTP service error:', error);
      return { error: 'Internal server error' };
    }
  }

  /**
   * Verify phone OTP and sign in
   */
  public async verifyPhoneOTP(phoneNumber: string, otpCode: string): Promise<AuthResponse> {
    try {
      logger.info('Verifying phone OTP for:', phoneNumber);

      const { data, error } = await supabaseClient.auth.verifyOtp({
        phone: phoneNumber,
        token: otpCode,
        type: 'sms'
      });

      if (error) {
        logger.error('Phone OTP verification error:', error);
        return { error: error.message };
      }

      if (!data.user || !data.session) {
        return { error: 'Invalid OTP code' };
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        logger.error('Profile fetch error after OTP verification:', profileError);
        return { error: 'User profile not found' };
      }

      if (!profile.is_active) {
        return { error: 'Account is inactive' };
      }

      logger.info('Phone OTP verified successfully for:', phoneNumber);

      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          full_name: profile.full_name,
          role: profile.role,
          phone_number: profile.phone_number,
          is_active: profile.is_active,
          last_sign_in_at: data.user.last_sign_in_at
        },
        session: data.session
      };

    } catch (error: any) {
      logger.error('Verify phone OTP service error:', error);
      return { error: 'Internal server error' };
    }
  }

  /**
   * Initiate OAuth login
   */
  public async initiateOAuth(provider: 'google' | 'github' | 'facebook' | 'apple'): Promise<AuthResponse & { url?: string }> {
    try {
      logger.info('Initiating OAuth login with provider:', provider);

      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${process.env.CORS_ORIGIN}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });

      if (error) {
        logger.error('OAuth initiation error:', error);
        return { error: error.message };
      }

      logger.info('OAuth login initiated successfully for provider:', provider);

      return {
        user: null,
        session: null,
        url: data.url
      };

    } catch (error: any) {
      logger.error('Initiate OAuth service error:', error);
      return { error: 'Internal server error' };
    }
  }

  /**
   * Handle OAuth callback
   */
  public async handleOAuthCallback(code: string, state: string, provider?: string): Promise<AuthResponse> {
    try {
      logger.info('Handling OAuth callback for provider:', provider);

      // Exchange code for session
      const { data, error } = await supabaseClient.auth.exchangeCodeForSession(code);

      if (error) {
        logger.error('OAuth callback error:', error);
        return { error: error.message };
      }

      if (!data.user || !data.session) {
        return { error: 'OAuth login failed' };
      }

      // Check if user profile exists, create if not
      let { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create one for OAuth user
        const profileData = {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || 'OAuth User',
          role: 'patient', // Default role for OAuth users
          phone_number: data.user.user_metadata?.phone || null,
          date_of_birth: null,
          email_verified: true,
          phone_verified: false,
          is_active: true,
          last_login: null,
          login_count: 0,
          created_by: null
        };

        const { error: createProfileError } = await supabaseAdmin
          .from('profiles')
          .insert(profileData);

        if (createProfileError) {
          logger.error('Failed to create profile for OAuth user:', createProfileError);
          return { error: 'Failed to create user profile' };
        }

        // Create patient record for OAuth user
        try {
          await this.createPatientRecord(data.user.id, {
            email: data.user.email!,
            password: '', // Not needed for OAuth
            full_name: profileData.full_name,
            role: 'patient'
          });
        } catch (patientError) {
          logger.error('Failed to create patient record for OAuth user:', patientError);
          // Continue anyway, profile is created
        }

        profile = profileData;
      } else if (profileError) {
        logger.error('Profile fetch error after OAuth:', profileError);
        return { error: 'User profile error' };
      }

      if (!profile!.is_active) {
        return { error: 'Account is inactive' };
      }

      logger.info('OAuth login successful for provider:', provider);

      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          full_name: profile!.full_name,
          role: profile!.role,
          phone_number: profile!.phone_number,
          is_active: profile!.is_active,
          last_sign_in_at: data.user.last_sign_in_at
        },
        session: data.session
      };

    } catch (error: any) {
      logger.error('OAuth callback service error:', error);
      return { error: 'Internal server error' };
    }
  }
}
