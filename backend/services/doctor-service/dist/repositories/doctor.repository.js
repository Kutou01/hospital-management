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
        this.supabase = (0, database_config_1.getSupabase)();
    }
    async findById(doctorId) {
        try {
            const { data, error } = await this.supabase
                .from('doctors')
                .select('*')
                .eq('doctor_id', doctorId)
                .single();
            if (error) {
                if (error.code === 'PGRST116')
                    return null;
                throw error;
            }
            return this.mapSupabaseDoctorToDoctor(data);
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
                .select('*')
                .eq('profile_id', profileId)
                .single();
            if (error) {
                if (error.code === 'PGRST116')
                    return null;
                throw error;
            }
            return this.mapSupabaseDoctorToDoctor(data);
        }
        catch (error) {
            logger_1.default.error('Error finding doctor by profile ID', { error, profileId });
            throw error;
        }
    }
    async findByEmail(email) {
        try {
            const { data, error } = await this.supabase
                .from('doctors')
                .select('*')
                .eq('email', email)
                .single();
            if (error) {
                if (error.code === 'PGRST116')
                    return null;
                throw error;
            }
            return this.mapSupabaseDoctorToDoctor(data);
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
                .select('*')
                .order('full_name', { ascending: true })
                .range(offset, offset + limit - 1);
            if (error)
                throw error;
            return data.map(doctor => this.mapSupabaseDoctorToDoctor(doctor));
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
                .select('*')
                .eq('department_id', departmentId)
                .order('full_name', { ascending: true })
                .range(offset, offset + limit - 1);
            if (error)
                throw error;
            return data.map(doctor => this.mapSupabaseDoctorToDoctor(doctor));
        }
        catch (error) {
            logger_1.default.error('Error finding doctors by department', { error, departmentId, limit, offset });
            throw error;
        }
    }
    async findBySpecialty(specialty, limit = 50, offset = 0) {
        try {
            const { data, error } = await this.supabase
                .from('doctors')
                .select('*')
                .eq('specialty', specialty)
                .order('full_name', { ascending: true })
                .range(offset, offset + limit - 1);
            if (error)
                throw error;
            return data.map(doctor => this.mapSupabaseDoctorToDoctor(doctor));
        }
        catch (error) {
            logger_1.default.error('Error finding doctors by specialty', { error, specialty, limit, offset });
            throw error;
        }
    }
    async search(query, limit = 50, offset = 0) {
        try {
            let supabaseQuery = this.supabase
                .from('doctors')
                .select('*');
            if (query.specialty) {
                supabaseQuery = supabaseQuery.eq('specialty', query.specialty);
            }
            if (query.department_id) {
                supabaseQuery = supabaseQuery.eq('department_id', query.department_id);
            }
            if (query.gender) {
                supabaseQuery = supabaseQuery.eq('gender', query.gender);
            }
            if (query.search) {
                supabaseQuery = supabaseQuery.or(`full_name.ilike.%${query.search}%,specialty.ilike.%${query.search}%`);
            }
            const { data, error } = await supabaseQuery
                .order('full_name', { ascending: true })
                .range(offset, offset + limit - 1);
            if (error)
                throw error;
            return data.map(doctor => this.mapSupabaseDoctorToDoctor(doctor));
        }
        catch (error) {
            logger_1.default.error('Error searching doctors', { error, query, limit, offset });
            throw error;
        }
    }
    async create(doctorData) {
        try {
            const doctorId = await this.generateDoctorId();
            const supabaseDoctor = {
                doctor_id: doctorId,
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
            };
            const { data, error } = await this.supabase
                .from('doctors')
                .insert([supabaseDoctor])
                .select()
                .single();
            if (error)
                throw error;
            return this.mapSupabaseDoctorToDoctor(data);
        }
        catch (error) {
            logger_1.default.error('Error creating doctor', { error, doctorData });
            throw error;
        }
    }
    async update(doctorId, doctorData) {
        try {
            const { data, error } = await this.supabase
                .from('doctors')
                .update(doctorData)
                .eq('doctor_id', doctorId)
                .select()
                .single();
            if (error) {
                if (error.code === 'PGRST116')
                    return null;
                throw error;
            }
            if (doctorData.phone_number || doctorData.email || doctorData.full_name) {
                const profileUpdateData = {};
                if (doctorData.phone_number)
                    profileUpdateData.phone_number = doctorData.phone_number;
                if (doctorData.email)
                    profileUpdateData.email = doctorData.email;
                if (doctorData.full_name)
                    profileUpdateData.full_name = doctorData.full_name;
                if (Object.keys(profileUpdateData).length > 0) {
                    profileUpdateData.updated_at = new Date().toISOString();
                    const { error: profileError } = await this.supabase
                        .from('profiles')
                        .update(profileUpdateData)
                        .eq('id', data.profile_id);
                    if (profileError) {
                        logger_1.default.warn('Failed to update profile during doctor update', {
                            error: profileError,
                            doctorId,
                            profileId: data.profile_id
                        });
                    }
                    else {
                        logger_1.default.info('Successfully synced doctor update to profile', {
                            doctorId,
                            profileId: data.profile_id,
                            updatedFields: Object.keys(profileUpdateData)
                        });
                    }
                }
            }
            return this.mapSupabaseDoctorToDoctor(data);
        }
        catch (error) {
            logger_1.default.error('Error updating doctor', { error, doctorId, doctorData });
            throw error;
        }
    }
    async delete(doctorId) {
        try {
            const { error } = await this.supabase
                .from('doctors')
                .delete()
                .eq('doctor_id', doctorId);
            if (error)
                throw error;
            return true;
        }
        catch (error) {
            logger_1.default.error('Error deleting doctor', { error, doctorId });
            throw error;
        }
    }
    async count() {
        try {
            const { count, error } = await this.supabase
                .from('doctors')
                .select('*', { count: 'exact', head: true });
            if (error)
                throw error;
            return count || 0;
        }
        catch (error) {
            logger_1.default.error('Error counting doctors', { error });
            throw error;
        }
    }
    async countByDepartment(departmentId) {
        try {
            const { count, error } = await this.supabase
                .from('doctors')
                .select('*', { count: 'exact', head: true })
                .eq('department_id', departmentId);
            if (error)
                throw error;
            return count || 0;
        }
        catch (error) {
            logger_1.default.error('Error counting doctors by department', { error, departmentId });
            throw error;
        }
    }
    async generateDoctorId() {
        const count = await this.count();
        const nextId = (count + 1).toString().padStart(6, '0');
        return `DOC${nextId}`;
    }
    mapSupabaseDoctorToDoctor(supabaseDoctor) {
        return {
            id: supabaseDoctor.doctor_id,
            doctor_id: supabaseDoctor.doctor_id,
            profile_id: supabaseDoctor.profile_id,
            specialty: supabaseDoctor.specialty,
            qualification: supabaseDoctor.qualification,
            department_id: supabaseDoctor.department_id,
            license_number: supabaseDoctor.license_number,
            gender: supabaseDoctor.gender,
            bio: supabaseDoctor.bio,
            experience_years: supabaseDoctor.experience_years || 0,
            consultation_fee: supabaseDoctor.consultation_fee,
            address: supabaseDoctor.address || {},
            languages_spoken: supabaseDoctor.languages_spoken || ['Vietnamese'],
            availability_status: supabaseDoctor.availability_status || 'available',
            rating: supabaseDoctor.rating || 0.00,
            total_reviews: supabaseDoctor.total_reviews || 0,
            created_at: new Date(supabaseDoctor.created_at),
            updated_at: new Date(supabaseDoctor.updated_at)
        };
    }
}
exports.DoctorRepository = DoctorRepository;
//# sourceMappingURL=doctor.repository.js.map