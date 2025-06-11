// =====================================================
// ENHANCED AUTHENTICATION - PRODUCTION READY
// =====================================================
// Purpose: Fixed registration with new database structure
// Features: Email/phone verification, unified ID system
// =====================================================

import { supabaseClient, supabaseAdmin } from '../supabase-client';
import logger from '../utils/logger';

export interface EnhancedRegisterData {
  email: string;
  password: string;
  full_name: string;
  phone_number?: string;
  role: 'doctor' | 'patient' | 'admin';
  
  // Doctor specific
  specialty?: string;
  license_number?: string;
  qualification?: string;
  department_id?: string;
  
  // Patient specific
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  
  // Admin specific
  permissions?: string[];
}

export interface AuthResponse {
  success: boolean;
  user?: any;
  profile?: any;
  error?: string;
  verification_required?: boolean;
}

export class EnhancedAuth {
  
  /**
   * Enhanced registration with production-ready features
   */
  static async register(userData: EnhancedRegisterData): Promise<AuthResponse> {
    try {
      console.log('🚀 Starting enhanced registration for:', userData.email);

      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            role: userData.role
          }
        }
      });

      if (authError) {
        console.error('❌ Auth creation failed:', authError);
        return { 
          success: false, 
          error: `Không thể tạo tài khoản: ${authError.message}` 
        };
      }

      if (!authData.user) {
        return { 
          success: false, 
          error: 'Không thể tạo tài khoản người dùng' 
        };
      }

      console.log('✅ Auth user created:', authData.user.id);

      // Step 2: Create enhanced profile
      const profileResult = await this.createEnhancedProfile(authData.user.id, userData);
      
      if (!profileResult.success) {
        // Cleanup auth user if profile creation fails
        await supabaseClient.auth.admin.deleteUser(authData.user.id);
        return profileResult;
      }

      // Step 3: Create role-specific record
      const roleResult = await this.createRoleSpecificRecord(authData.user.id, userData);
      
      if (!roleResult.success) {
        // Cleanup if role creation fails
        await this.cleanupFailedRegistration(authData.user.id);
        return roleResult;
      }

      // Step 4: Send verification email (if enabled)
      if (process.env.NEXT_PUBLIC_ENABLE_EMAIL_VERIFICATION === 'true') {
        await this.sendVerificationEmail(userData.email);
      }

      console.log('🎉 Enhanced registration completed successfully!');
      
      return {
        success: true,
        user: authData.user,
        profile: profileResult.profile,
        verification_required: !authData.user.email_confirmed_at
      };

    } catch (error: any) {
      console.error('💥 Enhanced registration failed:', error);
      return { 
        success: false, 
        error: `Lỗi hệ thống: ${error.message}` 
      };
    }
  }

  /**
   * Create enhanced profile with new fields
   */
  private static async createEnhancedProfile(userId: string, userData: EnhancedRegisterData) {
    try {
      console.log('📝 Creating enhanced profile for:', userId);

      const profileData = {
        id: userId,
        email: userData.email,
        full_name: userData.full_name,
        phone_number: userData.phone_number,
        role: userData.role,
        
        // ✅ NEW: Enhanced fields
        email_verified: false,
        phone_verified: false,
        login_count: 0,
        is_active: true,
        
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (profileError) {
        console.error('❌ Profile creation failed:', profileError);
        return { 
          success: false, 
          error: `Không thể tạo hồ sơ: ${profileError.message}` 
        };
      }

      console.log('✅ Enhanced profile created successfully');
      return { success: true, profile };

    } catch (error: any) {
      console.error('💥 Profile creation error:', error);
      return { 
        success: false, 
        error: `Lỗi tạo hồ sơ: ${error.message}` 
      };
    }
  }

  /**
   * Create role-specific record with unified ID system
   */
  private static async createRoleSpecificRecord(userId: string, userData: EnhancedRegisterData) {
    try {
      console.log(`👤 Creating ${userData.role} record for:`, userId);

      if (userData.role === 'doctor') {
        return await this.createDoctorRecord(userId, userData);
      } else if (userData.role === 'patient') {
        return await this.createPatientRecord(userId, userData);
      } else if (userData.role === 'admin') {
        return await this.createAdminRecord(userId, userData);
      }

      return { success: false, error: 'Invalid role specified' };

    } catch (error: any) {
      console.error('💥 Role record creation error:', error);
      return { 
        success: false, 
        error: `Lỗi tạo hồ sơ ${userData.role}: ${error.message}` 
      };
    }
  }

  /**
   * Create doctor record with department-based ID
   */
  private static async createDoctorRecord(userId: string, userData: EnhancedRegisterData) {
    try {
      // Generate department-based doctor ID using database function
      const { data: doctorId, error: idError } = await supabaseClient
        .rpc('generate_doctor_id', { dept_id: userData.department_id || 'DEPT001' });

      if (idError || !doctorId) {
        throw new Error(`ID generation failed: ${idError?.message}`);
      }

      const doctorData = {
        doctor_id: doctorId,
        profile_id: userId,
        specialty: userData.specialty || 'General Medicine',
        license_number: userData.license_number,
        qualification: userData.qualification,
        department_id: userData.department_id || 'DEPT001',
        gender: userData.gender || 'other',
        status: 'active',
        is_available: true,
        experience_years: 0,
        working_hours: {},
        languages_spoken: ['Vietnamese'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: doctor, error: doctorError } = await supabaseClient
        .from('doctors')
        .insert(doctorData)
        .select()
        .single();

      if (doctorError) {
        throw new Error(`Doctor creation failed: ${doctorError.message}`);
      }

      console.log('✅ Doctor record created with ID:', doctorId);
      return { success: true, record: doctor };

    } catch (error: any) {
      console.error('❌ Doctor record creation failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create patient record with standard ID
   */
  private static async createPatientRecord(userId: string, userData: EnhancedRegisterData) {
    try {
      // Generate patient ID using database function
      const { data: patientId, error: idError } = await supabaseClient
        .rpc('generate_patient_id');

      if (idError || !patientId) {
        throw new Error(`ID generation failed: ${idError?.message}`);
      }

      const patientData = {
        patient_id: patientId,
        profile_id: userId,
        // ✅ CLEAN DESIGN: NO date_of_birth - it's in profiles table
        gender: userData.gender || 'other',
        address: userData.address ? { street: userData.address } : {},
        emergency_contact: {},
        insurance_info: {},
        medical_history: 'No medical history recorded',
        allergies: [],
        chronic_conditions: [],
        current_medications: {},
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: patient, error: patientError } = await supabaseClient
        .from('patients')
        .insert(patientData)
        .select()
        .single();

      if (patientError) {
        throw new Error(`Patient creation failed: ${patientError.message}`);
      }

      console.log('✅ Patient record created with ID:', patientId);
      return { success: true, record: patient };

    } catch (error: any) {
      console.error('❌ Patient record creation failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create admin record
   */
  private static async createAdminRecord(userId: string, userData: EnhancedRegisterData) {
    try {
      // Generate admin ID using database function
      const { data: adminId, error: idError } = await supabaseClient
        .rpc('generate_admin_id');

      if (idError || !adminId) {
        throw new Error(`ID generation failed: ${idError?.message}`);
      }

      const adminData = {
        admin_id: adminId,
        profile_id: userId,
        permissions: userData.permissions || ['read'],
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: admin, error: adminError } = await supabaseClient
        .from('admins')
        .insert(adminData)
        .select()
        .single();

      if (adminError) {
        throw new Error(`Admin creation failed: ${adminError.message}`);
      }

      console.log('✅ Admin record created with ID:', adminId);
      return { success: true, record: admin };

    } catch (error: any) {
      console.error('❌ Admin record creation failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send verification email
   */
  private static async sendVerificationEmail(email: string) {
    try {
      const { error } = await supabaseClient.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) {
        console.error('⚠️ Verification email failed:', error);
      } else {
        console.log('📧 Verification email sent to:', email);
      }
    } catch (error) {
      console.error('💥 Verification email error:', error);
    }
  }

  /**
   * Cleanup failed registration
   */
  private static async cleanupFailedRegistration(userId: string) {
    try {
      // Delete profile if exists
      await supabaseClient.from('profiles').delete().eq('id', userId);
      
      // Delete auth user
      await supabaseClient.auth.admin.deleteUser(userId);
      
      console.log('🧹 Cleaned up failed registration for:', userId);
    } catch (error) {
      console.error('⚠️ Cleanup failed:', error);
    }
  }

  /**
   * Enhanced sign in with session tracking
   */
  static async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error || !data.user) {
        return { success: false, error: 'Invalid credentials' };
      }

      // Update login tracking
      await this.updateLoginTracking(data.user.id);

      return { success: true, user: data.user };

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update login tracking
   */
  private static async updateLoginTracking(userId: string) {
    try {
      await supabaseClient
        .from('profiles')
        .update({
          last_login: new Date().toISOString(),
          login_count: supabaseClient.raw('login_count + 1')
        })
        .eq('id', userId);
    } catch (error) {
      console.error('⚠️ Login tracking update failed:', error);
    }
  }
}
