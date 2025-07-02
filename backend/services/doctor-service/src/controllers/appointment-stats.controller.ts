import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/database.config';
import logger from '@hospital/shared/dist/utils/logger';

interface AppointmentStatsQuery {
  period?: 'week' | 'month' | 'year';
  start_date?: string;
  include_trends?: boolean;
}

interface DailyTrendData {
  date: string;
  day_name: string;
  total: number;
  completed: number;
  new_patients: number;
  follow_up: number;
  cancelled: number;
  revenue: number;
}

interface AppointmentTypeBreakdown {
  type: string;
  count: number;
  percentage: number;
}

interface AppointmentStatsResponse {
  // Current period stats
  total_appointments: number;
  completed_appointments: number;
  scheduled_appointments: number;
  cancelled_appointments: number;
  no_show_appointments: number;
  
  // Patient statistics
  total_patients: number;
  new_patients: number;
  returning_patients: number;
  
  // Performance metrics
  success_rate: number;
  average_rating: number;
  
  // Trend data for charts
  weekly_data: DailyTrendData[];
  
  // Monthly overview
  monthly_stats: {
    current_month: number;
    previous_month: number;
    growth_percentage: number;
  };
  
  // Appointment types breakdown
  appointment_types: AppointmentTypeBreakdown[];
  
  // Period information
  period: string;
  period_start: string;
  period_end: string;
}

export class AppointmentStatsController {
  
  /**
   * Lấy thống kê appointment chi tiết cho bác sĩ
   * GET /api/doctors/:doctorId/appointment-stats
   */
  async getDoctorAppointmentStats(req: Request, res: Response): Promise<void> {
    try {
      const { doctorId } = req.params;
      const { 
        period = 'week', 
        start_date,
        include_trends = 'true' 
      } = req.query as AppointmentStatsQuery & { include_trends?: string };

      logger.info('📊 [AppointmentStats] Getting stats for doctor', {
        doctorId,
        period,
        start_date,
        include_trends
      });

      // 1. Lấy thống kê cơ bản từ database function
      const { data: basicStats, error: statsError } = await supabaseAdmin
        .rpc('get_doctor_appointment_stats', {
          p_doctor_id: doctorId,
          p_period: period,
          p_start_date: start_date || null
        });

      if (statsError) {
        logger.error('❌ [AppointmentStats] Error getting basic stats:', statsError);
        res.status(500).json({
          success: false,
          error: { message: 'Lỗi khi lấy thống kê cơ bản' }
        });
        return;
      }

      const stats = basicStats?.[0] || {
        total_appointments: 0,
        completed_appointments: 0,
        scheduled_appointments: 0,
        cancelled_appointments: 0,
        no_show_appointments: 0,
        new_patients: 0,
        returning_patients: 0,
        average_rating: 0,
        success_rate: 0,
        period_start: new Date().toISOString().split('T')[0],
        period_end: new Date().toISOString().split('T')[0]
      };

      // 2. Lấy dữ liệu trend theo ngày (nếu được yêu cầu)
      let weeklyData: DailyTrendData[] = [];
      if (include_trends === 'true') {
        weeklyData = await this.getWeeklyTrendData(doctorId, period);
      }

      // 3. Lấy thống kê so sánh tháng hiện tại vs tháng trước
      const monthlyComparison = await this.getMonthlyComparison(doctorId);

      // 4. Lấy phân loại appointment types
      const appointmentTypes = await this.getAppointmentTypesBreakdown(doctorId, period);

      // 5. Tính tổng số bệnh nhân unique
      const totalPatients = await this.getTotalUniquePatients(doctorId, period);

      const response: AppointmentStatsResponse = {
        // Basic stats
        total_appointments: Number(stats.total_appointments) || 0,
        completed_appointments: Number(stats.completed_appointments) || 0,
        scheduled_appointments: Number(stats.scheduled_appointments) || 0,
        cancelled_appointments: Number(stats.cancelled_appointments) || 0,
        no_show_appointments: Number(stats.no_show_appointments) || 0,
        
        // Patient stats
        total_patients: totalPatients,
        new_patients: Number(stats.new_patients) || 0,
        returning_patients: Number(stats.returning_patients) || 0,
        
        // Performance
        success_rate: Number(stats.success_rate) || 0,
        average_rating: Number(stats.average_rating) || 0,
        
        // Trends
        weekly_data: weeklyData,
        monthly_stats: monthlyComparison,
        appointment_types: appointmentTypes,
        
        // Period info
        period: period,
        period_start: stats.period_start,
        period_end: stats.period_end
      };

      logger.info('✅ [AppointmentStats] Successfully retrieved stats', {
        doctorId,
        totalAppointments: response.total_appointments,
        successRate: response.success_rate,
        trendsIncluded: weeklyData.length > 0
      });

      res.json({
        success: true,
        data: response
      });

    } catch (error) {
      logger.error('💥 [AppointmentStats] Unexpected error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Lỗi server khi lấy thống kê appointment' }
      });
    }
  }

  /**
   * Lấy dữ liệu trend theo tuần
   */
  private async getWeeklyTrendData(doctorId: string, period: string): Promise<DailyTrendData[]> {
    try {
      const daysBack = period === 'month' ? 30 : period === 'year' ? 365 : 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const { data: trendData, error } = await supabaseAdmin
        .from('appointments')
        .select(`
          appointment_date,
          status,
          patient_type,
          doctors!inner(consultation_fee)
        `)
        .eq('doctor_id', doctorId)
        .gte('appointment_date', startDate.toISOString().split('T')[0])
        .order('appointment_date');

      if (error) {
        logger.error('❌ [WeeklyTrends] Database error:', error);
        return [];
      }

      // Group by date and calculate metrics
      const groupedData = new Map<string, DailyTrendData>();
      
      trendData?.forEach(appointment => {
        const date = appointment.appointment_date;
        const dayName = this.getDayNameInVietnamese(new Date(date));
        
        if (!groupedData.has(date)) {
          groupedData.set(date, {
            date,
            day_name: dayName,
            total: 0,
            completed: 0,
            new_patients: 0,
            follow_up: 0,
            cancelled: 0,
            revenue: 0
          });
        }

        const dayData = groupedData.get(date)!;
        dayData.total++;
        
        if (appointment.status === 'completed') {
          dayData.completed++;
          dayData.revenue += (appointment.doctors as any)?.consultation_fee || 0;
        }
        
        if (appointment.status === 'cancelled') {
          dayData.cancelled++;
        }
        
        if (appointment.patient_type === 'new') {
          dayData.new_patients++;
        } else {
          dayData.follow_up++;
        }
      });

      return Array.from(groupedData.values()).sort((a, b) => a.date.localeCompare(b.date));

    } catch (error) {
      logger.error('💥 [WeeklyTrends] Error:', error);
      return [];
    }
  }

  /**
   * Lấy so sánh thống kê tháng hiện tại vs tháng trước
   */
  private async getMonthlyComparison(doctorId: string) {
    try {
      const currentMonth = new Date();
      const previousMonth = new Date();
      previousMonth.setMonth(previousMonth.getMonth() - 1);

      const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const previousMonthStart = new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 1);
      const previousMonthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0);

      // Current month stats
      const { count: currentCount } = await supabaseAdmin
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctorId)
        .gte('appointment_date', currentMonthStart.toISOString().split('T')[0]);

      // Previous month stats
      const { count: previousCount } = await supabaseAdmin
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctorId)
        .gte('appointment_date', previousMonthStart.toISOString().split('T')[0])
        .lte('appointment_date', previousMonthEnd.toISOString().split('T')[0]);

      const growthPercentage = previousCount && previousCount > 0 
        ? ((currentCount || 0) - previousCount) / previousCount * 100 
        : 0;

      return {
        current_month: currentCount || 0,
        previous_month: previousCount || 0,
        growth_percentage: Math.round(growthPercentage * 100) / 100
      };

    } catch (error) {
      logger.error('💥 [MonthlyComparison] Error:', error);
      return {
        current_month: 0,
        previous_month: 0,
        growth_percentage: 0
      };
    }
  }

  /**
   * Lấy phân loại appointment types
   */
  private async getAppointmentTypesBreakdown(doctorId: string, period: string): Promise<AppointmentTypeBreakdown[]> {
    try {
      const daysBack = period === 'month' ? 30 : period === 'year' ? 365 : 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const { data: typeData, error } = await supabaseAdmin
        .from('appointments')
        .select('appointment_type')
        .eq('doctor_id', doctorId)
        .gte('appointment_date', startDate.toISOString().split('T')[0]);

      if (error || !typeData) {
        return [];
      }

      const typeCounts = new Map<string, number>();
      const total = typeData.length;

      typeData.forEach(appointment => {
        const type = appointment.appointment_type || 'consultation';
        typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
      });

      return Array.from(typeCounts.entries()).map(([type, count]) => ({
        type: this.translateAppointmentType(type),
        count,
        percentage: total > 0 ? Math.round((count / total) * 100 * 100) / 100 : 0
      }));

    } catch (error) {
      logger.error('💥 [AppointmentTypes] Error:', error);
      return [];
    }
  }

  /**
   * Lấy tổng số bệnh nhân unique
   */
  private async getTotalUniquePatients(doctorId: string, period: string): Promise<number> {
    try {
      const daysBack = period === 'month' ? 30 : period === 'year' ? 365 : 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const { data: patientData, error } = await supabaseAdmin
        .from('appointments')
        .select('patient_id')
        .eq('doctor_id', doctorId)
        .gte('appointment_date', startDate.toISOString().split('T')[0]);

      if (error || !patientData) {
        return 0;
      }

      const uniquePatients = new Set(patientData.map(a => a.patient_id));
      return uniquePatients.size;

    } catch (error) {
      logger.error('💥 [UniquePatients] Error:', error);
      return 0;
    }
  }

  /**
   * Helper: Chuyển đổi tên ngày sang tiếng Việt
   */
  private getDayNameInVietnamese(date: Date): string {
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return days[date.getDay()];
  }

  /**
   * Helper: Dịch appointment type sang tiếng Việt
   */
  private translateAppointmentType(type: string): string {
    const translations: { [key: string]: string } = {
      'consultation': 'Khám tư vấn',
      'follow_up': 'Tái khám',
      'emergency': 'Cấp cứu',
      'routine_checkup': 'Khám định kỳ',
      'surgery': 'Phẫu thuật'
    };
    return translations[type] || type;
  }
}
