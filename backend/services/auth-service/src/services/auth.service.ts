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
}

export interface AuthResponse {
  user?: any;
  session?: any;
  error?: string;
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

      logger.info('✅ User signup completed successfully', {
        userId: authData.user.id,
        email: authData.user.email,
        role: userData.role
      });

      return {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          full_name: userData.full_name,
          role: userData.role,
          email_confirmed_at: authData.user.email_confirmed_at,
          created_at: authData.user.created_at
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

      return {
        user: {
          id: user.id,
          email: user.email,
          full_name: profile.full_name,
          role: profile.role,
          is_active: profile.is_active
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
        blood_type: null,
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
}
