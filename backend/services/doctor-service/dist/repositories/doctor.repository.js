"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorRepository = void 0;
const database_config_1 = require("../config/database.config");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
class DoctorRepository {
    constructor() {
        this.supabase = database_config_1.supabaseAdmin;
    }
    async findById(doctorId) {
        try {
            const { data, error } = await this.supabase
                .from('doctors')
                .select(`
          *,
          profiles!inner(
            full_name,
            phone_number,
            email
          ),
          departments!inner(
            name,
            description,
            location
          )
        `)
                .eq('doctor_id', doctorId)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                logger_1.default.error('Database query error in findById:', error);
                return null;
            }
            if (!data) {
                return null;
            }
            const doctor = {
                ...data,
                full_name: data.profiles.full_name,
                email: data.profiles.email,
                phone_number: data.profiles.phone_number,
                department_name: data.departments.name,
                department_description: data.departments.description,
                department_location: data.departments.location
            };
            delete doctor.profiles;
            delete doctor.departments;
            return this.mapSupabaseDoctorToDoctor(doctor);
        }
        catch (error) {
            logger_1.default.error('Error finding doctor by ID', { error, doctorId });
            throw error;
        }
    }
    async findByProfileId(profileId) {
        try {
            const { data, error } = await this.supabase
                .from('doctors')
                .select(`
          *,
          profiles!inner(
            full_name,
            email,
            phone_number,
            date_of_birth
          ),
          departments!inner(
            name,
            description,
            location
          )
        `)
                .eq('profile_id', profileId)
                .eq('is_active', true)
                .single();
            if (error) {
                logger_1.default.error('Database error in findByProfileId:', error);
                return null;
            }
            if (!data) {
                return null;
            }
            const doctor = {
                ...data,
                full_name: data.profiles.full_name,
                email: data.profiles.email,
                phone_number: data.profiles.phone_number,
                date_of_birth: data.profiles.date_of_birth,
                department_name: data.departments.name,
                department_description: data.departments.description,
                department_location: data.departments.location
            };
            delete doctor.profiles;
            delete doctor.departments;
            return this.mapSupabaseDoctorToDoctor(doctor);
        }
        catch (error) {
            logger_1.default.error('Error finding doctor by profile ID', { error, profileId });
            throw error;
        }
    }
    async findByEmail(email) {
        try {
            const { data, error } = await this.supabase
                .rpc('get_doctor_by_email', { doctor_email: email });
            if (error) {
                logger_1.default.error('Database function error in findByEmail:', error);
                return null;
            }
            if (!data) {
                return null;
            }
            const doctorData = Array.isArray(data) ? data[0] : data;
            if (!doctorData) {
                return null;
            }
            return this.mapSupabaseDoctorToDoctor(doctorData);
        }
        catch (error) {
            logger_1.default.error('Error finding doctor by email', { error, email });
            throw error;
        }
    }
    async findAll(limit = 50, offset = 0) {
        try {
            const { data, error } = await this.supabase
                .from('doctors')
                .select(`
          *,
          profiles!inner(
            full_name,
            phone_number
          )
        `)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);
            if (error) {
                logger_1.default.error('Database query error in findAll:', error);
                throw error;
            }
            if (!data || data.length === 0) {
                return [];
            }
            return data.map((doctor) => this.mapSupabaseDoctorToDoctor(doctor));
        }
        catch (error) {
            logger_1.default.error('Error finding all doctors', { error, limit, offset });
            throw error;
        }
    }
    async findByDepartment(departmentId, limit = 50, offset = 0) {
        try {
            const { data, error } = await this.supabase
                .from('doctors')
                .select(`
          *,
          profiles!inner(
            full_name,
            phone_number
          )
        `)
                .eq('department_id', departmentId)
                .order('rating', { ascending: false })
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);
            if (error) {
                logger_1.default.error('Database query error in findByDepartment:', error);
                throw error;
            }
            if (!data || data.length === 0) {
                return [];
            }
            return data.map((doctor) => this.mapSupabaseDoctorToDoctor(doctor));
        }
        catch (error) {
            logger_1.default.error('Error finding doctors by department', { error, departmentId, limit, offset });
            throw error;
        }
    }
    async findByDepartmentWithCount(departmentId, limit = 20, offset = 0) {
        try {
            const { data, count, error } = await this.supabase
                .from('doctors')
                .select(`
          *,
          profiles!inner(
            full_name,
            phone_number
          )
        `, { count: 'exact' })
                .eq('department_id', departmentId)
                .order('rating', { ascending: false })
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);
            if (error) {
                logger_1.default.error('Database query error in findByDepartmentWithCount:', error);
                throw error;
            }
            const doctors = data ? data.map((doctor) => this.mapSupabaseDoctorToDoctor(doctor)) : [];
            logger_1.default.info('Successfully fetched doctors by department with count:', {
                departmentId,
                doctorCount: doctors.length,
                total: count,
                limit,
                offset
            });
            return {
                doctors,
                total: count || 0
            };
        }
        catch (error) {
            logger_1.default.error('Error finding doctors by department with count', { error, departmentId, limit, offset });
            throw error;
        }
    }
    async findBySpecialty(specialty, limit = 50, offset = 0) {
        try {
            const { data, error } = await this.supabase
                .rpc('get_doctors_by_specialty', {
                doctor_specialty: specialty,
                limit_count: limit,
                offset_count: offset
            });
            if (error) {
                logger_1.default.error('Database function error in findBySpecialty:', error);
                throw error;
            }
            if (!data || data.length === 0) {
                return [];
            }
            return data.map((doctor) => this.mapSupabaseDoctorToDoctor(doctor));
        }
        catch (error) {
            logger_1.default.error('Error finding doctors by specialty', { error, specialty, limit, offset });
            throw error;
        }
    }
    async search(query, limit = 50, offset = 0) {
        try {
            let queryBuilder = this.supabase
                .from('doctors')
                .select(`
          *,
          profiles!inner(
            full_name,
            phone_number
          )
        `)
                .range(offset, offset + limit - 1);
            if (query.specialty) {
                queryBuilder = queryBuilder.ilike('specialty', `%${query.specialty}%`);
            }
            if (query.department_id) {
                queryBuilder = queryBuilder.eq('department_id', query.department_id);
            }
            if (query.gender) {
                queryBuilder = queryBuilder.eq('gender', query.gender);
            }
            if (query.availability_status) {
                queryBuilder = queryBuilder.eq('availability_status', query.availability_status);
            }
            if (query.min_rating !== undefined) {
                queryBuilder = queryBuilder.gte('rating', query.min_rating);
            }
            if (query.max_consultation_fee !== undefined) {
                queryBuilder = queryBuilder.lte('consultation_fee', query.max_consultation_fee);
            }
            if (query.experience_years !== undefined) {
                queryBuilder = queryBuilder.gte('experience_years', query.experience_years);
            }
            if (query.languages) {
                queryBuilder = queryBuilder.contains('languages_spoken', [query.languages]);
            }
            if (query.search) {
                const searchTerm = query.search.toLowerCase();
                queryBuilder = queryBuilder.or(`specialty.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%,qualification.ilike.%${searchTerm}%,license_number.ilike.%${searchTerm}%`);
            }
            const sortBy = query.sort_by || 'rating';
            const sortOrder = query.sort_order === 'asc' ? true : false;
            switch (sortBy) {
                case 'rating':
                    queryBuilder = queryBuilder.order('rating', { ascending: sortOrder });
                    break;
                case 'experience_years':
                    queryBuilder = queryBuilder.order('experience_years', { ascending: sortOrder });
                    break;
                case 'consultation_fee':
                    queryBuilder = queryBuilder.order('consultation_fee', { ascending: sortOrder });
                    break;
                case 'total_reviews':
                    queryBuilder = queryBuilder.order('total_reviews', { ascending: sortOrder });
                    break;
                case 'created_at':
                    queryBuilder = queryBuilder.order('created_at', { ascending: sortOrder });
                    break;
                default:
                    queryBuilder = queryBuilder.order('rating', { ascending: false });
            }
            if (sortBy !== 'created_at') {
                queryBuilder = queryBuilder.order('created_at', { ascending: false });
            }
            const { data, error } = await queryBuilder;
            if (error) {
                logger_1.default.error('Database query error in search:', error);
                throw error;
            }
            if (!data || data.length === 0) {
                return [];
            }
            return data.map((doctor) => this.mapSupabaseDoctorToDoctor(doctor));
        }
        catch (error) {
            logger_1.default.error('Error searching doctors', { error, query, limit, offset });
            throw error;
        }
    }
    async getSearchCount(query) {
        try {
            let queryBuilder = this.supabase
                .from('doctors')
                .select('doctor_id', { count: 'exact', head: true });
            if (query.specialty) {
                queryBuilder = queryBuilder.ilike('specialty', `%${query.specialty}%`);
            }
            if (query.department_id) {
                queryBuilder = queryBuilder.eq('department_id', query.department_id);
            }
            if (query.gender) {
                queryBuilder = queryBuilder.eq('gender', query.gender);
            }
            if (query.availability_status) {
                queryBuilder = queryBuilder.eq('availability_status', query.availability_status);
            }
            if (query.min_rating !== undefined) {
                queryBuilder = queryBuilder.gte('rating', query.min_rating);
            }
            if (query.max_consultation_fee !== undefined) {
                queryBuilder = queryBuilder.lte('consultation_fee', query.max_consultation_fee);
            }
            if (query.experience_years !== undefined) {
                queryBuilder = queryBuilder.gte('experience_years', query.experience_years);
            }
            if (query.languages) {
                queryBuilder = queryBuilder.contains('languages_spoken', [query.languages]);
            }
            if (query.search) {
                const searchTerm = query.search.toLowerCase();
                queryBuilder = queryBuilder.or(`specialty.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%,qualification.ilike.%${searchTerm}%,license_number.ilike.%${searchTerm}%`);
            }
            const { count, error } = await queryBuilder;
            if (error) {
                logger_1.default.error('Database query error in getSearchCount:', error);
                throw error;
            }
            return count || 0;
        }
        catch (error) {
            logger_1.default.error('Error getting search count', { error, query });
            throw error;
        }
    }
    async create(doctorData) {
        try {
            const { data, error } = await this.supabase
                .rpc('create_doctor', {
                doctor_data: {
                    full_name: doctorData.full_name,
                    specialty: doctorData.specialty,
                    qualification: doctorData.qualification,
                    department_id: doctorData.department_id,
                    license_number: doctorData.license_number,
                    gender: doctorData.gender,
                    bio: doctorData.bio || null,
                    experience_years: doctorData.experience_years || 0,
                    consultation_fee: doctorData.consultation_fee || null,
                    address: doctorData.address || {},
                    languages_spoken: doctorData.languages_spoken || ['Vietnamese'],
                    availability_status: 'available',
                    rating: 0.00,
                    total_reviews: 0
                }
            });
            if (error) {
                logger_1.default.error('Database function error in create:', error);
                throw error;
            }
            if (!data || data.length === 0) {
                throw new Error('Failed to create doctor - no data returned');
            }
            logger_1.default.info('Doctor created successfully via database function:', {
                doctorId: data[0].doctor_id
            });
            return this.mapSupabaseDoctorToDoctor(data[0]);
        }
        catch (error) {
            logger_1.default.error('Error creating doctor', { error, doctorData });
            throw error;
        }
    }
    async update(doctorId, doctorData) {
        try {
            const { data, error } = await this.supabase
                .rpc('update_doctor', {
                input_doctor_id: doctorId,
                doctor_data: doctorData
            });
            if (error) {
                logger_1.default.error('Database function error in update:', error);
                if (error.message?.includes('not found')) {
                    return null;
                }
                throw error;
            }
            if (!data || data.length === 0) {
                return null;
            }
            logger_1.default.info('Doctor updated successfully via database function:', {
                doctorId,
                updatedFields: Object.keys(doctorData)
            });
            return this.mapSupabaseDoctorToDoctor(data[0]);
        }
        catch (error) {
            logger_1.default.error('Error updating doctor', { error, doctorId, doctorData });
            throw error;
        }
    }
    async delete(doctorId) {
        try {
            const { data, error } = await this.supabase
                .rpc('delete_doctor', { input_doctor_id: doctorId });
            if (error) {
                logger_1.default.error('Database function error in delete:', error);
                throw error;
            }
            logger_1.default.info('Doctor deleted successfully via database function:', { doctorId });
            return data === true;
        }
        catch (error) {
            logger_1.default.error('Error deleting doctor', { error, doctorId });
            throw error;
        }
    }
    async count() {
        try {
            const { data, error } = await this.supabase
                .rpc('count_doctors');
            if (error) {
                logger_1.default.error('Database function error in count:', error);
                throw error;
            }
            return data || 0;
        }
        catch (error) {
            logger_1.default.error('Error counting doctors', { error });
            throw error;
        }
    }
    async getDashboardStats(doctorId) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const { data: appointmentStats, error: appointmentError } = await this.supabase
                .from('appointments')
                .select('status')
                .eq('doctor_id', doctorId);
            if (appointmentError) {
                logger_1.default.error('Error fetching appointment stats:', appointmentError);
                throw appointmentError;
            }
            const { data: todayAppointments, error: todayError } = await this.supabase
                .from('appointments')
                .select('appointment_id')
                .eq('doctor_id', doctorId)
                .eq('appointment_date', today);
            if (todayError) {
                logger_1.default.error('Error fetching today appointments:', todayError);
                throw todayError;
            }
            const { data: patientData, error: patientError } = await this.supabase
                .from('appointments')
                .select('patient_id')
                .eq('doctor_id', doctorId);
            if (patientError) {
                logger_1.default.error('Error fetching patient data:', patientError);
                throw patientError;
            }
            const { data: reviewData, error: reviewError } = await this.supabase
                .from('doctor_reviews')
                .select('rating')
                .eq('doctor_id', doctorId);
            if (reviewError) {
                logger_1.default.error('Error fetching review data:', reviewError);
                throw reviewError;
            }
            const totalAppointments = appointmentStats?.length || 0;
            const completedAppointments = appointmentStats?.filter(a => a.status === 'completed').length || 0;
            const todayAppointmentsCount = todayAppointments?.length || 0;
            const uniquePatients = [...new Set(patientData?.map(p => p.patient_id))].length;
            const totalReviews = reviewData?.length || 0;
            const averageRating = totalReviews > 0 ?
                reviewData.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;
            return {
                todayAppointments: todayAppointmentsCount,
                totalAppointments,
                completedAppointments,
                totalPatients: uniquePatients,
                totalReviews,
                averageRating: parseFloat(averageRating.toFixed(1))
            };
        }
        catch (error) {
            logger_1.default.error('Error getting dashboard stats', { error, doctorId });
            throw error;
        }
    }
    async getRecentAppointments(doctorId, limit = 5) {
        try {
            const { data, error } = await this.supabase
                .from('appointments')
                .select(`
          appointment_id,
          patient_id,
          appointment_date,
          start_time,
          end_time,
          status,
          appointment_type,
          reason,
          patients!inner(
            patient_id,
            profiles!inner(
              full_name,
              phone_number
            )
          )
        `)
                .eq('doctor_id', doctorId)
                .order('appointment_date', { ascending: false })
                .order('start_time', { ascending: false })
                .limit(limit);
            if (error) {
                logger_1.default.error('Error fetching recent appointments:', error);
                throw error;
            }
            return data?.map(appointment => ({
                appointment_id: appointment.appointment_id,
                patient_name: appointment.patients?.profiles?.full_name || 'Unknown Patient',
                patient_phone: appointment.patients?.profiles?.phone_number,
                appointment_date: appointment.appointment_date,
                start_time: appointment.start_time,
                end_time: appointment.end_time,
                status: appointment.status,
                appointment_type: appointment.appointment_type,
                reason: appointment.reason,
                priority: 'normal'
            })) || [];
        }
        catch (error) {
            logger_1.default.error('Error getting recent appointments', { error, doctorId });
            throw error;
        }
    }
    async getWeeklyStats(doctorId) {
        try {
            const today = new Date();
            const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
            const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
            const { data, error } = await this.supabase
                .from('appointments')
                .select('status')
                .eq('doctor_id', doctorId)
                .gte('appointment_date', weekStart.toISOString().split('T')[0])
                .lte('appointment_date', weekEnd.toISOString().split('T')[0]);
            if (error) {
                logger_1.default.error('Error fetching weekly stats:', error);
                throw error;
            }
            const appointments = data?.length || 0;
            const revenue = 0;
            return { appointments, revenue };
        }
        catch (error) {
            logger_1.default.error('Error getting weekly stats', { error, doctorId });
            throw error;
        }
    }
    async getMonthlyStats(doctorId) {
        try {
            const today = new Date();
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            const { data, error } = await this.supabase
                .from('appointments')
                .select('status')
                .eq('doctor_id', doctorId)
                .gte('appointment_date', monthStart.toISOString().split('T')[0])
                .lte('appointment_date', monthEnd.toISOString().split('T')[0]);
            if (error) {
                logger_1.default.error('Error fetching monthly stats:', error);
                throw error;
            }
            const totalAppointments = data?.length || 0;
            const completedAppointments = data?.filter(a => a.status === 'completed').length || 0;
            const revenue = 0;
            const successRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;
            return {
                appointments: totalAppointments,
                revenue,
                success_rate: parseFloat(successRate.toFixed(1))
            };
        }
        catch (error) {
            logger_1.default.error('Error getting monthly stats', { error, doctorId });
            throw error;
        }
    }
    async countByDepartment(departmentId) {
        try {
            const { data, error } = await this.supabase
                .rpc('count_doctors_by_department', { dept_id: departmentId });
            if (error) {
                logger_1.default.error('Database function error in countByDepartment:', error);
                throw error;
            }
            return data || 0;
        }
        catch (error) {
            logger_1.default.error('Error counting doctors by department', { error, departmentId });
            throw error;
        }
    }
    mapSupabaseDoctorToDoctor(supabaseDoctor) {
        console.log('🔍 DEBUG - Raw supabaseDoctor:', JSON.stringify(supabaseDoctor, null, 2));
        const fullName = supabaseDoctor.profiles?.full_name || supabaseDoctor.full_name || '';
        console.log('🔍 DEBUG - Extracted full_name:', fullName);
        return {
            id: String(supabaseDoctor.doctor_id || ''),
            doctor_id: String(supabaseDoctor.doctor_id || ''),
            profile_id: String(supabaseDoctor.profile_id || ''),
            full_name: String(fullName),
            specialty: String(supabaseDoctor.specialty || ''),
            qualification: String(supabaseDoctor.qualification || ''),
            department_id: String(supabaseDoctor.department_id || ''),
            license_number: String(supabaseDoctor.license_number || ''),
            gender: String(supabaseDoctor.gender || ''),
            bio: supabaseDoctor.bio || null,
            experience_years: Number(supabaseDoctor.experience_years) || 0,
            consultation_fee: supabaseDoctor.consultation_fee ? Number(supabaseDoctor.consultation_fee) : undefined,
            address: supabaseDoctor.address || {},
            languages_spoken: Array.isArray(supabaseDoctor.languages_spoken) ? supabaseDoctor.languages_spoken : ['Vietnamese'],
            availability_status: String(supabaseDoctor.availability_status || 'available'),
            rating: Number(supabaseDoctor.rating) || 0.00,
            total_reviews: Number(supabaseDoctor.total_reviews) || 0,
            created_at: new Date(supabaseDoctor.created_at),
            updated_at: new Date(supabaseDoctor.updated_at)
        };
    }
}
exports.DoctorRepository = DoctorRepository;
//# sourceMappingURL=doctor.repository.js.map