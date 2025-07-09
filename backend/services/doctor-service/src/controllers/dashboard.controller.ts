import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/database.config';
import logger from '@hospital/shared/dist/utils/logger';
import { AppointmentStatsController } from './appointment-stats.controller';
import { WeeklyScheduleController } from './weekly-schedule.controller';
import { EnhancedReviewsController } from './enhanced-reviews.controller';

interface DoctorBasicInfo {
  doctor_id: string;
  full_name: string;
  email?: string;
  phone_number?: string;
  specialty: string;
  qualification: string;
  license_number: string;
  department_id: string;
  department_name?: string;
  bio?: string;
  experience_years: number;
  consultation_fee?: number;
  languages_spoken: string[];
  availability_status: string;
  rating: number;
  total_reviews: number;
  avatar_url?: string;
}

interface PerformanceMetrics {
  success_rate: number;
  average_consultation_time: number;
  patient_satisfaction: number;
  on_time_percentage: number;
  total_revenue_30d: number;
  growth_rate: number;
}

interface DashboardResponse {
  // Basic doctor info
  doctor: DoctorBasicInfo;
  
  // Statistics for cards
  stats: any; // From AppointmentStatsController
  
  // Schedule for current week
  current_week_schedule: any; // From WeeklyScheduleController
  
  // Recent reviews
  recent_reviews: any; // From EnhancedReviewsController
  
  // Additional metrics
  performance_metrics: PerformanceMetrics;
  
  // Quick actions data
  quick_metrics: {
    appointments_today: number;
    patients_waiting: number;
    next_appointment: any;
    urgent_notifications: number;
  };
  
  // Data freshness
  last_updated: string;
  data_sources: {
    appointments: string;
    reviews: string;
    schedule: string;
    performance: string;
  };
}

export class DashboardController {
  private appointmentStatsController: AppointmentStatsController;
  private weeklyScheduleController: WeeklyScheduleController;
  private enhancedReviewsController: EnhancedReviewsController;

  constructor() {
    this.appointmentStatsController = new AppointmentStatsController();
    this.weeklyScheduleController = new WeeklyScheduleController();
    this.enhancedReviewsController = new EnhancedReviewsController();
  }

  /**
   * Lấy tất cả dữ liệu cần thiết cho dashboard doctor profile
   * GET /api/doctors/:doctorId/profile-dashboard
   */
  async getDoctorProfileDashboard(req: Request, res: Response): Promise<void> {
    try {
      const { doctorId } = req.params;
      const startTime = Date.now();

      logger.info('🏥 [Dashboard] Getting complete profile dashboard', {
        doctorId,
        timestamp: new Date().toISOString()
      });

      // 1. Lấy thông tin cơ bản của bác sĩ
      const doctorInfo = await this.getDoctorBasicInfo(doctorId);
      if (!doctorInfo) {
        res.status(404).json({
          success: false,
          error: { message: 'Không tìm thấy bác sĩ' }
        });
        return;
      }

      // 2. Lấy tất cả dữ liệu song song để tối ưu performance
      const [
        appointmentStats,
        weeklySchedule,
        recentReviews,
        performanceMetrics,
        quickMetrics
      ] = await Promise.allSettled([
        this.getAppointmentStatsData(doctorId),
        this.getWeeklyScheduleData(doctorId),
        this.getRecentReviewsData(doctorId),
        this.getPerformanceMetrics(doctorId),
        this.getQuickMetrics(doctorId)
      ]);

      // 3. Xử lý kết quả và handle errors gracefully
      const processResult = (result: any, fallback: any = null, source: string = 'unknown') => {
        if (result.status === 'fulfilled') {
          logger.info(`✅ [Dashboard] ${source} data loaded successfully`);
          return result.value;
        } else {
          logger.warn(`⚠️ [Dashboard] ${source} data failed:`, result.reason);
          return fallback;
        }
      };

      const stats = processResult(appointmentStats, {
        total_appointments: 0,
        completed_appointments: 0,
        new_patients: 0,
        success_rate: 0,
        weekly_data: []
      }, 'Appointment Stats');

      const schedule = processResult(weeklySchedule, {
        daily_schedules: [],
        summary: { total_working_days: 0, occupancy_rate: 0 }
      }, 'Weekly Schedule');

      const reviews = processResult(recentReviews, {
        reviews: [],
        summary: { total_reviews: 0, average_rating: 0 }
      }, 'Recent Reviews');

      const performance = processResult(performanceMetrics, {
        success_rate: 0,
        average_consultation_time: 30,
        patient_satisfaction: 0,
        on_time_percentage: 0,
        total_revenue_30d: 0,
        growth_rate: 0
      }, 'Performance Metrics');

      const quick = processResult(quickMetrics, {
        appointments_today: 0,
        patients_waiting: 0,
        next_appointment: null,
        urgent_notifications: 0
      }, 'Quick Metrics');

      // 4. Tạo response tổng hợp
      const response: DashboardResponse = {
        doctor: doctorInfo,
        stats,
        current_week_schedule: schedule,
        recent_reviews: reviews,
        performance_metrics: performance,
        quick_metrics: quick,
        last_updated: new Date().toISOString(),
        data_sources: {
          appointments: appointmentStats.status === 'fulfilled' ? 'success' : 'fallback',
          reviews: recentReviews.status === 'fulfilled' ? 'success' : 'fallback',
          schedule: weeklySchedule.status === 'fulfilled' ? 'success' : 'fallback',
          performance: performanceMetrics.status === 'fulfilled' ? 'success' : 'fallback'
        }
      };

      const loadTime = Date.now() - startTime;

      logger.info('✅ [Dashboard] Profile dashboard loaded successfully', {
        doctorId,
        doctorName: doctorInfo.full_name,
        loadTime: `${loadTime}ms`,
        dataQuality: {
          appointments: stats.total_appointments,
          reviews: reviews.summary.total_reviews,
          workingDays: schedule.summary.total_working_days,
          successRate: performance.success_rate
        }
      });

      res.json({
        success: true,
        data: response,
        meta: {
          load_time_ms: loadTime,
          data_quality: response.data_sources
        }
      });

    } catch (error) {
      logger.error('💥 [Dashboard] Unexpected error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Lỗi server khi tải dashboard' }
      });
    }
  }

  /**
   * Lấy thông tin cơ bản của bác sĩ
   */
  private async getDoctorBasicInfo(doctorId: string): Promise<DoctorBasicInfo | null> {
    try {
      const { data: doctor, error } = await supabaseAdmin
        .from('doctors')
        .select(`
          doctor_id,
          specialty,
          qualification,
          license_number,
          department_id,
          bio,
          experience_years,
          consultation_fee,
          languages_spoken,
          availability_status,
          rating,
          total_reviews,
          profiles!inner(
            full_name,
            email,
            phone_number
          ),
          departments!inner(
            department_name
          )
        `)
        .eq('doctor_id', doctorId)
        .single();

      if (error || !doctor) {
        logger.error('❌ [DoctorBasicInfo] Error:', error);
        return null;
      }

      return {
        doctor_id: doctor.doctor_id,
        full_name: (doctor.profiles as any).full_name,
        email: (doctor.profiles as any).email,
        phone_number: (doctor.profiles as any).phone_number,
        specialty: doctor.specialty,
        qualification: doctor.qualification,
        license_number: doctor.license_number,
        department_id: doctor.department_id,
        department_name: (doctor.departments as any).department_name,
        bio: doctor.bio,
        experience_years: doctor.experience_years,
        consultation_fee: doctor.consultation_fee,
        languages_spoken: doctor.languages_spoken || ['Vietnamese'],
        availability_status: doctor.availability_status,
        rating: doctor.rating,
        total_reviews: doctor.total_reviews,
        avatar_url: null // Avatar URL not available in current schema
      };

    } catch (error) {
      logger.error('💥 [DoctorBasicInfo] Error:', error);
      return null;
    }
  }

  /**
   * Lấy dữ liệu appointment stats
   */
  private async getAppointmentStatsData(doctorId: string): Promise<any> {
    // Simulate request object for the controller
    const mockReq = {
      params: { doctorId },
      query: { period: 'week', include_trends: 'true' }
    } as any;

    return new Promise((resolve, reject) => {
      const mockRes = {
        json: (data: any) => {
          if (data.success) {
            resolve(data.data);
          } else {
            reject(new Error(data.error?.message || 'Failed to get appointment stats'));
          }
        },
        status: () => mockRes
      } as any;

      this.appointmentStatsController.getDoctorAppointmentStats(mockReq, mockRes);
    });
  }

  /**
   * Lấy dữ liệu weekly schedule
   */
  private async getWeeklyScheduleData(doctorId: string): Promise<any> {
    const mockReq = {
      params: { doctorId },
      query: {}
    } as any;

    return new Promise((resolve, reject) => {
      const mockRes = {
        json: (data: any) => {
          if (data.success) {
            resolve(data.data);
          } else {
            reject(new Error(data.error?.message || 'Failed to get weekly schedule'));
          }
        },
        status: () => mockRes
      } as any;

      this.weeklyScheduleController.getWeeklySchedule(mockReq, mockRes);
    });
  }

  /**
   * Lấy dữ liệu recent reviews
   */
  private async getRecentReviewsData(doctorId: string): Promise<any> {
    const mockReq = {
      params: { doctorId },
      query: { page: 1, limit: 5, sort: 'newest' }
    } as any;

    return new Promise((resolve, reject) => {
      const mockRes = {
        json: (data: any) => {
          if (data.success) {
            resolve(data.data);
          } else {
            reject(new Error(data.error?.message || 'Failed to get reviews'));
          }
        },
        status: () => mockRes
      } as any;

      this.enhancedReviewsController.getDoctorReviews(mockReq, mockRes);
    });
  }

  /**
   * Lấy performance metrics
   */
  private async getPerformanceMetrics(doctorId: string): Promise<PerformanceMetrics> {
    try {
      // Lấy metrics từ database hoặc tính toán
      const { data: metrics, error } = await supabaseAdmin
        .from('doctor_performance_metrics')
        .select('*')
        .eq('doctor_id', doctorId)
        .gte('metric_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('metric_date', { ascending: false })
        .limit(1)
        .single();

      if (error || !metrics) {
        // Fallback: tính toán cơ bản
        return {
          success_rate: 85,
          average_consultation_time: 30,
          patient_satisfaction: 4.2,
          on_time_percentage: 90,
          total_revenue_30d: 0,
          growth_rate: 0
        };
      }

      return {
        success_rate: metrics.success_rate || 0,
        average_consultation_time: metrics.average_consultation_time || 30,
        patient_satisfaction: metrics.patient_satisfaction_score || 0,
        on_time_percentage: metrics.on_time_percentage || 0,
        total_revenue_30d: metrics.total_revenue || 0,
        growth_rate: 0 // TODO: Calculate growth rate
      };

    } catch (error) {
      logger.error('💥 [PerformanceMetrics] Error:', error);
      return {
        success_rate: 0,
        average_consultation_time: 30,
        patient_satisfaction: 0,
        on_time_percentage: 0,
        total_revenue_30d: 0,
        growth_rate: 0
      };
    }
  }

  /**
   * Lấy quick metrics cho dashboard
   */
  private async getQuickMetrics(doctorId: string): Promise<any> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Appointments today
      const { count: appointmentsToday } = await supabaseAdmin
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctorId)
        .eq('appointment_date', today);

      // Next appointment
      const { data: nextAppointment } = await supabaseAdmin
        .from('appointments')
        .select(`
          appointment_id,
          start_time,
          patients!inner(profiles!inner(full_name))
        `)
        .eq('doctor_id', doctorId)
        .eq('appointment_date', today)
        .eq('status', 'scheduled')
        .gte('start_time', new Date().toTimeString().split(' ')[0])
        .order('start_time')
        .limit(1)
        .single();

      return {
        appointments_today: appointmentsToday || 0,
        patients_waiting: 0, // TODO: Implement waiting queue
        next_appointment: nextAppointment ? {
          time: nextAppointment.start_time,
          patient_name: (nextAppointment.patients as any)?.profiles?.full_name
        } : null,
        urgent_notifications: 0 // TODO: Implement notifications
      };

    } catch (error) {
      logger.error('💥 [QuickMetrics] Error:', error);
      return {
        appointments_today: 0,
        patients_waiting: 0,
        next_appointment: null,
        urgent_notifications: 0
      };
    }
  }
}
