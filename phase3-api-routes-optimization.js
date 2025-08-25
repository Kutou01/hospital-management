// ============================================================================
// PHASE 3.2: API ROUTES OPTIMIZATION
// Hospital Management System - Performance & Scalability
// ============================================================================
// This file implements optimized API routes with caching and performance monitoring

const express = require('express');
const { 
    cacheManager, 
    doctorAvailabilityCache, 
    patientProfileCache,
    departmentStatsCache,
    medicalRecordsCache,
    performanceMonitoring 
} = require('./phase3-api-performance-enhancement');
const { supabase } = require('../config/supabase');

const router = express.Router();

// Apply performance monitoring to all routes
router.use(performanceMonitoring);

// ============================================================================
// 1. OPTIMIZED DOCTOR ROUTES
// ============================================================================

// Get available doctors with caching
router.get('/doctors/available', doctorAvailabilityCache, async (req, res) => {
    try {
        const startTime = Date.now();
        const { department, specialization, date = new Date().toISOString().split('T')[0] } = req.query;

        // Use optimized database function
        let query = supabase.rpc('get_available_doctors', {
            p_department_id: department || null,
            p_specialization: specialization || null,
            p_date: date
        });

        const { data, error } = await query;

        if (error) {
            console.error('Doctor availability error:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi tải danh sách bác sĩ khả dụng',
                error: error.message
            });
        }

        const responseTime = Date.now() - startTime;
        
        res.json({
            success: true,
            data: data || [],
            meta: {
                count: data?.length || 0,
                responseTime: `${responseTime}ms`,
                cached: res.get('X-Cache') === 'HIT',
                filters: { department, specialization, date }
            }
        });

    } catch (error) {
        console.error('Doctor availability route error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tải danh sách bác sĩ',
            error: error.message
        });
    }
});

// Get doctor profile with performance optimization
router.get('/doctors/:id', async (req, res) => {
    try {
        const startTime = Date.now();
        const { id } = req.params;

        // Check cache first
        const cacheKey = cacheManager.getCacheKey('doctor:profile', id);
        let doctorData = await cacheManager.get(cacheKey);

        if (!doctorData) {
            // Fetch from database with optimized query
            const { data, error } = await supabase
                .from('doctor_profiles')
                .select(`
                    *,
                    profile:profiles(*),
                    department:departments(*),
                    stats:mv_doctor_performance(*)
                `)
                .eq('user_id', id)
                .single();

            if (error) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy thông tin bác sĩ',
                    error: error.message
                });
            }

            doctorData = data;
            // Cache for 10 minutes
            await cacheManager.set(cacheKey, doctorData, 600);
        }

        const responseTime = Date.now() - startTime;

        res.json({
            success: true,
            data: doctorData,
            meta: {
                responseTime: `${responseTime}ms`,
                cached: !!doctorData
            }
        });

    } catch (error) {
        console.error('Doctor profile route error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải thông tin bác sĩ',
            error: error.message
        });
    }
});

// ============================================================================
// 2. OPTIMIZED PATIENT ROUTES
// ============================================================================

// Search patients with caching and pagination
router.get('/patients/search', async (req, res) => {
    try {
        const startTime = Date.now();
        const { q: searchTerm = '', page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        // Generate cache key
        const cacheKey = cacheManager.getCacheKey('patients:search', 'results', {
            q: searchTerm,
            page,
            limit
        });

        let searchResults = await cacheManager.get(cacheKey);

        if (!searchResults) {
            // Use optimized search function
            const { data, error } = await supabase.rpc('search_patients', {
                p_search_term: searchTerm,
                p_limit: parseInt(limit)
            });

            if (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Lỗi khi tìm kiếm bệnh nhân',
                    error: error.message
                });
            }

            // Apply pagination
            const paginatedData = data.slice(offset, offset + parseInt(limit));
            
            searchResults = {
                data: paginatedData,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: data.length,
                    totalPages: Math.ceil(data.length / limit)
                }
            };

            // Cache for 2 minutes
            await cacheManager.set(cacheKey, searchResults, 120);
        }

        const responseTime = Date.now() - startTime;

        res.json({
            success: true,
            ...searchResults,
            meta: {
                responseTime: `${responseTime}ms`,
                cached: !!searchResults,
                searchTerm
            }
        });

    } catch (error) {
        console.error('Patient search route error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tìm kiếm bệnh nhân',
            error: error.message
        });
    }
});

// Get patient profile with caching
router.get('/patients/:id', patientProfileCache, async (req, res) => {
    try {
        const startTime = Date.now();
        const { id } = req.params;

        // Fetch patient with statistics
        const { data, error } = await supabase
            .from('patient_profiles')
            .select(`
                *,
                profile:profiles(*),
                stats:mv_patient_statistics(*)
            `)
            .eq('user_id', id)
            .single();

        if (error) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin bệnh nhân',
                error: error.message
            });
        }

        const responseTime = Date.now() - startTime;

        res.json({
            success: true,
            data,
            meta: {
                responseTime: `${responseTime}ms`,
                cached: res.get('X-Cache') === 'HIT'
            }
        });

    } catch (error) {
        console.error('Patient profile route error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải thông tin bệnh nhân',
            error: error.message
        });
    }
});

// ============================================================================
// 3. OPTIMIZED APPOINTMENT ROUTES
// ============================================================================

// Get appointments with advanced filtering and caching
router.get('/appointments', async (req, res) => {
    try {
        const startTime = Date.now();
        const { 
            doctor_id, 
            patient_id, 
            date_from, 
            date_to, 
            status, 
            page = 1, 
            limit = 50 
        } = req.query;

        // Generate cache key based on filters
        const cacheKey = cacheManager.getCacheKey('appointments:list', 'filtered', {
            doctor_id: doctor_id || 'all',
            patient_id: patient_id || 'all',
            date_from: date_from || 'all',
            date_to: date_to || 'all',
            status: status || 'all',
            page,
            limit
        });

        let appointmentData = await cacheManager.get(cacheKey);

        if (!appointmentData) {
            let query = supabase
                .from('appointments')
                .select(`
                    *,
                    patient:patient_profiles!appointments_patient_id_fkey(
                        *,
                        profile:profiles(full_name, phone)
                    ),
                    doctor:doctor_profiles!appointments_doctor_id_fkey(
                        *,
                        profile:profiles(full_name),
                        department:departments(name, name_vi)
                    )
                `)
                .order('appointment_date', { ascending: false })
                .order('appointment_time', { ascending: false });

            // Apply filters
            if (doctor_id) query = query.eq('doctor_id', doctor_id);
            if (patient_id) query = query.eq('patient_id', patient_id);
            if (date_from) query = query.gte('appointment_date', date_from);
            if (date_to) query = query.lte('appointment_date', date_to);
            if (status) query = query.eq('status', status);

            // Apply pagination
            const offset = (page - 1) * limit;
            query = query.range(offset, offset + parseInt(limit) - 1);

            const { data, error, count } = await query;

            if (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Lỗi khi tải danh sách lịch hẹn',
                    error: error.message
                });
            }

            appointmentData = {
                data: data || [],
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count || data?.length || 0,
                    totalPages: Math.ceil((count || data?.length || 0) / limit)
                }
            };

            // Cache for 1 minute (appointments change frequently)
            await cacheManager.set(cacheKey, appointmentData, 60);
        }

        const responseTime = Date.now() - startTime;

        res.json({
            success: true,
            ...appointmentData,
            meta: {
                responseTime: `${responseTime}ms`,
                cached: !!appointmentData,
                filters: { doctor_id, patient_id, date_from, date_to, status }
            }
        });

    } catch (error) {
        console.error('Appointments route error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tải danh sách lịch hẹn',
            error: error.message
        });
    }
});

// ============================================================================
// 4. OPTIMIZED DEPARTMENT ROUTES
// ============================================================================

// Get department statistics with caching
router.get('/departments/:id/stats', departmentStatsCache, async (req, res) => {
    try {
        const startTime = Date.now();
        const { id } = req.params;

        // Use materialized view for fast statistics
        const { data, error } = await supabase
            .from('mv_department_statistics')
            .select('*')
            .eq('department_id', id)
            .single();

        if (error) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thống kê khoa',
                error: error.message
            });
        }

        const responseTime = Date.now() - startTime;

        res.json({
            success: true,
            data,
            meta: {
                responseTime: `${responseTime}ms`,
                cached: res.get('X-Cache') === 'HIT',
                lastUpdated: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Department stats route error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải thống kê khoa',
            error: error.message
        });
    }
});

// ============================================================================
// 5. CACHE MANAGEMENT ROUTES
// ============================================================================

// Clear specific cache
router.delete('/cache/:pattern', async (req, res) => {
    try {
        const { pattern } = req.params;
        const clearedCount = await cacheManager.clearPattern(`hospital:${pattern}:*`);
        
        res.json({
            success: true,
            message: `Đã xóa ${clearedCount} cache entries`,
            pattern: `hospital:${pattern}:*`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa cache',
            error: error.message
        });
    }
});

// Refresh materialized views
router.post('/refresh-views', async (req, res) => {
    try {
        const startTime = Date.now();
        
        const { data, error } = await supabase.rpc('refresh_performance_views');
        
        if (error) {
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi refresh materialized views',
                error: error.message
            });
        }

        const responseTime = Date.now() - startTime;

        res.json({
            success: true,
            message: 'Đã refresh tất cả materialized views thành công',
            responseTime: `${responseTime}ms`,
            result: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi refresh views',
            error: error.message
        });
    }
});

module.exports = router;
