'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RevenueChart, RevenueDistributionChart, StatCard } from '@/components/charts/RevenueChart';
import { 
    TrendingUp, 
    Users, 
    Calendar, 
    DollarSign, 
    Download, 
    BarChart3,
    PieChart,
    Activity,
    Stethoscope,
    Building2,
    CreditCard,
    FileText,
    Filter,
    RefreshCw
} from 'lucide-react';

interface AnalyticsData {
    period: string;
    dateRange: { startDate: string; endDate: string };
    overallStats: any;
    revenueAnalytics: any[];
    patientAnalytics: any[];
    doctorPerformance: any[];
    departmentAnalytics: any[];
    appointmentTrends: any[];
    paymentAnalytics: any[];
    medicalRecordsInsights: any;
    generatedAt: string;
}

export default function AnalyticsDashboard() {
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('month');
    const [refreshing, setRefreshing] = useState(false);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/analytics/hospital-overview?period=${period}`);
            const data = await response.json();

            if (data.success) {
                setAnalyticsData(data.data);
            } else {
                console.error('Failed to fetch analytics:', data.error);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchAnalytics();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const getPeriodLabel = (period: string) => {
        switch (period) {
            case 'day': return 'Hôm nay';
            case 'week': return '7 ngày qua';
            case 'month': return '30 ngày qua';
            case 'year': return '365 ngày qua';
            default: return 'Tháng này';
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <Activity className="h-8 w-8 mx-auto text-gray-400 mb-2 animate-spin" />
                        <p className="text-gray-600">Đang tải dữ liệu analytics...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!analyticsData) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Không thể tải dữ liệu</h3>
                    <p className="text-gray-600 mb-4">Có lỗi xảy ra khi tải dữ liệu analytics.</p>
                    <Button onClick={fetchAnalytics}>Thử lại</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                    <p className="text-gray-600 mt-1">
                        Báo cáo tổng quan hệ thống - {getPeriodLabel(period)}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="day">Hôm nay</SelectItem>
                            <SelectItem value="week">7 ngày qua</SelectItem>
                            <SelectItem value="month">30 ngày qua</SelectItem>
                            <SelectItem value="year">365 ngày qua</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button 
                        variant="outline" 
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Làm mới
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Xuất báo cáo
                    </Button>
                </div>
            </div>

            {/* Overall Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Tổng doanh thu"
                    value={formatCurrency(analyticsData.overallStats.total_revenue || 0)}
                    icon={<DollarSign className="h-6 w-6" />}
                    color="green"
                />
                <StatCard
                    title="Bệnh nhân hoạt động"
                    value={analyticsData.overallStats.total_patients || 0}
                    icon={<Users className="h-6 w-6" />}
                    color="blue"
                />
                <StatCard
                    title="Lượt khám hoàn thành"
                    value={analyticsData.overallStats.completed_appointments || 0}
                    icon={<Calendar className="h-6 w-6" />}
                    color="yellow"
                />
                <StatCard
                    title="Bác sĩ hoạt động"
                    value={analyticsData.overallStats.active_doctors || 0}
                    icon={<Stethoscope className="h-6 w-6" />}
                    color="red"
                />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Xu hướng doanh thu
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RevenueChart 
                            data={analyticsData.revenueAnalytics.map(item => ({
                                date: item.date,
                                revenue: item.daily_revenue || 0,
                                appointments: item.transaction_count || 0
                            }))} 
                            type="line" 
                            height={300} 
                        />
                    </CardContent>
                </Card>

                {/* Department Performance */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Hiệu suất theo khoa
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {analyticsData.departmentAnalytics.slice(0, 5).map((dept, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{dept.department_name}</p>
                                        <p className="text-sm text-gray-600">
                                            {dept.doctor_count} bác sĩ • {dept.total_appointments} lượt khám
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-green-600">
                                            {formatCurrency(dept.total_revenue || 0)}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {dept.unique_patients} bệnh nhân
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Payment Methods */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Phương thức thanh toán
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RevenueDistributionChart 
                            data={analyticsData.paymentAnalytics.map((payment, index) => ({
                                name: payment.payment_method,
                                value: payment.total_amount || 0,
                                color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][index % 4]
                            }))}
                            height={250}
                        />
                    </CardContent>
                </Card>

                {/* Top Doctors */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Stethoscope className="h-5 w-5" />
                            Bác sĩ xuất sắc
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {analyticsData.doctorPerformance.slice(0, 5).map((doctor, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{doctor.full_name}</p>
                                        <p className="text-sm text-gray-600">{doctor.specialty}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-blue-600">
                                            {formatCurrency(doctor.total_revenue || 0)}
                                        </p>
                                        <div className="flex items-center gap-1">
                                            <span className="text-sm text-gray-500">
                                                {doctor.completed_appointments} lượt
                                            </span>
                                            {doctor.avg_rating > 0 && (
                                                <Badge variant="secondary" className="text-xs">
                                                    ⭐ {doctor.avg_rating.toFixed(1)}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Medical Records Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Hồ sơ y tế
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tổng hồ sơ</span>
                                <span className="font-semibold">
                                    {analyticsData.medicalRecordsInsights.total_records || 0}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Hồ sơ hoạt động</span>
                                <span className="font-semibold text-green-600">
                                    {analyticsData.medicalRecordsInsights.active_records || 0}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Bệnh nhân duy nhất</span>
                                <span className="font-semibold">
                                    {analyticsData.medicalRecordsInsights.unique_patients || 0}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Chi phí TB/lần</span>
                                <span className="font-semibold text-blue-600">
                                    {formatCurrency(analyticsData.medicalRecordsInsights.avg_treatment_cost || 0)}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-gray-500">
                Dữ liệu được cập nhật lần cuối: {new Date(analyticsData.generatedAt).toLocaleString('vi-VN')}
            </div>
        </div>
    );
}
