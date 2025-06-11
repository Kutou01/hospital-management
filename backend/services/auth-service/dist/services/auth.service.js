"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const supabase_1 = require("../config/supabase");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const DEPARTMENT_CODES = {
    'DEPT001': 'CARD',
    'DEPT002': 'NEUR',
    'DEPT003': 'PEDI',
    'DEPT004': 'OBGY',
    'DEPT005': 'INTE',
    'DEPT006': 'SURG',
    'DEPT007': 'ORTH',
    'DEPT008': 'EMER',
    'DEPT009': 'OPHT',
    'DEPT010': 'ENT',
    'DEPT011': 'DERM',
    'DEPT012': 'ICU',
};
class AuthService {
    async generateDoctorId(departmentId) {
        try {
            logger_1.default.info('Generating doctor ID for department:', departmentId);
            const { data: doctorId, error } = await supabase_1.supabaseAdmin
                .rpc('generate_doctor_id', { dept_id: departmentId });
            if (error) {
                logger_1.default.error('Database function error for doctor ID generation:', error);
                const departmentCode = DEPARTMENT_CODES[departmentId] || 'GEN';
                const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
                const timestamp = Date.now().toString().slice(-3);
                const fallbackId = `${departmentCode}-DOC-${yearMonth}-${timestamp}`;
                logger_1.default.warn('Using fallback ID generation:', fallbackId);
                return fallbackId;
            }
            if (!doctorId) {
                throw new Error('Database function returned null doctor ID');
            }
            logger_1.default.info('Generated doctor ID via database function:', { departmentId, doctorId });
            return doctorId;
        }
        catch (error) {
            logger_1.default.error('Error in generateDoctorId:', error);
            throw error;
        }
    }
    async generatePatientId() {
        try {
            logger_1.default.info('Generating patient ID via database function');
            const { data: patientId, error } = await supabase_1.supabaseAdmin
                .rpc('generate_patient_id');
            if (error) {
                logger_1.default.error('Database function error for patient ID generation:', error);
                const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
                const timestamp = Date.now().toString().slice(-3);
                const fallbackId = `PAT-${yearMonth}-${timestamp}`;
                logger_1.default.warn('Using fallback ID generation:', fallbackId);
                return fallbackId;
            }
            if (!patientId) {
                throw new Error('Database function returned null patient ID');
            }
            logger_1.default.info('Generated patient ID via database function:', patientId);
            return patientId;
        }
        catch (error) {
            logger_1.default.error('Error in generatePatientId:', error);
            throw error;
        }
    }
    async generateAdminId() {
        try {
            logger_1.default.info('Generating admin ID via database function');
            const { data: adminId, error } = await supabase_1.supabaseAdmin
                .rpc('generate_admin_id');
            if (error) {
                logger_1.default.error('Database function error for admin ID generation:', error);
                const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
                const timestamp = Date.now().toString().slice(-3);
                const fallbackId = `ADM-${yearMonth}-${timestamp}`;
                logger_1.default.warn('Using fallback ID generation:', fallbackId);
                return fallbackId;
            }
            if (!adminId) {
                throw new Error('Database function returned null admin ID');
            }
            logger_1.default.info('Generated admin ID via database function:', adminId);
            return adminId;
        }
        catch (error) {
            logger_1.default.error('Error in generateAdminId:', error);
            throw error;
        }
    }
    async signUp(userData) {
        let authData = null;
        try {
            const { data: authDataResult, error: authError } = await supabase_1.supabaseAdmin.auth.admin.createUser({
                email: userData.email,
                password: userData.password,
                email_confirm: true,
                user_metadata: {
                    full_name: userData.full_name,
                    role: userData.role
                }
            });
            if (authError) {
                logger_1.default.error('Supabase auth error:', authError);
                return { error: authError.message };
            }
            if (!authDataResult.user) {
                return { error: 'Failed to create user' };
            }
            authData = authDataResult;
            logger_1.default.info('✅ Auth user created successfully', { userId: authData.user.id, email: userData.email });
            const profileData = {
                id: authData.user.id,
                email: userData.email,
                full_name: userData.full_name,
                role: userData.role,
                phone_number: userData.phone_number || null,
                date_of_birth: userData.date_of_birth || null,
                email_verified: true,
                phone_verified: false,
                is_active: true,
                last_login: null,
                login_count: 0,
                created_by: null
            };
            logger_1.default.info('Creating profile with data:', {
                userId: authData.user.id,
                email: userData.email,
                role: userData.role,
                phone_number: userData.phone_number,
                date_of_birth: userData.date_of_birth
            });
            const { error: profileError } = await supabase_1.supabaseAdmin
                .from('profiles')
                .insert(profileData);
            if (profileError) {
                logger_1.default.error('❌ Profile creation error:', profileError);
                throw new Error(`Profile creation failed: ${profileError.message}`);
            }
            logger_1.default.info('✅ Profile created successfully', {
                userId: authData.user.id,
                phone_number: userData.phone_number
            });
            try {
                await this.createRoleSpecificRecord(authData.user.id, userData);
                logger_1.default.info('✅ Role-specific record created successfully', {
                    userId: authData.user.id,
                    role: userData.role
                });
            }
            catch (roleError) {
                logger_1.default.error('❌ Role-specific record creation failed:', roleError);
                throw roleError;
            }
            const { data: signInData, error: signInError } = await supabase_1.supabaseClient.auth.signInWithPassword({
                email: userData.email,
                password: userData.password
            });
            if (signInError) {
                logger_1.default.error('Auto sign-in after signup failed:', signInError);
            }
            logger_1.default.info('✅ User signup completed successfully', {
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
        }
        catch (error) {
            logger_1.default.error('❌ Signup error, performing cleanup:', error);
            if (authData?.user?.id) {
                try {
                    if (userData.role === 'doctor') {
                        await supabase_1.supabaseAdmin.from('doctors').delete().eq('profile_id', authData.user.id);
                    }
                    else if (userData.role === 'patient') {
                        await supabase_1.supabaseAdmin.from('patients').delete().eq('profile_id', authData.user.id);
                    }
                    else if (userData.role === 'admin') {
                        await supabase_1.supabaseAdmin.from('admins').delete().eq('profile_id', authData.user.id);
                    }
                    await supabase_1.supabaseAdmin.from('profiles').delete().eq('id', authData.user.id);
                    await supabase_1.supabaseAdmin.auth.admin.deleteUser(authData.user.id);
                    logger_1.default.info('✅ Cleanup completed successfully');
                }
                catch (cleanupError) {
                    logger_1.default.error('❌ Cleanup error:', cleanupError);
                }
            }
            return { error: error.message || 'Registration failed' };
        }
    }
    async signIn(email, password) {
        try {
            const { data, error } = await supabase_1.supabaseClient.auth.signInWithPassword({
                email,
                password
            });
            if (error) {
                logger_1.default.error('Sign in error:', error);
                return { error: error.message };
            }
            if (!data.user || !data.session) {
                return { error: 'Invalid credentials' };
            }
            const { data: profile, error: profileError } = await supabase_1.supabaseAdmin
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();
            if (profileError) {
                logger_1.default.error('Profile fetch error:', profileError);
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
        }
        catch (error) {
            logger_1.default.error('Sign in service error:', error);
            return { error: 'Internal server error' };
        }
    }
    async signOut(token) {
        try {
            await supabase_1.supabaseClient.auth.setSession({
                access_token: token,
                refresh_token: ''
            });
            const { error } = await supabase_1.supabaseClient.auth.signOut();
            if (error) {
                logger_1.default.error('Sign out error:', error);
                return { error: error.message };
            }
            return { user: null, session: null };
        }
        catch (error) {
            logger_1.default.error('Sign out service error:', error);
            return { error: 'Internal server error' };
        }
    }
    async refreshToken(refreshToken) {
        try {
            const { data, error } = await supabase_1.supabaseClient.auth.refreshSession({
                refresh_token: refreshToken
            });
            if (error) {
                logger_1.default.error('Refresh token error:', error);
                return { error: error.message };
            }
            return {
                session: data.session,
                user: data.user
            };
        }
        catch (error) {
            logger_1.default.error('Refresh token service error:', error);
            return { error: 'Internal server error' };
        }
    }
    async resetPassword(email) {
        try {
            const { error } = await supabase_1.supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: `${process.env.CORS_ORIGIN}/auth/reset-password`
            });
            if (error) {
                logger_1.default.error('Reset password error:', error);
                return { error: error.message };
            }
            return { user: null, session: null };
        }
        catch (error) {
            logger_1.default.error('Reset password service error:', error);
            return { error: 'Internal server error' };
        }
    }
    async verifyToken(token) {
        try {
            const { data: { user }, error } = await supabase_1.supabaseAdmin.auth.getUser(token);
            if (error || !user) {
                return { error: 'Invalid or expired token' };
            }
            const { data: profile, error: profileError } = await supabase_1.supabaseAdmin
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
        }
        catch (error) {
            logger_1.default.error('Verify token service error:', error);
            return { error: 'Internal server error' };
        }
    }
    async createRoleSpecificRecord(userId, userData) {
        try {
            logger_1.default.info(`🔄 Creating ${userData.role} record for user ${userId}`);
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
            logger_1.default.info(`✅ ${userData.role} record created successfully for user ${userId}`);
        }
        catch (error) {
            logger_1.default.error(`❌ Error creating ${userData.role} record:`, {
                userId,
                role: userData.role,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
    async forceRefreshSchemaCache() {
        try {
            await Promise.all([
                supabase_1.supabaseAdmin.from('doctors').select('doctor_id').limit(1),
                supabase_1.supabaseAdmin.from('patients').select('patient_id').limit(1),
                supabase_1.supabaseAdmin.from('profiles').select('id').limit(1)
            ]);
            logger_1.default.info('✅ Schema cache refreshed successfully');
        }
        catch (error) {
            logger_1.default.warn('⚠️ Schema cache refresh failed, continuing anyway:', error);
        }
    }
    async createDoctorRecord(userId, userData) {
        try {
            await this.forceRefreshSchemaCache();
            if (!userData.department_id) {
                throw new Error('Department ID is required for doctor registration');
            }
            const doctorId = await this.generateDoctorId(userData.department_id);
            const timestamp = new Date().toISOString();
            const doctorData = {
                doctor_id: doctorId,
                profile_id: userId,
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
                created_by: null
            };
            logger_1.default.info('Creating doctor record with data:', {
                userId,
                doctorId,
                department_id: userData.department_id,
                phone_number: userData.phone_number
            });
            const { error } = await supabase_1.supabaseFresh
                .from('doctors')
                .insert(doctorData);
            if (error) {
                logger_1.default.error('❌ Doctor record creation error:', {
                    userId,
                    doctorId,
                    error: error.message,
                    code: error.code,
                    details: error.details,
                    doctorData
                });
                throw new Error(`Failed to create doctor record: ${error.message}`);
            }
            logger_1.default.info('✅ Doctor record created successfully', {
                userId,
                doctorId,
                department_id: userData.department_id,
                phone_number: userData.phone_number
            });
        }
        catch (error) {
            logger_1.default.error('❌ Error in createDoctorRecord:', error);
            throw error;
        }
    }
    async createPatientRecord(userId, userData) {
        try {
            await this.forceRefreshSchemaCache();
            const patientId = await this.generatePatientId();
            const timestamp = new Date().toISOString();
            const patientData = {
                patient_id: patientId,
                profile_id: userId,
                gender: userData.gender || 'other',
                blood_type: null,
                address: userData.address || {},
                emergency_contact: userData.emergency_contact || {},
                insurance_info: userData.insurance_info || {},
                medical_history: 'No medical history recorded',
                allergies: [],
                chronic_conditions: [],
                current_medications: {},
                status: 'active',
                created_at: timestamp,
                updated_at: timestamp,
                created_by: null
            };
            logger_1.default.info('Creating patient record with data:', {
                userId,
                patientId,
                phone_number: userData.phone_number
            });
            const { error } = await supabase_1.supabaseFresh
                .from('patients')
                .insert(patientData);
            if (error) {
                logger_1.default.error('❌ Patient record creation error:', {
                    userId,
                    patientId,
                    error: error.message,
                    code: error.code,
                    details: error.details,
                    patientData
                });
                throw new Error(`Failed to create patient record: ${error.message}`);
            }
            logger_1.default.info('✅ Patient record created successfully', {
                userId,
                patientId,
                phone_number: userData.phone_number
            });
        }
        catch (error) {
            logger_1.default.error('❌ Error in createPatientRecord:', error);
            throw error;
        }
    }
    async createAdminRecord(userId, userData) {
        try {
            const adminId = await this.generateAdminId();
            const timestamp = new Date().toISOString();
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
                created_by: null
            };
            logger_1.default.info('Creating admin record with data:', {
                userId,
                adminId,
                phone_number: userData.phone_number
            });
            const { error } = await supabase_1.supabaseAdmin
                .from('admins')
                .insert(adminData);
            if (error) {
                logger_1.default.error('❌ Admin record creation error:', {
                    userId,
                    adminId,
                    error: error.message,
                    code: error.code,
                    details: error.details,
                    adminData
                });
                throw new Error(`Failed to create admin record: ${error.message}`);
            }
            logger_1.default.info('✅ Admin record created successfully', {
                userId,
                adminId,
                phone_number: userData.phone_number
            });
        }
        catch (error) {
            logger_1.default.error('❌ Error in createAdminRecord:', error);
            throw error;
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map