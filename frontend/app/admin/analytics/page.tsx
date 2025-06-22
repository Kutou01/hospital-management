'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    RefreshCw,
    ArrowUpIcon,
    ArrowDownIcon,
    Eye,
    Clock,
    Heart,
    UserCheck,
    Star,
    Award,
    Target
} from 'lucide-react';
import { AdminLayout } from '@/components/layout/UniversalLayout';

interface AnalyticsData {
    overallStats: {
        total_revenue: number;
        total_patients: number;
        completed_appointments: number;
        active_doctors: number;
        medical_records_created: number;
        unique_patients_served: number;
    };
    revenueAnalytics: Array<{
        date: string;
        daily_revenue: number;
        transaction_count: number;
        avg_transaction_value: number;
    }>;
    patientAnalytics: Array<{
        gender: string;
        count: number;
        avg_age: number;
    }>;
    doctorPerformance: Array<{
        doctor_id: string;
        full_name: string;
        specialty: string;
        total_appointments: number;
        completed_appointments: number;
        total_revenue: number;
        avg_rating: number;
        total_reviews: number;
    }>;
    departmentAnalytics: Array<{
        department_name: string;
        total_appointments: number;
        total_revenue: number;
        avg_rating: number;
    }>;
    appointmentTrends: Array<{
        date: string;
        total_appointments: number;
        completed_appointments: number;
        cancelled_appointments: number;
    }>;
    paymentAnalytics: Array<{
        payment_method: string;
        total_amount: number;
        transaction_count: number;
        avg_amount: number;
    }>;
}

export default function AnalyticsDashboard() {
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('month');
    const [refreshing, setRefreshing] = useState(false);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/analytics/simple`);
            const data = await response.json();

            if (data.success) {
                setAnalyticsData(data.data);
            } else {
                console.error('Lỗi tải dữ liệu phân tích:', data.error);
            }
        } catch (error) {
            console.error('Lỗi kết nối API:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchAnalytics();
        setRefreshing(false);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('vi-VN').format(num);
    };

    const getPeriodLabel = (period: string) => {
        switch (period) {
            case 'day': return 'Hôm nay';
            case 'week': return '7 ngày qua';
            case 'month': return '30 ngày qua';
            case 'year': return '365 ngày qua';
            default: return '30 ngày qua';
        }
    };

    const calculateGrowth = (current: number, previous: number) => {
        if (previous === 0) return 0;
        return ((current - previous) / previous) * 100;
    };

    if (loading) {
        return (
            <AdminLayout title="Phân tích tổng quan" activePage="analytics">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                        <p className="text-gray-600">Đang tải dữ liệu phân tích...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    if (!analyticsData) {
        return (
            <AdminLayout title="Phân tích tổng quan" activePage="analytics">
                <div className="text-center py-12">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Không có dữ liệu</h3>
                    <p className="text-gray-600 mb-4">Không thể tải dữ liệu phân tích. Vui lòng thử lại.</p>
                    <Button onClick={fetchAnalytics} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Thử lại
                    </Button>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Phân tích tổng quan" activePage="analytics">
            <div className="space-y-6">
                {/* Header với điều khiển */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">📊 Phân tích tổng quan</h1>
                        <p className="text-gray-600 mt-1">
                            Báo cáo chi tiết hoạt động bệnh viện - {getPeriodLabel(period)}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Select value={period} onValueChange={setPeriod}>
                            <SelectTrigger className="w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="day">📅 Hôm nay</SelectItem>
                                <SelectItem value="week">📅 7 ngày qua</SelectItem>
                                <SelectItem value="month">📅 30 ngày qua</SelectItem>
                                <SelectItem value="year">📅 365 ngày qua</SelectItem>
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
                        <Button variant="default" className="flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            Xuất báo cáo
                        </Button>
                    </div>
                </div>

                {/* Thống kê tổng quan */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="💰 Tổng doanh thu"
                        value={formatCurrency(analyticsData.overallStats.total_revenue || 0)}
                        icon={<DollarSign className="h-6 w-6" />}
                        color="green"
                        subtitle={`${formatNumber(analyticsData.revenueAnalytics?.length || 0)} giao dịch`}
                    />
                    <StatCard
                        title="👥 Bệnh nhân hoạt động"
                        value={formatNumber(analyticsData.overallStats.total_patients || 0)}
                        icon={<Users className="h-6 w-6" />}
                        color="blue"
                        subtitle={`${formatNumber(analyticsData.overallStats.unique_patients_served || 0)} lượt khám`}
                    />
                    <StatCard
                        title="📅 Lịch hẹn hoàn thành"
                        value={formatNumber(analyticsData.overallStats.completed_appointments || 0)}
                        icon={<Calendar className="h-6 w-6" />}
                        color="yellow"
                        subtitle="Đã hoàn thành"
                    />
                    <StatCard
                        title="👨‍⚕️ Bác sĩ hoạt động"
                        value={formatNumber(analyticsData.overallStats.active_doctors || 0)}
                        icon={<Stethoscope className="h-6 w-6" />}
                        color="red"
                        subtitle="Đang làm việc"
                    />
                </div>

                {/* Tabs cho các phân tích chi tiết */}
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="overview">🏥 Tổng quan</TabsTrigger>
                        <TabsTrigger value="revenue">💰 Doanh thu</TabsTrigger>
                        <TabsTrigger value="patients">👥 Bệnh nhân</TabsTrigger>
                        <TabsTrigger value="doctors">👨‍⚕️ Bác sĩ</TabsTrigger>
                        <TabsTrigger value="departments">🏢 Khoa phòng</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview">
                        <OverviewTab analyticsData={analyticsData} />
                    </TabsContent>

                    <TabsContent value="revenue">
                        <RevenueTab analyticsData={analyticsData} />
                    </TabsContent>

                    <TabsContent value="patients">
                        <PatientsTab analyticsData={analyticsData} />
                    </TabsContent>

                    <TabsContent value="doctors">
                        <DoctorsTab analyticsData={analyticsData} />
                    </TabsContent>

                    <TabsContent value="departments">
                        <DepartmentsTab analyticsData={analyticsData} />
                    </TabsContent>
                </Tabs>
            </div>
        </AdminLayout>
    );
}

// Component StatCard
interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: 'green' | 'blue' | 'yellow' | 'red';
    subtitle?: string;
    growth?: number;
}

function StatCard({ title, value, icon, color, subtitle, growth }: StatCardProps) {
    const colorClasses = {
        green: 'bg-green-50 border-green-200 text-green-700',
        blue: 'bg-blue-50 border-blue-200 text-blue-700',
        yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
        red: 'bg-red-50 border-red-200 text-red-700',
    };

    const iconColorClasses = {
        green: 'text-green-600 bg-green-100',
        blue: 'text-blue-600 bg-blue-100',
        yellow: 'text-yellow-600 bg-yellow-100',
        red: 'text-red-600 bg-red-100',
    };

    return (
        <Card className={`${colorClasses[color]} border-2 hover:shadow-lg transition-shadow`}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium opacity-80">{title}</p>
                        <p className="text-2xl font-bold mt-1">{value}</p>
                        {subtitle && (
                            <p className="text-xs opacity-70 mt-1">{subtitle}</p>
                        )}
                        {growth !== undefined && (
                            <div className="flex items-center mt-2">
                                {growth > 0 ? (
                                    <ArrowUpIcon className="h-3 w-3 text-green-600 mr-1" />
                                ) : (
                                    <ArrowDownIcon className="h-3 w-3 text-red-600 mr-1" />
                                )}
                                <span className={`text-xs font-medium ${growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {Math.abs(growth).toFixed(1)}%
                                </span>
                            </div>
                        )}
                    </div>
                    <div className={`p-3 rounded-lg ${iconColorClasses[color]}`}>
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Overview Tab Component
function OverviewTab({ analyticsData }: { analyticsData: AnalyticsData }) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('vi-VN').format(num);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Xu hướng doanh thu */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        📈 Xu hướng doanh thu gần đây
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {analyticsData.revenueAnalytics.slice(0, 7).map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {new Date(item.date).toLocaleDateString('vi-VN')}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {item.transaction_count} giao dịch
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-green-600">
                                        {formatCurrency(item.daily_revenue)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        TB: {formatCurrency(item.avg_transaction_value || 0)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Thống kê bệnh nhân */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        👥 Phân tích bệnh nhân
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {analyticsData.patientAnalytics.map((item, index) => {
                            const genderLabel = item.gender === 'male' ? '👨 Nam' :
                                              item.gender === 'female' ? '👩 Nữ' : '🧑 Khác';
                            const percentage = (item.count / analyticsData.overallStats.total_patients * 100);

                            return (
                                <div key={index} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">{genderLabel}</span>
                                        <div className="text-right">
                                            <span className="font-bold">{formatNumber(item.count)}</span>
                                            <span className="text-sm text-gray-500 ml-2">
                                                ({percentage.toFixed(1)}%)
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${
                                                item.gender === 'male' ? 'bg-blue-500' :
                                                item.gender === 'female' ? 'bg-pink-500' : 'bg-purple-500'
                                            }`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-gray-600">
                                        Tuổi trung bình: {Math.round(item.avg_age || 0)} tuổi
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Revenue Tab Component
function RevenueTab({ analyticsData }: { analyticsData: AnalyticsData }) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const totalRevenue = analyticsData.revenueAnalytics.reduce((sum, item) => sum + item.daily_revenue, 0);
    const totalTransactions = analyticsData.revenueAnalytics.reduce((sum, item) => sum + item.transaction_count, 0);
    const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    return (
        <div className="space-y-6">
            {/* Tóm tắt doanh thu */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                    <CardContent className="p-6 text-center">
                        <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
                        <p className="text-sm text-green-700 mb-1">💰 Tổng doanh thu</p>
                        <p className="text-2xl font-bold text-green-800">{formatCurrency(totalRevenue)}</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="p-6 text-center">
                        <CreditCard className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                        <p className="text-sm text-blue-700 mb-1">🧾 Tổng giao dịch</p>
                        <p className="text-2xl font-bold text-blue-800">{totalTransactions.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                    <CardContent className="p-6 text-center">
                        <Target className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                        <p className="text-sm text-purple-700 mb-1">📊 Giá trị TB/giao dịch</p>
                        <p className="text-2xl font-bold text-purple-800">{formatCurrency(avgTransactionValue)}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Chi tiết doanh thu theo ngày */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        📈 Chi tiết doanh thu theo ngày
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {analyticsData.revenueAnalytics.map((item, index) => {
                            const percentage = totalRevenue > 0 ? (item.daily_revenue / totalRevenue * 100) : 0;

                            return (
                                <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                📅 {new Date(item.date).toLocaleDateString('vi-VN', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {item.transaction_count} giao dịch
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-green-600">
                                                {formatCurrency(item.daily_revenue)}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {percentage.toFixed(1)}% tổng doanh thu
                                            </p>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Giá trị TB: {formatCurrency(item.avg_transaction_value || 0)}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Phương thức thanh toán */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        💳 Phân tích phương thức thanh toán
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {analyticsData.paymentAnalytics.map((method, index) => {
                            const percentage = totalRevenue > 0 ? (method.total_amount / totalRevenue * 100) : 0;

                            return (
                                <div key={index} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <p className="font-medium text-gray-900 capitalize">
                                                💳 {method.payment_method || 'Không xác định'}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {method.transaction_count} giao dịch
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-blue-600">
                                                {formatCurrency(method.total_amount)}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {percentage.toFixed(1)}% tổng doanh thu
                                            </p>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div
                                            className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Giá trị TB: {formatCurrency(method.avg_amount || 0)}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Patients Tab Component
function PatientsTab({ analyticsData }: { analyticsData: AnalyticsData }) {
    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('vi-VN').format(num);
    };

    const totalPatients = analyticsData.patientAnalytics.reduce((sum, item) => sum + item.count, 0);

    return (
        <div className="space-y-6">
            {/* Thống kê tổng quan bệnh nhân */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="p-6 text-center">
                        <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                        <p className="text-sm text-blue-700 mb-1">👥 Tổng bệnh nhân</p>
                        <p className="text-2xl font-bold text-blue-800">{formatNumber(totalPatients)}</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                    <CardContent className="p-6 text-center">
                        <UserCheck className="h-8 w-8 mx-auto mb-2 text-green-600" />
                        <p className="text-sm text-green-700 mb-1">✅ Đã khám</p>
                        <p className="text-2xl font-bold text-green-800">
                            {formatNumber(analyticsData.overallStats.unique_patients_served)}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                    <CardContent className="p-6 text-center">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                        <p className="text-sm text-purple-700 mb-1">📋 Hồ sơ y tế</p>
                        <p className="text-2xl font-bold text-purple-800">
                            {formatNumber(analyticsData.overallStats.medical_records_created)}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                    <CardContent className="p-6 text-center">
                        <Calendar className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                        <p className="text-sm text-orange-700 mb-1">📅 Lịch hẹn</p>
                        <p className="text-2xl font-bold text-orange-800">
                            {formatNumber(analyticsData.overallStats.completed_appointments)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Phân tích giới tính và độ tuổi */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        👥 Phân tích nhân khẩu học
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Phân bố giới tính */}
                        <div>
                            <h4 className="font-medium mb-4">🚻 Phân bố theo giới tính</h4>
                            <div className="space-y-4">
                                {analyticsData.patientAnalytics.map((item, index) => {
                                    const genderInfo = {
                                        male: { label: '👨 Nam giới', color: 'bg-blue-500', bgColor: 'bg-blue-50' },
                                        female: { label: '👩 Nữ giới', color: 'bg-pink-500', bgColor: 'bg-pink-50' },
                                        other: { label: '🧑 Khác', color: 'bg-purple-500', bgColor: 'bg-purple-50' }
                                    };

                                    const info = genderInfo[item.gender as keyof typeof genderInfo] || genderInfo.other;
                                    const percentage = totalPatients > 0 ? (item.count / totalPatients * 100) : 0;

                                    return (
                                        <div key={index} className={`p-4 rounded-lg ${info.bgColor}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium">{info.label}</span>
                                                <div className="text-right">
                                                    <span className="font-bold">{formatNumber(item.count)}</span>
                                                    <span className="text-sm text-gray-600 ml-2">
                                                        ({percentage.toFixed(1)}%)
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="w-full bg-white rounded-full h-3 mb-2">
                                                <div
                                                    className={`h-3 rounded-full ${info.color} transition-all duration-500`}
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-sm text-gray-700">
                                                🎂 Tuổi trung bình: <span className="font-medium">{Math.round(item.avg_age || 0)} tuổi</span>
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Xu hướng lịch hẹn */}
                        <div>
                            <h4 className="font-medium mb-4">📈 Xu hướng lịch hẹn</h4>
                            <div className="space-y-3">
                                {analyticsData.appointmentTrends.slice(0, 7).map((trend, index) => {
                                    const completionRate = trend.total_appointments > 0
                                        ? (trend.completed_appointments / trend.total_appointments * 100)
                                        : 0;

                                    return (
                                        <div key={index} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium">
                                                    📅 {new Date(trend.date).toLocaleDateString('vi-VN')}
                                                </span>
                                                <span className="text-sm text-gray-600">
                                                    {trend.total_appointments} lịch hẹn
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs">
                                                <div className="flex items-center gap-1">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                    <span>Hoàn thành: {trend.completed_appointments}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                                    <span>Hủy: {trend.cancelled_appointments}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                    <span>Tỷ lệ: {completionRate.toFixed(1)}%</span>
                                                </div>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                                <div
                                                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${completionRate}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Doctors Tab Component
function DoctorsTab({ analyticsData }: { analyticsData: AnalyticsData }) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('vi-VN').format(num);
    };

    return (
        <div className="space-y-6">
            {/* Top Performing Doctors */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-yellow-600" />
                        🏆 Bác sĩ xuất sắc nhất
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {analyticsData.doctorPerformance.slice(0, 10).map((doctor, index) => {
                            const completionRate = doctor.total_appointments > 0
                                ? (doctor.completed_appointments / doctor.total_appointments * 100)
                                : 0;

                            return (
                                <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                                                <span className="text-lg font-bold text-blue-600">
                                                    {index + 1}
                                                </span>
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900">
                                                    👨‍⚕️ {doctor.full_name || doctor.doctor_id}
                                                </h4>
                                                <p className="text-sm text-gray-600">
                                                    🏥 {doctor.specialty || 'Chưa xác định'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-green-600">
                                                {formatCurrency(doctor.total_revenue)}
                                            </p>
                                            <div className="flex items-center gap-1 mt-1">
                                                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                                <span className="text-xs text-gray-600">
                                                    {doctor.avg_rating?.toFixed(1) || '0.0'} ({doctor.total_reviews} đánh giá)
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 mb-3">
                                        <div className="text-center p-2 bg-blue-50 rounded">
                                            <p className="text-xs text-blue-600 mb-1">📅 Tổng lịch hẹn</p>
                                            <p className="font-bold text-blue-800">{doctor.total_appointments}</p>
                                        </div>
                                        <div className="text-center p-2 bg-green-50 rounded">
                                            <p className="text-xs text-green-600 mb-1">✅ Hoàn thành</p>
                                            <p className="font-bold text-green-800">{doctor.completed_appointments}</p>
                                        </div>
                                        <div className="text-center p-2 bg-purple-50 rounded">
                                            <p className="text-xs text-purple-600 mb-1">📊 Tỷ lệ</p>
                                            <p className="font-bold text-purple-800">{completionRate.toFixed(1)}%</p>
                                        </div>
                                    </div>

                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${completionRate}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Departments Tab Component
function DepartmentsTab({ analyticsData }: { analyticsData: AnalyticsData }) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('vi-VN').format(num);
    };

    const totalDepartmentRevenue = analyticsData.departmentAnalytics.reduce((sum, dept) => sum + dept.total_revenue, 0);
    const totalDepartmentAppointments = analyticsData.departmentAnalytics.reduce((sum, dept) => sum + dept.total_appointments, 0);

    return (
        <div className="space-y-6">
            {/* Department Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="p-6 text-center">
                        <Building2 className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                        <p className="text-sm text-blue-700 mb-1">🏢 Tổng khoa phòng</p>
                        <p className="text-2xl font-bold text-blue-800">{analyticsData.departmentAnalytics.length}</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                    <CardContent className="p-6 text-center">
                        <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
                        <p className="text-sm text-green-700 mb-1">💰 Tổng doanh thu</p>
                        <p className="text-2xl font-bold text-green-800">{formatCurrency(totalDepartmentRevenue)}</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                    <CardContent className="p-6 text-center">
                        <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                        <p className="text-sm text-purple-700 mb-1">📅 Tổng lịch hẹn</p>
                        <p className="text-2xl font-bold text-purple-800">{formatNumber(totalDepartmentAppointments)}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Department Performance */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        🏢 Hiệu suất theo khoa phòng
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {analyticsData.departmentAnalytics.map((department, index) => {
                            const revenuePercentage = totalDepartmentRevenue > 0
                                ? (department.total_revenue / totalDepartmentRevenue * 100)
                                : 0;
                            const appointmentPercentage = totalDepartmentAppointments > 0
                                ? (department.total_appointments / totalDepartmentAppointments * 100)
                                : 0;
                            const avgRevenuePerAppointment = department.total_appointments > 0
                                ? department.total_revenue / department.total_appointments
                                : 0;

                            return (
                                <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h4 className="font-medium text-gray-900">
                                                🏥 {department.department_name || `Khoa ${index + 1}`}
                                            </h4>
                                            <div className="flex items-center gap-1 mt-1">
                                                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                                <span className="text-xs text-gray-600">
                                                    Đánh giá: {department.avg_rating?.toFixed(1) || '0.0'}/5.0
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-green-600">
                                                {formatCurrency(department.total_revenue)}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {revenuePercentage.toFixed(1)}% tổng doanh thu
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 mb-3">
                                        <div className="text-center p-2 bg-blue-50 rounded">
                                            <p className="text-xs text-blue-600 mb-1">📅 Lịch hẹn</p>
                                            <p className="font-bold text-blue-800">{formatNumber(department.total_appointments)}</p>
                                            <p className="text-xs text-gray-500">{appointmentPercentage.toFixed(1)}%</p>
                                        </div>
                                        <div className="text-center p-2 bg-green-50 rounded">
                                            <p className="text-xs text-green-600 mb-1">💰 Doanh thu</p>
                                            <p className="font-bold text-green-800">{formatCurrency(department.total_revenue)}</p>
                                        </div>
                                        <div className="text-center p-2 bg-purple-50 rounded">
                                            <p className="text-xs text-purple-600 mb-1">📊 TB/lịch hẹn</p>
                                            <p className="font-bold text-purple-800">{formatCurrency(avgRevenuePerAppointment)}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span>Doanh thu</span>
                                            <span>{revenuePercentage.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${revenuePercentage}%` }}
                                            ></div>
                                        </div>

                                        <div className="flex items-center justify-between text-xs">
                                            <span>Lịch hẹn</span>
                                            <span>{appointmentPercentage.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${appointmentPercentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
