'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3,
  Calendar,
  Download,
  TrendingUp,
  Users,
  Clock,
  FileText,
  Activity
} from 'lucide-react';

interface DailyStats {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  totalCheckIns: number;
  averageWaitTime: number;
  busyHours: { hour: string; count: number }[];
  departmentStats: { specialty: string; count: number }[];
}

interface WeeklyStats {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalCheckIns: number;
  dailyBreakdown: { date: string; total: number; completed: number; cancelled: number }[];
  specialtyStats: { specialty: string; count: number }[];
}

interface PatientFlowData {
  hourlyFlow: { hour: string; count: number }[];
  peakHours: string[];
  totalPatients: number;
}

export function ReportsSystem() {
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'patient-flow'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [patientFlow, setPatientFlow] = useState<PatientFlowData | null>(null);

  // Mock data
  const mockDailyStats: DailyStats = {
    totalAppointments: 45,
    completedAppointments: 38,
    cancelledAppointments: 5,
    noShowAppointments: 2,
    totalCheckIns: 43,
    averageWaitTime: 18,
    busyHours: [
      { hour: '09:00', count: 12 },
      { hour: '10:00', count: 15 },
      { hour: '14:00', count: 10 },
      { hour: '15:00', count: 8 }
    ],
    departmentStats: [
      { specialty: 'Nội khoa', count: 15 },
      { specialty: 'Ngoại khoa', count: 12 },
      { specialty: 'Sản phụ khoa', count: 8 },
      { specialty: 'Nhi khoa', count: 10 }
    ]
  };

  const mockWeeklyStats: WeeklyStats = {
    totalAppointments: 315,
    completedAppointments: 280,
    cancelledAppointments: 25,
    totalCheckIns: 290,
    dailyBreakdown: [
      { date: '2025-01-06', total: 45, completed: 40, cancelled: 3 },
      { date: '2025-01-07', total: 48, completed: 42, cancelled: 4 },
      { date: '2025-01-08', total: 52, completed: 48, cancelled: 2 },
      { date: '2025-01-09', total: 45, completed: 38, cancelled: 5 },
      { date: '2025-01-10', total: 50, completed: 45, cancelled: 3 }
    ],
    specialtyStats: [
      { specialty: 'Nội khoa', count: 85 },
      { specialty: 'Ngoại khoa', count: 72 },
      { specialty: 'Sản phụ khoa', count: 58 },
      { specialty: 'Nhi khoa', count: 65 }
    ]
  };

  const mockPatientFlow: PatientFlowData = {
    hourlyFlow: [
      { hour: '08:00', count: 5 },
      { hour: '09:00', count: 12 },
      { hour: '10:00', count: 15 },
      { hour: '11:00', count: 8 },
      { hour: '14:00', count: 10 },
      { hour: '15:00', count: 8 },
      { hour: '16:00', count: 6 }
    ],
    peakHours: ['09:00', '10:00', '14:00'],
    totalPatients: 64
  };

  useEffect(() => {
    loadReport();
  }, [reportType, selectedDate, startDate, endDate]);

  const loadReport = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      switch (reportType) {
        case 'daily':
          setDailyStats(mockDailyStats);
          break;
        case 'weekly':
          setWeeklyStats(mockWeeklyStats);
          break;
        case 'patient-flow':
          setPatientFlow(mockPatientFlow);
          break;
      }
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    // Simulate export functionality
    alert('Xuất báo cáo thành công!');
  };

  const renderDailyReport = () => {
    if (!dailyStats) return null;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Tổng lịch hẹn</p>
                  <p className="text-2xl font-bold">{dailyStats.totalAppointments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Đã check-in</p>
                  <p className="text-2xl font-bold">{dailyStats.totalCheckIns}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Hoàn thành</p>
                  <p className="text-2xl font-bold">{dailyStats.completedAppointments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Thời gian chờ TB</p>
                  <p className="text-2xl font-bold">{dailyStats.averageWaitTime}p</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Busy Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Giờ cao điểm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dailyStats.busyHours.map((hour, index) => (
                <div key={hour.hour} className="flex justify-between items-center">
                  <span>{hour.hour}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${(hour.count / 15) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{hour.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Department Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Thống kê theo khoa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dailyStats.departmentStats.map((dept) => (
                <div key={dept.specialty} className="flex justify-between items-center">
                  <span>{dept.specialty}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${(dept.count / 15) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{dept.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderWeeklyReport = () => {
    if (!weeklyStats) return null;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Tổng lịch hẹn</p>
                  <p className="text-2xl font-bold">{weeklyStats.totalAppointments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Hoàn thành</p>
                  <p className="text-2xl font-bold">{weeklyStats.completedAppointments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Check-in</p>
                  <p className="text-2xl font-bold">{weeklyStats.totalCheckIns}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-sm text-gray-600">Hủy</p>
                  <p className="text-2xl font-bold">{weeklyStats.cancelledAppointments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Thống kê theo ngày</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {weeklyStats.dailyBreakdown.map((day) => (
                <div key={day.date} className="grid grid-cols-4 gap-4 p-2 border rounded">
                  <span className="font-medium">{day.date}</span>
                  <span>Tổng: {day.total}</span>
                  <span className="text-green-600">Hoàn thành: {day.completed}</span>
                  <span className="text-red-600">Hủy: {day.cancelled}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderPatientFlowReport = () => {
    if (!patientFlow) return null;

    return (
      <div className="space-y-6">
        {/* Summary */}
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Tổng số bệnh nhân</p>
              <p className="text-3xl font-bold">{patientFlow.totalPatients}</p>
              <p className="text-sm text-gray-600 mt-2">
                Giờ cao điểm: {patientFlow.peakHours.join(', ')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Hourly Flow */}
        <Card>
          <CardHeader>
            <CardTitle>Luồng bệnh nhân theo giờ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {patientFlow.hourlyFlow.map((hour) => (
                <div key={hour.hour} className="flex justify-between items-center">
                  <span>{hour.hour}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-40 bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${
                          patientFlow.peakHours.includes(hour.hour) 
                            ? 'bg-red-500' 
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${(hour.count / 15) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8">{hour.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Báo cáo hoạt động
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Loại báo cáo</Label>
              <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Báo cáo ngày</SelectItem>
                  <SelectItem value="weekly">Báo cáo tuần</SelectItem>
                  <SelectItem value="patient-flow">Luồng bệnh nhân</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {reportType === 'daily' || reportType === 'patient-flow' ? (
              <div>
                <Label>Ngày</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            ) : (
              <>
                <div>
                  <Label>Từ ngày</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Đến ngày</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="flex items-end">
              <Button onClick={exportReport} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Xuất báo cáo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      {loading ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">Đang tải báo cáo...</div>
          </CardContent>
        </Card>
      ) : (
        <>
          {reportType === 'daily' && renderDailyReport()}
          {reportType === 'weekly' && renderWeeklyReport()}
          {reportType === 'patient-flow' && renderPatientFlowReport()}
        </>
      )}
    </div>
  );
}
