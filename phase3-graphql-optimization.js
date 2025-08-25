// ============================================================================
// PHASE 3.2: GRAPHQL OPTIMIZATION WITH DATALOADER
// Hospital Management System - Performance & Scalability
// ============================================================================
// This file implements GraphQL performance optimizations and N+1 query solutions

const DataLoader = require('dataloader');
const { supabase } = require('../config/supabase');

// ============================================================================
// 1. DATALOADER IMPLEMENTATIONS FOR HEALTHCARE DATA
// ============================================================================

class HospitalDataLoaders {
    constructor() {
        // Initialize all DataLoaders
        this.profileLoader = this.createProfileLoader();
        this.patientProfileLoader = this.createPatientProfileLoader();
        this.doctorProfileLoader = this.createDoctorProfileLoader();
        this.departmentLoader = this.createDepartmentLoader();
        this.appointmentLoader = this.createAppointmentLoader();
        this.medicalRecordLoader = this.createMedicalRecordLoader();
        
        // Batch loaders for relationships
        this.appointmentsByPatientLoader = this.createAppointmentsByPatientLoader();
        this.appointmentsByDoctorLoader = this.createAppointmentsByDoctorLoader();
        this.doctorsByDepartmentLoader = this.createDoctorsByDepartmentLoader();
        this.medicalRecordsByPatientLoader = this.createMedicalRecordsByPatientLoader();
    }

    // Profile DataLoader
    createProfileLoader() {
        return new DataLoader(async (userIds) => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .in('id', userIds);

            if (error) {
                throw new Error(`Profile loader error: ${error.message}`);
            }

            // Create a map for O(1) lookup
            const profileMap = new Map();
            data.forEach(profile => profileMap.set(profile.id, profile));

            // Return profiles in the same order as requested userIds
            return userIds.map(id => profileMap.get(id) || null);
        }, {
            cacheKeyFn: (key) => `profile:${key}`,
            maxBatchSize: 100
        });
    }

    // Patient Profile DataLoader
    createPatientProfileLoader() {
        return new DataLoader(async (userIds) => {
            const { data, error } = await supabase
                .from('patient_profiles')
                .select(`
                    *,
                    profile:profiles(*)
                `)
                .in('user_id', userIds);

            if (error) {
                throw new Error(`Patient profile loader error: ${error.message}`);
            }

            const patientMap = new Map();
            data.forEach(patient => patientMap.set(patient.user_id, patient));

            return userIds.map(id => patientMap.get(id) || null);
        }, {
            cacheKeyFn: (key) => `patient:${key}`,
            maxBatchSize: 50
        });
    }

    // Doctor Profile DataLoader
    createDoctorProfileLoader() {
        return new DataLoader(async (userIds) => {
            const { data, error } = await supabase
                .from('doctor_profiles')
                .select(`
                    *,
                    profile:profiles(*),
                    department:departments(*)
                `)
                .in('user_id', userIds);

            if (error) {
                throw new Error(`Doctor profile loader error: ${error.message}`);
            }

            const doctorMap = new Map();
            data.forEach(doctor => doctorMap.set(doctor.user_id, doctor));

            return userIds.map(id => doctorMap.get(id) || null);
        }, {
            cacheKeyFn: (key) => `doctor:${key}`,
            maxBatchSize: 50
        });
    }

    // Department DataLoader
    createDepartmentLoader() {
        return new DataLoader(async (departmentIds) => {
            const { data, error } = await supabase
                .from('departments')
                .select('*')
                .in('id', departmentIds);

            if (error) {
                throw new Error(`Department loader error: ${error.message}`);
            }

            const departmentMap = new Map();
            data.forEach(dept => departmentMap.set(dept.id, dept));

            return departmentIds.map(id => departmentMap.get(id) || null);
        }, {
            cacheKeyFn: (key) => `department:${key}`,
            maxBatchSize: 20
        });
    }

    // Appointment DataLoader
    createAppointmentLoader() {
        return new DataLoader(async (appointmentIds) => {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    patient:patient_profiles!appointments_patient_id_fkey(
                        *,
                        profile:profiles(*)
                    ),
                    doctor:doctor_profiles!appointments_doctor_id_fkey(
                        *,
                        profile:profiles(*),
                        department:departments(*)
                    )
                `)
                .in('id', appointmentIds);

            if (error) {
                throw new Error(`Appointment loader error: ${error.message}`);
            }

            const appointmentMap = new Map();
            data.forEach(appointment => appointmentMap.set(appointment.id, appointment));

            return appointmentIds.map(id => appointmentMap.get(id) || null);
        }, {
            cacheKeyFn: (key) => `appointment:${key}`,
            maxBatchSize: 100
        });
    }

    // Medical Record DataLoader
    createMedicalRecordLoader() {
        return new DataLoader(async (recordIds) => {
            const { data, error } = await supabase
                .from('medical_records')
                .select(`
                    *,
                    patient:patient_profiles!medical_records_patient_id_fkey(
                        *,
                        profile:profiles(*)
                    ),
                    doctor:doctor_profiles!medical_records_doctor_id_fkey(
                        *,
                        profile:profiles(*)
                    )
                `)
                .in('record_id', recordIds);

            if (error) {
                throw new Error(`Medical record loader error: ${error.message}`);
            }

            const recordMap = new Map();
            data.forEach(record => recordMap.set(record.record_id, record));

            return recordIds.map(id => recordMap.get(id) || null);
        }, {
            cacheKeyFn: (key) => `medical_record:${key}`,
            maxBatchSize: 50
        });
    }

    // ============================================================================
    // 2. RELATIONSHIP DATALOADERS (ONE-TO-MANY)
    // ============================================================================

    // Appointments by Patient DataLoader
    createAppointmentsByPatientLoader() {
        return new DataLoader(async (patientIds) => {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    doctor:doctor_profiles!appointments_doctor_id_fkey(
                        *,
                        profile:profiles(*),
                        department:departments(*)
                    )
                `)
                .in('patient_id', patientIds)
                .order('appointment_date', { ascending: false });

            if (error) {
                throw new Error(`Appointments by patient loader error: ${error.message}`);
            }

            // Group appointments by patient_id
            const appointmentsByPatient = new Map();
            patientIds.forEach(id => appointmentsByPatient.set(id, []));
            
            data.forEach(appointment => {
                const patientAppointments = appointmentsByPatient.get(appointment.patient_id) || [];
                patientAppointments.push(appointment);
                appointmentsByPatient.set(appointment.patient_id, patientAppointments);
            });

            return patientIds.map(id => appointmentsByPatient.get(id) || []);
        }, {
            cacheKeyFn: (key) => `appointments_by_patient:${key}`,
            maxBatchSize: 50
        });
    }

    // Appointments by Doctor DataLoader
    createAppointmentsByDoctorLoader() {
        return new DataLoader(async (doctorIds) => {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    patient:patient_profiles!appointments_patient_id_fkey(
                        *,
                        profile:profiles(*)
                    )
                `)
                .in('doctor_id', doctorIds)
                .order('appointment_date', { ascending: false });

            if (error) {
                throw new Error(`Appointments by doctor loader error: ${error.message}`);
            }

            const appointmentsByDoctor = new Map();
            doctorIds.forEach(id => appointmentsByDoctor.set(id, []));
            
            data.forEach(appointment => {
                const doctorAppointments = appointmentsByDoctor.get(appointment.doctor_id) || [];
                doctorAppointments.push(appointment);
                appointmentsByDoctor.set(appointment.doctor_id, doctorAppointments);
            });

            return doctorIds.map(id => appointmentsByDoctor.get(id) || []);
        }, {
            cacheKeyFn: (key) => `appointments_by_doctor:${key}`,
            maxBatchSize: 50
        });
    }

    // Doctors by Department DataLoader
    createDoctorsByDepartmentLoader() {
        return new DataLoader(async (departmentIds) => {
            const { data, error } = await supabase
                .from('doctor_profiles')
                .select(`
                    *,
                    profile:profiles(*)
                `)
                .in('department_id', departmentIds)
                .eq('status', 'active')
                .order('created_at', { ascending: true });

            if (error) {
                throw new Error(`Doctors by department loader error: ${error.message}`);
            }

            const doctorsByDepartment = new Map();
            departmentIds.forEach(id => doctorsByDepartment.set(id, []));
            
            data.forEach(doctor => {
                const departmentDoctors = doctorsByDepartment.get(doctor.department_id) || [];
                departmentDoctors.push(doctor);
                doctorsByDepartment.set(doctor.department_id, departmentDoctors);
            });

            return departmentIds.map(id => doctorsByDepartment.get(id) || []);
        }, {
            cacheKeyFn: (key) => `doctors_by_department:${key}`,
            maxBatchSize: 20
        });
    }

    // Medical Records by Patient DataLoader
    createMedicalRecordsByPatientLoader() {
        return new DataLoader(async (patientIds) => {
            const { data, error } = await supabase
                .from('medical_records')
                .select(`
                    *,
                    doctor:doctor_profiles!medical_records_doctor_id_fkey(
                        *,
                        profile:profiles(*)
                    )
                `)
                .in('patient_id', patientIds)
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (error) {
                throw new Error(`Medical records by patient loader error: ${error.message}`);
            }

            const recordsByPatient = new Map();
            patientIds.forEach(id => recordsByPatient.set(id, []));
            
            data.forEach(record => {
                const patientRecords = recordsByPatient.get(record.patient_id) || [];
                patientRecords.push(record);
                recordsByPatient.set(record.patient_id, patientRecords);
            });

            return patientIds.map(id => recordsByPatient.get(id) || []);
        }, {
            cacheKeyFn: (key) => `medical_records_by_patient:${key}`,
            maxBatchSize: 30
        });
    }

    // ============================================================================
    // 3. CACHE MANAGEMENT METHODS
    // ============================================================================

    // Clear all caches
    clearAll() {
        this.profileLoader.clearAll();
        this.patientProfileLoader.clearAll();
        this.doctorProfileLoader.clearAll();
        this.departmentLoader.clearAll();
        this.appointmentLoader.clearAll();
        this.medicalRecordLoader.clearAll();
        this.appointmentsByPatientLoader.clearAll();
        this.appointmentsByDoctorLoader.clearAll();
        this.doctorsByDepartmentLoader.clearAll();
        this.medicalRecordsByPatientLoader.clearAll();
    }

    // Clear specific entity cache
    clearEntity(entityType, id) {
        switch (entityType) {
            case 'profile':
                this.profileLoader.clear(id);
                break;
            case 'patient':
                this.patientProfileLoader.clear(id);
                this.appointmentsByPatientLoader.clear(id);
                this.medicalRecordsByPatientLoader.clear(id);
                break;
            case 'doctor':
                this.doctorProfileLoader.clear(id);
                this.appointmentsByDoctorLoader.clear(id);
                break;
            case 'department':
                this.departmentLoader.clear(id);
                this.doctorsByDepartmentLoader.clear(id);
                break;
            case 'appointment':
                this.appointmentLoader.clear(id);
                break;
            case 'medical_record':
                this.medicalRecordLoader.clear(id);
                break;
        }
    }

    // Prime cache with data
    prime(entityType, id, data) {
        switch (entityType) {
            case 'profile':
                this.profileLoader.prime(id, data);
                break;
            case 'patient':
                this.patientProfileLoader.prime(id, data);
                break;
            case 'doctor':
                this.doctorProfileLoader.prime(id, data);
                break;
            case 'department':
                this.departmentLoader.prime(id, data);
                break;
            case 'appointment':
                this.appointmentLoader.prime(id, data);
                break;
            case 'medical_record':
                this.medicalRecordLoader.prime(id, data);
                break;
        }
    }
}

// ============================================================================
// 4. GRAPHQL CONTEXT FACTORY
// ============================================================================

const createGraphQLContext = (req, res) => {
    return {
        req,
        res,
        user: req.user,
        dataloaders: new HospitalDataLoaders(),
        
        // Performance tracking
        startTime: Date.now(),
        
        // Request metadata
        requestId: req.headers['x-request-id'] || `req_${Date.now()}`,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        
        // Helper methods
        logPerformance: (operation) => {
            const duration = Date.now() - this.startTime;
            console.log(`GraphQL ${operation}: ${duration}ms`);
        }
    };
};

// ============================================================================
// 5. EXPORT DATALOADER UTILITIES
// ============================================================================

module.exports = {
    HospitalDataLoaders,
    createGraphQLContext,
    
    // Utility functions
    batchLoad: async (loader, ids) => {
        return await loader.loadMany(ids);
    },
    
    // Performance helpers
    measureDataLoaderPerformance: (loaderName, startTime) => {
        const duration = Date.now() - startTime;
        if (duration > 100) {
            console.warn(`🐌 Slow DataLoader: ${loaderName} - ${duration}ms`);
        }
        return duration;
    }
};
